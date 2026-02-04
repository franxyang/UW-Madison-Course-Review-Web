import { z } from 'zod'
import { router, protectedProcedure } from '../trpc/trpc'
import { TRPCError } from '@trpc/server'

const gradeEnum = z.enum(['A', 'AB', 'B', 'BC', 'C', 'D', 'F'])

export const reviewRouter = router({
  // Create a new review
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
        contentComment: z.string().max(3000).optional(),
        teachingComment: z.string().max(3000).optional(),
        gradingComment: z.string().max(3000).optional(),
        workloadComment: z.string().max(3000).optional(),
        assessments: z.array(z.string()).optional(),
        resourceLink: z.string().url().optional().or(z.literal('')),
        instructorName: z.string().min(1, 'Instructor name is required'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check if user email ends with @wisc.edu
      if (!ctx.session.user.email?.endsWith('@wisc.edu')) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only @wisc.edu email addresses are allowed',
        })
      }

      // Find or create instructor
      let instructor = await ctx.prisma.instructor.findUnique({
        where: { name: input.instructorName },
      })

      if (!instructor) {
        instructor = await ctx.prisma.instructor.create({
          data: {
            name: input.instructorName,
            aliases: null,
          },
        })
      }

      // Get user from database
      const user = await ctx.prisma.user.findUnique({
        where: { email: ctx.session.user.email! },
      })

      if (!user) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'User account not found. Please sign up first.',
        })
      }

      // Check if user already reviewed this course with this instructor
      const existingReview = await ctx.prisma.review.findFirst({
        where: {
          authorId: user.id,
          courseId: input.courseId,
          instructorId: instructor.id,
        },
      })

      if (existingReview) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You have already reviewed this course with this instructor',
        })
      }

      // Create review
      const review = await ctx.prisma.review.create({
        data: {
          courseId: input.courseId,
          instructorId: instructor.id,
          authorId: user.id,
          term: input.term,
          title: input.title || null,
          gradeReceived: input.gradeReceived,
          // Store rating enums as strings
          contentRating: input.contentRating,
          teachingRating: input.teachingRating,
          gradingRating: input.gradingRating,
          workloadRating: input.workloadRating,
          // Comments
          contentComment: input.contentComment || null,
          teachingComment: input.teachingComment || null,
          gradingComment: input.gradingComment || null,
          workloadComment: input.workloadComment || null,
          // Convert arrays to JSON strings for storage
          assessments: input.assessments ? JSON.stringify(input.assessments) : null,
          resourceLink: input.resourceLink || null,
        },
        include: {
          author: true,
          instructor: true,
        },
      })

      return review
    }),

  // Vote/unvote on a review
  vote: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!

      // Check if already voted
      const existingVote = await ctx.prisma.vote.findUnique({
        where: {
          userId_reviewId: {
            userId,
            reviewId: input.reviewId,
          },
        },
      })

      if (existingVote) {
        // Remove vote
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
        // Add vote
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
