'use client'

import { useState, useMemo, useRef, useEffect, lazy, Suspense } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useSearchParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { trpc } from '@/lib/trpc/client'
import { useDebounce } from '@/lib/hooks/useDebounce'
import { Logo } from '@/components/Logo'
import { Header } from '@/components/Header'
import { VoteButton } from '@/components/VoteButton'
import { ContributorBadge } from '@/components/ContributorBadge'
import { ReviewActions } from '@/components/ReviewActions'

// Lazy load heavier components (not needed on initial render)
const ReviewForm = dynamic(() => import('@/components/ReviewForm').then(m => ({ default: m.ReviewForm })), {
  loading: () => <div className="h-12 bg-surface-secondary rounded-lg animate-pulse" />,
})
const CommentSection = dynamic(() => import('@/components/CommentSection').then(m => ({ default: m.CommentSection })), {
  loading: () => <div className="h-8 bg-surface-secondary rounded animate-pulse" />,
})
const ReportButton = dynamic(() => import('@/components/ReportButton').then(m => ({ default: m.ReportButton })), {
  ssr: false,
})
import { ReviewGateOverlay, FrostedInlineLock, FrostedReview } from '@/components/ReviewGate'
import { toOfficialCode, getOfficialDeptPrefix, getCourseNumber } from '@/lib/courseCodeDisplay'
import { normalizeInstructorName } from '@/lib/instructorName'
import {
  ChevronRight,
  Building,
  BookOpen,
  Calendar,
  AlertCircle,
  MessageSquare,
  Search,
  Filter,
  ChevronDown,
  X,
} from 'lucide-react'
// ThemeToggle now handled by Header component

// Types
interface Course {
  id: string
  code: string
  name: string
  description: string | null
  credits: number
  level: string
  lastOffered: string | null
  avgGPA: number | null
  prerequisiteText: string | null
  breadths: string | null
  school: { name: string }
  reviews: any[]
  gradeDistributions: {
    id: string
    term: string
    aCount: number
    abCount: number
    bCount: number
    bcCount: number
    cCount: number
    dCount: number
    fCount: number
    totalGraded: number
    avgGPA: number
    instructorId: string | null
    instructor: { id: string; name: string } | null
  }[]
  instructors?: { instructor: { id: string; name: string } }[]
  prerequisites: { id: string; code: string; name: string }[]
  prerequisiteFor: { id: string; code: string; name: string }[]
  reviewAccess: {
    hasFullAccess: boolean
    userReviewCount: number
    totalReviews: number
    previewCount: number
    isLoggedIn: boolean
    requireSignInToViewReviews: boolean
    requireContributionToViewFullReviews: boolean
    restrictionReason: 'none' | 'signin' | 'contribution' | 'signin+contribution'
  }
  departments?: { department: { code: string; name: string } }[]
  crossListGroup?: {
    id: string
    displayCode: string | null
    courses: { id: string; code: string; name: string; avgGPA: number | null }[]
  } | null
  dataSourceCourseId?: string
  canonicalCourseId?: string
  canonicalCode?: string
  isCrossListedSharedData?: boolean
  sharedFromCode?: string | null
  crossListedCodes?: string[]
}

interface RelatedCourse {
  id: string
  code: string
  name: string
  avgGPA: number | null
}

type InstructorFacet = {
  id: string
  name: string
  instructorIds: string[]
  terms: string[]
  hasOfficialGpa: boolean
  reviewCount: number
}

const GRADE_ORDER = ['A', 'AB', 'B', 'BC', 'C', 'D', 'F']
type ReviewDensity = 'mild' | 'dense'

// Helper functions
function getGradeColor(grade: string) {
  const gradeColors: Record<string, string> = {
    'A': 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    'AB': 'bg-emerald-50 text-emerald-600 border border-emerald-100',
    'B': 'bg-amber-50 text-amber-700 border border-amber-200',
    'BC': 'bg-amber-50 text-amber-600 border border-amber-100',
    'C': 'bg-orange-50 text-orange-700 border border-orange-200',
    'D': 'bg-red-50 text-red-600 border border-red-200',
    'F': 'bg-red-50 text-red-700 border border-red-300'
  }
  return gradeColors[grade] || 'bg-surface-secondary text-text-secondary border border-surface-tertiary'
}

// Phase 3 Unification: Use preset classes from globals.css
function getRatingColor(rating: string) {
  const classes: Record<string, string> = {
    'A': 'grade-badge-a',
    'AB': 'grade-badge-ab',
    'B': 'grade-badge-b',
    'BC': 'grade-badge-bc',
    'C': 'grade-badge-c',
    'D': 'grade-badge-d',
    'F': 'grade-badge-f'
  }
  return classes[rating] || 'bg-surface-secondary border-surface-tertiary text-text-secondary'
}

function getRatingCircleColor(rating: string) {
  const colors: Record<string, string> = {
    'A': 'bg-emerald-500',
    'AB': 'bg-emerald-400',
    'B': 'bg-amber-500',
    'BC': 'bg-amber-400',
    'C': 'bg-orange-500',
    'D': 'bg-red-400',
    'F': 'bg-red-500'
  }
  return colors[rating] || 'bg-gray-400'
}

function getBarColor(grade: string) {
  const colors: Record<string, string> = {
    'A': 'bg-emerald-500',
    'AB': 'bg-emerald-400',
    'B': 'bg-amber-400',
    'BC': 'bg-amber-500',
    'C': 'bg-orange-400',
    'D': 'bg-red-400',
    'F': 'bg-red-500'
  }
  return colors[grade] || 'bg-gray-300'
}

// GPA color gradient (4.0 green → 0.0 red)
function getGPAColor(gpa: number | null): string {
  if (gpa === null) return 'text-text-tertiary'
  if (gpa >= 3.7) return 'text-emerald-500'
  if (gpa >= 3.3) return 'text-emerald-400'
  if (gpa >= 3.0) return 'text-lime-500'
  if (gpa >= 2.7) return 'text-amber-400'
  if (gpa >= 2.3) return 'text-amber-500'
  if (gpa >= 2.0) return 'text-orange-400'
  if (gpa >= 1.5) return 'text-orange-500'
  if (gpa >= 1.0) return 'text-red-400'
  return 'text-red-500'
}

function buildCrossListTitle(codes: string[], canonicalCode?: string | null): string {
  const uniqueCodes = [...new Set(codes.map((code) => code.trim()).filter(Boolean))]
  if (uniqueCodes.length === 0) return ''

  const canonical = canonicalCode?.trim()
  const orderedCodes = [...uniqueCodes].sort((a, b) => {
    if (canonical) {
      if (a === canonical) return -1
      if (b === canonical) return 1
    }
    return a.localeCompare(b)
  })

  const parsed = orderedCodes.map((code) => {
    const number = getCourseNumber(code)
    const dept = getOfficialDeptPrefix(code)
    return { code, number, dept, official: toOfficialCode(code) }
  })

  const firstNumber = parsed[0]?.number
  const sameNumber = Boolean(firstNumber) && parsed.every((item) => item.number === firstNumber)

  if (sameNumber) {
    const depts = [...new Set(parsed.map((item) => item.dept))]
    return `${depts.join('/')} ${firstNumber}`
  }

  return parsed.map((item) => item.official).join(' / ')
}

// Convert letter grade to numeric value for averaging
function gradeToNumeric(grade: string): number {
  const grades: Record<string, number> = {
    'A': 4.0, 'AB': 3.5, 'B': 3.0, 'BC': 2.5, 'C': 2.0, 'D': 1.0, 'F': 0.0
  }
  return grades[grade] ?? 2.0
}

// Phase 3 Unification: Return preset class based on average rating
function getReviewCardClass(review: { contentRating: string; teachingRating: string; gradingRating: string; workloadRating: string }) {
  const avgNumeric = (
    gradeToNumeric(review.contentRating) +
    gradeToNumeric(review.teachingRating) +
    gradeToNumeric(review.gradingRating) +
    gradeToNumeric(review.workloadRating)
  ) / 4
  
  // Map average to preset classes
  if (avgNumeric >= 3.7) return 'review-card-excellent'  // A/AB average
  if (avgNumeric >= 3.3) return 'review-card-great'      // AB/B+ average
  if (avgNumeric >= 3.0) return 'review-card-good'       // B average
  if (avgNumeric >= 2.5) return 'review-card-average'    // B-/BC average
  if (avgNumeric >= 2.0) return 'review-card-below'      // BC/C average
  return 'review-card-poor'                               // C- or below
}

// Left Sidebar Component
function LeftSidebar({ 
  course, 
  relatedCourses 
}: { 
  course: Course
  relatedCourses: RelatedCourse[]
}) {
  const [searchQuery, setSearchQuery] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedQuery = useDebounce(searchQuery, 300)
  
  // Get official department code for display
  const officialDeptCode = getOfficialDeptPrefix(course.code)

  // Global search via tRPC (same as main search bar)
  const { data: searchResults, isLoading: isSearching } = trpc.course.list.useQuery(
    { search: debouncedQuery, limit: 6 },
    { enabled: debouncedQuery.trim().length >= 2, staleTime: 30000 }
  )
  const previewCourses = searchResults?.courses || []
  const showDropdown = isFocused && debouncedQuery.trim().length >= 2

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])
  
  return (
    <aside className="w-[320px] flex-shrink-0 h-full overflow-y-auto scrollbar-hide">
      <div className="space-y-5">
      {/* Search - global, with live preview */}
      <div className="relative z-30" ref={containerRef}>
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
        <input
          type="text"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          className="w-full pl-9 pr-8 py-2 text-sm bg-surface-primary border border-surface-tertiary rounded-lg 
                     focus:outline-none focus:border-wf-crimson focus:ring-1 focus:ring-wf-crimson/20
                     placeholder:text-text-tertiary"
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); setIsFocused(false) }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary p-0.5"
          >
            <X size={14} />
          </button>
        )}

        {/* Search Preview Dropdown */}
        {showDropdown && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-surface-primary border border-surface-tertiary rounded-lg shadow-lg overflow-hidden">
            {isSearching ? (
              <div className="px-4 py-3 text-xs text-text-tertiary text-center">Searching...</div>
            ) : previewCourses.length > 0 ? (
              <div className="max-h-64 overflow-y-auto">
                {previewCourses.map((c: any) => (
                  <Link
                    key={c.id}
                    href={`/courses/${c.id}`}
                    onClick={() => { setSearchQuery(''); setIsFocused(false) }}
                    className="block px-3 py-2.5 hover:bg-hover-bg transition-colors border-b border-surface-tertiary last:border-0"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-text-primary">{toOfficialCode(c.code)}</span>
                      {c.avgGPA != null && c.avgGPA > 0 && (
                        <span className="text-xs text-wf-crimson font-medium">{c.avgGPA.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="text-xs text-text-tertiary line-clamp-1 mt-0.5">{c.name}</div>
                  </Link>
                ))}
                {searchResults && searchResults.total > 6 && (
                  <div className="px-3 py-2 text-xs text-text-tertiary text-center bg-surface-secondary">
                    +{searchResults.total - 6} more results
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 py-3 text-xs text-text-tertiary text-center">
                No courses found for &ldquo;{debouncedQuery}&rdquo;
              </div>
            )}
          </div>
        )}
      </div>

      {/* Prerequisites */}
      {course.prerequisites.length > 0 && (
        <div>
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
            <span>📌</span> Prerequisites
          </h3>
          <div className="space-y-1">
            {course.prerequisites.map(prereq => (
              <Link
                key={prereq.id}
                href={`/courses/${prereq.id}`}
                className="block px-3 py-2 hover:bg-hover-bg rounded-lg transition-colors group"
              >
                <div className="font-medium text-sm text-text-secondary group-hover:text-wf-crimson">
                  {toOfficialCode(prereq.code)}
                </div>
                <div className="text-xs text-text-tertiary line-clamp-1 mt-0.5">
                  {prereq.name}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Unlocks */}
      {course.prerequisiteFor.length > 0 && (
        <div>
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
            <span>🔓</span> Unlocks
          </h3>
          <div className="space-y-1">
            {course.prerequisiteFor.slice(0, 5).map(next => (
              <Link
                key={next.id}
                href={`/courses/${next.id}`}
                className="block px-3 py-2 hover:bg-hover-bg rounded-lg transition-colors group"
              >
                <div className="font-medium text-sm text-text-secondary group-hover:text-wf-crimson">
                  {toOfficialCode(next.code)}
                </div>
                <div className="text-xs text-text-tertiary line-clamp-1 mt-0.5">
                  {next.name}
                </div>
              </Link>
            ))}
            {course.prerequisiteFor.length > 5 && (
              <div className="px-3 py-1 text-xs text-text-tertiary">
                +{course.prerequisiteFor.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Same Level Courses - Two Column Grid */}
      {relatedCourses.length > 0 && (
        <div>
          <h3 className="flex items-center gap-1.5 text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
            <span>📚</span> {officialDeptCode} (Same Level)
          </h3>
          {relatedCourses.length === 0 ? (
            <div className="text-xs text-text-tertiary text-center py-4">
              No related courses found
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {relatedCourses.map(c => {
              const isActive = c.id === course.id
              const officialCode = toOfficialCode(c.code)
              return (
                <Link
                  key={c.id}
                  href={`/courses/${c.id}`}
                  className={`block px-2.5 py-2 rounded-lg transition-colors ${
                    isActive 
                      ? 'bg-wf-crimson/10 ring-1 ring-wf-crimson/30' 
                      : 'hover:bg-hover-bg'
                  }`}
                >
                  <div className={`font-medium text-xs ${
                    isActive ? 'text-wf-crimson' : 'text-text-secondary'
                  }`}>
                    {officialCode}
                  </div>
                  <div className="text-[10px] text-text-tertiary line-clamp-1 mt-0.5">
                    {c.name}
                  </div>
                  {c.avgGPA != null && c.avgGPA > 0 && (
                    <div className={`text-[10px] font-semibold mt-0.5 ${getGPAColor(c.avgGPA)}`}>
                      GPA {c.avgGPA.toFixed(2)}
                    </div>
                  )}
                </Link>
              )
            })}
            </div>
          )}
        </div>
      )}
      </div>
    </aside>
  )
}

// Right Sidebar Component
function RightSidebar({ 
  course, 
  avgRatings,
  gradeData,
  latestDistribution,
  filteredAvgGPA,
  totalGraded,
  isFiltered,
  filterType,
  officialDistributionMissing,
  reviewGradeData,
  reviewGradeTotal,
}: { 
  course: Course
  avgRatings: { content: number; teaching: number; grading: number; workload: number } | null
  gradeData: { grade: string; count: number }[]
  latestDistribution: any
  filteredAvgGPA: number | null
  totalGraded: number
  isFiltered: boolean
  filterType: 'none' | 'term' | 'instructor' | 'term+instructor'
  officialDistributionMissing: boolean
  reviewGradeData: { grade: string; count: number }[]
  reviewGradeTotal: number
}) {
  const maxCount = Math.max(...gradeData.map(g => g.count), 1)
  const reviewMaxCount = Math.max(...reviewGradeData.map(g => g.count), 1)
  
  const getRatingLabel = (val: number) => ['F', 'D', 'C', 'BC', 'B', 'AB', 'A'][Math.min(6, Math.max(0, Math.round(val)))] || 'N/A'

  // Use filtered GPA when filters are applied, otherwise use course avgGPA
  const displayGPA = isFiltered ? filteredAvgGPA : course.avgGPA
  
  // Filter type label
  const filterLabel = {
    'none': '',
    'term': 'term',
    'instructor': 'instructor',
    'term+instructor': 'term+instructor'
  }[filterType]
  
  return (
    <aside className="w-full lg:w-[280px] lg:flex-shrink-0 lg:h-full lg:overflow-y-auto scrollbar-hide">
      <div className="space-y-6">
        {/* Review Count */}
        <div className="text-center">
          <div className="text-4xl font-bold text-text-primary">{course.reviews.length}</div>
          <div className="text-sm text-text-secondary">Reviews</div>
        </div>

        {/* Rating Averages - 4 Dimensions (Always shown, NA if no reviews) */}
        <div className="bg-surface-primary border border-surface-tertiary rounded-xl p-4">
          <h4 className="text-sm font-semibold text-text-primary mb-3">Average Ratings</h4>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Content', value: avgRatings?.content },
              { label: 'Teaching', value: avgRatings?.teaching },
              { label: 'Grading', value: avgRatings?.grading },
              { label: 'Workload', value: avgRatings?.workload },
            ].map(({ label, value }) => {
              const grade = value !== undefined ? getRatingLabel(value) : 'NA'
              const hasData = value !== undefined
              return (
                <div key={label} className="text-center">
                  <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center font-bold ${
                    hasData 
                      ? `text-white ${getRatingCircleColor(grade)}` 
                      : 'bg-surface-secondary text-text-tertiary border-2 border-dashed border-surface-tertiary'
                  }`}>
                    {grade}
                  </div>
                  <div className="text-xs text-text-tertiary mt-2">{label}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Grade Distribution - Improved Design */}
        {gradeData.length > 0 && totalGraded > 0 && (
          <div className="bg-surface-primary border border-surface-tertiary rounded-xl p-4">
            <h4 className="text-sm font-semibold text-text-primary mb-3">
              Grade Distribution
              {isFiltered && (
                <span className="text-xs font-normal text-wf-crimson ml-2">
                  ({filterLabel})
                </span>
              )}
            </h4>
            <div className="space-y-2.5">
              {gradeData.map(({ grade, count }) => {
                const percentage = ((count / totalGraded) * 100).toFixed(1)
                return (
                  <div key={grade} className="group">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-text-secondary">{grade}</span>
                      <span className="text-text-tertiary">{percentage}%</span>
                    </div>
                    <div className="relative bg-surface-secondary rounded-full h-2.5 overflow-hidden shadow-inner">
                      <div
                        className={`h-full ${getBarColor(grade)} transition-all duration-500 ease-out rounded-full shadow-sm`}
                        style={{ width: `${(count / maxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            {/* GPA Summary Card */}
            <div className="mt-4 pt-4 border-t border-surface-tertiary">
              <div className="flex items-center justify-between bg-surface-secondary/50 rounded-lg p-3">
                <div className="text-xs text-text-secondary font-medium">
                  {isFiltered ? (
                    <span className="text-wf-crimson capitalize">{filterLabel} Avg</span>
                  ) : (
                    'Overall Avg'
                  )}
                </div>
                <div className={`text-2xl font-bold ${
                  displayGPA !== null
                    ? displayGPA >= 3.5 ? 'text-emerald-500' :
                      displayGPA >= 3.0 ? 'text-emerald-400' :
                      displayGPA >= 2.5 ? 'text-amber-500' :
                      displayGPA >= 2.0 ? 'text-orange-500' : 'text-red-500'
                    : 'text-text-tertiary'
                }`}>
                  {displayGPA?.toFixed(2) || 'N/A'}
                </div>
              </div>
              <div className="text-center text-xs text-text-tertiary mt-2">
                {totalGraded.toLocaleString()} total grades
              </div>
            </div>
          </div>
        )}

        {officialDistributionMissing && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-900">
              The official GPA distribution for this filter has not been published yet.
            </p>
          </div>
        )}

        {reviewGradeTotal > 0 && (
          <div className="bg-surface-primary border border-surface-tertiary rounded-xl p-4">
            <h4 className="text-sm font-semibold text-text-primary mb-3">
              Unofficial (Based on Student Reviews)
            </h4>
            <div className="space-y-2.5">
              {reviewGradeData.map(({ grade, count }) => {
                const percentage = ((count / reviewGradeTotal) * 100).toFixed(1)
                return (
                  <div key={`review-${grade}`} className="group">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-text-secondary">{grade}</span>
                      <span className="text-text-tertiary">{percentage}%</span>
                    </div>
                    <div className="relative bg-surface-secondary rounded-full h-2.5 overflow-hidden shadow-inner">
                      <div
                        className={`h-full ${getBarColor(grade)} transition-all duration-500 ease-out rounded-full shadow-sm`}
                        style={{ width: `${(count / reviewMaxCount) * 100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="text-center text-xs text-text-tertiary mt-3">
              {reviewGradeTotal.toLocaleString()} reviews with self-reported final grades
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-surface-secondary rounded-lg p-3">
            <div className="text-lg font-bold text-text-primary">{course.credits}</div>
            <div className="text-xs text-text-tertiary">Credits</div>
          </div>
          <div className="bg-surface-secondary rounded-lg p-3">
            <div className="text-lg font-bold text-text-primary">{course.level.charAt(0)}</div>
            <div className="text-xs text-text-tertiary">Level</div>
          </div>
        </div>
      </div>
    </aside>
  )
}

// Filter Bar Component
function FilterBar({
  terms,
  instructors,
  selectedTerm,
  selectedInstructor,
  onTermChange,
  onInstructorChange,
  onReset
}: {
  terms: string[]
  instructors: { id: string; name: string; reviewOnly?: boolean }[]
  selectedTerm: string
  selectedInstructor: string
  onTermChange: (term: string) => void
  onInstructorChange: (instructor: string) => void
  onReset: () => void
}) {
  const hasFilters = selectedTerm !== 'all' || selectedInstructor !== 'all'
  
  return (
    <div className="flex items-center gap-3 mb-6 flex-wrap">
      {/* Term Filter */}
      <div className="relative">
        <select
          value={selectedTerm}
          onChange={(e) => onTermChange(e.target.value)}
          className="appearance-none pl-3 pr-8 py-2 text-sm bg-surface-primary border border-surface-tertiary rounded-lg 
                     focus:outline-none focus:border-wf-crimson cursor-pointer"
        >
          <option value="all">All Terms</option>
          {terms.map(term => (
            <option key={term} value={term}>{term}</option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
      </div>

      {/* Instructor Filter */}
      <div className="relative">
        <select
          value={selectedInstructor}
          onChange={(e) => onInstructorChange(e.target.value)}
          className="appearance-none pl-3 pr-8 py-2 text-sm bg-surface-primary border border-surface-tertiary rounded-lg 
                     focus:outline-none focus:border-wf-crimson cursor-pointer"
        >
          <option value="all">All Instructors</option>
          {instructors.map(inst => (
            <option key={inst.id} value={inst.id}>
              {inst.name}{inst.reviewOnly ? ' (Review-only)' : ''}
            </option>
          ))}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-tertiary pointer-events-none" />
      </div>

      {/* Reset */}
      {hasFilters && (
        <button
          onClick={onReset}
          className="flex items-center gap-1 px-3 py-2 text-sm text-wf-crimson hover:bg-wf-crimson/5 rounded-lg transition-colors"
        >
          <X size={14} />
          Reset
        </button>
      )}
    </div>
  )
}

// Main Layout Component
export function CoursePageLayout({ 
  course,
  relatedCourses = []
}: { 
  course: Course
  relatedCourses?: RelatedCourse[]
}) {
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const utils = trpc.useUtils()
  const reviewDensity: ReviewDensity = searchParams.get('density') === 'mild' ? 'mild' : 'dense'
  
  // Filter state
  const [selectedTerm, setSelectedTerm] = useState('all')
  const [selectedInstructor, setSelectedInstructor] = useState('all')
  
  // Edit review state
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null)
  
  // Review expand/collapse state
  const [expandedReviews, setExpandedReviews] = useState<Set<string>>(new Set())

  // Parse JSON fields
  const breadths = course.breadths ? (typeof course.breadths === 'string' ? JSON.parse(course.breadths) : course.breadths) : []
  
  // Parse reviews' assessments
  const reviewsWithParsedData = course.reviews.map(review => ({
    ...review,
    assessments: review.assessments ? (typeof review.assessments === 'string' ? JSON.parse(review.assessments) : review.assessments) : []
  }))

  const instructorFacets = useMemo(() => {
    const map = new Map<string, {
      id: string
      name: string
      instructorIds: Set<string>
      terms: Set<string>
      hasOfficialGpa: boolean
      reviewCount: number
    }>()

    course.gradeDistributions.forEach(g => {
      if (!g.instructor) return
      const normalized = normalizeInstructorName(g.instructor.name)
      const existing = map.get(normalized.key) || {
        id: normalized.key,
        name: normalized.displayName,
        instructorIds: new Set<string>(),
        terms: new Set<string>(),
        hasOfficialGpa: false,
        reviewCount: 0,
      }
      existing.instructorIds.add(g.instructor.id)
      existing.terms.add(g.term)
      existing.hasOfficialGpa = true
      map.set(normalized.key, existing)
    })

    reviewsWithParsedData.forEach(review => {
      if (!review.instructor?.name || !review.instructor?.id) return
      const normalized = normalizeInstructorName(review.instructor.name)
      const existing = map.get(normalized.key) || {
        id: normalized.key,
        name: normalized.displayName,
        instructorIds: new Set<string>(),
        terms: new Set<string>(),
        hasOfficialGpa: false,
        reviewCount: 0,
      }
      existing.instructorIds.add(review.instructor.id)
      if (review.term) existing.terms.add(review.term)
      existing.reviewCount += 1
      map.set(normalized.key, existing)
    })

    return Array.from(map.values())
      .map((v): InstructorFacet => ({
        id: v.id,
        name: v.name,
        instructorIds: [...v.instructorIds],
        terms: [...v.terms],
        hasOfficialGpa: v.hasOfficialGpa,
        reviewCount: v.reviewCount,
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [course.gradeDistributions, reviewsWithParsedData])

  // Extract unique terms from both official GPA and reviews
  const allTerms = useMemo(() => {
    const uniqueTerms = new Set<string>()
    course.gradeDistributions.forEach(g => uniqueTerms.add(g.term))
    reviewsWithParsedData.forEach(r => {
      if (r.term) uniqueTerms.add(r.term)
    })
    
    const sorted = [...uniqueTerms].sort().reverse()
    return sorted
  }, [course.gradeDistributions, reviewsWithParsedData])

  const selectedInstructorFacet = useMemo(
    () => instructorFacets.find(f => f.id === selectedInstructor) || null,
    [instructorFacets, selectedInstructor]
  )

  const selectedInstructorIds = useMemo(() => {
    if (!selectedInstructorFacet) return new Set<string>()
    return new Set(selectedInstructorFacet.instructorIds)
  }, [selectedInstructorFacet])

  const reviewInstructorsByTerm = useMemo(() => {
    const byTerm = new Map<string, Set<string>>()
    reviewsWithParsedData.forEach(review => {
      if (!review.term || !review.instructor?.name) return
      const normalized = normalizeInstructorName(review.instructor.name).displayName
      if (!byTerm.has(review.term)) {
        byTerm.set(review.term, new Set<string>())
      }
      byTerm.get(review.term)!.add(normalized)
    })
    return [...byTerm.entries()].map(([term, names]) => ({
      term,
      names: [...names].sort((a, b) => a.localeCompare(b)),
    }))
  }, [reviewsWithParsedData])

  const sharedDataCodes = useMemo(() => {
    const fromApi = (course.crossListedCodes ?? []).filter(Boolean)
    if (fromApi.length > 0) return fromApi
    return (course.crossListGroup?.courses ?? []).map((item) => item.code)
  }, [course.crossListedCodes, course.crossListGroup])

  const displayCodeTitle = useMemo(() => {
    const fallback = toOfficialCode(course.code)
    const title = buildCrossListTitle(sharedDataCodes, course.canonicalCode)
    return title || fallback
  }, [course.code, course.canonicalCode, sharedDataCodes])

  // FILTERED terms based on selected instructor facet
  const terms = useMemo(() => {
    if (selectedInstructor === 'all' || !selectedInstructorFacet) {
      return allTerms
    }
    return allTerms.filter(term => selectedInstructorFacet.terms.includes(term))
  }, [allTerms, selectedInstructor, selectedInstructorFacet])

  // FILTERED instructor facets based on selected term
  const instructors = useMemo(() => {
    if (selectedTerm === 'all') {
      return instructorFacets.map(f => ({
        id: f.id,
        name: f.name,
        reviewOnly: !f.hasOfficialGpa,
      }))
    }
    return instructorFacets
      .filter(f => f.terms.includes(selectedTerm))
      .map(f => ({
        id: f.id,
        name: f.name,
        reviewOnly: !f.hasOfficialGpa,
      }))
  }, [instructorFacets, selectedTerm])

  // Filter reviews
  const filteredReviews = useMemo(() => {
    return reviewsWithParsedData.filter(review => {
      if (selectedTerm !== 'all' && review.term !== selectedTerm) return false
      if (selectedInstructor !== 'all') {
        const reviewInstructorId = review.instructor?.id
        if (!reviewInstructorId || !selectedInstructorIds.has(reviewInstructorId)) {
          return false
        }
      }
      return true
    })
  }, [reviewsWithParsedData, selectedTerm, selectedInstructor, selectedInstructorIds])

  // Grade distribution - filter by selected term AND/OR instructor facet
  const filteredDistributions = useMemo(() => {
    let filtered = course.gradeDistributions

    if (selectedTerm !== 'all') {
      filtered = filtered.filter(g => g.term === selectedTerm)
    }

    if (selectedInstructor !== 'all') {
      filtered = filtered.filter(g => {
        if (!g.instructor?.id) return false
        return selectedInstructorIds.has(g.instructor.id)
      })
    }

    return filtered
  }, [course.gradeDistributions, selectedTerm, selectedInstructor, selectedInstructorIds])

  const reviewGradeDistribution = useMemo(() => {
    const counts = new Map<string, number>(GRADE_ORDER.map(grade => [grade, 0]))
    let total = 0
    filteredReviews.forEach(review => {
      if (!review.gradeReceived || !counts.has(review.gradeReceived)) return
      counts.set(review.gradeReceived, (counts.get(review.gradeReceived) || 0) + 1)
      total += 1
    })
    return {
      gradeData: GRADE_ORDER.map(grade => ({ grade, count: counts.get(grade) || 0 })).filter(g => g.count > 0),
      total,
    }
  }, [filteredReviews])

  const officialDistributionMissingForFilter = useMemo(() => {
    const hasActiveFilters = selectedTerm !== 'all' || selectedInstructor !== 'all'
    return hasActiveFilters && filteredDistributions.length === 0
  }, [selectedTerm, selectedInstructor, filteredDistributions])

  // Calculate average ratings from filtered reviews
  const avgRatings = filteredReviews.length > 0 ? {
    content: filteredReviews.reduce((sum, r) => sum + (['F', 'D', 'C', 'BC', 'B', 'AB', 'A'].indexOf(r.contentRating)), 0) / filteredReviews.length,
    teaching: filteredReviews.reduce((sum, r) => sum + (['F', 'D', 'C', 'BC', 'B', 'AB', 'A'].indexOf(r.teachingRating)), 0) / filteredReviews.length,
    grading: filteredReviews.reduce((sum, r) => sum + (['F', 'D', 'C', 'BC', 'B', 'AB', 'A'].indexOf(r.gradingRating)), 0) / filteredReviews.length,
    workload: filteredReviews.reduce((sum, r) => sum + (['F', 'D', 'C', 'BC', 'B', 'AB', 'A'].indexOf(r.workloadRating)), 0) / filteredReviews.length
  } : null

  // Calculate aggregated grade data from filtered distributions
  const { gradeData, filteredAvgGPA, totalGraded } = useMemo(() => {
    if (filteredDistributions.length === 0) {
      return { gradeData: [], filteredAvgGPA: null, totalGraded: 0 }
    }

    const aggregated = {
      aCount: 0, abCount: 0, bCount: 0, bcCount: 0, 
      cCount: 0, dCount: 0, fCount: 0, totalGraded: 0
    }

    filteredDistributions.forEach(d => {
      aggregated.aCount += d.aCount
      aggregated.abCount += d.abCount
      aggregated.bCount += d.bCount
      aggregated.bcCount += d.bcCount
      aggregated.cCount += d.cCount
      aggregated.dCount += d.dCount
      aggregated.fCount += d.fCount
      aggregated.totalGraded += d.totalGraded
    })

    const gradeData = [
      { grade: 'A', count: aggregated.aCount },
      { grade: 'AB', count: aggregated.abCount },
      { grade: 'B', count: aggregated.bCount },
      { grade: 'BC', count: aggregated.bcCount },
      { grade: 'C', count: aggregated.cCount },
      { grade: 'D', count: aggregated.dCount },
      { grade: 'F', count: aggregated.fCount }
    ]

    // Calculate weighted average GPA
    const weights = { A: 4.0, AB: 3.5, B: 3.0, BC: 2.5, C: 2.0, D: 1.0, F: 0.0 }
    let totalPoints = 0
    gradeData.forEach(g => {
      totalPoints += g.count * (weights[g.grade as keyof typeof weights] || 0)
    })
    const filteredAvgGPA = aggregated.totalGraded > 0 
      ? totalPoints / aggregated.totalGraded 
      : null

    return { gradeData, filteredAvgGPA, totalGraded: aggregated.totalGraded }
  }, [filteredDistributions])

  const latestDistribution = filteredDistributions[0]

  return (
    <div className="min-h-screen lg:h-screen lg:flex lg:flex-col bg-surface-secondary lg:overflow-hidden">
      {/* Header */}
      <Header currentPath="/courses" />

      {/* Main Content - 3 Column Layout (responsive: stack on mobile) */}
      <div className="lg:flex-1 lg:min-h-0 max-w-[1400px] w-full mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 lg:h-full">
          {/* Left Sidebar - hidden on mobile, fixed height with internal scroll */}
          <div className="hidden lg:block py-6 lg:py-8">
            <LeftSidebar course={course} relatedCourses={relatedCourses} />
          </div>

          {/* Main Content - only this column scrolls on desktop */}
          <main className="flex-1 min-w-0 lg:overflow-y-auto lg:scrollbar-hide py-6 lg:py-8">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-text-secondary mb-4">
              <Link href="/courses" className="hover:text-text-primary transition-colors">Courses</Link>
              <ChevronRight size={16} />
              <span className="text-text-primary font-medium">{displayCodeTitle}</span>
            </div>

            {/* Course Header Card */}
            <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-text-primary">{displayCodeTitle}</h1>
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-md border ${
                      course.level === 'Elementary'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : course.level === 'Intermediate'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-orange-50 text-orange-700 border-orange-200'
                    }`}>
                      {course.level}
                    </span>
                  </div>
                  <h2 className="text-lg text-text-secondary">{course.name}</h2>
                  {/* Cross-listed courses */}
                  {course.crossListGroup && course.crossListGroup.courses.length > 1 && (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-text-tertiary">Also listed as:</span>
                      <div className="flex flex-wrap gap-1.5">
                        {course.crossListGroup.courses
                          .filter(c => c.id !== course.id)
                          .map(c => (
                            <span
                              key={c.id}
                              className="px-2 py-0.5 text-xs bg-surface-secondary text-text-secondary rounded"
                            >
                              {toOfficialCode(c.code)}
                            </span>
                          ))}
                      </div>
                    </div>
                  )}
                  {course.isCrossListedSharedData && sharedDataCodes.length > 1 && (
                    <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2">
                      <p className="text-xs text-sky-900">
                        Grade data is shared across cross-listed courses:{' '}
                        {sharedDataCodes.map((code) => toOfficialCode(code)).join(', ')}
                      </p>
                    </div>
                  )}
                </div>
                {course.avgGPA != null && course.avgGPA > 0 && (
                  <div className="text-right">
                    <div className={`text-2xl font-bold ${
                      course.avgGPA >= 3.5 ? 'text-emerald-500' :
                      course.avgGPA >= 3.0 ? 'text-emerald-400' :
                      course.avgGPA >= 2.5 ? 'text-amber-500' :
                      course.avgGPA >= 2.0 ? 'text-orange-500' : 'text-red-500'
                    }`}>{course.avgGPA.toFixed(2)}</div>
                    <div className="text-xs text-text-tertiary">Avg GPA</div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-4 text-sm text-text-secondary mb-4">
                <span className="flex items-center gap-1">
                  <Building size={14} /> {course.school.name}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen size={14} /> {course.credits} credits
                </span>
              </div>

              <p className="text-sm text-text-secondary leading-relaxed">
                {course.description || 'No description available.'}
              </p>

              {course.prerequisiteText && (
                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <span className="font-medium text-amber-900 text-sm">Prerequisites: </span>
                      <span className="text-sm text-amber-800">{course.prerequisiteText}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Filter Bar */}
            <FilterBar
              terms={terms}
              instructors={instructors}
              selectedTerm={selectedTerm}
              selectedInstructor={selectedInstructor}
              onTermChange={(term) => {
                setSelectedTerm(term)
                if (term !== 'all' && selectedInstructor !== 'all') {
                  const hasData = selectedInstructorFacet?.terms.includes(term) ?? false
                  if (!hasData) {
                    setSelectedInstructor('all')
                  }
                }
              }}
              onInstructorChange={(instructor) => {
                setSelectedInstructor(instructor)
                if (instructor !== 'all' && selectedTerm !== 'all') {
                  const selectedFacet = instructorFacets.find(f => f.id === instructor)
                  const hasData = selectedFacet?.terms.includes(selectedTerm) ?? false
                  if (!hasData) {
                    setSelectedTerm('all')
                  }
                }
              }}
              onReset={() => {
                setSelectedTerm('all')
                setSelectedInstructor('all')
              }}
            />

            {/* Reviews Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-text-primary">
                Student Reviews ({filteredReviews.length})
                {(selectedTerm !== 'all' || selectedInstructor !== 'all') && (
                  <span className="text-sm font-normal text-text-tertiary ml-2">
                    (filtered from {reviewsWithParsedData.length})
                  </span>
                )}
                {process.env.NODE_ENV === 'development' && (
                  <span className="text-xs font-normal text-text-tertiary ml-2">
                    density: {reviewDensity} (use <code>?density=mild</code>)
                  </span>
                )}
              </h3>

              {/* Review Form */}
              <div id="review-form" className="bg-surface-primary rounded-xl border border-surface-tertiary p-6 scroll-mt-24">
                <ReviewForm 
                  courseId={course.id} 
                  courseName={`${toOfficialCode(course.code)}: ${course.name}`}
                  gradeDistributions={course.gradeDistributions}
                  courseInstructors={course.instructors}
                  reviewInstructorsByTerm={reviewInstructorsByTerm}
                  isLoggedIn={!!session?.user}
                />
              </div>

              {/* Reviews List */}
              {filteredReviews.length === 0 ? (
                <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-12 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-text-tertiary mb-4" />
                  <p className="text-text-secondary">
                    {reviewsWithParsedData.length === 0 
                      ? 'No reviews yet. Be the first to review this course!'
                      : 'No reviews match your filters.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredReviews.map((review, index) => {
                    const isGated = !course.reviewAccess.hasFullAccess && index >= course.reviewAccess.previewCount

                    // Show edit form instead of review card when editing
                    if (editingReviewId === review.id) {
                      const existingReview = {
                        id: review.id,
                        term: review.term,
                        title: review.title,
                        gradeReceived: review.gradeReceived,
                        contentRating: review.contentRating,
                        teachingRating: review.teachingRating,
                        gradingRating: review.gradingRating,
                        workloadRating: review.workloadRating,
                        contentComment: review.contentComment,
                        teachingComment: review.teachingComment,
                        gradingComment: review.gradingComment,
                        workloadComment: review.workloadComment,
                        assessments: review.assessments,
                        resourceLink: review.resourceLink,
                        recommendInstructor: review.recommendInstructor,
                        instructor: review.instructor,
                        isAnonymous: review.isAnonymous,
                        showRankWhenAnonymous: review.showRankWhenAnonymous,
                      }
                      return (
                        <div key={review.id} className="bg-surface-primary rounded-xl border-2 border-wf-crimson/30 p-1">
                          <ReviewForm
                            courseId={course.id}
                            courseName={`${toOfficialCode(course.code)}: ${course.name}`}
                            gradeDistributions={course.gradeDistributions}
                            courseInstructors={course.instructors}
                            existingReview={existingReview}
                            onEditComplete={() => setEditingReviewId(null)}
                            onEditCancel={() => setEditingReviewId(null)}
                          />
                        </div>
                      )
                    }

                    const isExpanded = expandedReviews.has(review.id)
                    const toggleExpanded = () => {
                      setExpandedReviews(prev => {
                        const next = new Set(prev)
                        if (next.has(review.id)) next.delete(review.id)
                        else next.add(review.id)
                        return next
                      })
                    }

                    const reviewCardClass = getReviewCardClass(review)
                    const dense = reviewDensity === 'dense'
                    const fadeThreshold = dense ? 180 : 260
                    const titleClass = dense ? 'text-[15px] leading-5' : 'text-[17px] leading-6'
                    const authorClass = dense ? 'text-[12px] leading-[18px] font-medium text-text-secondary' : 'text-[13px] leading-5 font-medium text-text-secondary'
                    const metaClass = dense ? 'text-[11px] leading-4 text-text-tertiary' : 'text-xs leading-[18px] text-text-tertiary'
                    const ratingGridClass = dense ? 'grid grid-cols-4 gap-1.5 mb-3' : 'grid grid-cols-4 gap-1.5 sm:gap-2 mb-3.5'
                    const ratingCardClass = dense ? 'p-1.5 rounded-lg border text-center' : 'p-2 rounded-lg border text-center'
                    const ratingLabelClass = dense ? 'text-[10px] opacity-75' : 'text-[11px] opacity-75'
                    const ratingValueClass = dense ? 'text-[13px] font-bold' : 'text-[14px] font-bold'
                    const commentsGridClass = dense ? 'grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm' : 'grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-sm'
                    const commentCardClass = dense ? 'p-3 rounded-lg border border-surface-tertiary bg-surface-secondary/55' : 'p-4 rounded-lg border border-surface-tertiary bg-surface-secondary/50'
                    const commentHeadingClass = dense ? 'inline-flex items-center rounded-md border border-surface-tertiary bg-surface-primary/90 px-1.5 py-0.5 text-[10px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-1.5' : 'inline-flex items-center rounded-md border border-surface-tertiary bg-surface-primary/85 px-2 py-0.5 text-[11px] font-bold text-text-secondary uppercase tracking-[0.08em] mb-2'
                    const commentTextClass = dense ? 'text-[13px] leading-5 text-gray-800 dark:text-gray-200 whitespace-pre-line' : 'text-[14px] leading-[22px] text-gray-800 dark:text-gray-200 whitespace-pre-line'
                    const commentClipClass = dense ? 'relative max-h-28 overflow-hidden' : 'relative max-h-36 overflow-hidden'
                    const fadeOverlayClass = dense
                      ? 'pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-surface-secondary via-surface-secondary/90 to-transparent'
                      : 'pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-surface-secondary via-surface-secondary/85 to-transparent'
                    const readMoreButtonClass = dense
                      ? 'inline-flex items-center rounded-md border border-surface-tertiary bg-surface-primary/95 px-3 py-1 text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors'
                      : 'inline-flex items-center rounded-md border border-surface-tertiary bg-surface-primary/95 px-3.5 py-1.5 text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors'

                    const reviewCard = (
                      <div 
                        key={review.id} 
                        className={`${reviewCardClass} ${dense ? '!p-4' : '!p-[18px]'}`}
                      >
                        {/* Header - stable two-row layout */}
                        <div className={dense ? 'mb-3' : 'mb-4'}>
                          <div className="flex items-start justify-between gap-2">
                            <h4 className={`${titleClass} font-semibold text-text-primary line-clamp-1`}>
                              {review.title || 'No Title, Still Helpful'}
                            </h4>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className={metaClass}>
                                {new Date(review.createdAt).toLocaleDateString()}
                              </span>
                              <ReviewActions
                                reviewId={review.id}
                                isOwner={session?.user?.id === review.authorId}
                                onEditStart={() => setEditingReviewId(review.id)}
                                onDeleted={() => utils.course.byId.invalidate({ id: course.id })}
                              />
                            </div>
                          </div>

                          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                            {review.authorLevel && review.authorLevel.level > 0 && <ContributorBadge contributor={review.authorLevel} />}
                            {review.author && (
                              <span className={authorClass}>
                                {review.authorLevel?.badge && review.authorLevel.level > 0 && <span className="mr-0.5">{review.authorLevel.badge}</span>}
                                {review.author.name}
                              </span>
                            )}
                            <span className={metaClass}>
                              {review.term} · {review.instructor?.name || 'Unknown Instructor'}
                            </span>
                            {review.recommendInstructor === 'yes' && <span title="Recommends instructor">👍</span>}
                            {review.recommendInstructor === 'no' && <span title="Does not recommend instructor">👎</span>}
                            {review.recommendInstructor === 'neutral' && <span title="Neutral about instructor">😐</span>}
                          </div>
                        </div>

                        {/* Rating Cards */}
                        <div className={ratingGridClass}>
                          {[
                            { label: 'Content', value: review.contentRating },
                            { label: 'Teaching', value: review.teachingRating },
                            { label: 'Grading', value: review.gradingRating },
                            { label: 'Workload', value: review.workloadRating },
                          ].map(({ label, value }) => (
                            <div key={label} className={`${ratingCardClass} ${getRatingColor(value)}`}>
                              <div className={ratingLabelClass}>{label}</div>
                              <div className={ratingValueClass}>{value}</div>
                            </div>
                          ))}
                        </div>

                        {/* Assessments (above comments) */}
                        {review.assessments && review.assessments.length > 0 && (
                          <div className={`flex items-center flex-wrap gap-1.5 ${dense ? 'mb-2.5' : 'mb-3'}`}>
                            <span className="text-xs font-medium text-text-secondary">Including:</span>
                            {review.assessments.map((assessment: string) => (
                              <span key={assessment} className="px-2 py-0.5 text-xs bg-surface-secondary text-text-primary rounded border border-surface-tertiary">
                                {assessment}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Collapsed: Content & Teaching only (line-clamped) */}
                        {!isExpanded && (
                          <>
                            <div className={commentsGridClass}>
                              {review.contentComment && (
                                <div className={commentCardClass}>
                                  <div className={commentHeadingClass}>Content</div>
                                  <div className={commentClipClass}>
                                    <p className={commentTextClass}>{review.contentComment}</p>
                                    {review.contentComment.length > fadeThreshold && <div className={fadeOverlayClass} />}
                                  </div>
                                </div>
                              )}
                              {review.teachingComment && (
                                <div className={commentCardClass}>
                                  <div className={commentHeadingClass}>Teaching</div>
                                  <div className={commentClipClass}>
                                    <p className={commentTextClass}>{review.teachingComment}</p>
                                    {review.teachingComment.length > fadeThreshold && <div className={fadeOverlayClass} />}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="mt-3 flex justify-center">
                              <button
                                onClick={toggleExpanded}
                                className={readMoreButtonClass}
                              >
                                Read more
                              </button>
                            </div>
                          </>
                        )}

                        {/* Expanded: all comments + actions */}
                        {isExpanded && (
                          <>
                            <div className={commentsGridClass}>
                              {review.contentComment && (
                                <div className={commentCardClass}>
                                  <div className={commentHeadingClass}>Content</div>
                                  <p className={commentTextClass}>{review.contentComment}</p>
                                </div>
                              )}
                              {review.teachingComment && (
                                <div className={commentCardClass}>
                                  <div className={commentHeadingClass}>Teaching</div>
                                  <p className={commentTextClass}>{review.teachingComment}</p>
                                </div>
                              )}
                              {review.gradingComment && (
                                <div className={commentCardClass}>
                                  <div className={commentHeadingClass}>Grading</div>
                                  <p className={commentTextClass}>{review.gradingComment}</p>
                                </div>
                              )}
                              {review.workloadComment && (
                                <div className={commentCardClass}>
                                  <div className={commentHeadingClass}>Workload</div>
                                  <p className={commentTextClass}>{review.workloadComment}</p>
                                </div>
                              )}
                            </div>

                            {/* Actions + Comments - compact single row */}
                            <div className={`flex items-center gap-3 mt-3 pt-3 border-t border-surface-tertiary ${dense ? 'text-xs' : 'text-sm'}`}>
                              <VoteButton
                                reviewId={review.id}
                                initialVoteCount={review.votes?.length || 0}
                                initialIsVoted={review.currentUserVoted || false}
                                userId={session?.user?.id || undefined}
                                compact
                              />
                              {course.reviewAccess.hasFullAccess ? (
                                <CommentSection
                                  reviewId={review.id}
                                  comments={review.comments}
                                  userId={session?.user?.id}
                                  compact
                                />
                              ) : (
                                <FrostedInlineLock
                                  message={
                                    course.reviewAccess.isLoggedIn
                                      ? 'Write 1 review to unlock comments'
                                      : 'Sign in to unlock comments'
                                  }
                                >
                                  <CommentSection
                                    reviewId={review.id}
                                    comments={review.comments}
                                    userId={session?.user?.id}
                                    compact
                                  />
                                </FrostedInlineLock>
                              )}
                              <div className="ml-auto">
                                {session?.user && (
                                  <ReportButton
                                    reviewId={review.id}
                                    isOwner={session?.user?.id === review.authorId}
                                  />
                                )}
                              </div>
                            </div>

                            <button
                              onClick={toggleExpanded}
                              className={`${dense ? 'text-xs' : 'text-sm'} text-wf-crimson hover:underline cursor-pointer mt-2`}
                            >
                              Show less ▴
                            </button>
                          </>
                        )}
                      </div>
                    )
                    if (isGated) {
                      return (
                        <div key={review.id}>
                          {index === course.reviewAccess.previewCount && (
                            <ReviewGateOverlay
                              totalReviews={course.reviewAccess.totalReviews}
                              previewVisibleCount={course.reviewAccess.previewCount}
                              userReviewCount={course.reviewAccess.userReviewCount}
                              isLoggedIn={course.reviewAccess.isLoggedIn}
                              restrictionReason={course.reviewAccess.restrictionReason}
                            />
                          )}
                          <FrostedReview>{reviewCard}</FrostedReview>
                        </div>
                      )
                    }

                    return reviewCard
                  })}
                </div>
              )}
            </div>
          </main>

          {/* Right Sidebar - fixed height with internal scroll on desktop */}
          <div className="w-full lg:w-auto py-6 lg:py-8">
            <RightSidebar
              course={course}
              avgRatings={avgRatings}
              gradeData={gradeData}
              latestDistribution={latestDistribution}
              filteredAvgGPA={filteredAvgGPA}
              totalGraded={totalGraded}
              isFiltered={selectedTerm !== 'all' || selectedInstructor !== 'all'}
              filterType={
                selectedTerm !== 'all' && selectedInstructor !== 'all' ? 'term+instructor' :
                selectedTerm !== 'all' ? 'term' :
                selectedInstructor !== 'all' ? 'instructor' : 'none'
              }
              officialDistributionMissing={officialDistributionMissingForFilter}
              reviewGradeData={officialDistributionMissingForFilter ? reviewGradeDistribution.gradeData : []}
              reviewGradeTotal={officialDistributionMissingForFilter ? reviewGradeDistribution.total : 0}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
