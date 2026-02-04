import path from 'path'
import { prisma } from '../lib/prisma'
import { readCSV, chunk } from './utils/csvParser'
import {
  standardizeSubjectCode,
  inferCredits,
  inferLevel,
  mapDeptToSchool
} from './utils/courseMapper'

interface AEFISCourse {
  'Subject Code': string
  'Course Number': string
  'Name': string
  'Description': string
  'Dept Code': string
  'Dept Description': string
}

export async function seedCourses() {
  console.log('📚 Starting course import from AEFIS data...')

  // Path to the AEFIS courses CSV
  const csvPath = path.join(
    __dirname,
    '../madgrades-extractor-master/src/main/resources/aefis_courses.csv'
  )

  // Read the CSV file
  console.log('  📖 Reading AEFIS courses CSV...')
  const courses = readCSV<AEFISCourse>(csvPath)
  console.log(`  ✅ Found ${courses.length} courses in CSV`)

  // First ensure all schools exist
  const uniqueSchools = new Set<string>()
  for (const course of courses) {
    const schoolName = mapDeptToSchool(course['Dept Description'])
    uniqueSchools.add(schoolName)
  }

  console.log(`  🏫 Ensuring ${uniqueSchools.size} schools exist...`)
  for (const schoolName of uniqueSchools) {
    await prisma.school.upsert({
      where: { name: schoolName },
      update: {},
      create: { name: schoolName },
    })
  }

  // Get all schools for mapping
  const schools = await prisma.school.findMany()
  const schoolMap = new Map(schools.map(s => [s.name, s.id]))

  // Transform AEFIS courses to our schema
  console.log('  🔄 Transforming course data...')
  const transformedCourses = courses.map(course => {
    const subjectCode = standardizeSubjectCode(course['Subject Code'])
    const courseNumber = course['Course Number']
    const code = `${subjectCode} ${courseNumber}`.trim()
    const schoolName = mapDeptToSchool(course['Dept Description'])
    const schoolId = schoolMap.get(schoolName)!

    return {
      code,
      name: course['Name'] || 'Untitled Course',
      description: course['Description'] || 'No description available.',
      credits: inferCredits(courseNumber),
      level: inferLevel(courseNumber),
      schoolId,
      breadths: null,     // Will be populated later from guide.wisc.edu as JSON string
      genEds: null,        // Will be populated later from guide.wisc.edu as JSON string
      prerequisiteText: null,        // Will be populated later
      avgGPA: null,                  // Will be calculated from grade distributions
      avgRating: null,               // Will be calculated from reviews
      lastOffered: null,             // Will be populated from sections data
    }
  })

  // Batch insert courses
  console.log('  💾 Inserting courses into database...')
  const BATCH_SIZE = 100
  const batches = chunk(transformedCourses, BATCH_SIZE)

  let successCount = 0
  let errorCount = 0

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    console.log(`    Processing batch ${i + 1}/${batches.length} (${batch.length} courses)...`)

    try {
      // Insert individually using upsert to handle duplicates
      for (const course of batch) {
        try {
          await prisma.course.upsert({
            where: { code: course.code },
            update: {
              name: course.name,
              description: course.description,
              credits: course.credits,
              level: course.level,
              schoolId: course.schoolId,
            },
            create: course,
          })
          successCount++
        } catch (individualError) {
          console.error(`        ❌ Failed to insert course ${course.code}:`, individualError)
          errorCount++
        }
      }
      console.log(`      ✅ Processed batch ${i + 1}`)
    } catch (error) {
      console.error(`      ❌ Error in batch ${i + 1}:`, error)
      errorCount += batch.length
    }
  }

  // Final statistics
  const totalInDB = await prisma.course.count()
  console.log('\n📊 Import Statistics:')
  console.log(`  Total courses in CSV: ${courses.length}`)
  console.log(`  Successfully imported: ${successCount}`)
  console.log(`  Errors/skipped: ${errorCount}`)
  console.log(`  Total in database: ${totalInDB}`)

  // Show sample courses
  const samples = await prisma.course.findMany({
    take: 5,
    include: { school: true },
  })

  console.log('\n📝 Sample imported courses:')
  for (const sample of samples) {
    console.log(`  - ${sample.code}: ${sample.name}`)
    console.log(`    School: ${sample.school.name}`)
    console.log(`    Credits: ${sample.credits}, Level: ${sample.level}`)
  }

  return totalInDB
}

// Run if called directly
if (require.main === module) {
  seedCourses()
    .then((count) => {
      console.log(`\n✨ Course import completed! Total courses: ${count}`)
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Course import failed:', error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}