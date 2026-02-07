/**
 * Contributor Level System
 * 
 * Levels are computed from review count and upvotes received.
 * Higher levels weight upvotes more heavily (quality > quantity).
 * Designed for realistic undergrad usage (~32-40 courses over 4 years).
 * 
 * Progression: 🐾 → 🐣 → 🐥 → 🦡 → 👑 → 🏆
 */

export interface ContributorInfo {
  level: number
  title: string
  badge: string
  color: string       // Tailwind classes for badge styling
  description: string // Tooltip text explaining the level
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
  description: string
  minReviews: number
  minUpvotes: number
}

const LEVELS: LevelDef[] = [
  { level: 0, title: 'New Badger',       badge: '🐾', color: 'bg-slate-100 text-slate-600',     description: 'Just joined — welcome to WiscFlow!',                    minReviews: 0,  minUpvotes: 0   },
  { level: 1, title: 'Contributor',      badge: '🐣', color: 'bg-amber-50 text-amber-700',      description: 'Wrote your first review!',                              minReviews: 1,  minUpvotes: 0   },
  { level: 2, title: 'Active Reviewer',  badge: '🐥', color: 'bg-yellow-50 text-yellow-700',    description: 'Consistently sharing course experiences',               minReviews: 3,  minUpvotes: 0   },
  { level: 3, title: 'Trusted Voice',    badge: '🦡', color: 'bg-orange-50 text-orange-700',    description: 'A respected member of the WiscFlow community',          minReviews: 5,  minUpvotes: 10  },
  { level: 4, title: 'Expert',           badge: '👑', color: 'bg-purple-50 text-purple-700',    description: 'Your reviews are highly valued by fellow Badgers',      minReviews: 8,  minUpvotes: 30  },
  { level: 5, title: 'WiscFlow Legend',  badge: '🏆', color: 'bg-red-50 text-red-700',          description: 'The highest honor — a pillar of the WiscFlow community', minReviews: 12, minUpvotes: 60  },
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
    description: currentLevel.description,
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
