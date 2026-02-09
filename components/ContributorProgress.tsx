'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc/client'
import { Star, TrendingUp, Award } from 'lucide-react'

const LEVELS = [
  { name: 'Newcomer', minXP: 0, color: 'text-slate-600 dark:text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800' },
  { name: 'Contributor', minXP: 50, color: 'text-emerald-600', bg: 'bg-emerald-100' },
  { name: 'Regular', minXP: 150, color: 'text-blue-600', bg: 'bg-blue-100' },
  { name: 'Veteran', minXP: 400, color: 'text-purple-600', bg: 'bg-purple-100' },
  { name: 'Expert', minXP: 800, color: 'text-amber-600', bg: 'bg-amber-100' },
  { name: 'Legend', minXP: 1500, color: 'text-wf-crimson', bg: 'bg-red-100' },
]

function getLevel(xp: number) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return { level: LEVELS[i], index: i }
  }
  return { level: LEVELS[0], index: 0 }
}

function getNextLevel(xp: number) {
  const { index } = getLevel(xp)
  return index < LEVELS.length - 1 ? LEVELS[index + 1] : null
}

export function ContributorProgress() {
  const { data: session } = useSession()
  
  // Would need a tRPC endpoint to get user stats
  // For now, show a placeholder that links to profile
  
  if (!session?.user) {
    return (
      <div className="bg-surface-primary border border-surface-tertiary rounded-xl p-5">
        <h3 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
          <Award size={18} className="text-wf-crimson" />
          Join Our Community
        </h3>
        <p className="text-sm text-text-secondary mb-4">
          Sign in to track your contributions, earn XP, and level up!
        </p>
        <Link 
          href="/auth/signin"
          className="block w-full py-2 text-center text-sm font-medium bg-wf-crimson text-white rounded-lg hover:bg-wf-crimson-dark transition-colors"
        >
          Sign In to Continue
        </Link>
      </div>
    )
  }

  // Logged in user - show progress
  return (
    <Link href="/profile" className="block">
      <div className="bg-surface-primary border border-surface-tertiary rounded-xl p-5 hover:border-wf-crimson/30 transition-colors">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-wf-crimson text-white flex items-center justify-center font-semibold">
            {(session.user as any).nickname?.[0]?.toUpperCase() || session.user.email?.[0]?.toUpperCase() || 'U'}
          </div>
          <div>
            <div className="font-medium text-text-primary">
              {(session.user as any).nickname || session.user.name || 'Anonymous Badger'}
            </div>
            <div className="text-xs text-text-tertiary">
              View your progress →
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <Star size={12} className="text-amber-400" />
          <span>Write reviews to earn XP and unlock full access</span>
        </div>
      </div>
    </Link>
  )
}
