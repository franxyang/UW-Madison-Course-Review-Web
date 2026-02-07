'use client'

import { useState } from 'react'
import { Flag, X } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

const REPORT_REASONS = [
  { value: 'spam', label: 'Spam or advertisement' },
  { value: 'offensive', label: 'Offensive or inappropriate' },
  { value: 'irrelevant', label: 'Not relevant to the course' },
  { value: 'misinformation', label: 'Contains false information' },
  { value: 'other', label: 'Other' },
] as const

interface ReportButtonProps {
  reviewId: string
  isOwner: boolean
}

export function ReportButton({ reviewId, isOwner }: ReportButtonProps) {
  const [showModal, setShowModal] = useState(false)
  const [reason, setReason] = useState<string>('')
  const [details, setDetails] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const reportMutation = trpc.review.report.useMutation({
    onSuccess: () => {
      setSubmitted(true)
      setTimeout(() => {
        setShowModal(false)
        setSubmitted(false)
        setReason('')
        setDetails('')
      }, 2000)
    },
  })

  // Don't show report button for own reviews
  if (isOwner) return null

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="flex items-center gap-1 text-xs text-text-tertiary hover:text-red-500 dark:hover:text-red-400 transition-colors"
        title="Report this review"
      >
        <Flag size={12} />
        Report
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-surface-primary rounded-xl p-6 max-w-md w-full mx-4 shadow-xl border border-surface-tertiary">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Report Review</h3>
              <button onClick={() => setShowModal(false)} className="text-text-tertiary hover:text-text-primary">
                <X size={20} />
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-6">
                <div className="text-green-600 dark:text-green-400 text-lg font-medium mb-2">✓ Report Submitted</div>
                <p className="text-sm text-text-secondary">Thank you. We'll review this shortly.</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-text-secondary mb-4">
                  Why are you reporting this review?
                </p>

                <div className="space-y-2 mb-4">
                  {REPORT_REASONS.map(r => (
                    <label
                      key={r.value}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        reason === r.value
                          ? 'border-uw-red bg-red-50 dark:bg-red-900/20'
                          : 'border-surface-tertiary hover:bg-hover-bg'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reason"
                        value={r.value}
                        checked={reason === r.value}
                        onChange={() => setReason(r.value)}
                        className="text-uw-red focus:ring-uw-red"
                      />
                      <span className="text-sm text-text-secondary">{r.label}</span>
                    </label>
                  ))}
                </div>

                {reason === 'other' && (
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    placeholder="Please describe the issue..."
                    className="w-full px-3 py-2 text-sm border border-surface-tertiary rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-uw-red/20 focus:border-uw-red resize-none bg-surface-primary text-text-primary"
                    rows={3}
                    maxLength={500}
                  />
                )}

                <div className="flex gap-3 justify-end">
                  <button
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-text-secondary bg-surface-secondary rounded-lg hover:bg-surface-tertiary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() =>
                      reportMutation.mutate({
                        reviewId,
                        reason: reason as any,
                        details: details || undefined,
                      })
                    }
                    disabled={!reason || reportMutation.isPending}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  >
                    {reportMutation.isPending ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>

                {reportMutation.error && (
                  <p className="mt-3 text-sm text-red-600">
                    {reportMutation.error.message}
                  </p>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
