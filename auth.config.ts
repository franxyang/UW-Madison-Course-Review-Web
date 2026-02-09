import type { NextAuthConfig } from 'next-auth'
import Google from 'next-auth/providers/google'
import Credentials from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import {
  isValidHandle,
  normalizeEmail,
  normalizeHandle,
  resolveUniqueHandle,
  suggestHandleFromEmail,
  isWiscEmail,
} from '@/lib/authIdentity'
import { verifyPassword } from '@/lib/password'

// Validate environment variables
if (!process.env.GOOGLE_CLIENT_ID) {
  throw new Error('Missing GOOGLE_CLIENT_ID environment variable')
}
if (!process.env.GOOGLE_CLIENT_SECRET) {
  throw new Error('Missing GOOGLE_CLIENT_SECRET environment variable')
}
if (!process.env.AUTH_SECRET) {
  throw new Error('Missing AUTH_SECRET environment variable')
}

const ALLOWED_ELIGIBILITY = ['STUDENT_VERIFIED', 'ALUMNI_VERIFIED'] as const
const PASSWORD_MAX_FAILED_ATTEMPTS = 5
const PASSWORD_LOCK_MINUTES = 15

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          hd: 'wisc.edu',
        },
      },
      allowDangerousEmailAccountLinking: true,
    }),
    Credentials({
      name: 'Handle / Email + Password',
      credentials: {
        identifier: { label: 'Handle or email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const identifier = String(credentials?.identifier ?? '').trim()
        const password = String(credentials?.password ?? '')
        if (!identifier || !password) return null

        const isEmailIdentifier = identifier.includes('@')
        const user = isEmailIdentifier
          ? (
              await prisma.userEmail.findUnique({
              where: { emailNormalized: normalizeEmail(identifier) },
              include: { user: { include: { credential: true } } },
            })
            )?.user
          : await prisma.user.findUnique({
              where: { loginHandleNormalized: normalizeHandle(identifier) },
              include: { credential: true },
            })

        if (!user || !user.credential) return null
        if (!ALLOWED_ELIGIBILITY.includes(user.eligibilityStatus as (typeof ALLOWED_ELIGIBILITY)[number])) {
          return null
        }

        const now = new Date()
        if (user.credential.lockedUntil && user.credential.lockedUntil > now) {
          return null
        }

        const verified = await verifyPassword(password, user.credential.passwordHash)
        if (!verified) {
          const nextFailed = user.credential.failedAttempts + 1
          await prisma.userCredential.update({
            where: { userId: user.id },
            data: {
              failedAttempts: nextFailed,
              lockedUntil:
                nextFailed >= PASSWORD_MAX_FAILED_ATTEMPTS
                  ? new Date(Date.now() + PASSWORD_LOCK_MINUTES * 60 * 1000)
                  : null,
            },
          })
          return null
        }

        await prisma.userCredential.update({
          where: { userId: user.id },
          data: {
            failedAttempts: 0,
            lockedUntil: null,
          },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
        }
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return true

      const normalizedEmail = normalizeEmail(user.email || '')
      if (!normalizedEmail || !isWiscEmail(normalizedEmail)) {
        return '/auth/error?error=AccessDenied'
      }

      try {
        await prisma.$transaction(async (tx) => {
          const existingIdentity = await tx.userEmail.findUnique({
            where: { emailNormalized: normalizedEmail },
            select: { userId: true },
          })

          const userId = existingIdentity?.userId || user.id
          if (!userId) {
            throw new Error('MISSING_USER')
          }

          if (existingIdentity && user.id && existingIdentity.userId !== user.id) {
            throw new Error('ACCOUNT_LINK_CONFLICT')
          }

          const existingUser = await tx.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              loginHandle: true,
              firstVerifiedAt: true,
            },
          })

          if (!existingUser) {
            throw new Error('MISSING_USER')
          }

          const hasRecovery = await tx.userEmail.count({
            where: {
              userId,
              type: 'RECOVERY',
              isVerified: true,
              canLogin: true,
            },
          })

          const desiredHandle = existingUser.loginHandle || suggestHandleFromEmail(normalizedEmail)
          const finalHandle =
            existingUser.loginHandle && isValidHandle(existingUser.loginHandle)
              ? normalizeHandle(existingUser.loginHandle)
              : await resolveUniqueHandle(tx, desiredHandle)

          await tx.user.update({
            where: { id: userId },
            data: {
              email: normalizedEmail,
              emailVerified: new Date(),
              eligibilityStatus: 'STUDENT_VERIFIED',
              firstVerifiedAt: existingUser.firstVerifiedAt || new Date(),
              lastWiscVerifiedAt: new Date(),
              loginHandle: finalHandle,
              loginHandleNormalized: finalHandle,
              requiresRecoverySetup: hasRecovery === 0,
            },
          })

          await tx.userEmail.upsert({
            where: { emailNormalized: normalizedEmail },
            update: {
              userId,
              email: normalizedEmail,
              type: 'UNIVERSITY',
              isVerified: true,
              canLogin: true,
              verifiedAt: new Date(),
            },
            create: {
              userId,
              email: normalizedEmail,
              emailNormalized: normalizedEmail,
              type: 'UNIVERSITY',
              isVerified: true,
              canLogin: true,
              verifiedAt: new Date(),
            },
          })
        })
      } catch (error) {
        console.error('[auth.signIn.google] failed to reconcile identity', error)
        return '/auth/error?error=AccountLink'
      }

      return true
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        ;(session.user as any).nickname = (user as any).nickname || null
        ;(session.user as any).role = (user as any).role || 'STUDENT'
        ;(session.user as any).loginHandle = (user as any).loginHandle || null
        ;(session.user as any).eligibilityStatus = (user as any).eligibilityStatus || 'UNVERIFIED'
        ;(session.user as any).requiresRecoverySetup = (user as any).requiresRecoverySetup || false
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60,
    updateAge: 24 * 60 * 60,
  },
  debug: process.env.NODE_ENV === 'development',
}
