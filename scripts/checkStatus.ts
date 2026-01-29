import { prisma } from '../lib/prisma'

async function checkStatus() {
  const courseCount = await prisma.course.count()
  const schoolCount = await prisma.school.count()

  console.log('📊 Database Status:')
  console.log(`  Schools: ${schoolCount}`)
  console.log(`  Courses: ${courseCount}`)

  // Show a few sample courses
  const samples = await prisma.course.findMany({
    take: 5,
    include: { school: true }
  })

  console.log('\n📝 Sample courses:')
  for (const course of samples) {
    console.log(`  - ${course.code}: ${course.name}`)
    console.log(`    School: ${course.school.name}`)
  }

  await prisma.$disconnect()
}

checkStatus()