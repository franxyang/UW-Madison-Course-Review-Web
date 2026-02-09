# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [0.6.0-dev] - 2026-02-08

### Added

- **Cross-list aware review consistency layer**
  - `course.byId` now reads reviews, instructors, and GPA distributions across the entire `crossListGroup`
  - cross-listed grade rows are deduplicated at read time to prevent double-counting
  - fallback weighted `avgGPA` is computed from merged distributions when alias course records are empty
- **Cross-list duplicate guard for reviews**
  - `review.create` duplicate check now scopes to all course IDs in the same cross-list group
  - `review.update` instructor-change path now blocks cross-listed duplicates
- **Course level reconciliation tooling**
  - Added `scripts/reconcileCourseLevels.ts`
  - Added `npm run reconcile:course-levels` command

### Changed

- **Course recommendation reliability**
  - `sameDepartment` now derives course level from parsed course code (primary source), with `Course.level` only as fallback
- **Madgrades backfill level mapping**
  - fixed level threshold bug in `scripts/backfillFromMadgrades.ts` (`<500` for Intermediate, not `<700`)
- **Review pipeline instructor resolution**
  - instructor alias matching now supports cross-list course scopes for better manual-input matching

### Fixed

- **System-wide 500-level classification drift**
  - Reconciled `939` courses previously misclassified as `Intermediate` and corrected to `Advanced`
- **Cross-listed visibility split**
  - Example issue (`MATH 525` vs `I SY E 525`) resolved at query layer so term/instructor/review data is shared consistently

### Documentation

- Updated `README.md`, `PROGRESS.md`, and `docs/README.md` to reflect AGPL, data integrity stabilization work, and operational scripts.

## [0.5.2-dev] - 2026-02-06

### Added — Phase 3 UX Enhancements

#### Course Detail Page 3-Column Layout
- **Three-column redesign** (`5454fc8`): Left navigation + main content + right overview
- **Term/Instructor in-page filters**: Real-time review filtering without page reload
- **Department navigation improvements**: Smart course number display, consistent formatting

#### Homepage Redesign
- **More informative layout** (`caae165`): Stats section with Departments count
- **Mini calendar widget** (`e187b9e`): Current date display
- **Removed ad-like elements**: Cleaner, more professional appearance

#### ReviewForm UX
- **Real-time gradient background** (`c113c29`): Background color responds to rating input
- **Term format fix** (`cb4bdb2`): Corrected to YYYY-Season format matching database
- **Review card styling** (`e4e450d`): Improved visual hierarchy

### Changed — Documentation Reorganization

#### Merged Progress Documents
- **PROGRESS.md** (root): Now the single source of truth for current status
  - Added: Timeline & Goals section
  - Added: Success Metrics table
  - Added: Tech Stack Planned Additions
  - Added: Deployment Checklist
- **docs/ROADMAP.md** (new): Future planning document
  - Phase 4: Advanced Features (AI, community, analytics, notifications)
  - Phase 5: Admin Portal (moderation, data management)
  - Phase 6: GPA Prediction ML (experimental)
  - Data Requirements & Acquisition Plan
  - Commit Strategy guidelines

#### Removed Duplicate Documents
- `docs/PROJECT_ROADMAP.md` → Merged into PROGRESS.md + docs/ROADMAP.md
- `docs/DEVELOPMENT_PLAN.md` → Merged into PROGRESS.md + docs/ROADMAP.md

### Fixed
- **Department navigation** (`42f452d`, `0ed9a1b`): Correct school name mapping, improved layout
- **Course grid display** (`5df0465`, `0762e93`): Show only course number, smart length-based display
- **Same department format** (`6ef31e6`): Consistent formatting within department views
- **GPA=0 display** (5 locations): Proper handling of missing GPA data

#### Document Responsibilities
| Document | Purpose |
|----------|---------|
| `PROGRESS.md` | Current status, statistics, recent commits |
| `docs/ROADMAP.md` | Future phases, planning, vision |
| `docs/PHASE3_PROGRESS.md` | Phase 3 UX details (unchanged) |

---

## [0.5.0-dev] - 2026-02-04

### Added — Phase 3: UX Optimization (In Progress)

#### Color System Overhaul
- **配色方案确定（方案 C）**: uwcourses 极简 + USTSPACE 柔和
- **Tailwind Config 重构**: `wf-crimson`, `surface`, `text`, `grade` 色系
- **全局样式更新**: `.card`, `.btn-*`, `.grade-badge-*` 预设类
- **配色文档**: `docs/COLOR_SYSTEM.md`

#### Course List Page Redesign
- Pure white background + UW crimson accents
- Dynamic GPA coloring (5-level gradient: emerald → amber → orange → red)
- Softened level badges (pastel backgrounds + borders)
- Unified `.card` component styling
- `transition-colors` on all interactions

---

## [0.4.0-dev] - 2026-02-04

### Added — Phase 2: Core Features

#### User Incentive System
- **Review-Gated Access** (`ecf5055`): Frosted glass blur on reviews for non-contributors
  - 1 visible review (highest-voted), rest blurred with `backdrop-filter: blur(6px)`
  - Unlock CTA with sign-in or write-review prompts
  - Backend: `reviewAccess { hasFullAccess, userReviewCount, totalReviews }` in course.byId
- **Contributor Level System** (`b3230d5`): 6-tier progression
  - Levels: Reader → Contributor (1 review) → Active (5) → Trusted (15+10 upvotes) → Expert (30+50) → Legend (50+100)
  - XP rewards: +50 per review, +10 per upvote received, +100 bonus for first review on a course
  - Enrollment season bonus (Nov/Apr): +25 XP
  - Badges displayed on review cards via `ContributorBadge` component
  - DB: `level`, `xp`, `title` fields on User model

#### Review Management
- **Review Edit/Delete** (`cf867b2`): Users can manage their own reviews
  - `review.update` mutation: partial update with ownership verification
  - `review.delete` mutation: cascading delete (votes → comments → review), level recalculation
  - `ReviewActions` component: dropdown menu with delete confirmation modal
- **Review Reporting** (`cf846d7`): Report inappropriate reviews
  - `Report` model: reason (spam/offensive/irrelevant/misinformation/other), details, status
  - Unique constraint per reporter+review; can't report own reviews
  - `ReportButton` component: radio-select modal with success feedback

#### Advanced Search & Filtering
- **GPA Range Filter** (`371b0b5`): Filter courses by min/max average GPA
- **Instructor Search** (`371b0b5`): Filter courses by instructor name (ILIKE)
- Both filters work in full-text search and standard Prisma query paths
- FilterPanel UI: GPA dropdown selects + instructor text input + active filter chips

#### Instructor Pages
- **Instructor List** (`f4a86db`): `/instructors` with search, sort (name/reviews/courses), pagination
  - Avatar initials, course count, review count per instructor
- **Instructor Detail** (`f4a86db`): `/instructors/[id]`
  - 4-dimension average ratings (Content/Teaching/Grading/Workload)
  - Courses taught sidebar with GPA and review counts
  - Student reviews with compact ratings and preview text
- New tRPC router: `instructor.list`, `instructor.byId`

#### User Dashboard
- **Enhanced Profile** (`e18e14d`): Complete rewrite of `/profile`
  - Contributor level badge + progress bar + XP tracker
  - Stats grid: reviews, upvotes (real data), comments, saved courses
  - All reviews list with compact ratings and vote counts
  - Contributor level ladder showing all 6 tiers
  - Saved courses sidebar with GPA and credits

#### Mobile Responsiveness
- **Mobile Navigation** (`ecff1d2`): Hamburger menu → slide-over panel
  - Nav links with active state, user info, sign-in CTA
- **Mobile Filters** (`ecff1d2`): Filter button → slide-over FilterPanel
  - Active filter count badge
- **Responsive Grids**: Profile stats 2-col mobile → 4-col desktop

### Changed
- Reviews sorted by vote count (highest first) in course detail
- Navigation updated across all pages to include Instructors link
- `useSearchParams` wrapped in Suspense boundary (build fix)

### Database Migrations
- `20260204095105_add_user_level_xp`: User.level, User.xp, User.title
- `20260204100000_fix_indexes`: Restore searchVector GIN + School.parentId indexes
- `20260204095623_add_report_model`: Report table with unique constraint

---

## [0.3.0-dev] - 2026-02-04

### Added — Phase 1: Infrastructure

- **tRPC Integration**: End-to-end type-safe API layer
  - Course Router: list, byId, getSchools, getDepartments, search
  - Review Router: create (with instructor auto-create), vote
  - Comment Router: create, delete
  - SessionProvider + tRPC Provider + React Query
- **Full-text Search**: PostgreSQL tsvector with GIN index
  - Weighted search (code/name = A, description = B)
  - Auto-update trigger on Course changes
  - Autocomplete/prefix matching endpoint
  - All 10,174 courses indexed
- **Redis Caching**: Upstash Redis with graceful degradation
  - Generic `cached()` wrapper with TTL
  - Cache invalidation utilities
- **Department Data**: 209 departments, 10,174 course-dept links, 1,368 cross-listed groups
- **Course Data Expansion**: 4,787 → 10,174 courses
- **Alias Search**: 60+ alias groups (CS ↔ COMP SCI)
- **Left Sidebar Filters**: School/Dept/Level/Credits/Sort with multi-select
- **School Hierarchy**: College > School > Dept (type + parentId)
- **Pagination**: 30 per page with page controls
- **Loading States**: Skeleton UI for course list and detail pages
- **Optimistic UI**: Instant feedback for votes and comments

### Changed
- Migrated all API calls from Server Actions to tRPC
- Migrated pages to Client Components with tRPC hooks
- Organized documentation into docs/ folder

### Removed
- Old Server Actions (backed up to backup/old-actions/)

---

## [Unreleased]

### Planned
- tRPC integration for end-to-end type safety
- PostgreSQL full-text search implementation
- Redis caching layer
- Complete filter functionality

---

## [0.2.0] - 2026-02-03

### 🎉 Added

#### Database
- **PostgreSQL Migration Complete**
  - Migrated from SQLite to Neon PostgreSQL (Serverless)
  - Connection: `postgresql://...@ep-jolly-haze-...-pooler.c-2.us-east-2.aws.neon.tech/neondb`
  - Region: US East (Ohio)
  - Free tier: 0.5GB storage, unlimited bandwidth

- **Department Model**
  - Added `Department` table
  - Added `CourseDepartment` many-to-many relationship table
  - Supports courses belonging to multiple departments
  ```prisma
  model Department {
    id        String   @id @default(cuid())
    code      String   @unique     // "COMP SCI", "MATH"
    name      String                // "Computer Sciences"
    schoolId  String
    school    School   @relation(...)
    courses   CourseDepartment[]
  }
  ```

- **Data Import**
  - 23 schools ✅
  - 4,787 courses ✅
  - CSV source: `madgrades-extractor-master/src/main/resources/aefis_courses.csv`

#### Documentation System
- **docs/ folder structure**
  - All technical documentation moved to `docs/`
  - Created `docs/README.md` as documentation index
  - Created `docs/SESSION_SUMMARY_2026-02-03.md` for session summary
  
- **New technical documents**
  1. `PRODUCT_DESIGN.md` - Complete product design
  2. `PROJECT_ROADMAP.md` - Project roadmap
  3. `TECH_UPGRADE_PLAN.md` - Technical architecture upgrade plan
  4. `EVALUATION_REPORT.md` - Design vs. code evaluation
  5. `SUPABASE_VS_NEON.md` - Database provider comparison
  6. `MIGRATION_CHECKLIST.md` - Migration execution checklist
  7. `MIGRATION_COMPLETED.md` - Migration completion report (sanitized)
  8. `FILTER_IMPLEMENTATION.md` - Filter feature implementation plan

- **Progress tracking system**
  - `PROGRESS.md` - Development progress tracker
  - `CHANGELOG.md` - Version history (this file)
  - `.ai-context/` - AI context persistence folder

#### Utility Scripts
- `scripts/check-sensitive-info.sh` - Sensitive information checker
- `scripts/checkCourseCount.ts` - Course count validator

### 🔧 Changed

#### Prisma Schema
- **datasource change**
  ```diff
  datasource db {
  - provider = "sqlite"
  + provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```

- **Data type optimizations**
  - `Course.description`: `String` → `String @db.Text`
  - `Course.prerequisiteText`: `String?` → `String? @db.Text`
  - All `Review` comment fields: `String?` → `String? @db.Text`
  - `Comment.text`: `String` → `String @db.Text`

- **Relationship updates**
  - `Course` added `departments` relation
  - `School` added `departments` relation

#### Environment Variables
- Updated `.env` with PostgreSQL connection string
- Updated `.env.local` with PostgreSQL connection string
- **Note**: Ensured `.env*` is in `.gitignore` ✅

### 🗃️ Database Migrations

#### Migration 1: `20260204050718_init_postgresql`
**Purpose**: Initialize PostgreSQL database structure

**Changes**:
- Created all tables (User, School, Course, Review, Comment, Vote, Instructor, GradeDistribution, etc.)
- Applied PostgreSQL-specific data types
- Created all indexes and foreign key constraints

**Executed**: 2026-02-03 23:07:18  
**Status**: ✅ Success

#### Migration 2: `20260204052057_add_departments`
**Purpose**: Add Department model and many-to-many relationship

**Changes**:
- Created `Department` table
- Created `CourseDepartment` junction table
- Added foreign key constraints to School
- Added index on `Department(schoolId)`

**Executed**: 2026-02-03 23:20:57  
**Status**: ✅ Success

### 🐛 Fixed

1. **Null array errors in course detail page**
   - **Issue**: `course.breadths.length` throws error when breadths is null
   - **Fix**: Added null check `course.breadths && course.breadths.length > 0`
   - **File**: `app/courses/[id]/page.tsx`
   - **Affected fields**: `breadths`, `assessments`

2. **PostgreSQL Advisory Lock timeout**
   - **Issue**: `prisma migrate` timeout on advisory lock
   - **Cause**: dev server holding database connection
   - **Solution**: kill dev server process and retry

### 📚 Documentation

#### Security and Privacy
- **Sensitive information sanitization**
  - `MIGRATION_COMPLETED.md` real connection strings removed
  - Created check script to prevent leaks
  - Examples in docs use placeholders

- **GitHub upload guide**
  - `docs/README.md` contains complete upload checklist
  - Marked which docs are safe to upload
  - Provided sanitization examples

#### AI Context Persistence
- **Session summary**: `docs/SESSION_SUMMARY_2026-02-03.md`
  - Records all work in this session
  - Includes decision rationale and problem-solving process
  - Facilitates context recovery after model compaction

### ⚡ Performance

#### Current Performance Baseline
- **Search speed**: ~300-500ms (LIKE queries)
- **Page load**: ~500-800ms
- **Database**: PostgreSQL Serverless (has cold starts)

#### Planned Optimizations
- PostgreSQL full-text search → target <100ms
- Redis caching → target cache hits <20ms
- React Query caching → reduce redundant requests

---

## [0.1.0] - 2026-02-01 ~ 2026-02-02

### 🎉 Added

#### Infrastructure
- **Next.js 15 project initialization**
  - App Router
  - TypeScript
  - Tailwind CSS
  
- **Prisma ORM configuration**
  - SQLite database (initial)
  - Complete schema design
  - Migrations setup

- **NextAuth.js authentication**
  - Google OAuth Provider
  - Session management
  - UW Madison email verification

#### Core Features
- **Course system**
  - Course list page (`/courses`)
  - Course detail page (`/courses/[id]`)
  - Basic search functionality
  - School filter

- **Review system**
  - Review form component
  - Four-dimensional rating (content/teaching/grading/workload)
  - Review display cards
  - Vote functionality (VoteButton)
  - Comment functionality (CommentSection)

- **Data visualization**
  - Grade distribution bar charts
  - Rating statistics
  - Prerequisite relationships display (simple list)

#### UI Components
- Logo component
- UserMenu / GuestMenu
- ReviewForm
- VoteButton
- CommentSection
- CourseDetail
- CourseList

### 🔧 Changed

#### Initial Data Models
```prisma
- User (authenticated users)
- School (schools/colleges)
- Course (courses)
- Instructor (instructors)
- Review (reviews)
- Comment (comments)
- Vote (votes)
- GradeDistribution (grade distributions)
- SavedCourse (saved courses)
- StudentCourseHistory (student course history)
```

### 📝 Notes

- Initial version uses SQLite, prepared for future PostgreSQL migration
- Review system is entirely user-generated, no seed data
- All OAuth configurations managed through environment variables

---

## Version Definitions

### Version Format: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes or major architectural changes
- **MINOR**: New features, backward compatible
- **PATCH**: Bug fixes and minor improvements

### Current Version: `0.2.0`
- `0.x.x`: Development phase, not released
- `1.0.0`: First public Beta release (target: 3-4 weeks)

---

## Commit Message Convention

We use [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code formatting (no functional changes)
- `refactor`: Code refactoring (neither new features nor bug fixes)
- `perf`: Performance optimization
- `test`: Test-related changes
- `chore`: Build process or auxiliary tool changes
- `ci`: CI configuration changes
- `build`: Build system or external dependency changes

### Example
```bash
feat(database): migrate to PostgreSQL from SQLite

- Set up Neon PostgreSQL database
- Update Prisma schema for PostgreSQL
- Migrate all data (23 schools, 4787 courses)
- Add @db.Text annotations for long text fields

BREAKING CHANGE: SQLite no longer supported
```

---

## Contributing Guidelines

### Development Workflow
1. Create feature branch from `main`
2. Develop and test
3. Update `PROGRESS.md` and `CHANGELOG.md`
4. Submit PR and wait for review
5. Auto-deploy after merge

### Pre-commit Checklist
- [ ] Code passes ESLint
- [ ] TypeScript has no errors
- [ ] Tests pass
- [ ] `PROGRESS.md` updated
- [ ] `CHANGELOG.md` updated
- [ ] Sensitive information checked (run `check-sensitive-info.sh`)

---

**Maintainer**: Franx (franxyixx)  
**AI Assistant**: Claude (Clawdbot)  
**Last Updated**: 2026-02-06 20:00 CST
