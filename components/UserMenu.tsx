'use client'

import { User, LogOut, Settings, BookMarked, Star } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'

interface UserMenuProps {
  user: {
    name?: string | null
    nickname?: string | null
    email?: string | null
    image?: string | null
  }
}

export function UserMenu({ user }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Prefer nickname over real name for display
  const displayName = user.nickname || user.name || null

  // Get initials for avatar
  const initials = displayName
    ? displayName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user.email?.[0].toUpperCase() || 'U'

  return (
    <div className="relative" ref={menuRef}>
      {/* Avatar Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-hover-bg transition-colors"
      >
        {user.image ? (
          <img
            src={user.image}
            alt={user.name || 'User'}
            className="w-8 h-8 rounded-full border-2 border-surface-tertiary"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-wf-crimson text-white flex items-center justify-center font-semibold text-sm">
            {initials}
          </div>
        )}
        <span className="text-sm font-medium text-text-secondary hidden sm:block">
          {displayName || user.email?.split('@')[0]}
        </span>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-surface-tertiary py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-surface-tertiary">
            <p className="text-sm font-semibold text-text-primary">{displayName || 'Anonymous Badger'}</p>
            <p className="text-xs text-text-tertiary truncate">{user.email}</p>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-hover-bg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User size={16} />
              <span>My Profile</span>
            </Link>

            {/* P2 Fix: Link to profile page sections instead of non-existent routes */}
            <Link
              href="/profile#reviews"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-hover-bg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Star size={16} />
              <span>My Reviews</span>
            </Link>

            <Link
              href="/profile#saved"
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-text-secondary hover:bg-hover-bg transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <BookMarked size={16} />
              <span>Saved Courses</span>
            </Link>
          </div>

          {/* Sign Out */}
          <div className="border-t border-surface-tertiary pt-2">
            <form action="/api/auth/signout" method="POST">
              <button
                type="submit"
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
              >
                <LogOut size={16} />
                <span>Sign Out</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Guest State (Not logged in)
export function GuestMenu() {
  return (
    <div className="flex items-center gap-3">
      <Link
        href="/auth/signin"
        className="px-4 py-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
      >
        Sign In
      </Link>
      <Link
        href="/auth/signup"
        className="px-4 py-2 text-sm font-medium bg-wf-crimson text-white rounded-lg hover:bg-uw-dark transition-colors"
      >
        Sign Up
      </Link>
    </div>
  )
}
