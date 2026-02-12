'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'

const PAGE_SIZE = 10

export default function AboutUpdatesPage() {
  const [page, setPage] = useState(1)
  const updatesQuery = trpc.site.listPublishedUpdates.useQuery({
    page,
    limit: PAGE_SIZE,
  })

  const updates = updatesQuery.data?.items ?? []
  const totalPages = updatesQuery.data?.pages ?? 1

  return (
    <main className="max-w-4xl mx-auto px-6 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary">Product Updates</h1>
        <p className="mt-2 text-text-secondary">
          Latest changes shipped to MadSpace, posted by the admin team.
        </p>
      </div>

      {updatesQuery.isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="h-36 animate-pulse rounded-xl border border-surface-tertiary bg-surface-primary" />
          ))}
        </div>
      ) : updates.length === 0 ? (
        <div className="rounded-xl border border-surface-tertiary bg-surface-primary p-10 text-center">
          <p className="text-text-secondary">No published updates yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {updates.map((update) => (
            <article
              key={update.id}
              className="rounded-xl border border-surface-tertiary bg-surface-primary p-5"
            >
              <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
                <span>
                  {new Date(update.publishedAt ?? update.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
                {update.versionTag && (
                  <span className="rounded-full border border-surface-tertiary px-2 py-0.5">
                    {update.versionTag}
                  </span>
                )}
              </div>

              <h2 className="text-xl font-semibold text-text-primary">{update.title}</h2>
              {update.summary && <p className="mt-2 text-sm text-text-secondary">{update.summary}</p>}

              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                {update.content}
              </div>
            </article>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-surface-tertiary px-3 py-1.5 text-sm text-text-secondary disabled:opacity-50"
          >
            Prev
          </button>
          <span className="text-sm text-text-secondary">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-surface-tertiary px-3 py-1.5 text-sm text-text-secondary disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </main>
  )
}
