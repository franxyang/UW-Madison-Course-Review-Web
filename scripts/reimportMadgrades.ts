/**
 * Clean re-import of Madgrades grade distributions
 * 
 * Fixes data issues from the original backfill:
 * 1. Original had teachings.csv columns REVERSED (section_uuid, instructor_id)
 *    → This caused instructor misassignment + orphaned NULL-instructor records
 * 2. Fix scripts only partially repaired the data, leaving duplicates
 * 3. Some course×term combos have BOTH NULL and instructor records with different grade counts
 * 
 * This script:
 * 1. Reads CSVs with CORRECT column order (instructor_id, section_uuid)
 * 2. Builds clean per-section grade data with proper instructor linkage
 * 3. Aggregates to courseCode × term × instructor
 * 4. DELETES all existing GradeDistribution records
 * 5. Inserts clean, deduplicated records
 * 6. Updates course avgGPA
 * 
 * Safety:
 * - Dry-run by default (pass --commit to write)
 * - Shows full summary before committing
 * - Backs up record counts before delete
 * 
 * Usage:
 *   npx tsx scripts/reimportMadgrades.ts           # dry run
 *   npx tsx scripts/reimportMadgrades.ts --commit   # delete + reimport
 */

import { readFileSync } from 'fs'
import { prisma } from '../lib/prisma'

const CSV_DIR = '/tmp/madgrades-csv'
const COMMIT = process.argv.includes('--commit')

// ─── CSV Parsing ─────────────────────────────────────────────

function parseCSVLine(line: string): string[] {
  const fields: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { inQuotes = !inQuotes }
    else if (ch === ',' && !inQuotes) { fields.push(current); current = '' }
    else { current += ch }
  }
  fields.push(current)
  return fields
}

function loadCSV(filename: string): string[][] {
  return readFileSync(`${CSV_DIR}/${filename}`, 'utf-8')
    .trim().split('\n').map(parseCSVLine)
}

// ─── Term code → "YYYY-Season" ──────────────────────────────

// Term code mapping verified against https://api.madgrades.com/v1/terms
// e.g. 1254 = "Spring 2025", 1252 = "Fall 2024", 1244 = "Spring 2024"
function termCodeToString(code: number): string {
  const baseYear = Math.floor(code / 10) + 1900
  const semesterDigit = code % 10
  if (semesterDigit === 2) return `${baseYear - 1}-Fall`
  if (semesterDigit === 4) return `${baseYear}-Spring`
  if (semesterDigit === 6) return `${baseYear}-Summer`
  return `${baseYear}-Unknown`
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log(`\n🔄 Madgrades Clean Re-import ${COMMIT ? '(COMMIT MODE)' : '(DRY RUN)'}\n`)

  // 1. Load all CSVs
  console.log('📂 Loading CSV files...')
  const coursesCSV = loadCSV('courses.csv')
  const offeringsCSV = loadCSV('course_offerings.csv')
  const gradeDistsCSV = loadCSV('grade_distributions.csv')
  const instructorsCSV = loadCSV('instructors.csv')
  const sectionsCSV = loadCSV('sections.csv')
  const subjectsCSV = loadCSV('subjects.csv')
  const subjectMembershipsCSV = loadCSV('subject_memberships.csv')
  // CORRECT column order: instructor_id, section_uuid
  const teachingsCSV = loadCSV('teachings.csv')

  console.log(`   grade_distributions: ${gradeDistsCSV.length}`)
  console.log(`   teachings: ${teachingsCSV.length} (columns: instructor_id, section_uuid)`)

  // 2. Build in-memory indexes
  console.log('\n🔗 Building indexes...')

  // Subject code → abbreviation
  const subjectCodeToAbbr = new Map<string, string>()
  for (const [code, , abbr] of subjectsCSV) {
    subjectCodeToAbbr.set(code, abbr)
  }

  // Offering uuid → subject abbreviation
  const offeringToSubject = new Map<string, string>()
  for (const [subjectCode, offeringUuid] of subjectMembershipsCSV) {
    const abbr = subjectCodeToAbbr.get(subjectCode)
    if (abbr) offeringToSubject.set(offeringUuid, abbr)
  }

  // Course uuid → number
  const courseNumMap = new Map<string, number>()
  for (const [uuid, , number] of coursesCSV) {
    courseNumMap.set(uuid, parseInt(number))
  }

  // Offering uuid → { courseUuid, termCode }
  const offeringMap = new Map<string, { courseUuid: string; termCode: number }>()
  for (const [uuid, courseUuid, termCode] of offeringsCSV) {
    offeringMap.set(uuid, { courseUuid, termCode: parseInt(termCode) })
  }

  // offering:sectionNumber → section_uuid
  const offeringSectionToUuid = new Map<string, string>()
  for (const [uuid, offeringUuid, , number] of sectionsCSV) {
    offeringSectionToUuid.set(`${offeringUuid}:${number}`, uuid)
  }

  // CORRECT: section_uuid → instructor IDs (teachings: instructor_id, section_uuid)
  const sectionToInstructors = new Map<string, Set<string>>()
  for (const [instructorId, sectionUuid] of teachingsCSV) {
    if (!sectionToInstructors.has(sectionUuid)) {
      sectionToInstructors.set(sectionUuid, new Set())
    }
    sectionToInstructors.get(sectionUuid)!.add(instructorId)
  }

  // Instructor id → name
  const instructorNameMap = new Map<string, string>()
  for (const [id, name] of instructorsCSV) {
    instructorNameMap.set(id, name)
  }

  // 3. Build aggregated grade distributions
  console.log('\n📊 Aggregating grade distributions from CSV...')

  interface GradeAgg {
    aCount: number; abCount: number; bCount: number; bcCount: number
    cCount: number; dCount: number; fCount: number; totalGraded: number
  }

  // Key: courseCode|term|instructorName (or courseCode|term|__NONE__)
  const aggregated = new Map<string, GradeAgg>()

  let processed = 0
  let skippedNoSubject = 0
  let skippedNoOffering = 0
  let skippedNoCourse = 0
  let noInstructorCount = 0

  for (const row of gradeDistsCSV) {
    const offeringUuid = row[0]
    const sectionNumber = parseInt(row[1])
    // row[2] = gpa (calculated by madgrades, we'll recalculate)
    const aCount = parseInt(row[3]) || 0
    const abCount = parseInt(row[4]) || 0
    const bCount = parseInt(row[5]) || 0
    const bcCount = parseInt(row[6]) || 0
    const cCount = parseInt(row[7]) || 0
    const dCount = parseInt(row[8]) || 0
    const fCount = parseInt(row[9]) || 0
    const total = aCount + abCount + bCount + bcCount + cCount + dCount + fCount

    if (total === 0) continue

    const offering = offeringMap.get(offeringUuid)
    if (!offering) { skippedNoOffering++; continue }

    const subject = offeringToSubject.get(offeringUuid)
    if (!subject) { skippedNoSubject++; continue }

    const courseNumber = courseNumMap.get(offering.courseUuid)
    if (courseNumber === undefined) { skippedNoCourse++; continue }

    const courseCode = `${subject} ${courseNumber}`
    const term = termCodeToString(offering.termCode)

    // Find instructor for this section
    const sectionKey = `${offeringUuid}:${sectionNumber}`
    const sectionUuid = offeringSectionToUuid.get(sectionKey)
    let instructorName = '__NONE__'

    if (sectionUuid) {
      const instrIds = sectionToInstructors.get(sectionUuid)
      if (instrIds && instrIds.size > 0) {
        const firstId = [...instrIds][0]
        instructorName = instructorNameMap.get(firstId) || '__NONE__'
      }
    }

    if (instructorName === '__NONE__') noInstructorCount++

    // Aggregate
    const aggKey = `${courseCode}|${term}|${instructorName}`
    const existing = aggregated.get(aggKey) || {
      aCount: 0, abCount: 0, bCount: 0, bcCount: 0,
      cCount: 0, dCount: 0, fCount: 0, totalGraded: 0
    }
    existing.aCount += aCount
    existing.abCount += abCount
    existing.bCount += bCount
    existing.bcCount += bcCount
    existing.cCount += cCount
    existing.dCount += dCount
    existing.fCount += fCount
    existing.totalGraded += total
    aggregated.set(aggKey, existing)
    processed++
  }

  console.log(`   Processed: ${processed} section-level records`)
  console.log(`   Skipped (no subject): ${skippedNoSubject}`)
  console.log(`   Skipped (no offering): ${skippedNoOffering}`)
  console.log(`   Skipped (no course): ${skippedNoCourse}`)
  console.log(`   Sections without instructor: ${noInstructorCount}`)
  console.log(`   Aggregated into: ${aggregated.size} records`)

  // Count records with vs without instructor
  let withInstructor = 0
  let withoutInstructor = 0
  for (const [key] of aggregated) {
    if (key.endsWith('|__NONE__')) withoutInstructor++
    else withInstructor++
  }
  console.log(`   With instructor: ${withInstructor}`)
  console.log(`   Without instructor: ${withoutInstructor}`)

  // 4. Load DB data needed for insertion
  console.log('\n📊 Loading DB data...')
  const existingCourses = await prisma.course.findMany({
    select: { id: true, code: true }
  })
  const courseIdMap = new Map(existingCourses.map(c => [c.code, c.id]))
  console.log(`   Courses in DB: ${courseIdMap.size}`)

  const existingInstructors = await prisma.instructor.findMany({
    select: { id: true, name: true }
  })
  const instructorIdMap = new Map(existingInstructors.map(i => [i.name, i.id]))
  console.log(`   Instructors in DB: ${instructorIdMap.size}`)

  const currentGDCount = await prisma.gradeDistribution.count()
  console.log(`   Current GD records: ${currentGDCount}`)

  // 4b. Create missing instructors
  console.log('\n👤 Checking for missing instructors...')
  const missingInstructors = new Set<string>()
  for (const [aggKey] of aggregated) {
    const parts = aggKey.split('|')
    const instructorName = parts.slice(2).join('|')
    if (instructorName !== '__NONE__' && !instructorIdMap.has(instructorName)) {
      missingInstructors.add(instructorName)
    }
  }
  console.log(`   Missing instructors: ${missingInstructors.size}`)

  if (COMMIT && missingInstructors.size > 0) {
    const instrData = [...missingInstructors].map(name => ({ name }))
    await prisma.instructor.createMany({ data: instrData, skipDuplicates: true })
    // Reload
    const allInstructors = await prisma.instructor.findMany({ select: { id: true, name: true } })
    instructorIdMap.clear()
    for (const i of allInstructors) instructorIdMap.set(i.name, i.id)
    console.log(`   Created ${missingInstructors.size} new instructors`)
  } else if (missingInstructors.size > 0) {
    console.log(`   (will be created on --commit)`)
    // Temporarily add placeholder IDs for counting
    for (const name of missingInstructors) instructorIdMap.set(name, '__PLACEHOLDER__')
  }

  // 5. Prepare insert records
  console.log('\n🔧 Preparing insert records...')
  const insertRecords: {
    courseId: string
    term: string
    instructorId: string | null
    aCount: number; abCount: number; bCount: number; bcCount: number
    cCount: number; dCount: number; fCount: number
    totalGraded: number; avgGPA: number
  }[] = []

  let skippedNoCourseInDB = 0
  let skippedNoInstructorInDB = 0

  for (const [aggKey, grades] of aggregated) {
    const parts = aggKey.split('|')
    const courseCode = parts[0]
    const term = parts[1]
    const instructorName = parts.slice(2).join('|') // In case instructor name has |

    const courseId = courseIdMap.get(courseCode)
    if (!courseId) { skippedNoCourseInDB++; continue }

    let instructorId: string | null = null
    if (instructorName !== '__NONE__') {
      instructorId = instructorIdMap.get(instructorName) || null
      if (!instructorId) { skippedNoInstructorInDB++; continue }
    }

    const total = grades.totalGraded
    const gpa = total > 0
      ? (grades.aCount * 4.0 + grades.abCount * 3.5 + grades.bCount * 3.0 +
         grades.bcCount * 2.5 + grades.cCount * 2.0 + grades.dCount * 1.0) / total
      : 0

    insertRecords.push({
      courseId,
      term,
      instructorId,
      aCount: grades.aCount,
      abCount: grades.abCount,
      bCount: grades.bCount,
      bcCount: grades.bcCount,
      cCount: grades.cCount,
      dCount: grades.dCount,
      fCount: grades.fCount,
      totalGraded: total,
      avgGPA: Math.round(gpa * 100) / 100,
    })
  }

  console.log(`   Records to insert: ${insertRecords.length}`)
  console.log(`   Skipped (course not in DB): ${skippedNoCourseInDB}`)
  console.log(`   Skipped (instructor not in DB): ${skippedNoInstructorInDB}`)

  // Verify: check MATH 522 specifically
  console.log('\n🔍 Verification - MATH 522 2025-Spring / 2026-Spring:')
  // Build reverse maps for verification
  const idToCourseCode = new Map<string, string>()
  for (const [code, id] of courseIdMap) idToCourseCode.set(id, code)
  const idToInstructorName = new Map<string, string>()
  for (const [name, id] of instructorIdMap) idToInstructorName.set(id, name)
  
  const math522Id = courseIdMap.get('MATH 522')
  if (math522Id) {
    const math522 = insertRecords.filter(r => 
      r.courseId === math522Id && (r.term === '2025-Spring' || r.term === '2026-Spring')
    )
    for (const r of math522) {
      const code = idToCourseCode.get(r.courseId) || '???'
      const instrName = r.instructorId ? (idToInstructorName.get(r.instructorId) || '???') : 'NULL'
      console.log(`   ${code} ${r.term} | ${instrName} | A=${r.aCount} AB=${r.abCount} B=${r.bCount} BC=${r.bcCount} C=${r.cCount} D=${r.dCount} F=${r.fCount} | total=${r.totalGraded} GPA=${r.avgGPA}`)
    }
    if (math522.length === 0) console.log('   (no records found)')
  } else {
    console.log('   MATH 522 not found in DB')
  }

  // 6. Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 SUMMARY')
  console.log(`   Current records:    ${currentGDCount} (will be DELETED)`)
  console.log(`   New records:        ${insertRecords.length} (will be INSERTED)`)
  console.log(`   Net change:         ${insertRecords.length - currentGDCount > 0 ? '+' : ''}${insertRecords.length - currentGDCount}`)
  console.log('='.repeat(60))

  if (!COMMIT) {
    console.log(`\n⚠️  DRY RUN — no changes made. Run with --commit to write.`)
    await prisma.$disconnect()
    return
  }

  // ─── COMMIT MODE ───────────────────────────────────────────

  console.log('\n💾 COMMITTING CHANGES...\n')

  // 6a. Delete all existing grade distributions
  console.log('🗑️  Deleting all existing grade distribution records...')
  const deleteResult = await prisma.gradeDistribution.deleteMany({})
  console.log(`   Deleted: ${deleteResult.count}`)

  // 6b. Insert new records in batches
  console.log('\n📥 Inserting clean records...')
  const BATCH_SIZE = 500
  let totalInserted = 0

  for (let i = 0; i < insertRecords.length; i += BATCH_SIZE) {
    const batch = insertRecords.slice(i, i + BATCH_SIZE)
    const result = await prisma.gradeDistribution.createMany({
      data: batch,
      skipDuplicates: true,
    })
    totalInserted += result.count
    if ((i + BATCH_SIZE) % 5000 < BATCH_SIZE || i + BATCH_SIZE >= insertRecords.length) {
      console.log(`   Inserted ${Math.min(i + BATCH_SIZE, insertRecords.length)}/${insertRecords.length} (created: ${totalInserted})`)
    }
  }

  console.log(`\n   Total inserted: ${totalInserted}`)
  if (totalInserted < insertRecords.length) {
    console.log(`   Skipped (duplicates): ${insertRecords.length - totalInserted}`)
  }

  // 6c. Update course avgGPA
  console.log('\n📈 Updating course avgGPA...')
  const courses = await prisma.course.findMany({
    where: { gradeDistributions: { some: {} } },
    include: {
      gradeDistributions: {
        select: { avgGPA: true, totalGraded: true }
      }
    }
  })

  let gpaUpdated = 0
  for (const course of courses) {
    const totalWeighted = course.gradeDistributions.reduce(
      (sum, gd) => sum + gd.avgGPA * gd.totalGraded, 0
    )
    const totalStudents = course.gradeDistributions.reduce(
      (sum, gd) => sum + gd.totalGraded, 0
    )
    if (totalStudents > 0) {
      const avgGPA = Math.round((totalWeighted / totalStudents) * 100) / 100
      await prisma.course.update({
        where: { id: course.id },
        data: { avgGPA }
      })
      gpaUpdated++
    }
  }
  console.log(`   Updated avgGPA for ${gpaUpdated} courses`)

  // Also clear avgGPA for courses that no longer have grade data
  const clearedResult = await prisma.course.updateMany({
    where: {
      avgGPA: { not: null },
      gradeDistributions: { none: {} }
    },
    data: { avgGPA: null }
  })
  if (clearedResult.count > 0) {
    console.log(`   Cleared avgGPA for ${clearedResult.count} courses (no grade data)`)
  }

  console.log('\n✅ Clean re-import complete!')
  await prisma.$disconnect()
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
