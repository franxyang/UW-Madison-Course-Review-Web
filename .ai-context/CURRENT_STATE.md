# AI Context - Current State

**Last Updated**: 2026-02-04 02:35 CST

---

## 🎯 当前状态

**Phase 1 (Infrastructure)**: ✅ 100% 完成  
**Phase 2 (Core Features)**: 🔄 ~45% 进行中  
**阻塞问题**: 无  

---

## 📍 架构总览

```
✅ Next.js 15 + TypeScript + Tailwind CSS
✅ PostgreSQL (Neon Serverless, US East Ohio)
✅ Prisma ORM (schema.prisma — 完整)
✅ NextAuth.js v5 (Google OAuth, @wisc.edu 限制)
✅ tRPC + React Query (端到端类型安全)
✅ Full-text Search (tsvector + GIN index)
✅ Redis Caching (Upstash, graceful degradation)
✅ Course Aliases (60+ alias groups, CS↔COMP SCI)
✅ Left Sidebar Filters (school/dept/level/credits/sort)
✅ Pagination (30/page)
```

### 数据库统计
```
Schools:       23
Courses:       10,174
Departments:   209
Course-Dept:   10,174 links
Cross-listed:  1,368 groups
```

### 代码库统计
```
Source:    ~6,355 lines (.ts/.tsx)
Routes:   3 tRPC routers (course, review, comment)
Pages:    /courses, /courses/[id], /auth/signin, /auth/signup, /profile
Components: ~15 (FilterPanel, CourseList, ReviewForm, VoteButton, etc.)
```

---

## ✅ Phase 1 完成清单 (全部完成)

1. PostgreSQL 迁移 (SQLite → Neon)
2. tRPC 集成 (替代 Server Actions)
3. Full-text Search (tsvector + GIN)
4. Redis Caching (Upstash)
5. Department 模型 + 数据导入 (209个)
6. Course 数据完善 (4,787 → 10,174)
7. 课程别名搜索 (60+ groups)
8. 左侧栏过滤器 (多选、层级)
9. Cross-listed 课程 (1,368 groups)
10. Department 过滤修复 + 分页

---

## 🔄 Phase 2 待完成项

### 高优先级
- [ ] 高级搜索 (按教授、学期、GPA 范围)
- [ ] Review 编辑/删除 (用户管理自己的评价)
- [ ] Instructor 页面 (/instructors, /instructors/[id])
- [ ] 用户 Dashboard

### 中优先级
- [ ] Review 举报系统
- [ ] Mobile 响应式优化
- [ ] UI/UX 打磨

---

## 📂 关键文件位置

```
prisma/schema.prisma          - 数据库 Schema
server/api/routers/course.ts  - 课程 tRPC Router (list, byId, search, getSchools, getDepartments)
server/api/routers/review.ts  - 评价 Router (create, vote)
server/api/routers/comment.ts - 评论 Router (create, delete)
components/FilterPanel.tsx    - 左侧过滤器 UI
components/CourseList.tsx     - 课程列表 (旧版，有 mock 数据)
app/courses/page.tsx          - 课程浏览页 (使用 tRPC)
app/courses/[id]/page.tsx     - 课程详情页
lib/courseAliases.ts          - 课程代码别名映射
lib/redis.ts                  - Redis 缓存封装
```

---

## 🧠 关键技术决策

| 决策 | 选择 | 原因 |
|------|------|------|
| DB Provider | Neon (非 Supabase) | 无限流量, Branching, 更便宜 |
| API Layer | tRPC (替代 Server Actions) | 类型安全, 缓存, React Query |
| Search | PostgreSQL tsvector | 原生, 免费, 高性能 |
| Cache | Upstash Redis | Serverless, graceful degradation |
| Course-Dept | 多对多 (CourseDepartment) | 支持 cross-listed 课程 |

---

**维护规则**: 每次重大变更后更新此文件
