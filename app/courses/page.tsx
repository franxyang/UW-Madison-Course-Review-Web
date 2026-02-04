'use client'

import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { UserMenu, GuestMenu } from '@/components/UserMenu'
import { Search, BookOpen, MessageSquare, Star } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { useSession } from 'next-auth/react'
import { useState, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { FilterPanel, type CourseFilters } from '@/components/FilterPanel'

export default function CoursesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState<CourseFilters>({})
  const [page, setPage] = useState(0)
  const PAGE_SIZE = 30

  // Fetch courses with tRPC (all filters sent to backend)
  const { data, isLoading: coursesLoading } = trpc.course.list.useQuery({
    search: searchParams.get('search') || undefined,
    schoolIds: filters.schools,
    departmentIds: filters.departments,
    levels: filters.levels,
    minCredits: filters.minCredits,
    maxCredits: filters.maxCredits,
    sortBy: (filters.sortBy as 'code' | 'relevance' | 'gpa' | 'reviews') || undefined,
    limit: PAGE_SIZE,
    offset: page * PAGE_SIZE,
  })

  const sortedCourses = data?.courses || []
  const totalCourses = data?.total || 0
  const totalPages = Math.ceil(totalCourses / PAGE_SIZE)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchInput) {
      params.set('search', searchInput)
    }
    router.push(`/courses?${params.toString()}`)
  }

  const handleFilterChange = useCallback((newFilters: CourseFilters) => {
    setFilters(newFilters)
    setPage(0) // Reset to first page when filters change
  }, [])

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
                <Link href="/courses" className="text-uw-red font-medium">
                  Courses
                </Link>
                <Link href="/reviews" className="text-slate-600 hover:text-slate-900">
                  Reviews
                </Link>
                <Link href="/about" className="text-slate-600 hover:text-slate-900">
                  About
                </Link>
              </nav>
              {session?.user ? <UserMenu user={session.user} /> : <GuestMenu />}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Browse Courses</h1>
          <p className="text-slate-600">Explore UW Madison&apos;s course catalog with reviews from fellow students</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by course code (CS 577, MATH 521) or name..."
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-uw-red/20 focus:border-uw-red"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2.5 bg-uw-red text-white rounded-lg hover:bg-uw-dark transition-colors font-medium"
          >
            Search
          </button>
        </form>

        {/* Main Layout: Sidebar + Content */}
        <div className="flex gap-6">
          {/* Left Sidebar - Filters */}
          <aside className="w-72 flex-shrink-0 hidden lg:block">
            <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
          </aside>

          {/* Right Content - Course Grid */}
          <main className="flex-1 min-w-0">
            {/* Results Count */}
            <div className="mb-4">
              {coursesLoading ? (
                <div className="h-5 w-32 bg-slate-200 animate-pulse rounded" />
              ) : (
                <p className="text-sm text-slate-600">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCourses)} of {totalCourses} courses
                  {searchParams.get('search') && ` for "${searchParams.get('search')}"`}
                </p>
              )}
            </div>

            {/* Course Grid */}
            {coursesLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
                    <div className="h-5 w-20 bg-slate-200 rounded mb-2" />
                    <div className="h-4 w-full bg-slate-200 rounded mb-3" />
                    <div className="h-4 w-24 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            ) : sortedCourses.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {sortedCourses.map(course => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow group"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-uw-red transition-colors">
                          {course.code}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1 line-clamp-2">{course.name}</p>
                      </div>
                      <div className="text-sm text-slate-500 flex-shrink-0 ml-2">
                        {course.credits} cr
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100">
                      <div className="text-xs text-slate-500 truncate max-w-[60%]">
                        {course.school.name}
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        {course._count.reviews > 0 && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <MessageSquare size={14} />
                            <span>{course._count.reviews}</span>
                          </div>
                        )}
                        {course.avgGPA && (
                          <div className="flex items-center gap-1 text-slate-600">
                            <Star size={14} />
                            <span>{course.avgGPA.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        course.level === 'Elementary'
                          ? 'bg-green-100 text-green-700'
                          : course.level === 'Intermediate'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {course.level}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                <p className="text-slate-600">No courses found</p>
                <button
                  onClick={() => {
                    setFilters({})
                    setPage(0)
                    router.push('/courses')
                  }}
                  className="text-uw-red hover:text-uw-dark mt-2 inline-block"
                >
                  Clear filters and view all courses
                </button>
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
                
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 7) {
                    pageNum = i
                  } else if (page < 3) {
                    pageNum = i
                  } else if (page > totalPages - 4) {
                    pageNum = totalPages - 7 + i
                  } else {
                    pageNum = page - 3 + i
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`w-10 h-10 text-sm rounded-lg ${
                        page === pageNum
                          ? 'bg-uw-red text-white'
                          : 'border border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Next →
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  )
}
