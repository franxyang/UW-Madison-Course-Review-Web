'use client'

import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { UserMenu, GuestMenu } from '@/components/UserMenu'
import { Search, BookOpen, MessageSquare, Star } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { useSession } from 'next-auth/react'
import { useState, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { FilterPanel, type CourseFilters } from '@/components/FilterPanel'
import { MobileNav } from '@/components/MobileNav'
import { SlidersHorizontal, X } from 'lucide-react'
import { toOfficialCode } from '@/lib/courseCodeDisplay'

export default function CoursesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface-primary flex items-center justify-center">
        <div className="animate-pulse text-text-tertiary">Loading courses...</div>
      </div>
    }>
      <CoursesPageContent />
    </Suspense>
  )
}

function CoursesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const [filters, setFilters] = useState<CourseFilters>({})
  const [page, setPage] = useState(0)
  const [showMobileFilters, setShowMobileFilters] = useState(false)
  const PAGE_SIZE = 30

  // Fetch courses with tRPC (all filters sent to backend)
  const { data, isLoading: coursesLoading } = trpc.course.list.useQuery({
    search: searchParams.get('search') || undefined,
    schoolIds: filters.schools,
    departmentIds: filters.departments,
    levels: filters.levels,
    minCredits: filters.minCredits,
    maxCredits: filters.maxCredits,
    minGPA: filters.minGPA,
    maxGPA: filters.maxGPA,
    instructorName: filters.instructorName,
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
    <div className="min-h-screen bg-surface-primary">
      {/* Header */}
      <header className="bg-surface-primary border-b border-surface-tertiary sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2">
                <Logo size={32} />
                <span className="text-xl font-bold text-text-primary">WiscFlow</span>
              </Link>
            </div>
            <div className="flex items-center gap-6">
              <nav className="hidden lg:flex items-center gap-6">
                <Link href="/courses" className="text-wf-crimson font-medium">
                  Courses
                </Link>
                <Link href="/instructors" className="text-text-secondary hover:text-text-primary transition-colors">
                  Instructors
                </Link>
                <Link href="/about" className="text-text-secondary hover:text-text-primary transition-colors">
                  About
                </Link>
              </nav>
              <div className="hidden lg:block">
                {session?.user ? <UserMenu user={session.user} /> : <GuestMenu />}
              </div>
              <MobileNav user={session?.user} currentPath="/courses" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-text-primary mb-2">Browse Courses</h1>
          <p className="text-text-secondary">Explore UW Madison&apos;s course catalog with reviews from fellow students</p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={20} />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by course code (CS 577, MATH 521) or name..."
              className="w-full pl-10 pr-4 py-2.5 bg-surface-primary border border-surface-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-wf-crimson transition-colors"
            />
          </div>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>

        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <button
            onClick={() => setShowMobileFilters(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface-primary border border-surface-tertiary rounded-lg text-sm font-medium text-text-primary hover:bg-hover-bg transition-colors"
          >
            <SlidersHorizontal size={16} />
            Filters
            {Object.values(filters).filter(v => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)).length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold bg-wf-crimson text-white rounded-full">
                {Object.values(filters).filter(v => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)).length}
              </span>
            )}
          </button>
        </div>

        {/* Mobile Filter Overlay */}
        {showMobileFilters && (
          <>
            <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setShowMobileFilters(false)} />
            <div className="fixed inset-y-0 left-0 z-50 w-80 bg-surface-secondary shadow-xl lg:hidden overflow-y-auto">
              <div className="flex items-center justify-between p-4 bg-surface-primary border-b border-surface-tertiary sticky top-0">
                <span className="font-semibold text-text-primary">Filters</span>
                <button onClick={() => setShowMobileFilters(false)} className="p-1 text-text-secondary hover:text-text-primary">
                  <X size={20} />
                </button>
              </div>
              <div className="p-4">
                <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
              </div>
            </div>
          </>
        )}

        {/* Main Layout: Sidebar + Content */}
        <div className="flex gap-6">
          {/* Left Sidebar - Filters (Desktop) */}
          <aside className="w-56 xl:w-64 flex-shrink-0 hidden lg:block">
            <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
          </aside>

          {/* Right Content - Course Grid */}
          <main className="flex-1 min-w-0">
            {/* Results Count */}
            <div className="mb-4">
              {coursesLoading ? (
                <div className="h-5 w-32 bg-surface-tertiary animate-pulse rounded" />
              ) : (
                <p className="text-sm text-text-secondary">
                  Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, totalCourses)} of {totalCourses} courses
                  {searchParams.get('search') && ` for "${searchParams.get('search')}"`}
                </p>
              )}
            </div>

            {/* Course Grid */}
            {coursesLoading ? (
              <div className="grid gap-4 md:grid-cols-2">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="card p-5 animate-pulse">
                    <div className="h-5 w-20 bg-surface-tertiary rounded mb-2" />
                    <div className="h-4 w-full bg-surface-tertiary rounded mb-3" />
                    <div className="h-4 w-24 bg-surface-tertiary rounded" />
                  </div>
                ))}
              </div>
            ) : sortedCourses.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {sortedCourses.map(course => {
                  // Calculate GPA color
                  const getGPAColor = (gpa: number) => {
                    if (gpa >= 3.5) return 'text-grade-excellent'
                    if (gpa >= 3.0) return 'text-grade-good'
                    if (gpa >= 2.5) return 'text-grade-average'
                    if (gpa >= 2.0) return 'text-grade-below'
                    return 'text-grade-poor'
                  }

                  return (
                    <Link
                      key={course.id}
                      href={`/courses/${course.id}`}
                      className="card p-5 group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-text-primary group-hover:text-wf-crimson transition-colors">
                            {toOfficialCode(course.code)}
                          </h3>
                          <p className="text-sm text-text-secondary mt-1 line-clamp-2">{course.name}</p>
                        </div>
                        <div className="text-sm text-text-tertiary flex-shrink-0 ml-3 font-medium">
                          {course.credits} cr
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-surface-tertiary">
                        <div className="text-xs text-text-secondary truncate max-w-[60%]">
                          {course.school.name}
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          {course._count.reviews > 0 && (
                            <div className="flex items-center gap-1 text-text-secondary">
                              <MessageSquare size={14} />
                              <span className="font-medium">{course._count.reviews}</span>
                            </div>
                          )}
                          {course.avgGPA != null && course.avgGPA > 0 && (
                            <div className={`flex items-center gap-1 font-semibold ${getGPAColor(course.avgGPA)}`}>
                              <Star size={14} />
                              <span>{course.avgGPA.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="mt-3">
                        <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-md border ${
                          course.level === 'Elementary'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : course.level === 'Intermediate'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-orange-50 text-orange-700 border-orange-200'
                        }`}>
                          {course.level}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="mx-auto h-12 w-12 text-text-tertiary mb-4" />
                <p className="text-text-secondary">No courses found</p>
                <button
                  onClick={() => {
                    setFilters({})
                    setPage(0)
                    router.push('/courses')
                  }}
                  className="text-wf-crimson hover:text-wf-crimson-dark font-medium mt-2 inline-block transition-colors"
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
                  className="px-4 py-2 text-sm font-medium border border-surface-tertiary rounded-lg hover:bg-hover-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
                      className={`w-10 h-10 text-sm font-medium rounded-lg transition-colors ${
                        page === pageNum
                          ? 'bg-wf-crimson text-white shadow-sm'
                          : 'border border-surface-tertiary hover:bg-hover-bg'
                      }`}
                    >
                      {pageNum + 1}
                    </button>
                  )
                })}
                
                <button
                  onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 text-sm font-medium border border-surface-tertiary rounded-lg hover:bg-hover-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
