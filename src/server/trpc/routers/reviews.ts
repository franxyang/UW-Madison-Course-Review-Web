import { z } from "zod";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "@/server/trpc";

const gradeSchema = z.enum(["A", "AB", "B", "BC", "C", "D", "F"]);

const reviewCreateSchema = z.object({
  courseId: z.string(),
  instructorId: z.string().optional(),
  term: z.string(),
  gradeReceived: gradeSchema.optional(),

  // Ratings
  contentRating: gradeSchema,
  teachingRating: gradeSchema,
  gradingRating: gradeSchema,
  workloadRating: gradeSchema,

  // Comments
  contentComment: z.string().optional(),
  teachingComment: z.string().optional(),
  gradingComment: z.string().optional(),
  workloadComment: z.string().optional(),
  overallComment: z.string().optional(),
  tips: z.string().optional(),

  // Assessments
  hasHomework: z.boolean().default(false),
  hasMidterm: z.boolean().default(false),
  hasFinal: z.boolean().default(false),
  hasProject: z.boolean().default(false),
  hasQuiz: z.boolean().default(false),
  hasEssay: z.boolean().default(false),
  hasPresentation: z.boolean().default(false),
});

export const reviewsRouter = createTRPCRouter({
  /**
   * Get reviews for a course
   */
  getByCourse: publicProcedure
    .input(
      z.object({
        courseId: z.string(),
        page: z.number().default(1),
        limit: z.number().default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const { courseId, page, limit } = input;
      const skip = (page - 1) * limit;

      const [reviews, total] = await Promise.all([
        ctx.db.review.findMany({
          where: { courseId, status: "PUBLISHED" },
          orderBy: { createdAt: "desc" },
          skip,
          take: limit,
          include: {
            author: {
              select: { id: true, name: true, image: true },
            },
            instructor: {
              select: { id: true, name: true },
            },
          },
        }),
        ctx.db.review.count({ where: { courseId, status: "PUBLISHED" } }),
      ]);

      return {
        reviews,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }),

  /**
   * Create a new review (requires auth)
   */
  create: protectedProcedure
    .input(reviewCreateSchema)
    .mutation(async ({ ctx, input }) => {
      const review = await ctx.db.review.create({
        data: {
          ...input,
          authorId: ctx.session.user.id!,
        },
      });

      // Update course review count and avg rating
      await updateCourseStats(ctx.db, input.courseId);

      return review;
    }),

  /**
   * Update a review (owner only)
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        data: reviewCreateSchema.partial(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const existing = await ctx.db.review.findUnique({
        where: { id: input.id },
        select: { authorId: true, courseId: true },
      });

      if (!existing || existing.authorId !== ctx.session.user.id) {
        throw new Error("Not authorized to update this review");
      }

      const review = await ctx.db.review.update({
        where: { id: input.id },
        data: input.data,
      });

      // Update course stats
      await updateCourseStats(ctx.db, existing.courseId);

      return review;
    }),

  /**
   * Delete a review (owner only)
   */
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // Check ownership
      const existing = await ctx.db.review.findUnique({
        where: { id: input.id },
        select: { authorId: true, courseId: true },
      });

      if (!existing || existing.authorId !== ctx.session.user.id) {
        throw new Error("Not authorized to delete this review");
      }

      await ctx.db.review.delete({ where: { id: input.id } });

      // Update course stats
      await updateCourseStats(ctx.db, existing.courseId);

      return { success: true };
    }),

  /**
   * Get user's own reviews
   */
  getMyReviews: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.review.findMany({
      where: { authorId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
      include: {
        course: {
          select: { id: true, code: true, name: true },
        },
        instructor: {
          select: { id: true, name: true },
        },
      },
    });
  }),
});

/**
 * Helper to update course statistics after review changes
 */
async function updateCourseStats(db: any, courseId: string) {
  const reviews = await db.review.findMany({
    where: { courseId, status: "PUBLISHED" },
    select: {
      contentRating: true,
      teachingRating: true,
      gradingRating: true,
      workloadRating: true,
    },
  });

  const gradeToNumber = (grade: string) => {
    const map: Record<string, number> = {
      A: 4.0,
      AB: 3.5,
      B: 3.0,
      BC: 2.5,
      C: 2.0,
      D: 1.0,
      F: 0.0,
    };
    return map[grade] ?? 0;
  };

  if (reviews.length === 0) {
    await db.course.update({
      where: { id: courseId },
      data: { reviewCount: 0, avgRating: null },
    });
    return;
  }

  // Calculate average across all dimensions
  const totalRating = reviews.reduce((sum: number, r: any) => {
    return (
      sum +
      (gradeToNumber(r.contentRating) +
        gradeToNumber(r.teachingRating) +
        gradeToNumber(r.gradingRating) +
        gradeToNumber(r.workloadRating)) /
        4
    );
  }, 0);

  const avgRating = totalRating / reviews.length;

  await db.course.update({
    where: { id: courseId },
    data: {
      reviewCount: reviews.length,
      avgRating,
    },
  });
}
