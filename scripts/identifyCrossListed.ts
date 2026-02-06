/**
 * Identify and group cross-listed courses.
 * 
 * Cross-listed courses have:
 * 1. Same name
 * 2. Same description (or very similar)
 * 3. Different course codes (e.g., CS 514 / MATH 514)
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Common course names that are NOT cross-listed (generic names)
const EXCLUDED_NAMES = [
  'Directed Study',
  'Senior Honors Thesis',
  'Senior Thesis',
  'Independent Study',
  'Special Topics',
  'Research',
  'Research and Thesis',
  'Independent Reading',
  'Advanced Independent Study',
  'Special Problems',
  'Contemporary Topics',
  'Cooperative Education Program',
  'Graduate Cooperative Education Program',
  'Coordinative Internship/Cooperative Education',
  'Independent Work',
  'Seminar',
  'Master\'s Thesis',
  'Master\'s Research',
  'Dissertation',
  'Dissertator Research',
  'Pre-Dissertator Research',
  'Internship',
  'Practicum',
  'Externship',
  'Field Work',
  'Reading Course',
  'Honors in Research',
]

async function main() {
  console.log('🔍 Identifying cross-listed courses...\n')

  // Find courses with same name (potential cross-listed)
  const duplicateNames = await prisma.$queryRaw<Array<{ name: string; count: bigint }>>`
    SELECT name, COUNT(*) as count
    FROM "Course"
    WHERE name NOT IN (${EXCLUDED_NAMES.join("', '")})
    GROUP BY name
    HAVING COUNT(*) > 1 AND COUNT(*) <= 5
    ORDER BY count DESC
  `

  console.log(`Found ${duplicateNames.length} potential cross-listed groups\n`)

  let groupsCreated = 0
  let coursesUpdated = 0

  for (const { name, count } of duplicateNames) {
    // Get all courses with this name
    const courses = await prisma.course.findMany({
      where: { name },
      select: { 
        id: true, 
        code: true, 
        name: true, 
        description: true,
        crossListGroupId: true 
      },
      orderBy: { code: 'asc' }
    })

    // Skip if already grouped
    if (courses.every(c => c.crossListGroupId)) {
      continue
    }

    // Verify they have similar descriptions (first 200 chars)
    const firstDesc = courses[0].description?.slice(0, 200).toLowerCase() || ''
    const allSimilar = courses.every(c => {
      const desc = c.description?.slice(0, 200).toLowerCase() || ''
      return desc === firstDesc || !firstDesc || !desc
    })

    if (!allSimilar) {
      console.log(`⚠️  Skipping "${name}" - descriptions differ`)
      continue
    }

    // Create cross-list group
    const displayCode = courses.map(c => c.code).join(' / ')
    
    const group = await prisma.crossListGroup.create({
      data: {
        displayCode,
        courses: {
          connect: courses.map(c => ({ id: c.id }))
        }
      }
    })

    console.log(`✅ Created group: ${displayCode}`)
    groupsCreated++
    coursesUpdated += courses.length
  }

  console.log(`\n📊 Summary:`)
  console.log(`   Groups created: ${groupsCreated}`)
  console.log(`   Courses updated: ${coursesUpdated}`)

  // Show some examples
  const examples = await prisma.crossListGroup.findMany({
    take: 10,
    include: {
      courses: {
        select: { code: true, name: true, avgGPA: true }
      }
    }
  })

  console.log(`\n📝 Sample cross-listed groups:`)
  for (const group of examples) {
    console.log(`\n   ${group.displayCode}`)
    for (const course of group.courses) {
      console.log(`      - ${course.code} (GPA: ${course.avgGPA || 'N/A'})`)
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
