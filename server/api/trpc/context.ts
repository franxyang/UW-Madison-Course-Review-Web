import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function createTRPCContext(opts: FetchCreateContextFnOptions) {
  const session = await auth()
  const forwarded = opts.req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || undefined
  const userAgent = opts.req.headers.get('user-agent') || undefined

  return {
    session,
    prisma,
    requestMeta: {
      ip,
      userAgent,
    },
  }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>
