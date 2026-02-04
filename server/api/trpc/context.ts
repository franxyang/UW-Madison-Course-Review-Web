import { type FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function createTRPCContext(opts: FetchCreateContextFnOptions) {
  const session = await auth()
  
  return {
    session,
    prisma,
  }
}

export type Context = Awaited<ReturnType<typeof createTRPCContext>>
