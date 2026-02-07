# MadSpace 架构升级执行清单

**开始日期**: 2026-02-03  
**预计完成**: 2026-02-24 (3 周)  
**当前状态**: 🚀 进行中

---

## 📅 总体时间线

```
Week 1 (Feb 3-9):   PostgreSQL 迁移 + tRPC 基础
Week 2 (Feb 10-16): tRPC 完整迁移 + 全文搜索
Week 3 (Feb 17-24): Redis 缓存 + 性能优化 + 测试
```

---

## Week 1: 基础架构升级

### Day 1-2: PostgreSQL 迁移 🔴 优先级最高

#### ✅ Step 1: 设置 PostgreSQL 数据库
- [ ] **选择数据库服务商**
  ```
  推荐：Neon (https://neon.tech)
  - 免费 0.5GB
  - Serverless
  - 自动备份
  - 无需信用卡
  ```

- [ ] **创建数据库**
  1. 访问 https://console.neon.tech
  2. 创建新项目 "madspace"
  3. 选择 Region: US East (Ohio)
  4. 复制连接字符串

- [ ] **更新环境变量**
  ```bash
  # .env.local
  DATABASE_URL="postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/madspace?sslmode=require"
  ```

#### ✅ Step 2: 更新 Prisma Schema
- [ ] **修改 datasource**
  ```prisma
  // prisma/schema.prisma
  datasource db {
    provider = "postgresql"  // SQLite → PostgreSQL
    url      = env("DATABASE_URL")
  }
  ```

- [ ] **更新不兼容的类型**
  ```prisma
  // SQLite 的 String 在 PostgreSQL 中需要指定长度
  model Course {
    // ... 其他字段
    description String  @db.Text  // 长文本
  }

  model Review {
    // ... 其他字段
    contentComment  String? @db.Text
    teachingComment String? @db.Text
    gradingComment  String? @db.Text
    workloadComment String? @db.Text
  }
  ```

- [ ] **运行迁移**
  ```bash
  # 删除旧的 SQLite 数据库
  rm -f prisma/dev.db

  # 创建新的 PostgreSQL 迁移
  npx prisma migrate dev --name init_postgresql

  # 生成 Prisma Client
  npx prisma generate
  ```

#### ✅ Step 3: 重新导入数据
- [ ] **导入学院数据**
  ```bash
  npx tsx scripts/seedSchools.ts
  ```

- [ ] **导入课程数据**
  ```bash
  npx tsx scripts/seedCourses.ts
  ```

- [ ] **验证数据**
  ```bash
  # 打开 Prisma Studio
  npx prisma studio

  # 检查：
  # - School 表有数据
  # - Course 表有数据
  # - 关系正确
  ```

- [ ] **测试应用**
  ```bash
  npm run dev
  # 访问 http://localhost:3000/courses
  # 确认课程列表显示正常
  ```

**预计时间**: 2-3 小时  
**完成标准**: ✅ 应用在 PostgreSQL 上正常运行

---

### Day 3-5: tRPC 集成 🔴 核心重构

#### ✅ Step 4: 安装 tRPC 依赖
- [ ] **安装核心包**
  ```bash
  npm install @trpc/server @trpc/client @trpc/react-query @trpc/next
  npm install @tanstack/react-query
  npm install superjson zod
  ```

- [ ] **安装开发依赖**
  ```bash
  npm install -D @tanstack/react-query-devtools
  ```

#### ✅ Step 5: 创建 tRPC 基础结构
- [ ] **创建目录结构**
  ```bash
  mkdir -p server/api/routers
  mkdir -p server/api/trpc
  mkdir -p lib/trpc
  ```

- [ ] **创建 tRPC Context**
  ```typescript
  // server/api/trpc/context.ts
  import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
  import { getServerSession } from 'next-auth'
  import { authOptions } from '@/auth'
  import { prisma } from '@/lib/prisma'

  export async function createTRPCContext(opts: CreateNextContextOptions) {
    const session = await getServerSession(authOptions)
    
    return {
      session,
      prisma,
      req: opts.req,
      res: opts.res,
    }
  }

  export type Context = Awaited<ReturnType<typeof createTRPCContext>>
  ```

- [ ] **创建 tRPC 实例**
  ```typescript
  // server/api/trpc/init.ts
  import { initTRPC, TRPCError } from '@trpc/server'
  import { type Context } from './context'
  import superjson from 'superjson'

  const t = initTRPC.context<Context>().create({
    transformer: superjson,
    errorFormatter({ shape }) {
      return shape
    },
  })

  export const router = t.router
  export const publicProcedure = t.procedure

  // 需要登录的 procedure
  export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
    if (!ctx.session?.user) {
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

#### ✅ Step 6: 创建第一个 Router (Course)
- [ ] **创建 Course Router**
  ```typescript
  // server/api/routers/course.ts
  import { z } from 'zod'
  import { router, publicProcedure } from '../trpc/init'

  export const courseRouter = router({
    // 获取课程列表
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
            _count: {
              select: { reviews: true },
            },
          },
          take: input.limit,
          orderBy: { code: 'asc' },
        })

        return courses
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
                comments: {
                  include: {
                    author: true,
                  },
                },
              },
              orderBy: {
                createdAt: 'desc',
              },
            },
            instructors: true,
            gradeDistributions: {
              orderBy: {
                term: 'desc',
              },
            },
            prerequisites: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
            prerequisiteFor: {
              select: {
                id: true,
                code: true,
                name: true,
              },
            },
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

    // 获取所有学院
    getSchools: publicProcedure.query(async ({ ctx }) => {
      return ctx.prisma.school.findMany({
        orderBy: { name: 'asc' },
      })
    }),
  })
  ```

- [ ] **创建 Root Router**
  ```typescript
  // server/api/root.ts
  import { router } from './trpc/init'
  import { courseRouter } from './routers/course'

  export const appRouter = router({
    course: courseRouter,
  })

  export type AppRouter = typeof appRouter
  ```

- [ ] **创建 API Route Handler**
  ```typescript
  // app/api/trpc/[trpc]/route.ts
  import { fetchRequestHandler } from '@trpc/server/adapters/fetch'
  import { type NextRequest } from 'next/server'
  import { appRouter } from '@/server/api/root'
  import { createTRPCContext } from '@/server/api/trpc/context'

  const handler = (req: NextRequest) =>
    fetchRequestHandler({
      endpoint: '/api/trpc',
      req,
      router: appRouter,
      createContext: createTRPCContext,
    })

  export { handler as GET, handler as POST }
  ```

#### ✅ Step 7: 前端 tRPC 客户端设置
- [ ] **创建 tRPC Client**
  ```typescript
  // lib/trpc/client.ts
  import { createTRPCReact } from '@trpc/react-query'
  import type { AppRouter } from '@/server/api/root'

  export const trpc = createTRPCReact<AppRouter>()
  ```

- [ ] **创建 Provider**
  ```typescript
  // app/providers.tsx
  'use client'

  import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
  import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
  import { httpBatchLink } from '@trpc/client'
  import { useState } from 'react'
  import superjson from 'superjson'
  import { trpc } from '@/lib/trpc/client'

  export function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
      () =>
        new QueryClient({
          defaultOptions: {
            queries: {
              staleTime: 1000 * 60 * 5, // 5 分钟
              gcTime: 1000 * 60 * 30, // 30 分钟
            },
          },
        })
    )

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
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </trpc.Provider>
    )
  }
  ```

- [ ] **在 Root Layout 中使用**
  ```typescript
  // app/layout.tsx
  import { Providers } from './providers'

  export default function RootLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <html lang="en">
        <body>
          <Providers>{children}</Providers>
        </body>
      </html>
    )
  }
  ```

#### ✅ Step 8: 迁移课程列表页到 tRPC
- [ ] **更新 app/courses/page.tsx**
  ```typescript
  'use client'

  import { trpc } from '@/lib/trpc/client'
  import { useState } from 'react'
  import Link from 'next/link'
  import { Logo } from '@/components/Logo'
  import { Search } from 'lucide-react'

  export default function CoursesPage() {
    const [search, setSearch] = useState('')
    const [schoolId, setSchoolId] = useState<string>()

    // 使用 tRPC 查询
    const { data: courses, isLoading } = trpc.course.list.useQuery({
      search,
      schoolId,
      limit: 50,
    })

    const { data: schools } = trpc.course.getSchools.useQuery()

    return (
      <div className="min-h-screen bg-slate-50/50">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
          {/* ... header content ... */}
        </header>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-8">Browse Courses</h1>

          {/* Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.currentTarget)
              setSearch(formData.get('search') as string)
            }}
            className="flex gap-3 mb-6"
          >
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                name="search"
                placeholder="Search by course code or name..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-uw-red/20 focus:border-uw-red"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-2.5 bg-uw-red text-white rounded-lg hover:bg-uw-dark transition-colors font-medium"
            >
              Search
            </button>
          </form>

          {/* School Filters */}
          <div className="flex gap-2 flex-wrap mb-6">
            {schools?.slice(0, 8).map((school) => (
              <button
                key={school.id}
                onClick={() => setSchoolId(schoolId === school.id ? undefined : school.id)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  schoolId === school.id
                    ? 'bg-uw-red text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {school.name.replace(', College of', '').replace(', School of', '')}
              </button>
            ))}
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
                  <div className="h-6 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-100 rounded"></div>
                </div>
              ))}
            </div>
          )}

          {/* Course Grid */}
          {!isLoading && courses && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow group"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-900 group-hover:text-uw-red transition-colors">
                        {course.code}
                      </h3>
                      <p className="text-sm text-slate-600 mt-1">{course.name}</p>
                    </div>
                    <div className="text-sm text-slate-500">{course.credits} cr</div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                    <div className="text-xs text-slate-500 truncate max-w-[60%]">
                      {course.school.name}
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      {course._count.reviews > 0 && (
                        <div className="flex items-center gap-1 text-slate-600">
                          <span>{course._count.reviews}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Empty State */}
          {!isLoading && courses?.length === 0 && (
            <div className="text-center py-12">
              <p className="text-slate-600">No courses found</p>
            </div>
          )}
        </div>
      </div>
    )
  }
  ```

- [ ] **测试课程列表页**
  ```bash
  npm run dev
  # 访问 http://localhost:3000/courses
  # 确认：
  # - 课程列表正常显示
  # - 搜索功能正常
  # - 学院筛选正常
  # - 加载状态显示
  ```

**预计时间**: 1-2 天  
**完成标准**: ✅ 课程列表页使用 tRPC 正常工作

---

### Day 6-7: 继续 tRPC 迁移

#### ✅ Step 9: 创建 Review Router
- [ ] **创建评价相关 API**
  ```typescript
  // server/api/routers/review.ts
  import { z } from 'zod'
  import { router, protectedProcedure, publicProcedure } from '../trpc/init'
  import { TRPCError } from '@trpc/server'

  const gradeEnum = z.enum(['A', 'AB', 'B', 'BC', 'C', 'D', 'F'])

  export const reviewRouter = router({
    // 创建评价
    create: protectedProcedure
      .input(
        z.object({
          courseId: z.string(),
          title: z.string().min(1).max(200).optional(),
          term: z.string(),
          gradeReceived: gradeEnum,
          contentRating: gradeEnum,
          teachingRating: gradeEnum,
          gradingRating: gradeEnum,
          workloadRating: gradeEnum,
          contentComment: z.string().optional(),
          teachingComment: z.string().optional(),
          gradingComment: z.string().optional(),
          workloadComment: z.string().optional(),
          assessments: z.array(z.string()).optional(),
          resourceLink: z.string().url().optional(),
          instructorId: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const review = await ctx.prisma.review.create({
          data: {
            ...input,
            // 将数组转换为 JSON 字符串存储
            assessments: input.assessments ? JSON.stringify(input.assessments) : null,
            // 将枚举转换为字符串
            contentRating: input.contentRating,
            teachingRating: input.teachingRating,
            gradingRating: input.gradingRating,
            workloadRating: input.workloadRating,
            authorId: ctx.session.user.id!,
          },
          include: {
            author: true,
            instructor: true,
          },
        })

        return review
      }),

    // 点赞/取消点赞
    vote: protectedProcedure
      .input(
        z.object({
          reviewId: z.string(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const userId = ctx.session.user.id!

        // 检查是否已点赞
        const existingVote = await ctx.prisma.vote.findUnique({
          where: {
            userId_reviewId: {
              userId,
              reviewId: input.reviewId,
            },
          },
        })

        if (existingVote) {
          // 取消点赞
          await ctx.prisma.vote.delete({
            where: {
              userId_reviewId: {
                userId,
                reviewId: input.reviewId,
              },
            },
          })
          return { isVoted: false }
        } else {
          // 点赞
          await ctx.prisma.vote.create({
            data: {
              userId,
              reviewId: input.reviewId,
            },
          })
          return { isVoted: true }
        }
      }),
  })
  ```

#### ✅ Step 10: 创建 Comment Router
- [ ] **创建评论相关 API**
  ```typescript
  // server/api/routers/comment.ts
  import { z } from 'zod'
  import { router, protectedProcedure } from '../trpc/init'

  export const commentRouter = router({
    // 创建评论
    create: protectedProcedure
      .input(
        z.object({
          reviewId: z.string(),
          text: z.string().min(1).max(500),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const comment = await ctx.prisma.comment.create({
          data: {
            text: input.text,
            reviewId: input.reviewId,
            authorId: ctx.session.user.id!,
          },
          include: {
            author: true,
          },
        })

        return comment
      }),
  })
  ```

- [ ] **更新 Root Router**
  ```typescript
  // server/api/root.ts
  import { router } from './trpc/init'
  import { courseRouter } from './routers/course'
  import { reviewRouter } from './routers/review'
  import { commentRouter } from './routers/comment'

  export const appRouter = router({
    course: courseRouter,
    review: reviewRouter,
    comment: commentRouter,
  })

  export type AppRouter = typeof appRouter
  ```

**预计时间**: 1 天  
**完成标准**: ✅ Review 和 Comment API 迁移完成

---

## Week 2: 全文搜索 + 继续迁移

### Day 8-10: PostgreSQL 全文搜索

#### ✅ Step 11: 添加搜索向量列
- [ ] **创建迁移文件**
  ```bash
  npx prisma migrate dev --create-only --name add_fulltext_search
  ```

- [ ] **编辑迁移 SQL**
  ```sql
  -- prisma/migrations/xxx_add_fulltext_search/migration.sql

  -- 1. 添加 tsvector 列
  ALTER TABLE "Course" ADD COLUMN "searchVector" tsvector;

  -- 2. 创建生成函数
  CREATE OR REPLACE FUNCTION course_search_vector_update() RETURNS trigger AS $$
  BEGIN
    NEW."searchVector" :=
      setweight(to_tsvector('english', coalesce(NEW.code, '')), 'A') ||
      setweight(to_tsvector('english', coalesce(NEW.name, '')), 'B') ||
      setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C');
    RETURN NEW;
  END
  $$ LANGUAGE plpgsql;

  -- 3. 创建触发器
  CREATE TRIGGER course_search_vector_trigger
  BEFORE INSERT OR UPDATE ON "Course"
  FOR EACH ROW EXECUTE FUNCTION course_search_vector_update();

  -- 4. 为现有数据生成 tsvector
  UPDATE "Course" SET "searchVector" =
    setweight(to_tsvector('english', coalesce(code, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(name, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C');

  -- 5. 创建 GIN 索引
  CREATE INDEX "Course_searchVector_idx" ON "Course" USING GIN ("searchVector");
  ```

- [ ] **应用迁移**
  ```bash
  npx prisma migrate dev
  ```

#### ✅ Step 12: 更新搜索查询
- [ ] **在 Course Router 中添加全文搜索**
  ```typescript
  // server/api/routers/course.ts
  import { Prisma } from '@prisma/client'

  export const courseRouter = router({
    // ... 其他方法

    // 全文搜索
    search: publicProcedure
      .input(
        z.object({
          query: z.string().min(1),
          schoolId: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
        })
      )
      .query(async ({ ctx, input }) => {
        // 使用原生 SQL 进行全文搜索
        const courses = await ctx.prisma.$queryRaw<
          Array<{
            id: string
            code: string
            name: string
            description: string
            credits: number
            schoolId: string
            level: string
            rank: number
          }>
        >`
          SELECT 
            c.id,
            c.code,
            c.name,
            c.description,
            c.credits,
            c."schoolId",
            c.level,
            ts_rank(c."searchVector", plainto_tsquery('english', ${input.query})) AS rank
          FROM "Course" c
          WHERE c."searchVector" @@ plainto_tsquery('english', ${input.query})
          ${input.schoolId ? Prisma.sql`AND c."schoolId" = ${input.schoolId}` : Prisma.empty}
          ORDER BY rank DESC
          LIMIT ${input.limit}
        `

        // 获取学院信息和评价数量
        const courseIds = courses.map((c) => c.id)
        const coursesWithDetails = await ctx.prisma.course.findMany({
          where: {
            id: { in: courseIds },
          },
          include: {
            school: true,
            _count: {
              select: { reviews: true },
            },
          },
        })

        // 按搜索相关性排序
        const rankedCourses = courses.map((c) => {
          const details = coursesWithDetails.find((d) => d.id === c.id)!
          return {
            ...details,
            rank: c.rank,
          }
        })

        return rankedCourses
      }),

    // 更新 list 方法使用全文搜索
    list: publicProcedure
      .input(
        z.object({
          search: z.string().optional(),
          schoolId: z.string().optional(),
          limit: z.number().min(1).max(100).default(50),
        })
      )
      .query(async ({ ctx, input }) => {
        // 如果有搜索词，使用全文搜索
        if (input.search && input.search.length > 0) {
          return ctx.procedures.course.search({
            query: input.search,
            schoolId: input.schoolId,
            limit: input.limit,
          })
        }

        // 否则使用常规查询
        const where: any = {}
        if (input.schoolId) {
          where.schoolId = input.schoolId
        }

        return ctx.prisma.course.findMany({
          where,
          include: {
            school: true,
            _count: {
              select: { reviews: true },
            },
          },
          take: input.limit,
          orderBy: { code: 'asc' },
        })
      }),
  })
  ```

- [ ] **测试全文搜索**
  ```bash
  # 在浏览器中测试搜索
  # 1. 搜索 "algorithm" - 应该找到相关课程
  # 2. 搜索 "CS 577" - 应该精确匹配
  # 3. 搜索 "computer" - 应该找到所有计算机课程
  ```

**预计时间**: 2-3 天  
**完成标准**: ✅ 全文搜索正常工作，响应时间 < 100ms

---

### Day 11-14: 完成 tRPC 迁移

#### ✅ Step 13: 迁移课程详情页
- [ ] **更新 app/courses/[id]/page.tsx 使用 tRPC**
  ```typescript
  'use client'

  import { trpc } from '@/lib/trpc/client'
  import { useParams } from 'next/navigation'
  // ... 其他导入

  export default function CoursePage() {
    const params = useParams()
    const courseId = params.id as string

    // 使用 tRPC 查询
    const { data: course, isLoading } = trpc.course.byId.useQuery({ id: courseId })

    if (isLoading) {
      return <div>Loading...</div>
    }

    if (!course) {
      return <div>Course not found</div>
    }

    // ... 渲染课程详情
  }
  ```

#### ✅ Step 14: 更新组件使用 tRPC
- [ ] **更新 ReviewForm 组件**
  ```typescript
  // components/ReviewForm.tsx
  'use client'

  import { trpc } from '@/lib/trpc/client'
  import { useState } from 'react'

  export function ReviewForm({ courseId }: { courseId: string }) {
    const utils = trpc.useUtils()
    
    const createReview = trpc.review.create.useMutation({
      onSuccess: () => {
        // 刷新课程数据
        utils.course.byId.invalidate({ id: courseId })
        // 重置表单
      },
    })

    const handleSubmit = async (data: ReviewFormData) => {
      await createReview.mutateAsync({
        courseId,
        ...data,
      })
    }

    // ... 表单 UI
  }
  ```

- [ ] **更新 VoteButton 组件**
  ```typescript
  // components/VoteButton.tsx
  'use client'

  import { trpc } from '@/lib/trpc/client'

  export function VoteButton({ 
    reviewId, 
    initialIsVoted 
  }: { 
    reviewId: string
    initialIsVoted: boolean
  }) {
    const utils = trpc.useUtils()
    
    const vote = trpc.review.vote.useMutation({
      onSuccess: () => {
        // 刷新数据
        utils.course.byId.invalidate()
      },
    })

    return (
      <button
        onClick={() => vote.mutate({ reviewId })}
        disabled={vote.isLoading}
      >
        {initialIsVoted ? '👍 Voted' : '👍 Vote'}
      </button>
    )
  }
  ```

- [ ] **更新 CommentSection 组件**
  ```typescript
  // components/CommentSection.tsx
  'use client'

  import { trpc } from '@/lib/trpc/client'

  export function CommentSection({ reviewId }: { reviewId: string }) {
    const utils = trpc.useUtils()
    
    const addComment = trpc.comment.create.useMutation({
      onSuccess: () => {
        utils.course.byId.invalidate()
      },
    })

    // ... 评论 UI
  }
  ```

**预计时间**: 2-3 天  
**完成标准**: ✅ 所有页面和组件迁移到 tRPC

---

## Week 3: Redis 缓存 + 性能优化

### Day 15-17: Redis 缓存层

#### ✅ Step 15: 设置 Redis
- [ ] **选择 Redis 服务商**
  ```
  推荐：Upstash (https://upstash.com)
  - 免费 10,000 请求/天
  - Serverless
  - 按使用付费
  ```

- [ ] **安装依赖**
  ```bash
  npm install @upstash/redis
  ```

- [ ] **创建 Redis 客户端**
  ```typescript
  // lib/redis.ts
  import { Redis } from '@upstash/redis'

  export const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  })
  ```

#### ✅ Step 16: 实现缓存策略
- [ ] **创建缓存工具**
  ```typescript
  // lib/cache.ts
  import { redis } from './redis'

  export const CACHE_TTL = {
    COURSE_LIST: 60 * 60, // 1 小时
    COURSE_DETAIL: 60 * 30, // 30 分钟
    COURSE_STATS: 60 * 60 * 6, // 6 小时
  }

  export async function getCached<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl: number
  ): Promise<T> {
    // 尝试从缓存读取
    const cached = await redis.get(key)
    if (cached) {
      return cached as T
    }

    // 缓存未命中，执行查询
    const data = await fetcher()

    // 写入缓存
    await redis.setex(key, ttl, JSON.stringify(data))

    return data
  }

  export async function invalidateCache(pattern: string) {
    // 删除匹配的缓存
    const keys = await redis.keys(pattern)
    if (keys.length > 0) {
      await redis.del(...keys)
    }
  }
  ```

- [ ] **在 tRPC 中使用缓存**
  ```typescript
  // server/api/routers/course.ts
  import { getCached, CACHE_TTL, invalidateCache } from '@/lib/cache'

  export const courseRouter = router({
    byId: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ ctx, input }) => {
        return getCached(
          `course:${input.id}`,
          async () => {
            const course = await ctx.prisma.course.findUnique({
              where: { id: input.id },
              include: {
                // ... includes
              },
            })

            if (!course) {
              throw new TRPCError({ code: 'NOT_FOUND' })
            }

            return course
          },
          CACHE_TTL.COURSE_DETAIL
        )
      }),
  })

  export const reviewRouter = router({
    create: protectedProcedure
      .input(/* ... */)
      .mutation(async ({ ctx, input }) => {
        const review = await ctx.prisma.review.create({
          data: { ...input },
        })

        // 创建评价后，清除课程缓存
        await invalidateCache(`course:${input.courseId}`)

        return review
      }),
  })
  ```

**预计时间**: 2 天  
**完成标准**: ✅ Redis 缓存正常工作，缓存命中率 > 70%

---

### Day 18-21: 性能优化和测试

#### ✅ Step 17: 性能基准测试
- [ ] **创建性能测试脚本**
  ```typescript
  // scripts/benchmark.ts
  import { prisma } from '@/lib/prisma'

  async function benchmark() {
    console.log('🧪 Running performance benchmarks...\n')

    // 测试 1: LIKE 查询 vs 全文搜索
    console.time('LIKE search')
    await prisma.course.findMany({
      where: {
        OR: [
          { code: { contains: 'algorithm', mode: 'insensitive' } },
          { name: { contains: 'algorithm', mode: 'insensitive' } },
        ],
      },
    })
    console.timeEnd('LIKE search')

    console.time('Fulltext search')
    await prisma.$queryRaw`
      SELECT * FROM "Course"
      WHERE "searchVector" @@ plainto_tsquery('english', 'algorithm')
    `
    console.timeEnd('Fulltext search')

    // 测试 2: 缓存命中 vs 未命中
    console.time('Cache miss')
    await prisma.course.findUnique({
      where: { id: 'some-course-id' },
      include: {
        reviews: true,
        // ...
      },
    })
    console.timeEnd('Cache miss')

    console.time('Cache hit')
    await redis.get('course:some-course-id')
    console.timeEnd('Cache hit')
  }

  benchmark()
  ```

- [ ] **运行基准测试**
  ```bash
  npx tsx scripts/benchmark.ts
  ```

#### ✅ Step 18: 优化数据库查询
- [ ] **添加缺失的索引**
  ```prisma
  // prisma/schema.prisma
  model Review {
    // ... 字段

    @@index([courseId, createdAt(sort: Desc)])
    @@index([authorId])
    @@index([instructorId])
  }

  model Course {
    // ... 字段

    @@index([code])
    @@index([schoolId])
    @@index([level])
    @@index([searchVector], type: Gin)
  }
  ```

- [ ] **应用索引**
  ```bash
  npx prisma migrate dev --name add_indexes
  ```

#### ✅ Step 19: 前端性能优化
- [ ] **添加 React Query 配置**
  ```typescript
  // app/providers.tsx
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 分钟不重新请求
        gcTime: 1000 * 60 * 30, // 30 分钟后清理
        refetchOnWindowFocus: false, // 窗口聚焦时不重新请求
        retry: 1, // 失败重试 1 次
      },
    },
  })
  ```

- [ ] **添加加载骨架屏**
  ```typescript
  // components/CourseCardSkeleton.tsx
  export function CourseCardSkeleton() {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
        <div className="h-6 bg-slate-200 rounded mb-2 w-24"></div>
        <div className="h-4 bg-slate-100 rounded w-full"></div>
        <div className="h-4 bg-slate-100 rounded w-3/4 mt-2"></div>
      </div>
    )
  }
  ```

#### ✅ Step 20: 集成测试
- [ ] **测试所有功能**
  - [ ] 课程列表加载
  - [ ] 搜索功能
  - [ ] 学院筛选
  - [ ] 课程详情页
  - [ ] 创建评价
  - [ ] 点赞评价
  - [ ] 添加评论

- [ ] **性能验证**
  - [ ] 搜索响应时间 < 100ms
  - [ ] 页面加载时间 < 2s
  - [ ] Lighthouse 分数 > 90

- [ ] **数据完整性检查**
  - [ ] 所有课程数据正确
  - [ ] 评价显示正常
  - [ ] 关系数据正确

**预计时间**: 3-4 天  
**完成标准**: ✅ 所有测试通过，性能达标

---

## ✅ 最终检查清单

- [ ] PostgreSQL 数据库稳定运行
- [ ] tRPC API 完全类型安全
- [ ] 全文搜索响应 < 100ms
- [ ] Redis 缓存命中率 > 70%
- [ ] 所有页面正常工作
- [ ] 性能指标达标
- [ ] 代码质量良好
- [ ] 文档更新完成

---

## 📈 预期成果

| 指标 | 升级前 | 升级后 | 提升 |
|------|--------|--------|------|
| **搜索速度** | ~500ms | ~50ms | **10x** |
| **缓存命中响应** | N/A | ~10ms | **30x** |
| **类型安全** | 手动维护 | 自动推导 | ✅ |
| **开发效率** | 中等 | 高 | ⬆️⬆️ |
| **可扩展性** | 低 | 高 | ⬆️⬆️⬆️ |

---

**下一步**: 开始 Day 1 - PostgreSQL 迁移！
