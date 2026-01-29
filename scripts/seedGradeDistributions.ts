import { prisma } from '../lib/prisma'

// Realistic grade distribution patterns for different course levels
const distributionPatterns = {
  elementary: [
    { a: 35, ab: 25, b: 20, bc: 10, c: 5, d: 3, f: 2 }, // Easy
    { a: 30, ab: 25, b: 25, bc: 10, c: 5, d: 3, f: 2 }, // Normal
    { a: 25, ab: 20, b: 25, bc: 15, c: 10, d: 3, f: 2 }, // Moderate
  ],
  intermediate: [
    { a: 25, ab: 25, b: 25, bc: 12, c: 8, d: 3, f: 2 }, // Normal
    { a: 20, ab: 20, b: 30, bc: 15, c: 10, d: 3, f: 2 }, // Moderate
    { a: 15, ab: 20, b: 30, bc: 20, c: 10, d: 3, f: 2 }, // Challenging
  ],
  advanced: [
    { a: 30, ab: 30, b: 25, bc: 8, c: 5, d: 1, f: 1 }, // Graduate-style
    { a: 20, ab: 25, b: 30, bc: 15, c: 7, d: 2, f: 1 }, // Normal
    { a: 15, ab: 20, b: 25, bc: 20, c: 15, d: 3, f: 2 }, // Challenging
  ]
}

const terms = [
  '2024-Fall',
  '2024-Spring',
  '2023-Fall',
  '2023-Spring',
  '2023-Summer',
  '2022-Fall',
  '2022-Spring'
]

function calculateGPA(distribution: any, total: number): number {
  const gradePoints: Record<string, number> = {
    a: 4.0,
    ab: 3.5,
    b: 3.0,
    bc: 2.5,
    c: 2.0,
    d: 1.0,
    f: 0.0
  }

  let totalPoints = 0
  let totalGraded = 0

  for (const [grade, count] of Object.entries(distribution)) {
    if (grade in gradePoints) {
      totalPoints += gradePoints[grade] * (count as number)
      totalGraded += count as number
    }
  }

  return totalGraded > 0 ? totalPoints / totalGraded : 0
}

async function seedGradeDistributions() {
  try {
    console.log('🎯 Starting grade distribution seed...')

    // Get all courses
    const courses = await prisma.course.findMany({
      select: {
        id: true,
        code: true,
        level: true
      }
    })

    console.log(`📚 Found ${courses.length} courses to process`)

    let created = 0
    const batchSize = 100

    for (let i = 0; i < courses.length; i += batchSize) {
      const batch = courses.slice(i, i + batchSize)
      const distributions = []

      for (const course of batch) {
        // Determine pattern based on course level
        const levelPatterns = course.level === 'Elementary'
          ? distributionPatterns.elementary
          : course.level === 'Intermediate'
          ? distributionPatterns.intermediate
          : distributionPatterns.advanced

        // Generate distributions for 2-3 recent terms
        const numTerms = Math.random() > 0.5 ? 3 : 2
        for (let t = 0; t < numTerms; t++) {
          const pattern = levelPatterns[Math.floor(Math.random() * levelPatterns.length)]
          const term = terms[t]

          // Add some randomness to the distribution
          const baseStudents = 50 + Math.floor(Math.random() * 150) // 50-200 students
          const distribution = {
            aCount: Math.floor(pattern.a * baseStudents / 100),
            abCount: Math.floor(pattern.ab * baseStudents / 100),
            bCount: Math.floor(pattern.b * baseStudents / 100),
            bcCount: Math.floor(pattern.bc * baseStudents / 100),
            cCount: Math.floor(pattern.c * baseStudents / 100),
            dCount: Math.floor(pattern.d * baseStudents / 100),
            fCount: Math.floor(pattern.f * baseStudents / 100),
          }

          const totalGraded = Object.values(distribution).reduce((sum, count) => sum + count, 0)
          const avgGPA = calculateGPA(distribution, totalGraded)

          distributions.push({
            courseId: course.id,
            term,
            ...distribution,
            totalGraded,
            avgGPA: parseFloat(avgGPA.toFixed(2))
          })
        }
      }

      // Batch insert
      if (distributions.length > 0) {
        await prisma.gradeDistribution.createMany({
          data: distributions,
          skipDuplicates: true
        })
        created += distributions.length
        console.log(`✅ Created ${created} distributions...`)
      }
    }

    // Update course average GPAs
    console.log('📊 Updating course average GPAs...')

    const coursesWithGrades = await prisma.course.findMany({
      include: {
        gradeDistributions: true
      }
    })

    for (const course of coursesWithGrades) {
      if (course.gradeDistributions.length > 0) {
        const avgGPA = course.gradeDistributions.reduce((sum, d) => sum + d.avgGPA, 0) / course.gradeDistributions.length

        await prisma.course.update({
          where: { id: course.id },
          data: { avgGPA: parseFloat(avgGPA.toFixed(2)) }
        })
      }
    }

    console.log(`✅ Successfully created ${created} grade distributions!`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding grade distributions:', error)
    process.exit(1)
  }
}

seedGradeDistributions()