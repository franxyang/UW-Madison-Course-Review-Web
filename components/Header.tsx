'use client'

import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { UserMenu, GuestMenu } from '@/components/UserMenu'
import { MobileNav } from '@/components/MobileNav'
import { useSession } from 'next-auth/react'

interface HeaderProps {
  currentPath?: string
}

export function Header({ currentPath = '' }: HeaderProps) {
  const { data: session } = useSession()
  
  const isActive = (path: string) => currentPath === path

  return (
    <header className="bg-surface-primary border-b border-surface-tertiary sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
          </Link>
          
          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/courses" 
              className={isActive('/courses') 
                ? 'text-wf-crimson font-medium' 
                : 'text-text-secondary hover:text-text-primary transition-colors'}
            >
              Courses
            </Link>
            <Link 
              href="/instructors" 
              className={isActive('/instructors') 
                ? 'text-wf-crimson font-medium' 
                : 'text-text-secondary hover:text-text-primary transition-colors'}
            >
              Instructors
            </Link>
            <Link 
              href="/about" 
              className={isActive('/about') 
                ? 'text-wf-crimson font-medium' 
                : 'text-text-secondary hover:text-text-primary transition-colors'}
            >
              About
            </Link>
            {session?.user && ((session.user as any).role === 'ADMIN' || (session.user as any).role === 'MODERATOR') && (
              <Link
                href="/admin"
                className={isActive('/admin')
                  ? 'text-wf-crimson font-medium'
                  : 'text-text-secondary hover:text-text-primary transition-colors'}
              >
                Admin
              </Link>
            )}
            <ThemeToggle />
            {session?.user ? <UserMenu user={session.user} /> : <GuestMenu />}
          </nav>
          
          {/* Mobile Nav */}
          <div className="flex items-center gap-2 md:hidden">
            <ThemeToggle />
            <MobileNav user={session?.user} currentPath={currentPath} />
          </div>
        </div>
      </div>
    </header>
  )
}
