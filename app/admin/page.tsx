'use client'

import { trpc } from '@/lib/trpc/client'
import { Users, MessageSquare, Flag, Activity, TrendingUp, ArrowRight } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const stats = trpc.admin.dashboardStats.useQuery()
  const trend = trpc.admin.weeklyTrend.useQuery()

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p className="text-text-secondary mt-1">Overview of MadSpace platform activity</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Total Users"
          value={stats.data?.totalUsers}
          today={stats.data?.todayUsers}
          icon={<Users size={20} />}
          color="blue"
          href="/admin/users"
        />
        <StatCard
          label="Total Reviews"
          value={stats.data?.totalReviews}
          today={stats.data?.todayReviews}
          icon={<MessageSquare size={20} />}
          color="green"
          href="/admin/reviews"
        />
        <StatCard
          label="Pending Reports"
          value={stats.data?.pendingReports}
          today={stats.data?.todayReports}
          icon={<Flag size={20} />}
          color="red"
          href="/admin/reports"
        />
        <StatCard
          label="Today Activity"
          value={
            stats.data
              ? stats.data.todayUsers + stats.data.todayReviews + stats.data.todayReports
              : undefined
          }
          icon={<Activity size={20} />}
          color="purple"
          href="/admin/logs"
        />
      </div>

      {/* 7-Day Trend */}
      <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp size={18} className="text-text-secondary" />
          <h2 className="text-lg font-semibold text-text-primary">7-Day Trend</h2>
        </div>
        {trend.isLoading ? (
          <div className="h-32 flex items-center justify-center text-text-tertiary">Loading...</div>
        ) : trend.data ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-tertiary">
                  <th className="text-left py-2 px-3 text-text-tertiary font-medium">Date</th>
                  <th className="text-right py-2 px-3 text-text-tertiary font-medium">Users</th>
                  <th className="text-right py-2 px-3 text-text-tertiary font-medium">Reviews</th>
                  <th className="text-right py-2 px-3 text-text-tertiary font-medium">Reports</th>
                </tr>
              </thead>
              <tbody>
                {trend.data.map((day) => (
                  <tr key={day.date} className="border-b border-surface-tertiary last:border-0">
                    <td className="py-2 px-3 text-text-primary font-medium">
                      {new Date(day.date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="text-right py-2 px-3">
                      <MiniBar value={day.users} max={Math.max(...trend.data!.map(d => d.users), 1)} color="bg-blue-500" />
                    </td>
                    <td className="text-right py-2 px-3">
                      <MiniBar value={day.reviews} max={Math.max(...trend.data!.map(d => d.reviews), 1)} color="bg-green-500" />
                    </td>
                    <td className="text-right py-2 px-3">
                      <MiniBar value={day.reports} max={Math.max(...trend.data!.map(d => d.reports), 1)} color="bg-red-500" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-3 gap-4">
        <QuickLink
          href="/admin/reports"
          label="Review Reports"
          description="Handle pending reports from users"
          count={stats.data?.pendingReports}
          urgent
        />
        <QuickLink
          href="/admin/reviews"
          label="Manage Reviews"
          description="Search, edit, or delete reviews"
        />
        <QuickLink
          href="/admin/users"
          label="User Management"
          description="View users, manage roles and bans"
        />
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  today,
  icon,
  color,
  href,
}: {
  label: string
  value?: number
  today?: number
  icon: React.ReactNode
  color: 'blue' | 'green' | 'red' | 'purple'
  href: string
}) {
  const colorMap = {
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400',
    green: 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400',
    red: 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400',
    purple: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400',
  }

  return (
    <Link
      href={href}
      className="bg-surface-primary rounded-xl border border-surface-tertiary p-5 hover:border-wf-crimson/30 transition-colors group"
    >
      <div className="flex items-center justify-between mb-3">
        <div className={`p-2 rounded-lg ${colorMap[color]}`}>{icon}</div>
        {today !== undefined && today > 0 && (
          <span className="text-xs font-medium text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 px-2 py-0.5 rounded-full">
            +{today} today
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-text-primary">
        {value !== undefined ? value.toLocaleString() : '—'}
      </div>
      <div className="text-xs text-text-tertiary mt-1">{label}</div>
    </Link>
  )
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const width = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-2 justify-end">
      <span className="text-text-primary tabular-nums">{value}</span>
      <div className="w-16 h-2 bg-surface-tertiary rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${width}%` }} />
      </div>
    </div>
  )
}

function QuickLink({
  href,
  label,
  description,
  count,
  urgent,
}: {
  href: string
  label: string
  description: string
  count?: number
  urgent?: boolean
}) {
  return (
    <Link
      href={href}
      className="bg-surface-primary rounded-xl border border-surface-tertiary p-5 hover:border-wf-crimson/30 transition-colors group"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold text-text-primary">{label}</h3>
        {count !== undefined && count > 0 && (
          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
            urgent
              ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              : 'bg-surface-tertiary text-text-secondary'
          }`}>
            {count}
          </span>
        )}
      </div>
      <p className="text-sm text-text-secondary mb-3">{description}</p>
      <span className="text-sm text-wf-crimson flex items-center gap-1 group-hover:gap-2 transition-all">
        Go <ArrowRight size={14} />
      </span>
    </Link>
  )
}
