import { z } from 'zod'
import { router, adminProcedure, superAdminProcedure } from '../trpc/trpc'
import { TRPCError } from '@trpc/server'
import { APP_SETTING_KEYS, getAppSettings } from '@/lib/appSettings'

// Helper to write audit log
async function writeAuditLog(
  prisma: any,
  actorId: string,
  action: string,
  targetType: string,
  targetId: string,
  details?: Record<string, any>
) {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      targetType,
      targetId,
      details: details || undefined,
    },
  })
}

export const adminRouter = router({
  // ============================================================
  // DASHBOARD
  // ============================================================

  dashboardStats: adminProcedure.query(async ({ ctx }) => {
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    const [
      totalUsers,
      totalReviews,
      pendingReports,
      todayUsers,
      todayReviews,
      todayReports,
    ] = await Promise.all([
      ctx.prisma.user.count(),
      ctx.prisma.review.count(),
      ctx.prisma.report.count({ where: { status: 'pending' } }),
      ctx.prisma.user.count({ where: { createdAt: { gte: todayStart } } }),
      ctx.prisma.review.count({ where: { createdAt: { gte: todayStart } } }),
      ctx.prisma.report.count({ where: { createdAt: { gte: todayStart } } }),
    ])

    return {
      totalUsers,
      totalReviews,
      pendingReports,
      todayUsers,
      todayReviews,
      todayReports,
    }
  }),

  // 7-day trend data for dashboard
  weeklyTrend: adminProcedure.query(async ({ ctx }) => {
    const now = new Date()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get raw data for the past 7 days
    const [users, reviews, reports] = await Promise.all([
      ctx.prisma.user.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
      ctx.prisma.review.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
      ctx.prisma.report.findMany({
        where: { createdAt: { gte: sevenDaysAgo } },
        select: { createdAt: true },
      }),
    ])

    // Group by day
    const days: { date: string; users: number; reviews: number; reports: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dateStr = d.toISOString().slice(0, 10)
      days.push({
        date: dateStr,
        users: users.filter(u => u.createdAt.toISOString().slice(0, 10) === dateStr).length,
        reviews: reviews.filter(r => r.createdAt.toISOString().slice(0, 10) === dateStr).length,
        reports: reports.filter(r => r.createdAt.toISOString().slice(0, 10) === dateStr).length,
      })
    }

    return days
  }),

  getAccessSettings: adminProcedure.query(async ({ ctx }) => {
    return getAppSettings(ctx.prisma)
  }),

  updateAccessSettings: adminProcedure
    .input(
      z.object({
        requireSignInToViewReviews: z.boolean(),
        requireContributionToViewFullReviews: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actorId = ctx.session.user.id!

      try {
        await ctx.prisma.$transaction([
          ctx.prisma.appSetting.upsert({
            where: { key: APP_SETTING_KEYS.requireSignInToViewReviews },
            update: { value: String(input.requireSignInToViewReviews) },
            create: {
              key: APP_SETTING_KEYS.requireSignInToViewReviews,
              value: String(input.requireSignInToViewReviews),
            },
          }),
          ctx.prisma.appSetting.upsert({
            where: { key: APP_SETTING_KEYS.requireContributionToViewFullReviews },
            update: { value: String(input.requireContributionToViewFullReviews) },
            create: {
              key: APP_SETTING_KEYS.requireContributionToViewFullReviews,
              value: String(input.requireContributionToViewFullReviews),
            },
          }),
        ])
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Unable to save access settings. Ensure latest migrations are deployed.',
          cause: error,
        })
      }

      await writeAuditLog(ctx.prisma, actorId, 'UPDATE_ACCESS_SETTINGS', 'AppSetting', 'reviewAccess', {
        requireSignInToViewReviews: input.requireSignInToViewReviews,
        requireContributionToViewFullReviews: input.requireContributionToViewFullReviews,
      })

      return getAppSettings(ctx.prisma)
    }),

  // ============================================================
  // SITE UPDATES (ADMIN ONLY)
  // ============================================================

  listSiteUpdates: superAdminProcedure
    .input(
      z.object({
        status: z.enum(['all', 'DRAFT', 'PUBLISHED', 'ARCHIVED']).default('all'),
        search: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      const where: any = {}
      if (input.status !== 'all') {
        where.status = input.status
      }
      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: 'insensitive' } },
          { summary: { contains: input.search, mode: 'insensitive' } },
          { content: { contains: input.search, mode: 'insensitive' } },
          { versionTag: { contains: input.search, mode: 'insensitive' } },
        ]
      }

      const [items, total] = await Promise.all([
        ctx.prisma.siteUpdate.findMany({
          where,
          include: {
            author: { select: { id: true, nickname: true, name: true, email: true } },
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
        pages: Math.ceil(total / input.limit),
        page: input.page,
      }
    }),

  createSiteUpdate: superAdminProcedure
    .input(
      z.object({
        title: z.string().min(1).max(120),
        summary: z.string().max(300).optional(),
        content: z.string().min(1).max(20000),
        versionTag: z.string().max(30).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const actorId = ctx.session.user.id!

      const created = await ctx.prisma.siteUpdate.create({
        data: {
          title: input.title.trim(),
          summary: input.summary?.trim() || null,
          content: input.content.trim(),
          versionTag: input.versionTag?.trim() || null,
          status: 'DRAFT',
          authorId: actorId,
        },
      })

      await writeAuditLog(ctx.prisma, actorId, 'CREATE_SITE_UPDATE', 'SiteUpdate', created.id, {
        title: created.title,
        status: created.status,
      })

      return created
    }),

  updateSiteUpdate: superAdminProcedure
    .input(
      z
        .object({
          id: z.string(),
          title: z.string().min(1).max(120).optional(),
          summary: z.string().max(300).optional(),
          content: z.string().min(1).max(20000).optional(),
          versionTag: z.string().max(30).optional(),
        })
        .refine(
          (value) =>
            value.title !== undefined ||
            value.summary !== undefined ||
            value.content !== undefined ||
            value.versionTag !== undefined,
          { message: 'At least one field must be updated' },
        ),
    )
    .mutation(async ({ ctx, input }) => {
      const actorId = ctx.session.user.id!
      const existing = await ctx.prisma.siteUpdate.findUnique({
        where: { id: input.id },
        select: { id: true },
      })

      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Site update not found' })
      }

      const data: any = {}
      if (input.title !== undefined) data.title = input.title.trim()
      if (input.summary !== undefined) data.summary = input.summary.trim() || null
      if (input.content !== undefined) data.content = input.content.trim()
      if (input.versionTag !== undefined) data.versionTag = input.versionTag.trim() || null

      const updated = await ctx.prisma.siteUpdate.update({
        where: { id: input.id },
        data,
      })

      await writeAuditLog(ctx.prisma, actorId, 'UPDATE_SITE_UPDATE', 'SiteUpdate', updated.id, {
        changedFields: Object.keys(data),
      })

      return updated
    }),

  publishSiteUpdate: superAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const actorId = ctx.session.user.id!

      const existing = await ctx.prisma.siteUpdate.findUnique({
        where: { id: input.id },
        select: { id: true, status: true },
      })
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Site update not found' })
      }

      const published = await ctx.prisma.siteUpdate.update({
        where: { id: input.id },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
      })

      await writeAuditLog(ctx.prisma, actorId, 'PUBLISH_SITE_UPDATE', 'SiteUpdate', published.id, {
        fromStatus: existing.status,
        toStatus: published.status,
      })

      return published
    }),

  archiveSiteUpdate: superAdminProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const actorId = ctx.session.user.id!

      const existing = await ctx.prisma.siteUpdate.findUnique({
        where: { id: input.id },
        select: { id: true, status: true },
      })
      if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Site update not found' })
      }

      const archived = await ctx.prisma.siteUpdate.update({
        where: { id: input.id },
        data: { status: 'ARCHIVED' },
      })

      await writeAuditLog(ctx.prisma, actorId, 'ARCHIVE_SITE_UPDATE', 'SiteUpdate', archived.id, {
        fromStatus: existing.status,
        toStatus: archived.status,
      })

      return archived
    }),

  // ============================================================
  // REPORTS
  // ============================================================

  listReports: adminProcedure
    .input(
      z.object({
        status: z.enum(['pending', 'resolved', 'all']).default('pending'),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {}
      if (input.status === 'pending') where.status = 'pending'
      else if (input.status === 'resolved') where.status = { not: 'pending' }

      const [reports, total] = await Promise.all([
        ctx.prisma.report.findMany({
          where,
          include: {
            reporter: { select: { id: true, nickname: true, name: true, email: true } },
            review: {
              include: {
                author: { select: { id: true, nickname: true, name: true, email: true } },
                course: { select: { id: true, code: true, name: true } },
                instructor: { select: { id: true, name: true } },
              },
            },
            resolvedBy: { select: { id: true, nickname: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.prisma.report.count({ where }),
      ])

      return {
        reports,
        total,
        pages: Math.ceil(total / input.limit),
        page: input.page,
      }
    }),

  resolveReport: adminProcedure
    .input(
      z.object({
        reportId: z.string(),
        resolution: z.enum(['approved', 'rejected', 'escalated']),
        deleteReview: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actorId = ctx.session.user.id!

      const report = await ctx.prisma.report.findUnique({
        where: { id: input.reportId },
        include: { review: true },
      })

      if (!report) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Report not found' })
      }

      if (report.status !== 'pending') {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'Report already resolved' })
      }

      // Update report
      await ctx.prisma.report.update({
        where: { id: input.reportId },
        data: {
          status: input.resolution,
          resolution: input.resolution,
          resolvedById: actorId,
          resolvedAt: new Date(),
        },
      })

      // If approved + deleteReview, cascade delete the review
      if (input.resolution === 'approved' && input.deleteReview && report.review) {
        await ctx.prisma.$transaction([
          ctx.prisma.vote.deleteMany({ where: { reviewId: report.reviewId } }),
          ctx.prisma.comment.deleteMany({ where: { reviewId: report.reviewId } }),
          ctx.prisma.report.deleteMany({ where: { reviewId: report.reviewId } }),
          ctx.prisma.review.delete({ where: { id: report.reviewId } }),
        ])
      }

      // Audit log
      await writeAuditLog(ctx.prisma, actorId, 'RESOLVE_REPORT', 'Report', input.reportId, {
        resolution: input.resolution,
        deleteReview: input.deleteReview,
        reviewId: report.reviewId,
      })

      return { success: true }
    }),

  batchResolveReports: adminProcedure
    .input(
      z.object({
        reportIds: z.array(z.string()).min(1),
        resolution: z.enum(['approved', 'rejected', 'escalated']),
        deleteReviews: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actorId = ctx.session.user.id!

      const reports = await ctx.prisma.report.findMany({
        where: { id: { in: input.reportIds }, status: 'pending' },
        include: { review: true },
      })

      // Resolve all reports
      await ctx.prisma.report.updateMany({
        where: { id: { in: reports.map(r => r.id) } },
        data: {
          status: input.resolution,
          resolution: input.resolution,
          resolvedById: actorId,
          resolvedAt: new Date(),
        },
      })

      // If approved + delete, cascade delete unique reviews
      if (input.resolution === 'approved' && input.deleteReviews) {
        const reviewIds = [...new Set(reports.map(r => r.reviewId))]
        for (const reviewId of reviewIds) {
          await ctx.prisma.$transaction([
            ctx.prisma.vote.deleteMany({ where: { reviewId } }),
            ctx.prisma.comment.deleteMany({ where: { reviewId } }),
            ctx.prisma.report.deleteMany({ where: { reviewId } }),
            ctx.prisma.review.delete({ where: { id: reviewId } }),
          ])
        }
      }

      // Audit log
      await writeAuditLog(ctx.prisma, actorId, 'BATCH_RESOLVE_REPORTS', 'Report', 'batch', {
        reportIds: input.reportIds,
        resolution: input.resolution,
        deleteReviews: input.deleteReviews,
        count: reports.length,
      })

      return { success: true, resolved: reports.length }
    }),

  // ============================================================
  // REVIEWS (Admin Management)
  // ============================================================

  listReviews: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        courseId: z.string().optional(),
        authorId: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        sortBy: z.enum(['createdAt', 'reports']).default('createdAt'),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {}

      if (input.courseId) where.courseId = input.courseId
      if (input.authorId) where.authorId = input.authorId
      if (input.search) {
        where.OR = [
          { title: { contains: input.search, mode: 'insensitive' } },
          { contentComment: { contains: input.search, mode: 'insensitive' } },
          { teachingComment: { contains: input.search, mode: 'insensitive' } },
          { gradingComment: { contains: input.search, mode: 'insensitive' } },
          { workloadComment: { contains: input.search, mode: 'insensitive' } },
          { course: { code: { contains: input.search, mode: 'insensitive' } } },
          { course: { name: { contains: input.search, mode: 'insensitive' } } },
          { author: { nickname: { contains: input.search, mode: 'insensitive' } } },
          { author: { email: { contains: input.search, mode: 'insensitive' } } },
        ]
      }

      const orderBy: any = input.sortBy === 'reports'
        ? { reports: { _count: 'desc' } }
        : { createdAt: 'desc' }

      const [reviews, total] = await Promise.all([
        ctx.prisma.review.findMany({
          where,
          include: {
            author: { select: { id: true, nickname: true, name: true, email: true } },
            course: { select: { id: true, code: true, name: true } },
            instructor: { select: { id: true, name: true } },
            _count: { select: { reports: true, votes: true, comments: true } },
          },
          orderBy,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.prisma.review.count({ where }),
      ])

      return {
        reviews,
        total,
        pages: Math.ceil(total / input.limit),
        page: input.page,
      }
    }),

  deleteReview: adminProcedure
    .input(z.object({ reviewId: z.string(), reason: z.string().optional() }))
    .mutation(async ({ ctx, input }) => {
      const actorId = ctx.session.user.id!

      const review = await ctx.prisma.review.findUnique({
        where: { id: input.reviewId },
        include: {
          author: { select: { id: true, email: true, nickname: true } },
          course: { select: { code: true, name: true } },
        },
      })

      if (!review) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Review not found' })
      }

      await ctx.prisma.$transaction([
        ctx.prisma.vote.deleteMany({ where: { reviewId: input.reviewId } }),
        ctx.prisma.comment.deleteMany({ where: { reviewId: input.reviewId } }),
        ctx.prisma.report.deleteMany({ where: { reviewId: input.reviewId } }),
        ctx.prisma.review.delete({ where: { id: input.reviewId } }),
      ])

      await writeAuditLog(ctx.prisma, actorId, 'DELETE_REVIEW', 'Review', input.reviewId, {
        reason: input.reason,
        authorId: review.authorId,
        courseCode: review.course.code,
        title: review.title,
      })

      return { success: true }
    }),

  editReview: adminProcedure
    .input(
      z.object({
        reviewId: z.string(),
        title: z.string().max(200).optional(),
        contentComment: z.string().max(3000).optional(),
        teachingComment: z.string().max(3000).optional(),
        gradingComment: z.string().max(3000).optional(),
        workloadComment: z.string().max(3000).optional(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actorId = ctx.session.user.id!

      const review = await ctx.prisma.review.findUnique({
        where: { id: input.reviewId },
      })

      if (!review) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Review not found' })
      }

      const data: any = {}
      if (input.title !== undefined) data.title = input.title || null
      if (input.contentComment !== undefined) data.contentComment = input.contentComment || null
      if (input.teachingComment !== undefined) data.teachingComment = input.teachingComment || null
      if (input.gradingComment !== undefined) data.gradingComment = input.gradingComment || null
      if (input.workloadComment !== undefined) data.workloadComment = input.workloadComment || null

      const updated = await ctx.prisma.review.update({
        where: { id: input.reviewId },
        data,
      })

      await writeAuditLog(ctx.prisma, actorId, 'EDIT_REVIEW', 'Review', input.reviewId, {
        reason: input.reason,
        changedFields: Object.keys(data),
      })

      return updated
    }),

  // ============================================================
  // USERS
  // ============================================================

  listUsers: adminProcedure
    .input(
      z.object({
        search: z.string().optional(),
        role: z.enum(['STUDENT', 'MODERATOR', 'ADMIN', 'all']).default('all'),
        status: z.enum(['active', 'banned', 'all']).default('all'),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(20),
        sortBy: z.enum(['createdAt', 'reviews', 'name']).default('createdAt'),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {}

      if (input.role !== 'all') where.role = input.role
      if (input.status === 'banned') {
        where.bans = { some: { active: true } }
      } else if (input.status === 'active') {
        where.NOT = { bans: { some: { active: true } } }
      }
      if (input.search) {
        where.OR = [
          { nickname: { contains: input.search, mode: 'insensitive' } },
          { name: { contains: input.search, mode: 'insensitive' } },
          { email: { contains: input.search, mode: 'insensitive' } },
        ]
      }

      const orderBy: any = input.sortBy === 'reviews'
        ? { reviews: { _count: 'desc' } }
        : input.sortBy === 'name'
        ? { name: 'asc' }
        : { createdAt: 'desc' }

      const [users, total] = await Promise.all([
        ctx.prisma.user.findMany({
          where,
          select: {
            id: true,
            email: true,
            name: true,
            nickname: true,
            role: true,
            createdAt: true,
            level: true,
            xp: true,
            _count: { select: { reviews: true, comments: true, reports: true } },
            bans: {
              where: { active: true },
              select: { id: true, reason: true, expiresAt: true, createdAt: true },
              take: 1,
            },
          },
          orderBy,
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.prisma.user.count({ where }),
      ])

      return {
        users,
        total,
        pages: Math.ceil(total / input.limit),
        page: input.page,
      }
    }),

  getUserById: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        include: {
          reviews: {
            include: {
              course: { select: { id: true, code: true, name: true } },
              instructor: { select: { id: true, name: true } },
              _count: { select: { votes: true, comments: true, reports: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
          comments: {
            include: {
              review: {
                select: {
                  id: true,
                  title: true,
                  course: { select: { code: true, name: true } },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
          reports: {
            include: {
              review: {
                select: {
                  id: true,
                  title: true,
                  course: { select: { code: true, name: true } },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
          bans: {
            include: {
              bannedBy: { select: { id: true, nickname: true, name: true } },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      })

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
      }

      return user
    }),

  banUser: superAdminProcedure
    .input(
      z.object({
        userId: z.string(),
        reason: z.string().min(1),
        expiresAt: z.string().datetime().optional(), // ISO string
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actorId = ctx.session.user.id!

      // Can't ban yourself
      if (input.userId === actorId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot ban yourself' })
      }

      // Can't ban other admins
      const targetUser = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: { role: true },
      })
      if (targetUser?.role === 'ADMIN') {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Cannot ban an admin' })
      }

      const ban = await ctx.prisma.userBan.create({
        data: {
          userId: input.userId,
          reason: input.reason,
          bannedById: actorId,
          expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        },
      })

      await writeAuditLog(ctx.prisma, actorId, 'BAN_USER', 'User', input.userId, {
        reason: input.reason,
        expiresAt: input.expiresAt,
        banId: ban.id,
      })

      return ban
    }),

  unbanUser: superAdminProcedure
    .input(z.object({ userId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const actorId = ctx.session.user.id!

      await ctx.prisma.userBan.updateMany({
        where: { userId: input.userId, active: true },
        data: { active: false },
      })

      await writeAuditLog(ctx.prisma, actorId, 'UNBAN_USER', 'User', input.userId, {})

      return { success: true }
    }),

  changeRole: superAdminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(['STUDENT', 'MODERATOR', 'ADMIN']),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const actorId = ctx.session.user.id!

      if (input.userId === actorId) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: 'You cannot change your own role' })
      }

      const user = await ctx.prisma.user.findUnique({
        where: { id: input.userId },
        select: { role: true },
      })

      if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' })
      }

      const oldRole = user.role

      const updated = await ctx.prisma.user.update({
        where: { id: input.userId },
        data: { role: input.role },
      })

      await writeAuditLog(ctx.prisma, actorId, 'CHANGE_ROLE', 'User', input.userId, {
        oldRole,
        newRole: input.role,
      })

      return updated
    }),

  // ============================================================
  // AUDIT LOGS
  // ============================================================

  listAuditLogs: adminProcedure
    .input(
      z.object({
        action: z.string().optional(),
        actorId: z.string().optional(),
        page: z.number().min(1).default(1),
        limit: z.number().min(1).max(100).default(30),
      })
    )
    .query(async ({ ctx, input }) => {
      const where: any = {}
      if (input.action) where.action = input.action
      if (input.actorId) where.actorId = input.actorId

      const [logs, total] = await Promise.all([
        ctx.prisma.auditLog.findMany({
          where,
          include: {
            actor: { select: { id: true, nickname: true, name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
          skip: (input.page - 1) * input.limit,
          take: input.limit,
        }),
        ctx.prisma.auditLog.count({ where }),
      ])

      return {
        logs,
        total,
        pages: Math.ceil(total / input.limit),
        page: input.page,
      }
    }),
})
