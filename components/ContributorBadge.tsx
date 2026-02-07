'use client'

import { type ContributorInfo } from '@/lib/contributorLevel'

interface ContributorBadgeProps {
  contributor: ContributorInfo
  /** Show just badge+title inline, or expanded with progress */
  variant?: 'inline' | 'expanded'
}

/**
 * Displays a contributor's level badge and title.
 * Used on review cards and user profiles.
 */
export function ContributorBadge({ contributor, variant = 'inline' }: ContributorBadgeProps) {
  if (contributor.level === 0) return null // Readers don't get a badge

  if (variant === 'inline') {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full ${contributor.color}`}
        title={`${contributor.title} — ${contributor.description || ''}`}
      >
        {contributor.badge && <span>{contributor.badge}</span>}
        {contributor.title}
      </span>
    )
  }

  // Expanded variant (for profile page)
  return (
    <div className={`inline-flex flex-col items-start gap-1 px-3 py-2 rounded-lg border ${contributor.color}`}>
      <div className="flex items-center gap-1.5">
        {contributor.badge && <span className="text-lg">{contributor.badge}</span>}
        <span className="font-semibold text-sm">{contributor.title}</span>
        <span className="text-xs opacity-70">Lv.{contributor.level}</span>
      </div>
      {contributor.nextLevel && (
        <div className="text-[11px] opacity-70">
          Next: {contributor.nextLevel.title}
          {contributor.nextLevel.reviewsNeeded > 0 && ` · ${contributor.nextLevel.reviewsNeeded} more review${contributor.nextLevel.reviewsNeeded !== 1 ? 's' : ''}`}
          {contributor.nextLevel.upvotesNeeded > 0 && ` · ${contributor.nextLevel.upvotesNeeded} more upvote${contributor.nextLevel.upvotesNeeded !== 1 ? 's' : ''}`}
        </div>
      )}
    </div>
  )
}
