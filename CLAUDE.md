# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Work Restriction
Claude Code can only work in WISFLOW folder, any operation outside is not permitted.

## Project Overview

**WiscFlow** - UW Madison Course Review & Academic Planning Platform
**Status:** React SPA Prototype transitioning to Next.js 14+ Production App
**Domain Restriction:** @wisc.edu emails only

## Development Commands

### Current (Vite/React Prototype)
```bash
npm install          # Install dependencies
npm run dev          # Start development server on port 3000
npm run build        # Build production bundle
npm run preview      # Preview production build
```

### Future (After Next.js Migration)
```bash
# Database
npx prisma migrate dev     # Run database migrations
npx prisma studio          # Open database GUI
npx prisma db seed         # Seed database (when implemented)

# Development
npm run dev                # Start Next.js dev server
npm run build              # Build for production
npm run start              # Run production server
npm run lint               # Run ESLint
```

## Architecture & Code Structure

### Current Frontend Architecture
- **Build Tool:** Vite with React 19.2
- **Entry Points:** `index.html` → `index.tsx` → `App.tsx`
- **Routing:** Client-side state management (no React Router)
- **State:** Local component state with props drilling
- **Styling:** Tailwind CSS via CDN with custom theme

### Component Hierarchy
```
App.tsx (Main container - 286 lines)
├── Logo.tsx (UW Ribbon branding)
├── Sidebar.tsx (Navigation - 135 lines)
├── Dashboard.tsx (Overview page - 150+ lines)
├── CourseList.tsx (Catalog with filters - 150+ lines)
├── CourseDetail.tsx (Single course view - 250+ lines)
│   └── Badge.tsx (Grade/status badges)
└── ReviewForm.tsx (4-grid rating system - 250+ lines)
```

### Key Features in Components

**CourseDetail.tsx:**
- Course dependency visualization (Prerequisites → Current → Unlocks)
- 4-dimensional rating system display
- Review list with nested comments
- Instructor expand/collapse list

**ReviewForm.tsx:**
- **4-Grid Rating System** (Content, Teaching, Grading, Workload)
- Each dimension has dedicated comment area
- Dynamic grade color backgrounds (Green→Yellow→Red)
- Assessment type checkboxes
- Resource link field

### Type System (`types.ts`)
- `GradeType` enum: A, AB, B, BC, C, D, F
- `Course` interface: Complete course metadata
- `Review` interface: 4-dimensional ratings with comments
- `Comment` interface: Nested discussion threads
- Full TypeScript strict mode enforcement

## Design System

### Brand Colors
```css
/* Primary */
--uw-red: #c5050c;
--uw-light: #d93036;
--uw-dark: #9b0000;

/* Grade Colors */
--grade-a: rgb(34, 197, 94);   /* green-500 */
--grade-ab: rgb(74, 222, 128); /* green-400 */
--grade-b: rgb(59, 130, 246);  /* blue-500 */
--grade-bc: rgb(96, 165, 250); /* blue-400 */
--grade-c: rgb(250, 204, 21);  /* yellow-400 */
--grade-d: rgb(251, 146, 60);  /* orange-400 */
--grade-f: rgb(239, 68, 68);   /* red-500 */
```

### UI Patterns
- Font: Inter (Google Fonts)
- Shadows: `shadow-sm`, `shadow-soft`
- Borders: `border-slate-200`
- Corners: `rounded-lg`, `rounded-xl`
- Spacing: Generous whitespace
- Mobile-first responsive design

## Database Schema (Target State)

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique // Must end with @wisc.edu
  name          String?
  role          UserRole  @default(STUDENT)
  reviews       Review[]
  comments      Comment[]
  votes         Vote[]
  savedCourses  SavedCourse[]
  transcript    StudentCourseHistory[]
  createdAt     DateTime  @default(now())
}

model Course {
  id            String   @id @default(cuid())
  code          String   @unique // "CS 577"
  name          String
  description   String   @db.Text
  credits       Int
  schoolId      String
  school        School   @relation(fields: [schoolId], references: [id])

  // Prerequisites
  prerequisiteText String?
  prerequisites    Course[] @relation("CoursePrereqs")
  prerequisiteFor  Course[] @relation("CoursePrereqs")

  // Attributes
  breadths      String[]
  genEds        String[]
  level         String

  // Stats
  avgGPA        Float?
  avgRating     Float?

  reviews       Review[]
  instructors   Instructor[]
  gradeDistributions GradeDistribution[]
  lastOffered   String?
  updatedAt     DateTime @updatedAt
}

model Review {
  id            String   @id @default(cuid())
  term          String
  title         String?
  gradeReceived Grade

  // 4-Dimensional Ratings (A-F scale)
  contentRating  String
  teachingRating String
  gradingRating  String
  workloadRating String

  // Dimension Comments
  contentComment  String? @db.Text
  teachingComment String? @db.Text
  gradingComment  String? @db.Text
  workloadComment String? @db.Text

  assessments   String[]
  tags          String[]
  resourceLink  String?

  instructorId  String
  instructor    Instructor @relation(fields: [instructorId], references: [id])
  courseId      String
  course        Course   @relation(fields: [courseId], references: [id])
  authorId      String
  author        User     @relation(fields: [authorId], references: [id])

  likes         Vote[]
  comments      Comment[]
  createdAt     DateTime @default(now())
}
```

## Migration Roadmap

### Phase 1: Next.js Foundation
- Initialize Next.js 14+ with TypeScript, Tailwind, ESLint
- Setup Prisma with PostgreSQL
- Configure NextAuth.js with @wisc.edu restriction

### Phase 2: Data Ingestion
- Scrape course catalog from guide.wisc.edu
- Import grade distributions from madgrades
- Build prerequisite parser for course relationships

### Phase 3: UI Migration
- Convert components to Server Components (default)
- Use Client Components only for interactivity
- Implement URL-based filtering

### Phase 4: Review System
- 4-grid rating form with dimension comments
- Server Actions for review submission
- Threaded comments with optimistic updates

### Phase 5: Advanced Features
- Transcript upload and parsing
- GPA prediction algorithm
- Course recommendation engine

## Critical Implementation Notes

### Mock Data Policy
- **ALL mock data in `constants.ts` must be discarded**
- Database is the single source of truth
- Use seed scripts for development only

### Component Guidelines
- Server Components by default
- Client Components only when needed
- No heavy UI libraries (MUI/AntD)
- Build with Tailwind primitives

### Authentication Requirements
- Strict @wisc.edu email validation
- Middleware enforcement
- Default role: STUDENT

### API Design (Future)
- `/api/courses` - Course catalog with filters
- `/api/courses/[id]` - Course detail with relations
- Server Actions for mutations (reviews, comments, votes)

## External Resources
- Course Catalog: guide.wisc.edu
- Grade Data: madgrades.com
- UW Brand Guidelines: brand.wisc.edu

## Environment Variables Required
```
# Current
GEMINI_API_KEY=xxx

# Future (Next.js)
DATABASE_URL=postgresql://...
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
```