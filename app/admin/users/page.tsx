'use client'

import { trpc } from '@/lib/trpc/client'
import { useState } from 'react'
import { Users, Search, ChevronLeft, ChevronRight, Shield, ShieldAlert, Ban } from 'lucide-react'
import Link from 'next/link'

export default function AdminUsersPage() {
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [role, setRole] = useState<'STUDENT' | 'MODERATOR' | 'ADMIN' | 'all'>('all')
  const [status, setStatus] = useState<'active' | 'banned' | 'all'>('all')
  const [page, setPage] = useState(1)
  const [sortBy, setSortBy] = useState<'createdAt' | 'reviews' | 'name'>('createdAt')

  const users = trpc.admin.listUsers.useQuery({ search, role, status, page, limit: 20, sortBy })

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Users size={24} />
          User Management
        </h1>
        <p className="text-text-secondary mt-1">View and manage all users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <form onSubmit={handleSearch} className="flex-1 min-w-[200px] max-w-md">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by name, nickname, or email..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-surface-tertiary bg-surface-primary text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-wf-crimson/30 focus:border-wf-crimson"
            />
          </div>
        </form>

        <select
          value={role}
          onChange={(e) => { setRole(e.target.value as any); setPage(1) }}
          className="px-3 py-2 text-sm rounded-lg border border-surface-tertiary bg-surface-primary text-text-primary"
        >
          <option value="all">All Roles</option>
          <option value="STUDENT">Student</option>
          <option value="MODERATOR">Moderator</option>
          <option value="ADMIN">Admin</option>
        </select>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as any); setPage(1) }}
          className="px-3 py-2 text-sm rounded-lg border border-surface-tertiary bg-surface-primary text-text-primary"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="banned">Banned</option>
        </select>

        <select
          value={sortBy}
          onChange={(e) => { setSortBy(e.target.value as any); setPage(1) }}
          className="px-3 py-2 text-sm rounded-lg border border-surface-tertiary bg-surface-primary text-text-primary"
        >
          <option value="createdAt">Newest first</option>
          <option value="reviews">Most reviews</option>
          <option value="name">Name A-Z</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-surface-primary rounded-xl border border-surface-tertiary overflow-hidden">
        {users.isLoading ? (
          <div className="p-12 text-center text-text-tertiary">Loading users...</div>
        ) : !users.data?.users.length ? (
          <div className="p-12 text-center text-text-tertiary">
            <Users className="mx-auto mb-3" size={32} />
            <p>No users found</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-tertiary bg-surface-secondary">
                    <th className="py-3 px-4 text-left text-text-tertiary font-medium">User</th>
                    <th className="py-3 px-4 text-left text-text-tertiary font-medium">Role</th>
                    <th className="py-3 px-4 text-left text-text-tertiary font-medium">Status</th>
                    <th className="py-3 px-4 text-center text-text-tertiary font-medium">Reviews</th>
                    <th className="py-3 px-4 text-center text-text-tertiary font-medium">Comments</th>
                    <th className="py-3 px-4 text-center text-text-tertiary font-medium">Reports</th>
                    <th className="py-3 px-4 text-left text-text-tertiary font-medium">Level</th>
                    <th className="py-3 px-4 text-left text-text-tertiary font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {users.data.users.map((user) => {
                    const isBanned = user.bans.length > 0
                    return (
                      <tr key={user.id} className="border-b border-surface-tertiary last:border-0 hover:bg-surface-secondary/50">
                        <td className="py-3 px-4">
                          <Link href={`/admin/users/${user.id}`} className="hover:underline">
                            <div className="font-medium text-text-primary text-xs">
                              {user.nickname || user.name || 'Anonymous'}
                            </div>
                            <div className="text-xs text-text-tertiary">{user.email}</div>
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <RoleBadge role={user.role} />
                        </td>
                        <td className="py-3 px-4">
                          {isBanned ? (
                            <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                              <Ban size={10} />
                              Banned
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-text-secondary text-xs">{user._count.reviews}</td>
                        <td className="py-3 px-4 text-center text-text-secondary text-xs">{user._count.comments}</td>
                        <td className="py-3 px-4 text-center text-text-secondary text-xs">{user._count.reports}</td>
                        <td className="py-3 px-4 text-text-secondary text-xs">Lv.{user.level}</td>
                        <td className="py-3 px-4 text-text-tertiary text-xs whitespace-nowrap">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {users.data.pages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-surface-tertiary">
                <span className="text-xs text-text-tertiary">
                  Page {users.data.page} of {users.data.pages} ({users.data.total} total)
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
                    onClick={() => setPage(p => Math.min(users.data!.pages, p + 1))}
                    disabled={page === users.data.pages}
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

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    ADMIN: 'bg-wf-crimson/10 text-wf-crimson',
    MODERATOR: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    STUDENT: 'bg-surface-tertiary text-text-secondary',
  }
  const icons: Record<string, React.ReactNode> = {
    ADMIN: <ShieldAlert size={10} />,
    MODERATOR: <Shield size={10} />,
  }

  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${styles[role] || styles.STUDENT}`}>
      {icons[role]}
      {role}
    </span>
  )
}
