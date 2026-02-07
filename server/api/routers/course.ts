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
      const rawTerm = input.query.trim()
      
      // P2 Fix: Sanitize search term for tsquery (remove special chars that break syntax)
      // Keep only alphanumeric, spaces, and common course code chars
      const searchTerm = rawTerm
        .replace(/[^\w\s\-]/g, ' ')  // Replace special chars with space
        .replace(/\s+/g, ' ')         // Collapse multiple spaces
        .trim()
      
      // If sanitized term is empty, fall back to ILIKE only
      if (!searchTerm) {
        const results = await ctx.prisma.course.findMany({
          where: { code: { contains: rawTerm, mode: 'insensitive' } },
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
            level: true,
            school: { select: { name: true } },
          },
          take: input.limit,
        })
        return results.map(r => ({
          id: r.id,
          code: r.code,
          name: r.name,
          credits: r.credits,
          level: r.level,
          schoolName: r.school.name,
        }))
      }

      // Use prefix matching for partial queries (autocomplete)
      const results = await ctx.prisma.$queryRaw<any[]>`
        SELECT 
          c."id", c."code", c."name", c."credits", c."level",
          s."name" as "school_name",
          ts_rank(c."searchVector", to_tsquery('english', ${searchTerm + ':*'})) AS rank
        FROM "Course" c
        JOIN "School" s ON c."schoolId" = s."id"
        WHERE c."searchVector" @@ to_tsquery('english', ${searchTerm + ':*'})
           OR c."code" ILIKE ${`%${rawTerm}%`}
        ORDER BY 
          CASE WHEN c."code" ILIKE ${`${rawTerm}%`} THEN 0 ELSE 1 END,
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

      // P0 Security Fix: Server-side review filtering based on access level
      // Only return full review data if user has access, otherwise return limited preview
      const sanitizedReviews = sortedReviews.map((review, index) => {
        // Strip sensitive fields from author (never expose email)
        const safeAuthor = review.author ? {
          id: review.author.id,
          name: review.author.name,
          image: review.author.image,
          // Never include: email, emailVerified
        } : null

        // Strip sensitive fields from comment authors
        const safeComments = review.comments?.map(comment => ({
          ...comment,
          author: comment.author ? {
            id: comment.author.id,
            name: comment.author.name,
            image: comment.author.image,
          } : null,
        })) || []

        // Strip user info from votes (only need count)
        const safeVotes = review.votes?.map(vote => ({
          id: vote.id,
          reviewId: vote.reviewId,
          // Don't include: userId, user
        })) || []

        // If user has full access OR this is the first (preview) review, return full content
        if (hasFullAccess || index === 0) {
          return {
            ...review,
            author: safeAuthor,
            comments: safeComments,
            votes: safeVotes,
            authorLevel: authorLevelMap.get(review.authorId) || computeContributorLevel(0, 0),
          }
        }

        // For non-contributors: return redacted review (no content, just metadata)
        return {
          id: review.id,
          courseId: review.courseId,
          instructorId: review.instructorId,
          authorId: review.authorId,
          term: review.term,
          createdAt: review.createdAt,
          // Redact actual content
          title: null,
          gradeReceived: null,
          contentRating: review.contentRating, // Keep ratings for aggregate stats
          teachingRating: review.teachingRating,
          gradingRating: review.gradingRating,
          workloadRating: review.workloadRating,
          contentComment: null, // Redacted
          teachingComment: null,
          gradingComment: null,
          workloadComment: null,
          pros: null,
          cons: null,
          tips: null,
          assessments: [],
          recommendInstructor: null,
          instructor: review.instructor,
          author: safeAuthor,
          comments: [], // Hide comments for non-contributors
          votes: safeVotes,
          authorLevel: authorLevelMap.get(review.authorId) || computeContributorLevel(0, 0),
          _redacted: true, // Flag for frontend
        }
      })

      return {
        ...course,
        reviews: sanitizedReviews,
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
        currentLevel: z.string().optional(), // e.g., "500" for 500-level courses
        limit: z.number().min(1).max(20).default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      // Extract level range (e.g., "500" -> 500-599)
      const levelPrefix = input.currentLevel?.substring(0, 1) || ''
      
      // First, try to get same-level courses
      let courses = await ctx.prisma.course.findMany({
        where: {
          code: { startsWith: input.codePrefix },
          ...(input.excludeId ? { id: { not: input.excludeId } } : {}),
          ...(levelPrefix ? { level: { startsWith: levelPrefix } } : {}),
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
      
      // If not enough same-level courses, fill with other courses from same department
      if (courses.length < input.limit && levelPrefix) {
        const existingIds = courses.map(c => c.id)
        const additionalCourses = await ctx.prisma.course.findMany({
          where: {
            code: { startsWith: input.codePrefix },
            id: { notIn: [input.excludeId || '', ...existingIds].filter(Boolean) },
            level: { not: { startsWith: levelPrefix } },
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
          take: input.limit - courses.length,
        })
        courses = [...courses, ...additionalCourses]
      }
      
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

  // Get departments grouped by school (for navigation)
  getDepartmentsBySchool: publicProcedure.query(async ({ ctx }) => {
    const schools = await ctx.prisma.school.findMany({
      include: {
        departments: {
          select: {
            id: true,
            code: true,
            name: true,
            _count: { select: { courses: true } }
          },
          orderBy: { code: 'asc' }
        },
        _count: { select: { courses: true } }
      },
      orderBy: { name: 'asc' }
    })
    return schools
  }),

  // Get department stats
  getDepartmentStats: publicProcedure
    .input(z.object({ departmentCode: z.string() }))
    .query(async ({ ctx, input }) => {
      const dept = await ctx.prisma.department.findUnique({
        where: { code: input.departmentCode },
        include: {
          courses: {
            include: {
              course: {
                select: {
                  id: true,
                  code: true,
                  name: true,
                  avgGPA: true,
                  credits: true,
                  level: true,
                  _count: { select: { reviews: true } }
                }
              }
            }
          },
          school: { select: { name: true } }
        }
      })
      
      if (!dept) return null
      
      const courses = dept.courses.map(c => c.course)
      const validGPAs = courses.filter(c => c.avgGPA && c.avgGPA > 0).map(c => c.avgGPA!)
      const avgGPA = validGPAs.length > 0 
        ? validGPAs.reduce((a, b) => a + b, 0) / validGPAs.length 
        : null
      const totalReviews = courses.reduce((sum, c) => sum + c._count.reviews, 0)
      
      return {
        code: dept.code,
        name: dept.name,
        schoolName: dept.school.name,
        courseCount: courses.length,
        avgGPA,
        totalReviews,
        courses: courses.sort((a, b) => a.code.localeCompare(b.code)),
        topCourses: [...courses].sort((a, b) => b._count.reviews - a._count.reviews).slice(0, 5)
      }
    }),

  // Get featured courses for homepage/initial view
  getFeatured: publicProcedure.query(async ({ ctx }) => {
    const [mostReviewed, recentReviews] = await Promise.all([
      ctx.prisma.course.findMany({
        where: { reviews: { some: {} } },
        select: {
          id: true,
          code: true,
          name: true,
          avgGPA: true,
          credits: true,
          _count: { select: { reviews: true } }
        },
        orderBy: { reviews: { _count: 'desc' } },
        take: 8
      }),
      ctx.prisma.review.findMany({
        select: {
          id: true,
          title: true,
          contentRating: true,
          createdAt: true,
          course: { select: { id: true, code: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 6
      })
    ])
    return { mostReviewed, recentReviews }
  }),
})
