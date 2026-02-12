'use client'

import Link from 'next/link'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { toOfficialCode } from '@/lib/courseCodeDisplay'
import { gpaToLetterGrade } from '@/lib/gpaLetter'

function getScoreColor(score: number) {
  if (score >= 3.5) return 'text-emerald-500'
  if (score >= 3.0) return 'text-emerald-400'
  if (score >= 2.5) return 'text-amber-500'
  if (score >= 2.0) return 'text-orange-500'
  return 'text-red-500'
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
  
  const { highestRated, lowestRated } = data

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Highest Rated */}
        <section className="bg-surface-primary border border-surface-tertiary rounded-xl p-4">
          <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
            <TrendingUp size={18} className="text-wf-crimson" />
            Highest Rated Courses
          </h2>
          {highestRated.length > 0 ? (
            <div className="max-h-[270px] overflow-y-auto scrollbar-hide pr-1 space-y-2">
              {highestRated.map(course => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-surface-tertiary px-3 py-2 hover:border-wf-crimson/30 hover:bg-hover-bg transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-text-primary truncate">
                      {toOfficialCode(course.code)}
                    </div>
                    <div className="text-xs text-text-secondary truncate">{course.name}</div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <div className={`text-sm font-semibold ${getScoreColor(course.ratingScore)}`}>
                      {course.ratingScore.toFixed(2)} ({gpaToLetterGrade(course.ratingScore)})
                    </div>
                    <div className="text-[11px] text-text-tertiary">{course.reviewCount} reviews</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary">No reviewed courses yet</p>
          )}
        </section>

        {/* Lowest Rated */}
        <section className="bg-surface-primary border border-surface-tertiary rounded-xl p-4">
          <h2 className="font-semibold text-text-primary mb-3 flex items-center gap-2">
            <TrendingDown size={18} className="text-red-500" />
            Lowest Rated Courses
          </h2>
          {lowestRated.length > 0 ? (
            <div className="max-h-[270px] overflow-y-auto scrollbar-hide pr-1 space-y-2">
              {lowestRated.map(course => (
                <Link
                  key={course.id}
                  href={`/courses/${course.id}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-surface-tertiary px-3 py-2 hover:border-wf-crimson/30 hover:bg-hover-bg transition-colors"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-text-primary truncate">
                      {toOfficialCode(course.code)}
                    </div>
                    <div className="text-xs text-text-secondary truncate">{course.name}</div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <div className={`text-sm font-semibold ${getScoreColor(course.ratingScore)}`}>
                      {course.ratingScore.toFixed(2)} ({gpaToLetterGrade(course.ratingScore)})
                    </div>
                    <div className="text-[11px] text-text-tertiary">{course.reviewCount} reviews</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary">Not enough reviewed courses yet</p>
          )}
        </section>
      </div>

      {/* Browse by Level */}
      <div>
        <h2 className="font-semibold text-text-primary mb-4">Browse by Level</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
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
