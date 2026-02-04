import { prisma } from '../lib/prisma'

async function main() {
  console.log('🚀 Creating test user...')

  try {
    const user = await prisma.user.upsert({
      where: { email: 'test@wisc.edu' },
      update: {},
      create: {
        email: 'test@wisc.edu',
        name: 'Test Badger',
        role: 'STUDENT'
      }
    })

    console.log('✅ Test user created:')
    console.log('   Email:', user.email)
    console.log('   Name:', user.name)
    console.log('   ID:', user.id)
    console.log('\n📝 You can now sign in with this email to test the review system')

  } catch (error) {
    console.error('❌ Error creating test user:', error)
    throw error
  }
}

main()
  .then(() => {
    console.log('\n✨ Done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
