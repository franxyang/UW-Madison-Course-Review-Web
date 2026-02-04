# WiscFlow Development Plan
**Date**: 2026-02-03  
**Status**: Phase 1 in progress

## 🎯 Phase 1A: Database & Infrastructure (Week 1)

### ✅ Completed
- [x] Next.js 15 setup with TypeScript
- [x] Prisma schema design
- [x] Component structure
- [x] Basic routing

### 🔄 In Progress
- [ ] PostgreSQL installation & setup
- [ ] Database migration & seed script execution
- [ ] Verify 3000+ courses loaded

### 📋 Todo
- [ ] Environment variables cleanup
- [ ] Error handling middleware
- [ ] Logging system setup

---

## 🎯 Phase 1B: Authentication System (Week 1)

### Critical Features
1. **Login/Register Pages**
   - `/auth/signin` - Email input with @wisc.edu validation
   - `/auth/signup` - User registration flow
   - Google OAuth button (optional)

2. **NextAuth Middleware**
   ```typescript
   // middleware.ts
   - Protect /courses/[id]/review routes
   - Protect /profile routes
   - Redirect unauthenticated users to /auth/signin
   ```

3. **Email Validation**
   ```typescript
   // Strict @wisc.edu check in signIn callback
   if (!email.endsWith('@wisc.edu')) {
     throw new Error('Only @wisc.edu emails allowed')
   }
   ```

4. **User Session Management**
   - Display user avatar/name in header
   - Logout button
   - Session persistence

### File Changes Needed
- ✅ `auth.config.ts` - Already exists, needs activation
- ✅ `auth.ts` - Already exists
- 🆕 `app/auth/signin/page.tsx` - CREATE
- 🆕 `app/auth/signup/page.tsx` - CREATE
- ✅ `middleware.ts` - Already exists, needs enhancement
- 🆕 `components/UserMenu.tsx` - CREATE
- ✏️ `app/layout.tsx` - Add user session check

---

## 🎯 Phase 2A: Review System (Week 2)

### Core Features
1. **Review Submission**
   - Server Action: `app/actions/submitReview.ts`
   - Zod validation schema
   - Form error handling
   - Success toast notification

2. **Review Display**
   - Sort options (newest, helpful, grade)
   - Pagination (10 per page)
   - Skeleton loading states

3. **Voting System**
   - Upvote/downvote buttons
   - Optimistic UI updates
   - Vote count display

4. **Comment Threading**
   - Nested replies (max 3 levels)
   - Real-time comment addition
   - Edit/delete own comments

### File Changes Needed
- 🆕 `app/actions/submitReview.ts` - CREATE
- 🆕 `app/actions/voteReview.ts` - CREATE
- 🆕 `app/actions/addComment.ts` - CREATE
- ✏️ `components/ReviewForm.tsx` - Connect to Server Action
- ✏️ `components/CommentSection.tsx` - Add interactivity
- 🆕 `components/ReviewCard.tsx` - Extract from CourseDetail
- 🆕 `components/VoteButton.tsx` - CREATE

---

## 🎯 Phase 2B: UI/UX Enhancements (Week 2)

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
