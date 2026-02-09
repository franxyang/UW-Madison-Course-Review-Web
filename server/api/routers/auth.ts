import { TRPCError } from '@trpc/server'
import { z } from 'zod'
import { verifyPassword, hashPassword } from '@/lib/password'
import {
  normalizeEmail,
  isWiscEmail,
  isValidHandle,
  normalizeHandle,
  resolveUniqueHandle,
  suggestHandleFromEmail,
} from '@/lib/authIdentity'
import { generateOtpCode, hashOtp } from '@/lib/otp'
import { sendAuthMail } from '@/lib/mailer'
import { protectedProcedure, publicProcedure, router } from '../trpc/trpc'
import type { Prisma } from '@prisma/client'

const OTP_TTL_MINUTES = 10
const OTP_SEND_COOLDOWN_SECONDS = 60
const OTP_MAX_PER_HOUR = 10
const PASSWORD_MAX_FAILED_ATTEMPTS = 5
const PASSWORD_LOCK_MINUTES = 15

const ALLOWED_ELIGIBILITY = ['STUDENT_VERIFIED', 'ALUMNI_VERIFIED'] as const

type OtpPurpose = 'REGISTER_WISC' | 'LINK_RECOVERY' | 'RESET_PASSWORD'
type Tx = Prisma.TransactionClient

function getRequestFingerprint(ip: string | undefined, userAgent: string | undefined) {
  const ipHash = ip ? hashOtp({ purpose: 'ip', emailNormalized: ip, code: 'fingerprint' }) : null
  const userAgentHash = userAgent
    ? hashOtp({ purpose: 'ua', emailNormalized: userAgent, code: 'fingerprint' })
    : null
  return { ipHash, userAgentHash }
}

async function assertSendAllowed(prisma: Tx, emailNormalized: string, purpose: OtpPurpose) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
  const latest = await prisma.emailOtpChallenge.findFirst({
    where: { emailNormalized, purpose },
    orderBy: { createdAt: 'desc' },
    select: { lastSentAt: true },
  })

  if (latest) {
    const seconds = (Date.now() - latest.lastSentAt.getTime()) / 1000
    if (seconds < OTP_SEND_COOLDOWN_SECONDS) {
      throw new TRPCError({
        code: 'TOO_MANY_REQUESTS',
        message: 'Please wait before requesting another code.',
      })
    }
  }

  const count = await prisma.emailOtpChallenge.count({
    where: {
      emailNormalized,
      purpose,
      createdAt: { gte: oneHourAgo },
    },
  })

  if (count >= OTP_MAX_PER_HOUR) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many verification attempts. Try again later.',
    })
  }
}

async function createOtpChallenge({
  prisma,
  emailNormalized,
  purpose,
  ip,
  userAgent,
}: {
  prisma: Tx
  emailNormalized: string
  purpose: OtpPurpose
  ip?: string
  userAgent?: string
}) {
  await assertSendAllowed(prisma, emailNormalized, purpose)

  const code = generateOtpCode()
  const codeHash = hashOtp({ purpose, emailNormalized, code })
  const expiresAt = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000)
  const { ipHash, userAgentHash } = getRequestFingerprint(ip, userAgent)

  await prisma.emailOtpChallenge.create({
    data: {
      emailNormalized,
      purpose,
      codeHash,
      expiresAt,
      attemptsLeft: 5,
      ipHash,
      userAgentHash,
    },
  })

  return { code, expiresAt }
}

async function verifyOtpCode({
  prisma,
  emailNormalized,
  purpose,
  code,
}: {
  prisma: Tx
  emailNormalized: string
  purpose: OtpPurpose
  code: string
}) {
  const challenge = await prisma.emailOtpChallenge.findFirst({
    where: {
      emailNormalized,
      purpose,
      consumedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  })

  if (!challenge) {
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid or expired verification code.' })
  }

  if (challenge.attemptsLeft <= 0) {
    throw new TRPCError({
      code: 'TOO_MANY_REQUESTS',
      message: 'Verification attempts exceeded. Request a new code.',
    })
  }

  const expectedHash = hashOtp({ purpose, emailNormalized, code })
  if (challenge.codeHash !== expectedHash) {
    const attemptsLeft = challenge.attemptsLeft - 1
    await prisma.emailOtpChallenge.update({
      where: { id: challenge.id },
      data: {
        attemptsLeft,
        ...(attemptsLeft <= 0 ? { consumedAt: new Date() } : {}),
      },
    })
    throw new TRPCError({ code: 'BAD_REQUEST', message: 'Invalid or expired verification code.' })
  }

  await prisma.emailOtpChallenge.update({
    where: { id: challenge.id },
    data: { consumedAt: new Date() },
  })
}

async function resolveUserByIdentifier(prisma: Tx, identifierRaw: string) {
  const identifier = identifierRaw.trim()
  if (!identifier) return null

  if (identifier.includes('@')) {
    const emailNormalized = normalizeEmail(identifier)
    const emailIdentity = await prisma.userEmail.findUnique({
      where: { emailNormalized },
      include: {
        user: {
          include: {
            credential: true,
          },
        },
      },
    })

    if (!emailIdentity || !emailIdentity.isVerified || !emailIdentity.canLogin) return null
    return { user: emailIdentity.user, loginEmail: emailIdentity.email }
  }

  const handleNormalized = normalizeHandle(identifier)
  const user = await prisma.user.findUnique({
    where: { loginHandleNormalized: handleNormalized },
    include: { credential: true },
  })

  if (!user) return null
  return { user, loginEmail: user.email }
}

async function findLoginEmailForUser(prisma: Tx, userId: string) {
  const recoveryEmail = await prisma.userEmail.findFirst({
    where: {
      userId,
      type: 'RECOVERY',
      isVerified: true,
      canLogin: true,
    },
  })
  if (recoveryEmail) return recoveryEmail

  return prisma.userEmail.findFirst({
    where: {
      userId,
      isVerified: true,
      canLogin: true,
    },
    orderBy: { type: 'asc' },
  })
}

export const authRouter = router({
  requestWiscSignupOtp: publicProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const emailNormalized = normalizeEmail(input.email)
      if (!isWiscEmail(emailNormalized)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only @wisc.edu emails can be verified for signup.',
        })
      }

      const { code } = await createOtpChallenge({
        prisma: ctx.prisma,
        emailNormalized,
        purpose: 'REGISTER_WISC',
        ip: ctx.requestMeta?.ip,
        userAgent: ctx.requestMeta?.userAgent,
      })

      await sendAuthMail({
        to: emailNormalized,
        subject: '[MadSpace] Verification Code',
        text: `Your verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
      })

      return {
        success: true,
        ...(process.env.NODE_ENV === 'development' ? { devCode: code } : {}),
      }
    }),

  completeWiscSignup: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        code: z.string().length(6),
        password: z.string().min(8).max(128),
        loginHandle: z.string().min(3).max(32).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const emailNormalized = normalizeEmail(input.email)
      if (!isWiscEmail(emailNormalized)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Only @wisc.edu emails can be used for registration.',
        })
      }

      await verifyOtpCode({
        prisma: ctx.prisma,
        emailNormalized,
        purpose: 'REGISTER_WISC',
        code: input.code,
      })

      const passwordHash = await hashPassword(input.password)

      const result = await ctx.prisma.$transaction(async (tx) => {
        const existingIdentity = await tx.userEmail.findUnique({
          where: { emailNormalized },
          include: { user: true },
        })

        const user = existingIdentity?.user
          ? await tx.user.update({
              where: { id: existingIdentity.user.id },
              data: {
                email: emailNormalized,
                emailVerified: existingIdentity.user.emailVerified || new Date(),
                eligibilityStatus: 'STUDENT_VERIFIED',
                firstVerifiedAt: existingIdentity.user.firstVerifiedAt || new Date(),
                lastWiscVerifiedAt: new Date(),
                requiresRecoverySetup: true,
              },
            })
          : await tx.user.create({
              data: {
                email: emailNormalized,
                emailVerified: new Date(),
                eligibilityStatus: 'STUDENT_VERIFIED',
                firstVerifiedAt: new Date(),
                lastWiscVerifiedAt: new Date(),
                requiresRecoverySetup: true,
              },
            })

        const desiredHandleRaw = input.loginHandle?.trim() || suggestHandleFromEmail(emailNormalized)
        if (!isValidHandle(desiredHandleRaw)) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Login handle can only use letters, numbers, ., _, - and must be 3-32 chars.',
          })
        }

        const handleNormalized = normalizeHandle(desiredHandleRaw)
        const holder = await tx.user.findUnique({
          where: { loginHandleNormalized: handleNormalized },
          select: { id: true },
        })
        const resolvedHandle =
          !holder || holder.id === user.id
            ? handleNormalized
            : await resolveUniqueHandle(tx, handleNormalized)

        await tx.user.update({
          where: { id: user.id },
          data: {
            loginHandle: resolvedHandle,
            loginHandleNormalized: resolvedHandle,
          },
        })

        await tx.userEmail.upsert({
          where: { emailNormalized },
          update: {
            email: emailNormalized,
            type: 'UNIVERSITY',
            isVerified: true,
            verifiedAt: new Date(),
            canLogin: true,
            userId: user.id,
          },
          create: {
            userId: user.id,
            email: emailNormalized,
            emailNormalized,
            type: 'UNIVERSITY',
            isVerified: true,
            verifiedAt: new Date(),
            canLogin: true,
          },
        })

        await tx.userCredential.upsert({
          where: { userId: user.id },
          update: {
            passwordHash,
            passwordUpdatedAt: new Date(),
            failedAttempts: 0,
            lockedUntil: null,
          },
          create: {
            userId: user.id,
            passwordHash,
            passwordUpdatedAt: new Date(),
          },
        })

        return {
          userId: user.id,
          loginHandle: resolvedHandle,
          email: emailNormalized,
        }
      })

      return { success: true, ...result }
    }),

  requestRecoveryEmailOtp: protectedProcedure
    .input(z.object({ email: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const emailNormalized = normalizeEmail(input.email)

      if (isWiscEmail(emailNormalized)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Recovery email must be non-@wisc.edu.' })
      }

      const existing = await ctx.prisma.userEmail.findUnique({ where: { emailNormalized } })
      if (existing && existing.userId !== userId) {
        throw new TRPCError({ code: 'CONFLICT', message: 'This email is already linked to another account.' })
      }

      const { code } = await createOtpChallenge({
        prisma: ctx.prisma,
        emailNormalized,
        purpose: 'LINK_RECOVERY',
        ip: ctx.requestMeta?.ip,
        userAgent: ctx.requestMeta?.userAgent,
      })

      await sendAuthMail({
        to: emailNormalized,
        subject: '[MadSpace] Recovery Email Verification Code',
        text: `Your recovery email verification code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
      })

      return {
        success: true,
        ...(process.env.NODE_ENV === 'development' ? { devCode: code } : {}),
      }
    }),

  verifyRecoveryEmailOtp: protectedProcedure
    .input(z.object({ email: z.string().email(), code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const emailNormalized = normalizeEmail(input.email)

      if (isWiscEmail(emailNormalized)) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Recovery email must be non-@wisc.edu.' })
      }

      await verifyOtpCode({
        prisma: ctx.prisma,
        emailNormalized,
        purpose: 'LINK_RECOVERY',
        code: input.code,
      })

      const existing = await ctx.prisma.userEmail.findUnique({ where: { emailNormalized } })
      if (existing && existing.userId !== userId) {
        throw new TRPCError({ code: 'CONFLICT', message: 'This email is already linked to another account.' })
      }

      await ctx.prisma.$transaction(async (tx) => {
        await tx.userEmail.upsert({
          where: { emailNormalized },
          update: {
            userId,
            email: emailNormalized,
            type: 'RECOVERY',
            isVerified: true,
            verifiedAt: new Date(),
            canLogin: true,
          },
          create: {
            userId,
            email: emailNormalized,
            emailNormalized,
            type: 'RECOVERY',
            isVerified: true,
            verifiedAt: new Date(),
            canLogin: true,
          },
        })

        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { eligibilityStatus: true },
        })

        await tx.user.update({
          where: { id: userId },
          data: {
            requiresRecoverySetup: false,
            eligibilityStatus:
              user?.eligibilityStatus === 'UNVERIFIED' ? 'ALUMNI_VERIFIED' : user?.eligibilityStatus,
          },
        })
      })

      return { success: true }
    }),

  requestPasswordResetOtp: publicProcedure
    .input(z.object({ identifier: z.string().min(3).max(320) }))
    .mutation(async ({ ctx, input }) => {
      const record = await resolveUserByIdentifier(ctx.prisma, input.identifier)
      if (!record?.user?.id) {
        return { success: true }
      }

      if (!ALLOWED_ELIGIBILITY.includes(record.user.eligibilityStatus as (typeof ALLOWED_ELIGIBILITY)[number])) {
        return { success: true }
      }

      const loginEmail = await findLoginEmailForUser(ctx.prisma, record.user.id)
      if (!loginEmail) {
        return { success: true }
      }

      const { code } = await createOtpChallenge({
        prisma: ctx.prisma,
        emailNormalized: loginEmail.emailNormalized,
        purpose: 'RESET_PASSWORD',
        ip: ctx.requestMeta?.ip,
        userAgent: ctx.requestMeta?.userAgent,
      })

      await sendAuthMail({
        to: loginEmail.email,
        subject: '[MadSpace] Password Reset Code',
        text: `Your password reset code is ${code}. It expires in ${OTP_TTL_MINUTES} minutes.`,
      })

      return {
        success: true,
        ...(process.env.NODE_ENV === 'development' ? { devCode: code, sentTo: loginEmail.email } : {}),
      }
    }),

  resetPasswordWithOtp: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        code: z.string().length(6),
        password: z.string().min(8).max(128),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const emailNormalized = normalizeEmail(input.email)

      await verifyOtpCode({
        prisma: ctx.prisma,
        emailNormalized,
        purpose: 'RESET_PASSWORD',
        code: input.code,
      })

      const userEmail = await ctx.prisma.userEmail.findUnique({
        where: { emailNormalized },
        include: { user: true },
      })

      if (!userEmail || !userEmail.canLogin || !userEmail.isVerified) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Unable to reset password for this email.' })
      }

      const passwordHash = await hashPassword(input.password)
      await ctx.prisma.userCredential.upsert({
        where: { userId: userEmail.userId },
        update: {
          passwordHash,
          passwordUpdatedAt: new Date(),
          failedAttempts: 0,
          lockedUntil: null,
        },
        create: {
          userId: userEmail.userId,
          passwordHash,
          passwordUpdatedAt: new Date(),
        },
      })

      return { success: true }
    }),

  getSecurityProfile: protectedProcedure.query(async ({ ctx }) => {
    const userId = ctx.session.user.id
    const user = await ctx.prisma.user.findUnique({
      where: { id: userId },
      select: {
        loginHandle: true,
        loginHandleNormalized: true,
        requiresRecoverySetup: true,
        eligibilityStatus: true,
        emails: {
          orderBy: [{ type: 'asc' }, { createdAt: 'asc' }],
          select: {
            id: true,
            email: true,
            type: true,
            isVerified: true,
            canLogin: true,
            verifiedAt: true,
          },
        },
        credential: {
          select: {
            passwordUpdatedAt: true,
          },
        },
      },
    })

    if (!user) {
      throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found.' })
    }

    return {
      loginHandle: user.loginHandle,
      loginHandleNormalized: user.loginHandleNormalized,
      requiresRecoverySetup: user.requiresRecoverySetup,
      eligibilityStatus: user.eligibilityStatus,
      emails: user.emails,
      hasPassword: !!user.credential,
      passwordUpdatedAt: user.credential?.passwordUpdatedAt ?? null,
    }
  }),

  updateLoginHandle: protectedProcedure
    .input(z.object({ loginHandle: z.string().min(3).max(32) }))
    .mutation(async ({ ctx, input }) => {
      const normalized = normalizeHandle(input.loginHandle)
      if (!isValidHandle(normalized)) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Login handle can only use letters, numbers, ., _, - and must be 3-32 chars.',
        })
      }

      const userId = ctx.session.user.id
      const holder = await ctx.prisma.user.findUnique({
        where: { loginHandleNormalized: normalized },
        select: { id: true },
      })

      if (holder && holder.id !== userId) {
        throw new TRPCError({ code: 'CONFLICT', message: 'This login handle is already taken.' })
      }

      await ctx.prisma.user.update({
        where: { id: userId },
        data: {
          loginHandle: normalized,
          loginHandleNormalized: normalized,
        },
      })

      return { success: true, loginHandle: normalized }
    }),

  setPassword: protectedProcedure
    .input(
      z.object({
        currentPassword: z.string().min(1).optional(),
        newPassword: z.string().min(8).max(128),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id
      const credential = await ctx.prisma.userCredential.findUnique({
        where: { userId },
      })

      if (credential?.lockedUntil && credential.lockedUntil > new Date()) {
        throw new TRPCError({
          code: 'TOO_MANY_REQUESTS',
          message: 'Account is temporarily locked. Please try again later.',
        })
      }

      if (credential) {
        if (!input.currentPassword) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Current password is required to change password.',
          })
        }

        const verified = await verifyPassword(input.currentPassword, credential.passwordHash)
        if (!verified) {
          const failedAttempts = credential.failedAttempts + 1
          await ctx.prisma.userCredential.update({
            where: { userId },
            data: {
              failedAttempts,
              lockedUntil:
                failedAttempts >= PASSWORD_MAX_FAILED_ATTEMPTS
                  ? new Date(Date.now() + PASSWORD_LOCK_MINUTES * 60 * 1000)
                  : null,
            },
          })
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Current password is incorrect.' })
        }
      }

      const passwordHash = await hashPassword(input.newPassword)
      await ctx.prisma.userCredential.upsert({
        where: { userId },
        update: {
          passwordHash,
          passwordUpdatedAt: new Date(),
          failedAttempts: 0,
          lockedUntil: null,
        },
        create: {
          userId,
          passwordHash,
          passwordUpdatedAt: new Date(),
        },
      })

      return { success: true }
    }),
})
