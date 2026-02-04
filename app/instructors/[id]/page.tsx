'use client'

import { notFound, useParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { BookOpen, MessageSquare, Star, ChevronRight, Users } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { useSession } from 'next-auth/react'

function getRatingLabel(avg: number): string {
  const labels = ['F', 'D', 'C', 'B', 'A']
  return labels[Math.round(avg) - 1] || 'N/A'
}

function getRatingColor(avg: number): string {
  if (avg >= 4.5) return 'bg-green-100 text-green-700 border-green-200'
  if (avg >= 3.5) return 'bg-blue-100 text-blue-700 border-blue-200'
  if (avg >= 2.5) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
  if (avg >= 1.5) return 'bg-orange-100 text-orange-700 border-orange-200'
  return 'bg-red-100 text-red-700 border-red-200'
}

export default function InstructorPage() {
  const params = useParams()
  const id = params.id as string
  const { data: session } = useSession()

  const { data: instructor, isLoading, error } = trpc.instructor.byId.useQuery({ id })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50/50">
        <header className="bg-white border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              <Link href="/" className="flex items-center gap-2">
                <Logo size={32} />
                <span className="text-xl font-bold text-slate-900">WiscFlow</span>
              </Link>
            </div>
          </div>
        </header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-slate-200 rounded" />
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <div className="h-10 w-64 bg-slate-200 rounded mb-4" />
              <div className="h-6 w-32 bg-slate-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !instructor) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={32} />
              <span className="text-xl font-bold text-slate-900">WiscFlow</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/courses" className="text-slate-600 hover:text-slate-900">Courses</Link>
              <Link href="/instructors" className="text-uw-red font-medium">Instructors</Link>
              <Link href="/about" className="text-slate-600 hover:text-slate-900">About</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-slate-600 mb-6">
          <Link href="/instructors" className="hover:text-slate-900">Instructors</Link>
          <ChevronRight size={16} />
          <span className="text-slate-900 font-medium">{instructor.name}</span>
        </div>

        {/* Instructor Header */}
        <div className="bg-white rounded-lg border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 font-bold text-xl">
              {instructor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{instructor.name}</h1>
              <div className="flex items-center gap-4 text-sm text-slate-600 mt-1">
                <div className="flex items-center gap-1">
                  <BookOpen size={14} />
                  {instructor.courses.length} course{instructor.courses.length !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-1">
                  <MessageSquare size={14} />
                  {instructor.reviews.length} review{instructor.reviews.length !== 1 ? 's' : ''}
                </div>
              </div>
            </div>
          </div>

          {/* Average Ratings */}
          {instructor.avgRatings && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
              {[
                { label: 'Content', value: instructor.avgRatings.content },
                { label: 'Teaching', value: instructor.avgRatings.teaching },
                { label: 'Grading', value: instructor.avgRatings.grading },
                { label: 'Workload', value: instructor.avgRatings.workload },
              ].map(r => (
                <div key={r.label} className={`p-3 rounded-lg border ${getRatingColor(r.value)}`}>
                  <div className="text-xs font-medium mb-1">{r.label}</div>
                  <div className="text-lg font-bold">{getRatingLabel(r.value)}</div>
                  <div className="text-xs opacity-70">{r.value.toFixed(1)} / 5</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Courses Taught */}
          <div className="lg:col-span-1">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Courses Taught</h2>
            <div className="space-y-2">
              {instructor.courses.length > 0 ? (
                instructor.courses.map(ci => (
                  <Link
                    key={ci.course.id}
                    href={`/courses/${ci.course.id}`}
                    className="block bg-white rounded-lg border border-slate-200 p-3 hover:shadow-sm transition-shadow"
                  >
                    <div className="font-medium text-slate-900 text-sm">{ci.course.code}</div>
                    <div className="text-xs text-slate-600 mt-0.5 line-clamp-1">{ci.course.name}</div>
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
                      {ci.course.avgGPA && (
                        <span className="flex items-center gap-0.5">
                          <Star size={10} /> {ci.course.avgGPA.toFixed(2)}
                        </span>
                      )}
                      <span>{ci.course._count.reviews} reviews</span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-sm text-slate-500">No courses linked yet.</p>
              )}
            </div>
          </div>

          {/* Reviews */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">
              Student Reviews ({instructor.reviews.length})
            </h2>
            {instructor.reviews.length > 0 ? (
              <div className="space-y-4">
                {instructor.reviews.map(review => (
                  <div key={review.id} className="bg-white rounded-lg border border-slate-200 p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <Link
                          href={`/courses/${review.course.id}`}
                          className="text-sm font-medium text-uw-red hover:text-uw-dark"
                        >
                          {review.course.code}: {review.course.name}
                        </Link>
                        <div className="text-xs text-slate-500 mt-1">
                          {review.term} · Grade: {review.gradeReceived}
                        </div>
                      </div>
                      <div className="text-xs text-slate-400">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </div>

                    {/* Compact Ratings */}
                    <div className="flex gap-2 mb-3">
                      {[
                        { label: 'C', value: review.contentRating },
                        { label: 'T', value: review.teachingRating },
                        { label: 'G', value: review.gradingRating },
                        { label: 'W', value: review.workloadRating },
                      ].map(r => (
                        <span key={r.label} className="px-2 py-1 text-xs rounded bg-slate-100 text-slate-700 font-medium">
                          {r.label}: {r.value}
                        </span>
                      ))}
                    </div>

                    {/* First non-empty comment as preview */}
                    {(review.teachingComment || review.contentComment) && (
                      <p className="text-sm text-slate-600 line-clamp-3">
                        {review.teachingComment || review.contentComment}
                      </p>
                    )}

                    <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                      <span>👍 {review.votes.length}</span>
                      <Link
                        href={`/courses/${review.course.id}`}
                        className="text-uw-red hover:text-uw-dark ml-auto"
                      >
                        View full review →
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg border border-slate-200 p-8 text-center">
                <MessageSquare className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                <p className="text-slate-600 text-sm">No reviews yet for this instructor.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
