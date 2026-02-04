'use client'

import { notFound, useParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { VoteButton } from '@/components/VoteButton'
import { ArrowLeft, Clock, BookOpen, Users, Star, Calendar, Building, Hash, AlertCircle, MessageSquare, ChevronRight } from 'lucide-react'
import { ReviewForm } from '@/components/ReviewForm'
import { CommentSection } from '@/components/CommentSection'
import { ReviewGateOverlay, FrostedReview } from '@/components/ReviewGate'
import { trpc } from '@/lib/trpc/client'
import { useSession } from 'next-auth/react'

function getGradeColor(grade: string) {
  const gradeColors: Record<string, string> = {
    'A': 'bg-green-100 text-green-700',
    'AB': 'bg-green-100 text-green-700',
    'B': 'bg-blue-100 text-blue-700',
    'BC': 'bg-blue-100 text-blue-700',
    'C': 'bg-yellow-100 text-yellow-700',
    'D': 'bg-orange-100 text-orange-700',
    'F': 'bg-red-100 text-red-700'
  }
  return gradeColors[grade] || 'bg-slate-100 text-slate-700'
}

function getRatingColor(rating: string) {
  const colors: Record<string, string> = {
    'A': 'bg-green-50 border-green-200 text-green-700',
    'B': 'bg-blue-50 border-blue-200 text-blue-700',
    'C': 'bg-yellow-50 border-yellow-200 text-yellow-700',
    'D': 'bg-orange-50 border-orange-200 text-orange-700',
    'F': 'bg-red-50 border-red-200 text-red-700'
  }
  return colors[rating] || 'bg-slate-50 border-slate-200 text-slate-700'
}

export default function CoursePage() {
  const params = useParams()
  const id = params.id as string
  const { data: session } = useSession()

  // Fetch course with tRPC
  const { data: course, isLoading, error } = trpc.course.byId.useQuery({ id })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        {/* Header Skeleton */}
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2">
                  <Logo size={32} />
                  <span className="text-xl font-bold text-slate-900">WiscFlow</span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Loading State */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-slate-200 rounded" />
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="h-10 w-32 bg-slate-200 rounded mb-4" />
              <div className="h-6 w-64 bg-slate-200 rounded mb-6" />
              <div className="h-24 w-full bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !course) {
    notFound()
  }

  // Parse JSON fields
  const breadths = course.breadths ? (typeof course.breadths === 'string' ? JSON.parse(course.breadths) : course.breadths) : []
  
  // Parse reviews' assessments
  const reviewsWithParsedData = course.reviews.map(review => ({
    ...review,
    assessments: review.assessments ? (typeof review.assessments === 'string' ? JSON.parse(review.assessments) : review.assessments) : []
  }))

  // Calculate average ratings
  const avgRatings = reviewsWithParsedData.length > 0 ? {
    content: reviewsWithParsedData.reduce((sum, r) => sum + (r.contentRating ? ['F', 'D', 'C', 'B', 'A'].indexOf(r.contentRating) + 1 : 0), 0) / reviewsWithParsedData.length,
    teaching: reviewsWithParsedData.reduce((sum, r) => sum + (r.teachingRating ? ['F', 'D', 'C', 'B', 'A'].indexOf(r.teachingRating) + 1 : 0), 0) / reviewsWithParsedData.length,
    grading: reviewsWithParsedData.reduce((sum, r) => sum + (r.gradingRating ? ['F', 'D', 'C', 'B', 'A'].indexOf(r.gradingRating) + 1 : 0), 0) / reviewsWithParsedData.length,
    workload: reviewsWithParsedData.reduce((sum, r) => sum + (r.workloadRating ? ['F', 'D', 'C', 'B', 'A'].indexOf(r.workloadRating) + 1 : 0), 0) / reviewsWithParsedData.length
  } : null

  // Calculate grade distribution totals
  const latestDistribution = course.gradeDistributions[0]
  const gradeData = latestDistribution ? [
    { grade: 'A', count: latestDistribution.aCount },
    { grade: 'AB', count: latestDistribution.abCount },
    { grade: 'B', count: latestDistribution.bCount },
    { grade: 'BC', count: latestDistribution.bcCount },
    { grade: 'C', count: latestDistribution.cCount },
    { grade: 'D', count: latestDistribution.dCount },
    { grade: 'F', count: latestDistribution.fCount }
  ] : []

  const maxCount = Math.max(...gradeData.map(g => g.count), 1)

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
            <nav className="flex items-center gap-6">
              <Link href="/courses" className="text-slate-600 hover:text-slate-900">
                Courses
              </Link>
              <Link href="/reviews" className="text-slate-600 hover:text-slate-900">
                Reviews
              </Link>
              <Link href="/about" className="text-slate-600 hover:text-slate-900">
                About
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
          <Link href="/courses" className="hover:text-slate-900">Courses</Link>
          <ChevronRight size={16} />
          <span className="text-slate-900 font-medium">{course.code}</span>
        </div>

        {/* Course Header */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-slate-900">{course.code}</h1>
                <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                  course.level === 'Elementary'
                    ? 'bg-green-100 text-green-700'
                    : course.level === 'Intermediate'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                }`}>
                  {course.level}
                </span>
              </div>
              <h2 className="text-xl text-slate-700 mb-4">{course.name}</h2>
              <div className="flex items-center gap-6 text-sm text-slate-600">
                <div className="flex items-center gap-1">
                  <Building size={16} />
                  {course.school.name}
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen size={16} />
                  {course.credits} credits
                </div>
                {course.lastOffered && (
                  <div className="flex items-center gap-1">
                    <Calendar size={16} />
                    Last offered: {course.lastOffered}
                  </div>
                )}
              </div>
            </div>
            {course.avgGPA && (
              <div className="text-center">
                <div className="text-3xl font-bold text-slate-900">{course.avgGPA.toFixed(2)}</div>
                <div className="text-sm text-slate-600">Avg GPA</div>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-slate-100">
            <h3 className="text-sm font-medium text-slate-900 mb-2">Course Description</h3>
            <p className="text-slate-600">{course.description || 'No description available.'}</p>
          </div>

          {course.prerequisiteText && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertCircle size={20} className="text-amber-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-900 mb-1">Prerequisites</h4>
                  <p className="text-sm text-amber-800">{course.prerequisiteText}</p>
                </div>
              </div>
            </div>
          )}

          {breadths && breadths.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-slate-900 mb-2">Breadth Requirements</h4>
              <div className="flex flex-wrap gap-2">
                {breadths.map((breadth: string) => (
                  <span key={breadth} className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
                    {breadth}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Grade Distribution */}
        {latestDistribution && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Grade Distribution ({latestDistribution.term})
            </h3>
            <div className="space-y-3">
              {gradeData.map(({ grade, count }) => (
                <div key={grade} className="flex items-center gap-3">
                  <div className="w-12 text-sm font-medium text-slate-700">{grade}</div>
                  <div className="flex-1 bg-slate-100 rounded-full h-6 relative overflow-hidden">
                    <div
                      className={`absolute left-0 top-0 h-full ${getGradeColor(grade).split(' ')[0]} transition-all duration-500`}
                      style={{ width: `${(count / maxCount) * 100}%` }}
                    />
                  </div>
                  <div className="text-sm text-slate-600 w-16 text-right">
                    {count} ({((count / latestDistribution.totalGraded) * 100).toFixed(1)}%)
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
              <span className="text-slate-600">Total Students: {latestDistribution.totalGraded}</span>
              <span className="font-medium text-slate-900">Average GPA: {latestDistribution.avgGPA.toFixed(2)}</span>
            </div>
          </div>
        )}

        {/* Prerequisites Graph */}
        {(course.prerequisites.length > 0 || course.prerequisiteFor.length > 0) && (
          <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Course Dependencies</h3>
            <div className="grid md:grid-cols-2 gap-6">
              {course.prerequisites.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Prerequisites</h4>
                  <div className="space-y-2">
                    {course.prerequisites.map(prereq => (
                      <Link
                        key={prereq.id}
                        href={`/courses/${prereq.id}`}
                        className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="font-medium text-slate-900">{prereq.code}</div>
                        <div className="text-sm text-slate-600">{prereq.name}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {course.prerequisiteFor.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-3">Unlocks</h4>
                  <div className="space-y-2">
                    {course.prerequisiteFor.map(next => (
                      <Link
                        key={next.id}
                        href={`/courses/${next.id}`}
                        className="block p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                      >
                        <div className="font-medium text-slate-900">{next.code}</div>
                        <div className="text-sm text-slate-600">{next.name}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">
              Student Reviews ({reviewsWithParsedData.length})
            </h3>
            {avgRatings && (
              <div className="flex items-center gap-4 text-sm">
                <div>Content: {['F', 'D', 'C', 'B', 'A'][Math.round(avgRatings.content) - 1] || 'N/A'}</div>
                <div>Teaching: {['F', 'D', 'C', 'B', 'A'][Math.round(avgRatings.teaching) - 1] || 'N/A'}</div>
                <div>Grading: {['F', 'D', 'C', 'B', 'A'][Math.round(avgRatings.grading) - 1] || 'N/A'}</div>
                <div>Workload: {['F', 'D', 'C', 'B', 'A'][Math.round(avgRatings.workload) - 1] || 'N/A'}</div>
              </div>
            )}
          </div>

          {/* Review Submission Form */}
          <div id="review-form" className="bg-white rounded-lg border border-slate-200 p-6 scroll-mt-24">
            <ReviewForm courseId={course.id} courseName={`${course.code}: ${course.name}`} />
          </div>

          {/* Existing Reviews */}
          {reviewsWithParsedData.length === 0 ? (
            <div className="bg-white rounded-lg border border-slate-200 p-12 text-center">
              <MessageSquare className="mx-auto h-12 w-12 text-slate-300 mb-4" />
              <p className="text-slate-600">No reviews yet. Be the first to review this course!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviewsWithParsedData.map((review, index) => {
                // Review gating: only first review (highest-voted) is fully visible for non-contributors
                const isGated = !course.reviewAccess.hasFullAccess && index > 0

                const reviewCard = (
                  <div key={review.id} className="bg-white rounded-lg border border-slate-200 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-medium text-slate-900">{review.title || 'Untitled Review'}</h4>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getGradeColor(review.gradeReceived)}`}>
                            Grade: {review.gradeReceived}
                          </span>
                        </div>
                        <div className="text-sm text-slate-600 mt-1">
                          {review.term} · {review.instructor?.name || 'Unknown Instructor'}
                        </div>
                      </div>
                      <div className="text-sm text-slate-500">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Rating Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div className={`p-3 rounded-lg border ${getRatingColor(review.contentRating)}`}>
                        <div className="text-xs font-medium mb-1">Content</div>
                        <div className="text-lg font-bold">{review.contentRating}</div>
                      </div>
                      <div className={`p-3 rounded-lg border ${getRatingColor(review.teachingRating)}`}>
                        <div className="text-xs font-medium mb-1">Teaching</div>
                        <div className="text-lg font-bold">{review.teachingRating}</div>
                      </div>
                      <div className={`p-3 rounded-lg border ${getRatingColor(review.gradingRating)}`}>
                        <div className="text-xs font-medium mb-1">Grading</div>
                        <div className="text-lg font-bold">{review.gradingRating}</div>
                      </div>
                      <div className={`p-3 rounded-lg border ${getRatingColor(review.workloadRating)}`}>
                        <div className="text-xs font-medium mb-1">Workload</div>
                        <div className="text-lg font-bold">{review.workloadRating}</div>
                      </div>
                    </div>

                    {/* Comments */}
                    <div className="space-y-3 mb-4">
                      {review.contentComment && (
                        <div>
                          <span className="text-sm font-medium text-slate-700">Content:</span>
                          <p className="text-sm text-slate-600 mt-1">{review.contentComment}</p>
                        </div>
                      )}
                      {review.teachingComment && (
                        <div>
                          <span className="text-sm font-medium text-slate-700">Teaching:</span>
                          <p className="text-sm text-slate-600 mt-1">{review.teachingComment}</p>
                        </div>
                      )}
                      {review.gradingComment && (
                        <div>
                          <span className="text-sm font-medium text-slate-700">Grading:</span>
                          <p className="text-sm text-slate-600 mt-1">{review.gradingComment}</p>
                        </div>
                      )}
                      {review.workloadComment && (
                        <div>
                          <span className="text-sm font-medium text-slate-700">Workload:</span>
                          <p className="text-sm text-slate-600 mt-1">{review.workloadComment}</p>
                        </div>
                      )}
                    </div>

                    {/* Assessments */}
                    {review.assessments && review.assessments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {review.assessments.map((assessment: string) => (
                          <span key={assessment} className="px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded">
                            {assessment}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Resource Link */}
                    {review.resourceLink && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <a
                          href={review.resourceLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-700 hover:text-blue-900"
                        >
                          📎 Course Resources Available
                        </a>
                      </div>
                    )}

                    {/* Vote Button */}
                    <div className="mb-4 pt-4 border-t border-slate-100">
                      <VoteButton
                        reviewId={review.id}
                        initialVoteCount={review.votes?.length || 0}
                        initialIsVoted={
                          session?.user?.email
                            ? review.votes?.some((vote: any) => vote.user?.email === session?.user?.email) || false
                            : false
                        }
                        userEmail={session?.user?.email || undefined}
                      />
                    </div>

                    {/* Comments Section */}
                    <CommentSection
                      reviewId={review.id}
                      comments={review.comments}
                      userEmail={session?.user?.email}
                    />
                  </div>
                )

                if (isGated) {
                  // Show the first frosted review, then the gate overlay, then remaining frosted
                  return (
                    <div key={review.id}>
                      {/* Show unlock CTA after the first frosted review */}
                      {index === 1 && (
                        <ReviewGateOverlay
                          totalReviews={course.reviewAccess.totalReviews}
                          userReviewCount={course.reviewAccess.userReviewCount}
                          isLoggedIn={!!session?.user}
                          courseId={course.id}
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
      </div>
    </div>
  )
}
