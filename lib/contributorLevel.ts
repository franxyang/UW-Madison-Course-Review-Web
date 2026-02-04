/**
 * Contributor Level System
 * 
 * Levels are computed from review count and upvotes received.
 * XP is tracked for future gamification features.
 */

export interface ContributorInfo {
  level: number
  title: string
  badge: string
  color: string       // Tailwind classes for badge styling
  nextLevel: {
    title: string
    reviewsNeeded: number
    upvotesNeeded: number
  } | null
}

interface LevelDef {
  level: number
  title: string
  badge: string
  color: string
  minReviews: number
  minUpvotes: number
}

const LEVELS: LevelDef[] = [
  { level: 0, title: 'Reader',           badge: '',   color: 'bg-slate-100 text-slate-600',     minReviews: 0,  minUpvotes: 0   },
  { level: 1, title: 'Contributor',      badge: '🟢', color: 'bg-green-100 text-green-700',     minReviews: 1,  minUpvotes: 0   },
  { level: 2, title: 'Active Reviewer',  badge: '🔵', color: 'bg-blue-100 text-blue-700',       minReviews: 5,  minUpvotes: 0   },
  { level: 3, title: 'Trusted Reviewer', badge: '🟣', color: 'bg-purple-100 text-purple-700',   minReviews: 15, minUpvotes: 10  },
  { level: 4, title: 'Expert Reviewer',  badge: '🟡', color: 'bg-yellow-100 text-yellow-700',   minReviews: 30, minUpvotes: 50  },
  { level: 5, title: 'WiscFlow Legend',  badge: '🔴', color: 'bg-red-100 text-red-700',         minReviews: 50, minUpvotes: 100 },
]

/**
 * Compute a user's contributor level from their stats.
 */
export function computeContributorLevel(reviewCount: number, upvotesReceived: number): ContributorInfo {
  let currentLevel = LEVELS[0]

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (reviewCount >= LEVELS[i].minReviews && upvotesReceived >= LEVELS[i].minUpvotes) {
      currentLevel = LEVELS[i]
      break
    }
  }

  // Find next level
  const nextLevelDef = LEVELS[currentLevel.level + 1] || null
  const nextLevel = nextLevelDef
    ? {
        title: nextLevelDef.title,
        reviewsNeeded: Math.max(0, nextLevelDef.minReviews - reviewCount),
        upvotesNeeded: Math.max(0, nextLevelDef.minUpvotes - upvotesReceived),
      }
    : null

  return {
    level: currentLevel.level,
    title: currentLevel.title,
    badge: currentLevel.badge,
    color: currentLevel.color,
    nextLevel,
  }
}

/**
 * XP rewards for various actions.
 */
export const XP_REWARDS = {
  WRITE_REVIEW: 50,
  RECEIVE_UPVOTE: 10,
  WRITE_COMMENT: 5,
  FIRST_REVIEW_ON_COURSE: 100, // bonus for reviewing a course with 0 reviews
  ENROLLMENT_SEASON_BONUS: 25, // additional XP during enrollment season
} as const

/**
 * Check if we're in enrollment season (November or April).
 */
export function isEnrollmentSeason(): boolean {
  const month = new Date().getMonth() // 0-indexed
  return month === 10 || month === 3 // November or April
}

/**
 * Calculate XP for writing a review.
 */
export function calculateReviewXP(isFirstReviewOnCourse: boolean): number {
  let xp = XP_REWARDS.WRITE_REVIEW
  if (isFirstReviewOnCourse) xp += XP_REWARDS.FIRST_REVIEW_ON_COURSE
  if (isEnrollmentSeason()) xp += XP_REWARDS.ENROLLMENT_SEASON_BONUS
  return xp
}

/**
 * Get all level definitions (for display).
 */
export function getAllLevels(): LevelDef[] {
  return LEVELS
}
