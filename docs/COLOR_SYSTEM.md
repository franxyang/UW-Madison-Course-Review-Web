# WiscFlow 配色系统 - 方案 C

**最后更新**: 2026-02-04  
**设计理念**: uwcourses 红白极简 + USTSPACE 柔和数据色

---

## 🎨 设计原则

1. **主体简洁** - 黑白红，专业干净（uwcourses 风格）
2. **数据柔和** - Grade 用 Tailwind 的柔和色系，不刺眼
3. **品牌一致** - UW 红只用在关键位置（logo + CTA）
4. **易于扩展** - 后续加 Dark mode 很容易
5. **避免陷阱** - 不用 cream base，不用松绿/玫瑰灰

---

## 🎯 配色规范

### 主题色（红白极简）

| 颜色名 | Hex | Tailwind Class | 用途 |
|--------|-----|----------------|------|
| **WF Crimson** | `#C5050C` | `bg-wf-crimson` | Logo、主 CTA 按钮 |
| **WF Crimson Dark** | `#9B0000` | `bg-wf-crimson-dark` | Hover 状态 |
| **WF Crimson Light** | `#D93036` | `bg-wf-crimson-light` | Light accent |

### 表面色

| 颜色名 | Hex | Tailwind Class | 用途 |
|--------|-----|----------------|------|
| **Primary** | `#FFFFFF` | `bg-surface-primary` | 主背景、卡片 |
| **Secondary** | `#F8F9FA` | `bg-surface-secondary` | 副背景、输入框 |
| **Tertiary** | `#E9ECEF` | `bg-surface-tertiary` | 边框、分割线 |

### 文字色

| 颜色名 | Hex | Tailwind Class | 用途 |
|--------|-----|----------------|------|
| **Primary** | `#212529` | `text-text-primary` | 标题、主文本 |
| **Secondary** | `#6C757D` | `text-text-secondary` | 副文本 |
| **Tertiary** | `#ADB5BD` | `text-text-tertiary` | 辅助文本、禁用状态 |

### 数据可视化（Grade 柔和渐变）

| 等级 | 颜色名 | Hex | Tailwind Class | 视觉示例 |
|------|--------|-----|----------------|----------|
| **A** | Excellent | `#10B981` | `bg-grade-excellent` | <span style="background:#10B981;color:white;padding:2px 8px;border-radius:4px;">A</span> |
| **AB** | Good | `#34D399` | `bg-grade-good` | <span style="background:#34D399;color:white;padding:2px 8px;border-radius:4px;">AB</span> |
| **B** | Average | `#FBBF24` | `bg-grade-average` | <span style="background:#FBBF24;color:white;padding:2px 8px;border-radius:4px;">B</span> |
| **BC** | Below | `#FB923C` | `bg-grade-below` | <span style="background:#FB923C;color:white;padding:2px 8px;border-radius:4px;">BC</span> |
| **C/D/F** | Poor | `#EF4444` | `bg-grade-poor` | <span style="background:#EF4444;color:white;padding:2px 8px;border-radius:4px;">C</span> |

### 功能色

| 功能 | Hex | Tailwind Class | 用途 |
|------|-----|----------------|------|
| **Success** | `#10B981` | `text-success` / `bg-success` | 成功提示 |
| **Warning** | `#F59E0B` | `text-warning` / `bg-warning` | 警告提示 |
| **Error** | `#EF4444` | `text-error` / `bg-error` | 错误提示 |
| **Info** | `#3B82F6` | `text-info` / `bg-info` | 信息提示 |

### 交互状态

| 状态 | Hex | Tailwind Class | 用途 |
|------|-----|----------------|------|
| **Hover** | `#F1F5F9` | `hover:bg-hover-bg` | Hover 背景 |
| **Active** | `#FEF2F2` | `bg-active-bg` | Active 状态 |
| **Focus Ring** | `rgba(197,5,12,0.2)` | `focus:ring-focus-ring` | Focus 边框 |

---

## 📝 使用示例

### 按钮

```tsx
// 主按钮
<button className="btn-primary">
  Submit Review
</button>

// 次要按钮
<button className="btn-secondary">
  Cancel
</button>

// 自定义按钮
<button className="bg-wf-crimson text-white px-4 py-2 rounded-lg hover:bg-wf-crimson-dark">
  Custom Button
</button>
```

### 卡片

```tsx
// 使用 .card 类（推荐）
<div className="card p-6">
  <h3 className="text-text-primary font-semibold">Card Title</h3>
  <p className="text-text-secondary">Card content...</p>
</div>

// 手动组合
<div className="bg-surface-primary rounded-lg border border-surface-tertiary shadow-card">
  Content
</div>
```

### Grade 徽章

```tsx
// 使用预定义 grade-badge 类
<span className="grade-badge grade-badge-a">A</span>
<span className="grade-badge grade-badge-ab">AB</span>
<span className="grade-badge grade-badge-b">B</span>
<span className="grade-badge grade-badge-bc">BC</span>
<span className="grade-badge grade-badge-c">C</span>
<span className="grade-badge grade-badge-f">F</span>

// 或使用 Tailwind 颜色
<span className="px-2 py-1 rounded-md bg-grade-excellent text-white">
  A: 45%
</span>
```

### 导航链接

```tsx
// 使用 .nav-link 类
<Link href="/courses" className="nav-link">
  Courses
</Link>

<Link href="/profile" className="nav-link active">
  Profile
</Link>
```

### 文字颜色

```tsx
<h1 className="text-text-primary">Main Heading</h1>
<p className="text-text-secondary">Secondary text</p>
<span className="text-text-tertiary">Tertiary info</span>
```

---

## 🔄 迁移指南

### 从旧配色迁移

| 旧类名 | 新类名 | 说明 |
|--------|--------|------|
| `bg-uw-red` | `bg-wf-crimson` | 主题红色 |
| `bg-uw-dark` | `bg-wf-crimson-dark` | 深红色 |
| `bg-slate-50` | `bg-surface-secondary` | 副背景 |
| `text-slate-900` | `text-text-primary` | 主文本 |
| `text-slate-700` | `text-text-secondary` | 副文本 |
| `bg-grade-a` | `bg-grade-excellent` | A 等级色 |
| `bg-grade-f` | `bg-grade-poor` | F 等级色 |

### Grade 映射

```typescript
// 旧的 grade 颜色（不推荐）
const oldGradeColors = {
  'A': 'bg-grade-a',    // green-500
  'AB': 'bg-grade-ab',  // green-400
  'B': 'bg-grade-b',    // blue-500
  'BC': 'bg-grade-bc',  // blue-400
  'C': 'bg-grade-c',    // yellow-400
  'D': 'bg-grade-d',    // orange-400
  'F': 'bg-grade-f',    // red-500
}

// 新的 grade 颜色（推荐）
const newGradeColors = {
  'A': 'bg-grade-excellent',  // emerald-500
  'AB': 'bg-grade-good',      // emerald-400
  'B': 'bg-grade-average',    // amber-400
  'BC': 'bg-grade-below',     // orange-400
  'C': 'bg-grade-below',      // orange-400
  'D': 'bg-grade-poor',       // red-500
  'F': 'bg-grade-poor',       // red-500
}

// 或使用 grade-badge 预设类
const gradeBadgeClasses = {
  'A': 'grade-badge-a',
  'AB': 'grade-badge-ab',
  'B': 'grade-badge-b',
  'BC': 'grade-badge-bc',
  'C': 'grade-badge-c',
  'D': 'grade-badge-d',
  'F': 'grade-badge-f',
}
```

---

## 🎨 设计决策

### 为什么选择这套配色？

1. **专业感** - 白色背景 + 黑色文字 = 清晰易读
2. **品牌识别** - UW 红仅用于关键位置，不喧宾夺主
3. **数据友好** - Grade 渐变色基于 Tailwind 标准色，柔和不刺眼
4. **可扩展性** - 容易添加 Dark mode（只需翻转表面色和文字色）
5. **避免常见错误** - 不用 cream/暖色底（易造成视觉疲劳）

### 与竞品对比

| 网站 | 配色策略 | WiscFlow 借鉴 |
|------|----------|---------------|
| **uwcourses.com** | 黑红极简 | ✅ 主体框架（红白黑） |
| **USTSPACE** | 淡蓝柔和 | ✅ 数据可视化的柔和感 |
| **WiscFlow** | 红白极简 + 柔和数据色 | 🌟 两者融合 |

---

## 🚀 下一步

### Phase 3 UI 改造优先级

1. **Grade Flow 可视化** - 替换现有柱状图为流式分布条
2. **课程卡片重构** - 使用新的 `.card` 类和配色
3. **按钮统一** - 全站按钮改用 `.btn-primary` / `.btn-secondary`
4. **导航重构** - 使用新的 `.nav-link` 样式
5. **Grade 徽章统一** - 使用 `.grade-badge-*` 预设类

### 后续扩展

- [ ] Dark mode 支持
- [ ] 自定义主题切换
- [ ] 动画效果增强
- [ ] 响应式优化

---

**设计者**: dev-agent  
**批准者**: Franx  
**生效日期**: 2026-02-04
