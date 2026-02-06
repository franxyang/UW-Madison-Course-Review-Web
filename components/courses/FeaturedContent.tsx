'use client'

import Link from 'next/link'
import { Star, Clock, TrendingUp } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { toOfficialCode } from '@/lib/courseCodeDisplay'
import { CourseCardGrid } from './CourseGrid'

function getGPAColor(gpa: number | null) {
  if (!gpa || gpa === 0) return 'text-text-tertiary'
  if (gpa >= 3.5) return 'text-emerald-500'
  if (gpa >= 3.0) return 'text-emerald-400'
  if (gpa >= 2.5) return 'text-amber-500'
  if (gpa >= 2.0) return 'text-orange-500'
  return 'text-red-500'
}

function getRatingColor(rating: string) {
  const colors: Record<string, string> = {
    'A': 'text-emerald-600',
    'AB': 'text-emerald-500',
    'B': 'text-amber-600',
    'BC': 'text-amber-500',
    'C': 'text-orange-500',
    'D': 'text-red-500',
    'F': 'text-red-600'
  }
  return colors[rating] || 'text-text-secondary'
}

export function FeaturedContent() {
  const { data, isLoading } = trpc.course.getFeatured.useQuery()

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-48 bg-surface-tertiary rounded" />
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-24 bg-surface-tertiary rounded-lg" />
          ))}
        </div>
        <div className="h-8 w-48 bg-surface-tertiary rounded mt-6" />
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-surface-tertiary rounded-lg" />
          ))}
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="space-y-6">
      {/* Most Reviewed */}
      <div>
        <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-wf-crimson" />
          Most Reviewed Courses
        </h2>
        <CourseCardGrid courses={data.mostReviewed} />
      </div>

      {/* Recent Reviews */}
      <div>
        <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Clock size={18} className="text-text-tertiary" />
          Recent Reviews
        </h2>
        <div className="space-y-2">
          {data.recentReviews.map(review => (
            <Link
              key={review.id}
              href={`/courses/${review.course.id}`}
              className="block bg-surface-primary border border-surface-tertiary rounded-lg p-3 hover:border-wf-crimson/30 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-sm text-wf-crimson">
                      {toOfficialCode(review.course.code)}
                    </span>
                    <span className={`text-xs font-semibold ${getRatingColor(review.contentRating)}`}>
                      {review.contentRating}
                    </span>
                  </div>
                  {review.title && (
                    <p className="text-sm text-text-secondary line-clamp-1">
                      &quot;{review.title}&quot;
                    </p>
                  )}
                </div>
                <span className="text-xs text-text-tertiary whitespace-nowrap">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Browse by Level */}
      <div>
        <h2 className="font-semibold text-text-primary mb-4">Browse by Level</h2>
        <div className="flex gap-2">
          <Link
            href="/courses?level=Elementary"
            className="flex-1 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-center hover:bg-emerald-100 transition-colors"
          >
            <div className="font-semibold text-emerald-700">Elementary</div>
            <div className="text-xs text-emerald-600">100-200 level</div>
          </Link>
          <Link
            href="/courses?level=Intermediate"
            className="flex-1 p-3 bg-amber-50 border border-amber-200 rounded-lg text-center hover:bg-amber-100 transition-colors"
          >
            <div className="font-semibold text-amber-700">Intermediate</div>
            <div className="text-xs text-amber-600">300-400 level</div>
          </Link>
          <Link
            href="/courses?level=Advanced"
            className="flex-1 p-3 bg-orange-50 border border-orange-200 rounded-lg text-center hover:bg-orange-100 transition-colors"
          >
            <div className="font-semibold text-orange-700">Advanced</div>
            <div className="text-xs text-orange-600">500+ level</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
