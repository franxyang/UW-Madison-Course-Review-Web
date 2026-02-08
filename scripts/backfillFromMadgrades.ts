/**
 * Backfill courses + grade distributions from Madgrades extracted CSVs
 * 
 * Data source: madgrades-extractor output (from UW registrar PDFs)
 * CSV location: /tmp/madgrades-csv/
 * 
 * What this does:
 * 1. Reads all Madgrades CSV files
 * 2. Builds course → subject → grade_distribution → instructor relationships
 * 3. Inserts MISSING courses (skipDuplicates)
 * 4. Inserts MISSING grade distributions (skipDuplicates)
 * 5. Inserts MISSING instructors (skipDuplicates)
 * 
 * Safety:
 * - Only INSERTS, never UPDATES existing records
 * - Idempotent: safe to run multiple times
 * - Dry-run by default (pass --commit to write)
 * 
 * Usage:
 *   npx tsx scripts/backfillFromMadgrades.ts           # dry run
 *   npx tsx scripts/backfillFromMadgrades.ts --commit   # write to DB
 */

import { readFileSync } from 'fs'
import { prisma } from '../lib/prisma'

const CSV_DIR = '/tmp/madgrades-csv'
const COMMIT = process.argv.includes('--commit')

// ─── CSV Parsing (no headers) ────────────────────────────────

function parseCSV(filename: string): string[][] {
  const content = readFileSync(`${CSV_DIR}/${filename}`, 'utf-8')
  return content.trim().split('\n').map(line => {
    // Simple CSV parser that handles quoted fields
    const fields: string[] = []
    let current = ''
    let inQuotes = false
    for (let i = 0; i < line.length; i++) {
      const ch = line[i]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        fields.push(current)
        current = ''
      } else {
        current += ch
      }
    }
    fields.push(current)
    return fields
  })
}

// ─── Term code → "YYYY-Season" ──────────────────────────────

function termCodeToString(code: number): string {
  const baseYear = Math.floor(code / 10) + 1900
  const semesterDigit = code % 10
  if (semesterDigit === 2) return `${baseYear}-Fall`
  if (semesterDigit === 4) return `${baseYear + 1}-Spring`
  if (semesterDigit === 6) return `${baseYear + 1}-Summer`
  return `${baseYear}-Unknown`
}

// ─── Infer level from course number ──────────────────────────

function inferLevel(courseNumber: number): string {
  if (courseNumber < 300) return 'Elementary'
  if (courseNumber < 700) return 'Intermediate'
  return 'Advanced'
}

// ─── Title case ──────────────────────────────────────────────

function toTitleCase(str: string): string {
  const smallWords = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'vs', 'yet', 'with'])
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word, i) => {
      if (i === 0 || !smallWords.has(word)) {
        return word.charAt(0).toUpperCase() + word.slice(1)
      }
      return word
    })
    .join(' ')
}

// ─── Main ────────────────────────────────────────────────────

async function main() {
  console.log(`\n🎓 Madgrades Backfill ${COMMIT ? '(COMMIT MODE)' : '(DRY RUN)'}\n`)

  // 1. Load all CSVs
  console.log('📂 Loading CSV files...')
  const coursesCSV = parseCSV('courses.csv')                     // uuid, name, number
  const offeringsCSV = parseCSV('course_offerings.csv')          // uuid, course_uuid, term_code, name
  const gradeDistsCSV = parseCSV('grade_distributions.csv')      // offering_uuid, section_num, gpa, a, ab, b, bc, c, d, f, s, u, cr, n, p, i, nw, nr, other
  const instructorsCSV = parseCSV('instructors.csv')             // id, name
  const teachingsCSV = parseCSV('teachings.csv')                 // section_uuid, instructor_id
  const sectionsCSV = parseCSV('sections.csv')                   // uuid, course_offering_uuid, section_type, number, room_uuid, schedule_uuid
  const subjectsCSV = parseCSV('subjects.csv')                   // code, name, abbreviation
  const subjectMembershipsCSV = parseCSV('subject_memberships.csv') // subject_code, offering_uuid

  console.log(`   courses: ${coursesCSV.length}`)
  console.log(`   course_offerings: ${offeringsCSV.length}`)
  console.log(`   grade_distributions: ${gradeDistsCSV.length}`)
  console.log(`   instructors: ${instructorsCSV.length}`)
  console.log(`   sections: ${sectionsCSV.length}`)
  console.log(`   teachings: ${teachingsCSV.length}`)
  console.log(`   subjects: ${subjectsCSV.length}`)

  // 2. Build in-memory indexes
  console.log('\n🔗 Building indexes...')

  // Subject code → abbreviation (e.g. "296" → "ECON")
  const subjectCodeToAbbr = new Map<string, string>()
  for (const [code, _name, abbr] of subjectsCSV) {
    subjectCodeToAbbr.set(code, abbr)
  }

  // Course offering uuid → subject abbreviation
  const offeringToSubject = new Map<string, string>()
  for (const [subjectCode, offeringUuid] of subjectMembershipsCSV) {
    const abbr = subjectCodeToAbbr.get(subjectCode)
    if (abbr) offeringToSubject.set(offeringUuid, abbr)
  }

  // Course uuid → { name, number }
  const courseMap = new Map<string, { name: string; number: number }>()
  for (const [uuid, name, number] of coursesCSV) {
    courseMap.set(uuid, { name, number: parseInt(number) })
  }

  // Course offering uuid → { courseUuid, termCode, name }
  const offeringMap = new Map<string, { courseUuid: string; termCode: number; name: string }>()
  for (const [uuid, courseUuid, termCode, name] of offeringsCSV) {
    offeringMap.set(uuid, { courseUuid, termCode: parseInt(termCode), name })
  }

  // Section uuid → { offeringUuid, number }
  const sectionMap = new Map<string, { offeringUuid: string; number: number }>()
  for (const [uuid, offeringUuid, _type, number] of sectionsCSV) {
    sectionMap.set(uuid, { offeringUuid, number: parseInt(number) })
  }

  // Section uuid → instructor IDs
  const sectionToInstructors = new Map<string, Set<string>>()
  for (const [sectionUuid, instructorId] of teachingsCSV) {
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

  // 3. Build aggregated grade distributions: course_code × term → { instructor → grades }
  console.log('\n📊 Aggregating grade distributions...')

  interface GradeData {
    aCount: number; abCount: number; bCount: number; bcCount: number
    cCount: number; dCount: number; fCount: number
    totalGraded: number
  }

  // offering_uuid + section_number → section_uuid (for instructor lookup)
  const offeringSectionToUuid = new Map<string, string>()
  for (const [uuid, offeringUuid, _type, number] of sectionsCSV) {
    offeringSectionToUuid.set(`${offeringUuid}:${number}`, uuid)
  }

  // Aggregate: courseCode × term × instructorName → grade totals
  const aggregated = new Map<string, GradeData>()

  // Also build: courseCode → { name, number, subject }
  interface CourseInfo {
    code: string
    name: string
    number: number
    subject: string
  }
  const courseInfoMap = new Map<string, CourseInfo>()

  let skippedNoSubject = 0
  let processedGDs = 0

  for (const row of gradeDistsCSV) {
    const offeringUuid = row[0]
    const sectionNumber = parseInt(row[1])
    const aCount = parseInt(row[3]) || 0
    const abCount = parseInt(row[4]) || 0
    const bCount = parseInt(row[5]) || 0
    const bcCount = parseInt(row[6]) || 0
    const cCount = parseInt(row[7]) || 0
    const dCount = parseInt(row[8]) || 0
    const fCount = parseInt(row[9]) || 0

    const offering = offeringMap.get(offeringUuid)
    if (!offering) continue

    const subject = offeringToSubject.get(offeringUuid)
    if (!subject) { skippedNoSubject++; continue }

    const course = courseMap.get(offering.courseUuid)
    if (!course) continue

    const courseCode = `${subject} ${course.number}`
    const term = termCodeToString(offering.termCode)

    // Store course info
    if (!courseInfoMap.has(courseCode)) {
      courseInfoMap.set(courseCode, {
        code: courseCode,
        name: offering.name || course.name,
        number: course.number,
        subject,
      })
    }

    // Find instructor for this section
    const sectionKey = `${offeringUuid}:${sectionNumber}`
    const sectionUuid = offeringSectionToUuid.get(sectionKey)
    let instructorName = '__NONE__'
    if (sectionUuid) {
      const instructorIds = sectionToInstructors.get(sectionUuid)
      if (instructorIds && instructorIds.size > 0) {
        // Take the first instructor (primary)
        const firstId = [...instructorIds][0]
        instructorName = instructorNameMap.get(firstId) || '__NONE__'
      }
    }

    // Aggregate key: courseCode|term|instructorName
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
    existing.totalGraded += aCount + abCount + bCount + bcCount + cCount + dCount + fCount
    aggregated.set(aggKey, existing)
    processedGDs++
  }

  console.log(`   Processed ${processedGDs} section-level grade records`)
  console.log(`   Aggregated into ${aggregated.size} course×term×instructor records`)
  console.log(`   Skipped (no subject): ${skippedNoSubject}`)
  console.log(`   Unique courses found: ${courseInfoMap.size}`)

  // 4. Load existing DB data
  console.log('\n📊 Loading existing DB data...')
  const existingCourses = await prisma.course.findMany({
    select: { id: true, code: true }
  })
  const existingCourseMap = new Map(existingCourses.map(c => [c.code, c.id]))
  console.log(`   Existing courses: ${existingCourseMap.size}`)

  const existingGDs = await prisma.gradeDistribution.findMany({
    select: { courseId: true, term: true, instructorId: true }
  })
  const existingGDKeys = new Set(
    existingGDs.map(gd => `${gd.courseId}|${gd.term}|${gd.instructorId || ''}`)
  )
  console.log(`   Existing grade distributions: ${existingGDKeys.size}`)

  const existingInstructors = await prisma.instructor.findMany({
    select: { id: true, name: true }
  })
  const existingInstructorByName = new Map(existingInstructors.map(i => [i.name, i.id]))
  console.log(`   Existing instructors: ${existingInstructorByName.size}`)

  // Load departments and schools for course creation
  const departments = await prisma.department.findMany({
    select: { id: true, code: true, schoolId: true }
  })
  const deptMap = new Map(departments.map(d => [d.code, { id: d.id, schoolId: d.schoolId }]))
  const defaultSchool = await prisma.school.findFirst({
    where: { name: { contains: 'Letters & Science' } }
  })
  const defaultSchoolId = defaultSchool?.id || ''

  // 5. Calculate diffs
  console.log('\n🔍 Calculating diffs...')

  // New courses
  const newCourses: CourseInfo[] = []
  for (const [code, info] of courseInfoMap) {
    if (!existingCourseMap.has(code)) {
      newCourses.push(info)
    }
  }
  console.log(`   New courses to add: ${newCourses.length}`)

  // New instructors
  const newInstructorNames = new Set<string>()
  for (const [aggKey] of aggregated) {
    const [, , instructorName] = aggKey.split('|')
    if (instructorName !== '__NONE__' && !existingInstructorByName.has(instructorName)) {
      newInstructorNames.add(instructorName)
    }
  }
  console.log(`   New instructors to add: ${newInstructorNames.size}`)

  // New grade distributions (calculated after inserting courses + instructors)
  let newGDCount = 0
  let existingGDCount = 0
  for (const [aggKey, grades] of aggregated) {
    const [courseCode, term, instructorName] = aggKey.split('|')
    const courseId = existingCourseMap.get(courseCode)
    if (!courseId) {
      // Will be a new course → always new GD
      newGDCount++
      continue
    }
    const instructorId = instructorName !== '__NONE__' ? (existingInstructorByName.get(instructorName) || 'NEW') : ''
    const gdKey = `${courseId}|${term}|${instructorId}`
    if (existingGDKeys.has(gdKey)) {
      existingGDCount++
    } else {
      newGDCount++
    }
  }
  console.log(`   New grade distributions to add: ${newGDCount}`)
  console.log(`   Existing grade distributions (skip): ${existingGDCount}`)

  // 6. Summary
  console.log('\n' + '='.repeat(60))
  console.log('📊 SUMMARY')
  console.log(`   New courses:              ${newCourses.length}`)
  console.log(`   New instructors:          ${newInstructorNames.size}`)
  console.log(`   New grade distributions:  ${newGDCount}`)
  console.log(`   Skipped (existing):       ${existingGDCount}`)
  console.log('='.repeat(60))

  if (!COMMIT) {
    // Show samples
    console.log('\n📋 Sample new courses (first 20):')
    for (const c of newCourses.slice(0, 20)) {
      console.log(`   ${c.code} — ${c.name}`)
    }
    if (newCourses.length > 20) console.log(`   ... and ${newCourses.length - 20} more`)

    console.log('\n📋 Sample new instructors (first 10):')
    for (const name of [...newInstructorNames].slice(0, 10)) {
      console.log(`   ${name}`)
    }

    console.log(`\n⚠️  DRY RUN — no changes made. Run with --commit to write.`)
    await prisma.$disconnect()
    return
  }

  // ─── COMMIT MODE ───────────────────────────────────────────

  console.log('\n💾 Writing to database (batch mode)...\n')

  const BATCH_SIZE = 500

  // 6a. Create new instructors (batch)
  console.log('👤 Creating new instructors...')
  if (newInstructorNames.size > 0) {
    const instrData = [...newInstructorNames].map(name => ({ name }))
    for (let i = 0; i < instrData.length; i += BATCH_SIZE) {
      const batch = instrData.slice(i, i + BATCH_SIZE)
      await prisma.instructor.createMany({ data: batch, skipDuplicates: true })
    }
    // Reload instructor map
    const allInstructors = await prisma.instructor.findMany({ select: { id: true, name: true } })
    for (const i of allInstructors) existingInstructorByName.set(i.name, i.id)
  }
  console.log(`   Done (${newInstructorNames.size} new)`)

  // 6b. Create new courses (batch — without department relation, add after)
  console.log('\n📚 Creating new courses...')
  const courseBatches: { code: string; name: string; description: string; credits: number; level: string; schoolId: string }[] = []
  const courseDeptLinks: { code: string; subject: string }[] = []

  for (const courseInfo of newCourses) {
    const dept = deptMap.get(courseInfo.subject)
    const schoolId = dept?.schoolId || defaultSchoolId
    courseBatches.push({
      code: courseInfo.code,
      name: toTitleCase(courseInfo.name),
      description: '',
      credits: 3,
      level: inferLevel(courseInfo.number),
      schoolId,
    })
    if (dept) {
      courseDeptLinks.push({ code: courseInfo.code, subject: courseInfo.subject })
    }
  }

  let coursesCreated = 0
  for (let i = 0; i < courseBatches.length; i += BATCH_SIZE) {
    const batch = courseBatches.slice(i, i + BATCH_SIZE)
    const result = await prisma.course.createMany({ data: batch, skipDuplicates: true })
    coursesCreated += result.count
    if ((i + BATCH_SIZE) % 2000 === 0 || i + BATCH_SIZE >= courseBatches.length) {
      console.log(`   Inserted ${Math.min(i + BATCH_SIZE, courseBatches.length)}/${courseBatches.length}...`)
    }
  }
  console.log(`   Created ${coursesCreated} courses`)

  // Reload course map to get new IDs
  console.log('   Reloading course map...')
  const allCourses = await prisma.course.findMany({ select: { id: true, code: true } })
  for (const c of allCourses) existingCourseMap.set(c.code, c.id)

  // Create department links for new courses
  console.log('   Creating department links...')
  const deptLinkData: { courseId: string; departmentId: string }[] = []
  for (const link of courseDeptLinks) {
    const courseId = existingCourseMap.get(link.code)
    const dept = deptMap.get(link.subject)
    if (courseId && dept) {
      deptLinkData.push({ courseId, departmentId: dept.id })
    }
  }
  if (deptLinkData.length > 0) {
    for (let i = 0; i < deptLinkData.length; i += BATCH_SIZE) {
      const batch = deptLinkData.slice(i, i + BATCH_SIZE)
      await prisma.courseDepartment.createMany({ data: batch, skipDuplicates: true })
    }
  }
  console.log(`   Linked ${deptLinkData.length} course-department relations`)

  // 6c. Create grade distributions (batch)
  console.log('\n📊 Creating grade distributions...')
  let gdsCreated = 0
  let gdsSkipped = 0
  let gdsErrors = 0

  const gdBatch: {
    courseId: string; term: string; instructorId: string | null
    aCount: number; abCount: number; bCount: number; bcCount: number
    cCount: number; dCount: number; fCount: number; totalGraded: number; avgGPA: number
  }[] = []

  for (const [aggKey, grades] of aggregated) {
    const [courseCode, term, instructorName] = aggKey.split('|')

    const courseId = existingCourseMap.get(courseCode)
    if (!courseId) { gdsErrors++; continue }

    let instructorId: string | null = null
    if (instructorName !== '__NONE__') {
      instructorId = existingInstructorByName.get(instructorName) || null
    }

    const total = grades.totalGraded
    if (total === 0) { gdsSkipped++; continue }

    const gpa = (
      grades.aCount * 4.0 +
      grades.abCount * 3.5 +
      grades.bCount * 3.0 +
      grades.bcCount * 2.5 +
      grades.cCount * 2.0 +
      grades.dCount * 1.0 +
      grades.fCount * 0.0
    ) / total

    gdBatch.push({
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

  console.log(`   Prepared ${gdBatch.length} grade distribution records`)
  console.log(`   Skipped (zero total): ${gdsSkipped}, Errors (no course): ${gdsErrors}`)

  for (let i = 0; i < gdBatch.length; i += BATCH_SIZE) {
    const batch = gdBatch.slice(i, i + BATCH_SIZE)
    const result = await prisma.gradeDistribution.createMany({ data: batch, skipDuplicates: true })
    gdsCreated += result.count
    if ((i + BATCH_SIZE) % 5000 < BATCH_SIZE) {
      console.log(`   Inserted ${Math.min(i + BATCH_SIZE, gdBatch.length)}/${gdBatch.length} (created: ${gdsCreated})...`)
    }
  }

  console.log(`\n   Total created: ${gdsCreated}`)
  console.log(`   Total skipped (duplicates): ${gdBatch.length - gdsCreated}`)

  // 7. Update avgGPA for courses that now have grade data
  console.log('\n📈 Updating course avgGPA...')
  let gpaUpdated = 0
  
  const coursesNeedingGPA = await prisma.course.findMany({
    where: {
      avgGPA: null,
      gradeDistributions: { some: {} }
    },
    include: {
      gradeDistributions: {
        select: { avgGPA: true, totalGraded: true }
      }
    }
  })

  for (const course of coursesNeedingGPA) {
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

  console.log('\n✅ Done!')
  await prisma.$disconnect()
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})
