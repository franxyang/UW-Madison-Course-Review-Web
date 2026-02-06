'use client'

import Link from 'next/link'
import { BookOpen, Star, MessageSquare, TrendingUp } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { toOfficialCode } from '@/lib/courseCodeDisplay'

interface DepartmentStatsProps {
  deptCode: string
}

function getGPAColor(gpa: number | null) {
  if (!gpa || gpa === 0) return 'text-text-tertiary'
  if (gpa >= 3.5) return 'text-emerald-500'
  if (gpa >= 3.0) return 'text-emerald-400'
  if (gpa >= 2.5) return 'text-amber-500'
  if (gpa >= 2.0) return 'text-orange-500'
  return 'text-red-500'
}

export function DepartmentStats({ deptCode }: DepartmentStatsProps) {
  const { data: stats, isLoading } = trpc.course.getDepartmentStats.useQuery(
    { departmentCode: deptCode },
    { enabled: !!deptCode }
  )

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-24 bg-surface-tertiary rounded-lg" />
        <div className="h-32 bg-surface-tertiary rounded-lg" />
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-4">
      {/* Department Overview */}
      <div className="bg-surface-primary border border-surface-tertiary rounded-xl p-4">
        <h3 className="font-semibold text-text-primary mb-1">{stats.code}</h3>
        <p className="text-sm text-text-secondary mb-4">{stats.name}</p>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-surface-secondary rounded-lg">
            <BookOpen size={16} className="mx-auto mb-1 text-wf-crimson" />
            <div className="text-lg font-bold text-text-primary">{stats.courseCount}</div>
            <div className="text-xs text-text-tertiary">Courses</div>
          </div>
          <div className="text-center p-2 bg-surface-secondary rounded-lg">
            <MessageSquare size={16} className="mx-auto mb-1 text-emerald-500" />
            <div className="text-lg font-bold text-text-primary">{stats.totalReviews}</div>
            <div className="text-xs text-text-tertiary">Reviews</div>
          </div>
        </div>

        {stats.avgGPA && stats.avgGPA > 0 && (
          <div className="mt-3 pt-3 border-t border-surface-tertiary flex items-center justify-between">
            <span className="text-sm text-text-secondary">Average GPA</span>
            <span className={`text-lg font-bold ${getGPAColor(stats.avgGPA)}`}>
              {stats.avgGPA.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Top Courses */}
      {stats.topCourses.length > 0 && (
        <div className="bg-surface-primary border border-surface-tertiary rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-surface-tertiary">
            <h4 className="font-medium text-sm text-text-primary flex items-center gap-2">
              <Star size={14} className="text-amber-400" />
              Most Reviewed
            </h4>
          </div>
          <div className="divide-y divide-surface-tertiary">
            {stats.topCourses.map(course => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="flex items-center justify-between px-4 py-2.5 hover:bg-hover-bg transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-text-primary truncate">
                    {toOfficialCode(course.code)}
                  </div>
                  <div className="text-xs text-text-tertiary">
                    {course._count.reviews} reviews
                  </div>
                </div>
                {course.avgGPA != null && course.avgGPA > 0 && (
                  <span className={`text-sm font-bold ${getGPAColor(course.avgGPA)}`}>
                    {course.avgGPA.toFixed(2)}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
