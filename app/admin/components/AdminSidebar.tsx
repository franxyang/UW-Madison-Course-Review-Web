'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Logo } from '@/components/Logo'
import {
  LayoutDashboard,
  Flag,
  MessageSquare,
  Users,
  ScrollText,
  ChevronLeft,
  Shield,
  Menu,
  X,
} from 'lucide-react'
import { useState } from 'react'

interface AdminSidebarProps {
  role: 'ADMIN' | 'MODERATOR'
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/reports', label: 'Reports', icon: Flag },
  { href: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
  { href: '/admin/users', label: 'Users', icon: Users },
  { href: '/admin/logs', label: 'Audit Logs', icon: ScrollText },
]

export function AdminSidebar({ role }: AdminSidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  const sidebarContent = (
    <>
      {/* Logo area */}
      <div className="p-6 border-b border-surface-tertiary">
        <Link href="/admin" className="flex items-center gap-3">
          <Logo size={28} />
          <div>
            <span className="font-bold text-text-primary text-sm">MadSpace</span>
            <span className="block text-[10px] text-text-tertiary uppercase tracking-wider">
              Admin Portal
            </span>
          </div>
        </Link>
      </div>

      {/* Role badge */}
      <div className="px-6 py-3">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
          role === 'ADMIN'
            ? 'bg-wf-crimson/10 text-wf-crimson'
            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        }`}>
          <Shield size={12} />
          {role}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-wf-crimson/10 text-wf-crimson'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-tertiary'
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Back to site */}
      <div className="p-4 border-t border-surface-tertiary">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm text-text-tertiary hover:text-text-primary transition-colors"
        >
          <ChevronLeft size={16} />
          Back to MadSpace
        </Link>
      </div>
    </>
  )

  return (
    <>
      {/* Mobile toggle */}
      <button
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-lg bg-surface-primary border border-surface-tertiary shadow-sm"
        onClick={() => setMobileOpen(!mobileOpen)}
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen w-64 bg-surface-primary border-r border-surface-tertiary flex flex-col transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  )
}
