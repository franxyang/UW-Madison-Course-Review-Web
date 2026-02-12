'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc/client'
import { toast } from 'sonner'
import { PlusCircle, Send, Archive, PencilLine } from 'lucide-react'

type StatusFilter = 'all' | 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'

type FormState = {
  title: string
  versionTag: string
  summary: string
  content: string
}

const EMPTY_FORM: FormState = {
  title: '',
  versionTag: '',
  summary: '',
  content: '',
}

export default function AdminUpdatesPage() {
  const utils = trpc.useUtils()

  const [status, setStatus] = useState<StatusFilter>('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY_FORM)

  const updatesQuery = trpc.admin.listSiteUpdates.useQuery({
    status,
    search: search.trim() || undefined,
    page,
    limit: 20,
  })
  const noAccess = updatesQuery.error?.data?.code === 'FORBIDDEN'

  const createMutation = trpc.admin.createSiteUpdate.useMutation({
    onSuccess: () => {
      toast.success('Draft created.')
      setForm(EMPTY_FORM)
      utils.admin.listSiteUpdates.invalidate()
    },
    onError: (error) => toast.error(error.message),
  })

  const updateMutation = trpc.admin.updateSiteUpdate.useMutation({
    onSuccess: () => {
      toast.success('Update saved.')
      setEditingId(null)
      setForm(EMPTY_FORM)
      utils.admin.listSiteUpdates.invalidate()
    },
    onError: (error) => toast.error(error.message),
  })

  const publishMutation = trpc.admin.publishSiteUpdate.useMutation({
    onSuccess: () => {
      toast.success('Published.')
      utils.admin.listSiteUpdates.invalidate()
    },
    onError: (error) => toast.error(error.message),
  })

  const archiveMutation = trpc.admin.archiveSiteUpdate.useMutation({
    onSuccess: () => {
      toast.success('Archived.')
      utils.admin.listSiteUpdates.invalidate()
    },
    onError: (error) => toast.error(error.message),
  })

  const isSubmitting = createMutation.isPending || updateMutation.isPending
  const canSubmit = form.title.trim().length > 0 && form.content.trim().length > 0

  const totalPages = updatesQuery.data?.pages ?? 1
  const items = updatesQuery.data?.items ?? []

  const editingItem = editingId ? items.find((item) => item.id === editingId) ?? null : null

  const handleSubmit = () => {
    if (!canSubmit) return

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        title: form.title.trim(),
        versionTag: form.versionTag.trim() || undefined,
        summary: form.summary.trim() || undefined,
        content: form.content.trim(),
      })
      return
    }

    createMutation.mutate({
      title: form.title.trim(),
      versionTag: form.versionTag.trim() || undefined,
      summary: form.summary.trim() || undefined,
      content: form.content.trim(),
    })
  }

  const startEdit = (id: string) => {
    const target = items.find((item) => item.id === id)
    if (!target) return

    setEditingId(id)
    setForm({
      title: target.title,
      versionTag: target.versionTag ?? '',
      summary: target.summary ?? '',
      content: target.content,
    })
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Site Updates</h1>
        <p className="mt-1 text-text-secondary">
          Draft, edit, publish, and archive messages shown on About / Updates.
        </p>
      </div>

      {noAccess && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          You do not have permission to manage site updates. ADMIN role required.
        </div>
      )}

      <section className="mb-8 rounded-xl border border-surface-tertiary bg-surface-primary p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-text-primary">
            {editingId ? 'Edit Update' : 'Create New Update'}
          </h2>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null)
                setForm(EMPTY_FORM)
              }}
              className="text-sm text-text-secondary hover:text-text-primary"
            >
              Cancel editing
            </button>
          )}
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              maxLength={120}
              placeholder="Title (1-120)"
              className="w-full rounded-lg border border-surface-tertiary bg-surface-secondary px-3 py-2 text-sm"
            />
            <input
              value={form.versionTag}
              onChange={(e) => setForm((prev) => ({ ...prev, versionTag: e.target.value }))}
              maxLength={30}
              placeholder="Version tag (optional)"
              className="w-full rounded-lg border border-surface-tertiary bg-surface-secondary px-3 py-2 text-sm"
            />
          </div>

          <textarea
            value={form.summary}
            onChange={(e) => setForm((prev) => ({ ...prev, summary: e.target.value }))}
            maxLength={300}
            placeholder="Summary (optional, max 300)"
            rows={2}
            className="w-full rounded-lg border border-surface-tertiary bg-surface-secondary px-3 py-2 text-sm"
          />

          <textarea
            value={form.content}
            onChange={(e) => setForm((prev) => ({ ...prev, content: e.target.value }))}
            maxLength={20000}
            placeholder="Content (required, plain text)"
            rows={8}
            className="w-full rounded-lg border border-surface-tertiary bg-surface-secondary px-3 py-2 text-sm"
          />

          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting || noAccess}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              <PlusCircle size={16} />
              {editingId ? (isSubmitting ? 'Saving...' : 'Save Changes') : isSubmitting ? 'Creating...' : 'Save Draft'}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-surface-tertiary bg-surface-primary p-6">
        <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <h2 className="text-lg font-semibold text-text-primary">History</h2>
          <div className="flex gap-2">
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setPage(1)
              }}
              placeholder="Search"
              className="rounded-lg border border-surface-tertiary bg-surface-secondary px-3 py-2 text-sm"
            />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as StatusFilter)
                setPage(1)
              }}
              className="rounded-lg border border-surface-tertiary bg-surface-secondary px-3 py-2 text-sm"
            >
              <option value="all">All</option>
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
        </div>

        {updatesQuery.isLoading ? (
          <div className="text-sm text-text-secondary">Loading updates...</div>
        ) : items.length === 0 ? (
          <div className="text-sm text-text-secondary">No updates found.</div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <article key={item.id} className="rounded-lg border border-surface-tertiary p-4">
                <div className="mb-2 flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-text-primary">{item.title}</h3>
                    <p className="mt-1 text-xs text-text-tertiary">
                      {item.status}
                      {item.versionTag ? ` · ${item.versionTag}` : ''}
                      {item.publishedAt
                        ? ` · Published ${new Date(item.publishedAt).toLocaleString()}`
                        : ` · Updated ${new Date(item.updatedAt).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEdit(item.id)}
                      disabled={noAccess}
                      className="inline-flex items-center gap-1 rounded-lg border border-surface-tertiary px-2.5 py-1.5 text-xs text-text-secondary"
                    >
                      <PencilLine size={14} />
                      Edit
                    </button>
                    <button
                      onClick={() => publishMutation.mutate({ id: item.id })}
                      disabled={noAccess || item.status === 'PUBLISHED' || publishMutation.isPending}
                      className="inline-flex items-center gap-1 rounded-lg border border-surface-tertiary px-2.5 py-1.5 text-xs text-text-secondary disabled:opacity-50"
                    >
                      <Send size={14} />
                      Publish
                    </button>
                    <button
                      onClick={() => archiveMutation.mutate({ id: item.id })}
                      disabled={noAccess || item.status === 'ARCHIVED' || archiveMutation.isPending}
                      className="inline-flex items-center gap-1 rounded-lg border border-surface-tertiary px-2.5 py-1.5 text-xs text-text-secondary disabled:opacity-50"
                    >
                      <Archive size={14} />
                      Archive
                    </button>
                  </div>
                </div>

                {item.summary && <p className="mb-2 text-sm text-text-secondary">{item.summary}</p>}
                <div className="whitespace-pre-wrap text-sm text-text-secondary">{item.content}</div>
              </article>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-2">
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

        {editingItem && (
          <p className="mt-4 text-xs text-text-tertiary">
            Editing: <span className="font-medium text-text-secondary">{editingItem.title}</span>
          </p>
        )}
      </section>
    </div>
  )
}
