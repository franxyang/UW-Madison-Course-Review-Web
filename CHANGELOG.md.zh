# Changelog

所有重要的变更都会记录在这个文件中。

格式基于 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)，
版本号遵循 [Semantic Versioning](https://semver.org/lang/zh-CN/)。

---

## [Unreleased]

### 即将进行
- tRPC 集成（端到端类型安全）
- PostgreSQL 全文搜索
- Redis 缓存层
- 完整的 Filter 功能

---

## [0.2.0] - 2026-02-03

### 🎉 Added（新增）

#### 数据库
- **PostgreSQL 迁移完成**
  - 从 SQLite 迁移到 Neon PostgreSQL
  - 连接字符串: `postgresql://...@ep-jolly-haze-...-pooler.c-2.us-east-2.aws.neon.tech/neondb`
  - Region: US East (Ohio)
  - 免费套餐: 0.5GB 存储, 无限流量

- **Department 模型**
  - 新增 `Department` 表
  - 新增 `CourseDepartment` 多对多关系表
  - 支持一门课程属于多个 Department
  ```prisma
  model Department {
    id        String   @id @default(cuid())
    code      String   @unique     // "COMP SCI", "MATH"
    name      String                // "Computer Sciences"
    schoolId  String
    school    School   @relation(...)
    courses   CourseDepartment[]
  }
  ```

- **数据导入**
  - 23 所学院数据 ✅
  - 4,787 门课程数据 ✅
  - CSV 来源: `madgrades-extractor-master/src/main/resources/aefis_courses.csv`

#### 文档系统
- **docs/ 文件夹结构**
  - 所有技术文档移到 `docs/`
  - 创建 `docs/README.md` 文档索引
  - 创建 `docs/SESSION_SUMMARY_2026-02-03.md` 会话总结
  
- **新增技术文档**
  1. `wiscflow完整设计方案.md` - 完整产品设计
  2. `PROJECT_ROADMAP.md` - 项目路线图
  3. `TECH_UPGRADE_PLAN.md` - 技术架构升级计划
  4. `EVALUATION_REPORT.md` - 设计 vs 代码评估
  5. `SUPABASE_VS_NEON.md` - 数据库服务商对比
  6. `MIGRATION_CHECKLIST.md` - 迁移执行清单
  7. `MIGRATION_COMPLETED.md` - 迁移完成报告（已脱敏）
  8. `FILTER_IMPLEMENTATION.md` - Filter 功能实现计划

- **进度追踪系统**
  - `PROGRESS.md` - 开发进度追踪
  - `CHANGELOG.md` - 变更日志（本文件）
  - `.ai-context/` - AI 上下文记录文件夹

#### 工具脚本
- `scripts/check-sensitive-info.sh` - 敏感信息检查脚本
- `scripts/checkCourseCount.ts` - 课程数量检查

### 🔧 Changed（变更）

#### Prisma Schema
- **datasource 变更**
  ```diff
  datasource db {
  - provider = "sqlite"
  + provider = "postgresql"
    url      = env("DATABASE_URL")
  }
  ```

- **数据类型优化**
  - `Course.description`: `String` → `String @db.Text`
  - `Course.prerequisiteText`: `String?` → `String? @db.Text`
  - `Review` 的所有 comment 字段: `String?` → `String? @db.Text`
  - `Comment.text`: `String` → `String @db.Text`

- **关系更新**
  - `Course` 新增 `departments` 关系
  - `School` 新增 `departments` 关系

#### 环境变量
- `.env` 更新为 PostgreSQL 连接字符串
- `.env.local` 更新为 PostgreSQL 连接字符串
- **注意**: 已确保 `.env*` 在 `.gitignore` 中 ✅

### 🗃️ Database Migrations

#### Migration 1: `20260204050718_init_postgresql`
**目的**: 初始化 PostgreSQL 数据库结构

**变更**:
- 创建所有表（User, School, Course, Review, Comment, Vote, Instructor, GradeDistribution, etc.）
- 应用 PostgreSQL 特定的数据类型
- 创建所有索引和外键约束

**执行时间**: 2026-02-03 23:07:18  
**状态**: ✅ 成功

#### Migration 2: `20260204052057_add_departments`
**目的**: 添加 Department 模型和多对多关系

**变更**:
- 创建 `Department` 表
- 创建 `CourseDepartment` junction 表
- 添加外键约束到 School
- 添加索引 `Department(schoolId)`

**执行时间**: 2026-02-03 23:20:57  
**状态**: ✅ 成功

### 🐛 Fixed（修复）

1. **课程详情页 null 数组错误**
   - **问题**: `course.breadths.length` 在 breadths 为 null 时报错
   - **修复**: 添加 null 检查 `course.breadths && course.breadths.length > 0`
   - **文件**: `app/courses/[id]/page.tsx`
   - **受影响字段**: `breadths`, `assessments`

2. **PostgreSQL Advisory Lock 超时**
   - **问题**: `prisma migrate` 时 advisory lock 超时
   - **原因**: dev server 占用数据库连接
   - **解决**: kill dev server 进程后重试

### 📚 Documentation（文档）

#### 安全和隐私
- **敏感信息脱敏**
  - `MIGRATION_COMPLETED.md` 移除真实连接字符串
  - 创建检查脚本防止泄露
  - 文档中的示例使用占位符

- **GitHub 上传指南**
  - `docs/README.md` 包含完整的上传清单
  - 标记哪些文档可以安全上传
  - 提供脱敏示例

#### AI 上下文保持
- **会话总结**: `docs/SESSION_SUMMARY_2026-02-03.md`
  - 记录本次会话所有工作
  - 包含决策理由和问题解决过程
  - 方便模型 compact 后恢复上下文

### ⚡ Performance（性能）

#### 当前性能基准
- **搜索速度**: ~300-500ms (LIKE 查询)
- **页面加载**: ~500-800ms
- **数据库**: PostgreSQL Serverless（有冷启动）

#### 计划优化
- PostgreSQL 全文搜索 → 目标 <100ms
- Redis 缓存 → 目标缓存命中 <20ms
- React Query 缓存 → 减少重复请求

---

## [0.1.0] - 2026-02-01 ~ 2026-02-02

### 🎉 Added（新增）

#### 基础架构
- **Next.js 15 项目初始化**
  - App Router
  - TypeScript
  - Tailwind CSS
  
- **Prisma ORM 配置**
  - SQLite 数据库（初始）
  - Schema 设计完成
  - Migrations 设置

- **NextAuth.js 认证**
  - Google OAuth Provider
  - 会话管理
  - UW Madison 邮箱验证

#### 核心功能
- **课程系统**
  - 课程列表页 (`/courses`)
  - 课程详情页 (`/courses/[id]`)
  - 基础搜索功能
  - 学院筛选

- **评价系统**
  - 评价表单组件
  - 四维度评分（内容/教学/评分/工作量）
  - 评价展示卡片
  - 点赞功能（VoteButton）
  - 评论功能（CommentSection）

- **数据可视化**
  - 成绩分布条形图
  - 评分统计
  - 先修课程关系展示（简单列表）

#### UI 组件
- Logo 组件
- UserMenu / GuestMenu
- ReviewForm
- VoteButton
- CommentSection
- CourseDetail
- CourseList

### 🔧 Changed（变更）

#### 初始数据模型
```prisma
- User (认证用户)
- School (学院)
- Course (课程)
- Instructor (教师)
- Review (评价)
- Comment (评论)
- Vote (点赞)
- GradeDistribution (成绩分布)
- SavedCourse (收藏课程)
- StudentCourseHistory (学生选课记录)
```

### 📝 Notes（备注）

- 初始版本使用 SQLite，为后续迁移到 PostgreSQL 做准备
- 评价系统完全由用户生成，没有预置数据
- 所有 OAuth 配置通过环境变量管理

---

## 版本定义

### 版本号格式: `MAJOR.MINOR.PATCH`

- **MAJOR**: 重大架构变更或不兼容的 API 变更
- **MINOR**: 新功能添加，向后兼容
- **PATCH**: Bug 修复和小的改进

### 当前版本: `0.2.0`
- `0.x.x`: 开发阶段，未发布
- `1.0.0`: 第一个公开 Beta 版本（目标：3-4 周后）

---

## Commit Message 规范

我们使用 [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) 规范：

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档变更
- `style`: 代码格式（不影响功能）
- `refactor`: 重构（既不是新增功能，也不是修复bug）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `ci`: CI 配置变更
- `build`: 影响构建系统或外部依赖

### 示例
```bash
feat(database): migrate to PostgreSQL from SQLite

- Set up Neon PostgreSQL database
- Update Prisma schema for PostgreSQL
- Migrate all data (23 schools, 4787 courses)
- Add @db.Text annotations for long text fields

BREAKING CHANGE: SQLite no longer supported
```

---

## 贡献指南

### 开发流程
1. 从 `main` 分支创建功能分支
2. 开发并测试
3. 更新 `PROGRESS.md` 和 `CHANGELOG.md`
4. 提交 PR，等待 review
5. 合并后自动部署

### Commit 前检查清单
- [ ] 代码通过 ESLint
- [ ] TypeScript 无错误
- [ ] 测试通过
- [ ] 更新 `PROGRESS.md`
- [ ] 更新 `CHANGELOG.md`
- [ ] 检查敏感信息（运行 `check-sensitive-info.sh`）

---

**维护者**: Franx (franxyixx)  
**AI 助手**: Claude (Clawdbot)  
**最后更新**: 2026-02-03 23:27 CST
