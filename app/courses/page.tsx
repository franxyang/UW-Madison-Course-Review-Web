'use client'

import { useState, useMemo, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Header } from '@/components/Header'
import { SearchWithPreview } from '@/components/SearchWithPreview'
import { DepartmentNav } from '@/components/courses/DepartmentNav'
import { FeaturedContent } from '@/components/courses/FeaturedContent'
import { CourseList, CourseNumberGrid } from '@/components/courses/CourseGrid'
import { DepartmentStats } from '@/components/courses/DepartmentStats'
import { QuickFilters, type QuickFilterValues } from '@/components/courses/QuickFilters'
import { trpc } from '@/lib/trpc/client'

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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="hidden lg:block h-96 bg-surface-tertiary rounded-xl" />
            <div className="lg:col-span-2 h-96 bg-surface-tertiary rounded-xl" />
            <div className="hidden lg:block h-96 bg-surface-tertiary rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

function CoursesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // State
  const [selectedDept, setSelectedDept] = useState<string | null>(
    searchParams.get('dept') || null
  )
  const [filters, setFilters] = useState<QuickFilterValues>({
    levels: searchParams.get('level') ? [searchParams.get('level')!] : undefined
  })

  const effectiveSortBy = (filters.sortBy as 'reviews' | 'gpa' | 'code' | undefined) || 'reviews'
  const hasHomepageFilters =
    !selectedDept &&
    ((filters.levels?.length || 0) > 0 ||
      filters.minGPA !== undefined ||
      filters.maxGPA !== undefined)

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
    switch (effectiveSortBy) {
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
  }, [deptStats?.courses, filters, effectiveSortBy])

  const {
    data: homepageFilteredData,
    isLoading: homepageFilteredLoading,
  } = trpc.course.list.useQuery(
    {
      levels: filters.levels,
      minGPA: filters.minGPA,
      maxGPA: filters.maxGPA,
      sortBy: effectiveSortBy,
      limit: 100,
      offset: 0,
    },
    {
      enabled: hasHomepageFilters,
    },
  )
  const homepageFilteredCourses = homepageFilteredData?.courses ?? []

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
      <Header currentPath="/courses" />

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
        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_260px] gap-6">
          {/* Left Column - Navigation (hidden on mobile) */}
          <aside className="hidden lg:block space-y-4">
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
              hasHomepageFilters ? (
                homepageFilteredLoading ? (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2, 3, 4, 5].map(i => (
                      <div key={i} className="h-20 bg-surface-tertiary rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <div>
                    <div className="text-sm text-text-secondary mb-4">
                      Showing {homepageFilteredData?.total || 0} courses
                      {filters.levels && filters.levels.length > 0 && (
                        <span> • Level: {filters.levels.join(', ')}</span>
                      )}
                      {(filters.minGPA !== undefined || filters.maxGPA !== undefined) && (
                        <span>
                          {' '}
                          • GPA: {filters.minGPA?.toFixed(1) ?? '0.0'} - {filters.maxGPA?.toFixed(1) ?? '4.0'}
                        </span>
                      )}
                    </div>
                    {homepageFilteredCourses.length > 0 ? (
                      <CourseList courses={homepageFilteredCourses} />
                    ) : (
                      <div className="bg-surface-primary border border-surface-tertiary rounded-xl p-12 text-center text-text-secondary">
                        No courses match your filters.
                      </div>
                    )}
                  </div>
                )
              ) : (
                // Show featured content
                <FeaturedContent onLevelSelect={(level) => {
                  setFilters(prev => ({ ...prev, levels: [level] }))
                }} />
              )
            )}
          </div>

          {/* Right Column - Stats & Filters (hidden on mobile) */}
          <aside className="hidden lg:block space-y-4">
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
