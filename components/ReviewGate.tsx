'use client'

import { Lock, PenLine, Eye } from 'lucide-react'
import Link from 'next/link'
import type { ReviewRestrictionReason } from '@/lib/appSettings'

interface ReviewGateProps {
  /** Total number of reviews on this course */
  totalReviews: number
  /** Number of currently visible preview reviews */
  previewVisibleCount: number
  /** Number of reviews the user has written (platform-wide) */
  userReviewCount: number
  /** Whether user is logged in */
  isLoggedIn: boolean
  /** Why access is restricted right now */
  restrictionReason: ReviewRestrictionReason
}

/**
 * Overlay CTA shown on top of frosted/blurred reviews.
 * Explains why reviews are locked and how to unlock them.
 */
export function ReviewGateOverlay({
  totalReviews,
  previewVisibleCount,
  userReviewCount,
  isLoggedIn,
  restrictionReason,
}: ReviewGateProps) {
  const hiddenCount = Math.max(0, totalReviews - previewVisibleCount)
  const requiresSignIn = restrictionReason === 'signin' || restrictionReason === 'signin+contribution'
  const requiresContribution = restrictionReason === 'contribution' || restrictionReason === 'signin+contribution'

  const description = requiresSignIn
    ? 'Sign in to continue. Full review details are unlocked after posting one review.'
    : requiresContribution
    ? userReviewCount > 0
      ? 'Your contribution status is syncing. Refresh this page if content remains locked.'
      : 'Share your experience with one course to unlock all review details across the platform.'
    : 'Preview mode is active.'

  return (
    <div className="relative my-4">
      {/* Frosted glass card */}
      <div className="bg-white/80 dark:bg-surface-primary/80 backdrop-blur-sm border-2 border-dashed border-surface-tertiary rounded-xl p-8 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-surface-secondary rounded-full mb-4">
          <Lock size={24} className="text-text-tertiary" />
        </div>

        <h3 className="text-lg font-semibold text-text-primary mb-2">
          {hiddenCount} more review{hiddenCount !== 1 ? 's' : ''} available
        </h3>

        <p className="text-sm text-text-secondary max-w-md mx-auto mb-6">
          {description}
        </p>

        {requiresSignIn && !isLoggedIn ? (
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-uw-red text-white font-medium rounded-lg hover:bg-uw-dark transition-colors shadow-sm"
          >
            Sign In to Unlock
          </Link>
        ) : (
          <a
            href="#review-form"
            className="inline-flex items-center gap-2 px-6 py-3 bg-uw-red text-white font-medium rounded-lg hover:bg-uw-dark transition-colors shadow-sm"
          >
            <PenLine size={18} />
            Write My First Review
          </a>
        )}

        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-tertiary">
          <Eye size={14} />
          <span>
            {requiresContribution
              ? 'One review unlocks access to all reviews on every course'
              : `Preview mode: showing 1 of ${totalReviews} reviews`}
          </span>
        </div>
      </div>
    </div>
  )
}

/**
 * Wraps a review card with a frosted glass blur effect.
 * The review content is rendered but blurred and non-interactive.
 */
export function FrostedReview({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative select-none" aria-hidden="true">
      <div className="blur-[6px] pointer-events-none opacity-70">
        {children}
      </div>
    </div>
  )
}

export function FrostedInlineLock({
  children,
  message,
}: {
  children: React.ReactNode
  message: string
}) {
  return (
    <div className="relative inline-flex items-center">
      <div className="blur-[4px] pointer-events-none opacity-70">{children}</div>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-[11px] px-2 py-1 rounded-full bg-white/90 border border-surface-tertiary text-text-secondary">
          {message}
        </span>
      </div>
    </div>
  )
}
