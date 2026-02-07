'use client'

import { trpc } from '@/lib/trpc/client'
import { useState } from 'react'
import { ScrollText, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react'

const ACTION_OPTIONS = [
  'RESOLVE_REPORT',
  'BATCH_RESOLVE_REPORTS',
  'DELETE_REVIEW',
  'EDIT_REVIEW',
  'BAN_USER',
  'UNBAN_USER',
  'CHANGE_ROLE',
]

export default function AdminLogsPage() {
  const [action, setAction] = useState<string>('')
  const [page, setPage] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const logs = trpc.admin.listAuditLogs.useQuery({
    action: action || undefined,
    page,
    limit: 30,
  })

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <ScrollText size={24} />
          Audit Logs
        </h1>
        <p className="text-text-secondary mt-1">Track all admin actions</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1) }}
          className="px-3 py-2 text-sm rounded-lg border border-surface-tertiary bg-surface-primary text-text-primary"
        >
          <option value="">All Actions</option>
          {ACTION_OPTIONS.map(a => (
            <option key={a} value={a}>{formatAction(a)}</option>
          ))}
        </select>
      </div>

      {/* Logs Table */}
      <div className="bg-surface-primary rounded-xl border border-surface-tertiary overflow-hidden">
        {logs.isLoading ? (
          <div className="p-12 text-center text-text-tertiary">Loading logs...</div>
        ) : !logs.data?.logs.length ? (
          <div className="p-12 text-center text-text-tertiary">
            <ScrollText className="mx-auto mb-3" size={32} />
            <p>No audit logs found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-tertiary bg-surface-secondary">
                    <th className="py-3 px-4 text-left text-text-tertiary font-medium w-8"></th>
                    <th className="py-3 px-4 text-left text-text-tertiary font-medium">Action</th>
                    <th className="py-3 px-4 text-left text-text-tertiary font-medium">Target</th>
                    <th className="py-3 px-4 text-left text-text-tertiary font-medium">Actor</th>
                    <th className="py-3 px-4 text-left text-text-tertiary font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.data.logs.map((log) => (
                    <>
                      <tr
                        key={log.id}
                        className="border-b border-surface-tertiary last:border-0 hover:bg-surface-secondary/50 cursor-pointer"
                        onClick={() => setExpandedId(expandedId === log.id ? null : log.id)}
                      >
                        <td className="py-3 px-4">
                          {log.details ? (
                            expandedId === log.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />
                          ) : null}
                        </td>
                        <td className="py-3 px-4">
                          <ActionBadge action={log.action} />
                        </td>
                        <td className="py-3 px-4">
                          <span className="text-xs text-text-secondary">{log.targetType}</span>
                          <span className="text-xs text-text-tertiary ml-1 font-mono">{log.targetId.slice(0, 8)}...</span>
                        </td>
                        <td className="py-3 px-4 text-xs text-text-secondary">
                          {log.actor.nickname || log.actor.name || log.actor.email}
                        </td>
                        <td className="py-3 px-4 text-xs text-text-tertiary whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                      {expandedId === log.id && log.details && (
                        <tr key={`${log.id}-details`} className="bg-surface-secondary/30">
                          <td colSpan={5} className="px-4 py-3">
                            <pre className="text-xs text-text-secondary bg-surface-tertiary/50 rounded-lg p-3 overflow-x-auto">
                              {JSON.stringify(log.details, null, 2)}
                            </pre>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {logs.data.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-surface-tertiary">
                <span className="text-xs text-text-tertiary">
                  Page {logs.data.page} of {logs.data.pages} ({logs.data.total} total)
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
                    onClick={() => setPage(p => Math.min(logs.data!.pages, p + 1))}
                    disabled={page === logs.data.pages}
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
    </div>
  )
}

function formatAction(action: string): string {
  return action
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase())
}

function ActionBadge({ action }: { action: string }) {
  const colorMap: Record<string, string> = {
    RESOLVE_REPORT: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    BATCH_RESOLVE_REPORTS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    DELETE_REVIEW: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    EDIT_REVIEW: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    BAN_USER: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    UNBAN_USER: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    CHANGE_ROLE: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  }

  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${colorMap[action] || 'bg-slate-100 text-slate-600'}`}>
      {formatAction(action)}
    </span>
  )
}
