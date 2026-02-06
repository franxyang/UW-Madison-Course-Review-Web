import { z } from 'zod'
import { router, publicProcedure } from '../trpc/trpc'
import { TRPCError } from '@trpc/server'
import { Prisma } from '@prisma/client'
import { cached, cacheKeys, TTL } from '@/lib/redis'
import { expandSearchAliases } from '@/lib/courseAliases'
import { computeContributorLevel } from '@/lib/contributorLevel'

export const courseRouter = router({
  // Get course list with search and filters
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        schoolIds: z.array(z.string()).optional(),
        departmentIds: z.array(z.string()).optional(),
        levels: z.array(z.string()).optional(),
        minCredits: z.number().min(0).max(10).optional(),
        maxCredits: z.number().min(0).max(10).optional(),
        minGPA: z.number().min(0).max(4).optional(),
        maxGPA: z.number().min(0).max(4).optional(),
        instructorName: z.string().optional(),
        sortBy: z.enum(['code', 'relevance', 'gpa', 'reviews']).optional(),
        limit: z.number().min(1).max(100).default(50),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      // Use full-text search when search term is provided
      if (input.search && input.search.trim().length > 0) {
        const searchTerm = input.search.trim()
        
        // Expand search to include course code aliases
        // e.g., "CS 577" → also search "COMP SCI 577"
        const aliases = expandSearchAliases(searchTerm)

        // Build additional WHERE clauses for filters
        const filterClauses: string[] = []
        const filterParams: any[] = [searchTerm]
        let paramIndex = 2

        if (input.schoolIds && input.schoolIds.length > 0) {
          const placeholders = input.schoolIds.map((_, i) => `$${paramIndex + i}`).join(', ')
          filterClauses.push(`c."schoolId" IN (${placeholders})`)
          filterParams.push(...input.schoolIds)
          paramIndex += input.schoolIds.length
        }

        if (input.levels && input.levels.length > 0) {
          const placeholders = input.levels.map((_, i) => `$${paramIndex + i}`).join(', ')
          filterClauses.push(`c."level" IN (${placeholders})`)
          filterParams.push(...input.levels)
          paramIndex += input.levels.length
        }

        if (input.departmentIds && input.departmentIds.length > 0) {
          const placeholders = input.departmentIds.map((_, i) => `$${paramIndex + i}`).join(', ')
          filterClauses.push(`c."id" IN (SELECT "courseId" FROM "CourseDepartment" WHERE "departmentId" IN (${placeholders}))`)
          filterParams.push(...input.departmentIds)
          paramIndex += input.departmentIds.length
        }

        if (input.minCredits !== undefined) {
          filterClauses.push(`c."credits" >= $${paramIndex}`)
          filterParams.push(input.minCredits)
          paramIndex++
        }

        if (input.maxCredits !== undefined) {
          filterClauses.push(`c."credits" <= $${paramIndex}`)
          filterParams.push(input.maxCredits)
          paramIndex++
        }

        if (input.minGPA !== undefined) {
          filterClauses.push(`c."avgGPA" >= $${paramIndex}`)
          filterParams.push(input.minGPA)
          paramIndex++
        }

        if (input.maxGPA !== undefined) {
          filterClauses.push(`c."avgGPA" <= $${paramIndex}`)
          filterParams.push(input.maxGPA)
          paramIndex++
        }

        if (input.instructorName) {
          filterClauses.push(`c."id" IN (
            SELECT ci."courseId" FROM "CourseInstructor" ci
            JOIN "Instructor" i ON ci."instructorId" = i."id"
            WHERE i."name" ILIKE $${paramIndex}
          )`)
          filterParams.push(`%${input.instructorName}%`)
          paramIndex++
        }

        const filterSQL = filterClauses.length > 0
          ? 'AND ' + filterClauses.join(' AND ')
          : ''

        // Build alias ILIKE conditions for code matching
        const aliasConditions = aliases.map((_, i) => {
          filterParams.push(`%${aliases[i]}%`)
          return `c."code" ILIKE $${paramIndex + i}`
        })
        paramIndex += aliases.length
        const aliasSQL = aliasConditions.length > 0
          ? aliasConditions.join(' OR ')
          : 'FALSE'

        // Combined search: full-text OR code alias match
        const courses = await ctx.prisma.$queryRawUnsafe<any[]>(`
          SELECT 
            c."id", c."code", c."name", c."description", c."credits",
            c."level", c."avgGPA", c."lastOffered", c."schoolId",
            c."breadths", c."genEds",
            s."id" as "school_id", s."name" as "school_name",
            GREATEST(
              ts_rank(c."searchVector", plainto_tsquery('english', $1)),
              CASE WHEN ${aliasSQL} THEN 1.0 ELSE 0.0 END
            ) AS rank,
            (SELECT COUNT(*)::int FROM "Review" r WHERE r."courseId" = c."id") as review_count
          FROM "Course" c
          JOIN "School" s ON c."schoolId" = s."id"
          WHERE (
            c."searchVector" @@ plainto_tsquery('english', $1)
            OR ${aliasSQL}
            OR c."code" ILIKE $1 || '%'
            OR c."name" ILIKE '%' || $1 || '%'
          )
          ${filterSQL}
          ORDER BY 
            CASE WHEN c."code" ILIKE $1 || '%' OR ${aliasSQL} THEN 0 ELSE 1 END,
            rank DESC
          LIMIT ${input.limit}
          OFFSET ${input.offset}
        `, ...filterParams)

        // Count total for pagination (same WHERE, no LIMIT)
        const countResult = await ctx.prisma.$queryRawUnsafe<any[]>(`
          SELECT COUNT(*)::int as total
          FROM "Course" c
          WHERE (
            c."searchVector" @@ plainto_tsquery('english', $1)
            OR ${aliasSQL}
            OR c."code" ILIKE $1 || '%'
            OR c."name" ILIKE '%' || $1 || '%'
          )
          ${filterSQL}
        `, ...filterParams)
        const total = countResult[0]?.total || 0

        // Transform raw results to match Prisma format
        return {
          courses: courses.map(c => ({
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
          })),
          total,
        }
      }

      // Fallback to standard Prisma query (no search term)
      const where: any = {}

      if (input.schoolIds && input.schoolIds.length > 0) {
        where.schoolId = { in: input.schoolIds }
      }

      if (input.levels && input.levels.length > 0) {
        where.level = { in: input.levels }
      }

      if (input.departmentIds && input.departmentIds.length > 0) {
        where.departments = {
          some: {
            departmentId: { in: input.departmentIds },
          },
        }
      }

      if (input.minCredits !== undefined || input.maxCredits !== undefined) {
        where.credits = {}
        if (input.minCredits !== undefined) where.credits.gte = input.minCredits
        if (input.maxCredits !== undefined) where.credits.lte = input.maxCredits
      }

      if (input.minGPA !== undefined || input.maxGPA !== undefined) {
        where.avgGPA = {}
        if (input.minGPA !== undefined) where.avgGPA.gte = input.minGPA
        if (input.maxGPA !== undefined) where.avgGPA.lte = input.maxGPA
      }

      if (input.instructorName) {
        where.instructors = {
          some: {
            instructor: {
              name: { contains: input.instructorName, mode: 'insensitive' },
            },
          },
        }
      }

      // Sort
      let orderBy: any = { code: 'asc' }
      if (input.sortBy === 'gpa') orderBy = { avgGPA: 'desc' }
      else if (input.sortBy === 'reviews') orderBy = { reviews: { _count: 'desc' } }

      const [courses, total] = await Promise.all([
        ctx.prisma.course.findMany({
          where,
          include: {
            school: true,
            _count: {
              select: { reviews: true },
            },
          },
          take: input.limit,
          skip: input.offset,
          orderBy,
        }),
        ctx.prisma.course.count({ where }),
      ])

      return { courses, total }
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

  // Get course by ID (with review-gating for non-contributors)
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
          instructors: {
            include: {
              instructor: true,
            },
          },
          gradeDistributions: {
            include: {
              instructor: true,  // Direct relation now (per-instructor data)
            },
            orderBy: [
              { term: 'desc' },
              { avgGPA: 'desc' },
            ],
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
          // Include cross-listed courses
          crossListGroup: {
            include: {
              courses: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  avgGPA: true,
                },
              },
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

      // Review-gating: check if the user has contributed at least 1 review
      let hasFullAccess = false
      let userReviewCount = 0

      if (ctx.session?.user?.email) {
        const user = await ctx.prisma.user.findUnique({
          where: { email: ctx.session.user.email },
          select: { id: true },
        })
        if (user) {
          userReviewCount = await ctx.prisma.review.count({
            where: { authorId: user.id },
          })
          hasFullAccess = userReviewCount >= 1
        }
      }

      // Sort reviews: highest-voted first for the preview
      const sortedReviews = [...course.reviews].sort(
        (a, b) => (b.votes?.length || 0) - (a.votes?.length || 0)
      )

      // Compute contributor levels for each review author
      const authorIds = [...new Set(sortedReviews.map(r => r.authorId))]
      const authorStats = await Promise.all(
        authorIds.map(async (authorId) => {
          const [reviewCount, upvotesReceived] = await Promise.all([
            ctx.prisma.review.count({ where: { authorId } }),
            ctx.prisma.vote.count({
              where: { review: { authorId } },
            }),
          ])
          return { authorId, reviewCount, upvotesReceived }
        })
      )

      const authorLevelMap = new Map(
        authorStats.map(s => [
          s.authorId,
          computeContributorLevel(s.reviewCount, s.upvotesReceived),
        ])
      )

      const reviewsWithLevel = sortedReviews.map(review => ({
        ...review,
        authorLevel: authorLevelMap.get(review.authorId) || computeContributorLevel(0, 0),
      }))

      return {
        ...course,
        reviews: reviewsWithLevel,
        reviewAccess: {
          hasFullAccess,
          userReviewCount,
          totalReviews: course.reviews.length,
        },
      }
    }),

  // Get courses by department code prefix (for sidebar)
  sameDepartment: publicProcedure
    .input(
      z.object({
        codePrefix: z.string().min(1),
        excludeId: z.string().optional(),
        limit: z.number().min(1).max(20).default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const courses = await ctx.prisma.course.findMany({
        where: {
          code: { startsWith: input.codePrefix },
          ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
        },
        select: {
          id: true,
          code: true,
          name: true,
          avgGPA: true,
          credits: true,
          level: true,
        },
        orderBy: { code: 'asc' },
        take: input.limit,
      })
      return courses
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
