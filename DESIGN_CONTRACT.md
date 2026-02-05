# Design Contract - UW-Madison Course Review

> 本文档定义了 WiscFlow 项目的技术架构、组件规范和设计约束。
> 用于 AI 辅助 UI 重构时保持一致性。

---

## 技术栈

### 框架
| 层级 | 技术 | 版本 |
|------|------|------|
| Frontend | Next.js (App Router) | 15.0.3 |
| Runtime | React | 19.0.0 |
| Language | TypeScript | 5.8.2 |
| API Layer | tRPC | 11.9.0 |
| ORM | Prisma | 6.0.1 |
| Database | PostgreSQL (Neon) | - |
| Auth | NextAuth.js | 5.0.0-beta.30 |
| Cache | Upstash Redis | 1.36.2 |

### 样式方案
- **CSS Framework**: Tailwind CSS 3.4.16
- **Icons**: Lucide React
- **Toast Notifications**: Sonner
- **组件库**: 无（全部自定义组件）

### 关键依赖
- `@tanstack/react-query` - 服务端状态管理
- `superjson` - tRPC 序列化
- `zod` - 运行时类型验证

---

## 页面结构

### `/` 首页
- **路由**: `app/page.tsx`
- **用途**: 平台介绍、统计展示、精选课程入口
- **渲染模式**: Server Component
- **组件列表**:
  - `Logo`
  - 统计卡片 (inline)
  - 精选课程卡片 (inline)
  - 导航链接 (inline)

---

### `/courses` 课程列表
- **路由**: `app/courses/page.tsx`
- **用途**: 搜索、过滤、浏览所有课程
- **渲染模式**: Client Component
- **组件列表**:
  - `Logo`
  - `UserMenu` / `GuestMenu`
  - `MobileNav`
  - `FilterPanel`
  - 课程卡片列表 (inline)
  - 分页控件 (inline)

---

### `/courses/[id]` 课程详情
- **路由**: `app/courses/[id]/page.tsx`
- **用途**: 展示课程信息、成绩分布、学生评价
- **渲染模式**: Client Component
- **组件列表**:
  - `CoursePageLayout` (三栏布局容器)
    - `Logo`
    - `UserMenu` / `GuestMenu`
    - `FilterBar` (Term/Instructor 过滤)
    - `ReviewForm`
    - `VoteButton`
    - `CommentSection`
    - `ContributorBadge`
    - `ReviewActions`
    - `ReportButton`
    - `ReviewGateOverlay` / `FrostedReview`

---

### `/instructors` 教师列表
- **路由**: `app/instructors/page.tsx`
- **用途**: 搜索、浏览所有教师
- **渲染模式**: Client Component
- **组件列表**:
  - `Logo`
  - `UserMenu` / `GuestMenu`
  - 搜索框 (inline)
  - 排序选择器 (inline)
  - 教师卡片列表 (inline)
  - 分页控件 (inline)

---

### `/instructors/[id]` 教师详情
- **路由**: `app/instructors/[id]/page.tsx`
- **用途**: 展示教师信息、教授课程、学生评价汇总
- **渲染模式**: Client Component
- **组件列表**:
  - `Logo`
  - `UserMenu` / `GuestMenu`
  - 教师信息卡片 (inline)
  - 课程列表 (inline)
  - 评价汇总 (inline)

---

### `/profile` 用户资料
- **路由**: `app/profile/page.tsx`
- **用途**: 用户个人信息、贡献等级、我的评价、收藏课程
- **渲染模式**: Server Component
- **组件列表**:
  - `Logo`
  - `ContributorBadge` (expanded)
  - 我的评价列表 (inline)
  - 收藏课程列表 (inline)
  - 统计卡片 (inline)

---

### `/auth/signin` 登录页
- **路由**: `app/auth/signin/page.tsx`
- **用途**: 用户登录（Google OAuth / Email Magic Link）
- **渲染模式**: Server Component
- **组件列表**:
  - `Logo`
  - 登录表单 (inline)

---

### `/auth/signup` 注册页
- **路由**: `app/auth/signup/page.tsx`
- **用途**: 用户注册引导
- **渲染模式**: Server Component
- **组件列表**:
  - `Logo`
  - 注册表单 (inline)

---

### `/auth/error` 错误页
- **路由**: `app/auth/error/page.tsx`
- **用途**: 认证错误展示
- **渲染模式**: Server Component
- **组件列表**:
  - `Logo`
  - 错误信息 (inline)

---

## 组件清单

### `Logo`
- **文件路径**: `components/Logo.tsx`
- **Props**:
  | 名称 | 类型 | 用途 |
  |------|------|------|
  | `className` | `string?` | 额外 CSS 类名 |
  | `size` | `number?` | Logo 尺寸 (默认 32) |
- **内部状态**: 无
- **外部数据**: 无
- **渲染内容**: SVG 图标 (UW-Madison W 形状)
- **目标视觉风格**: 【留空】

---

### `UserMenu`
- **文件路径**: `components/UserMenu.tsx`
- **Props**:
  | 名称 | 类型 | 用途 |
  |------|------|------|
  | `user` | `{ name?: string, email?: string, image?: string }` | 当前登录用户信息 |
- **内部状态**: 
  - `isOpen: boolean` - 下拉菜单展开状态
- **外部数据**: 无
- **渲染内容**: 用户头像 + 下拉菜单 (Profile / Sign Out)
- **目标视觉风格**: 【留空】

---

### `GuestMenu`
- **文件路径**: `components/UserMenu.tsx` (同文件导出)
- **Props**: 无
- **内部状态**: 无
- **外部数据**: 无
- **渲染内容**: Sign In / Sign Up 按钮
- **目标视觉风格**: 【留空】

---

### `MobileNav`
- **文件路径**: `components/MobileNav.tsx`
- **Props**:
  | 名称 | 类型 | 用途 |
  |------|------|------|
  | `user` | `User \| null` | 当前登录用户 |
  | `currentPath` | `string?` | 当前路由路径 |
- **内部状态**: 
  - `isOpen: boolean` - 侧边栏展开状态
- **外部数据**: 无
- **渲染内容**: 汉堡按钮 + 侧滑导航面板 (Logo + 导航链接 + UserMenu/GuestMenu)
- **目标视觉风格**: 【留空】

---

### `FilterPanel`
- **文件路径**: `components/FilterPanel.tsx`
- **Props**:
  | 名称 | 类型 | 用途 |
  |------|------|------|
  | `filters` | `CourseFilters` | 当前过滤条件 |
  | `onFilterChange` | `(filters: CourseFilters) => void` | 过滤条件变更回调 |
- **内部状态**: 
  - `showAllSchools: boolean`
  - `showAllDepts: boolean`
  - `deptSearch: string`
- **外部数据**: 
  - `trpc.course.getSchools` - 学院列表
  - `trpc.course.getDepartments` - 院系列表
- **渲染内容**: 
  - Schools 多选
  - Departments 多选 + 搜索
  - Levels 多选 (Elementary/Intermediate/Advanced)
  - Credits 范围滑块
  - GPA 范围滑块
  - Instructor 名称搜索
  - Sort By 下拉
  - Clear All 按钮
- **目标视觉风格**: 【留空】

---

### `CoursePageLayout`
- **文件路径**: `components/CoursePageLayout.tsx`
- **Props**:
  | 名称 | 类型 | 用途 |
  |------|------|------|
  | `course` | `Course` | 课程完整数据 |
  | `relatedCourses` | `RelatedCourse[]?` | 同院系课程列表 |
- **内部状态**: 
  - `selectedTerm: string` - 选中的学期
  - `selectedInstructor: string` - 选中的教师
- **外部数据**: 
  - `useSession()` - 当前用户 session
- **渲染内容**: 
  - Header (Logo + 导航)
  - 三栏布局:
    - 左栏: 搜索 + Prerequisites + Unlocks + 同系课程
    - 中栏: 课程信息卡片 + FilterBar + ReviewForm + Reviews 列表
    - 右栏: Review 数量 + Rating Circles + Write Review 按钮 + Grade Flow + Quick Stats
- **目标视觉风格**: 【留空】

---

### `ReviewForm`
- **文件路径**: `components/ReviewForm.tsx`
- **Props**:
  | 名称 | 类型 | 用途 |
  |------|------|------|
  | `courseId` | `string` | 课程 ID |
  | `courseName` | `string` | 课程名称 (显示用) |
- **内部状态**: 
  - `isOpen: boolean` - 表单展开状态
  - `error: string \| null` - 错误信息
  - `formData: ReviewFormData` - 表单数据
- **外部数据**: 
  - `trpc.review.create` - 创建评价 mutation
- **渲染内容**: 
  - 展开按钮
  - Term 选择器
  - Grade 选择器
  - 4 维度评分 (Content/Teaching/Grading/Workload)
  - 4 维度评论输入
  - Assessments 标签多选
  - Instructor 输入
  - Resource Link 输入
  - Submit 按钮
- **目标视觉风格**: 【留空】

---

### `VoteButton`
- **文件路径**: `components/VoteButton.tsx`
- **Props**:
  | 名称 | 类型 | 用途 |
  |------|------|------|
  | `reviewId` | `string` | 评价 ID |
  | `initialVoteCount` | `number` | 初始点赞数 |
  | `initialIsVoted` | `boolean` | 当前用户是否已点赞 |
  | `userEmail` | `string?` | 当前用户邮箱 |
- **内部状态**: 
  - `isVoted: boolean`
  - `voteCount: number`
- **外部数据**: 
  - `trpc.review.vote` - 点赞/取消 mutation
- **渲染内容**: ThumbsUp 图标 + 点赞数
- **目标视觉风格**: 【留空】

---

### `CommentSection`
- **文件路径**: `components/CommentSection.tsx`
- **Props**:
  | 名称 | 类型 | 用途 |
  |------|------|------|
  | `reviewId` | `string` | 评价 ID |
  | `comments` | `Comment[]` | 评论列表 |
  | `userEmail` | `string?` | 当前用户邮箱 |
- **内部状态**: 
  - `isExpanded: boolean` - 展开状态
  - `commentText: string` - 输入内容
- **外部数据**: 
  - `trpc.comment.create` - 创建评论 mutation
  - `trpc.comment.delete` - 删除评论 mutation
- **渲染内容**: 
  - 展开/收起按钮 + 评论数
  - 评论列表 (作者 + 内容 + 时间 + 删除按钮)
  - 评论输入框 + 发送按钮
- **目标视觉风格**: 【留空】

---

### `ContributorBadge`
- **文件路径**: `components/ContributorBadge.tsx`
- **Props**:
  | 名称 | 类型 | 用途 |
  |------|------|------|
  | `contributor` | `ContributorInfo` | 贡献者等级信息 |
  | `variant` | `'inline' \| 'expanded'?` | 显示模式 |
- **内部状态**: 无
- **外部数据**: 无
- **渲染内容**: 
  - inline: Badge emoji + Title
  - expanded: Badge + Title + Level + 下一级进度
- **目标视觉风格**: 【留空】

---

### `ReviewActions`
- **文件路径**: `components/ReviewActions.tsx`
- **Props**:
  | 名称 | 类型 | 用途 |
  |------|------|------|
  | `reviewId` | `string` | 评价 ID |
  | `isOwner` | `boolean` | 是否为评价作者 |
  | `onDeleted` | `() => void?` | 删除成功回调 |
  | `onEditStart` | `() => void?` | 开始编辑回调 |
- **内部状态**: 
  - `showMenu: boolean` - 菜单展开状态
  - `showConfirm: boolean` - 删除确认弹窗
- **外部数据**: 
  - `trpc.review.delete` - 删除评价 mutation
- **渲染内容**: 
  - More 图标按钮
  - 下拉菜单 (Edit / Delete)
  - 删除确认弹窗
- **目标视觉风格**: 【留空】

---

### `ReportButton`
- **文件路径**: `components/ReportButton.tsx`
- **Props**:
  | 名称 | 类型 | 用途 |
  |------|------|------|
  | `reviewId` | `string` | 评价 ID |
  | `isOwner` | `boolean` | 是否为评价作者 (作者不显示) |
- **内部状态**: 
  - `showModal: boolean` - 弹窗状态
  - `reason: string` - 举报原因
  - `details: string` - 详细说明
  - `submitted: boolean` - 提交成功状态
- **外部数据**: 
  - `trpc.review.report` - 举报 mutation
- **渲染内容**: 
  - Flag 图标 + "Report" 文字
  - 举报弹窗 (原因选择 + 详情输入 + 提交按钮)
- **目标视觉风格**: 【留空】

---

### `ReviewGateOverlay`
- **文件路径**: `components/ReviewGate.tsx`
- **Props**:
  | 名称 | 类型 | 用途 |
  |------|------|------|
  | `totalReviews` | `number` | 课程评价总数 |
  | `userReviewCount` | `number` | 用户已写评价数 |
  | `isLoggedIn` | `boolean` | 是否已登录 |
  | `courseId` | `string` | 课程 ID |
- **内部状态**: 无
- **外部数据**: 无
- **渲染内容**: 
  - Lock 图标
  - "X more reviews available" 标题
  - 解锁说明文字
  - CTA 按钮 (Write Review / Sign In)
- **目标视觉风格**: 【留空】

---

### `FrostedReview`
- **文件路径**: `components/ReviewGate.tsx` (同文件导出)
- **Props**:
  | 名称 | 类型 | 用途 |
  |------|------|------|
  | `children` | `ReactNode` | 被模糊的评价内容 |
- **内部状态**: 无
- **外部数据**: 无
- **渲染内容**: 带 blur + pointer-events-none 的容器
- **目标视觉风格**: 【留空】

---

### `Toaster`
- **文件路径**: `components/Toaster.tsx`
- **Props**: 无 (使用 Sonner 默认配置)
- **内部状态**: 无
- **外部数据**: 无
- **渲染内容**: Sonner Toast 容器
- **目标视觉风格**: 【留空】

---

## 设计约束

### 配色系统
| 名称 | 色值 | 用途 |
|------|------|------|
| **UW Red** | `#c5050c` | 主色、强调、链接 |
| **UW Red Dark** | `#9b0000` | Hover 状态 |
| **White** | `#ffffff` | 背景 (surface-primary) |
| **Light Gray** | `#f7f7f7` | 次级背景 (surface-secondary) |
| **Border Gray** | `#e5e7eb` | 边框 (surface-tertiary) |
| **Text Primary** | `#111827` | 主要文字 |
| **Text Secondary** | `#4b5563` | 次要文字 |
| **Text Tertiary** | `#9ca3af` | 辅助文字 |

### GPA 动态配色
| GPA 范围 | 颜色 |
|----------|------|
| ≥ 3.5 | `emerald-500` |
| ≥ 3.0 | `emerald-400` |
| ≥ 2.5 | `amber-500` |
| ≥ 2.0 | `orange-500` |
| < 2.0 | `red-500` |

### 响应式断点
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md/lg)
- **Desktop**: ≥ 1024px (lg/xl)

### 约束规则
1. ✅ **必须响应式** - 所有页面需适配移动端
2. ✅ **保持 Props 接口不变** - 不修改组件的 props 类型定义
3. ✅ **仅通过 Tailwind className 修改样式** - 不引入新的 CSS 文件
4. ✅ **保持数据流不变** - tRPC hooks 调用方式不变
5. ✅ **保持组件职责单一** - 不合并或拆分现有组件

---

## 组件依赖关系图

```
app/layout.tsx
└── Providers (SessionProvider + tRPC + QueryClient)
    └── Toaster
    └── {children}

app/page.tsx (首页)
├── Logo
└── (inline components)

app/courses/page.tsx (课程列表)
├── Logo
├── UserMenu / GuestMenu
├── MobileNav
│   ├── Logo
│   └── UserMenu / GuestMenu
├── FilterPanel
│   └── trpc.course.getSchools
│   └── trpc.course.getDepartments
└── (inline: 课程卡片, 分页)

app/courses/[id]/page.tsx (课程详情)
└── CoursePageLayout
    ├── Logo
    ├── UserMenu / GuestMenu
    ├── LeftSidebar (inline)
    │   └── trpc.course.sameDepartment
    ├── Main Content
    │   ├── FilterBar (inline)
    │   ├── ReviewForm
    │   │   └── trpc.review.create
    │   └── Review Cards (inline)
    │       ├── VoteButton
    │       │   └── trpc.review.vote
    │       ├── CommentSection
    │       │   └── trpc.comment.create
    │       │   └── trpc.comment.delete
    │       ├── ContributorBadge
    │       ├── ReviewActions
    │       │   └── trpc.review.delete
    │       ├── ReportButton
    │       │   └── trpc.review.report
    │       └── ReviewGateOverlay / FrostedReview
    └── RightSidebar (inline)

app/instructors/page.tsx (教师列表)
├── Logo
├── UserMenu / GuestMenu
└── trpc.instructor.list

app/instructors/[id]/page.tsx (教师详情)
├── Logo
├── UserMenu / GuestMenu
└── trpc.instructor.byId

app/profile/page.tsx (用户资料)
├── Logo
├── ContributorBadge (expanded)
└── prisma.user (Server Component)

app/auth/signin/page.tsx
└── Logo

app/auth/signup/page.tsx
└── Logo

app/auth/error/page.tsx
└── Logo
```

---

## 数据流概览

```
┌─────────────────────────────────────────────────────┐
│                    Client                            │
├─────────────────────────────────────────────────────┤
│  Component                                           │
│      │                                               │
│      ▼                                               │
│  trpc.xxx.useQuery() / useMutation()                │
│      │                                               │
│      ▼                                               │
│  React Query Cache                                   │
│  (staleTime: 5min, gcTime: 30min)                   │
└──────────────────────┬──────────────────────────────┘
                       │ HTTP POST /api/trpc
                       ▼
┌─────────────────────────────────────────────────────┐
│                 Next.js Server                       │
├─────────────────────────────────────────────────────┤
│  tRPC Router                                         │
│  ├── courseRouter                                    │
│  ├── reviewRouter                                    │
│  ├── commentRouter                                   │
│  └── instructorRouter                                │
│      │                                               │
│      ▼                                               │
│  Redis Cache (可选)                                  │
│      │                                               │
│      ▼                                               │
│  Prisma Client                                       │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│              PostgreSQL (Neon)                       │
└─────────────────────────────────────────────────────┘
```

---

*Last Updated: 2026-02-05*
