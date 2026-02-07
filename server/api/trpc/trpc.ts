import { initTRPC, TRPCError } from '@trpc/server'
import { type Context } from './context'
import superjson from 'superjson'

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape
  },
})

export const router = t.router
export const publicProcedure = t.procedure

// Protected procedure - requires authentication + ban check
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  // Check for active ban
  const userId = ctx.session.user.id
  if (userId) {
    const activeBan = await ctx.prisma.userBan.findFirst({
      where: {
        userId,
        active: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    })
    if (activeBan) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: `Your account has been suspended. Reason: ${activeBan.reason}${activeBan.expiresAt ? `. Expires: ${activeBan.expiresAt.toISOString()}` : ' (permanent)'}`,
      })
    }
  }

  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
    },
  })
})

// Admin procedure - requires ADMIN or MODERATOR role
export const adminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  const userId = ctx.session.user.id
  if (!userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  const user = await ctx.prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (!user || (user.role !== 'ADMIN' && user.role !== 'MODERATOR')) {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin or Moderator access required',
    })
  }

  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
      userRole: user.role,
    },
  })
})

// Super admin procedure - requires ADMIN role only
export const superAdminProcedure = t.procedure.use(async ({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  const userId = ctx.session.user.id
  if (!userId) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }

  const user = await ctx.prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  if (!user || user.role !== 'ADMIN') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    })
  }

  return next({
    ctx: {
      ...ctx,
      session: { ...ctx.session, user: ctx.session.user },
      userRole: user.role as 'ADMIN',
    },
  })
})
