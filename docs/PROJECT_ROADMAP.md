# WiscFlow Project Roadmap

**Last Updated**: 2026-02-04 02:45 CST  
**Current Phase**: Phase 2 - Core Feature Enhancement  
**Next Step**: User Incentive System (frosted glass + contributor levels)

## 🎯 Project Vision

A modern course review platform designed for UW-Madison students to make informed course selection decisions.

---

## ✅ Completed Features (Phase 1)

### 1. Infrastructure
- [x] Next.js 15 + TypeScript project setup
- [x] Prisma ORM database configuration
- [x] PostgreSQL database connection
- [x] Tailwind CSS styling system
- [x] Project file structure optimization

### 2. Authentication System
- [x] NextAuth.js v5 integration
- [x] Google OAuth login
- [x] UW-Madison email verification (@wisc.edu)
- [x] Session management
- [x] Login/signup pages
- [x] User profile page

### 3. Database Models
- [x] User
- [x] School
- [x] **Department** ⭐ Added 2026-02-03
- [x] Course
- [x] Instructor
- [x] Review
- [x] Comment
- [x] Vote
- [x] GradeDistribution
- [x] **CourseDepartment (Many-to-Many)** ⭐ Added 2026-02-03

### 4. Data Import
- [x] **School data seeding script** (23 schools) ✅
- [x] **CSV course data parser** ✅
- [x] **Batch course import script** (4,787 courses) ✅
- [x] Relationship data (prerequisites) handling
- [ ] Department data import ⏳ Pending

### 5. Course Browsing
- [x] Course list page (/courses)
  - Search by course code and name
  - School filter
  - Display basic course info
  - Review count statistics
  - Average GPA display
- [x] Course detail page (/courses/[id])
  - Complete course information
  - Grade distribution charts
  - Prerequisite relationships
  - Breadth requirements display
  - Student reviews list

### 6. Review System
- [x] Review form component (ReviewForm)
  - Four-dimensional rating (content, teaching, grading, workload)
  - Detailed comment input
  - Grade received tracking
  - Semester selection
  - Instructor selection
  - Assessment method tags
  - Course resource links
- [x] Review display cards
  - Rating visualization
  - Categorized comments display
  - Vote functionality
  - Comment functionality

### 7. Interactive Features
- [x] Vote system (VoteButton)
- [x] Comment system (CommentSection)
- [x] Real-time comment updates

### 8. UI/UX
- [x] Responsive design
- [x] Navigation bar and menus
- [x] Logo component
- [x] User menu (login/logout)
- [x] Guest menu
- [x] Error handling pages

---

## 🚧 Current Progress (2026-02-04)

### ✅ Phase 1 — COMPLETE
- ✅ PostgreSQL Migration (SQLite → Neon)
- ✅ tRPC Integration (all Server Actions migrated)
- ✅ Full-text Search (tsvector + GIN index)
- ✅ Redis Caching (Upstash, graceful degradation)
- ✅ Department Data (209 departments, 10,174 course-dept links)
- ✅ Course Data Expansion (4,787 → 10,174 courses)
- ✅ Alias Search (60+ alias groups, CS↔COMP SCI)
- ✅ Left Sidebar Filters (school/dept/level/credits/sort, multi-select)
- ✅ School Hierarchy (College>School>Dept)
- ✅ Cross-listed Courses (1,368 groups)
- ✅ Department Filter Fix + Pagination (30/page)

### 🔄 Phase 2 — In Progress
- [ ] **User Incentive System** (review-gated access + contributor levels) 🔥
- [ ] Advanced search (instructor, semester, GPA range)
- [ ] Review management (edit, delete, report)
- [ ] Instructor pages
- [ ] User dashboard
- [ ] Mobile responsiveness

---

## 🔜 Next Steps (Phase 2)

### Priority 1: Core Feature Enhancement

#### 1. Advanced Search and Filtering
- [ ] Advanced search features
  - Search by instructor
  - Search by semester
  - Filter by GPA range
  - Filter by course level (Elementary/Intermediate/Advanced)
- [ ] Search result sorting
  - By relevance
  - By GPA
  - By review count
  - By latest review date

#### 2. User Incentive System 🔥 NEW
- [ ] Review-gated access (frosted glass blur for non-contributors)
- [ ] 1-review minimum to unlock all reviews platform-wide
- [ ] Contributor level system (Reader → Contributor → Active → Trusted → Expert → Legend)
- [ ] Level badges displayed on reviews and profiles
- [ ] Seasonal engagement boosts (enrollment period XP multipliers)
- See: [docs/INCENTIVE_SYSTEM.md](INCENTIVE_SYSTEM.md)

#### 3. Review System Enhancement
- [ ] Review editing (users can edit their own reviews)
- [ ] Review deletion (users can delete their own reviews)
- [ ] Review reporting system (report inappropriate content)
- [ ] Review verification badge (verified course enrollment)
- [ ] Image upload (course notes, assignment samples)

#### 3. Instructor Pages
- [ ] Instructor list page (/instructors)
- [ ] Instructor detail page (/instructors/[id])
  - All courses taught by instructor
  - Average teaching rating
  - Student review aggregation
  - Rating trend charts

#### 4. User Dashboard
- [ ] My reviews list
- [ ] My saved courses
- [ ] My course plan (Course Planner)
- [ ] Personal statistics
- [ ] Personalized recommendations

---

## 🎨 UX Optimization (Phase 3)

### 1. Visualization Enhancement
- [ ] Interactive grade distribution charts (Chart.js or Recharts)
- [ ] Rating trend timeline
- [ ] Prerequisite relationship graph visualization
- [ ] School course map

### 2. Responsive Optimization
- [ ] Mobile optimization
- [ ] Tablet adaptation
- [ ] Touch gesture support
- [ ] Dark mode

### 3. Performance Optimization
- [ ] Image lazy loading
- [ ] Virtual scrolling (long lists)
- [ ] Server-side caching
- [ ] CDN for static assets
- [ ] Database query optimization (indexing)

---

## 🚀 Advanced Features (Phase 4)

### 1. AI-Powered Features
- [ ] AI review summaries
- [ ] Smart course recommendations
- [ ] Schedule conflict detection
- [ ] Credit planning assistant

### 2. Community Features
- [ ] User follow system
- [ ] Study group creation
- [ ] Course discussion forums
- [ ] Direct messaging

### 3. Data Analytics
- [ ] Course popularity rankings
- [ ] Instructor rating rankings
- [ ] Semester trend analysis
- [ ] Major course statistics

### 4. Notification System
- [ ] New review notifications
- [ ] Comment reply notifications
- [ ] Course update notifications
- [ ] Email subscription

---

## 🔐 Admin Portal (Phase 5)

### 1. Admin Features
- [ ] User management (ban, permissions)
- [ ] Review moderation
- [ ] Course data management
- [ ] Report handling
- [ ] System log viewer

### 2. Data Import Tools
- [ ] CSV batch import interface
- [ ] Semester course auto-sync
- [ ] Instructor info updates
- [ ] Grade distribution data import

---

## 📊 Data Requirements

### Current Data Status
- ✅ School data (imported)
- ✅ Partial course data (imported via CSV)
- ⏳ Complete course catalog
- ⏳ Instructor information
- ⏳ Historical grade distributions
- ⏳ Prerequisite relationships (partial)

### Data Acquisition Plan
1. **Official Data Sources**
   - UW-Madison Course Guide API (if available)
   - Madgrades.com data (grade distributions)
   - RateMyProfessors data (instructor ratings reference)

2. **User-Generated Content**
   - Student-submitted reviews
   - Course resource sharing
   - Notes and study materials

---

## 🛠 Tech Stack Planning

### Current Tech Stack
- **Frontend**: Next.js 15, React, TypeScript
- **Styling**: Tailwind CSS, Lucide Icons
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Auth**: NextAuth.js v5
- **Deployment**: TBD (Vercel recommended)

### Recently Added
- **tRPC**: End-to-end type-safe API ✅
- **React Query**: Server state management ✅
- **Redis**: Upstash caching layer ✅
- **Full-text Search**: PostgreSQL tsvector ✅

### Planned Additions
- **Charts**: Recharts or Chart.js
- **Forms**: React Hook Form + Zod
- **State Management**: Zustand (if needed)
- **File Upload**: Uploadthing or AWS S3
- **Email**: Resend or SendGrid
- **Analytics**: Vercel Analytics
- **Monitoring**: Sentry

---

## 📅 Timeline Estimates

### Short-term Goals (1-2 weeks)
- [ ] Complete search and filter enhancements
- [ ] Implement review edit/delete functionality
- [ ] Create basic instructor pages
- [ ] User dashboard core features

### Mid-term Goals (1 month)
- [ ] Complete UI/UX optimization
- [ ] Implement performance optimizations
- [ ] Full mobile adaptation
- [ ] Complete data import

### Long-term Goals (2-3 months)
- [ ] Launch AI features
- [ ] Complete community features
- [ ] Develop admin portal
- [ ] Official Beta release

---

## 🎓 Success Metrics

### User Metrics
- Registered users > 1,000
- Monthly active users > 500
- User retention rate > 60%

### Content Metrics
- Course reviews > 5,000
- Course coverage > 80% of popular courses
- Average reviews per course > 5

### Quality Metrics
- Page load time < 2s
- Mobile experience score > 90
- User satisfaction > 4.5/5

---

## 📝 Notes

- All features require user testing
- Prioritize data security and privacy
- Comply with UW-Madison policies
- Regularly collect user feedback and iterate

---

**Next Update**: After completing Phase 2 initial features
