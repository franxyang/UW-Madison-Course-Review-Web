import { z } from 'zod'
import { router, publicProcedure } from '../trpc/trpc'
import { TRPCError } from '@trpc/server'
import { Prisma } from '@prisma/client'
import { cached, cacheKeys, TTL } from '@/lib/redis'

export const courseRouter = router({
  // Get course list with search and filters
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        schoolId: z.string().optional(),
        departmentId: z.string().optional(),
        level: z.string().optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Use full-text search when search term is provided
      if (input.search && input.search.trim().length > 0) {
        const searchTerm = input.search.trim()

        // Build additional WHERE clauses for filters
        const filterClauses: string[] = []
        const filterParams: any[] = [searchTerm]
        let paramIndex = 2

        if (input.schoolId) {
          filterClauses.push(`c."schoolId" = $${paramIndex}`)
          filterParams.push(input.schoolId)
          paramIndex++
        }

        if (input.level) {
          filterClauses.push(`c."level" = $${paramIndex}`)
          filterParams.push(input.level)
          paramIndex++
        }

        const filterSQL = filterClauses.length > 0
          ? 'AND ' + filterClauses.join(' AND ')
          : ''

        // Full-text search with ranking
        const courses = await ctx.prisma.$queryRawUnsafe<any[]>(`
          SELECT 
            c."id", c."code", c."name", c."description", c."credits",
            c."level", c."avgGPA", c."lastOffered", c."schoolId",
            c."breadths", c."genEds",
            s."id" as "school_id", s."name" as "school_name",
            ts_rank(c."searchVector", plainto_tsquery('english', $1)) AS rank,
            (SELECT COUNT(*)::int FROM "Review" r WHERE r."courseId" = c."id") as review_count
          FROM "Course" c
          JOIN "School" s ON c."schoolId" = s."id"
          WHERE c."searchVector" @@ plainto_tsquery('english', $1)
          ${filterSQL}
          ORDER BY rank DESC
          LIMIT ${input.limit}
          OFFSET ${input.offset}
        `, ...filterParams)

        // Transform raw results to match Prisma format
        return courses.map(c => ({
          id: c.id,
          code: c.code,
          name: c.name,
          description: c.description,
          credits: c.credits,
          level: c.level,
          avgGPA: c.avgGPA,
          lastOffered: c.lastOffered,
          schoolId: c.schoolId,
          breadths: c.breadths,
          genEds: c.genEds,
          school: {
            id: c.school_id,
            name: c.school_name,
          },
          _count: {
            reviews: c.review_count,
          },
          _searchRank: c.rank,
        }))
      }

      // Fallback to standard Prisma query (no search term)
      const where: any = {}

      if (input.schoolId) {
        where.schoolId = input.schoolId
      }

      if (input.level) {
        where.level = input.level
      }

      if (input.departmentId) {
        where.departments = {
          some: {
            departmentId: input.departmentId,
          },
        }
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
        skip: input.offset,
        orderBy: { code: 'asc' },
      })

      return courses
    }),

  // Full-text search with suggestions (for autocomplete / quick search)
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().min(1).max(20).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const searchTerm = input.query.trim()

      // Use prefix matching for partial queries (autocomplete)
      const results = await ctx.prisma.$queryRaw<any[]>`
        SELECT 
          c."id", c."code", c."name", c."credits", c."level",
          s."name" as "school_name",
          ts_rank(c."searchVector", to_tsquery('english', ${searchTerm + ':*'})) AS rank
        FROM "Course" c
        JOIN "School" s ON c."schoolId" = s."id"
        WHERE c."searchVector" @@ to_tsquery('english', ${searchTerm + ':*'})
           OR c."code" ILIKE ${`%${searchTerm}%`}
        ORDER BY 
          CASE WHEN c."code" ILIKE ${`${searchTerm}%`} THEN 0 ELSE 1 END,
          rank DESC
        LIMIT ${input.limit}
      `

      return results.map(r => ({
        id: r.id,
        code: r.code,
        name: r.name,
        credits: r.credits,
        level: r.level,
        schoolName: r.school_name,
      }))
    }),

  // Get course by ID
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
              votes: {
                include: {
                  user: true,
                },
              },
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

  // Get all schools (cached for 24h)
  getSchools: publicProcedure.query(async ({ ctx }) => {
    return cached(
      cacheKeys.schools(),
      () => ctx.prisma.school.findMany({ orderBy: { name: 'asc' } }),
      TTL.SCHOOLS
    )
  }),

  // Get all departments (cached for 24h)
  getDepartments: publicProcedure
    .input(
      z.object({
        schoolId: z.string().optional(),
      }).optional()
    )
    .query(async ({ ctx, input }) => {
      const where = input?.schoolId ? { schoolId: input.schoolId } : {}
      return cached(
        cacheKeys.departments(input?.schoolId),
        () => ctx.prisma.department.findMany({ where, orderBy: { name: 'asc' } }),
        TTL.DEPARTMENTS
      )
    }),
})
