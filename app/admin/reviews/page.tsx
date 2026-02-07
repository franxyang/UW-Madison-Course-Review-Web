'use client'

import { trpc } from '@/lib/trpc/client'
import { useState } from 'react'
import { MessageSquare, Search, Trash2, Pencil, ChevronLeft, ChevronRight, X, Flag, ThumbsUp } from 'lucide-react'
import Link from 'next/link'

export default function AdminReviewsPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<'createdAt' | 'reports'>('createdAt')
  const [editModal, setEditModal] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<string | null>(null)
  const [deleteReason, setDeleteReason] = useState('')

  const utils = trpc.useUtils()
  const reviews = trpc.admin.listReviews.useQuery({ search, page, limit: 20, sortBy })

  const deleteMutation = trpc.admin.deleteReview.useMutation({
    onSuccess: () => {
      utils.admin.listReviews.invalidate()
      utils.admin.dashboardStats.invalidate()
      setDeleteModal(null)
      setDeleteReason('')
    },
  })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <MessageSquare size={24} />
          Review Management
        </h1>
        <p className="text-text-secondary mt-1">Search, edit, or remove reviews</p>
      </div>

      {/* Search + Sort */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-md">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by course, author, or content..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-surface-tertiary bg-surface-primary text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-wf-crimson/30 focus:border-wf-crimson"
            />
          </div>
        </form>

        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value as any); setPage(1) }}
          className="px-3 py-2 text-sm rounded-lg border border-surface-tertiary bg-surface-primary text-text-primary"
        >
          <option value="createdAt">Newest first</option>
          <option value="reports">Most reported</option>
        </select>
      </div>

      {/* Reviews Table */}
      <div className="bg-surface-primary rounded-xl border border-surface-tertiary overflow-hidden">
        {reviews.isLoading ? (
          <div className="p-12 text-center text-text-tertiary">Loading reviews...</div>
        ) : !reviews.data?.reviews.length ? (
          <div className="p-12 text-center text-text-tertiary">
            <MessageSquare className="mx-auto mb-3" size={32} />
            <p>No reviews found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-tertiary bg-surface-secondary">
                    <th className="py-3 px-4 text-left text-text-tertiary font-medium">Course</th>
                    <th className="py-3 px-4 text-left text-text-tertiary font-medium">Author</th>
                    <th className="py-3 px-4 text-left text-text-tertiary font-medium">Title</th>
                    <th className="py-3 px-4 text-left text-text-tertiary font-medium">Term</th>
                    <th className="py-3 px-4 text-center text-text-tertiary font-medium">
                      <ThumbsUp size={14} className="inline" />
                    </th>
                    <th className="py-3 px-4 text-center text-text-tertiary font-medium">
                      <Flag size={14} className="inline" />
                    </th>
                    <th className="py-3 px-4 text-left text-text-tertiary font-medium">Date</th>
                    <th className="py-3 px-4 text-right text-text-tertiary font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.data.reviews.map((review) => (
                    <tr key={review.id} className="border-b border-surface-tertiary last:border-0 hover:bg-surface-secondary/50">
                      <td className="py-3 px-4">
                        <Link href={`/courses/${review.course.id}`} className="text-wf-crimson hover:underline text-xs font-medium">
                          {review.course.code}
                        </Link>
                        <p className="text-xs text-text-tertiary truncate max-w-[150px]">{review.instructor.name}</p>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/admin/users/${review.author.id}`} className="text-xs hover:underline text-text-primary">
                          {review.author.nickname || review.author.name || review.author.email}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-text-secondary text-xs max-w-[200px] truncate">
                        {review.title || '(no title)'}
                      </td>
                      <td className="py-3 px-4 text-text-tertiary text-xs whitespace-nowrap">{review.term}</td>
                      <td className="py-3 px-4 text-center text-text-secondary text-xs">{review._count.votes}</td>
                      <td className="py-3 px-4 text-center">
                        {review._count.reports > 0 ? (
                          <span className="text-xs font-medium text-red-600">{review._count.reports}</span>
                        ) : (
                          <span className="text-xs text-text-tertiary">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-text-tertiary text-xs whitespace-nowrap">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => setEditModal(review.id)}
                            className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-tertiary hover:text-text-primary"
                            title="Edit review"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteModal(review.id)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 dark:hover:bg-red-900/20"
                            title="Delete review"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {reviews.data.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-surface-tertiary">
                <span className="text-xs text-text-tertiary">
                  Page {reviews.data.page} of {reviews.data.pages} ({reviews.data.total} total)
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-surface-tertiary hover:bg-surface-tertiary disabled:opacity-50"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(reviews.data!.pages, p + 1))}
                    disabled={page === reviews.data.pages}
                    className="p-1.5 rounded-lg border border-surface-tertiary hover:bg-surface-tertiary disabled:opacity-50"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setDeleteModal(null)}>
          <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary mb-2 flex items-center gap-2">
              <Trash2 size={20} className="text-red-500" />
              Delete Review
            </h3>
            <p className="text-sm text-text-secondary mb-4">
              This will permanently delete the review and all its votes, comments, and reports.
            </p>
            <div className="mb-4">
              <label className="block text-xs text-text-tertiary mb-1">Reason (optional)</label>
              <input
                type="text"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Why is this review being deleted?"
                className="w-full px-3 py-2 text-sm rounded-lg border border-surface-tertiary bg-surface-primary text-text-primary"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setDeleteModal(null)}
                className="px-4 py-2 text-sm rounded-lg border border-surface-tertiary hover:bg-surface-tertiary text-text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteMutation.mutate({ reviewId: deleteModal, reason: deleteReason || undefined })}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal && (
        <EditReviewModal
          reviewId={editModal}
          onClose={() => setEditModal(null)}
        />
      )}
    </div>
  )
}

function EditReviewModal({ reviewId, onClose }: { reviewId: string; onClose: () => void }) {
  const [title, setTitle] = useState('')
  const [contentComment, setContentComment] = useState('')
  const [teachingComment, setTeachingComment] = useState('')
  const [gradingComment, setGradingComment] = useState('')
  const [workloadComment, setWorkloadComment] = useState('')
  const [reason, setReason] = useState('')
  const [loaded, setLoaded] = useState(false)

  const utils = trpc.useUtils()

  // Fetch the review data from the list cache
  const reviews = trpc.admin.listReviews.useQuery({ page: 1, limit: 100 })
  const review = reviews.data?.reviews.find(r => r.id === reviewId)

  // Set initial values once loaded
  if (review && !loaded) {
    setTitle((review as any).title || '')
    setContentComment((review as any).contentComment || '')
    setTeachingComment((review as any).teachingComment || '')
    setGradingComment((review as any).gradingComment || '')
    setWorkloadComment((review as any).workloadComment || '')
    setLoaded(true)
  }

  const editMutation = trpc.admin.editReview.useMutation({
    onSuccess: () => {
      utils.admin.listReviews.invalidate()
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <Pencil size={20} />
            Edit Review
          </h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-surface-tertiary">
            <X size={18} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-text-tertiary mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-tertiary bg-surface-primary text-text-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-text-tertiary mb-1">Content Comment</label>
            <textarea
              value={contentComment}
              onChange={(e) => setContentComment(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-tertiary bg-surface-primary text-text-primary resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-text-tertiary mb-1">Teaching Comment</label>
            <textarea
              value={teachingComment}
              onChange={(e) => setTeachingComment(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-tertiary bg-surface-primary text-text-primary resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-text-tertiary mb-1">Grading Comment</label>
            <textarea
              value={gradingComment}
              onChange={(e) => setGradingComment(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-tertiary bg-surface-primary text-text-primary resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-text-tertiary mb-1">Workload Comment</label>
            <textarea
              value={workloadComment}
              onChange={(e) => setWorkloadComment(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-tertiary bg-surface-primary text-text-primary resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-text-tertiary mb-1">Edit Reason</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Why was this edited?"
              className="w-full px-3 py-2 text-sm rounded-lg border border-surface-tertiary bg-surface-primary text-text-primary"
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border border-surface-tertiary hover:bg-surface-tertiary text-text-secondary"
          >
            Cancel
          </button>
          <button
            onClick={() => editMutation.mutate({
              reviewId,
              title,
              contentComment,
              teachingComment,
              gradingComment,
              workloadComment,
              reason: reason || undefined,
            })}
            disabled={editMutation.isPending}
            className="px-4 py-2 text-sm rounded-lg bg-wf-crimson text-white hover:bg-wf-crimson-dark disabled:opacity-50"
          >
            {editMutation.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}
