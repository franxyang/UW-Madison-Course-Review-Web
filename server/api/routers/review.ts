import { z } from 'zod'
import { router, protectedProcedure } from '../trpc/trpc'
import { TRPCError } from '@trpc/server'
import { calculateReviewXP, computeContributorLevel } from '@/lib/contributorLevel'
import { normalizeInstructorName } from '@/lib/instructorName'

const gradeEnum = z.enum(['A', 'AB', 'B', 'BC', 'C', 'D', 'F'])

async function resolveInstructorByName(
  prisma: any,
  instructorName: string,
  courseId?: string,
  term?: string,
  crossListCourseIds?: string[]
) {
  const normalized = normalizeInstructorName(instructorName)
  if (!normalized.key) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: 'Instructor name is required',
    })
  }

  const aliasMatches = await prisma.instructorAlias.findMany({
    where: { aliasKey: normalized.key },
    include: { instructor: true },
  })

  const courseScope =
    crossListCourseIds && crossListCourseIds.length > 0
      ? crossListCourseIds
      : courseId
      ? [courseId]
      : []

  if (aliasMatches.length > 0) {
    const best = aliasMatches.sort((a: any, b: any) => {
      const score = (row: any) =>
        (courseScope.length > 0 && row.courseId && courseScope.includes(row.courseId) ? 4 : 0) +
        (term && row.term === term ? 2 : 0) +
        (row.source === 'official' ? 1 : 0)
      return score(b) - score(a)
    })[0]
    return best.instructor
  }

  if (courseScope.length > 0) {
    const reviewScoped = await prisma.review.findFirst({
      where: {
        courseId: { in: courseScope },
        instructor: { nameKey: normalized.key },
      },
      include: { instructor: true },
      orderBy: { createdAt: 'desc' },
    })
    if (reviewScoped?.instructor) {
      return reviewScoped.instructor
    }

    const courseInstructorScoped = await prisma.courseInstructor.findFirst({
      where: {
        courseId: { in: courseScope },
        instructor: { nameKey: normalized.key },
      },
      include: { instructor: true },
    })
    if (courseInstructorScoped?.instructor) {
      return courseInstructorScoped.instructor
    }
  }

  let instructor =
    (await prisma.instructor.findFirst({
      where: { nameKey: normalized.key },
    })) ||
    (await prisma.instructor.findFirst({
      where: {
        name: {
          equals: normalized.displayName,
          mode: 'insensitive',
        },
      },
    }))

  if (!instructor) {
    instructor = await prisma.instructor.create({
      data: {
        name: normalized.displayName,
        nameKey: normalized.key,
        aliases: null,
      },
    })
  } else if (!instructor.nameKey) {
    instructor = await prisma.instructor.update({
      where: { id: instructor.id },
      data: { nameKey: normalized.key },
    })
  }

  await prisma.instructorAlias.upsert({
    where: {
      aliasKey_instructorId: {
        aliasKey: normalized.key,
        instructorId: instructor.id,
      },
    },
    update: {
      aliasRaw: normalized.raw,
      courseId: courseId ?? null,
      term: term ?? null,
      source: 'review',
    },
    create: {
      aliasRaw: normalized.raw,
      aliasKey: normalized.key,
      source: 'review',
      courseId: courseId ?? null,
      term: term ?? null,
      instructorId: instructor.id,
    },
  })

  return instructor
}

async function resolveCrossListCourseIds(prisma: any, courseId: string): Promise<string[]> {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { id: true, crossListGroupId: true },
  })

  if (!course) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Course not found',
    })
  }

  if (!course.crossListGroupId) {
    return [course.id]
  }

  const peers = await prisma.course.findMany({
    where: { crossListGroupId: course.crossListGroupId },
    select: { id: true },
  })
  return peers.map((peer: any) => peer.id)
}

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
        recommendInstructor: z.enum(['yes', 'no', 'neutral']).optional(),
        instructorName: z.string().min(1, 'Instructor name is required'),
        isAnonymous: z.boolean().default(false),
        showRankWhenAnonymous: z.boolean().default(false),
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

      const groupCourseIds = await resolveCrossListCourseIds(ctx.prisma, input.courseId)

      const instructor = await resolveInstructorByName(
        ctx.prisma,
        input.instructorName,
        input.courseId,
        input.term,
        groupCourseIds
      )

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
          courseId: { in: groupCourseIds },
          instructorId: instructor.id,
        },
      })

      if (existingReview) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'You have already reviewed this cross-listed course with this instructor',
        })
      }

      // Check if this is the first review on this course (bonus XP)
      const existingCourseReviewCount = await ctx.prisma.review.count({
        where: { courseId: { in: groupCourseIds } },
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
          recommendInstructor: input.recommendInstructor || null,
          isAnonymous: input.isAnonymous,
          showRankWhenAnonymous: input.showRankWhenAnonymous,
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
        select: { authorId: true, courseId: true, term: true },
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
        recommendInstructor: z.enum(['yes', 'no', 'neutral']).optional(),
        instructorName: z.string().min(1).optional(),
        isAnonymous: z.boolean().optional(),
        showRankWhenAnonymous: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id!

      // Verify ownership
      const review = await ctx.prisma.review.findUnique({
        where: { id: input.reviewId },
        select: { authorId: true, courseId: true, term: true },
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
        const groupCourseIds = await resolveCrossListCourseIds(ctx.prisma, review.courseId)
        const instructor = await resolveInstructorByName(
          ctx.prisma,
          input.instructorName,
          review.courseId,
          input.term || review.term,
          groupCourseIds
        )
        const duplicateReview = await ctx.prisma.review.findFirst({
          where: {
            id: { not: input.reviewId },
            authorId: userId,
            instructorId: instructor.id,
            courseId: { in: groupCourseIds },
          },
          select: { id: true },
        })
        if (duplicateReview) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'You already have a review with this instructor for this cross-listed course group',
          })
        }
        instructorUpdate = { instructorId: instructor.id }
      }

      // P2 Fix: Include recommendInstructor and handle empty assessments array
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
          // Fix: use !== undefined to allow empty array (clearing assessments)
          ...(input.assessments !== undefined && { assessments: JSON.stringify(input.assessments) }),
          ...(input.resourceLink !== undefined && { resourceLink: input.resourceLink || null }),
          // Fix: include recommendInstructor update
          ...(input.recommendInstructor !== undefined && { recommendInstructor: input.recommendInstructor }),
          ...(input.isAnonymous !== undefined && { isAnonymous: input.isAnonymous }),
          ...(input.showRankWhenAnonymous !== undefined && { showRankWhenAnonymous: input.showRankWhenAnonymous }),
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
