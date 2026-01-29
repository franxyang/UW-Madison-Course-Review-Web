import { Course, GradeType, Review, QuickLink } from './types';

export const UW_SCHOOLS = [
  "Agricultural & Life Sciences, College of",
  "Arts, Division of the",
  "Business, School of",
  "Computer Data & Information Sciences, School of",
  "Continuing Studies, Division of",
  "Education, School of",
  "Engineering, College of",
  "Environmental Studies, Nelson Institute for",
  "Graduate School",
  "Human Ecology, School of",
  "Information School",
  "International Division",
  "Journalism and Mass Communication, School of",
  "Language Institute",
  "Law School",
  "Letters & Science, College of",
  "Medicine and Public Health, School of",
  "Music, School of",
  "Nursing, School of",
  "Pharmacy, School of",
  "Public Affairs, School of",
  "Social Work, School of",
  "Veterinary Medicine, School of"
];

export const POPULAR_SUBJECTS = [
  "Computer Sciences (COMP SCI)",
  "Mathematics (MATH)",
  "Psychology (PSYCH)",
  "Economics (ECON)",
  "Chemistry (CHEM)",
  "Biology (BIOLOGY)"
];

export const FILTER_OPTIONS = {
  breadth: [
    "Biological Sciences",
    "Humanities",
    "Literature",
    "Natural Sciences",
    "Physical Sciences",
    "Social Sciences"
  ],
  genEd: [
    "Communication A",
    "Communication B",
    "Quantitative Reasoning A",
    "Quantitative Reasoning B",
    "Ethnic Studies"
  ],
  level: [
    "Elementary",
    "Intermediate",
    "Advanced"
  ]
};

export const MOCK_COURSE: Course = {
  code: "CS 577",
  name: "Introduction to Algorithms",
  credits: 4,
  school: "Computer Data & Information Sciences, School of",
  description: "Basic paradigms for the design and analysis of efficient algorithms: greediness, divide and conquer, dynamic programming, network flow, reductions, and NP-completeness. Mathematical induction and asymptotic analysis are used.",
  prerequisites: "(COMP SCI 400 or 367) and (MATH 222 or 276)",
  leadsTo: ["CS 787", "CS 540", "CS 640"],
  attributes: {
    breadth: ["Natural Sciences", "Physical Sciences"],
    genEd: ["Quantitative Reasoning B"],
    level: "Advanced"
  },
  lastOffered: "Fall 2024",
  terms: ["2024 Fall", "2024 Spring", "2023 Fall", "2023 Spring", "2022 Fall", "2022 Spring", "2021 Fall", "2021 Spring"],
  instructors: [
    "Marc Olszewski", 
    "Dieter van Melkebeek", 
    "Eric Bach", 
    "Christos Tzamos",
    "Shuchi Chawla",
    "Jin-Yi Cai",
    "Paris Koutris"
  ],
  stats: {
    reviewCount: 1350,
    avgGrade: GradeType.AB,
    contentScore: GradeType.A,
    teachingScore: GradeType.B,
    gradingScore: GradeType.BC,
    workloadScore: GradeType.C
  }
};

export const ALL_MOCK_COURSES: Course[] = [
    MOCK_COURSE,
    {
        ...MOCK_COURSE,
        code: "MATH 222",
        name: "Calculus & Analytic Geometry 2",
        credits: 4,
        school: "Letters & Science, College of",
        description: "Techniques of integration, improper integrals, infinite sequences and series, Taylor series, parametric equations and polar coordinates.",
        prerequisites: "MATH 221",
        leadsTo: ["MATH 234", "MATH 340", "STAT 311"],
        attributes: {
          breadth: ["Natural Sciences", "Physical Sciences"],
          genEd: ["Quantitative Reasoning B"],
          level: "Intermediate"
        },
        stats: { ...MOCK_COURSE.stats, avgGrade: GradeType.A, reviewCount: 856 }
    },
    {
        ...MOCK_COURSE,
        code: "ECON 101",
        name: "Principles of Microeconomics",
        credits: 4,
        school: "Letters & Science, College of",
        description: "Economic problems of individuals, firms and industries with emphasis on value, price, and distribution of income. Must be taken for 4 credits by students who do not have previous credit for Econ 101.",
        prerequisites: "None",
        leadsTo: ["ECON 102", "ECON 301"],
        attributes: {
          breadth: ["Social Sciences"],
          genEd: ["Quantitative Reasoning B"],
          level: "Elementary"
        },
        stats: { ...MOCK_COURSE.stats, avgGrade: GradeType.B, reviewCount: 2100 }
    },
    {
        ...MOCK_COURSE,
        code: "PSYCH 202",
        name: "Introduction to Psychology",
        credits: 3,
        school: "Letters & Science, College of",
        description: "Survey of major content areas in psychology. Topics include research methodology, biological bases of behavior, sensation and perception, learning, memory, cognition, development, personality, and social psychology.",
        prerequisites: "None",
        leadsTo: ["PSYCH 210", "PSYCH 403"],
        attributes: {
          breadth: ["Social Sciences", "Biological Sciences"],
          genEd: [],
          level: "Elementary"
        },
        stats: { ...MOCK_COURSE.stats, avgGrade: GradeType.AB, reviewCount: 1540 }
    },
    {
        ...MOCK_COURSE,
        code: "CHEM 343",
        name: "Organic Chemistry I",
        credits: 3,
        school: "Letters & Science, College of",
        description: "Principles of organic chemistry. Bonding, structure, stereochemistry, reactions, and mechanisms of alkanes, alkenes, alkynes, and alkyl halides.",
        prerequisites: "CHEM 104 or 109",
        leadsTo: ["CHEM 344", "CHEM 345"],
        attributes: {
          breadth: ["Physical Sciences", "Natural Sciences"],
          genEd: [],
          level: "Intermediate"
        },
        stats: { ...MOCK_COURSE.stats, avgGrade: GradeType.BC, reviewCount: 980 }
    },
    {
        ...MOCK_COURSE,
        code: "ACCT 100",
        name: "Intro to Financial Accounting",
        credits: 3,
        school: "Business, School of",
        description: "Examines the financial reporting problems encountered in the business environment. Focuses on the interpretation and use of financial statements.",
        prerequisites: "Sophomore Standing",
        leadsTo: ["ACCT 301"],
        attributes: {
          breadth: [],
          genEd: [],
          level: "Elementary"
        },
        stats: { ...MOCK_COURSE.stats, avgGrade: GradeType.C, reviewCount: 450 }
    },
    {
        ...MOCK_COURSE,
        code: "CS 300",
        name: "Programming II",
        credits: 3,
        school: "Computer Data & Information Sciences, School of",
        description: "Introduction to Object-Oriented Programming using Java. Classes, objects, inheritance, polymorphism, interfaces, exceptions, file I/O.",
        prerequisites: "CS 200",
        leadsTo: ["CS 400"],
        attributes: {
          breadth: ["Natural Sciences"],
          genEd: [],
          level: "Intermediate"
        },
        stats: { ...MOCK_COURSE.stats, avgGrade: GradeType.A, reviewCount: 1120 }
    }
];

export const MOCK_REVIEWS: Review[] = [
  {
    id: "1",
    author: "BadgerCoder",
    term: "2023 Fall",
    title: "Essential for interviews but heavy workload",
    instructor: "Marc Olszewski",
    date: "Oct 17, 2024",
    gradeReceived: GradeType.AB,
    ratings: {
      content: GradeType.A,
      teaching: GradeType.AB,
      grading: GradeType.B,
      workload: GradeType.C,
    },
    dimensionComments: {
        content: "This class is fundamental for interviews. The content is challenging but very rewarding. You learn Dynamic Programming in depth.",
        teaching: "Marc is a fantastic lecturer who really cares about student understanding. He explains complex proofs clearly.",
        grading: "Exams are fair but the grading scale is strict. One mistake can cost you a lot.",
        workload: "The homeworks are brutal. Start early. Expect to spend 15+ hours a week."
    },
    assessments: ["Mid-term Exam", "Final Exam", "Assignment", "Quiz"],
    tags: ["Heavy Workload", "Great Content"],
    text: "This class is fundamental for interviews. The content is challenging but very rewarding.",
    resourceLink: "https://drive.google.com/drive/u/0/folders/example-folder-id",
    likes: 24,
    comments: [
        {
            id: "c1",
            author: "FutureGrad",
            date: "Oct 18, 2024",
            text: "How much math background do I really need? I struggled with 240."
        },
        {
            id: "c2",
            author: "BadgerCoder",
            date: "Oct 19, 2024",
            text: "You need to be comfortable with induction. If you got through 240 you should be okay, just review proofs."
        }
    ]
  },
  {
    id: "2",
    author: "WiscAlum24",
    term: "2023 Spring",
    title: "Theoretical and Tough",
    instructor: "Dieter van Melkebeek",
    date: "May 05, 2023",
    gradeReceived: GradeType.B,
    ratings: {
      content: GradeType.A,
      teaching: GradeType.B,
      grading: GradeType.C,
      workload: GradeType.D,
    },
    dimensionComments: {
        content: "Very theoretical approach. If you are weak at math proofs, you will struggle.",
        teaching: "Lectures are dry but informative.",
        grading: "The curve is tough. Don't expect an easy A.",
        workload: "Constant problem sets."
    },
    assessments: ["Mid-term Exam", "Final Exam", "Assignment"],
    tags: ["Curve is tough", "Theoretical"],
    text: "Very theoretical approach. If you are weak at math proofs, you will struggle.",
    likes: 15,
    comments: []
  }
];

export const QUICK_LINKS: QuickLink[] = [
  { name: "Canvas", url: "#", category: "Essentials" },
  { name: "Student Center", url: "#", category: "Essentials" },
  { name: "Course Guide", url: "#", category: "Essentials" },
  { name: "Degree Planner", url: "#", category: "Curriculum" },
  { name: "Engineering Career Services", url: "#", category: "Departments" },
];

// Updated to match ReviewForm logic (White text for all solid badges, distinct shades)
export const GRADE_COLORS: Record<GradeType, string> = {
  [GradeType.A]: "bg-green-500 text-white",
  [GradeType.AB]: "bg-green-400 text-white",
  [GradeType.B]: "bg-blue-500 text-white",
  [GradeType.BC]: "bg-blue-400 text-white",
  [GradeType.C]: "bg-yellow-400 text-white",
  [GradeType.D]: "bg-orange-400 text-white",
  [GradeType.F]: "bg-red-500 text-white",
};

export const GRADE_BG_COLORS: Record<GradeType, string> = {
    [GradeType.A]: "bg-green-100 text-green-700 border-green-200",
    [GradeType.AB]: "bg-green-50 text-green-600 border-green-200",
    [GradeType.B]: "bg-blue-100 text-blue-700 border-blue-200",
    [GradeType.BC]: "bg-blue-50 text-blue-600 border-blue-200",
    [GradeType.C]: "bg-yellow-100 text-yellow-700 border-yellow-200",
    [GradeType.D]: "bg-orange-100 text-orange-700 border-orange-200",
    [GradeType.F]: "bg-red-100 text-red-700 border-red-200",
};