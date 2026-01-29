export enum GradeType {
  A = 'A',
  AB = 'AB',
  B = 'B',
  BC = 'BC',
  C = 'C',
  D = 'D',
  F = 'F'
}

export interface Comment {
  id: string;
  author: string;
  date: string;
  text: string;
}

export interface Review {
  id: string;
  author: string;
  term: string;
  instructor: string;
  title?: string; // New: Review summary title
  date: string;
  gradeReceived: GradeType;
  
  // Numeric/Grade ratings
  ratings: {
    content: GradeType;
    teaching: GradeType;
    grading: GradeType;
    workload: GradeType;
  };
  
  // Specific comments for each dimension
  dimensionComments?: {
    content: string;
    teaching: string;
    grading: string;
    workload: string;
  };

  assessments?: string[]; // New: "Mid-term", "Final", etc.
  tags: string[]; // Legacy general tags
  text: string; // General summary or legacy text
  resourceLink?: string; 
  likes: number;
  comments: Comment[];
}

export interface CourseAttributes {
  breadth: string[];
  genEd: string[];
  level: 'Elementary' | 'Intermediate' | 'Advanced' | 'None';
}

export interface Course {
  code: string;
  name: string;
  credits: number;
  description: string;
  prerequisites: string;
  leadsTo: string[]; 
  attributes: CourseAttributes;
  school: string;
  lastOffered: string;
  terms: string[]; 
  instructors: string[];
  stats: {
    reviewCount: number;
    avgGrade: GradeType;
    contentScore: GradeType;
    teachingScore: GradeType;
    gradingScore: GradeType;
    workloadScore: GradeType;
  };
}

export interface QuickLink {
  name: string;
  url: string;
  icon?: string;
  category: 'Essentials' | 'Curriculum' | 'Departments';
}