'use client'

import { trpc } from '@/lib/trpc/client'
import { useParams, useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  ArrowLeft,
  Shield,
  ShieldAlert,
  Ban,
  CheckCircle,
  MessageSquare,
  Flag,
  Calendar,
  Zap,
  Trophy,
  Mail,
} from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export default function AdminUserDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string
  const { data: session } = useSession()

  const [banModal, setBanModal] = useState(false)
  const [banReason, setBanReason] = useState('')
  const [banDuration, setBanDuration] = useState<string>('permanent')
  const [roleModal, setRoleModal] = useState(false)
  const [newRole, setNewRole] = useState<'STUDENT' | 'MODERATOR' | 'ADMIN'>('STUDENT')

  const utils = trpc.useUtils()
  const user = trpc.admin.getUserById.useQuery({ userId })

  const banMutation = trpc.admin.banUser.useMutation({
    onSuccess: () => {
      utils.admin.getUserById.invalidate({ userId })
      utils.admin.listUsers.invalidate()
      setBanModal(false)
      setBanReason('')
    },
  })

  const unbanMutation = trpc.admin.unbanUser.useMutation({
    onSuccess: () => {
      utils.admin.getUserById.invalidate({ userId })
      utils.admin.listUsers.invalidate()
    },
  })

  const changeRoleMutation = trpc.admin.changeRole.useMutation({
    onSuccess: () => {
      utils.admin.getUserById.invalidate({ userId })
      utils.admin.listUsers.invalidate()
      setRoleModal(false)
    },
  })

  if (user.isLoading) {
    return <div className="p-12 text-center text-text-tertiary">Loading user...</div>
  }

  if (!user.data) {
    return <div className="p-12 text-center text-text-tertiary">User not found</div>
  }

  const u = user.data
  const activeBan = u.bans.find((b) => b.active && (!b.expiresAt || new Date(b.expiresAt) > new Date()))
  const isCurrentUser = session?.user?.id === userId
  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  const getExpiresAt = () => {
    if (banDuration === 'permanent') return undefined
    const days = parseInt(banDuration)
    const dt = new Date()
    dt.setDate(dt.getDate() + days)
    return dt.toISOString()
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-text-tertiary hover:text-text-primary mb-3">
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-wf-crimson rounded-full flex items-center justify-center text-white text-xl font-bold">
              {(u.nickname || u.name || u.email.charAt(0)).charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-text-primary">
                  {u.nickname || u.name || 'Anonymous'}
                </h1>
                <RoleBadge role={u.role} />
                {activeBan && (
                  <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    <Ban size={10} /> Banned
                  </span>
                )}
              </div>
              <p className="text-sm text-text-tertiary flex items-center gap-1 mt-1">
                <Mail size={14} /> {u.email}
              </p>
              <p className="text-xs text-text-tertiary flex items-center gap-1 mt-1">
                <Calendar size={12} /> Joined {new Date(u.createdAt).toLocaleDateString()}
                <span className="mx-1">·</span>
                <Trophy size={12} /> Level {u.level}
                <span className="mx-1">·</span>
                <Zap size={12} /> {u.xp} XP
              </p>
            </div>
          </div>

          {/* Action buttons (admin only) */}
          {isAdmin && !isCurrentUser && (
            <div className="flex items-center gap-2">
              {activeBan ? (
                <button
                  onClick={() => unbanMutation.mutate({ userId })}
                  disabled={unbanMutation.isPending}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                >
                  <CheckCircle size={16} />
                  Unban
                </button>
              ) : (
                <button
                  onClick={() => setBanModal(true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  <Ban size={16} />
                  Ban User
                </button>
              )}
              <button
                onClick={() => { setNewRole(u.role as any); setRoleModal(true) }}
                className="flex items-center gap-2 px-4 py-2 text-sm rounded-lg border border-surface-tertiary hover:bg-surface-tertiary text-text-primary"
              >
                <Shield size={16} />
                Change Role
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard label="Reviews" value={u.reviews.length} icon={<MessageSquare size={16} />} />
        <StatCard label="Comments" value={u.comments.length} icon={<MessageSquare size={16} />} />
        <StatCard label="Reports Filed" value={u.reports.length} icon={<Flag size={16} />} />
        <StatCard label="Bans" value={u.bans.length} icon={<Ban size={16} />} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Reviews */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Reviews ({u.reviews.length})</h2>
            {u.reviews.length === 0 ? (
              <p className="text-sm text-text-tertiary text-center py-4">No reviews</p>
            ) : (
              <div className="space-y-3">
                {u.reviews.map((review) => (
                  <div key={review.id} className="p-3 rounded-lg border border-surface-tertiary">
                    <div className="flex items-center justify-between mb-1">
                      <Link href={`/courses/${review.course.id}`} className="text-sm font-medium text-wf-crimson hover:underline">
                        {review.course.code}: {review.course.name}
                      </Link>
                      <div className="flex items-center gap-2 text-xs text-text-tertiary">
                        <span>{review._count.votes} votes</span>
                        {review._count.reports > 0 && (
                          <span className="text-red-500">{review._count.reports} reports</span>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-text-tertiary">
                      {review.instructor.name} · {review.term}
                    </p>
                    {review.title && (
                      <p className="text-sm text-text-secondary mt-1">{review.title}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Comments */}
          <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Recent Comments ({u.comments.length})</h2>
            {u.comments.length === 0 ? (
              <p className="text-sm text-text-tertiary text-center py-4">No comments</p>
            ) : (
              <div className="space-y-3">
                {u.comments.map((comment) => (
                  <div key={comment.id} className="p-3 rounded-lg border border-surface-tertiary">
                    <p className="text-sm text-text-primary">{comment.text}</p>
                    <p className="text-xs text-text-tertiary mt-1">
                      on {comment.review?.course?.code || 'unknown'} · {new Date(comment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Reports Filed */}
          <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Reports Filed ({u.reports.length})</h2>
            {u.reports.length === 0 ? (
              <p className="text-sm text-text-tertiary text-center py-4">No reports</p>
            ) : (
              <div className="space-y-2">
                {u.reports.map((report) => (
                  <div key={report.id} className="p-3 rounded-lg border border-surface-tertiary">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                      {report.reason}
                    </span>
                    <p className="text-xs text-text-tertiary mt-1">
                      {report.review?.course?.code || 'unknown'} · {new Date(report.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Ban History */}
          <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-6">
            <h2 className="text-lg font-semibold text-text-primary mb-4">Ban History ({u.bans.length})</h2>
            {u.bans.length === 0 ? (
              <p className="text-sm text-text-tertiary text-center py-4">No bans</p>
            ) : (
              <div className="space-y-2">
                {u.bans.map((ban) => (
                  <div key={ban.id} className={`p-3 rounded-lg border ${ban.active ? 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10' : 'border-surface-tertiary'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${ban.active ? 'text-red-600 dark:text-red-400' : 'text-text-tertiary'}`}>
                        {ban.active ? 'Active' : 'Lifted'}
                      </span>
                      <span className="text-xs text-text-tertiary">
                        {new Date(ban.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm text-text-primary">{ban.reason}</p>
                    <p className="text-xs text-text-tertiary mt-1">
                      by {ban.bannedBy?.nickname || ban.bannedBy?.name || '—'}
                      {ban.expiresAt && ` · expires ${new Date(ban.expiresAt).toLocaleDateString()}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ban Modal */}
      {banModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setBanModal(false)}>
          <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-6 max-w-md w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Ban size={20} className="text-red-500" />
              Ban User
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-text-tertiary mb-1">Reason *</label>
                <textarea
                  value={banReason}
                  onChange={(e) => setBanReason(e.target.value)}
                  rows={3}
                  placeholder="Reason for banning this user..."
                  className="w-full px-3 py-2 text-sm rounded-lg border border-surface-tertiary bg-surface-primary text-text-primary resize-none"
                />
              </div>
              <div>
                <label className="block text-xs text-text-tertiary mb-1">Duration</label>
                <select
                  value={banDuration}
                  onChange={(e) => setBanDuration(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-surface-tertiary bg-surface-primary text-text-primary"
                >
                  <option value="1">1 day</option>
                  <option value="7">7 days</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button
                onClick={() => setBanModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-surface-tertiary hover:bg-surface-tertiary text-text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => banMutation.mutate({
                  userId,
                  reason: banReason,
                  expiresAt: getExpiresAt(),
                })}
                disabled={!banReason.trim() || banMutation.isPending}
                className="px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {banMutation.isPending ? 'Banning...' : 'Confirm Ban'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Change Modal */}
      {roleModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setRoleModal(false)}>
          <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Shield size={20} />
              Change Role
            </h3>
            <div className="space-y-2 mb-6">
              {(['STUDENT', 'MODERATOR', 'ADMIN'] as const).map((r) => (
                <label key={r} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${
                  newRole === r ? 'border-wf-crimson bg-wf-crimson/5' : 'border-surface-tertiary hover:bg-surface-secondary'
                }`}>
                  <input
                    type="radio"
                    name="role"
                    value={r}
                    checked={newRole === r}
                    onChange={() => setNewRole(r)}
                    className="accent-wf-crimson"
                  />
                  <div>
                    <span className="text-sm font-medium text-text-primary">{r}</span>
                    <p className="text-xs text-text-tertiary">
                      {r === 'STUDENT' && 'Standard user, can write reviews'}
                      {r === 'MODERATOR' && 'Can resolve reports and view admin dashboard'}
                      {r === 'ADMIN' && 'Full access: ban users, change roles, everything'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setRoleModal(false)}
                className="px-4 py-2 text-sm rounded-lg border border-surface-tertiary hover:bg-surface-tertiary text-text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => changeRoleMutation.mutate({ userId, role: newRole })}
                disabled={newRole === u.role || changeRoleMutation.isPending}
                className="px-4 py-2 text-sm rounded-lg bg-wf-crimson text-white hover:bg-wf-crimson-dark disabled:opacity-50"
              >
                {changeRoleMutation.isPending ? 'Updating...' : 'Update Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-4 text-center">
      <div className="text-2xl font-bold text-text-primary">{value}</div>
      <div className="text-xs text-text-tertiary mt-1 flex items-center justify-center gap-1">
        {icon} {label}
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
      {icons[role]} {role}
    </span>
  )
}
