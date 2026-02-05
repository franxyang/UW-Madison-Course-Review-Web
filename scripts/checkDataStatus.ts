import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const courseCount = await prisma.course.count();
  const instructorCount = await prisma.instructor.count();
  const gradeDistCount = await prisma.gradeDistribution.count();
  const reviewCount = await prisma.review.count();
  const userCount = await prisma.user.count();
  
  console.log('=== Database Status ===');
  console.log(`Courses: ${courseCount}`);
  console.log(`Instructors: ${instructorCount}`);
  console.log(`Grade Distributions: ${gradeDistCount}`);
  console.log(`Reviews: ${reviewCount}`);
  console.log(`Users: ${userCount}`);
  
  // Sample some courses for mock data
  const sampleCourses = await prisma.course.findMany({
    take: 20,
    select: { id: true, code: true, name: true, credits: true, level: true },
    orderBy: { code: 'asc' }
  });
  
  console.log('\n=== Sample Courses for Mock Data ===');
  sampleCourses.forEach(c => console.log(`${c.code}: ${c.name} (${c.credits} cr, ${c.level})`));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
