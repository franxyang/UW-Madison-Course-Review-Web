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

interface FeaturedContentProps {
  onLevelSelect?: (level: string) => void
}

export function FeaturedContent({ onLevelSelect }: FeaturedContentProps = {}) {
  const { data, isLoading, error } = trpc.course.getFeatured.useQuery()

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

  if (error) {
    return (
      <div className="text-center py-12 text-text-secondary">
        <p>Failed to load featured courses</p>
        <p className="text-xs text-text-tertiary mt-1">{error.message}</p>
      </div>
    )
  }

  if (!data) return null
  
  const { mostReviewed, recentReviews } = data

  return (
    <div className="space-y-6">
      {/* Most Reviewed */}
      <div>
        <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-wf-crimson" />
          Most Reviewed Courses
        </h2>
        {mostReviewed.length > 0 ? (
          <CourseCardGrid courses={mostReviewed} />
        ) : (
          <p className="text-sm text-text-tertiary">No reviewed courses yet</p>
        )}
      </div>

      {/* Recent Reviews */}
      <div>
        <h2 className="font-semibold text-text-primary mb-4 flex items-center gap-2">
          <Clock size={18} className="text-text-tertiary" />
          Recent Reviews
        </h2>
        {recentReviews.length > 0 ? (
        <div className="space-y-2">
          {recentReviews.map(review => (
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
        ) : (
          <p className="text-sm text-text-tertiary">No reviews yet</p>
        )}
      </div>

      {/* Browse by Level */}
      <div>
        <h2 className="font-semibold text-text-primary mb-4">Browse by Level</h2>
        <div className="flex gap-2">
          {[
            { level: 'Elementary', label: '100-200 level', bgColor: 'bg-emerald-50 dark:bg-emerald-900/20', borderColor: 'border-emerald-200 dark:border-emerald-800', hoverColor: 'hover:bg-emerald-100 dark:hover:bg-emerald-900/30', textColor: 'text-emerald-700 dark:text-emerald-300', subColor: 'text-emerald-600 dark:text-emerald-400' },
            { level: 'Intermediate', label: '300-400 level', bgColor: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800', hoverColor: 'hover:bg-amber-100 dark:hover:bg-amber-900/30', textColor: 'text-amber-700 dark:text-amber-300', subColor: 'text-amber-600 dark:text-amber-400' },
            { level: 'Advanced', label: '500+ level', bgColor: 'bg-orange-50 dark:bg-orange-900/20', borderColor: 'border-orange-200 dark:border-orange-800', hoverColor: 'hover:bg-orange-100 dark:hover:bg-orange-900/30', textColor: 'text-orange-700 dark:text-orange-300', subColor: 'text-orange-600 dark:text-orange-400' },
          ].map(({ level, label, bgColor, borderColor, hoverColor, textColor, subColor }) => (
            <button
              key={level}
              onClick={() => onLevelSelect?.(level)}
              className={`flex-1 p-3 ${bgColor} border ${borderColor} rounded-lg text-center ${hoverColor} transition-colors cursor-pointer`}
            >
              <div className={`font-semibold ${textColor}`}>{level}</div>
              <div className={`text-xs ${subColor}`}>{label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
