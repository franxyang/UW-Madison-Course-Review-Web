import { z } from 'zod'
import { router, publicProcedure } from '../trpc/trpc'

export const siteRouter = router({
  listPublishedUpdates: publicProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where = { status: 'PUBLISHED' as const }

      const [items, total] = await Promise.all([
        ctx.prisma.siteUpdate.findMany({
          where,
          include: {
            author: {
              select: {
                id: true,
                nickname: true,
                name: true,
              },
            },
          },
          orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.prisma.siteUpdate.count({ where }),
      ])

      return {
        items,
        total,
        page: input.page,
        pages: Math.ceil(total / input.limit),
      }
    }),
})
