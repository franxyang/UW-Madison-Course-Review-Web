'use client'

import { useState } from 'react'
import { Pencil, Trash2, MoreVertical, X } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

interface ReviewActionsProps {
  reviewId: string
  isOwner: boolean
  onDeleted?: () => void
  onEditStart?: () => void
}

/**
 * Edit/Delete dropdown menu for review cards.
 * Only shown if the user is the review author.
 */
export function ReviewActions({ reviewId, isOwner, onDeleted, onEditStart }: ReviewActionsProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const utils = trpc.useUtils()

  const deleteMutation = trpc.review.delete.useMutation({
    onSuccess: () => {
      // Invalidate course queries to refresh the review list
      utils.course.byId.invalidate()
      onDeleted?.()
      setShowConfirm(false)
    },
  })

  if (!isOwner) return null

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="p-1.5 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-hover-bg transition-colors"
        aria-label="Review actions"
      >
        <MoreVertical size={16} />
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          {/* Click-away backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-surface-primary border border-surface-tertiary rounded-lg shadow-lg py-1 min-w-[140px]">
            <button
              onClick={() => {
                setShowMenu(false)
                onEditStart?.()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-text-secondary hover:bg-hover-bg transition-colors"
            >
              <Pencil size={14} />
              Edit Review
            </button>
            <button
              onClick={() => {
                setShowMenu(false)
                setShowConfirm(true)
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <Trash2 size={14} />
              Delete Review
            </button>
          </div>
        </>
      )}

      {/* Delete confirmation modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-primary rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl border border-surface-tertiary">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Delete Review?</h3>
              <button onClick={() => setShowConfirm(false)} className="text-text-tertiary hover:text-text-primary">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-text-secondary mb-6">
              This will permanently delete your review, all its comments, and votes. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate({ reviewId })}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
