import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { Calendar, LogOut, BookOpen, Star, MessageSquare, ThumbsUp, Trophy, Zap } from 'lucide-react'
import { signOut } from '@/auth'
import { computeContributorLevel, getAllLevels } from '@/lib/contributorLevel'
import { toOfficialCode } from '@/lib/courseCodeDisplay'
import { NicknameEditor } from '@/components/NicknameEditor'

export default async function ProfilePage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect('/auth/signin')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      reviews: {
        include: {
          course: true,
          instructor: true,
          votes: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      savedCourses: {
        include: {
          course: {
            include: {
              school: true,
              _count: { select: { reviews: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      comments: true,
    },
  })

  if (!user) {
    redirect('/auth/signin')
  }

  // Calculate stats
  const totalReviews = user.reviews.length
  const totalUpvotes = user.reviews.reduce((sum, r) => sum + r.votes.length, 0)
  const totalComments = user.comments.length
  const contributorInfo = computeContributorLevel(totalReviews, totalUpvotes)
  const allLevels = getAllLevels()

  // XP progress to next level
  const currentLevelDef = allLevels[contributorInfo.level]
  const nextLevelDef = allLevels[contributorInfo.level + 1]
  let xpProgress = 100 // max level
  if (nextLevelDef) {
    const currentMin = currentLevelDef.minReviews
    const nextMin = nextLevelDef.minReviews
    xpProgress = Math.min(100, Math.round(((totalReviews - currentMin) / (nextMin - currentMin)) * 100))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/courses" className="text-slate-600 hover:text-slate-900">Courses</Link>
            <Link href="/instructors" className="text-slate-600 hover:text-slate-900">Instructors</Link>
            <Link href="/profile" className="text-uw-red font-medium">Profile</Link>
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-uw-red rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {(user.nickname || user.name || user.email.charAt(0)).charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <NicknameEditor
                    currentNickname={user.nickname || user.name || 'Anonymous Badger'}
                    initial={(user.nickname || user.name || user.email.charAt(0)).charAt(0).toUpperCase()}
                  />
                  {contributorInfo.level > 0 && (
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${contributorInfo.color}`}>
                      {contributorInfo.badge} {contributorInfo.title}
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 flex items-center gap-2 mt-1">
                  <Calendar size={14} />
                  Joined {new Date(user.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>
            <form
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/' })
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
              >
                <LogOut size={16} />
                Sign Out
              </button>
            </form>
          </div>

          {/* Level Progress */}
          {contributorInfo.nextLevel && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center justify-between text-sm mb-2">
                <div className="flex items-center gap-2 text-slate-700">
                  <Trophy size={14} />
                  <span className="font-medium">Level {contributorInfo.level}: {contributorInfo.title}</span>
                </div>
                <span className="text-slate-500">
                  Next: {contributorInfo.nextLevel.title}
                  {contributorInfo.nextLevel.reviewsNeeded > 0 && ` (${contributorInfo.nextLevel.reviewsNeeded} more reviews)`}
                  {contributorInfo.nextLevel.upvotesNeeded > 0 && ` (${contributorInfo.nextLevel.upvotesNeeded} more upvotes)`}
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div
                  className="bg-uw-red h-2.5 rounded-full transition-all"
                  style={{ width: `${xpProgress}%` }}
                />
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-slate-500">
                <Zap size={12} />
                {user.xp} XP earned
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-center">
            <div className="text-2xl font-bold text-uw-red">{totalReviews}</div>
            <div className="text-xs text-slate-600 mt-1 flex items-center justify-center gap-1">
              <MessageSquare size={12} />
              Reviews
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-center">
            <div className="text-2xl font-bold text-uw-red">{totalUpvotes}</div>
            <div className="text-xs text-slate-600 mt-1 flex items-center justify-center gap-1">
              <ThumbsUp size={12} />
              Upvotes
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-center">
            <div className="text-2xl font-bold text-uw-red">{totalComments}</div>
            <div className="text-xs text-slate-600 mt-1 flex items-center justify-center gap-1">
              <MessageSquare size={12} />
              Comments
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 text-center">
            <div className="text-2xl font-bold text-uw-red">{user.savedCourses.length}</div>
            <div className="text-xs text-slate-600 mt-1 flex items-center justify-center gap-1">
              <BookOpen size={12} />
              Saved
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* My Reviews */}
          <div id="reviews" className="lg:col-span-2 scroll-mt-24">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">My Reviews ({totalReviews})</h2>
              {user.reviews.length > 0 ? (
                <div className="space-y-4">
                  {user.reviews.map((review) => (
                    <Link
                      key={review.id}
                      href={`/courses/${review.courseId}`}
                      className="block p-4 border border-slate-200 rounded-lg hover:border-uw-red transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-900">{toOfficialCode(review.course.code)}: {review.course.name}</h3>
                          <p className="text-sm text-slate-600">{review.instructor.name} · {review.term}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-1 bg-slate-100 rounded text-xs font-medium text-slate-700">
                            {review.gradeReceived}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-0.5">
                            <ThumbsUp size={10} /> {review.votes.length}
                          </span>
                        </div>
                      </div>
                      {/* Compact ratings */}
                      <div className="flex gap-2 mb-2">
                        {[
                          { label: 'Content', value: review.contentRating },
                          { label: 'Teaching', value: review.teachingRating },
                          { label: 'Grading', value: review.gradingRating },
                          { label: 'Workload', value: review.workloadRating },
                        ].map(r => (
                          <span key={r.label} className="px-1.5 py-0.5 text-[10px] rounded bg-slate-50 text-slate-600">
                            {r.label[0]}: {r.value}
                          </span>
                        ))}
                      </div>
                      {review.title && (
                        <p className="text-sm text-slate-600 line-clamp-1">{review.title}</p>
                      )}
                      <div className="text-xs text-slate-400 mt-2">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="mx-auto h-10 w-10 text-slate-300 mb-3" />
                  <p className="text-slate-500">
                    No reviews yet.{' '}
                    <Link href="/courses" className="text-uw-red hover:text-uw-dark font-medium">
                      Browse courses to get started!
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar: Saved Courses + Level Info */}
          <div className="space-y-6">
            {/* Contributor Level Card */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <Trophy size={18} />
                Contributor Level
              </h2>
              <div className="space-y-3">
                {allLevels.map(levelDef => {
                  const isReached = contributorInfo.level >= levelDef.level
                  const isCurrent = contributorInfo.level === levelDef.level
                  return (
                    <div
                      key={levelDef.level}
                      className={`flex items-center gap-3 p-2 rounded-lg ${
                        isCurrent
                          ? 'bg-uw-red/10 border border-uw-red/30 shadow-sm'
                          : isReached
                          ? 'bg-green-50/50'
                          : 'bg-slate-50'
                      }`}
                    >
                      <span className="text-lg">{levelDef.badge || '⚪'}</span>
                      <div className="flex-1">
                        <div className={`text-sm font-medium ${isCurrent ? 'text-uw-red' : isReached ? 'text-slate-700' : 'text-slate-600'}`}>
                          {levelDef.title}
                        </div>
                        <div className={`text-[11px] ${isCurrent || isReached ? 'text-slate-500' : 'text-slate-400'}`}>
                          {levelDef.minReviews > 0 ? `${levelDef.minReviews} reviews` : 'Start here'}
                          {levelDef.minUpvotes > 0 && ` + ${levelDef.minUpvotes} upvotes`}
                        </div>
                      </div>
                      {isReached && !isCurrent && <span className="text-green-600 text-xs font-medium">✓</span>}
                      {isCurrent && <span className="text-uw-red text-xs font-bold">◄</span>}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Saved Courses */}
            <div id="saved" className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 scroll-mt-24">
              <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                <BookOpen size={18} />
                Saved Courses ({user.savedCourses.length})
              </h2>
              {user.savedCourses.length > 0 ? (
                <div className="space-y-2">
                  {user.savedCourses.map((saved) => (
                    <Link
                      key={saved.id}
                      href={`/courses/${saved.courseId}`}
                      className="block p-3 border border-slate-200 rounded-lg hover:border-uw-red transition-colors"
                    >
                      <div className="font-medium text-sm text-slate-900">{toOfficialCode(saved.course.code)}</div>
                      <div className="text-xs text-slate-600 mt-0.5 line-clamp-1">{saved.course.name}</div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                        <span>{saved.course.credits} cr</span>
                        {saved.course.avgGPA != null && saved.course.avgGPA > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Star size={10} /> {saved.course.avgGPA.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  No saved courses yet.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
