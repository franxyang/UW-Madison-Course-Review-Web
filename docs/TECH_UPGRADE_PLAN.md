# MadSpace 技术架构升级计划

**最后更新**: 2026-02-03

## 🎯 升级目标

从当前的单体架构升级到现代化的 Monorepo + tRPC + Redis + 全文搜索架构，提升性能、开发体验和可维护性。

---

## 📊 升级前后对比

| 方面 | 当前架构 | 升级后架构 | 预期提升 |
|------|---------|-----------|----------|
| **代码组织** | 单一 Next.js 项目 | Turborepo Monorepo | 模块化、可复用 |
| **API 类型安全** | 手动类型定义 | tRPC 端到端类型安全 | 零运行时错误 |
| **搜索性能** | LIKE 查询 (~500ms) | PostgreSQL 全文搜索 (~50ms) | **10x 提升** |
| **响应速度** | 直接数据库查询 | Redis 缓存 | **5-20x 提升** |
| **开发体验** | 手动同步类型 | 自动类型推导 | DX 大幅提升 |

---

## 🏗️ 升级架构图

```
madspace/
├── apps/
│   ├── web/              # Next.js 主应用
│   ├── admin/            # 管理后台 (未来)
│   └── mobile/           # React Native (未来)
├── packages/
│   ├── ui/               # 共享 UI 组件库
│   ├── api/              # tRPC API 定义
│   ├── db/               # Prisma schema + migrations
│   ├── auth/             # 认证逻辑
│   ├── config/           # 共享配置 (eslint, tsconfig)
│   └── types/            # 共享 TypeScript 类型
├── turbo.json            # Turborepo 配置
└── package.json          # Workspace root
```

---

## 📋 升级计划

### Phase 1: Monorepo 迁移 (优先级: 🔴 高)

**目标**: 将现有项目迁移到 Turborepo Monorepo 结构

#### 步骤 1.1: 安装 Turborepo
```bash
# 在项目根目录
npm install turbo --save-dev
npx create-turbo@latest --skip-install --skip-git
```

#### 步骤 1.2: 重组目录结构
```bash
# 创建 monorepo 结构
mkdir -p apps packages
mv madspace apps/web  # 移动现有项目到 apps/web

# 创建共享包
cd packages
mkdir ui api db auth config types
```

#### 步骤 1.3: 配置 Turborepo
**`turbo.json`**:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "dependsOn": ["^lint"]
    },
    "type-check": {
      "dependsOn": ["^type-check"]
    }
  }
}
```

#### 步骤 1.4: 配置 Workspace
**根目录 `package.json`**:
```json
{
  "name": "madspace",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "lint": "turbo run lint",
    "type-check": "turbo run type-check"
  },
  "devDependencies": {
    "turbo": "latest"
  }
}
```

**时间估算**: 1-2 天  
**风险**: 低 - 只是目录重组

---

### Phase 2: tRPC 集成 (优先级: 🔴 高)

**目标**: 替换 Next.js API Routes 为 tRPC，实现端到端类型安全

#### 步骤 2.1: 安装依赖
```bash
# 在 apps/web
npm install @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query zod

# 在 packages/api
npm install @trpc/server zod
npm install -D @types/node typescript
```

#### 步骤 2.2: 创建 tRPC 根配置
**`packages/api/src/trpc.ts`**:
```typescript
import { initTRPC, TRPCError } from '@trpc/server'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@madspace/auth'
import { prisma } from '@madspace/db'
import superjson from 'superjson'

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const session = await getServerSession(authOptions)
  
  return {
    session,
    prisma,
    req: opts.req,
    res: opts.res,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape
  },
})

export const router = t.router
export const publicProcedure = t.procedure
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})
```

#### 步骤 2.3: 定义 API Routers
**`packages/api/src/routers/course.ts`**:
```typescript
import { z } from 'zod'
import { router, publicProcedure } from '../trpc'

export const courseRouter = router({
  // 获取课程列表
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        schoolId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        cursor: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {}

      if (input.search) {
        where.OR = [
          { code: { contains: input.search, mode: 'insensitive' } },
          { name: { contains: input.search, mode: 'insensitive' } },
        ]
      }

      if (input.schoolId) {
        where.schoolId = input.schoolId
      }

      const courses = await ctx.prisma.course.findMany({
        where,
        include: {
          school: true,
          _count: { select: { reviews: true } },
        },
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { code: 'asc' },
      })

      let nextCursor: typeof input.cursor | undefined = undefined
      if (courses.length > input.limit) {
        const nextItem = courses.pop()
        nextCursor = nextItem!.id
      }

      return {
        courses,
        nextCursor,
      }
    }),

  // 获取课程详情
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const course = await ctx.prisma.course.findUnique({
        where: { id: input.id },
        include: {
          school: true,
          reviews: {
            include: {
              author: true,
              instructor: true,
              comments: { include: { author: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          instructors: true,
          gradeDistributions: { orderBy: { term: 'desc' } },
          prerequisites: true,
          prerequisiteFor: true,
        },
      })

      if (!course) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Course not found',
        })
      }

      return course
    }),
})
```

**`packages/api/src/routers/review.ts`**:
```typescript
import { z } from 'zod'
import { router, protectedProcedure, publicProcedure } from '../trpc'

const ratingEnum = z.enum(['A', 'B', 'C', 'D', 'F'])

export const reviewRouter = router({
  // 创建评价
  create: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        title: z.string().min(1).max(200),
        term: z.string(),
        gradeReceived: ratingEnum,
        contentRating: ratingEnum,
        teachingRating: ratingEnum,
        gradingRating: ratingEnum,
        workloadRating: ratingEnum,
        contentComment: z.string().optional(),
        teachingComment: z.string().optional(),
        gradingComment: z.string().optional(),
        workloadComment: z.string().optional(),
        assessments: z.array(z.string()).optional(),
        resourceLink: z.string().url().optional(),
        instructorId: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.prisma.review.create({
        data: {
          ...input,
          authorId: ctx.session.user.id,
        },
        include: {
          author: true,
          instructor: true,
        },
      })

      return review
    }),

  // 点赞评价
  vote: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        isVoted: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (input.isVoted) {
        await ctx.prisma.vote.delete({
          where: {
            userId_reviewId: {
              userId: ctx.session.user.id,
              reviewId: input.reviewId,
            },
          },
        })
      } else {
        await ctx.prisma.vote.create({
          data: {
            userId: ctx.session.user.id,
            reviewId: input.reviewId,
          },
        })
      }

      return { success: true }
    }),
})
```

**`packages/api/src/root.ts`**:
```typescript
import { router } from './trpc'
import { courseRouter } from './routers/course'
import { reviewRouter } from './routers/review'
import { commentRouter } from './routers/comment'
import { instructorRouter } from './routers/instructor'

export const appRouter = router({
  course: courseRouter,
  review: reviewRouter,
  comment: commentRouter,
  instructor: instructorRouter,
})

export type AppRouter = typeof appRouter
```

#### 步骤 2.4: Next.js 集成
**`apps/web/src/app/api/trpc/[trpc]/route.ts`**:
```typescript
import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
import { type NextRequest } from 'next/server'
import { appRouter } from '@madspace/api'
import { createTRPCContext } from '@madspace/api/trpc'

const handler = (req: NextRequest) =>
  fetchRequestHandler({
    endpoint: '/api/trpc',
    req,
    router: appRouter,
    createContext: createTRPCContext,
  })

export { handler as GET, handler as POST }
```

**`apps/web/src/lib/trpc/client.ts`**:
```typescript
import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@madspace/api'

export const trpc = createTRPCReact<AppRouter>()
```

**`apps/web/src/app/providers.tsx`**:
```typescript
'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { useState } from 'react'
import superjson from 'superjson'
import { trpc } from '@/lib/trpc/client'

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  const [trpcClient] = useState(() =>
    trpc.createClient({
      transformer: superjson,
      links: [
        httpBatchLink({
          url: '/api/trpc',
        }),
      ],
    })
  )

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  )
}
```

#### 步骤 2.5: 使用 tRPC 替换现有 API 调用
**之前 (API Routes)**:
```typescript
// app/api/courses/route.ts
export async function GET(req: Request) {
  const courses = await prisma.course.findMany()
  return Response.json(courses)
}

// 前端
const res = await fetch('/api/courses')
const courses: Course[] = await res.json() // 手动类型断言
```

**之后 (tRPC)**:
```typescript
// 前端
'use client'

export function CourseList() {
  const { data, isLoading } = trpc.course.list.useQuery({
    search: '',
    limit: 50,
  })
  // data 自动类型推导！完全类型安全
  
  return (
    <div>
      {data?.courses.map(course => (
        <div key={course.id}>{course.code}</div>
      ))}
    </div>
  )
}
```

**时间估算**: 3-5 天  
**风险**: 中 - 需要重构现有 API

---

### Phase 3: Redis 缓存层 (优先级: 🟡 中)

**目标**: 添加 Redis 缓存，提升热点数据访问速度

#### 步骤 3.1: 安装 Redis
```bash
# Docker 本地开发
docker run -d --name redis -p 6379:6379 redis:latest

# 或 Homebrew (macOS)
brew install redis
brew services start redis
```

#### 步骤 3.2: 安装依赖
```bash
npm install ioredis
npm install -D @types/ioredis
```

#### 步骤 3.3: 创建 Redis 客户端
**`packages/db/src/redis.ts`**:
```typescript
import Redis from 'ioredis'

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: 3,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000)
    return delay
  },
})

redis.on('error', (err) => {
  console.error('Redis connection error:', err)
})

redis.on('connect', () => {
  console.log('✅ Redis connected')
})

export { redis }
```

#### 步骤 3.4: 实现缓存策略
**`packages/api/src/utils/cache.ts`**:
```typescript
import { redis } from '@madspace/db/redis'

export class CacheService {
  // 缓存课程列表 (5分钟)
  static async getCourseList(key: string, fetcher: () => Promise<any>) {
    const cached = await redis.get(`courses:list:${key}`)
    if (cached) {
      return JSON.parse(cached)
    }

    const data = await fetcher()
    await redis.setex(`courses:list:${key}`, 300, JSON.stringify(data))
    return data
  }

  // 缓存课程详情 (10分钟)
  static async getCourse(id: string, fetcher: () => Promise<any>) {
    const cached = await redis.get(`course:${id}`)
    if (cached) {
      return JSON.parse(cached)
    }

    const data = await fetcher()
    await redis.setex(`course:${id}`, 600, JSON.stringify(data))
    return data
  }

  // 缓存课程统计 (1小时)
  static async getCourseStats(id: string, fetcher: () => Promise<any>) {
    const cached = await redis.get(`course:stats:${id}`)
    if (cached) {
      return JSON.parse(cached)
    }

    const data = await fetcher()
    await redis.setex(`course:stats:${id}`, 3600, JSON.stringify(data))
    return data
  }

  // 失效缓存
  static async invalidateCourse(id: string) {
    await redis.del(
      `course:${id}`,
      `course:stats:${id}`,
      `courses:list:*` // 模糊删除
    )
  }
}
```

#### 步骤 3.5: 集成到 tRPC
**`packages/api/src/routers/course.ts`** (更新):
```typescript
import { CacheService } from '../utils/cache'

export const courseRouter = router({
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return CacheService.getCourse(input.id, async () => {
        const course = await ctx.prisma.course.findUnique({
          where: { id: input.id },
          include: {
            school: true,
            reviews: {
              include: {
                author: true,
                instructor: true,
                comments: { include: { author: true } },
              },
              orderBy: { createdAt: 'desc' },
            },
            // ... 其他 include
          },
        })

        if (!course) {
          throw new TRPCError({ code: 'NOT_FOUND' })
        }

        return course
      })
    }),
})
```

#### 步骤 3.6: 缓存失效策略
```typescript
// 创建评价后失效缓存
export const reviewRouter = router({
  create: protectedProcedure
    .input(/* ... */)
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.prisma.review.create({
        data: {
          ...input,
          authorId: ctx.session.user.id,
        },
      })

      // 失效课程缓存
      await CacheService.invalidateCourse(input.courseId)

      return review
    }),
})
```

**时间估算**: 2-3 天  
**风险**: 低 - 只是添加缓存层，不影响核心逻辑

---

### Phase 4: PostgreSQL 全文搜索 (优先级: 🔴 高)

**目标**: 使用 PostgreSQL 原生全文搜索替换 `LIKE` 查询，提升 10x+ 性能

#### 步骤 4.1: 添加全文搜索列
**`prisma/schema.prisma`** (更新):
```prisma
model Course {
  id          String   @id @default(cuid())
  code        String   @unique
  name        String
  description String?
  // ... 其他字段
  
  // 全文搜索列
  searchVector String? @db.Text // tsvector 类型
  
  @@index([searchVector], type: Gin) // GIN 索引
}
```

#### 步骤 4.2: 创建迁移
**`prisma/migrations/add_fulltext_search.sql`**:
```sql
-- 添加 tsvector 列
ALTER TABLE "Course" ADD COLUMN "searchVector" tsvector;

-- 创建生成 tsvector 的函数
CREATE OR REPLACE FUNCTION course_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', coalesce(NEW.code, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER course_search_vector_trigger
BEFORE INSERT OR UPDATE ON "Course"
FOR EACH ROW EXECUTE FUNCTION course_search_vector_update();

-- 为现有数据生成 tsvector
UPDATE "Course" SET "searchVector" = 
  setweight(to_tsvector('english', coalesce(code, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(name, '')), 'B') ||
  setweight(to_tsvector('english', coalesce(description, '')), 'C');

-- 创建 GIN 索引
CREATE INDEX "Course_searchVector_idx" ON "Course" USING GIN ("searchVector");
```

#### 步骤 4.3: 更新 tRPC 查询
**`packages/api/src/routers/course.ts`** (更新):
```typescript
export const courseRouter = router({
  // 全文搜索
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      // 使用原生 SQL 全文搜索
      const courses = await ctx.prisma.$queryRaw`
        SELECT 
          c.*,
          ts_rank(c."searchVector", plainto_tsquery('english', ${input.query})) AS rank
        FROM "Course" c
        WHERE c."searchVector" @@ plainto_tsquery('english', ${input.query})
        ORDER BY rank DESC
        LIMIT ${input.limit}
      `

      return courses
    }),

  // 传统列表查询（保留）
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        schoolId: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {}

      // 如果有搜索词，使用全文搜索
      if (input.search) {
        // 调用 search 查询
        return ctx.prisma.$queryRaw`
          SELECT c.*, s.name as "schoolName"
          FROM "Course" c
          LEFT JOIN "School" s ON c."schoolId" = s.id
          WHERE c."searchVector" @@ plainto_tsquery('english', ${input.search})
          ${input.schoolId ? Prisma.sql`AND c."schoolId" = ${input.schoolId}` : Prisma.empty}
          ORDER BY ts_rank(c."searchVector", plainto_tsquery('english', ${input.search})) DESC
          LIMIT ${input.limit}
        `
      }

      // 无搜索词，正常查询
      if (input.schoolId) {
        where.schoolId = input.schoolId
      }

      return ctx.prisma.course.findMany({
        where,
        include: {
          school: true,
          _count: { select: { reviews: true } },
        },
        take: input.limit,
        orderBy: { code: 'asc' },
      })
    }),
})
```

#### 步骤 4.4: 性能对比测试
```typescript
// 性能测试脚本
import { prisma } from '@madspace/db'

async function testSearch() {
  const query = 'computer science'

  // 旧方法 (LIKE)
  console.time('LIKE query')
  await prisma.course.findMany({
    where: {
      OR: [
        { code: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
      ],
    },
  })
  console.timeEnd('LIKE query') // ~500ms

  // 新方法 (Full-text search)
  console.time('Fulltext query')
  await prisma.$queryRaw`
    SELECT * FROM "Course"
    WHERE "searchVector" @@ plainto_tsquery('english', ${query})
  `
  console.timeEnd('Fulltext query') // ~50ms
}
```

**时间估算**: 2-3 天  
**风险**: 中 - 需要数据库迁移

---

## 🚀 实施时间线

### Week 1: Monorepo + tRPC
- **Day 1-2**: Turborepo 迁移
- **Day 3-5**: tRPC 集成和 API 重构
- **Day 6-7**: 测试和调试

### Week 2: Redis + 全文搜索
- **Day 1-3**: Redis 缓存层实现
- **Day 4-5**: PostgreSQL 全文搜索迁移
- **Day 6-7**: 性能测试和优化

### Week 3: 优化和部署
- **Day 1-3**: 性能基准测试
- **Day 4-5**: 文档更新
- **Day 6-7**: 生产环境部署

---

## 📦 新增依赖清单

```json
{
  "dependencies": {
    "@trpc/server": "^10.45.0",
    "@trpc/client": "^10.45.0",
    "@trpc/react-query": "^10.45.0",
    "@trpc/next": "^10.45.0",
    "@tanstack/react-query": "^5.17.0",
    "ioredis": "^5.3.2",
    "superjson": "^2.2.1",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "turbo": "^1.11.0",
    "@types/ioredis": "^5.0.0"
  }
}
```

---

## 🎯 预期性能提升

| 指标 | 升级前 | 升级后 | 提升 |
|------|--------|--------|------|
| **搜索响应时间** | ~500ms | ~50ms | **10x** |
| **课程列表首次加载** | ~300ms | ~300ms | - |
| **课程列表缓存命中** | N/A | ~10ms | **30x** |
| **课程详情首次加载** | ~400ms | ~400ms | - |
| **课程详情缓存命中** | N/A | ~15ms | **25x** |
| **类型错误** | 运行时发现 | 编译时发现 | **零运行时错误** |
| **开发体验** | 手动类型同步 | 自动推导 | ⭐⭐⭐⭐⭐ |

---

## ⚠️ 风险和注意事项

### 1. Monorepo 迁移风险
- **风险**: 依赖管理复杂度增加
- **缓解**: 使用 Turborepo 内置缓存和并行构建
- **回滚**: 保留旧项目备份

### 2. tRPC 学习曲线
- **风险**: 团队需要学习新工具
- **缓解**: 提供完整文档和示例代码
- **回滚**: tRPC 可以与 API Routes 并存

### 3. Redis 依赖
- **风险**: 增加基础设施复杂度
- **缓解**: 使用 Docker Compose 简化本地开发
- **回滚**: 缓存层可选，不影响核心功能

### 4. 全文搜索迁移
- **风险**: 数据库迁移可能失败
- **缓解**: 在测试环境充分验证
- **回滚**: 保留旧的 LIKE 查询作为降级方案

---

## ✅ 成功指标

- [ ] 所有 API 调用迁移到 tRPC
- [ ] 搜索响应时间 < 100ms (p95)
- [ ] 缓存命中率 > 70%
- [ ] 零运行时类型错误
- [ ] CI/CD 构建时间 < 5 分钟
- [ ] 开发体验评分 > 4.5/5

---

## 📚 参考资源

- [Turborepo 文档](https://turbo.build/repo/docs)
- [tRPC 文档](https://trpc.io/docs)
- [Redis 最佳实践](https://redis.io/docs/manual/patterns/)
- [PostgreSQL 全文搜索](https://www.postgresql.org/docs/current/textsearch.html)

---

**下一步**: 确认升级计划后，创建详细的迁移 checklist
