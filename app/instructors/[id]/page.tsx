'use client'

import { notFound, useParams } from 'next/navigation'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { BookOpen, MessageSquare, Star, ChevronRight, Calendar, TrendingUp } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

function getRatingLabel(avg: number): string {
  if (avg >= 4.5) return 'A'
  if (avg >= 3.5) return 'AB'
  if (avg >= 2.5) return 'B'
  if (avg >= 1.5) return 'BC'
  return 'C'
}

function getRatingColor(avg: number): string {
  if (avg >= 4.5) return 'text-emerald-500'
  if (avg >= 3.5) return 'text-emerald-400'
  if (avg >= 2.5) return 'text-amber-500'
  if (avg >= 1.5) return 'text-orange-500'
  return 'text-red-500'
}

function getTagsFromRatings(avgRatings: { content: number; teaching: number; grading: number; workload: number } | null) {
  if (!avgRatings) return []
  
  const tags = []
  
  // Teaching style tags based on ratings
  if (avgRatings.teaching >= 4) tags.push({ emoji: '🎯', label: 'Clear Explanations', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' })
  if (avgRatings.content >= 4) tags.push({ emoji: '📚', label: 'Well Organized', color: 'bg-blue-50 text-blue-700 border-blue-200' })
  if (avgRatings.grading >= 4) tags.push({ emoji: '✅', label: 'Fair Grading', color: 'bg-purple-50 text-purple-700 border-purple-200' })
  if (avgRatings.workload <= 2.5) tags.push({ emoji: '⚡', label: 'Light Workload', color: 'bg-amber-50 text-amber-700 border-amber-200' })
  if (avgRatings.workload >= 4) tags.push({ emoji: '📖', label: 'Challenging', color: 'bg-orange-50 text-orange-700 border-orange-200' })
  if (avgRatings.teaching >= 3 && avgRatings.content >= 3) tags.push({ emoji: '💡', label: 'Engaging', color: 'bg-pink-50 text-pink-700 border-pink-200' })
  
  return tags.slice(0, 4) // Max 4 tags
}

// Radar Chart Component
function RadarChart({ ratings }: { ratings: { content: number; teaching: number; grading: number; workload: number } }) {
  // Normalize ratings to 0-1 scale (assuming 1-5 scale)
  const normalize = (val: number) => (val - 1) / 4
  
  const content = normalize(ratings.content)
  const teaching = normalize(ratings.teaching)
  const grading = normalize(ratings.grading)
  const workload = normalize(ratings.workload)
  
  // Calculate points for the radar chart (4 axes)
  const centerX = 50
  const centerY = 50
  const maxRadius = 35
  
  const points = [
    { x: centerX, y: centerY - maxRadius * content }, // Content (top)
    { x: centerX + maxRadius * teaching, y: centerY }, // Teaching (right)
    { x: centerX, y: centerY + maxRadius * grading }, // Grading (bottom)
    { x: centerX - maxRadius * workload, y: centerY }, // Workload (left)
  ]
  
  const pathData = `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y} L ${points[2].x} ${points[2].y} L ${points[3].x} ${points[3].y} Z`
  
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      {/* Background grid */}
      <polygon 
        points={`${centerX},${centerY-maxRadius} ${centerX+maxRadius},${centerY} ${centerX},${centerY+maxRadius} ${centerX-maxRadius},${centerY}`}
        fill="none" 
        stroke="#e5e5e5" 
        strokeWidth="1"
      />
      <polygon 
        points={`${centerX},${centerY-maxRadius*0.66} ${centerX+maxRadius*0.66},${centerY} ${centerX},${centerY+maxRadius*0.66} ${centerX-maxRadius*0.66},${centerY}`}
        fill="none" 
        stroke="#e5e5e5" 
        strokeWidth="0.5"
      />
      <polygon 
        points={`${centerX},${centerY-maxRadius*0.33} ${centerX+maxRadius*0.33},${centerY} ${centerX},${centerY+maxRadius*0.33} ${centerX-maxRadius*0.33},${centerY}`}
        fill="none" 
        stroke="#e5e5e5" 
        strokeWidth="0.5"
      />
      
      {/* Axis lines */}
      <line x1={centerX} y1={centerY} x2={centerX} y2={centerY-maxRadius} stroke="#e5e5e5" strokeWidth="0.5" />
      <line x1={centerX} y1={centerY} x2={centerX+maxRadius} y2={centerY} stroke="#e5e5e5" strokeWidth="0.5" />
      <line x1={centerX} y1={centerY} x2={centerX} y2={centerY+maxRadius} stroke="#e5e5e5" strokeWidth="0.5" />
      <line x1={centerX} y1={centerY} x2={centerX-maxRadius} y2={centerY} stroke="#e5e5e5" strokeWidth="0.5" />
      
      {/* Data polygon */}
      <path 
        d={pathData}
        fill="rgba(197, 5, 12, 0.15)" 
        stroke="#c5050c" 
        strokeWidth="2"
      />
      
      {/* Data points */}
      {points.map((point, i) => (
        <circle key={i} cx={point.x} cy={point.y} r="3" fill="#c5050c" />
      ))}
      
      {/* Labels */}
      <text x={centerX} y="8" fontSize="7" textAnchor="middle" fill="#666">Content</text>
      <text x="95" y={centerY+2} fontSize="7" textAnchor="end" fill="#666">Teaching</text>
      <text x={centerX} y="97" fontSize="7" textAnchor="middle" fill="#666">Grading</text>
      <text x="5" y={centerY+2} fontSize="7" textAnchor="start" fill="#666">Workload</text>
    </svg>
  )
}

export default function InstructorPage() {
  const params = useParams()
  const id = params.id as string
  const { data: session } = useSession()

  const { data: instructor, isLoading, error } = trpc.instructor.byId.useQuery({ id })

  // Extract unique terms for timeline
  const teachingTimeline = useMemo(() => {
    if (!instructor?.reviews) return []
    
    const termMap = new Map<string, { term: string; courses: Set<string> }>()
    
    instructor.reviews.forEach(review => {
      if (!termMap.has(review.term)) {
        termMap.set(review.term, { term: review.term, courses: new Set() })
      }
      termMap.get(review.term)!.courses.add(review.course.code)
    })
    
    return Array.from(termMap.values())
      .sort((a, b) => a.term.localeCompare(b.term))
      .slice(-6) // Last 6 terms
  }, [instructor?.reviews])

  // Get teaching style tags
  const teachingTags = useMemo(() => {
    return getTagsFromRatings(instructor?.avgRatings || null)
  }, [instructor?.avgRatings])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-surface-secondary">
        <header className="bg-surface-primary border-b border-surface-tertiary">
          <div className="max-w-6xl mx-auto px-6">
            <div className="flex items-center h-16">
              <Link href="/" className="flex items-center gap-2">
                <Logo size={32} />
                <span className="text-xl font-bold text-text-primary">WiscFlow</span>
              </Link>
            </div>
          </div>
        </header>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-surface-tertiary rounded" />
            <div className="bg-surface-primary rounded-xl p-6">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-surface-tertiary rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="h-8 w-64 bg-surface-tertiary rounded" />
                  <div className="h-4 w-32 bg-surface-tertiary rounded" />
                </div>
              </div>
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
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <header className="bg-surface-primary border-b border-surface-tertiary sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={32} />
              <span className="text-xl font-bold text-text-primary">WiscFlow</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/courses" className="text-text-secondary hover:text-text-primary transition-colors">Courses</Link>
              <Link href="/instructors" className="text-wf-crimson font-medium">Instructors</Link>
              <Link href="/about" className="text-text-secondary hover:text-text-primary transition-colors">About</Link>
            </nav>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-text-secondary mb-6">
          <Link href="/instructors" className="hover:text-text-primary transition-colors">Instructors</Link>
          <ChevronRight size={16} />
          <span className="text-text-primary font-medium">{instructor.name}</span>
        </div>

        {/* Teaching Portfolio Card */}
        <div className="bg-surface-primary rounded-2xl border border-surface-tertiary p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Left: Avatar + Info */}
            <div className="flex-1">
              <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-20 h-20 bg-wf-crimson rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg">
                  {instructor.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-text-primary">{instructor.name}</h1>
                  <p className="text-text-secondary text-sm mt-1">
                    {instructor.courses.length > 0 
                      ? `Teaching ${instructor.courses.map(c => c.course.code.split(' ')[0]).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`
                      : 'Instructor'}
                  </p>
                  
                  {/* Teaching Style Tags */}
                  {teachingTags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {teachingTags.map((tag, i) => (
                        <span 
                          key={i}
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${tag.color}`}
                        >
                          <span>{tag.emoji}</span>
                          {tag.label}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Radar Chart */}
            {instructor.avgRatings && (
              <div className="w-40 h-40 flex-shrink-0">
                <RadarChart ratings={instructor.avgRatings} />
              </div>
            )}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-4 text-center">
            <div className={`text-2xl font-bold ${instructor.avgRatings ? getRatingColor((instructor.avgRatings.content + instructor.avgRatings.teaching + instructor.avgRatings.grading + instructor.avgRatings.workload) / 4) : 'text-text-primary'}`}>
              {instructor.avgRatings 
                ? getRatingLabel((instructor.avgRatings.content + instructor.avgRatings.teaching + instructor.avgRatings.grading + instructor.avgRatings.workload) / 4)
                : 'N/A'}
            </div>
            <div className="text-xs text-text-tertiary mt-1">Avg Rating</div>
          </div>
          <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-4 text-center">
            <div className="text-2xl font-bold text-text-primary">{instructor.reviews.length}</div>
            <div className="text-xs text-text-tertiary mt-1">Total Reviews</div>
          </div>
          <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-4 text-center">
            <div className="text-2xl font-bold text-text-primary">{instructor.courses.length}</div>
            <div className="text-xs text-text-tertiary mt-1">Courses</div>
          </div>
          <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-4 text-center">
            <div className="text-2xl font-bold text-text-primary">
              {teachingTimeline.length > 0 ? teachingTimeline[0].term.split('-')[0] : '—'}
            </div>
            <div className="text-xs text-text-tertiary mt-1">Since</div>
          </div>
        </div>

        {/* Teaching Timeline */}
        {teachingTimeline.length > 0 && (
          <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-5 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={18} className="text-wf-crimson" />
              <h2 className="font-semibold text-text-primary">Teaching Timeline</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-text-tertiary w-20">{teachingTimeline[0]?.term}</span>
              <div className="flex-1 h-2 bg-gradient-to-r from-wf-crimson to-emerald-400 rounded-full relative">
                {teachingTimeline.map((item, i) => (
                  <div 
                    key={item.term}
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-wf-crimson rounded-full cursor-pointer hover:scale-125 transition-transform"
                    style={{ left: `${(i / (teachingTimeline.length - 1 || 1)) * 100}%`, transform: 'translate(-50%, -50%)' }}
                    title={`${item.term}: ${Array.from(item.courses).join(', ')}`}
                  />
                ))}
              </div>
              <span className="text-xs text-text-tertiary w-20 text-right">{teachingTimeline[teachingTimeline.length - 1]?.term}</span>
            </div>
            <div className="flex justify-between mt-2 px-20">
              {teachingTimeline.slice(0, 4).map(item => (
                <div key={item.term} className="text-center">
                  <div className="text-[10px] text-text-tertiary">{Array.from(item.courses)[0]}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Content Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Courses Taught */}
          <div className="lg:col-span-1">
            <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-5">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={18} className="text-wf-crimson" />
                <h2 className="font-semibold text-text-primary">Courses Taught</h2>
              </div>
              
              {instructor.courses.length > 0 ? (
                <div className="space-y-2">
                  {instructor.courses.map(ci => (
                    <Link
                      key={ci.course.id}
                      href={`/courses/${ci.course.id}`}
                      className="block p-3 bg-surface-secondary rounded-lg hover:bg-hover-bg transition-colors border border-transparent hover:border-surface-tertiary"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-semibold text-text-primary text-sm">{ci.course.code}</div>
                          <div className="text-xs text-text-secondary mt-0.5 line-clamp-1">{ci.course.name}</div>
                        </div>
                        {ci.course.avgGPA != null && ci.course.avgGPA > 0 && (
                          <div className={`text-sm font-bold ${
                            ci.course.avgGPA >= 3.5 ? 'text-emerald-500' :
                            ci.course.avgGPA >= 3.0 ? 'text-emerald-400' :
                            ci.course.avgGPA >= 2.5 ? 'text-amber-500' : 'text-orange-500'
                          }`}>
                            {ci.course.avgGPA.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-2 text-xs text-text-tertiary">
                        <Star size={10} className="text-amber-400" />
                        {ci.course._count.reviews} reviews
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-tertiary text-center py-4">No courses linked yet.</p>
              )}
            </div>
          </div>

          {/* Student Reviews */}
          <div className="lg:col-span-2">
            <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare size={18} className="text-wf-crimson" />
                  <h2 className="font-semibold text-text-primary">Student Reviews ({instructor.reviews.length})</h2>
                </div>
              </div>
              
              {instructor.reviews.length > 0 ? (
                <div className="space-y-4">
                  {instructor.reviews.slice(0, 6).map(review => (
                    <div key={review.id} className="p-4 bg-surface-secondary rounded-lg border border-surface-tertiary">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <Link
                            href={`/courses/${review.course.id}`}
                            className="text-sm font-semibold text-wf-crimson hover:text-wf-crimson-dark transition-colors"
                          >
                            {review.course.code}
                          </Link>
                          <div className="text-xs text-text-tertiary mt-0.5">
                            {review.term} · Grade: {review.gradeReceived}
                          </div>
                        </div>
                        <div className="text-xs text-text-tertiary">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Compact Ratings */}
                      <div className="flex gap-1.5 mb-3">
                        {[
                          { label: 'Content', value: review.contentRating },
                          { label: 'Teaching', value: review.teachingRating },
                          { label: 'Grading', value: review.gradingRating },
                          { label: 'Workload', value: review.workloadRating },
                        ].map(r => (
                          <span 
                            key={r.label} 
                            className={`px-2 py-1 text-xs rounded font-medium ${
                              ['A', 'AB'].includes(r.value) ? 'bg-emerald-50 text-emerald-700' :
                              ['B', 'BC'].includes(r.value) ? 'bg-amber-50 text-amber-700' :
                              'bg-orange-50 text-orange-700'
                            }`}
                          >
                            {r.value}
                          </span>
                        ))}
                      </div>

                      {/* Comment Preview */}
                      {(review.teachingComment || review.contentComment) && (
                        <p className="text-sm text-text-secondary line-clamp-2">
                          {review.teachingComment || review.contentComment}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-text-tertiary">👍 {review.votes.length} helpful</span>
                        <Link
                          href={`/courses/${review.course.id}`}
                          className="text-wf-crimson hover:text-wf-crimson-dark transition-colors"
                        >
                          View full review →
                        </Link>
                      </div>
                    </div>
                  ))}
                  
                  {instructor.reviews.length > 6 && (
                    <p className="text-center text-sm text-text-tertiary py-2">
                      + {instructor.reviews.length - 6} more reviews
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-10 w-10 text-text-tertiary mb-3" />
                  <p className="text-text-secondary text-sm">No reviews yet for this instructor.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
