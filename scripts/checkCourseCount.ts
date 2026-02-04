import { prisma } from '../lib/prisma'

async function main() {
  const count = await prisma.course.count()
  console.log(`📊 Total courses in database: ${count}`)
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
