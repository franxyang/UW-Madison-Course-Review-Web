import type { Prisma, PrismaClient } from '@prisma/client'

export const APP_SETTING_KEYS = {
  requireSignInToViewReviews: 'requireSignInToViewReviews',
  requireContributionToViewFullReviews: 'requireContributionToViewFullReviews',
  fallbackReviewTitle: 'fallbackReviewTitle',
} as const

export type ReviewRestrictionReason = 'none' | 'signin' | 'contribution' | 'signin+contribution'

export type AppSettings = {
  requireSignInToViewReviews: boolean
  requireContributionToViewFullReviews: boolean
  fallbackReviewTitle: string
}

export const DEFAULT_APP_SETTINGS: AppSettings = {
  requireSignInToViewReviews: true,
  requireContributionToViewFullReviews: true,
  fallbackReviewTitle: 'No Title, Still Helpful',
}

type PrismaLike = PrismaClient | Prisma.TransactionClient

function parseBooleanSetting(value: string | null | undefined, fallback: boolean): boolean {
  if (typeof value !== 'string') return fallback
  const normalized = value.trim().toLowerCase()
  if (['true', '1', 'yes', 'on'].includes(normalized)) return true
  if (['false', '0', 'no', 'off'].includes(normalized)) return false
  return fallback
}

export async function getAppSettings(prisma: PrismaLike): Promise<AppSettings> {
  try {
    const rows = await prisma.appSetting.findMany({
      where: {
        key: {
          in: Object.values(APP_SETTING_KEYS),
        },
      },
      select: {
        key: true,
        value: true,
      },
    })

    const valueMap = new Map(rows.map((row) => [row.key, row.value]))
    const fallbackTitleRaw = valueMap.get(APP_SETTING_KEYS.fallbackReviewTitle)
    const fallbackTitle = fallbackTitleRaw?.trim() || DEFAULT_APP_SETTINGS.fallbackReviewTitle

    return {
      requireSignInToViewReviews: parseBooleanSetting(
        valueMap.get(APP_SETTING_KEYS.requireSignInToViewReviews),
        DEFAULT_APP_SETTINGS.requireSignInToViewReviews
      ),
      requireContributionToViewFullReviews: parseBooleanSetting(
        valueMap.get(APP_SETTING_KEYS.requireContributionToViewFullReviews),
        DEFAULT_APP_SETTINGS.requireContributionToViewFullReviews
      ),
      fallbackReviewTitle: fallbackTitle,
    }
  } catch (error) {
    // Safe fallback while rolling out migrations.
    console.warn('[appSettings] falling back to defaults', error)
    return DEFAULT_APP_SETTINGS
  }
}

