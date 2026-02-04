'use client'

import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { UserMenu, GuestMenu } from '@/components/UserMenu'
import { Search, BookOpen, MessageSquare, Star } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { useSession } from 'next-auth/react'
import { useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export default function CoursesPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '')
  const selectedSchool = searchParams.get('school') || undefined

  // Fetch courses with tRPC
  const { data: courses, isLoading: coursesLoading } = trpc.course.list.useQuery({
    search: searchParams.get('search') || undefined,
    schoolId: selectedSchool,
    limit: 50,
  })

  // Fetch schools with tRPC
  const { data: schools, isLoading: schoolsLoading } = trpc.course.getSchools.useQuery()

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    if (searchInput) {
      params.set('search', searchInput)
    } else {
      params.delete('search')
    }
    router.push(`/courses?${params.toString()}`)
  }

  const handleSchoolFilter = (schoolId: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('school', schoolId)
    router.push(`/courses?${params.toString()}`)
  }

  const clearFilters = () => {
    router.push('/courses')
  }

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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Browse Courses</h1>
          <p className="text-slate-600">Explore UW Madison&apos;s course catalog with reviews from fellow students</p>
        </div>

        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by course code or name..."
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

          {/* School Filters */}
          {schoolsLoading ? (
            <div className="flex gap-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-8 w-24 bg-slate-200 animate-pulse rounded-full" />
              ))}
            </div>
          ) : (
            <div className="flex gap-2 flex-wrap">
              {schools?.slice(0, 8).map(school => (
                <button
                  key={school.id}
                  onClick={() => handleSchoolFilter(school.id)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    selectedSchool === school.id
                      ? 'bg-uw-red text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {school.name.replace(', College of', '').replace(', School of', '')}
                </button>
              ))}
              {selectedSchool && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-sm rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
                >
                  Clear filter
                </button>
              )}
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4">
          {coursesLoading ? (
            <div className="h-5 w-32 bg-slate-200 animate-pulse rounded" />
          ) : (
            <p className="text-sm text-slate-600">
              Showing {courses?.length || 0} courses
              {searchParams.get('search') && ` for "${searchParams.get('search')}"`}
            </p>
          )}
        </div>

        {/* Course Grid */}
        {coursesLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg border border-slate-200 p-4 animate-pulse">
                <div className="h-5 w-20 bg-slate-200 rounded mb-2" />
                <div className="h-4 w-full bg-slate-200 rounded mb-3" />
                <div className="h-4 w-24 bg-slate-200 rounded" />
              </div>
            ))}
          </div>
        ) : courses && courses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map(course => (
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
                    <p className="text-sm text-slate-600 mt-1">{course.name}</p>
                  </div>
                  <div className="text-sm text-slate-500">
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
              onClick={clearFilters}
              className="text-uw-red hover:text-uw-dark mt-2 inline-block"
            >
              View all courses
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
