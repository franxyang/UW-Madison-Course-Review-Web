'use client'

import { useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Logo } from '@/components/Logo'
import { UserMenu, GuestMenu } from '@/components/UserMenu'
import { MobileNav } from '@/components/MobileNav'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SearchWithPreview } from '@/components/SearchWithPreview'
import { DepartmentNav } from '@/components/courses/DepartmentNav'
import { FeaturedContent } from '@/components/courses/FeaturedContent'
import { CourseList, CourseNumberGrid } from '@/components/courses/CourseGrid'
import { DepartmentStats } from '@/components/courses/DepartmentStats'
import { QuickFilters, type QuickFilterValues } from '@/components/courses/QuickFilters'
import { trpc } from '@/lib/trpc/client'
import { toOfficialCode } from '@/lib/courseCodeDisplay'

export default function CoursesPage() {
  return (
    <Suspense fallback={<CoursesPageSkeleton />}>
      <CoursesPageContent />
    </Suspense>
  )
}

function CoursesPageSkeleton() {
  return (
    <div className="min-h-screen bg-surface-secondary">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="animate-pulse">
          <div className="h-10 w-64 bg-surface-tertiary rounded mb-6" />
          <div className="grid grid-cols-4 gap-6">
            <div className="h-96 bg-surface-tertiary rounded-xl" />
            <div className="col-span-2 h-96 bg-surface-tertiary rounded-xl" />
            <div className="h-96 bg-surface-tertiary rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

function CoursesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()

  // State
  const [selectedDept, setSelectedDept] = useState<string | null>(
    searchParams.get('dept') || null
  )
  const [filters, setFilters] = useState<QuickFilterValues>({
    levels: searchParams.get('level') ? [searchParams.get('level')!] : undefined,
    sortBy: 'reviews'
  })

  // Fetch department data when selected
  const { data: deptStats, isLoading: deptLoading } = trpc.course.getDepartmentStats.useQuery(
    { departmentCode: selectedDept! },
    { enabled: !!selectedDept }
  )

  // Filter and sort courses
  const filteredCourses = useMemo(() => {
    if (!deptStats?.courses) return []
    
    let courses = [...deptStats.courses]

    // Apply level filter
    if (filters.levels && filters.levels.length > 0) {
      courses = courses.filter(c => c.level && filters.levels!.includes(c.level))
    }

    // Apply GPA filter
    if (filters.minGPA !== undefined) {
      courses = courses.filter(c => c.avgGPA && c.avgGPA >= filters.minGPA!)
    }
    if (filters.maxGPA !== undefined) {
      courses = courses.filter(c => c.avgGPA && c.avgGPA <= filters.maxGPA!)
    }

    // Sort
    switch (filters.sortBy) {
      case 'gpa':
        courses.sort((a, b) => (b.avgGPA || 0) - (a.avgGPA || 0))
        break
      case 'code':
        courses.sort((a, b) => a.code.localeCompare(b.code))
        break
      case 'reviews':
      default:
        courses.sort((a, b) => b._count.reviews - a._count.reviews)
    }

    return courses
  }, [deptStats?.courses, filters])

  // Handle department selection
  const handleSelectDept = (deptCode: string | null) => {
    setSelectedDept(deptCode)
    // Update URL
    const params = new URLSearchParams(searchParams)
    if (deptCode) {
      params.set('dept', deptCode)
    } else {
      params.delete('dept')
    }
    router.replace(`/courses?${params.toString()}`, { scroll: false })
  }

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <header className="bg-surface-primary border-b border-surface-tertiary sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={32} />
              <span className="text-xl font-bold text-text-primary">WiscFlow</span>
            </Link>
            <div className="flex items-center gap-6">
              <nav className="hidden lg:flex items-center gap-6">
                <Link href="/courses" className="text-wf-crimson font-medium">Courses</Link>
                <Link href="/instructors" className="text-text-secondary hover:text-text-primary transition-colors">Instructors</Link>
                <Link href="/about" className="text-text-secondary hover:text-text-primary transition-colors">About</Link>
              </nav>
              <div className="hidden lg:flex items-center gap-2">
                <ThemeToggle />
                {session?.user ? <UserMenu user={session.user} /> : <GuestMenu />}
              </div>
              <div className="flex items-center gap-2 lg:hidden">
                <ThemeToggle />
                <MobileNav user={session?.user} currentPath="/courses" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {selectedDept ? (
                <span className="flex items-center gap-2">
                  <button 
                    onClick={() => handleSelectDept(null)}
                    className="text-text-tertiary hover:text-text-primary transition-colors"
                  >
                    Courses
                  </button>
                  <span className="text-text-tertiary">/</span>
                  <span>{selectedDept}</span>
                </span>
              ) : (
                'Browse Courses'
              )}
            </h1>
            {selectedDept && deptStats && (
              <p className="text-sm text-text-secondary mt-1">
                {deptStats.name} • {deptStats.courseCount} courses
              </p>
            )}
          </div>
          <div className="w-80">
            <SearchWithPreview placeholder="Search all courses..." />
          </div>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-[220px_1fr_260px] gap-6">
          {/* Left Column - Navigation */}
          <aside className="space-y-4">
            {selectedDept && deptStats ? (
              // Show course number grid when dept selected
              <div className="bg-surface-primary border border-surface-tertiary rounded-xl p-3">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-sm text-text-primary">{selectedDept}</h3>
                  <button
                    onClick={() => handleSelectDept(null)}
                    className="text-xs text-wf-crimson hover:text-wf-crimson-dark"
                  >
                    ← Back
                  </button>
                </div>
                <CourseNumberGrid courses={filteredCourses} />
              </div>
            ) : (
              // Show department navigation
              <DepartmentNav 
                selectedDept={selectedDept} 
                onSelectDept={handleSelectDept} 
              />
            )}
          </aside>

          {/* Middle Column - Main Content */}
          <div className="min-w-0">
            {selectedDept ? (
              // Show course list for selected department
              deptLoading ? (
                <div className="space-y-3 animate-pulse">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="h-20 bg-surface-tertiary rounded-lg" />
                  ))}
                </div>
              ) : (
                <div>
                  <div className="text-sm text-text-secondary mb-4">
                    Showing {filteredCourses.length} courses
                    {filters.levels && filters.levels.length > 0 && (
                      <span> • Level: {filters.levels.join(', ')}</span>
                    )}
                  </div>
                  <CourseList courses={filteredCourses} />
                </div>
              )
            ) : (
              // Show featured content
              <FeaturedContent />
            )}
          </div>

          {/* Right Column - Stats & Filters */}
          <aside className="space-y-4">
            {selectedDept ? (
              <DepartmentStats deptCode={selectedDept} />
            ) : null}
            <QuickFilters filters={filters} onChange={setFilters} />
          </aside>
        </div>
      </main>
    </div>
  )
}
