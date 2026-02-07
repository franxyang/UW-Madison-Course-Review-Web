# Existing Issues - WiscFlow Course Evaluation Platform

Last Updated: 2026-02-06 21:10 CST

## Reference Documents
- **Progress**: See `PROGRESS.md` for detailed phase completion
- **Design**: See `DESIGN_CONTRACT.md` for UI/UX specifications
- **Changelog**: See `CHANGELOG.md` for recent changes

---

## ✅ 已修复 (2026-02-06 Audit)

### P0 权限绕过 + 隐私泄露 — ✅ FIXED
- **问题:** 课程详情接口无论权限都返回完整 reviews/comments/votes/author/user
- **修复:** 
  - 服务端按 `hasFullAccess` 过滤 review 内容
  - 非贡献者只能看到第一条完整 review，其余返回 `_redacted: true`
  - 所有 author 对象移除 email 字段
- **Commit:** `5074ce3`

### P0 调试接口暴露敏感信息 — ✅ FIXED
- **问题:** `/api/test-db` 无鉴权返回 userCount、环境信息、异常栈
- **修复:** 生产环境返回 404；开发环境只返回 `{status: 'ok'}`
- **Commit:** `5074ce3`

### P1 Instructor 评分统计错误 — ✅ FIXED
- **问题:** 只识别 A/B/C/D/F，AB/BC 算成 0
- **修复:** 7档映射 (A=5, AB=4.5, B=4, BC=3.5, C=3, D=2, F=1)
- **Commit:** `5074ce3`

### P1 登录页 Email 流程不可用 — ✅ FIXED
- **问题:** 表单提交到 /api/auth/signin/email，但只配置了 Google
- **修复:** 移除 Email 表单，只保留 Google OAuth
- **Commit:** `5074ce3`

### P1 并发下可产生重复 review — ✅ FIXED (Schema Ready)
- **问题:** 先查重再创建，无唯一约束
- **修复:** 添加 `@@unique([authorId, courseId, instructorId])`
- **注意:** Schema 已更新，需运行 `prisma migrate` 应用到数据库
- **Commit:** `5074ce3`

### P2 review.update 存在字段更新缺失 — ✅ FIXED
- **问题:** `recommendInstructor` 未写入；空 `assessments` 无法清空
- **修复:** 显式处理两个字段，使用 `!== undefined` 检查
- **Commit:** `5074ce3`

### P2 搜索接口对普通输入不稳 — ✅ FIXED
- **问题:** `to_tsquery(searchTerm + ':*')` 对特殊字符报错
- **修复:** 清理输入 `[^\w\s\-]`，空查询 fallback 到 ILIKE
- **Commit:** `5074ce3`

### P2 导航与路由不一致（404） — ✅ FIXED
- **问题:** /about、/profile/reviews 等不存在
- **修复:** 
  - 创建 `/about` 页面
  - UserMenu 链接改为 `/profile#reviews`, `/profile#saved`
  - 移除 Settings 链接（功能未实现）
- **Commit:** `5074ce3`

### P2 工程质量门禁未成型 — ✅ FIXED
- **问题:** lint 交互式初始化；tsc --noEmit 失败
- **修复:**
  - 创建 `.eslintrc.json` (extends next/core-web-vitals + next/typescript)
  - tsconfig 移除 `.next/types` (Next.js 自动添加)
  - 忽略 `next-env.d.ts` (生成文件)
- **结果:** 0 errors, 59 warnings
- **Commit:** `38aa766`

---

## ⚠️ 待处理

### DB Migration Drift
- **问题:** Prisma migrations 与实际 schema 不同步
- **建议:** 考虑 `prisma migrate reset` 或手动同步

---

## 技术债务 / Technical Debt

1. **组件统一:** FilterPanel, UserMenu, ReviewCard 等需要重构
2. **测试覆盖:** 暂无自动化测试
3. **Error Boundary:** 需要更好的错误处理 UI
4. **ESLint 配置:** 需要现代化配置

---

## 数据库统计 / Database Stats

```
Schools:       23
Courses:       10,174
Departments:   209
Cross-listed:  1,368 groups
Full-text:     All indexed
```
