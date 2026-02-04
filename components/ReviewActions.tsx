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
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
        aria-label="Review actions"
      >
        <MoreVertical size={16} />
      </button>

      {/* Dropdown menu */}
      {showMenu && (
        <>
          {/* Click-away backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[140px]">
            <button
              onClick={() => {
                setShowMenu(false)
                onEditStart?.()
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <Pencil size={14} />
              Edit Review
            </button>
            <button
              onClick={() => {
                setShowMenu(false)
                setShowConfirm(true)
              }}
              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
          <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Delete Review?</h3>
              <button onClick={() => setShowConfirm(false)} className="text-slate-400 hover:text-slate-600">
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-slate-600 mb-6">
              This will permanently delete your review, all its comments, and votes. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
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
