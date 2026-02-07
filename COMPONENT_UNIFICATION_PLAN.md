# 组件统一方案讨论 - Phase 3

**目标**: 统一 FilterPanel, UserMenu, ReviewCard, CommentSection 的配色和交互风格

---

## 📊 现状分析

### 1. FilterPanel (components/FilterPanel.tsx)

**当前状态**:
```tsx
// 问题点：
- 使用 slate-* 颜色系统 (未统一)
  ❌ border-slate-200
  ❌ text-slate-900, text-slate-700
  ❌ hover:text-uw-red (不一致，应该用主题色变量)
  ❌ bg-green-100, bg-amber-100 (Level 徽章硬编码)
  
- 交互反馈
  ✅ transition-colors (正确)
  ❌ hover:bg-slate-100 (应该用 hover-bg)
```

**应该统一为**:
```tsx
✅ border-surface-tertiary
✅ text-text-primary, text-text-secondary
✅ hover:text-wf-crimson
✅ hover:bg-hover-bg
✅ .grade-badge-* 预设类
```

---

### 2. UserMenu (components/UserMenu.tsx)

**当前状态**:
```tsx
// 问题点：
❌ hover:bg-slate-100 (应该用 hover-bg)
❌ border-slate-200 (应该用 surface-tertiary)
❌ text-slate-700, text-slate-900 (应该用 text-secondary/primary)
❌ bg-uw-red (应该用 wf-crimson)
❌ border-slate-100 (分割线)

// 正确的部分：
✅ transition-colors
✅ rounded-lg (统一圆角)
```

**应该统一为**:
```tsx
✅ hover:bg-hover-bg
✅ border-surface-tertiary
✅ text-text-secondary / text-text-primary
✅ bg-wf-crimson
✅ 分割线用 border-surface-tertiary
```

---

### 3. ReviewCard (CoursePageLayout.tsx line 850+)

**当前状态**:
```tsx
// 问题点：
❌ 使用内联 style (backgroundColor, borderColor)
❌ text-text-tertiary (部分统一，但不完整)
❌ bg-surface-secondary (部分统一)
❌ getRatingColor() 函数返回硬编码类名

// 正确的部分：
✅ 使用 ContributorBadge 组件
✅ 部分使用主题色变量
✅ transition-colors
```

**应该统一为**:
```tsx
✅ 移除内联 style，使用 .card 类
✅ 评分卡片使用 .grade-badge-* 预设类
✅ 统一使用 text-text-* 变量
✅ 统一使用 bg-surface-* 变量
```

---

### 4. CommentSection (components/CommentSection.tsx)

**当前状态**:
```tsx
// 问题点：
❌ border-slate-100, border-slate-300 (应该用 surface-tertiary)
❌ text-slate-700, text-slate-900, text-slate-600 (应该用 text-*)
❌ bg-slate-50 (应该用 surface-secondary)
❌ focus:ring-uw-red/20 (应该用 focus-ring)
❌ focus:border-uw-red (应该用 wf-crimson)
❌ bg-uw-red, hover:bg-uw-dark (应该用 .btn-primary)

// 正确的部分：
✅ transition-colors
✅ rounded-lg
```

**应该统一为**:
```tsx
✅ border-surface-tertiary
✅ text-text-primary / text-text-secondary / text-text-tertiary
✅ bg-surface-secondary
✅ focus:ring-focus-ring
✅ focus:border-wf-crimson
✅ .btn-primary 类
```

---

## 🎨 统一方案

### 方案 A: 渐进式重构（推荐）

**优点**:
- 低风险，逐个组件验证
- 可以边改边测试
- 容易回滚

**缺点**:
- 需要多次 commit
- 短期内样式不完全一致

**执行步骤**:
1. FilterPanel 重构（优先级高，使用最频繁）
2. UserMenu 重构（优先级中，影响面小）
3. CommentSection 重构（优先级中）
4. ReviewCard 重构（优先级高，但复杂度最高）

---

### 方案 B: 一次性重构

**优点**:
- 一次性达成完全统一
- 单次 commit，历史清晰

**缺点**:
- 高风险，一次改动多个文件
- 难以定位回归问题
- 测试工作量大

---

## 🔧 具体改动清单

### FilterPanel.tsx

| 旧代码 | 新代码 | 说明 |
|--------|--------|------|
| `border-slate-200` | `border-surface-tertiary` | 统一边框色 |
| `text-slate-900` | `text-text-primary` | 统一主文字色 |
| `text-slate-700` | `text-text-secondary` | 统一次要文字色 |
| `hover:text-uw-red` | `hover:text-wf-crimson` | 统一主题色 |
| `hover:bg-slate-100` | `hover:bg-hover-bg` | 统一 hover 背景 |
| `bg-green-100 text-green-700` | `.grade-badge-A` | 使用预设类 |
| `bg-amber-100 text-amber-700` | `.grade-badge-B` | 使用预设类 |

**预计行数**: ~20 处

---

### UserMenu.tsx

| 旧代码 | 新代码 | 说明 |
|--------|--------|------|
| `hover:bg-slate-100` | `hover:bg-hover-bg` | 统一 hover 背景 |
| `border-slate-200` | `border-surface-tertiary` | 统一边框色 |
| `text-slate-700` | `text-text-secondary` | 统一次要文字色 |
| `text-slate-900` | `text-text-primary` | 统一主文字色 |
| `bg-uw-red` | `bg-wf-crimson` | 统一主题色 |
| `border-slate-100` | `border-surface-tertiary` | 统一分割线 |
| `text-slate-500` | `text-text-tertiary` | 统一辅助文字 |

**预计行数**: ~15 处

---

### CommentSection.tsx

| 旧代码 | 新代码 | 说明 |
|--------|--------|------|
| `border-slate-100` | `border-surface-tertiary` | 统一边框色 |
| `border-slate-300` | `border-surface-tertiary` | 统一边框色 |
| `text-slate-700` | `text-text-secondary` | 统一次要文字色 |
| `text-slate-900` | `text-text-primary` | 统一主文字色 |
| `text-slate-600` | `text-text-secondary` | 统一次要文字色 |
| `text-slate-500` | `text-text-tertiary` | 统一辅助文字 |
| `bg-slate-50` | `bg-surface-secondary` | 统一次级背景 |
| `focus:ring-uw-red/20` | `focus:ring-focus-ring` | 统一 focus ring |
| `focus:border-uw-red` | `focus:border-wf-crimson` | 统一 focus 边框 |
| `bg-uw-red ... hover:bg-uw-dark` | `.btn-primary` | 使用预设类 |

**预计行数**: ~18 处

---

### ReviewCard (CoursePageLayout.tsx)

**问题**: 目前使用了 `getReviewCardStyle()` 函数返回内联 style

**方案 1: 改为 className 映射**
```tsx
// 删除 getReviewCardStyle() 函数
// 替换为：
const reviewCardClass = index === 0 
  ? 'card' // 使用预设 .card 类
  : 'rounded-xl border border-surface-tertiary bg-surface-secondary/50' // 普通 review
```

**方案 2: 保留函数但返回 className**
```tsx
const getReviewCardClass = (review: any, index: number) => {
  if (index === 0) return 'card'
  return 'rounded-xl border border-surface-tertiary bg-surface-secondary/50'
}
```

**评分卡片改动**:
```tsx
// 旧代码：
<div className={getRatingColor(value)}>

// 新代码：
<div className={`p-2 rounded-lg border text-center .grade-badge-${value}`}>
// 或者保留函数但返回预设类名：
const getRatingClass = (grade: string) => `p-2 rounded-lg border text-center grade-badge-${grade}`
```

**预计行数**: ~30 处

---

## 🎯 推荐方案

### 我的推荐: **方案 A - 渐进式重构**

**执行顺序**:
1. **FilterPanel** (15 分钟) - 使用最频繁，改动简单
2. **UserMenu** (10 分钟) - 改动简单，影响面小
3. **CommentSection** (15 分钟) - 改动中等，需要测试表单
4. **ReviewCard** (20 分钟) - 改动复杂，需要重构函数

**总预计时间**: ~1 小时

**测试重点**:
- [ ] FilterPanel: 展开/折叠功能正常
- [ ] UserMenu: 下拉菜单正常，链接可点击
- [ ] CommentSection: 提交评论正常，删除正常
- [ ] ReviewCard: 评分卡片颜色正确，布局正常

---

## ❓ 讨论问题

### 1. 你倾向于哪个方案？
- [ ] A: 渐进式重构（推荐）
- [ ] B: 一次性重构

### 2. ReviewCard 的 style 重构方式
- [ ] 方案 1: 删除函数，直接用 className
- [ ] 方案 2: 保留函数但返回 className

### 3. 是否需要新增预设类？
例如：
- `.comment-card` - 统一评论卡片样式
- `.filter-section` - 统一筛选区块样式

### 4. Dark Mode 考虑
当前 CSS 变量已支持 dark mode，是否需要在这次重构中测试 dark mode？
- [ ] 是，一并测试
- [ ] 否，后续单独测试

---

**等待你的反馈，确定方案后我立即开始实现！** 🚀
