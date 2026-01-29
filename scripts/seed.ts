import { prisma } from '../lib/prisma'
import { seedSchools } from './seedSchools'
import { seedCourses } from './seedCourses'

async function main() {
  console.log('🚀 Starting database seeding...\n')

  try {
    // Step 1: Seed schools
    console.log('Step 1: Seeding schools')
    console.log('=' .repeat(50))
    await seedSchools()
    console.log()

    // Step 2: Seed courses
    console.log('Step 2: Seeding courses from AEFIS data')
    console.log('=' .repeat(50))
    const courseCount = await seedCourses()
    console.log()

    // Final summary
    console.log('=' .repeat(50))
    console.log('✅ DATABASE SEEDING COMPLETED!')
    console.log('=' .repeat(50))
    console.log('\n📊 Final Database Statistics:')

    const stats = {
      schools: await prisma.school.count(),
      courses: await prisma.course.count(),
      instructors: await prisma.instructor.count(),
      users: await prisma.user.count(),
      reviews: await prisma.review.count(),
    }

    console.log(`  Schools: ${stats.schools}`)
    console.log(`  Courses: ${stats.courses}`)
    console.log(`  Instructors: ${stats.instructors}`)
    console.log(`  Users: ${stats.users}`)
    console.log(`  Reviews: ${stats.reviews}`)

    console.log('\n🎯 Next Steps:')
    console.log('  1. Run "npm run dev" to start the Next.js development server')
    console.log('  2. Visit http://localhost:3000 to see your application')
    console.log('  3. The database is now populated with real UW Madison courses!')

  } catch (error) {
    console.error('\n❌ SEEDING FAILED:', error)
    throw error
  }
}

// Execute the main function
main()
  .then(() => {
    console.log('\n✨ All done! Exiting...')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n💥 Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })