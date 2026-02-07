import { z } from 'zod'
import { router, publicProcedure } from '../trpc/trpc'
import { TRPCError } from '@trpc/server'

export const instructorRouter = router({
  // List instructors with search and pagination
  list: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().min(1).max(100).default(30),
        offset: z.number().min(0).default(0),
        sortBy: z.enum(['name', 'reviews', 'courses']).default('name'),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {}

      if (input.search && input.search.trim()) {
        where.name = { contains: input.search.trim(), mode: 'insensitive' }
      }

      let orderBy: any = { name: 'asc' }
      if (input.sortBy === 'reviews') {
        orderBy = { reviews: { _count: 'desc' } }
      } else if (input.sortBy === 'courses') {
        orderBy = { courses: { _count: 'desc' } }
      }

      const [instructors, total] = await Promise.all([
        ctx.prisma.instructor.findMany({
          where,
          include: {
            _count: {
              select: {
                reviews: true,
                courses: true,
              },
            },
          },
          take: input.limit,
          skip: input.offset,
          orderBy,
        }),
        ctx.prisma.instructor.count({ where }),
      ])

      return { instructors, total }
    }),

  // Get instructor by ID with courses and reviews
  byId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const instructor = await ctx.prisma.instructor.findUnique({
        where: { id: input.id },
        include: {
          courses: {
            include: {
              course: {
                include: {
                  school: true,
                  _count: {
                    select: { reviews: true },
                  },
                },
              },
            },
          },
          reviews: {
            include: {
              author: true,
              course: {
                select: { id: true, code: true, name: true },
              },
              votes: true,
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      if (!instructor) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Instructor not found',
        })
      }

      // Calculate average ratings across all reviews
      // P1 Fix: Include all 7 grade levels (A, AB, B, BC, C, D, F)
      const gradeToScore: Record<string, number> = {
        'F': 1,
        'D': 2,
        'C': 3,
        'BC': 3.5,
        'B': 4,
        'AB': 4.5,
        'A': 5,
      }
      const getRatingScore = (rating: string): number => gradeToScore[rating] ?? 3 // Default to C if unknown

      const reviews = instructor.reviews
      const avgRatings = reviews.length > 0 ? {
        content: reviews.reduce((sum, r) => sum + getRatingScore(r.contentRating), 0) / reviews.length,
        teaching: reviews.reduce((sum, r) => sum + getRatingScore(r.teachingRating), 0) / reviews.length,
        grading: reviews.reduce((sum, r) => sum + getRatingScore(r.gradingRating), 0) / reviews.length,
        workload: reviews.reduce((sum, r) => sum + getRatingScore(r.workloadRating), 0) / reviews.length,
      } : null

      return {
        ...instructor,
        avgRatings,
      }
    }),
})
