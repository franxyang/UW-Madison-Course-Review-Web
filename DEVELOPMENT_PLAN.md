# WiscFlow Development Plan
**Date**: 2026-02-03  
**Status**: Phase 1 in progress

## ✅ Phase 1A: Database & Infrastructure - COMPLETE

**Completed**: 2026-02-03

- [x] PostgreSQL@16 installation via Homebrew
- [x] Next.js 15 setup with TypeScript
- [x] Prisma schema design (23 models)
- [x] Database migration successful
- [x] Seed script execution (10,174 courses, 23 schools)
- [x] Course listing & detail pages working
- [x] Component structure established
- [x] Test user created (test@wisc.edu)

**Commits**: 
- `90d776b` - [P1A] Database: PostgreSQL setup with 10k+ courses

---

## ✅ Phase 1B: Authentication System - COMPLETE

**Completed**: 2026-02-03

- [x] Login/Register pages created with UW branding
- [x] UserMenu component with dropdown
- [x] GuestMenu component (Sign In / Sign Up buttons)
- [x] NextAuth configuration with @wisc.edu validation
- [x] Middleware protection for /api/reviews routes
- [x] Session management in course pages
- [x] Avatar with initials fallback

**Commits**:
- `2f63f27` - [P1B] Auth: Login/Signup UI and NextAuth configuration

---

## ✅ Phase 2A: Review System - COMPLETE

**Completed**: 2026-02-03

- [x] Review submission with Server Actions
- [x] Zod validation schema
- [x] Toast notifications (Sonner)
- [x] Voting system with optimistic UI
- [x] Comment threading
- [x] Delete own comments
- [x] Duplicate review prevention
- [x] Full authentication integration

**Commits**:
- `6bac3cb` - [P2A] Review: Server Actions and Toast notifications
- `6d819ac` - [P2A] Voting: Implement upvote system with optimistic UI
- `3649048` - [P2A] Comments: Interactive comment system with auth

---

## ✅ Phase 2B: OAuth Configuration - COMPLETE

**Completed**: 2026-02-04

- [x] Google OAuth Client ID/Secret configured
- [x] NEXTAUTH_SECRET generated
- [x] Callback URLs configured
- [x] @wisc.edu domain restriction (hd parameter)
- [x] OAuth buttons activated on signin/signup pages
- [x] Link-based OAuth flow (fixed CSRF issue)

**Commits**:
- `f2ca1ef` - [P2B] OAuth: Google Sign-In configuration complete

---

## 🔄 Phase 2C: UI/UX Enhancements - IN PROGRESS

### Visual Improvements
1. **Loading States**
   - Skeleton screens for course list
   - Spinner for form submissions
   - Progressive loading indicators

2. **Error Handling**
   - Error boundaries per route
   - User-friendly error messages
   - Retry mechanisms

3. **Toast Notifications**
   - Install `sonner` or `react-hot-toast`
   - Success/error/info toasts
   - Toast container in layout

4. **Responsive Design**
   - Mobile navigation menu
   - Touch-friendly buttons
   - Responsive grid layouts

5. **Accessibility**
   - ARIA labels
   - Keyboard navigation
   - Focus management

### File Changes Needed
- 🆕 `components/ui/Skeleton.tsx` - CREATE
- 🆕 `components/ui/Toast.tsx` - CREATE
- 🆕 `components/ui/ErrorBoundary.tsx` - CREATE
- 🆕 `components/MobileNav.tsx` - CREATE
- ✏️ All interactive components - Add ARIA labels

---

## 🎯 Phase 3: Advanced Search & Filters (Week 3)

### Features
- Advanced filter panel (breadth, gen ed, level, credits)
- Multi-select filters
- Filter persistence in URL params
- "Clear all" functionality
- Filter count badges

### File Changes Needed
- 🆕 `components/FilterPanel.tsx` - CREATE
- ✏️ `app/courses/page.tsx` - Enhance filtering logic
- 🆕 `lib/filterUtils.ts` - Filter helper functions

---

## 🎯 Phase 4: Data Pipeline (Ongoing)

### Scraping Tasks
1. **Course Catalog Scraper**
   - Target: guide.wisc.edu
   - Extract: code, name, desc, credits, prereqs
   - Frequency: Once per semester

2. **MadGrades Integration**
   - Import historical grade data
   - Calculate average GPA per course
   - Display grade trends

3. **Prerequisite Parser**
   - Regex-based course code extraction
   - Build prerequisite graph
   - Detect circular dependencies

### File Changes Needed
- 🆕 `scripts/scrape-catalog.ts` - CREATE
- 🆕 `scripts/import-madgrades.ts` - CREATE
- 🆕 `scripts/parse-prereqs.ts` - CREATE
- 🆕 `lib/prereqParser.ts` - CREATE

---

## 🎯 Phase 5: Social Features (Week 4)

### Features
- User profiles (`/profile/[userId]`)
- Follow/unfollow users
- Activity feed
- Reputation system
- Badges/achievements

---

## 🎯 Phase 6: GPA Prediction (Week 5)

### ML Pipeline
1. **Transcript Parser**
   - PDF upload
   - OCR extraction
   - Data validation

2. **Prediction Model**
   - Feature engineering
   - Model training (scikit-learn or TensorFlow)
   - API endpoint

3. **UI Integration**
   - "Predict my grade" badge
   - Confidence intervals
   - Explanation tooltips

---

## 📝 Commit Strategy

### Commit Template
```
[Phase] Feature: Short description

- Bullet point changes
- More details

Relates to: #issue_number (if applicable)
```

### Example Commits
```bash
[P1A] Database: Add PostgreSQL and seed script
[P1B] Auth: Implement NextAuth with wisc.edu validation
[P2A] Review: Add review submission with Server Actions
[P2B] UI: Add loading skeletons and error boundaries
```

### Commit Frequency
- After each completed subtask
- After fixing a bug
- Before switching to a new feature
- At end of each work session

---

## 🚀 Deployment Checklist (Future)

- [ ] Environment variable security audit
- [ ] Rate limiting setup
- [ ] Content moderation system
- [ ] Database backups
- [ ] Analytics integration
- [ ] SEO optimization
- [ ] Performance monitoring
- [ ] CI/CD pipeline

---

## 📊 Success Metrics

### Phase 1 Success Criteria
- ✅ Database contains 3000+ courses
- ✅ User can create account with @wisc.edu
- ✅ User can browse courses
- ✅ User can view course details

### Phase 2 Success Criteria
- ✅ User can submit a review
- ✅ User can upvote/downvote reviews
- ✅ User can comment on reviews
- ✅ Mobile experience is smooth

### Phase 3+ Success Criteria
- ✅ Advanced filters work correctly
- ✅ GPA prediction accuracy >70%
- ✅ Page load time <2 seconds
- ✅ 100% @wisc.edu verification rate
