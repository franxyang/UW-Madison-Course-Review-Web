/**
 * Database Seed Script
 * Run with: npm run db:seed
 *
 * This script populates the database with sample data for development.
 * In production, you would import real data from MadGrades and guide.wisc.edu
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Sample courses data
const SAMPLE_COURSES = [
  {
    code: "CS 577",
    name: "Introduction to Algorithms",
    description:
      "Basic paradigms for the design and analysis of efficient algorithms: greed, divide-and-conquer, dynamic programming, reductions, and the use of randomness. Computational intractability including NP-completeness.",
    credits: 4,
    department: "Computer Sciences",
    school: "L&S",
    level: "500",
    breadths: ["Natural Science"],
    genEds: [],
    prerequisites: "CS 240 or CS 252 or CS 302, and (MATH 222 or MATH 276)",
  },
  {
    code: "CS 400",
    name: "Programming III",
    description:
      "The third course in the introductory programming sequence. Provides experience with more advanced data structures and algorithms, including trees, graphs, hash tables, priority queues, and heaps.",
    credits: 3,
    department: "Computer Sciences",
    school: "L&S",
    level: "400",
    breadths: [],
    genEds: [],
    prerequisites: "CS 300 with a grade of C or better",
  },
  {
    code: "CS 300",
    name: "Programming II",
    description:
      "Introduction to Object-Oriented Programming using classes and objects to solve more complex problems. Introduces array-based and linked data structures: lists, stacks, and queues.",
    credits: 3,
    department: "Computer Sciences",
    school: "L&S",
    level: "300",
    breadths: [],
    genEds: [],
    prerequisites: "CS 200 or CS 220",
  },
  {
    code: "MATH 234",
    name: "Calculus--Functions of Several Variables",
    description:
      "Introduction to calculus of functions of several variables; calculus on parameterized curves, derivatives of functions of several variables, multiple integrals, vector fields.",
    credits: 4,
    department: "Mathematics",
    school: "L&S",
    level: "200",
    breadths: ["Natural Science"],
    genEds: ["Quantitative Reasoning A"],
    prerequisites: "MATH 222",
  },
  {
    code: "MATH 222",
    name: "Calculus and Analytic Geometry 2",
    description:
      "Techniques of integration, improper integrals, first-order ordinary differential equations, sequences and series, Taylor series, introduction to vectors.",
    credits: 4,
    department: "Mathematics",
    school: "L&S",
    level: "200",
    breadths: ["Natural Science"],
    genEds: ["Quantitative Reasoning A"],
    prerequisites: "MATH 221",
  },
  {
    code: "ECON 101",
    name: "Principles of Microeconomics",
    description:
      "Introduction to microeconomics: analysis of consumer and firm behavior; supply and demand; competition and monopoly; factor markets.",
    credits: 4,
    department: "Economics",
    school: "L&S",
    level: "100",
    breadths: ["Social Science"],
    genEds: [],
    prerequisites: null,
  },
  {
    code: "PSYCH 202",
    name: "Introduction to Psychology",
    description:
      "Survey of psychological science, including biological, cognitive, developmental, and social perspectives on behavior and mental processes.",
    credits: 4,
    department: "Psychology",
    school: "L&S",
    level: "200",
    breadths: ["Social Science"],
    genEds: [],
    prerequisites: null,
  },
  {
    code: "PHYSICS 201",
    name: "General Physics",
    description:
      "First semester of a two-semester sequence covering electricity and magnetism, optics, modern physics, waves, and mechanics.",
    credits: 5,
    department: "Physics",
    school: "L&S",
    level: "200",
    breadths: ["Natural Science", "Physical Science"],
    genEds: [],
    prerequisites: "MATH 221 or concurrent enrollment",
  },
  {
    code: "STAT 301",
    name: "Introduction to Statistical Methods",
    description:
      "Introduction to probability and statistics. Covers descriptive statistics, probability distributions, hypothesis testing, confidence intervals, and regression analysis.",
    credits: 3,
    department: "Statistics",
    school: "L&S",
    level: "300",
    breadths: [],
    genEds: ["Quantitative Reasoning B"],
    prerequisites: "MATH 112 or MATH 114",
  },
  {
    code: "COMP SCI 540",
    name: "Introduction to Artificial Intelligence",
    description:
      "Principles of knowledge-based search techniques, automatic deduction, knowledge representation, machine learning, neural networks, genetic algorithms, and natural language processing.",
    credits: 3,
    department: "Computer Sciences",
    school: "L&S",
    level: "500",
    breadths: [],
    genEds: [],
    prerequisites: "CS 300 and CS 240",
  },
];

// Sample instructors
const SAMPLE_INSTRUCTORS = [
  { name: "Shuchi Chawla", email: "shuchi@cs.wisc.edu" },
  { name: "Eric Bach", email: "bach@cs.wisc.edu" },
  { name: "Jim Smith", email: "jsmith@wisc.edu" },
  { name: "Sarah Johnson", email: "sjohnson@wisc.edu" },
  { name: "Michael Chen", email: "mchen@wisc.edu" },
];

// Sample grade distributions
function generateGradeDistribution(courseId: string, term: string) {
  const total = Math.floor(Math.random() * 200) + 50;
  const a = Math.floor(Math.random() * 0.35 * total);
  const ab = Math.floor(Math.random() * 0.25 * total);
  const b = Math.floor(Math.random() * 0.2 * total);
  const bc = Math.floor(Math.random() * 0.1 * total);
  const c = Math.floor(Math.random() * 0.07 * total);
  const d = Math.floor(Math.random() * 0.02 * total);
  const f = total - a - ab - b - bc - c - d;

  const avgGPA =
    (a * 4.0 + ab * 3.5 + b * 3.0 + bc * 2.5 + c * 2.0 + d * 1.0) / total;

  return {
    courseId,
    term,
    aCount: a,
    abCount: ab,
    bCount: b,
    bcCount: bc,
    cCount: c,
    dCount: d,
    fCount: Math.max(0, f),
    totalStudents: total,
    avgGPA: parseFloat(avgGPA.toFixed(2)),
  };
}

async function main() {
  console.log("🌱 Starting database seed...");

  // Clear existing data
  console.log("Clearing existing data...");
  await prisma.review.deleteMany();
  await prisma.gradeDistribution.deleteMany();
  await prisma.courseInstructor.deleteMany();
  await prisma.course.deleteMany();
  await prisma.instructor.deleteMany();

  // Create instructors
  console.log("Creating instructors...");
  const instructors = await Promise.all(
    SAMPLE_INSTRUCTORS.map((i) =>
      prisma.instructor.create({
        data: i,
      })
    )
  );

  // Create courses
  console.log("Creating courses...");
  const courses = await Promise.all(
    SAMPLE_COURSES.map((c) =>
      prisma.course.create({
        data: c,
      })
    )
  );

  // Link some instructors to courses
  console.log("Linking instructors to courses...");
  const csInstructors = instructors.slice(0, 2);
  const csCourses = courses.filter((c) =>
    c.department.includes("Computer Sciences")
  );

  for (const course of csCourses) {
    for (const instructor of csInstructors) {
      await prisma.courseInstructor.create({
        data: {
          courseId: course.id,
          instructorId: instructor.id,
        },
      });
    }
  }

  // Create grade distributions
  console.log("Creating grade distributions...");
  const terms = [
    "2024-Fall",
    "2024-Spring",
    "2023-Fall",
    "2023-Spring",
    "2022-Fall",
  ];

  for (const course of courses) {
    for (const term of terms) {
      await prisma.gradeDistribution.create({
        data: generateGradeDistribution(course.id, term),
      });
    }

    // Update course avg GPA
    const grades = await prisma.gradeDistribution.findMany({
      where: { courseId: course.id },
    });

    const totalStudents = grades.reduce((sum, g) => sum + g.totalStudents, 0);
    const weightedGPA = grades.reduce(
      (sum, g) => sum + g.avgGPA * g.totalStudents,
      0
    );
    const avgGPA = weightedGPA / totalStudents;

    await prisma.course.update({
      where: { id: course.id },
      data: { avgGPA: parseFloat(avgGPA.toFixed(2)) },
    });
  }

  console.log("✅ Database seed completed!");
  console.log(`   - ${courses.length} courses created`);
  console.log(`   - ${instructors.length} instructors created`);
  console.log(`   - ${courses.length * terms.length} grade distributions created`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
