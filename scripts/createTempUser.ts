import { prisma } from '../lib/prisma'

async function createTempUser() {
  try {
    const user = await prisma.user.upsert({
      where: { id: 'temp-user-id' },
      update: {},
      create: {
        id: 'temp-user-id',
        email: 'test@wisc.edu',
        name: 'Test User',
        role: 'STUDENT'
      }
    })

    console.log('✅ Temporary user created:', user)
    process.exit(0)
  } catch (error) {
    console.error('Error creating temp user:', error)
    process.exit(1)
  }
}

createTempUser()