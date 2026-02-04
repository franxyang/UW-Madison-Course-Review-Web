/**
 * Seed Departments from existing Course data (batch optimized)
 */
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function extractDeptCode(courseCode: string): string {
  const parts = courseCode.split(' ')
  const numIndex = parts.findIndex(p => /^\d+$/.test(p))
  if (numIndex <= 0) return parts.slice(0, -1).join(' ')
  return parts.slice(0, numIndex).join(' ')
}

async function main() {
  console.log('🏫 Seeding Departments from Course data...\n')
  
  const courses = await prisma.course.findMany({
    select: { id: true, code: true, schoolId: true },
    orderBy: { code: 'asc' },
  })
  
  console.log(`Found ${courses.length} courses`)
  
  // Build dept → school mapping
  const deptMap = new Map<string, { schoolId: string; courseIds: string[] }>()
  
  for (const course of courses) {
    const deptCode = extractDeptCode(course.code)
    if (!deptCode) continue
    
    const existing = deptMap.get(deptCode)
    if (existing) {
      existing.courseIds.push(course.id)
    } else {
      deptMap.set(deptCode, { schoolId: course.schoolId, courseIds: [course.id] })
    }
  }
  
  console.log(`Extracted ${deptMap.size} unique departments\n`)
  
  // Batch create departments using raw SQL for speed
  console.log('Creating departments...')
  
  const deptEntries = [...deptMap.entries()]
  
  // Clear existing and batch create
  await prisma.courseDepartment.deleteMany()
  await prisma.department.deleteMany()
  
  const DEPT_BATCH = 50
  for (let i = 0; i < deptEntries.length; i += DEPT_BATCH) {
    const batch = deptEntries.slice(i, i + DEPT_BATCH)
    await prisma.department.createMany({
      data: batch.map(([code, { schoolId }]) => ({ code, name: code, schoolId })),
      skipDuplicates: true,
    })
  }
  
  console.log(`✅ ${deptEntries.length} departments created`)
  
  // Fetch all departments to get IDs
  const departments = await prisma.department.findMany()
  const deptIdMap = new Map(departments.map(d => [d.code, d.id]))
  
  // Build all course-department links
  console.log('\n🔗 Linking courses to departments (batch)...')
  
  const links: { courseId: string; departmentId: string }[] = []
  for (const [code, { courseIds }] of deptMap.entries()) {
    const deptId = deptIdMap.get(code)
    if (!deptId) continue
    for (const courseId of courseIds) {
      links.push({ courseId, departmentId: deptId })
    }
  }
  
  // Clear existing links and batch insert
  await prisma.courseDepartment.deleteMany()
  
  // Insert in batches of 500
  const BATCH = 500
  for (let i = 0; i < links.length; i += BATCH) {
    const batch = links.slice(i, i + BATCH)
    await prisma.courseDepartment.createMany({
      data: batch,
      skipDuplicates: true,
    })
    process.stdout.write(`  ${Math.min(i + BATCH, links.length)}/${links.length}\r`)
  }
  
  console.log(`\n✅ ${links.length} course-department links created`)
  
  // Summary
  console.log('\n📊 Top departments:')
  const topDepts = [...deptMap.entries()]
    .sort((a, b) => b[1].courseIds.length - a[1].courseIds.length)
    .slice(0, 15)
  
  for (const [code, { courseIds }] of topDepts) {
    console.log(`  ${code.padEnd(15)} ${courseIds.length} courses`)
  }
  
  const finalCount = await prisma.department.count()
  const linkCount = await prisma.courseDepartment.count()
  console.log(`\n🎯 Final: ${finalCount} departments, ${linkCount} course links`)
  
  await prisma.$disconnect()
}

main().catch(console.error)
