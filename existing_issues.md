# Existing Issues - WiscFlow Course Evaluation Platform

Last Updated: 2026-02-06

## Reference Documents
- **Progress**: See `PROGRESS.md` for detailed phase completion
- **Design**: See `DESIGN_CONTRACT.md` for UI/UX specifications
- **Changelog**: See `CHANGELOG.md` for recent changes

---

## 高优先级 / High Priority

### 1. 左侧双列响应式优化
- **状态:** ✅ 已修复 (2026-02-06)
- **问题:** 左侧 Filter 栏太宽 (w-72 = 288px)
- **解决:** 调整为 `w-56 xl:w-64` (224px / 256px)
- **文件:** `app/courses/page.tsx`

### 2. 课程小字颜色
- **状态:** ✅ 已修复 (2026-02-06)
- **问题:** school name 用 `text-text-tertiary` 太淡
- **解决:** 改为 `text-text-secondary`
- **文件:** `app/courses/page.tsx`

### 3. Cross-listed 课程显示
- **状态:** ✅ 已实现
- **说明:** 数据库已有 1,368 个 cross-list 组，UI 已支持 `crossListGroup`
- **显示:** 课程详情页会显示所有 cross-listed codes (如 COMP SCI / MATH 514)
- **搜索:** 支持搜索任意 code 找到同一课程
- **文件:** `components/CoursePageLayout.tsx` line 699-707

---

## 中优先级 / Medium Priority

### 4. Dark Mode
- **状态:** ✅ 已完成 (2026-02-06)
- **说明:** CSS 变量 light/dark + ThemeToggle 组件
- **文件:** `globals.css`, `tailwind.config.ts`, `components/ThemeToggle.tsx`

### 5. Grade Flow 可视化
- **状态:** ✅ 已实现基础版
- **说明:** 水平条形图已实现，流式分布条为可选优化
- **文件:** `components/CoursePageLayout.tsx` RightSidebar

### 6. 搜索增强 - 实时预览
- **状态:** ✅ 已完成 (2026-02-06)
- **说明:** SearchWithPreview 组件，debounced API，显示前 6 结果
- **文件:** `components/SearchWithPreview.tsx`, `lib/hooks/useDebounce.ts`

### 7. Instructor 过滤器优化
- **状态:** 计划中
- **说明:** 课程页内 instructor 过滤（USTSPACE 模式）

---

## 低优先级 / Low Priority

### 8. 图片懒加载 & 代码分割
- **状态:** 未开始
- **说明:** 性能优化

### 9. 邮件通知
- **状态:** 未开始
- **说明:** 评论回复、课程更新通知

### 10. AI 课程摘要
- **状态:** Phase 4
- **说明:** 自动生成课程评价摘要

---

## 技术债务 / Technical Debt

1. **组件统一:** FilterPanel, UserMenu, ReviewCard 等需要重构
2. **测试覆盖:** 暂无自动化测试
3. **Error Boundary:** 需要更好的错误处理 UI

---

## 已完成功能 / Completed Features

参见 `PROGRESS.md` 完整列表，主要包括：

- ✅ 用户认证 (Google OAuth, @wisc.edu)
- ✅ 课程列表 + 搜索 + 筛选 + 分页
- ✅ 课程详情页 (成绩分布、先修课、评价)
- ✅ 评价系统 (4维评分)
- ✅ 投票 & 评论
- ✅ Review-gated access (贡献者才能看完整评价)
- ✅ Contributor level system (6 级 + XP + 徽章)
- ✅ 评价编辑/删除
- ✅ 举报系统
- ✅ Instructor 页面 (列表 + 详情 + 雷达图)
- ✅ 用户 Dashboard
- ✅ 移动端响应式
- ✅ Cross-listed 课程 (1,368 组)
- ✅ Full-text 搜索 (PostgreSQL tsvector)

---

## 数据库统计 / Database Stats

```
Schools:       23
Courses:       10,174
Departments:   209
Cross-listed:  1,368 groups
Full-text:     All indexed
```
