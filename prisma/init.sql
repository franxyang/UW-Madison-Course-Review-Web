-- WiscFlow Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM for ReviewStatus
CREATE TYPE "ReviewStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'HIDDEN');

-- User table (NextAuth)
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "image" TEXT,
    "emailVerified" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "User_email_key" UNIQUE ("email")
);

-- Account table (NextAuth)
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    CONSTRAINT "Account_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Account_provider_providerAccountId_key" UNIQUE ("provider", "providerAccountId"),
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Session table (NextAuth)
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Session_sessionToken_key" UNIQUE ("sessionToken"),
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- VerificationToken table (NextAuth)
CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VerificationToken_token_key" UNIQUE ("token"),
    CONSTRAINT "VerificationToken_identifier_token_key" UNIQUE ("identifier", "token")
);

-- Course table
CREATE TABLE IF NOT EXISTS "Course" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "credits" INTEGER NOT NULL DEFAULT 3,
    "department" TEXT NOT NULL,
    "school" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "breadths" TEXT[] DEFAULT '{}',
    "genEds" TEXT[] DEFAULT '{}',
    "prerequisites" TEXT,
    "avgGPA" DOUBLE PRECISION,
    "avgRating" DOUBLE PRECISION,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Course_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Course_code_key" UNIQUE ("code")
);

-- Create indexes for Course
CREATE INDEX IF NOT EXISTS "Course_department_idx" ON "Course"("department");
CREATE INDEX IF NOT EXISTS "Course_level_idx" ON "Course"("level");
CREATE INDEX IF NOT EXISTS "Course_school_idx" ON "Course"("school");

-- Instructor table
CREATE TABLE IF NOT EXISTS "Instructor" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "name" TEXT NOT NULL,
    "email" TEXT,
    CONSTRAINT "Instructor_pkey" PRIMARY KEY ("id")
);

-- CourseInstructor join table
CREATE TABLE IF NOT EXISTS "CourseInstructor" (
    "courseId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    CONSTRAINT "CourseInstructor_pkey" PRIMARY KEY ("courseId", "instructorId"),
    CONSTRAINT "CourseInstructor_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "CourseInstructor_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- GradeDistribution table
CREATE TABLE IF NOT EXISTS "GradeDistribution" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "courseId" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "aCount" INTEGER NOT NULL DEFAULT 0,
    "abCount" INTEGER NOT NULL DEFAULT 0,
    "bCount" INTEGER NOT NULL DEFAULT 0,
    "bcCount" INTEGER NOT NULL DEFAULT 0,
    "cCount" INTEGER NOT NULL DEFAULT 0,
    "dCount" INTEGER NOT NULL DEFAULT 0,
    "fCount" INTEGER NOT NULL DEFAULT 0,
    "totalStudents" INTEGER NOT NULL,
    "avgGPA" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "GradeDistribution_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "GradeDistribution_courseId_term_key" UNIQUE ("courseId", "term"),
    CONSTRAINT "GradeDistribution_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Review table
CREATE TABLE IF NOT EXISTS "Review" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::TEXT,
    "courseId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "instructorId" TEXT,
    "term" TEXT NOT NULL,
    "gradeReceived" TEXT,
    "contentRating" TEXT NOT NULL,
    "teachingRating" TEXT NOT NULL,
    "gradingRating" TEXT NOT NULL,
    "workloadRating" TEXT NOT NULL,
    "contentComment" TEXT,
    "teachingComment" TEXT,
    "gradingComment" TEXT,
    "workloadComment" TEXT,
    "overallComment" TEXT,
    "tips" TEXT,
    "hasHomework" BOOLEAN NOT NULL DEFAULT false,
    "hasMidterm" BOOLEAN NOT NULL DEFAULT false,
    "hasFinal" BOOLEAN NOT NULL DEFAULT false,
    "hasProject" BOOLEAN NOT NULL DEFAULT false,
    "hasQuiz" BOOLEAN NOT NULL DEFAULT false,
    "hasEssay" BOOLEAN NOT NULL DEFAULT false,
    "hasPresentation" BOOLEAN NOT NULL DEFAULT false,
    "status" "ReviewStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Review_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Review_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Review_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Create indexes for Review
CREATE INDEX IF NOT EXISTS "Review_courseId_status_createdAt_idx" ON "Review"("courseId", "status", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "Review_authorId_idx" ON "Review"("authorId");

-- Insert sample data
INSERT INTO "Course" ("id", "code", "name", "description", "credits", "department", "school", "level", "breadths", "genEds", "prerequisites", "avgGPA", "avgRating", "reviewCount")
VALUES
    ('cs577', 'CS 577', 'Introduction to Algorithms', 'Basic paradigm of algorithm analysis and design including divide and conquer, dynamic programming, greedy algorithms, graph algorithms, and NP-completeness.', 4, 'Computer Sciences', 'L&S', '500', '{"Natural Science"}', '{}', 'CS 240 or CS 252; and MATH 240 or MATH 320', 3.2, 4.1, 156),
    ('cs400', 'CS 400', 'Programming III', 'Object-oriented design and programming, abstract data types, algorithm design, data structures, and software engineering.', 3, 'Computer Sciences', 'L&S', '400', '{"Natural Science"}', '{}', 'CS 300', 3.4, 4.3, 234),
    ('math222', 'MATH 222', 'Calculus and Analytic Geometry 2', 'Techniques of integration, improper integrals, differential equations, Taylor polynomials, vectors and curves.', 4, 'Mathematics', 'L&S', '200', '{"Quantitative Reasoning A"}', '{}', 'MATH 221', 2.9, 3.8, 312),
    ('econ101', 'ECON 101', 'Principles of Microeconomics', 'Analysis of markets; supply and demand; consumer behavior; production and costs; competition and monopoly.', 4, 'Economics', 'L&S', '100', '{"Social Science"}', '{}', NULL, 3.1, 3.9, 445),
    ('cs540', 'CS 540', 'Introduction to Artificial Intelligence', 'Principles of knowledge-based search, game-playing, knowledge representation, machine learning, natural language understanding, and robotics.', 3, 'Computer Sciences', 'L&S', '500', '{"Natural Science"}', '{}', 'CS 300 and (MATH 340 or MATH 341 or MATH 375)', 3.3, 4.2, 189)
ON CONFLICT ("id") DO NOTHING;

-- Insert instructors
INSERT INTO "Instructor" ("id", "name", "email")
VALUES
    ('dieter', 'Dieter van Melkebeek', 'dieter@cs.wisc.edu'),
    ('beck', 'Gary Beck', 'gbeck@cs.wisc.edu'),
    ('deppeler', 'Deb Deppeler', 'deppeler@cs.wisc.edu'),
    ('jerry', 'Jerry Zhu', 'jerryzhu@cs.wisc.edu')
ON CONFLICT ("id") DO NOTHING;

-- Link courses and instructors
INSERT INTO "CourseInstructor" ("courseId", "instructorId")
VALUES
    ('cs577', 'dieter'),
    ('cs400', 'beck'),
    ('cs400', 'deppeler'),
    ('cs540', 'jerry')
ON CONFLICT ("courseId", "instructorId") DO NOTHING;

-- Insert grade distributions
INSERT INTO "GradeDistribution" ("id", "courseId", "term", "aCount", "abCount", "bCount", "bcCount", "cCount", "dCount", "fCount", "totalStudents", "avgGPA")
VALUES
    ('cs577-f24', 'cs577', '2024-Fall', 45, 38, 52, 28, 22, 8, 7, 200, 3.15),
    ('cs577-s24', 'cs577', '2024-Spring', 42, 35, 48, 32, 25, 10, 8, 200, 3.08),
    ('cs400-f24', 'cs400', '2024-Fall', 120, 85, 95, 45, 35, 15, 5, 400, 3.35),
    ('cs400-s24', 'cs400', '2024-Spring', 115, 90, 100, 50, 30, 10, 5, 400, 3.38),
    ('math222-f24', 'math222', '2024-Fall', 80, 70, 120, 90, 80, 40, 20, 500, 2.85),
    ('econ101-f24', 'econ101', '2024-Fall', 150, 120, 180, 100, 90, 40, 20, 700, 3.05),
    ('cs540-f24', 'cs540', '2024-Fall', 55, 45, 50, 25, 15, 5, 5, 200, 3.45)
ON CONFLICT ("id") DO NOTHING;

COMMIT;
