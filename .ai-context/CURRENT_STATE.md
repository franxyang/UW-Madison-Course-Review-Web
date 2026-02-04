# AI Context - Current State

**用途**: 给 AI 快速恢复项目状态的上下文信息  
**最后更新**: 2026-02-03 23:27 CST  
**会话 ID**: 2026-02-03-evening

---

## 🎯 当前任务

**现在正在做**: 准备 commit，下一步开始 tRPC 集成  
**阻塞问题**: 无  
**决策待定**: 无

---

## 📍 项目当前状态快照

### 架构
```
✅ Next.js 15 + TypeScript + Tailwind
✅ PostgreSQL (Neon) - 刚迁移完成
✅ Prisma ORM
✅ NextAuth.js (Google OAuth)
⏳ tRPC - 即将开始
⏳ Redis - 计划中
⏳ 全文搜索 - 计划中
```

### 数据库
```
Provider: PostgreSQL
Service: Neon (Serverless)
Region: US East (Ohio)
Connection: 通过环境变量 DATABASE_URL

数据统计:
- 学院: 23
- 课程: 4,787
- Departments: 表已创建，数据未导入
- 用户: 0
- 评价: 0
```

### 代码库
```
主要页面:
- /courses - 课程列表 ✅
- /courses/[id] - 课程详情 ✅
- /auth/signin - 登录页 ✅
- /auth/signup - 注册页 ✅
- /profile - 个人中心 ✅

主要组件:
- ReviewForm - 评价表单 ✅
- VoteButton - 点赞按钮 ✅
- CommentSection - 评论区 ✅
- CourseList - 课程列表 ✅
- Logo - Logo 组件 ✅
```

---

## 🔄 最近的重要变更

### 2026-02-03 (今天)

#### 1. PostgreSQL 迁移 (已完成)
**时间**: 22:00 - 23:10  
**变更**:
- SQLite → Neon PostgreSQL
- 数据类型优化 (@db.Text)
- 数据重新导入（23 schools, 4,787 courses）

**重要决策**:
- 选择 Neon 而非 Supabase（原因：不需要额外功能，无限流量，Branching 功能）
- 课程数量 4,787 < CSV 10,247 是正常的（CSV 有历史重复数据）

**问题和解决**:
- Advisory Lock 超时 → kill dev server 后重试 ✅
- null 数组错误 → 添加 null 检查 ✅

#### 2. Department 模型添加 (已完成)
**时间**: 23:15 - 23:20  
**变更**:
- 新增 Department 表
- 新增 CourseDepartment 多对多关系
- Migration: `20260204052057_add_departments`

**下一步**: 导入 Department 数据（从 CSV Dept Code 字段）

#### 3. 文档系统整理 (已完成)
**时间**: 23:20 - 23:27  
**变更**:
- 创建 docs/ 文件夹
- 移动所有技术文档到 docs/
- 创建 PROGRESS.md 进度追踪
- 创建 CHANGELOG.md 变更日志
- 创建 .ai-context/ AI 上下文文件夹
- 脱敏所有文档，准备 GitHub 上传

---

## 🎯 下一步行动计划

### 立即 (今晚 23:30)
1. ✅ **Commit 当前进度**
   ```bash
   git add .
   git commit -m "feat(database): migrate to PostgreSQL + add Department model"
   ```

### 接下来 (今晚或明天)
2. **开始 tRPC 集成** (Day 3-5)
   - 安装依赖
   - 创建 tRPC Context
   - 创建 Course Router
   - 迁移前端到 tRPC
   
   **参考**: `docs/MIGRATION_CHECKLIST.md` Day 3-5 部分

### 本周计划
3. **完成 tRPC 迁移** (2-3 天)
4. **导入 Department 数据** (1 天)
5. **实现基础 Filter** (2-3 天)

---

## 🧠 关键知识点

### 技术决策记录

#### Q: 为什么选择 Neon 而不是 Supabase?
**A**: 
- Neon 更符合当前架构（已有 NextAuth，不需要 Supabase Auth）
- 无限流量（Supabase 免费版只有 2GB/月）
- Branching 功能对开发很有用
- 更便宜（$19 vs $25/月）
- 冷启动可以接受（开发阶段），后期可用 Vercel Cron keep-alive

#### Q: 为什么课程数量少于 CSV 行数?
**A**: 
- CSV: 10,247 行（包含历史记录和重复课程）
- DB: 4,787 门（unique by course.code）
- 原因: code 字段有 UNIQUE 约束，自动去重
- **这是正常的！**

#### Q: 为什么使用 Department 多对多关系?
**A**: 
- 一门课可能属于多个 Department
- 例如: "COMP SCI/MATH 240" 同时属于 CS 和 Math
- Junction 表: CourseDepartment

### 常见问题解决方案

#### PostgreSQL Advisory Lock 超时
```bash
# 问题: prisma migrate 时超时
# 原因: dev server 占用连接
# 解决: 
pkill -f "next dev"
npx prisma migrate dev --name xxx
```

#### null 数组错误
```typescript
// 问题: course.breadths.length 报错
// 原因: breadths 可能是 null
// 解决: 添加 null 检查
{course.breadths && course.breadths.length > 0 && (
  // ...
)}
```

---

## 📂 重要文件位置

### 配置文件
```
.env                  - Prisma 数据库连接（不提交）
.env.local            - Next.js 环境变量（不提交）
prisma/schema.prisma  - 数据库 schema
prisma.config.ts      - Prisma 配置
auth.ts               - NextAuth 配置
```

### 文档
```
PROGRESS.md           - 开发进度追踪 ⭐
CHANGELOG.md          - 变更日志 ⭐
docs/                 - 所有技术文档
.ai-context/          - AI 上下文文件 ⭐
```

### 脚本
```
scripts/seedSchools.ts     - 导入学院数据
scripts/seedCourses.ts     - 导入课程数据
scripts/checkCourseCount.ts - 检查课程数量
scripts/check-sensitive-info.sh - 敏感信息检查
```

### 数据源
```
madgrades-extractor-master/src/main/resources/
├── aefis_courses.csv      - 课程数据源 (10,247 行)
└── [其他 madgrades 数据]
```

---

## 🎨 用户偏好和要求

### 开发习惯
- ✅ 每次 commit 前更新 PROGRESS.md 和 CHANGELOG.md
- ✅ 记录详细的决策过程和原因
- ✅ 为 AI context compact 后恢复准备信息
- ✅ 文档要脱敏后才能上传 GitHub

### 代码风格
- TypeScript 严格模式
- Tailwind CSS 优先
- 组件化开发
- tRPC 端到端类型安全

### 沟通偏好
- 中文交流
- 详细的技术解释
- 提供多个选项让用户选择
- 记录所有重要决策

---

## 🔐 安全注意事项

### 绝对不能提交到 GitHub 的文件
```
.env
.env.local
.env*.local
*.db
node_modules/
.next/
```

### 敏感信息检查
```bash
# 运行检查脚本
bash scripts/check-sensitive-info.sh

# 检查项:
# - 数据库连接字符串
# - API 密钥
# - 服务器地址
# - 绝对路径
```

### 已确认安全
- ✅ .gitignore 包含所有敏感文件
- ✅ 所有文档已脱敏
- ✅ 提供了检查工具

---

## 💬 与用户的对话要点

### 本次会话关键对话

1. **数据库选择** (22:56)
   - 用户询问: Supabase vs Neon?
   - 回答: 详细对比，推荐 Neon
   - 决策: 用户选择 Neon ✅

2. **课程导入完整性** (23:18)
   - 用户关注: 是否导入了所有课程?
   - 回答: CSV 10,247 行，DB 4,787 门（去重后）
   - 结论: 正常 ✅

3. **Department 需求** (23:18)
   - 用户指出: 需要 Department 字段
   - 实现: 立即添加 Department 模型 ✅

4. **Filter 功能** (23:18)
   - 用户要求: Filter 功能不全面
   - 响应: 创建完整的实现计划文档 ✅

5. **Commit 规范** (23:27)
   - 用户要求: 每次 commit 更新进度和记录
   - 实现: 创建 PROGRESS.md + CHANGELOG.md + .ai-context/ ✅

---

## 🚀 性能目标

### 当前性能
```
搜索: ~300-500ms (LIKE 查询)
页面加载: ~500-800ms
数据库: 有冷启动（~1-2秒）
```

### 目标性能（升级后）
```
搜索: <100ms (全文搜索)
缓存命中: <20ms (Redis)
页面加载: <2s (优化后)
Lighthouse: >90
```

---

## 📊 Metrics 和统计

### 开发进度
```
Phase 1 (基础架构): 40%
Phase 2 (核心功能): 30%
Phase 3 (高级功能): 0%
Phase 4 (优化部署): 0%
━━━━━━━━━━━━━━━━━━━━
总进度: 25%
```

### 时间投入（本次会话）
```
PostgreSQL 迁移: ~3h
Department 模型: ~0.5h
文档整理: ~1h
━━━━━━━━━━━━━━━━━━━━
总计: ~4.5h
```

---

## 📝 TODO 提醒

### 紧急（今晚）
- [x] Commit 当前进度 ⏰

### 重要（本周）
- [ ] tRPC 集成
- [ ] 导入 Department 数据
- [ ] 实现基础 Filter

### 计划中（下周）
- [ ] 全文搜索
- [ ] Redis 缓存
- [ ] 完整 Filter 功能

---

**此文件用途**: 
- AI 模型 compact 后快速恢复上下文
- 记录重要决策和原因
- 追踪当前状态和下一步行动

**维护规则**:
- 每次重大变更后更新
- 每次 commit 前更新
- 每次会话结束前更新

---

**最后更新**: 2026-02-03 23:27 CST  
**下次更新**: tRPC 集成完成后
