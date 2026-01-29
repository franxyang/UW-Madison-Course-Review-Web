import { prisma } from '../lib/prisma'

const UW_SCHOOLS = [
  'Agricultural & Life Sciences, College of',
  'Business, Wisconsin School of',
  'Computer, Data & Information Sciences, School of',
  'Continuing Studies, School of',
  'Education, School of',
  'Engineering, College of',
  'Graduate School',
  'Human Ecology, School of',
  'Journalism & Mass Communication, School of',
  'Law School',
  'Letters & Science, College of',
  'Medicine & Public Health, School of',
  'Music, School of',
  'Nursing, School of',
  'Pharmacy, School of',
  'Public Affairs, La Follette School of',
  'Social Work, School of',
  'Veterinary Medicine, School of',
  'Environmental Studies, Nelson Institute for',
  'International Studies, Division of',
  'University Special/Guest',
  'Information School',
  'Public Health, School of',
]

export async function seedSchools() {
  console.log('🏫 Seeding schools...')

  for (const schoolName of UW_SCHOOLS) {
    try {
      await prisma.school.upsert({
        where: { name: schoolName },
        update: {},
        create: { name: schoolName },
      })
      console.log(`  ✅ Created/verified school: ${schoolName}`)
    } catch (error) {
      console.error(`  ❌ Error creating school ${schoolName}:`, error)
    }
  }

  const count = await prisma.school.count()
  console.log(`✅ Total schools in database: ${count}`)
}

// Run if called directly
if (require.main === module) {
  seedSchools()
    .then(() => {
      console.log('✨ Schools seeding completed')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ Schools seeding failed:', error)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}