# WiscFlow Project Roadmap & Blueprint
**Last Updated**: 2026-02-04  
**Current Phase**: Phase 2C - UI/UX Optimization

---

## 📊 **Project Status Dashboard**

### ✅ Completed Phases (100%)

#### **Phase 1A: Database & Infrastructure** ✅
- [x] PostgreSQL@16 installation
- [x] Prisma schema design & migration
- [x] Seed script execution (10,174 courses, 23 schools)
- [x] Course listing & detail pages functional
- [x] Test user creation

#### **Phase 1B: Authentication UI** ✅
- [x] Login/Signup page design
- [x] UserMenu component with dropdown
- [x] GuestMenu component
- [x] NextAuth configuration
- [x] @wisc.edu email validation
- [x] Session management

#### **Phase 2A: Interactive Features** ✅
- [x] Review submission with Server Actions
- [x] Toast notifications (Sonner)
- [x] Voting system with optimistic UI
- [x] Comment threading system
- [x] Delete own comments
- [x] Zod validation

#### **Phase 2B: OAuth Configuration** ✅
- [x] Google OAuth setup
- [x] Client ID/Secret configuration
- [x] Callback URLs configured
- [x] NEXTAUTH_SECRET generated
- [x] @wisc.edu domain restriction
- [x] OAuth buttons activated

---

## 🚧 **Current Work: Phase 2C - UI/UX Optimization**

### **Priority Tasks**

#### 1. **Loading States** 🔄 **Next Up**
- [ ] Skeleton screens for course list
- [ ] Suspense boundaries
- [ ] Spinner for form submissions
- [ ] Progressive loading indicators
- [ ] Shimmer effects

**Files to Create/Modify:**
```typescript
components/ui/Skeleton.tsx          // NEW
components/ui/Spinner.tsx           // NEW
app/courses/loading.tsx             // NEW
components/ReviewForm.tsx           // UPDATE - add loading states
```

#### 2. **Error Boundaries** ⚠️
- [ ] Per-route error boundaries
- [ ] User-friendly error pages
- [ ] Retry mechanisms
- [ ] Error logging

**Files to Create:**
```typescript
components/ui/ErrorBoundary.tsx     // NEW
app/courses/error.tsx               // NEW
app/courses/[id]/error.tsx          // NEW
app/error.tsx                       // NEW (global)
```

#### 3. **Mobile Optimization** 📱
- [ ] Hamburger menu for navigation
- [ ] Touch-friendly button sizes
- [ ] Responsive forms
- [ ] Mobile-first grid layouts
- [ ] Swipe gestures

**Files to Create/Modify:**
```typescript
components/MobileNav.tsx            // NEW
app/layout.tsx                      // UPDATE - add mobile nav
components/ReviewForm.tsx           // UPDATE - mobile inputs
```

#### 4. **Animations & Transitions** ✨
- [ ] Smooth page transitions
- [ ] Fade-in effects
- [ ] Hover animations
- [ ] Loading progress bars
- [ ] Micro-interactions

**Library to Add:**
```bash
npm install framer-motion
```

#### 5. **Accessibility** ♿️
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation support
- [ ] Focus management
- [ ] Screen reader compatibility
- [ ] High contrast mode support

---

## 📅 **Future Phases**

### **Phase 3: Advanced Search & Filters** (Week 3-4)

#### Features
- [ ] Advanced filter panel
  - [ ] Breadth requirements
  - [ ] Gen Ed categories
  - [ ] Course level
  - [ ] Credit hours
  - [ ] School/Department
- [ ] Multi-select filters
- [ ] Filter persistence in URL
- [ ] "Clear all" functionality
- [ ] Filter count badges
- [ ] Recently searched history

#### Files to Create:
```typescript
components/FilterPanel.tsx
components/FilterChip.tsx
lib/filterUtils.ts
hooks/useFilters.ts
```

---

### **Phase 4: Data Pipeline & Scraping** (Ongoing)

#### **4.1 Course Catalog Scraper**
**Target**: guide.wisc.edu

**Data to Extract:**
- Course code & name
- Description
- Credits
- Prerequisites (raw text)
- Gen Ed/Breadth tags
- Last offered term
- School/department

**Implementation:**
```bash
npm install cheerio puppeteer
```

**Files to Create:**
```typescript
scripts/scrape-catalog.ts           // Main scraper
scripts/utils/scrapeUtils.ts        // Helper functions
scripts/cron/updateCatalog.ts       // Scheduled updates
```

#### **4.2 MadGrades Integration**
**Source**: madgrades.com API / CSV exports

**Data to Import:**
- Historical grade distributions (2010-2024)
- Average GPA per course
- Grade trends by semester
- Instructor-specific data

**Files to Create:**
```typescript
scripts/import-madgrades.ts
lib/gradeAnalysis.ts
```

#### **4.3 Prerequisite Parser**
**Challenge**: Parse natural language prerequisites into structured data

**Examples:**
- "CS 220 or ECE 252" → `[{code: "CS 220", operator: "OR"}, {code: "ECE 252"}]`
- "Grade of C or better in MATH 221" → `[{code: "MATH 221", minGrade: "C"}]`

**Files to Create:**
```typescript
scripts/parse-prereqs.ts
lib/prereqParser.ts
lib/prereqValidator.ts
```

---

### **Phase 5: Social Features** (Week 5-6)

#### Features
- [ ] User profiles (`/profile/[userId]`)
- [ ] Follow/unfollow users
- [ ] Activity feed
- [ ] Reputation system (based on helpful votes)
- [ ] Badges/achievements
  - 🏆 First Review
  - ⭐ 100 Helpful Votes
  - 📚 Reviewed 10+ Courses
  - 🎓 Senior Reviewer (50+ reviews)
- [ ] Leaderboard
- [ ] User notifications

#### Files to Create:
```typescript
app/profile/[userId]/page.tsx
app/profile/[userId]/reviews/page.tsx
app/profile/[userId]/followers/page.tsx
components/UserProfileCard.tsx
components/ActivityFeed.tsx
components/Badge.tsx
app/actions/follow.ts
```

---

### **Phase 6: GPA Prediction** (Week 7-8)

#### **ML Pipeline**

**6.1 Transcript Parser**
- [ ] PDF upload interface
- [ ] OCR extraction (Tesseract.js)
- [ ] Data validation
- [ ] Course matching algorithm

**6.2 Prediction Model**
- [ ] Feature engineering
  - Historical GPA
  - Course difficulty
  - Prerequisites taken
  - Time gap since prereqs
  - Instructor difficulty
- [ ] Model training (Python/scikit-learn)
- [ ] API endpoint for predictions
- [ ] Confidence intervals

**6.3 UI Integration**
- [ ] "Predict my grade" badge on course pages
- [ ] Confidence visualization
- [ ] Explanation tooltips
- [ ] Historical accuracy tracking

#### Tech Stack:
```bash
# Python backend (optional)
pip install scikit-learn pandas numpy flask

# Or Next.js API routes with TensorFlow.js
npm install @tensorflow/tfjs @tensorflow/tfjs-node
```

#### Files to Create:
```typescript
app/profile/transcript/page.tsx
app/api/predict-grade/route.ts
lib/gradePredictor.ts
components/GradePrediction.tsx
components/TranscriptUpload.tsx
```

---

### **Phase 7: Course Planning** (Week 9-10)

#### Features
- [ ] Semester planner (drag-and-drop)
- [ ] 4-year plan builder
- [ ] Time conflict detection
- [ ] Credit hour calculator
- [ ] GPA simulator
- [ ] Export to calendar (iCal)
- [ ] Share plan with advisor

#### Files to Create:
```typescript
app/planner/page.tsx
components/SemesterGrid.tsx
components/CourseDragCard.tsx
lib/plannerUtils.ts
hooks/usePlanner.ts
```

---

## 🎨 **Design System Documentation**

### **Color Palette**
```css
/* Primary Colors */
--uw-red: #c5050c;
--uw-light: #d93036;
--uw-dark: #9b0000;

/* Neutral Colors */
--slate-50: #f8fafc;
--slate-100: #f1f5f9;
--slate-200: #e2e8f0;
--slate-300: #cbd5e1;
--slate-600: #475569;
--slate-700: #334155;
--slate-900: #0f172a;

/* Grade Colors */
--grade-a: rgb(34, 197, 94);   /* green-500 */
--grade-ab: rgb(74, 222, 128); /* green-400 */
--grade-b: rgb(59, 130, 246);  /* blue-500 */
--grade-bc: rgb(96, 165, 250); /* blue-400 */
--grade-c: rgb(250, 204, 21);  /* yellow-400 */
--grade-d: rgb(251, 146, 60);  /* orange-400 */
--grade-f: rgb(239, 68, 68);   /* red-500 */
```

### **Typography**
- **Font Family**: Inter (Google Fonts)
- **Headings**: Font weight 600-700
- **Body Text**: Font weight 400
- **Emphasis**: Font weight 500

### **Spacing Scale**
- xs: 0.25rem (4px)
- sm: 0.5rem (8px)
- md: 1rem (16px)
- lg: 1.5rem (24px)
- xl: 2rem (32px)

### **Component Library**
Use Tailwind primitives instead of heavy UI libraries. Custom components:
- Button (variants: primary, secondary, ghost)
- Card
- Badge
- Modal
- Dropdown
- Tabs
- Accordion

---

## 🚀 **Deployment Checklist**

### **Pre-Deployment**
- [ ] Environment variable security audit
- [ ] Remove all console.log statements
- [ ] Run TypeScript strict checks
- [ ] Fix all ESLint warnings
- [ ] Test on multiple browsers
- [ ] Mobile responsiveness check
- [ ] Accessibility audit (Lighthouse)

### **Database**
- [ ] Production database setup (Supabase/Railway/Neon)
- [ ] Backup strategy
- [ ] Migration scripts tested
- [ ] Seed script for production data

### **Security**
- [ ] Rate limiting (Upstash Redis)
- [ ] Content moderation system
- [ ] CORS configuration
- [ ] CSP headers
- [ ] SQL injection prevention (Prisma handles this)

### **Performance**
- [ ] Image optimization
- [ ] Code splitting
- [ ] CDN setup (Vercel Edge)
- [ ] Database query optimization
- [ ] Caching strategy (Redis)

### **Monitoring**
- [ ] Error tracking (Sentry)
- [ ] Analytics (Vercel Analytics / Google Analytics)
- [ ] Performance monitoring (Web Vitals)
- [ ] Uptime monitoring

### **CI/CD**
- [ ] GitHub Actions workflow
- [ ] Automated tests
- [ ] Deployment preview for PRs
- [ ] Production deployment automation

---

## 📈 **Success Metrics**

### **Phase 1 (Foundation)**
- ✅ Database contains 10,000+ courses
- ✅ User can create account with @wisc.edu
- ✅ User can browse courses
- ✅ User can view course details

### **Phase 2 (Interaction)**
- ✅ User can submit a review
- ✅ User can upvote/downvote reviews
- ✅ User can comment on reviews
- 🔄 Mobile experience is smooth (in progress)

### **Phase 3 (Discovery)**
- ⏳ Advanced filters work correctly
- ⏳ Search results load in <500ms
- ⏳ User can save searches

### **Phase 4+ (Advanced)**
- ⏳ GPA prediction accuracy >70%
- ⏳ Page load time <2 seconds
- ⏳ 100% @wisc.edu verification rate
- ⏳ 90% mobile user satisfaction

---

## 🔧 **Technical Debt**

### **High Priority**
1. **OAuth Email Provider** - Configure email magic links
2. **Error Page Templates** - Create user-friendly error pages
3. **Loading States** - Add skeleton screens everywhere
4. **Mobile Navigation** - Hamburger menu for small screens

### **Medium Priority**
5. **TypeScript Strict Mode** - Enable and fix all errors
6. **API Rate Limiting** - Prevent abuse
7. **Pagination** - Course list and reviews
8. **Search Optimization** - Full-text search with Postgres

### **Low Priority**
9. **Dark Mode** - Theme toggle
10. **i18n** - Internationalization support
11. **PWA** - Progressive Web App features
12. **Offline Mode** - Service worker caching

---

## 📚 **Documentation TODO**

- [ ] API documentation (Swagger/OpenAPI)
- [ ] Component documentation (Storybook)
- [ ] User guide (how to use the platform)
- [ ] Admin guide (how to moderate content)
- [ ] Developer guide (how to contribute)
- [ ] Database schema diagram
- [ ] Architecture decision records (ADRs)

---

## 🎯 **Next Session Priorities**

### **Immediate (Today)**
1. ✅ Fix OAuth Google login flow
2. 🔄 **Test full login → review → vote → comment flow**
3. 🔄 **Add loading skeletons**
4. 🔄 **Mobile navigation**

### **This Week**
1. Error boundaries
2. Mobile optimization complete
3. Animation polish
4. Accessibility audit

### **Next Week**
1. Advanced filters
2. Search optimization
3. Pagination
4. User profiles

---

## 📝 **Notes**

### **Key Decisions**
- **Why Prisma?** Type-safe ORM, great DX, auto-migrations
- **Why NextAuth v5?** Modern auth, edge-ready, flexible
- **Why Sonner?** Lightweight toast library, great UX
- **Why no UI library?** Full control, smaller bundle, faster

### **Known Issues**
- OAuth login requires manual testing (can't fully automate)
- Email provider not configured yet (need SMTP server)
- Some TypeScript warnings in development (non-blocking)

### **Future Considerations**
- Multi-language support (Spanish, Chinese)
- Dark mode toggle
- Export reviews to PDF
- Integration with official UW systems (if approved)
- Mobile app (React Native)

---

**End of Roadmap**  
*This is a living document. Update as the project evolves.*
