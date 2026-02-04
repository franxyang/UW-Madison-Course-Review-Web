'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { Logo } from '@/components/Logo'
import { UserMenu, GuestMenu } from '@/components/UserMenu'

interface MobileNavProps {
  user?: { name?: string | null; email?: string | null; image?: string | null } | null
  currentPath?: string
}

const NAV_LINKS = [
  { href: '/courses', label: 'Courses' },
  { href: '/instructors', label: 'Instructors' },
  { href: '/about', label: 'About' },
]

export function MobileNav({ user, currentPath }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="lg:hidden p-2 text-slate-600 hover:text-slate-900"
        aria-label="Open menu"
      >
        <Menu size={24} />
      </button>

      {/* Slide-over panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/30 lg:hidden"
            onClick={() => setIsOpen(false)}
          />
          {/* Panel */}
          <div className="fixed inset-y-0 right-0 z-50 w-72 bg-white shadow-xl lg:hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
                <Logo size={28} />
                <span className="text-lg font-bold text-slate-900">WiscFlow</span>
              </Link>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-slate-600 hover:text-slate-900"
              >
                <X size={20} />
              </button>
            </div>

            <nav className="p-4 space-y-1">
              {NAV_LINKS.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setIsOpen(false)}
                  className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    currentPath === link.href
                      ? 'bg-uw-red/5 text-uw-red'
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  currentPath === '/profile'
                    ? 'bg-uw-red/5 text-uw-red'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                Profile
              </Link>
            </nav>

            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200">
              {user ? (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-uw-red rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {user.name?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="text-sm">
                    <div className="font-medium text-slate-900">{user.name || 'Badger'}</div>
                    <div className="text-xs text-slate-500 truncate">{user.email}</div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/auth/signin"
                  onClick={() => setIsOpen(false)}
                  className="block w-full text-center px-4 py-2.5 bg-uw-red text-white rounded-lg font-medium hover:bg-uw-dark transition-colors"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        </>
      )}
    </>
  )
}
