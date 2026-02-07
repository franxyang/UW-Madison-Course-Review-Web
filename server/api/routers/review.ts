import { z } from 'zod'
import { router, protectedProcedure } from '../trpc/trpc'
import { TRPCError } from '@trpc/server'
import { calculateReviewXP, computeContributorLevel } from '@/lib/contributorLevel'

const gradeEnum = z.enum(['A', 'AB', 'B', 'BC', 'C', 'D', 'F'])

export const reviewRouter = router({
  // Create a new review
  create: protectedProcedure
    .input(
      z.object({
        courseId: z.string(),
        title: z.string().min(1).max(200).optional(),
        term: z.string(),
        gradeReceived: gradeEnum.optional(),
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

      // Check if this is the first review on this course (bonus XP)
      const existingCourseReviewCount = await ctx.prisma.review.count({
        where: { courseId: input.courseId },
      })
      const isFirstReviewOnCourse = existingCourseReviewCount === 0

      // Create review
      const review = await ctx.prisma.review.create({
        data: {
          courseId: input.courseId,
          instructorId: instructor.id,
          authorId: user.id,
          term: input.term,
          title: input.title || null,
          gradeReceived: input.gradeReceived || null,
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

      // Award XP and update contributor level
      const xpEarned = calculateReviewXP(isFirstReviewOnCourse)
      const newXP = (user.xp || 0) + xpEarned

      // Recount stats for accurate level
      const [newReviewCount, upvotesReceived] = await Promise.all([
        ctx.prisma.review.count({ where: { authorId: user.id } }),
        ctx.prisma.vote.count({ where: { review: { authorId: user.id } } }),
      ])
      const newLevel = computeContributorLevel(newReviewCount, upvotesReceived)

      await ctx.prisma.user.update({
        where: { id: user.id },
        data: {
          xp: newXP,
          level: newLevel.level,
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

      // Get the review to find its author (for level updates)
      const review = await ctx.prisma.review.findUnique({
        where: { id: input.reviewId },
        select: { authorId: true },
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

        // Update review author's level (they lost an upvote)
        if (review) {
          const [reviewCount, upvotesReceived] = await Promise.all([
            ctx.prisma.review.count({ where: { authorId: review.authorId } }),
            ctx.prisma.vote.count({ where: { review: { authorId: review.authorId } } }),
          ])
          const newLevel = computeContributorLevel(reviewCount, upvotesReceived)
          await ctx.prisma.user.update({
            where: { id: review.authorId },
            data: { level: newLevel.level },
          })
        }

        return { isVoted: false }
      } else {
        // Add vote
        await ctx.prisma.vote.create({
          data: {
            userId,
            reviewId: input.reviewId,
          },
        })

        // Update review author's level (they gained an upvote) + award XP
        if (review) {
          const [reviewCount, upvotesReceived] = await Promise.all([
            ctx.prisma.review.count({ where: { authorId: review.authorId } }),
            ctx.prisma.vote.count({ where: { review: { authorId: review.authorId } } }),
          ])
          const newLevel = computeContributorLevel(reviewCount, upvotesReceived)
          await ctx.prisma.user.update({
            where: { id: review.authorId },
            data: {
              level: newLevel.level,
              xp: { increment: 10 }, // XP_REWARDS.RECEIVE_UPVOTE
            },
          })
        }

        return { isVoted: true }
      }
    }),

  // Update an existing review (author only)
  update: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        title: z.string().min(1).max(200).optional(),
        term: z.string().optional(),
        gradeReceived: gradeEnum.optional(),
        contentRating: gradeEnum.optional(),
        teachingRating: gradeEnum.optional(),
        gradingRating: gradeEnum.optional(),
        workloadRating: gradeEnum.optional(),
        contentComment: z.string().max(3000).optional(),
        teachingComment: z.string().max(3000).optional(),
        gradingComment: z.string().max(3000).optional(),
        workloadComment: z.string().max(3000).optional(),
        assessments: z.array(z.string()).optional(),
        resourceLink: z.string().url().optional().or(z.literal('')),
        instructorName: z.string().min(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!

      // Verify ownership
      const review = await ctx.prisma.review.findUnique({
        where: { id: input.reviewId },
        select: { authorId: true },
      })

      if (!review) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Review not found' })
      }

      if (review.authorId !== userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only edit your own reviews' })
      }

      // Handle instructor update if name changed
      let instructorUpdate: { instructorId?: string } = {}
      if (input.instructorName) {
        let instructor = await ctx.prisma.instructor.findUnique({
          where: { name: input.instructorName },
        })
        if (!instructor) {
          instructor = await ctx.prisma.instructor.create({
            data: { name: input.instructorName, aliases: null },
          })
        }
        instructorUpdate = { instructorId: instructor.id }
      }

      const updated = await ctx.prisma.review.update({
        where: { id: input.reviewId },
        data: {
          ...(input.title !== undefined && { title: input.title || null }),
          ...(input.term && { term: input.term }),
          ...(input.gradeReceived && { gradeReceived: input.gradeReceived }),
          ...(input.contentRating && { contentRating: input.contentRating }),
          ...(input.teachingRating && { teachingRating: input.teachingRating }),
          ...(input.gradingRating && { gradingRating: input.gradingRating }),
          ...(input.workloadRating && { workloadRating: input.workloadRating }),
          ...(input.contentComment !== undefined && { contentComment: input.contentComment || null }),
          ...(input.teachingComment !== undefined && { teachingComment: input.teachingComment || null }),
          ...(input.gradingComment !== undefined && { gradingComment: input.gradingComment || null }),
          ...(input.workloadComment !== undefined && { workloadComment: input.workloadComment || null }),
          ...(input.assessments && { assessments: JSON.stringify(input.assessments) }),
          ...(input.resourceLink !== undefined && { resourceLink: input.resourceLink || null }),
          ...instructorUpdate,
        },
        include: {
          author: true,
          instructor: true,
        },
      })

      return updated
    }),

  // Delete a review (author only)
  delete: protectedProcedure
    .input(z.object({ reviewId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!

      // Verify ownership
      const review = await ctx.prisma.review.findUnique({
        where: { id: input.reviewId },
        select: { authorId: true },
      })

      if (!review) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Review not found' })
      }

      if (review.authorId !== userId) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'You can only delete your own reviews' })
      }

      // Delete related data first (votes, comments), then review
      await ctx.prisma.$transaction([
        ctx.prisma.vote.deleteMany({ where: { reviewId: input.reviewId } }),
        ctx.prisma.comment.deleteMany({ where: { reviewId: input.reviewId } }),
        ctx.prisma.review.delete({ where: { id: input.reviewId } }),
      ])

      // Recalculate author's level (they lost a review)
      const [reviewCount, upvotesReceived] = await Promise.all([
        ctx.prisma.review.count({ where: { authorId: review.authorId } }),
        ctx.prisma.vote.count({ where: { review: { authorId: review.authorId } } }),
      ])
      const newLevel = computeContributorLevel(reviewCount, upvotesReceived)

      await ctx.prisma.user.update({
        where: { id: review.authorId },
        data: { level: newLevel.level },
      })

      return { success: true }
    }),

  // Report a review
  report: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        reason: z.enum(['spam', 'offensive', 'irrelevant', 'misinformation', 'other']),
        details: z.string().max(500).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!

      // Check if already reported by this user
      const existingReport = await ctx.prisma.report.findUnique({
        where: {
          reporterId_reviewId: {
            reporterId: userId,
            reviewId: input.reviewId,
          },
        },
      })

      if (existingReport) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You have already reported this review',
        })
      }

      // Can't report your own review
      const review = await ctx.prisma.review.findUnique({
        where: { id: input.reviewId },
        select: { authorId: true },
      })

      if (review?.authorId === userId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot report your own review',
        })
      }

      await ctx.prisma.report.create({
        data: {
          reviewId: input.reviewId,
          reporterId: userId,
          reason: input.reason,
          details: input.details || null,
        },
      })

      return { success: true }
    }),
})
