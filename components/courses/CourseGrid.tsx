'use client'

import Link from 'next/link'
import { Star } from 'lucide-react'
import { toOfficialCode } from '@/lib/courseCodeDisplay'

interface Course {
  id: string
  code: string
  name: string
  avgGPA: number | null
  credits: number
  level?: string
  _count: { reviews: number }
}

interface CourseGridProps {
  courses: Course[]
  selectedCourse?: string | null
  onSelectCourse?: (courseId: string) => void
  compact?: boolean
}

function getGPAColor(gpa: number | null) {
  if (!gpa || gpa === 0) return 'text-text-tertiary'
  if (gpa >= 3.5) return 'text-emerald-500'
  if (gpa >= 3.0) return 'text-emerald-400'
  if (gpa >= 2.5) return 'text-amber-500'
  if (gpa >= 2.0) return 'text-orange-500'
  return 'text-red-500'
}

// Compact grid of course numbers (for left sidebar when dept selected)
export function CourseNumberGrid({ courses, selectedCourse }: CourseGridProps) {
  // Extract just the course number since dept is shown in header
  const getCourseNumber = (code: string) => {
    const parts = code.split(' ')
    return parts[parts.length - 1]
  }

  return (
    <div className="max-h-64 overflow-y-auto">
      <div className="grid grid-cols-2 gap-1.5">
        {courses.map(course => {
          const num = getCourseNumber(course.code)
          const isSelected = selectedCourse === course.id
          
          return (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors text-center ${
                isSelected
                  ? 'bg-wf-crimson text-white'
                  : 'bg-surface-secondary text-text-secondary hover:bg-wf-crimson/10 hover:text-wf-crimson'
              }`}
              title={`${toOfficialCode(course.code)}: ${course.name}`}
            >
              {num}
            </Link>
          )
        })}
      </div>
    </div>
  )
}

// Full course list (for middle section)
export function CourseList({ courses }: CourseGridProps) {
  return (
    <div className="space-y-2">
      {courses.map(course => (
        <Link
          key={course.id}
          href={`/courses/${course.id}`}
          className="block bg-surface-primary border border-surface-tertiary rounded-lg p-4 hover:border-wf-crimson/30 hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-text-primary">
                  {toOfficialCode(course.code)}
                </span>
                <span className="text-xs text-text-tertiary">
                  {course.credits} cr
                </span>
                {course.level && (
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    course.level === 'Elementary' ? 'bg-emerald-50 text-emerald-700' :
                    course.level === 'Intermediate' ? 'bg-amber-50 text-amber-700' :
                    'bg-orange-50 text-orange-700'
                  }`}>
                    {course.level}
                  </span>
                )}
              </div>
              <p className="text-sm text-text-secondary line-clamp-1">{course.name}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {course._count.reviews > 0 && (
                <div className="text-xs text-text-tertiary">
                  {course._count.reviews} reviews
                </div>
              )}
              {course.avgGPA != null && course.avgGPA > 0 && (
                <div className={`text-lg font-bold ${getGPAColor(course.avgGPA)}`}>
                  {course.avgGPA.toFixed(2)}
                </div>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  )
}

// Card grid for featured courses
export function CourseCardGrid({ courses }: CourseGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {courses.map(course => (
        <Link
          key={course.id}
          href={`/courses/${course.id}`}
          className="bg-surface-primary border border-surface-tertiary rounded-lg p-3 hover:border-wf-crimson/30 hover:shadow-sm transition-all"
        >
          <div className="flex items-start justify-between mb-1">
            <span className="font-semibold text-sm text-text-primary">
              {toOfficialCode(course.code)}
            </span>
            {course.avgGPA != null && course.avgGPA > 0 && (
              <span className={`text-sm font-bold ${getGPAColor(course.avgGPA)}`}>
                {course.avgGPA.toFixed(2)}
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary line-clamp-1 mb-2">{course.name}</p>
          <div className="flex items-center gap-2 text-xs text-text-tertiary">
            <Star size={10} className="text-amber-400" />
            <span>{course._count.reviews} reviews</span>
          </div>
        </Link>
      ))}
    </div>
  )
}
