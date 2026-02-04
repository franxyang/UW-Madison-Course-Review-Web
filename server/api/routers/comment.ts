import { z } from 'zod'
import { router, protectedProcedure } from '../trpc/trpc'
import { TRPCError } from '@trpc/server'

export const commentRouter = router({
  // Create a new comment
  create: protectedProcedure
    .input(
      z.object({
        reviewId: z.string(),
        text: z.string().min(1).max(500),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const comment = await ctx.prisma.comment.create({
        data: {
          text: input.text,
          reviewId: input.reviewId,
          authorId: ctx.session.user.id!,
        },
        include: {
          author: true,
        },
      })

      return comment
    }),

  // Delete a comment (only author can delete)
  delete: protectedProcedure
    .input(
      z.object({
        commentId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Find the comment first
      const comment = await ctx.prisma.comment.findUnique({
        where: { id: input.commentId },
      })

      if (!comment) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Comment not found',
        })
      }

      // Check if user is the author
      if (comment.authorId !== ctx.session.user.id) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You can only delete your own comments',
        })
      }

      // Delete the comment
      await ctx.prisma.comment.delete({
        where: { id: input.commentId },
      })

      return { success: true }
    }),
})
