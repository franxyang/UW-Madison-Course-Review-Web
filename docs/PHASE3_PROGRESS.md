# Phase 3: UX Optimization - Progress Tracker

**开始日期**: 2026-02-04  
**当前状态**: 进行中 (~35% - 课程详情页三栏布局完成)

---

## 🎨 **已完成 - 配色系统改造**

### ✅ **1. 配色方案确定（方案 C）**

基于深度分析报告，选择了**方案 C**：
- **主体**: uwcourses 的红白极简风格
- **数据**: USTSPACE 的柔和渐变色
- **理念**: 专业简洁 + 数据友好

配色详情见: [`docs/COLOR_SYSTEM.md`](./COLOR_SYSTEM.md)

---

### ✅ **2. 基础配置更新**

#### **Tailwind Config** (`tailwind.config.ts`)
- ✅ 新增 `wf-crimson`（UW 红）主题色
- ✅ 新增 `surface`（表面色）系统
- ✅ 新增 `text`（文字色）系统
- ✅ 新增 `grade`（数据可视化）柔和渐变色
- ✅ 新增 `success`/`warning`/`error`/`info` 功能色
- ✅ 新增 `hover-bg`/`active-bg`/`focus-ring` 交互状态色

#### **全局样式** (`app/globals.css`)
- ✅ CSS 变量重构（方案 C 配色）
- ✅ 新增 `.card` 组件类（统一卡片样式）
- ✅ 更新 `.btn-primary` / `.btn-secondary`
- ✅ 新增 `.grade-badge-*` 预设类（A/AB/B/BC/C/D/F）
- ✅ 更新 `.nav-link` 样式
- ✅ 更新 scrollbar 样式

---

### ✅ **3. 课程列表页重构** (`app/courses/page.tsx`)

#### **Header 区域**
- ✅ 背景: `bg-surface-primary`（纯白）
- ✅ 边框: `border-surface-tertiary`（淡灰）
- ✅ Logo文字: `text-text-primary`
- ✅ 导航激活: `text-wf-crimson`
- ✅ 导航悬停: `hover:text-text-primary` + transition

#### **页面标题 & 搜索**
- ✅ 标题: `text-text-primary`
- ✅ 副标题: `text-text-secondary`
- ✅ 搜索框:
  - 输入框背景: `bg-surface-primary`
  - 边框: `border-surface-tertiary`
  - Focus 边框: `focus:border-wf-crimson`
  - Focus ring: `focus:ring-focus-ring`
- ✅ 搜索按钮: 使用 `.btn-primary` 类

#### **过滤器**
- ✅ 移动端按钮: `bg-surface-primary` + `hover:bg-hover-bg`
- ✅ Badge 计数: `bg-wf-crimson`
- ✅ Overlay 背景: `bg-surface-secondary`

#### **课程卡片（核心改造）**
- ✅ 使用 `.card` 类（自带 hover 阴影效果）
- ✅ Padding 增加到 `p-5`（更舒适）
- ✅ 标题:
  - 默认: `text-text-primary`
  - Hover: `group-hover:text-wf-crimson`
- ✅ 副标题: `text-text-secondary`
- ✅ Credits: `text-text-tertiary`
- ✅ School: `text-text-tertiary`
- ✅ 分割线: `border-surface-tertiary`
- ✅ **GPA 动态配色**:
  ```tsx
  GPA >= 3.5: text-grade-excellent (绿)
  GPA >= 3.0: text-grade-good (浅绿)
  GPA >= 2.5: text-grade-average (黄)
  GPA >= 2.0: text-grade-below (橙)
  GPA < 2.0:  text-grade-poor (红)
  ```
- ✅ **Level 徽章柔和化**:
  - Elementary: `emerald-50` 背景 + `emerald-700` 文字 + `emerald-200` 边框
  - Intermediate: `amber-50` + `amber-700` + `amber-200`
  - Advanced: `orange-50` + `orange-700` + `orange-200`

#### **Loading 状态**
- ✅ 背景: `bg-surface-tertiary`
- ✅ 文字: `text-text-tertiary`

#### **Empty 状态**
- ✅ 图标: `text-text-tertiary`
- ✅ 文字: `text-text-secondary`
- ✅ 清除按钮: `text-wf-crimson` + `hover:text-wf-crimson-dark`

#### **分页控件**
- ✅ 按钮边框: `border-surface-tertiary`
- ✅ Hover: `hover:bg-hover-bg`
- ✅ 激活页: `bg-wf-crimson` + `shadow-sm`
- ✅ 所有按钮: `font-medium` + `transition-colors`

---

## 📊 **改造前后对比**

| 元素 | 改造前 | 改造后 | 改进 |
|------|--------|--------|------|
| **主背景** | `bg-slate-50/50` | `bg-surface-primary` | 纯白更简洁 |
| **卡片** | `bg-white border-slate-200` | `.card`（预设类） | 统一样式，易维护 |
| **按钮** | 手动组合类 | `.btn-primary` | 统一样式 |
| **GPA 显示** | 单一颜色 | 动态渐变色 | 更直观 |
| **Level 徽章** | 饱和色 | 柔和色 + 边框 | 更现代 |
| **文字** | `text-slate-*` | `text-text-*` | 语义化 |
| **Hover** | `hover:bg-slate-50` | `hover:bg-hover-bg` | 统一交互 |

---

## 🚀 **视觉改进亮点**

1. **配色更统一** - 从 15+ 种灰色减少到 3 种语义化表面色
2. **GPA 可视化增强** - 5 级渐变色（emerald → amber → orange → red）
3. **卡片质感提升** - `.card` 类自带 hover 阴影动画
4. **Level 徽章柔和** - 从饱和色改为柔和色 + 边框
5. **过渡动画** - 所有交互都有 `transition-colors`

---

## 📋 **下一步（Phase 3 剩余）**

### **优先级 1: 核心页面改造**
- [ ] **首页重构** (`app/page.tsx`)
- [ ] **课程详情页** (`app/courses/[id]/page.tsx`)
- [ ] **教师列表页** (`app/instructors/page.tsx`)
- [ ] **教师详情页** (`app/instructors/[id]/page.tsx`)
- [ ] **用户 Profile** (`app/profile/page.tsx`)

### **优先级 2: 组件统一**
- [ ] **FilterPanel** 组件配色更新
- [ ] **UserMenu / GuestMenu** 配色更新
- [ ] **MobileNav** 配色更新
- [ ] **ReviewCard** 组件配色更新
- [ ] **CommentCard** 组件配色更新

### **优先级 3: 数据可视化**
- [ ] **Grade Flow** - 流式分布条（替换柱状图）
- [ ] **GPA 趋势图** - 柔和渐变色
- [ ] **Review 评分可视化** - 4 维度雷达图或条形图

### **优先级 4: 交互优化**
- [ ] **Instructor 过滤** - 课程页内过滤（USTSPACE 模式）
- [ ] **Semester 选择器** - 时间线式 pill 选择
- [ ] **搜索增强** - 实时预览卡片

---

## 🎯 **Phase 3 目标**

- [x] 配色系统建立（方案 C）
- [x] 课程列表页重构 ✅
- [x] **课程详情页三栏布局重构** ✅ (2026-02-05)
- [ ] 首页重构
- [ ] 教师页面配色更新
- [ ] Grade Flow 可视化
- [ ] Instructor 过滤优化
- [ ] Dark mode 支持（可选）

---

## ✅ **课程详情页三栏布局** (2026-02-05 完成)

### **布局结构**
- **左栏** (固定 240px): 导航目录 + 同系课程推荐（待数据）
- **中栏** (flex-1): 课程信息 + 评价内容
- **右栏** (固定 280px): 课程概览卡片

### **右侧概览卡片功能**
- ✅ 评分圆圈（Overall GPA 动态配色）
- ✅ Grade Flow 流式分布条（A→F 柔和渐变）
- ✅ 课程基本信息（Credits、Level、Breadth）
- ✅ Quick Actions（Write Review、Save Course）

### **页内过滤器**
- ✅ Term 选择器（页内过滤，pill 样式）
- ✅ Instructor 选择器（下拉过滤）
- ✅ URL state 同步（term/instructor 参数）

### **新增组件**
- `CoursePageLayout.tsx` - 三栏布局容器
- `CourseOverviewCard.tsx` - 右侧概览卡片
- `GradeFlowBar.tsx` - Grade Flow 可视化
- `TermFilter.tsx` - Term pill 选择器
- `InstructorFilter.tsx` - Instructor 下拉

---

## ✅ **Per-Instructor GPA 过滤系统** (2026-02-05 完成)

### **数据结构升级**
- **之前**: `GradeDistribution` 是 term 级别汇总，通过 `GradeDistributionInstructor` 多对多表关联 instructors
- **现在**: `GradeDistribution` 是 **per-instructor** 级别，每个 instructor 在每个 term 有独立 GPA 记录

### **Schema 变更**
```prisma
model GradeDistribution {
  // ...
  instructorId String?  // 新增：直接关联 instructor
  instructor   Instructor? @relation(...)
  @@unique([courseId, term, instructorId])  // 新的唯一约束
}
```

### **4 种 GPA 过滤**
| 过滤类型 | 说明 |
|----------|------|
| **Overall avg** | 所有教师所有学期平均 |
| **Term avg** | 该学期所有教师平均 |
| **Instructor avg** | 该教师所有学期平均 |
| **Term + Instructor** | 该教师在该学期的精确 GPA ✨ |

### **过滤器联动**
- 选择 Term → Instructor 下拉只显示该学期的教师
- 选择 Instructor → Term 下拉只显示该教师教过的学期
- 切换后不匹配 → 自动重置另一个过滤器

### **数据统计**
- 247,234 条 per-instructor 成绩分布记录
- 7,643 门课程有 GPA 数据
- 20,607 位教师
- 60,354 个课程-讲师关联

---

**完成度**: Phase 3 约 **45%**  
**下次更新**: 首页重构或教师页面改造

**改造者**: dev-agent  
**批准者**: Franx  
**最后更新**: 2026-02-05 14:51 CST
