'use client'

import { notFound, useParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { CoursePageLayout } from '@/components/CoursePageLayout'
import { trpc } from '@/lib/trpc/client'

export default function CoursePage() {
  const params = useParams()
  const id = params.id as string

  // Fetch course with tRPC
  const { data: course, isLoading, error } = trpc.course.byId.useQuery({ id })
  
  // Fetch related courses (same department) - prioritize same level
  const deptCode = course?.code ? course.code.split(' ').slice(0, -1).join(' ') : ''
  const courseLevel = course?.level || '' // legacy fallback for malformed course codes
  
  const { data: sameDeptCourses } = trpc.course.sameDepartment.useQuery(
    { 
      codePrefix: deptCode,
      currentCode: course?.code || '',
      currentLevel: courseLevel, // Pass text level (e.g., "Advanced") for exact match
      limit: 12
    },
    { 
      enabled: deptCode.length > 1 && !!course,
    }
  )

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-secondary">
        {/* Header Skeleton */}
        <header className="bg-surface-primary border-b border-surface-tertiary">
          <div className="max-w-[1400px] mx-auto px-6">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <Logo size={32} />
              </div>
            </div>
          </div>
        </header>

        {/* Loading State - 3 Column */}
        <div className="max-w-[1400px] mx-auto px-6 py-8">
          <div className="flex gap-8">
            {/* Left Skeleton */}
            <div className="w-[200px] flex-shrink-0 space-y-4">
              <div className="h-10 bg-surface-tertiary rounded-lg animate-pulse" />
              <div className="h-32 bg-surface-tertiary rounded-lg animate-pulse" />
            </div>
            
            {/* Main Skeleton */}
            <div className="flex-1 space-y-4">
              <div className="h-6 w-48 bg-surface-tertiary rounded animate-pulse" />
              <div className="h-48 bg-surface-tertiary rounded-xl animate-pulse" />
              <div className="h-12 bg-surface-tertiary rounded-lg animate-pulse" />
              <div className="h-64 bg-surface-tertiary rounded-xl animate-pulse" />
            </div>
            
            {/* Right Skeleton */}
            <div className="w-[280px] flex-shrink-0 space-y-4">
              <div className="h-20 bg-surface-tertiary rounded-lg animate-pulse" />
              <div className="h-32 bg-surface-tertiary rounded-lg animate-pulse" />
              <div className="h-12 bg-surface-tertiary rounded-lg animate-pulse" />
              <div className="h-48 bg-surface-tertiary rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    notFound()
  }

  // Same department courses (already filtered and sorted by tRPC)
  const filteredRelatedCourses = sameDeptCourses || []

  return (
    <CoursePageLayout 
      course={course as any} 
      relatedCourses={filteredRelatedCourses}
    />
  )
}
