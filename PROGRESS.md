# MadSpace Development Progress

**Last Updated**: 2026-02-09  
**Current Phase**: Phase 4 + Data Integrity Stabilization  
**Overall Completion**: ~90%

---

## 🎯 Overall Progress

```
Phase 1: Infrastructure  ████████████████████ 100% ✅
Phase 2: Core Features   ████████████████████ 100% ✅
Phase 3: UX Optimization ███████████████████░  95% ✅ (收尾中)
Deployment               ████████████████████ 100% ✅
Phase 4: Admin Portal    ████████████████░░░░  80% 🚧 (4A-4C ✅, 4D deferred)
Phase 5: Advanced Feat.  ░░░░░░░░░░░░░░░░░░░░   0% 📋
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall:                 ██████████████████░░  ~90%
```

---

## 🚀 Recent Shipping (2026-02-08)

### ✅ Data Integrity & Cross-Listed Consistency
- [x] **Madgrades term/instructor data recovery** completed with canonical rebuild + audit workflow
- [x] **Instructor normalization pipeline** shipped (review input normalization + alias resolution + reconciliation script)
- [x] **Course level misclassification fixed**: corrected `500-699` courses from `Intermediate` → `Advanced` (`939` records reconciled)
- [x] **Same-level recommendations hardened**: related course ranking now derives level from course code, not stale `Course.level`
- [x] **Cross-listed read consistency**: course detail now reads `reviews`, `gradeDistributions`, and `courseInstructors` across the full `crossListGroup`
- [x] **Cross-listed write consistency**: review create/update duplicate checks now scope to the entire `crossListGroup` (prevents split reviews)

### ✅ Review System & Privacy
- [x] **Anonymous review support**: `isAnonymous` + `showRankWhenAnonymous` (schema, API, UI, profile indicators)
- [x] **Server-side identity protection** for anonymous reviews (owner can still see real identity; other users see anonymous author)
- [x] **Review form redesign (in progress polish)**:
  - Grade scale unified to `A / AB / B / BC / C / D / F`
  - Dynamic color logic aligned with GPA distribution palette
  - Stronger visual feedback for assessments and detailed rating modules

### ✅ Auth Upgrade (Credentials + OTP + Recovery)
- [x] **Hybrid authentication shipped**:
  - Google OAuth (@wisc.edu verification path)
  - Handle/email + password credentials login
  - Wisc email OTP signup flow
- [x] **Graduate-safe account continuity**:
  - Added recovery-email verification flow (`non-@wisc.edu`)
  - Added password reset OTP flow
  - Added profile security panel (handle / recovery email / password)
- [x] **Identity model migration deployed**:
  - `UserEmail`, `UserCredential`, `EmailOtpChallenge`
  - `eligibilityStatus`-based review authorization

### ✅ Browse / Discovery UX
- [x] **Courses page featured panels** updated:
  - Most Reviewed + Recent Reviews switched to compact top-5 scrolling panels
  - Filter-active state now switches to focused result display
- [x] **License migration finalized** with official AGPL-3.0 text and package metadata

### 📌 Open Data Cleanup (Next Critical)
- [ ] **Department alias split cleanup** (`ME` vs `M E`, `ECE` vs `E C E`, etc.) with canonical department mapping and non-destructive merge
- [ ] **School ownership correction** for known mismatches (e.g., `ILS` should live under `Letters & Science`)
- [ ] **Cross-list canonical write target** to avoid future alias drift at source

---

## ✅ Phase 1: Infrastructure — 100% COMPLETE

### PostgreSQL Migration ✅
- Neon PostgreSQL (Serverless, US East Ohio)
- Prisma ORM with full schema (11 migrations)

### Department Model ✅
- 209 departments with school associations
- Many-to-many CourseDepartment links

### tRPC Integration ✅
- 6 Routers: course (703L), admin (649L), review (399L), instructor (116L), comment (64L), user (59L)
- Procedure tiers: `publicProcedure` → `protectedProcedure` (ban check) → `adminProcedure` → `superAdminProcedure`
- End-to-end type safety with superjson

### Full-text Search ✅
- PostgreSQL tsvector + GIN index
- Weighted search (code/name=A, description=B)
- Auto-update trigger, all courses indexed

### Redis Caching ✅
- Upstash Redis client with generic `cached()` wrapper
- Graceful degradation (works without Redis configured)

### Course Data Import ✅
- 14,149 courses (original 10,174 + 3,975 from Madgrades backfill)
- 23 schools, 209 departments
- Course code alias search (CS↔COMP SCI, 60+ alias groups)

### Filtering System ✅
- Left sidebar FilterPanel with school/dept/level/credits/sort
- Multi-select filters (schoolIds[], departmentIds[], levels[])
- School hierarchy (College>School>Dept, type+parentId)
- Cross-listed courses (1,368 groups)

---

## ✅ Phase 2: Core Features — 100% COMPLETE

- [x] User authentication (NextAuth v5 + Google OAuth + credentials login + OTP verification)
- [x] Course list page with search + filters + pagination
- [x] Course detail page (grade distributions, prereqs, reviews)
- [x] Review system (create with 4-dimension ratings: Content/Teaching/Grading/Workload)
- [x] Vote functionality (optimistic UI)
- [x] Comment functionality (create, delete)
- [x] Loading states (skeleton UI)
- [x] Review-gated access (frosted glass blur for non-contributors)
- [x] Contributor level system (🐾→🐣→🐥→🦡→👑→🏆, quality-weighted XP)
- [x] Review edit/delete (ownership-verified, cascading delete)
- [x] Review reporting (5 reasons, modal UI, duplicate prevention)
- [x] Advanced search (GPA range + instructor name filters)
- [x] Instructor pages (/instructors list + /instructors/[id] detail with radar charts)
- [x] User dashboard (reviews, upvotes, level progress, saved courses)
- [x] Mobile responsive (hamburger nav, slide-over filters, responsive grids)

---

## ✅ Phase 3: UX Optimization — 95% COMPLETE

### ✅ Completed
- [x] **配色系统** — UW crimson + soft gradients (Solution C, Tailwind config)
- [x] **课程列表页重构** — GPA 动态配色、Level 徽章
- [x] **课程详情页三栏布局** — Term/Instructor 过滤器、评分圆圈、Grade Flow
- [x] **首页重构** — Stats、Most Reviewed、Mini Calendar、Popular Departments、How It Works guide
- [x] **Instructor Teaching Portfolio** — 雷达图、教学风格标签、时间线
- [x] **Dark mode** — CSS 变量切换 + localStorage + 系统偏好检测
- [x] **实时搜索预览** — SearchWithPreview (debounced, 6 results)
- [x] **ReviewForm UX** — 实时渐变背景 + Term 格式修复 + rating hints + 最低 5 字符
- [x] **组件统一** — FilterPanel (40处), UserMenu (14处), CommentSection (10处), ReviewCard (6级渐变预设)
- [x] **Nickname 系统** — 首次登录 modal、验证、全站隐私保护 (safeAuthor)、Profile 可编辑
- [x] **Contributor Level 重设计** — 现实门槛、upvotes 权重大于 review 数量
- [x] **课程详情页修复** — Related courses, 左栏全局搜索, 移除重复按钮
- [x] **P0/P1/P2 安全审计** — Review 权限绕过、email 不暴露、test-db 禁用、unique constraint、tsquery 注入
- [x] **WCAG AA 对比度** — CSS 变量 + 16 个组件修复
- [x] **Rebrand WiscFlow → MadSpace** — 全站改名 + Logo (#MadSpace.|)
- [x] **Course page scroll 优化** — 固定 sidebar + 中栏独立滚动 + 移动端恢复正常滚动
- [x] **Review card 改进** — 移动端布局、assessment "Including" 标签、compact actions
- [x] **Homepage 优化** — 侧边栏重排（calendar first）、welcome copy、How It Works

### 📋 Remaining (~5%)
- [ ] **性能优化** — 图片懒加载、代码分割、bundle 进一步优化
- [ ] **移动端完善** — 全面响应式审计、触控交互优化

---

## ✅ Deployment — 100% COMPLETE

- [x] Vercel 项目创建 + GitHub 连接 (madspace-psi.vercel.app)
- [x] 域名配置: **madspace.app** (用户自购)
- [x] 环境变量配置 (DATABASE_URL, NEXTAUTH_SECRET, Google OAuth, Redis)
- [x] Next.js 15.0.3 → 15.5.12 (CVE-2025-66478 修复)
- [x] Middleware 瘦身: 1.01MB → 33.9KB (Edge Function 限制)
- [x] Google OAuth 回调地址配置
- [x] GitHub repo 已公开 (AGPL-3.0 许可证)
- [x] dev → main merge → 自动部署流程

---

## 🚧 Phase 4: Admin Portal — 80% (4A-4C ✅, 4D deferred)

### ✅ 4A: 内容审核系统 — DONE
- [x] `adminProcedure` + `superAdminProcedure` middleware (tRPC层)
- [x] Admin Layout (`/admin/*`) + AdminSidebar 侧边导航
- [x] 举报队列 `/admin/reports` (342行) — 批量处理、详情预览、快速操作
- [x] Review 管理 `/admin/reviews` (360行) — 搜索/筛选/删除
- [x] Schema: AuditLog model + Report 扩展字段 (resolvedBy, resolvedAt, resolution)

### ✅ 4B: 用户管理系统 — DONE
- [x] 用户列表 `/admin/users` (196行) — 搜索/筛选/角色
- [x] 用户详情 `/admin/users/[id]` — 行为画像
- [x] 封禁系统 — 临时/永久 + `protectedProcedure` 中 active ban check + 自动过期
- [x] 被封用户 → `/auth/banned` 提示页
- [x] 三级角色: STUDENT → MODERATOR → ADMIN
- [x] Schema: UserBan model

### ✅ 4C: 系统监控 — DONE
- [x] Dashboard `/admin` (214行) — 统计总览 + 7天趋势
- [x] 操作日志 `/admin/logs` (170行) — 审计追溯、按类型/操作者筛选
- [x] AuditLog 自动记录所有 admin 操作

### 📋 4D: 数据管理工具 — DEFERRED (上线后迭代)
- [ ] 课程批量导入 (CSV UI)
- [ ] 学期同步 (UW Course Guide API 自动化)
- [ ] Instructor 信息批量编辑

**Admin Router**: 649 行, 13 endpoints 覆盖 reports/reviews/users/logs/dashboard

---

## 📋 Phase 5: Advanced Features — NOT STARTED

**前置条件**: 500+ reviews, 100+ 活跃用户

- [ ] AI Review Summaries (基于 reviews 生成课程摘要)
- [ ] Smart Course Recommendations (collaborative filtering)
- [ ] Schedule Conflict Detection (对接 UW 选课系统)
- [ ] Community Features (关注、讨论区)
- [ ] Notification System (邮件 + 推送)
- [ ] Data Analytics (排行榜、趋势图)

---

## 📋 Phase 6: GPA Prediction — EXPERIMENTAL

- [ ] Transcript Parser (PDF → OCR)
- [ ] ML Model (past GPA + course difficulty + instructor)
- [ ] "Predict My Grade" UI

---

## 📊 Codebase Statistics

### Source Code
```
Source files:     78 (.ts/.tsx in app/components/lib/server/types)
Total lines:     12,900
Components:       35 (components/)
tRPC Routers:     6 (course 703L, admin 649L, review 399L, instructor 116L, comment 64L, user 59L)
Pages:           15 (home, courses, course detail, instructors, instructor detail,
                     profile, about, signin, signup, error, banned, privacy, terms,
                     admin×5: dashboard/reports/reviews/users/logs)
Scripts:         15 (seed/check/backfill/fix utilities)
Migrations:      11 (Prisma)
Total Commits:  114
```

### Database (Production)
```
Courses:              14,149 (original 10,174 + 3,975 Madgrades backfill)
Schools:                  23
Departments:             209
Instructors:          20,607
Grade Distributions: 341,918 (original 247,234 + 94,684 backfill)
Cross-listed Groups:   1,368
Courses w/ description: 12,315 (87%)
Courses w/ avgGPA:    12,484 (88%)
Full-text indexed:       All
```

### Tech Stack
```
Next.js 15.5.12    TypeScript 5       Tailwind CSS
Prisma ORM 6       PostgreSQL (Neon)   NextAuth.js v5
tRPC v11           React Query         Full-text Search (tsvector+GIN)
Upstash Redis      Zod validation      Course Aliases (60+ groups)
Vercel (deploy)    AGPL-3.0 license
```

---

## 📝 Key Commits (chronological)

```
784dc66 Initial commit: WiscFlow course review platform
90d776b [P1A] Database: PostgreSQL setup with 10k+ courses
ee90540 feat(search+cache): full-text search with tsvector + Redis caching layer
eca6c61 feat: complete course data (10k+), alias search, left sidebar filters
ecf5055 feat(incentive): review-gated access with frosted glass blur
b3230d5 feat(incentive): contributor level system with XP and badges
f4a86db feat(instructor): instructor list and detail pages
ecff1d2 feat(mobile): responsive navigation, mobile filter panel
aaa3c14 feat(phase3): implement color system (Solution C)
5454fc8 feat: redesign courses page with 3-column layout
caae165 feat: redesign homepage
36fc33d feat: production-grade nickname system
bf7fef9 feat: redesign contributor level system
5074ce3 security: fix P0/P1/P2 issues from audit
59b78bf rebrand: WiscFlow → MadSpace
00887c8 chore: prepare for Vercel deployment
5921017 fix: upgrade Next.js 15.0.3 → 15.5.12
fd5dd7a fix: slim down middleware to fix Vercel Edge 1MB limit
1f0844f feat(admin): Phase 4A - Content Moderation System
c2fa4c1 fix: 6 review UX improvements
02b51d3 fix: improve site-wide text contrast for WCAG AA compliance
783a8e8 Fix 5 issues: edit reviews, unify headers, level filters, about page, disclaimer
1b18cbc chore: clean up repo for public release
7c88f45 feat: improve review form UX - rating hints and lower comment minimum
82432c1 feat: add How It Works guide and improve welcome copy
9b54772 feat: add madgrades backfill + guide.wisc.edu description updater scripts
92f68f6 feat: add favicon + clean madgrades reimport script
98b7a02 chore: switch project license to AGPL-3.0
```

---

## 🗺️ Roadmap Summary

| Phase | Status | Completion | Notes |
|-------|--------|------------|-------|
| Phase 1: Infrastructure | ✅ Done | 100% | PostgreSQL + tRPC + Search + Redis |
| Phase 2: Core Features | ✅ Done | 100% | Auth + Reviews + Votes + Comments + Instructor pages |
| Phase 3: UX Optimization | ✅ Nearly done | 95% | Remaining: perf optimization + mobile audit |
| Deployment | ✅ Done | 100% | madspace.app live on Vercel |
| Phase 4: Admin Portal | 🚧 In progress | 80% | 4A-4C done, 4D deferred |
| Phase 5: Advanced Features | 📋 Planned | 0% | Needs user base (500+ reviews) |
| Phase 6: GPA Prediction | 💡 Experimental | 0% | Needs large historical dataset |

**Next priorities:**
1. Phase 3 收尾 (性能优化 + 移动端审计)
2. Phase 4D 数据管理工具 (上线后按需)
3. 用户增长 → 积累数据 → 解锁 Phase 5

---

**Project Path**: `/Users/yifanyang/Desktop/madspace`  
**Repo**: `franxyang/UW-Madison-Course-Review-Web`  
**Live**: [madspace.app](https://madspace.app)  
**License**: AGPL-3.0
