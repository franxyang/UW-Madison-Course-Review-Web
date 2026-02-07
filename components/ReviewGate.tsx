'use client'

import { Lock, PenLine, Eye } from 'lucide-react'
import Link from 'next/link'

interface ReviewGateProps {
  /** Total number of reviews on this course */
  totalReviews: number
  /** Number of reviews the user has written (platform-wide) */
  userReviewCount: number
  /** Whether user is logged in */
  isLoggedIn: boolean
  /** Course ID for the write-review link */
  courseId: string
}

/**
 * Overlay CTA shown on top of frosted/blurred reviews.
 * Explains why reviews are locked and how to unlock them.
 */
export function ReviewGateOverlay({ totalReviews, userReviewCount, isLoggedIn, courseId }: ReviewGateProps) {
  const hiddenCount = Math.max(0, totalReviews - 1)

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
          {isLoggedIn
            ? 'Share your experience with any course to unlock all reviews across the entire platform.'
            : 'Sign in with your @wisc.edu email and write one review to unlock full access.'}
        </p>

        {isLoggedIn ? (
          <a
            href="#review-form"
            className="inline-flex items-center gap-2 px-6 py-3 bg-uw-red text-white font-medium rounded-lg hover:bg-uw-dark transition-colors shadow-sm"
          >
            <PenLine size={18} />
            Write My First Review
          </a>
        ) : (
          <Link
            href="/auth/signin"
            className="inline-flex items-center gap-2 px-6 py-3 bg-uw-red text-white font-medium rounded-lg hover:bg-uw-dark transition-colors shadow-sm"
          >
            Sign In to Unlock
          </Link>
        )}

        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs text-text-tertiary">
          <Eye size={14} />
          <span>One review unlocks access to all reviews on every course</span>
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
