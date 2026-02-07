'use client'

import { trpc } from '@/lib/trpc/client'
import { useState } from 'react'
import { Flag, Check, X, AlertTriangle, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'
import Link from 'next/link'

export default function AdminReportsPage() {
  const [status, setStatus] = useState<'pending' | 'resolved' | 'all'>('pending')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [resolveModal, setResolveModal] = useState<{
    reportId: string
    reviewId: string
  } | null>(null)

  const utils = trpc.useUtils()
  const reports = trpc.admin.listReports.useQuery({ status, page, limit: 20 })

  const resolveMutation = trpc.admin.resolveReport.useMutation({
    onSuccess: () => {
      utils.admin.listReports.invalidate()
      utils.admin.dashboardStats.invalidate()
      setResolveModal(null)
    },
  })

  const batchResolveMutation = trpc.admin.batchResolveReports.useMutation({
    onSuccess: () => {
      utils.admin.listReports.invalidate()
      utils.admin.dashboardStats.invalidate()
      setSelected(new Set())
    },
  })

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleSelectAll = () => {
    if (!reports.data) return
    if (selected.size === reports.data.reports.length) {
      setSelected(new Set())
    } else {
      setSelected(new Set(reports.data.reports.map(r => r.id)))
    }
  }

  const handleBatchResolve = (resolution: 'approved' | 'rejected' | 'escalated', deleteReviews: boolean) => {
    if (selected.size === 0) return
    batchResolveMutation.mutate({
      reportIds: Array.from(selected),
      resolution,
      deleteReviews,
    })
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Flag size={24} />
          Report Queue
        </h1>
        <p className="text-text-secondary mt-1">Review and resolve user reports</p>
      </div>

      {/* Filters + Batch Actions */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="flex rounded-lg border border-surface-tertiary overflow-hidden">
          {(['pending', 'resolved', 'all'] as const).map((s) => (
            <button
              key={s}
              onClick={() => { setStatus(s); setPage(1); setSelected(new Set()) }}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                status === s
                  ? 'bg-wf-crimson text-white'
                  : 'bg-surface-primary text-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {selected.size > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm text-text-secondary">{selected.size} selected</span>
            <button
              onClick={() => handleBatchResolve('rejected', false)}
              className="px-3 py-1.5 text-sm rounded-lg border border-surface-tertiary hover:bg-surface-tertiary text-text-secondary"
            >
              Reject All
            </button>
            <button
              onClick={() => handleBatchResolve('approved', true)}
              className="px-3 py-1.5 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Approve & Delete
            </button>
          </div>
        )}
      </div>

      {/* Reports Table */}
      <div className="bg-surface-primary rounded-xl border border-surface-tertiary overflow-hidden">
        {reports.isLoading ? (
          <div className="p-12 text-center text-text-tertiary">Loading reports...</div>
        ) : !reports.data?.reports.length ? (
          <div className="p-12 text-center text-text-tertiary">
            <Flag className="mx-auto mb-3 text-text-tertiary" size={32} />
            <p>No {status === 'all' ? '' : status} reports found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-tertiary bg-surface-secondary">
                    {status === 'pending' && (
                      <th className="py-3 px-4 text-left">
                        <input
                          type="checkbox"
                          checked={selected.size === reports.data.reports.length && selected.size > 0}
                          onChange={toggleSelectAll}
                          className="rounded"
                        />
                      </th>
                    )}
                    <th className="py-3 px-4 text-left text-text-tertiary font-medium">Reason</th>
                    <th className="py-3 px-4 text-left text-text-tertiary font-medium">Reported Review</th>
                    <th className="py-3 px-4 text-left text-text-tertiary font-medium">Reporter</th>
                    <th className="py-3 px-4 text-left text-text-tertiary font-medium">Date</th>
                    <th className="py-3 px-4 text-left text-text-tertiary font-medium">Status</th>
                    <th className="py-3 px-4 text-right text-text-tertiary font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.data.reports.map((report) => (
                    <tr key={report.id} className="border-b border-surface-tertiary last:border-0 hover:bg-surface-secondary/50">
                      {status === 'pending' && (
                        <td className="py-3 px-4">
                          <input
                            type="checkbox"
                            checked={selected.has(report.id)}
                            onChange={() => toggleSelect(report.id)}
                            className="rounded"
                          />
                        </td>
                      )}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                          report.reason === 'spam' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                          report.reason === 'offensive' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {report.reason}
                        </span>
                        {report.details && (
                          <p className="text-xs text-text-tertiary mt-1 max-w-xs truncate">{report.details}</p>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="max-w-xs">
                          <Link href={`/courses/${report.review.courseId}`} className="text-wf-crimson hover:underline text-xs font-medium">
                            {report.review.course.code}
                          </Link>
                          <p className="text-xs text-text-tertiary truncate mt-0.5">
                            by {report.review.author.nickname || report.review.author.name || report.review.author.email}
                          </p>
                          {report.review.title && (
                            <p className="text-xs text-text-secondary truncate mt-0.5">&ldquo;{report.review.title}&rdquo;</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-text-secondary text-xs">
                        {report.reporter.nickname || report.reporter.name || report.reporter.email}
                      </td>
                      <td className="py-3 px-4 text-text-tertiary text-xs whitespace-nowrap">
                        {new Date(report.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={report.status} resolution={report.resolution} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {report.status === 'pending' ? (
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => resolveMutation.mutate({ reportId: report.id, resolution: 'rejected' })}
                              className="p-1.5 rounded-lg hover:bg-surface-tertiary text-text-tertiary hover:text-text-primary"
                              title="Reject (dismiss report)"
                            >
                              <X size={16} />
                            </button>
                            <button
                              onClick={() => setResolveModal({ reportId: report.id, reviewId: report.reviewId })}
                              className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 hover:text-red-700 dark:hover:bg-red-900/20"
                              title="Approve (take action)"
                            >
                              <Check size={16} />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-text-tertiary">
                            {report.resolvedBy?.nickname || report.resolvedBy?.name || '—'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {reports.data.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-surface-tertiary">
                <span className="text-xs text-text-tertiary">
                  Page {reports.data.page} of {reports.data.pages} ({reports.data.total} total)
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
                    onClick={() => setPage(p => Math.min(reports.data!.pages, p + 1))}
                    disabled={page === reports.data.pages}
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

      {/* Resolve Modal */}
      {resolveModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setResolveModal(null)}>
          <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-500" />
              Resolve Report
            </h3>
            <p className="text-sm text-text-secondary mb-6">
              Choose how to handle this report. Approving with deletion will permanently remove the review and all associated data.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => {
                  resolveMutation.mutate({
                    reportId: resolveModal.reportId,
                    resolution: 'approved',
                    deleteReview: true,
                  })
                }}
                disabled={resolveMutation.isPending}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                <Trash2 size={18} />
                <div className="text-left">
                  <div className="font-medium text-sm">Approve & Delete Review</div>
                  <div className="text-xs opacity-75">Remove the review permanently</div>
                </div>
              </button>
              <button
                onClick={() => {
                  resolveMutation.mutate({
                    reportId: resolveModal.reportId,
                    resolution: 'approved',
                    deleteReview: false,
                  })
                }}
                disabled={resolveMutation.isPending}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-surface-tertiary hover:bg-surface-secondary transition-colors"
              >
                <Check size={18} />
                <div className="text-left">
                  <div className="font-medium text-sm text-text-primary">Approve (Keep Review)</div>
                  <div className="text-xs text-text-tertiary">Mark report as valid but don&apos;t delete</div>
                </div>
              </button>
              <button
                onClick={() => {
                  resolveMutation.mutate({
                    reportId: resolveModal.reportId,
                    resolution: 'escalated',
                  })
                }}
                disabled={resolveMutation.isPending}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-surface-tertiary hover:bg-surface-secondary transition-colors"
              >
                <AlertTriangle size={18} />
                <div className="text-left">
                  <div className="font-medium text-sm text-text-primary">Escalate</div>
                  <div className="text-xs text-text-tertiary">Flag for senior admin review</div>
                </div>
              </button>
              <button
                onClick={() => setResolveModal(null)}
                className="w-full px-4 py-2 text-sm text-text-tertiary hover:text-text-primary"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatusBadge({ status, resolution }: { status: string; resolution: string | null }) {
  if (status === 'pending') {
    return (
      <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
        Pending
      </span>
    )
  }
  const colorMap: Record<string, string> = {
    approved: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    rejected: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    escalated: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  }
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${colorMap[resolution || status] || colorMap.rejected}`}>
      {resolution || status}
    </span>
  )
}
