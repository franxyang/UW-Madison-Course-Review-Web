'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { UserMenu, GuestMenu } from '@/components/UserMenu'
import { Search, Users, BookOpen, MessageSquare, ChevronRight } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { useSession } from 'next-auth/react'

export default function InstructorsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50/50 flex items-center justify-center">
        <div className="animate-pulse text-slate-400">Loading instructors...</div>
      </div>
    }>
      <InstructorsPageContent />
    </Suspense>
  )
}

function InstructorsPageContent() {
  const { data: session } = useSession()
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(0)
  const [sortBy, setSortBy] = useState<'name' | 'reviews' | 'courses'>('name')
  const PAGE_SIZE = 30

  const { data, isLoading } = trpc.instructor.list.useQuery({
    search: search || undefined,
    sortBy,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })

  const instructors = data?.instructors || []
  const total = data?.total || 0
  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <Logo size={32} />
                <span className="text-xl font-bold text-slate-900">WiscFlow</span>
              </Link>
            </div>
            <div className="flex items-center gap-6">
              <nav className="flex items-center gap-6">
                <Link href="/courses" className="text-slate-600 hover:text-slate-900">Courses</Link>
                <Link href="/instructors" className="text-uw-red font-medium">Instructors</Link>
                <Link href="/about" className="text-slate-600 hover:text-slate-900">About</Link>
              </nav>
              {session?.user ? <UserMenu user={session.user} /> : <GuestMenu />}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Instructors</h1>
          <p className="text-slate-600">Browse UW-Madison instructors and their course reviews</p>
        </div>

        {/* Search + Sort */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0) }}
              placeholder="Search by instructor name..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-uw-red/20 focus:border-uw-red"
            />
          </div>
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value as any); setPage(0) }}
            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-uw-red/20 focus:border-uw-red"
          >
            <option value="name">Sort: Name (A-Z)</option>
            <option value="reviews">Sort: Most Reviews</option>
            <option value="courses">Sort: Most Courses</option>
          </select>
        </div>

        {/* Results Count */}
        <div className="mb-4">
          {isLoading ? (
            <div className="h-5 w-32 bg-slate-200 animate-pulse rounded" />
          ) : (
            <p className="text-sm text-slate-600">
              Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, total)} of {total} instructors
              {search && ` matching "${search}"`}
            </p>
          )}
        </div>

        {/* Instructor Grid */}
        {isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 p-5 animate-pulse">
                <div className="h-5 w-40 bg-slate-200 rounded mb-3" />
                <div className="h-4 w-24 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : instructors.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {instructors.map(instructor => (
              <Link
                key={instructor.id}
                href={`/instructors/${instructor.id}`}
                className="bg-white rounded-lg border border-slate-200 p-5 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-semibold text-sm">
                      {instructor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <h3 className="font-semibold text-slate-900 group-hover:text-uw-red transition-colors">
                      {instructor.name}
                    </h3>
                  </div>
                  <ChevronRight size={16} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center gap-4 text-sm text-slate-600">
                  <div className="flex items-center gap-1">
                    <BookOpen size={14} />
                    <span>{instructor._count.courses} course{instructor._count.courses !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MessageSquare size={14} />
                    <span>{instructor._count.reviews} review{instructor._count.reviews !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-slate-300 mb-4" />
            <p className="text-slate-600">No instructors found</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <span className="text-sm text-slate-600">
              Page {page + 1} of {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
              disabled={page >= totalPages - 1}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
