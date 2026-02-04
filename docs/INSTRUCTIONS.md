
# INSTRUCTIONS for WiscFlow Development

This document outlines the step-by-step execution plan for Claude Code to build the WiscFlow production application. Follow these phases sequentially.

## Phase 1: Foundation & Infrastructure
1.  **Init Next.js**: Initialize a new Next.js 14+ project with TypeScript, Tailwind, and ESLint.
    *   `npx create-next-app@latest wiscflow --typescript --tailwind --eslint`
2.  **Setup Database**:
    *   Initialize Prisma: `npx prisma init`.
    *   Copy the Schema from `CLAUDE.md` into `prisma/schema.prisma`.
    *   Set up a local PostgreSQL instance (or use Docker).
    *   Run `npx prisma migrate dev --name init`.
3.  **Authentication**:
    *   Install `next-auth@beta`.
    *   Configure Google Provider or Email Provider.
    *   **Crucial**: Add middleware to strictly allow only emails ending in `@wisc.edu`.

## Phase 2: Data Ingestion (The Scraper)
*Objective: Populate the empty database with real catalog data.*

1.  **Create Scripts**: Create a `scripts/` directory.
2.  **Catalog Scraper**:
    *   Write `scripts/scrape-catalog.ts` using `cheerio` or `puppeteer`.
    *   Target: `guide.wisc.edu`.
    *   Logic: Iterate through all subjects, fetch course details (Code, Name, Desc, Credits, Prereqs, Last Offered).
    *   **Prerequisite Parser**: Write a regex utility to find course codes in the prereq text and create the self-referential relations in Prisma.
3.  **Grade Distribution Ingest**:
    *   Write `scripts/ingest-grades.ts`.
    *   Source: Import public JSON data from `madgrades` (if available) or CSV exports.
    *   Map this data to the `GradeDistribution` model.

## Phase 3: Core UI Migration
*Objective: Port the React Prototype components to Next.js Server Components.*

1.  **Layout**:
    *   Migrate `App.tsx` structure to `app/layout.tsx`.
    *   Implement `Sidebar` as a global component.
2.  **Course List (`app/courses/page.tsx`)**:
    *   Make this a **Server Component**.
    *   Fetch courses via `prisma.course.findMany()`.
    *   Implement the Filters (Breadth, Level) as URL Search Params.
3.  **Course Detail (`app/courses/[courseId]/page.tsx`)**:
    *   Fetch course data + relations + grade distributions.
    *   Port the `DependencyMap` visualization.
    *   Port the `ReviewList` (initially empty state).

## Phase 4: Review & Interaction System
1.  **Review Submission Form (Crucial)**:
    *   Create a `ReviewForm` component (Client Component).
    *   **Inputs Required**: 
        *   Grade Received (A-F).
        *   **4-Grid Ratings**: Content, Teaching, Grading, Workload (A-F grading scale).
        *   **Specific Comments**: Each of the 4 dimensions must have its own comment text area.
        *   **Dynamic Colors**: The rating cards must change color (Green -> Red) based on the selected grade.
        *   **Assessments**: Checkbox grid for "Midterm", "Final", "Project", etc.
    *   **Optional Input**:
        *   **Course Resources Link**: A text field allowing URL input (placeholder: "Google Drive or Box link to notes/resources").
    *   Create a Server Action: `submitReview(formData)`.
    *   Validate strict typing before DB insertion.
2.  **Comment System**:
    *   Implement a threaded `Comment` model linked to `Review`.
    *   UI: Add an expandable "Comments" section under each review.
    *   Action: `addComment(reviewId, text)`.
3.  **Voting**:
    *   Implement "Helpful" button using optimistic UI updates.

## Phase 5: Advanced Features (The "North Star")
1.  **Transcript Upload**:
    *   Create a parser for the UW Madison unofficial transcript PDF (text extraction).
    *   Securely store parsed grades into `StudentCourseHistory`.
2.  **GPA Predictor Widget**:
    *   On the Course Detail page, check if user has `StudentCourseHistory`.
    *   If yes, run the prediction algorithm (defined in `CLAUDE.md`) and display a "Predicted Grade" badge with a confidence interval.

## Execution Rules
*   **Do not** verify code by running it unless explicitly asked.
*   **Do not** introduce mock data files. Use seed scripts if necessary for local dev testing, but keep them separate.
*   **Style**: Maintain the "WiscFlow" clean aesthetic defined in the prototype.