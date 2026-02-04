import { z } from 'zod'
import { router, publicProcedure } from '../trpc/trpc'
import { TRPCError } from '@trpc/server'

export const courseRouter = router({
  // Get course list with search and filters
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

  // Get all schools
  getSchools: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.school.findMany({
      orderBy: { name: 'asc' },
    })
  }),
})
