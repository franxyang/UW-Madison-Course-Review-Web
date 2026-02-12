import Link from 'next/link'
import { Header } from '@/components/Header'

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <Header currentPath="/about" />

      <div className="max-w-4xl mx-auto px-6 pt-8">
        <nav className="flex items-center gap-2 rounded-xl border border-surface-tertiary bg-surface-primary p-1">
          <Link
            href="/about"
            className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
          >
            Overview
          </Link>
          <Link
            href="/about/updates"
            className="rounded-lg px-4 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-surface-secondary hover:text-text-primary"
          >
            Updates
          </Link>
        </nav>
      </div>

      {children}
    </div>
  )
}
