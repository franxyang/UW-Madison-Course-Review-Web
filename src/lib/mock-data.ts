// Mock data for development without database connection

export const mockCourses = [
  {
    id: 'cs577',
    code: 'CS 577',
    name: 'Introduction to Algorithms',
    description: 'Basic paradigm of algorithm analysis and design including divide and conquer, dynamic programming, greedy algorithms, graph algorithms, and NP-completeness.',
    credits: 4,
    department: 'Computer Sciences',
    school: 'L&S',
    level: '500',
    breadths: ['Natural Science'],
    genEds: [],
    prerequisites: 'CS 240 or CS 252; and MATH 240 or MATH 320',
    avgGPA: 3.2,
    avgRating: 4.1,
    reviewCount: 156,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cs400',
    code: 'CS 400',
    name: 'Programming III',
    description: 'Object-oriented design and programming, abstract data types, algorithm design, data structures, and software engineering.',
    credits: 3,
    department: 'Computer Sciences',
    school: 'L&S',
    level: '400',
    breadths: ['Natural Science'],
    genEds: [],
    prerequisites: 'CS 300',
    avgGPA: 3.4,
    avgRating: 4.3,
    reviewCount: 234,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cs300',
    code: 'CS 300',
    name: 'Programming II',
    description: 'Introduction to Object-Oriented Programming using classes and objects to solve more complex problems. Introduces array-based and linked data structures.',
    credits: 3,
    department: 'Computer Sciences',
    school: 'L&S',
    level: '300',
    breadths: ['Natural Science'],
    genEds: [],
    prerequisites: 'CS 200 or CS 220',
    avgGPA: 3.5,
    avgRating: 4.4,
    reviewCount: 312,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'math222',
    code: 'MATH 222',
    name: 'Calculus and Analytic Geometry 2',
    description: 'Techniques of integration, improper integrals, differential equations, Taylor polynomials, vectors and curves.',
    credits: 4,
    department: 'Mathematics',
    school: 'L&S',
    level: '200',
    breadths: ['Quantitative Reasoning A'],
    genEds: [],
    prerequisites: 'MATH 221',
    avgGPA: 2.9,
    avgRating: 3.8,
    reviewCount: 312,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'econ101',
    code: 'ECON 101',
    name: 'Principles of Microeconomics',
    description: 'Analysis of markets; supply and demand; consumer behavior; production and costs; competition and monopoly.',
    credits: 4,
    department: 'Economics',
    school: 'L&S',
    level: '100',
    breadths: ['Social Science'],
    genEds: [],
    prerequisites: null,
    avgGPA: 3.1,
    avgRating: 3.9,
    reviewCount: 445,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cs540',
    code: 'CS 540',
    name: 'Introduction to Artificial Intelligence',
    description: 'Principles of knowledge-based search, game-playing, knowledge representation, machine learning, natural language understanding, and robotics.',
    credits: 3,
    department: 'Computer Sciences',
    school: 'L&S',
    level: '500',
    breadths: ['Natural Science'],
    genEds: [],
    prerequisites: 'CS 300 and (MATH 340 or MATH 341 or MATH 375)',
    avgGPA: 3.3,
    avgRating: 4.2,
    reviewCount: 189,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cs564',
    code: 'CS 564',
    name: 'Database Management Systems',
    description: 'Introduction to the concepts and theories of database management systems with emphasis on relational databases.',
    credits: 4,
    department: 'Computer Sciences',
    school: 'L&S',
    level: '500',
    breadths: ['Natural Science'],
    genEds: [],
    prerequisites: 'CS 367 or CS 400',
    avgGPA: 3.1,
    avgRating: 3.9,
    reviewCount: 145,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'stat340',
    code: 'STAT 340',
    name: 'Data Modeling II',
    description: 'Introduction to statistical modeling with R. Linear regression, logistic regression, ANOVA, and model selection.',
    credits: 3,
    department: 'Statistics',
    school: 'L&S',
    level: '300',
    breadths: ['Quantitative Reasoning B'],
    genEds: [],
    prerequisites: 'STAT 240',
    avgGPA: 3.2,
    avgRating: 4.0,
    reviewCount: 178,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const mockInstructors = [
  { id: 'dieter', name: 'Dieter van Melkebeek', email: 'dieter@cs.wisc.edu' },
  { id: 'beck', name: 'Gary Beck', email: 'gbeck@cs.wisc.edu' },
  { id: 'deppeler', name: 'Deb Deppeler', email: 'deppeler@cs.wisc.edu' },
  { id: 'jerry', name: 'Jerry Zhu', email: 'jerryzhu@cs.wisc.edu' },
  { id: 'remzi', name: 'Remzi Arpaci-Dusseau', email: 'remzi@cs.wisc.edu' },
];

export const mockGradeDistributions = [
  { id: 'cs577-f24', courseId: 'cs577', term: '2024-Fall', aCount: 45, abCount: 38, bCount: 52, bcCount: 28, cCount: 22, dCount: 8, fCount: 7, totalStudents: 200, avgGPA: 3.15 },
  { id: 'cs577-s24', courseId: 'cs577', term: '2024-Spring', aCount: 42, abCount: 35, bCount: 48, bcCount: 32, cCount: 25, dCount: 10, fCount: 8, totalStudents: 200, avgGPA: 3.08 },
  { id: 'cs577-f23', courseId: 'cs577', term: '2023-Fall', aCount: 40, abCount: 36, bCount: 50, bcCount: 30, cCount: 24, dCount: 12, fCount: 8, totalStudents: 200, avgGPA: 3.05 },
  { id: 'cs400-f24', courseId: 'cs400', term: '2024-Fall', aCount: 120, abCount: 85, bCount: 95, bcCount: 45, cCount: 35, dCount: 15, fCount: 5, totalStudents: 400, avgGPA: 3.35 },
  { id: 'cs400-s24', courseId: 'cs400', term: '2024-Spring', aCount: 115, abCount: 90, bCount: 100, bcCount: 50, cCount: 30, dCount: 10, fCount: 5, totalStudents: 400, avgGPA: 3.38 },
  { id: 'math222-f24', courseId: 'math222', term: '2024-Fall', aCount: 80, abCount: 70, bCount: 120, bcCount: 90, cCount: 80, dCount: 40, fCount: 20, totalStudents: 500, avgGPA: 2.85 },
  { id: 'econ101-f24', courseId: 'econ101', term: '2024-Fall', aCount: 150, abCount: 120, bCount: 180, bcCount: 100, cCount: 90, dCount: 40, fCount: 20, totalStudents: 700, avgGPA: 3.05 },
  { id: 'cs540-f24', courseId: 'cs540', term: '2024-Fall', aCount: 55, abCount: 45, bCount: 50, bcCount: 25, cCount: 15, dCount: 5, fCount: 5, totalStudents: 200, avgGPA: 3.45 },
  { id: 'cs300-f24', courseId: 'cs300', term: '2024-Fall', aCount: 150, abCount: 100, bCount: 120, bcCount: 60, cCount: 40, dCount: 20, fCount: 10, totalStudents: 500, avgGPA: 3.45 },
];

export const mockReviews = [
  {
    id: 'review1',
    courseId: 'cs577',
    authorId: 'user1',
    instructorId: 'dieter',
    term: 'Fall 2024',
    gradeReceived: 'AB',
    contentRating: 'A',
    teachingRating: 'AB',
    gradingRating: 'B',
    workloadRating: 'C',
    contentComment: 'The course covers fundamental algorithm design paradigms very thoroughly. Dieter explains concepts clearly with rigorous mathematical proofs.',
    teachingComment: 'Lectures are well-organized but can be dense. Office hours are extremely helpful.',
    gradingComment: 'Homework is challenging but fair. Exams are difficult and cover edge cases.',
    workloadComment: 'Heavy workload. Expect to spend 15-20 hours per week on homework alone.',
    overallComment: 'Essential course for CS majors. Challenging but rewarding if you put in the effort.',
    tips: 'Start homework early! Form study groups and attend office hours regularly.',
    hasHomework: true,
    hasMidterm: true,
    hasFinal: true,
    hasProject: false,
    hasQuiz: false,
    hasEssay: false,
    hasPresentation: false,
    status: 'PUBLISHED' as const,
    createdAt: new Date('2024-12-15'),
    updatedAt: new Date('2024-12-15'),
    author: { id: 'user1', name: 'Anonymous Badger', email: 'user1@wisc.edu' },
    instructor: { id: 'dieter', name: 'Dieter van Melkebeek' },
  },
  {
    id: 'review2',
    courseId: 'cs577',
    authorId: 'user2',
    instructorId: 'dieter',
    term: 'Spring 2024',
    gradeReceived: 'A',
    contentRating: 'A',
    teachingRating: 'A',
    gradingRating: 'AB',
    workloadRating: 'BC',
    contentComment: 'Comprehensive coverage of algorithms. Dynamic programming and graph algorithms sections were particularly well taught.',
    teachingComment: 'One of the best lecturers in the department. Very clear explanations.',
    gradingComment: 'Fair grading with partial credit given.',
    workloadComment: 'Manageable if you stay on top of things.',
    overallComment: 'Highly recommend taking this with Dieter.',
    tips: 'Review CLRS textbook chapters before each lecture.',
    hasHomework: true,
    hasMidterm: true,
    hasFinal: true,
    hasProject: false,
    hasQuiz: true,
    hasEssay: false,
    hasPresentation: false,
    status: 'PUBLISHED' as const,
    createdAt: new Date('2024-05-20'),
    updatedAt: new Date('2024-05-20'),
    author: { id: 'user2', name: 'Anonymous Badger', email: 'user2@wisc.edu' },
    instructor: { id: 'dieter', name: 'Dieter van Melkebeek' },
  },
  {
    id: 'review3',
    courseId: 'cs400',
    authorId: 'user3',
    instructorId: 'deppeler',
    term: 'Fall 2024',
    gradeReceived: 'A',
    contentRating: 'AB',
    teachingRating: 'A',
    gradingRating: 'A',
    workloadRating: 'AB',
    contentComment: 'Good introduction to data structures and OOP. Projects are interesting and practical.',
    teachingComment: 'Deb is an amazing instructor. Very organized and helpful.',
    gradingComment: 'Clear rubrics and fair grading.',
    workloadComment: 'Reasonable workload with well-spaced deadlines.',
    overallComment: 'Great course for building programming fundamentals.',
    tips: 'Pay attention to code style and testing requirements.',
    hasHomework: true,
    hasMidterm: true,
    hasFinal: true,
    hasProject: true,
    hasQuiz: true,
    hasEssay: false,
    hasPresentation: false,
    status: 'PUBLISHED' as const,
    createdAt: new Date('2024-12-10'),
    updatedAt: new Date('2024-12-10'),
    author: { id: 'user3', name: 'Anonymous Badger', email: 'user3@wisc.edu' },
    instructor: { id: 'deppeler', name: 'Deb Deppeler' },
  },
];

export const mockDepartments = [
  'Computer Sciences',
  'Mathematics',
  'Statistics',
  'Economics',
  'Physics',
  'Chemistry',
  'Biology',
  'Psychology',
  'English',
  'History',
];

// Helper functions
export function searchCourses(query: string, department?: string) {
  return mockCourses.filter(course => {
    const matchesQuery = !query ||
      course.code.toLowerCase().includes(query.toLowerCase()) ||
      course.name.toLowerCase().includes(query.toLowerCase());
    const matchesDept = !department || course.department === department;
    return matchesQuery && matchesDept;
  });
}

export function getCourseByCode(code: string) {
  const normalizedCode = code.toUpperCase().replace(/\s+/g, ' ');
  return mockCourses.find(c => c.code.toUpperCase() === normalizedCode);
}

export function getPopularCourses(limit = 6) {
  return [...mockCourses]
    .sort((a, b) => b.reviewCount - a.reviewCount)
    .slice(0, limit);
}

export function getTopRatedCourses(limit = 6) {
  return [...mockCourses]
    .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0))
    .slice(0, limit);
}

export function getReviewsByCourse(courseId: string) {
  return mockReviews.filter(r => r.courseId === courseId);
}

export function getGradeDistribution(courseId: string) {
  return mockGradeDistributions.filter(g => g.courseId === courseId);
}
