import { z } from 'zod'
import { router, protectedProcedure } from '../trpc/trpc'
import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'

// Nickname validation rules
const NICKNAME_REGEX = /^[a-zA-Z0-9\u4e00-\u9fff_\-. ]+$/
const RESERVED_NAMES = ['admin', 'moderator', 'wiscflow', 'anonymous', 'system', 'deleted']

const nicknameSchema = z.string()
  .min(2, 'Nickname must be at least 2 characters')
  .max(30, 'Nickname must be at most 30 characters')
  .trim()
  .refine(
    (val) => NICKNAME_REGEX.test(val),
    'Nickname can only contain letters, numbers, Chinese characters, spaces, hyphens, underscores, and dots'
  )
  .refine(
    (val) => !RESERVED_NAMES.includes(val.toLowerCase()),
    'This nickname is reserved'
  )

export const userRouter = router({
  // Get current user's nickname status
  me: protectedProcedure
    .query(async ({ ctx }) => {
      const userId = ctx.session.user.id
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' })

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { nickname: true, name: true },
      })

      return {
        nickname: user?.nickname || null,
        hasNickname: !!user?.nickname,
        name: user?.name || null,
      }
    }),

  // Update nickname
  updateNickname: protectedProcedure
    .input(z.object({
      nickname: nicknameSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' })

      const updated = await prisma.user.update({
        where: { id: userId },
        data: { nickname: input.nickname },
        select: { nickname: true },
      })

      return updated
    }),
})
