import { z } from 'zod'
import { router, protectedProcedure } from '../trpc/trpc'
import { prisma } from '@/lib/prisma'

export const userRouter = router({
  updateNickname: protectedProcedure
    .input(z.object({
      nickname: z.string().min(1).max(30).trim(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      if (!userId) throw new Error('No user id')

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { nickname: input.nickname },
        select: { nickname: true },
      })

      return updated
    }),
})
