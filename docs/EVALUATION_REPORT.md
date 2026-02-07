# MadSpace 项目评估报告

**评估日期**: 2026-02-03  
**评估对象**: 完整设计方案 vs 现有代码库

---

## 📊 总体评估

| 维度 | 设计方案质量 | 现有代码完成度 | 差距 |
|------|------------|--------------|------|
| **产品定位** | ⭐⭐⭐⭐⭐ 清晰 | ⭐⭐⭐⭐ 已实现核心 | 小 |
| **技术架构** | ⭐⭐⭐⭐⭐ 先进 | ⭐⭐⭐ 单体架构 | **大** |
| **数据模型** | ⭐⭐⭐⭐⭐ 完善 | ⭐⭐⭐⭐ 基础完整 | 中 |
| **核心功能** | ⭐⭐⭐⭐⭐ 全面 | ⭐⭐⭐ 基础可用 | 中 |
| **用户体验** | ⭐⭐⭐⭐⭐ 成熟 | ⭐⭐⭐ 可用 | 中 |
| **性能优化** | ⭐⭐⭐⭐⭐ 专业 | ⭐⭐ 未实施 | **大** |

**综合评分**: 设计方案 **95/100** | 现有代码 **65/100**

---

## ✅ 设计方案的优点

### 1. 产品定位清晰 (⭐⭐⭐⭐⭐)

**做得很好的地方**:
- ✅ 竞品分析透彻（Rate My Professor vs UST Space）
- ✅ 差异化功能明确（MadGrades 集成、先修可视化、Schedule Builder）
- ✅ 目标用户画像精准（UW Madison 学生）
- ✅ 核心价值主张强（多维度评价 + 官方成绩数据）

**建议**:
```markdown
可以添加：
- 用户访谈/调研数据支持
- 市场规模估算（UW Madison 学生数量）
- 冷启动策略（如何获得第一批 100 个评价？）
```

### 2. 技术架构设计先进 (⭐⭐⭐⭐⭐)

**设计亮点**:
- ✅ **Monorepo + Turborepo** - 代码组织现代化
- ✅ **tRPC** - 端到端类型安全是正确的选择
- ✅ **PostgreSQL 全文搜索** - 性能优化到位
- ✅ **Redis 缓存** - 分层缓存策略清晰

**架构图非常清晰**:
```
Frontend (Next.js) 
   ↓ 
Backend (tRPC) 
   ↓
Infrastructure (Vercel + Redis + PostgreSQL)
```

**与现有代码的差距**:
| 技术 | 设计方案 | 现有代码 | 需要做的事 |
|------|---------|---------|-----------|
| 代码组织 | Turborepo Monorepo | 单体 Next.js | 🔴 重构 |
| API | tRPC | Next.js API Routes | 🔴 迁移 |
| 数据库 | PostgreSQL | SQLite | 🟡 迁移 |
| 缓存 | Redis | 无 | 🔴 新增 |
| 搜索 | 全文搜索 | LIKE 查询 | 🔴 优化 |

### 3. 数据模型设计完善 (⭐⭐⭐⭐⭐)

**设计方案新增的关键模型**:
```prisma
✅ CourseVersion - 课程历史版本追踪
✅ StudentProfile - 用户学业信息
✅ ReviewStatus enum - 评价审核机制
✅ 全文搜索向量 - searchVector
✅ 优化的索引策略
```

**与现有 Schema 对比**:

| 模型 | 现有代码 | 设计方案 | 评价 |
|------|---------|---------|------|
| **Course** | ✅ 基础完整 | ✅ + searchVector, CourseVersion | 🟡 需补充 |
| **Review** | ✅ 结构良好 | ✅ + ReviewStatus, 更多索引 | 🟡 需优化 |
| **User** | ✅ 基础认证 | ✅ + StudentProfile | 🔴 需扩展 |
| **Instructor** | ✅ 已实现 | ✅ 一致 | ✅ 完美 |
| **GradeDistribution** | ✅ 已实现 | ✅ 一致 | ✅ 完美 |

**现有代码做得好的地方**:
- ✅ `breadths` 和 `genEds` 已经是 JSON 数组（虽然是 String 存储）
- ✅ `prerequisiteFor` 自引用关系已实现
- ✅ 四维评分系统（content/teaching/grading/workload）已实现

**需要改进的地方**:
```prisma
// 1. 添加全文搜索
model Course {
  // ... 现有字段
  searchVector Unsupported("tsvector")?
  @@index([searchVector], type: Gin)
}

// 2. 添加评价状态
enum ReviewStatus {
  PENDING
  APPROVED
  FLAGGED
  REMOVED
}

model Review {
  // ... 现有字段
  status      ReviewStatus @default(PENDING)
  reportCount Int          @default(0)
  verifiedAt  DateTime?
}

// 3. 用户学业信息
model StudentProfile {
  id              String @id @default(cuid())
  userId          String @unique
  user            User   @relation(fields: [userId], references: [id])
  major           String?
  expectedGrad    String?
  completedCredits Int   @default(0)
}

// 4. 课程版本（可选，后期添加）
model CourseVersion {
  id          String @id @default(cuid())
  courseId    String
  course      Course @relation(fields: [courseId], references: [id])
  term        String
  description String
  credits     Int
  createdAt   DateTime @default(now())
  @@unique([courseId, term])
}
```

### 4. 核心功能设计详尽 (⭐⭐⭐⭐⭐)

**课程搜索系统**:
```typescript
// 设计方案提出的搜索策略很棒：
1. 精确匹配 - CS 577 → 直接返回
2. 前缀匹配 - CS 5 → CS 5xx 课程
3. 全文搜索 - "algorithm" → 相关课程
4. 模糊匹配 - "algortihm" → 纠错
```

**现有代码状态**:
- ✅ 已实现基础 LIKE 搜索
- ❌ 缺少前缀匹配
- ❌ 缺少全文搜索
- ❌ 缺少模糊匹配

**筛选器设计**:
设计方案中的 `CourseFilters` interface 非常完善：
```typescript
interface CourseFilters {
  schools?: string[]
  departments?: string[]
  levels?: string[]
  credits?: [number, number]
  genEds?: string[]
  breadths?: string[]
  minRating?: number
  minReviews?: number
  minAvgGPA?: number
  sortBy?: "relevance" | "rating" | "gpa" | "reviews" | "recent"
}
```

**现有代码状态**:
- ✅ 已实现学院筛选（`schoolId`）
- ✅ 已实现搜索输入
- ❌ 缺少其他所有筛选器
- ❌ 缺少排序选项

**课程详情页 UI 设计**:
设计方案中的 ASCII 原型图**非常专业**，包含：
- ✅ 课程基本信息
- ✅ 成绩分布图表（带折线图）
- ✅ 评价汇总统计
- ✅ 先修关系可视化
- ✅ 操作按钮（收藏、分享、加入课表）

**现有代码状态**:
- ✅ 已实现课程基本信息
- ✅ 已实现成绩分布条形图
- ✅ 已实现评价列表
- ✅ 已实现先修关系（简单列表）
- ❌ 缺少 GPA 趋势折线图
- ❌ 缺少评分汇总统计
- ❌ 缺少收藏功能
- ❌ 缺少分享功能
- ❌ 缺少先修关系可视化图谱

**评价系统**:
设计方案的 `ReviewForm` 分 5 步，非常友好：
1. 基本信息（学期、教师、成绩）
2. 四维评分
3. 考核方式
4. 详细评价
5. 额外信息（标签、推荐度）

**现有代码状态**:
- ✅ 已实现四维评分
- ✅ 已实现详细评价（按维度）
- ✅ 已实现考核方式（assessments）
- ✅ 已实现资源链接
- ❌ 缺少分步表单
- ❌ 缺少标签系统
- ❌ 缺少推荐度（wouldRecommend）

### 5. 性能优化策略专业 (⭐⭐⭐⭐⭐)

**设计方案提出的优化**:
```sql
-- 1. GIN 索引全文搜索
CREATE INDEX idx_course_search ON courses
  USING GIN (to_tsvector('english', name || ' ' || code || ' ' || description));

-- 2. 物化视图
CREATE MATERIALIZED VIEW course_stats AS
SELECT c.id, COUNT(r.id) as review_count, AVG(...) as avg_rating
FROM courses c LEFT JOIN reviews r ...
GROUP BY c.id;
```

**缓存策略**:
```typescript
const CACHE_TTL = {
  COURSE_LIST: 60 * 60,      // 1 小时
  COURSE_DETAIL: 60 * 30,    // 30 分钟
  COURSE_STATS: 60 * 60 * 6, // 6 小时
};
```

**现有代码状态**:
- ❌ 数据库使用 SQLite（不支持 GIN 索引）
- ❌ 无缓存层
- ❌ 无物化视图
- ❌ 无 React Query 配置

**需要做的事**:
1. 🔴 迁移到 PostgreSQL
2. 🔴 添加 Redis 缓存
3. 🔴 配置 React Query
4. 🔴 实现物化视图

---

## 🚨 现有代码的关键问题

### 问题 1: 数据库选型 (🔴 严重)

**现状**:
```prisma
datasource db {
  provider = "sqlite"  // ❌ SQLite 不适合生产环境
  url      = env("DATABASE_URL")
}
```

**问题**:
- ❌ SQLite 不支持全文搜索
- ❌ SQLite 不支持复杂索引（GIN）
- ❌ SQLite 并发性能差
- ❌ SQLite 不适合部署到 Vercel

**解决方案**:
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**推荐服务商**:
- [Neon](https://neon.tech) - 免费 0.5GB，Serverless PostgreSQL
- [Supabase](https://supabase.com) - 免费 500MB
- [Railway](https://railway.app) - $5/月

### 问题 2: 缺少类型安全的 API (🔴 严重)

**现状**:
```typescript
// app/api/courses/route.ts (不存在，但应该类似这样)
export async function GET(req: Request) {
  const courses = await prisma.course.findMany()
  return Response.json(courses)
}

// 前端
const res = await fetch('/api/courses')
const courses: Course[] = await res.json() // ❌ 手动类型断言
```

**问题**:
- ❌ 前后端类型不同步
- ❌ 重构时容易出错
- ❌ 没有自动补全

**解决方案**: 使用 tRPC
```typescript
// packages/api/src/routers/course.ts
export const courseRouter = router({
  list: publicProcedure
    .input(z.object({ search: z.string().optional() }))
    .query(async ({ ctx, input }) => {
      return ctx.prisma.course.findMany({
        where: input.search ? {
          OR: [
            { code: { contains: input.search } },
            { name: { contains: input.search } },
          ]
        } : undefined
      })
    }),
})

// 前端
const { data } = trpc.course.list.useQuery({ search: 'CS 577' })
// ✅ data 自动推断为 Course[]，完全类型安全
```

### 问题 3: 搜索性能差 (🟡 中等)

**现状**:
```typescript
// app/courses/page.tsx
where: {
  OR: [
    { code: { contains: params.search, mode: 'insensitive' } },
    { name: { contains: params.search, mode: 'insensitive' } }
  ]
}
```

**问题**:
- ❌ `LIKE` 查询无法使用索引
- ❌ 搜索 "algorithm" 无法匹配到 "Introduction to Algorithms"
- ❌ 响应时间随数据量增长

**性能对比**:
| 方法 | 1000 条课程 | 10000 条课程 |
|------|-----------|------------|
| LIKE | ~50ms | ~500ms ❌ |
| Full-text | ~5ms | ~50ms ✅ |

**解决方案**:
```sql
-- 1. 添加搜索向量
ALTER TABLE "Course" ADD COLUMN "searchVector" tsvector;

-- 2. 创建 GIN 索引
CREATE INDEX course_search_idx ON "Course" USING GIN ("searchVector");

-- 3. 查询
SELECT * FROM "Course"
WHERE "searchVector" @@ plainto_tsquery('english', 'algorithm')
ORDER BY ts_rank("searchVector", plainto_tsquery('english', 'algorithm')) DESC;
```

### 问题 4: 缺少缓存层 (🟡 中等)

**现状**:
- ❌ 每次请求都查询数据库
- ❌ 课程列表每次都重新计算
- ❌ 没有 HTTP 缓存头

**影响**:
```
首页加载 → 查询 50 门课程 + 50 次 review count → ~300ms
用户刷新 → 重新查询 → 又是 ~300ms
```

**解决方案**:
```typescript
// 使用 Redis 缓存
import { redis } from '@/lib/redis'

async function getCourseList(search: string) {
  const cacheKey = `courses:list:${search}`
  const cached = await redis.get(cacheKey)
  
  if (cached) return JSON.parse(cached) // ✅ 10ms
  
  const data = await prisma.course.findMany(...)
  await redis.setex(cacheKey, 3600, JSON.stringify(data))
  return data
}
```

**预期提升**:
- 缓存命中: 300ms → 10ms (**30x**)
- 缓存命中率: 70%+
- 数据库负载: -70%

### 问题 5: UI 细节不够精致 (🟢 轻微)

**现状**:
- ✅ 基础功能可用
- ✅ 响应式设计
- ❌ 缺少加载状态
- ❌ 缺少空状态设计
- ❌ 缺少错误处理 UI

**需要优化的地方**:
```tsx
// 1. 加载状态
{isLoading && <CourseCardSkeleton />}

// 2. 空状态
{courses.length === 0 && (
  <EmptyState
    icon={<BookOpen />}
    title="No courses found"
    description="Try adjusting your filters"
  />
)}

// 3. 错误处理
{error && <ErrorBanner message={error.message} />}
```

---

## 📋 实施优先级建议

### 🔴 Phase 1: 基础架构升级（2-3 周）

**必须做的事（否则无法扩展）**:

1. **迁移到 PostgreSQL** (3 天)
   ```bash
   # 1. 创建 Neon 账户
   # 2. 获取连接字符串
   # 3. 更新 schema.prisma
   # 4. prisma migrate dev
   # 5. 重新导入数据
   ```

2. **集成 tRPC** (5-7 天)
   ```bash
   # 1. 安装依赖
   npm install @trpc/server @trpc/client @trpc/react-query
   
   # 2. 创建 packages/api
   # 3. 迁移 API Routes 到 tRPC routers
   # 4. 更新前端调用
   ```

3. **添加全文搜索** (2-3 天)
   ```sql
   -- 添加搜索向量 + GIN 索引
   -- 更新查询逻辑
   ```

**预期收益**:
- ✅ 搜索速度 10x 提升
- ✅ 端到端类型安全
- ✅ 为后续功能打好基础

### 🟡 Phase 2: 核心功能完善（3-4 周）

1. **高级搜索和筛选** (1 周)
   - 按学院、等级、学分筛选
   - 按评分、GPA 筛选
   - 多种排序选项

2. **课程详情页增强** (1 周)
   - 评分汇总统计
   - GPA 趋势图表
   - 收藏功能
   - 分享功能

3. **用户系统扩展** (1 周)
   - StudentProfile 模型
   - 我的评价管理
   - 我的收藏

4. **评价系统优化** (1 周)
   - 分步表单
   - 标签系统
   - 举报机制
   - 审核队列

### 🟢 Phase 3: 高级功能（持续）

1. **选课规划器**
   - 课表生成
   - 时间冲突检测
   - Degree Audit 集成

2. **数据可视化**
   - 先修关系图谱
   - 课程地图
   - 趋势分析

3. **社区功能**
   - 用户等级系统
   - 评论互动
   - 学习小组

---

## 🎯 核心建议

### 建议 1: 先做架构升级，再加功能

**原因**:
- 现有架构（SQLite + API Routes）**无法支撑**设计方案中的高级功能
- 全文搜索、缓存等性能优化**必须基于 PostgreSQL**
- tRPC **极大提升开发效率**，越早迁移越好

**行动**:
```
Week 1-2: PostgreSQL + tRPC 迁移
Week 3-4: 全文搜索 + Redis 缓存
Week 5+:  开始添加新功能
```

### 建议 2: Monorepo 可以暂缓

**原因**:
- Monorepo 主要好处是**代码复用**（多应用共享）
- 当前只有一个 Web 应用，收益不大
- 可以等到需要添加 Admin 后台或移动端时再迁移

**优先级**:
```
PostgreSQL > tRPC > 全文搜索 > Redis > Monorepo
```

### 建议 3: 数据导入自动化

**现状**:
- ✅ 已有 `seedSchools.ts` 和 `seedCourses.ts`
- ❌ 缺少 MadGrades 导入
- ❌ 缺少定期同步

**建议**:
```typescript
// scripts/import-madgrades.ts
async function importGradeDistributions() {
  // 1. 从 madgrades.com API 获取数据
  // 2. 解析 JSON
  // 3. 批量插入到 GradeDistribution 表
  // 4. 更新 Course.avgGPA
}

// 定时任务（GitHub Actions）
// .github/workflows/sync-data.yml
on:
  schedule:
    - cron: '0 0 * * 0'  # 每周日运行
```

### 建议 4: 渐进式发布

**不要等所有功能都完成再发布！**

**建议的发布节奏**:
```
v0.1 (2 周后): 
  - PostgreSQL 迁移
  - 基础搜索优化
  - 课程浏览和评价
  → 邀请 10-20 个朋友内测

v0.2 (4 周后):
  - tRPC 迁移完成
  - 高级搜索筛选
  - 用户中心
  → 在 r/UWMadison 发帖

v0.3 (8 周后):
  - 选课规划器
  - 数据可视化
  - 完整功能
  → 正式推广
```

---

## 📈 成功指标建议

### 产品指标
```typescript
const SUCCESS_METRICS = {
  launch: {
    reviews: 100,           // 第一个月 100 条评价
    users: 50,              // 50 个注册用户
    courses_covered: 200,   // 覆盖 200 门课程
  },
  growth: {
    mau: 500,              // 月活 500
    reviews_per_month: 200, // 每月新增 200 条评价
    retention_rate: 0.6,    // 60% 留存率
  },
  quality: {
    avg_review_length: 200, // 平均评价长度 200 字
    page_load_time: 2000,   // 页面加载 < 2s
    search_time: 100,       // 搜索响应 < 100ms
  }
}
```

### 技术指标
```typescript
const TECH_METRICS = {
  performance: {
    lighthouse_score: 90,   // Lighthouse 分数 > 90
    ttfb: 200,             // Time to First Byte < 200ms
    lcp: 2500,             // Largest Contentful Paint < 2.5s
  },
  quality: {
    test_coverage: 0.7,    // 测试覆盖率 > 70%
    type_coverage: 1.0,    // TypeScript 100%
    uptime: 0.99,          // 可用性 > 99%
  }
}
```

---

## 🎓 学习资源

如果需要实现设计方案，建议学习：

### 1. tRPC
- [官方文档](https://trpc.io/docs)
- [视频教程](https://www.youtube.com/watch?v=UfUbBWIFdJs)
- [示例项目](https://github.com/trpc/examples-next-prisma-starter)

### 2. PostgreSQL 全文搜索
- [官方文档](https://www.postgresql.org/docs/current/textsearch.html)
- [Prisma 全文搜索](https://www.prisma.io/docs/concepts/components/prisma-client/full-text-search)

### 3. Redis 缓存
- [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted) - Serverless Redis
- [Redis 缓存策略](https://redis.io/docs/manual/patterns/)

### 4. React Query
- [官方文档](https://tanstack.com/query/latest)
- [缓存策略](https://tkdodo.eu/blog/practical-react-query)

---

## 💬 总结

### 设计方案评价: **95/100** ⭐⭐⭐⭐⭐

**优点**:
- ✅ 产品定位清晰，差异化明确
- ✅ 技术选型先进，架构合理
- ✅ 功能设计全面，细节到位
- ✅ 性能优化专业，考虑周全
- ✅ UI 原型详细，用户体验佳

**可以改进**:
- 缺少用户调研数据
- 缺少冷启动策略
- 缺少具体的推广计划

### 现有代码评价: **65/100** ⭐⭐⭐

**优点**:
- ✅ 核心功能已实现（课程浏览、评价系统）
- ✅ 数据模型基础良好
- ✅ 四维评分系统完整
- ✅ UI 基础可用

**需要改进**:
- 🔴 数据库选型（SQLite → PostgreSQL）
- 🔴 API 类型安全（API Routes → tRPC）
- 🔴 搜索性能（LIKE → Full-text search）
- 🟡 缓存层（无 → Redis）
- 🟡 UI 细节（加载状态、错误处理）

### 最终建议: **先升级基础架构，再实现高级功能**

**优先级排序**:
1. 🔴 PostgreSQL 迁移（必须）
2. 🔴 tRPC 集成（必须）
3. 🔴 全文搜索（必须）
4. 🟡 Redis 缓存（强烈推荐）
5. 🟢 Monorepo（可选）
6. 🟢 高级功能（渐进）

**预期时间线**:
- Week 1-2: 基础架构升级
- Week 3-4: 性能优化
- Week 5+: 功能扩展

---

**下一步**: 确认是否开始基础架构升级？
