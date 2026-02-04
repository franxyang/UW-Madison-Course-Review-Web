import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { User, Mail, Calendar, LogOut } from 'lucide-react'
import { signOut } from '@/auth'

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
          instructor: true
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      },
      savedCourses: {
        include: {
          course: true
        },
        take: 5
      }
    }
  })

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-bold text-xl text-slate-900">WiscFlow</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/courses" className="text-slate-600 hover:text-slate-900">
              Courses
            </Link>
            <Link href="/profile" className="text-uw-red font-medium">
              Profile
            </Link>
          </nav>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-uw-red rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{user.name || 'Anonymous Badger'}</h1>
                <p className="text-slate-600 flex items-center gap-2 mt-1">
                  <Mail size={16} />
                  {user.email}
                </p>
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
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
            <div className="text-3xl font-bold text-uw-red">{user.reviews.length}</div>
            <div className="text-sm text-slate-600 mt-1">Reviews Written</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
            <div className="text-3xl font-bold text-uw-red">{user.savedCourses.length}</div>
            <div className="text-sm text-slate-600 mt-1">Saved Courses</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 text-center">
            <div className="text-3xl font-bold text-slate-400">0</div>
            <div className="text-sm text-slate-600 mt-1">Helpful Votes</div>
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Reviews</h2>
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
                      <h3 className="font-semibold text-slate-900">{review.course.code} - {review.course.name}</h3>
                      <p className="text-sm text-slate-600">{review.instructor.name} • {review.term}</p>
                    </div>
                    <span className="px-2 py-1 bg-slate-100 rounded text-sm font-medium text-slate-700">
                      Grade: {review.gradeReceived}
                    </span>
                  </div>
                  {review.title && <p className="text-slate-700 text-sm">{review.title}</p>}
                </Link>
              ))}
              <Link
                href="/profile/reviews"
                className="block text-center text-uw-red hover:text-uw-dark font-medium mt-4"
              >
                View All Reviews →
              </Link>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">
              You haven't written any reviews yet.{' '}
              <Link href="/courses" className="text-uw-red hover:text-uw-dark font-medium">
                Browse courses to get started!
              </Link>
            </p>
          )}
        </div>

        {/* Saved Courses */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">Saved Courses</h2>
          {user.savedCourses.length > 0 ? (
            <div className="space-y-4">
              {user.savedCourses.map((saved) => (
                <Link
                  key={saved.id}
                  href={`/courses/${saved.courseId}`}
                  className="block p-4 border border-slate-200 rounded-lg hover:border-uw-red transition-colors"
                >
                  <h3 className="font-semibold text-slate-900">{saved.course.code} - {saved.course.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">{saved.course.credits} credits</p>
                </Link>
              ))}
              <Link
                href="/profile/saved"
                className="block text-center text-uw-red hover:text-uw-dark font-medium mt-4"
              >
                View All Saved Courses →
              </Link>
            </div>
          ) : (
            <p className="text-slate-500 text-center py-8">
              You haven't saved any courses yet.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
