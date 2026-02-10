import { z } from 'zod'
import { router, publicProcedure } from '../trpc/trpc'
import { TRPCError } from '@trpc/server'
import { Prisma } from '@prisma/client'
import { cached, cacheKeys, TTL } from '@/lib/redis'
import { expandSearchAliases } from '@/lib/courseAliases'
import { computeContributorLevel } from '@/lib/contributorLevel'
import { inferCourseLevelFromCode, isCanonicalCourseLevel } from '@/lib/courseLevel'
import { getAppSettings, type ReviewRestrictionReason } from '@/lib/appSettings'

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

      // Use tolerant full-text query that won't throw on multi-word input
      const results = await ctx.prisma.$queryRaw<any[]>`
        SELECT 
          c."id", c."code", c."name", c."credits", c."level",
          s."name" as "school_name",
          ts_rank(c."searchVector", plainto_tsquery('english', ${searchTerm})) AS rank
        FROM "Course" c
        JOIN "School" s ON c."schoolId" = s."id"
        WHERE c."searchVector" @@ plainto_tsquery('english', ${searchTerm})
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

      const groupCourseIds =
        course.crossListGroup?.courses?.map((c) => c.id).filter(Boolean) || [course.id]

      const [groupReviews, groupInstructors, groupGradeDistributions] = await Promise.all([
        ctx.prisma.review.findMany({
          where: { courseId: { in: groupCourseIds } },
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
        }),
        ctx.prisma.courseInstructor.findMany({
          where: { courseId: { in: groupCourseIds } },
          include: {
            instructor: true,
          },
        }),
        ctx.prisma.gradeDistribution.findMany({
          where: { courseId: { in: groupCourseIds } },
          include: {
            instructor: true,
          },
          orderBy: [{ term: 'desc' }, { avgGPA: 'desc' }],
        }),
      ])

      // Deduplicate instructors across cross-listed courses.
      const mergedInstructorsMap = new Map<string, (typeof groupInstructors)[number]>()
      for (const row of groupInstructors) {
        if (!mergedInstructorsMap.has(row.instructorId)) {
          mergedInstructorsMap.set(row.instructorId, row)
        }
      }
      const mergedInstructors = [...mergedInstructorsMap.values()]

      // Deduplicate exact duplicate grade rows that may appear on multiple aliases.
      const mergedGradeDistMap = new Map<string, (typeof groupGradeDistributions)[number]>()
      for (const gd of groupGradeDistributions) {
        const key = [
          gd.term,
          gd.instructorId ?? '__NULL__',
          gd.aCount,
          gd.abCount,
          gd.bCount,
          gd.bcCount,
          gd.cCount,
          gd.dCount,
          gd.fCount,
          gd.totalGraded,
        ].join('|')
        if (!mergedGradeDistMap.has(key)) {
          mergedGradeDistMap.set(key, gd)
        }
      }
      const mergedGradeDistributions = [...mergedGradeDistMap.values()]

      let mergedAvgGPA: number | null = course.avgGPA
      if ((mergedAvgGPA == null || mergedAvgGPA <= 0) && mergedGradeDistributions.length > 0) {
        const totalStudents = mergedGradeDistributions.reduce((sum, gd) => sum + gd.totalGraded, 0)
        if (totalStudents > 0) {
          const weightedSum = mergedGradeDistributions.reduce(
            (sum, gd) => sum + gd.avgGPA * gd.totalGraded,
            0
          )
          mergedAvgGPA = weightedSum / totalStudents
        }
      }

      const accessSettings = await getAppSettings(ctx.prisma)
      const isLoggedIn = Boolean(ctx.session?.user?.id)
      let userReviewCount = 0

      if (isLoggedIn && ctx.session?.user?.id) {
        userReviewCount = await ctx.prisma.review.count({
          where: { authorId: ctx.session.user.id },
        })
      }

      const passesSignInGate = !accessSettings.requireSignInToViewReviews || isLoggedIn
      const passesContributionGate =
        !accessSettings.requireContributionToViewFullReviews || userReviewCount >= 1
      const hasFullAccess = passesSignInGate && passesContributionGate
      const restrictionReason: ReviewRestrictionReason = hasFullAccess
        ? 'none'
        : !passesSignInGate && !passesContributionGate
        ? 'signin+contribution'
        : !passesSignInGate
        ? 'signin'
        : 'contribution'

      // Sort reviews: highest-voted first for the preview
      const sortedReviews = [...groupReviews].sort(
        (a, b) => (b.votes?.length || 0) - (a.votes?.length || 0)
      )
      const previewCount = hasFullAccess
        ? sortedReviews.length
        : !isLoggedIn && accessSettings.requireSignInToViewReviews
        ? 0
        : 1

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

      const currentUserId = ctx.session?.user?.id ?? null

      // P0 Security Fix: Server-side review filtering based on access level
      // Only return full review data if user has access, otherwise return limited preview
      const sanitizedReviews = sortedReviews.map((review, index) => {
        // Strip sensitive fields from author (never expose email or real name)
        // Handle anonymous reviews: hide author info from other users
        const isOwnReview = currentUserId && review.authorId === currentUserId
        const isAnonymousToViewer = review.isAnonymous === true && !isOwnReview

        const safeAuthor = isAnonymousToViewer
          ? { id: 'anonymous', name: 'Anonymous Badger', image: null }
          : review.author ? {
              id: review.author.id,
              name: review.author.nickname || 'Anonymous Badger',
              image: review.author.image,
              // Never include: email, emailVerified, real name
            } : null

        // Strip sensitive fields from comment authors
        const safeComments = review.comments?.map(comment => ({
          ...comment,
          author: comment.author ? {
            id: comment.author.id,
            name: comment.author.nickname || 'Anonymous Badger',
            image: comment.author.image,
          } : null,
        })) || []

        // Strip user info from votes (only need count)
        const safeVotes = review.votes?.map(vote => ({
          id: vote.id,
          reviewId: vote.reviewId,
          // Don't include: userId, user
        })) || []

        const currentUserVoted = currentUserId
          ? (review.votes?.some(vote => vote.userId === currentUserId) ?? false)
          : false

        // Always show contributor rank (even for anonymous reviews)
        const authorLevel = authorLevelMap.get(review.authorId) || computeContributorLevel(0, 0)

        // If user has full access OR this is within preview quota, return full content
        if (hasFullAccess || index < previewCount) {
          return {
            ...review,
            title: review.title || accessSettings.fallbackReviewTitle,
            author: safeAuthor,
            comments: safeComments,
            votes: safeVotes,
            currentUserVoted,
            authorLevel,
            isAnonymous: review.isAnonymous,
            showRankWhenAnonymous: review.showRankWhenAnonymous,
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
          currentUserVoted,
          authorLevel,
          isAnonymous: review.isAnonymous,
          showRankWhenAnonymous: review.showRankWhenAnonymous,
          _redacted: true, // Flag for frontend
        }
      })

      return {
        ...course,
        avgGPA: mergedAvgGPA,
        instructors: mergedInstructors,
        gradeDistributions: mergedGradeDistributions,
        reviews: sanitizedReviews,
        reviewAccess: {
          hasFullAccess,
          userReviewCount,
          totalReviews: sortedReviews.length,
          previewCount,
          isLoggedIn,
          requireSignInToViewReviews: accessSettings.requireSignInToViewReviews,
          requireContributionToViewFullReviews: accessSettings.requireContributionToViewFullReviews,
          restrictionReason,
        },
      }
    }),

  // Get courses by department code prefix (for sidebar)
  sameDepartment: publicProcedure
    .input(
      z.object({
        codePrefix: z.string().min(1),
        excludeId: z.string().optional(),
        currentCode: z.string().optional(),
        currentLevel: z.string().optional(), // e.g., "Advanced", "Elementary", "Intermediate"
        limit: z.number().min(1).max(20).default(12),
      })
    )
    .query(async ({ ctx, input }) => {
      // Build target level from course code first (more reliable than stored text level).
      const targetLevelFromCode = input.currentCode ? inferCourseLevelFromCode(input.currentCode) : null
      const targetLevel =
        targetLevelFromCode ||
        (input.currentLevel && isCanonicalCourseLevel(input.currentLevel) ? input.currentLevel : null)

      const candidates = await ctx.prisma.course.findMany({
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
      })

      if (!targetLevel) {
        return candidates.slice(0, input.limit)
      }

      const sameLevel: typeof candidates = []
      const otherLevels: typeof candidates = []
      for (const course of candidates) {
        const parsedLevel = inferCourseLevelFromCode(course.code)
        const fallbackLevel = isCanonicalCourseLevel(course.level) ? course.level : null
        const candidateLevel = parsedLevel || fallbackLevel

        if (candidateLevel === targetLevel) sameLevel.push(course)
        else otherLevels.push(course)
      }

      return [...sameLevel, ...otherLevels].slice(0, input.limit)
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
        take: 20
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
        take: 20
      })
    ])
    return { mostReviewed, recentReviews }
  }),
})
