import { auth } from '@/auth'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { prisma } from '@/lib/prisma'
import { BookOpen, Users, Star, Building2, ArrowRight, MessageSquare, GraduationCap } from 'lucide-react'
import { AcademicCalendar } from '@/components/AcademicCalendar'
import { toOfficialCode } from '@/lib/courseCodeDisplay'
import { HomeSearch } from '@/components/HomeSearch'
import { ContributorProgress } from '@/components/ContributorProgress'
import { ThemeToggle } from '@/components/ThemeToggle'

async function getStats() {
  const [courseCount, reviewCount, instructorCount, departmentCount, schoolCount] = await Promise.all([
    prisma.course.count(),
    prisma.review.count(),
    prisma.instructor.count(),
    prisma.department.count(),
    prisma.school.count(),
  ])
  return { courseCount, reviewCount, instructorCount, departmentCount, schoolCount }
}

async function getFeaturedCourses() {
  const courses = await prisma.course.findMany({
    where: {
      reviews: { some: {} },
      avgGPA: { not: null }
    },
    select: {
      id: true,
      code: true,
      name: true,
      avgGPA: true,
      credits: true,
      level: true,
      _count: { select: { reviews: true } }
    },
    orderBy: { reviews: { _count: 'desc' } },
    take: 6
  })
  return courses
}

async function getRecentReviews() {
  const reviews = await prisma.review.findMany({
    select: {
      id: true,
      title: true,
      createdAt: true,
      course: {
        select: { id: true, code: true, name: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 5
  })
  return reviews
}

export default async function Home() {
  const session = await auth()
  const stats = await getStats()
  const featuredCourses = await getFeaturedCourses()
  const recentReviews = await getRecentReviews()

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Header */}
      <header className="bg-surface-primary border-b border-surface-tertiary sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link href="/" className="flex items-center gap-2">
              <Logo size={32} />
              <span className="font-bold text-xl text-text-primary">WiscFlow</span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link href="/courses" className="text-text-secondary hover:text-text-primary transition-colors">
                Courses
              </Link>
              <Link href="/instructors" className="text-text-secondary hover:text-text-primary transition-colors">
                Instructors
              </Link>
              <ThemeToggle />
              {session?.user ? (
                <Link href="/profile" className="px-4 py-2 bg-wf-crimson text-white rounded-lg hover:bg-wf-crimson-dark transition-colors font-medium">
                  Profile
                </Link>
              ) : (
                <Link href="/auth/signin" className="px-4 py-2 bg-wf-crimson text-white rounded-lg hover:bg-wf-crimson-dark transition-colors font-medium">
                  Sign In
                </Link>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Welcome to WiscFlow 👋
              </h1>
              <p className="text-text-secondary">
                A community-driven platform by UW-Madison students, for UW-Madison students. 
                Browse course reviews, check grade distributions, and make informed decisions about your classes.
              </p>
            </div>
            <div className="lg:w-80">
              <HomeSearch />
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Stats & Featured */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Stats */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-3 text-center">
                <BookOpen className="mx-auto mb-1.5 text-wf-crimson" size={20} />
                <div className="text-xl font-bold text-text-primary">{stats.courseCount.toLocaleString()}</div>
                <div className="text-xs text-text-tertiary">Courses</div>
              </div>
              <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-3 text-center">
                <MessageSquare className="mx-auto mb-1.5 text-emerald-500" size={20} />
                <div className="text-xl font-bold text-text-primary">{stats.reviewCount.toLocaleString()}</div>
                <div className="text-xs text-text-tertiary">Reviews</div>
              </div>
              <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-3 text-center">
                <Users className="mx-auto mb-1.5 text-amber-500" size={20} />
                <div className="text-xl font-bold text-text-primary">{stats.instructorCount.toLocaleString()}</div>
                <div className="text-xs text-text-tertiary">Instructors</div>
              </div>
              <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-3 text-center">
                <GraduationCap className="mx-auto mb-1.5 text-blue-500" size={20} />
                <div className="text-xl font-bold text-text-primary">{stats.departmentCount}</div>
                <div className="text-xs text-text-tertiary">Departments</div>
              </div>
              <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-3 text-center">
                <Building2 className="mx-auto mb-1.5 text-purple-500" size={20} />
                <div className="text-xl font-bold text-text-primary">{stats.schoolCount}</div>
                <div className="text-xs text-text-tertiary">Schools</div>
              </div>
            </div>

            {/* Most Reviewed Courses */}
            <div className="bg-surface-primary rounded-xl border border-surface-tertiary overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-surface-tertiary">
                <h2 className="font-semibold text-text-primary flex items-center gap-2">
                  <Star size={18} className="text-amber-400" />
                  Most Reviewed Courses
                </h2>
                <Link href="/courses" className="text-sm text-wf-crimson hover:text-wf-crimson-dark flex items-center gap-1">
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              <div className="divide-y divide-surface-tertiary">
                {featuredCourses.map(course => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="flex items-center justify-between px-5 py-3 hover:bg-hover-bg transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-text-primary">
                          {toOfficialCode(course.code)}
                        </span>
                        <span className="text-xs text-text-tertiary">
                          {course._count.reviews} reviews
                        </span>
                      </div>
                      <div className="text-sm text-text-secondary truncate">
                        {course.name}
                      </div>
                    </div>
                    {course.avgGPA != null && course.avgGPA > 0 && (
                      <div className={`text-lg font-bold ml-4 ${
                        course.avgGPA >= 3.5 ? 'text-emerald-500' :
                        course.avgGPA >= 3.0 ? 'text-emerald-400' :
                        course.avgGPA >= 2.5 ? 'text-amber-500' : 'text-orange-500'
                      }`}>
                        {course.avgGPA.toFixed(2)}
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-5">
              <h2 className="font-semibold text-text-primary mb-4">Popular Departments</h2>
              <div className="flex flex-wrap gap-2">
                {[
                  { name: 'Computer Sciences', id: 'cml7q3gdh0497nafqn4oqpdrv' },
                  { name: 'Mathematics', id: 'cml7q3gdg045ynafqouzdoac6' },
                  { name: 'Economics', id: 'cml7q3gdh049enafqlqhzh1vz' },
                  { name: 'Psychology', id: 'cml7q3gdh0476nafqi7zki53m' },
                  { name: 'Biology', id: 'cml7q3gdh0489nafqcias0n30' },
                  { name: 'Chemistry', id: 'cml7q3gdh048dnafqdxr0rl89' },
                  { name: 'Physics', id: 'cml7q3gdh04asnafqemjns6ds' },
                  { name: 'Statistics', id: 'cml7q3gdh04bjnafqkb3mm5zz' }
                ].map(dept => (
                  <Link
                    key={dept.id}
                    href={`/courses?departments=${dept.id}`}
                    className="px-3 py-1.5 bg-surface-secondary hover:bg-hover-bg rounded-lg text-sm text-text-secondary hover:text-text-primary transition-colors"
                  >
                    {dept.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Contributor Progress */}
            <ContributorProgress />

            {/* Recent Activity */}
            <div className="bg-surface-primary rounded-xl border border-surface-tertiary overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-tertiary">
                <h2 className="font-semibold text-text-primary flex items-center gap-2">
                  <MessageSquare size={18} className="text-text-tertiary" />
                  Recent Reviews
                </h2>
              </div>
              <div className="divide-y divide-surface-tertiary">
                {recentReviews.map(review => (
                  <Link
                    key={review.id}
                    href={`/courses/${review.course.id}`}
                    className="block px-5 py-3 hover:bg-hover-bg transition-colors"
                  >
                    <div className="text-sm font-medium text-text-primary truncate">
                      {toOfficialCode(review.course.code)}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Academic Calendar Mini - Now with pagination */}
            <AcademicCalendar />

            {/* How to Contribute */}
            <div className="bg-gradient-to-br from-wf-crimson to-wf-crimson-dark rounded-xl p-5 text-white">
              <h2 className="font-semibold mb-2">Help Fellow Badgers</h2>
              <p className="text-sm text-white/80 mb-4">
                Share your course experiences to help others make informed decisions and unlock full access.
              </p>
              <Link
                href="/courses"
                className="block w-full py-2 text-center text-sm font-medium bg-white text-wf-crimson rounded-lg hover:bg-white/90 transition-colors"
              >
                Write a Review
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-surface-tertiary bg-surface-primary mt-8">
        <div className="max-w-6xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <Logo size={20} />
              <span className="font-medium">WiscFlow</span>
              <span className="text-text-tertiary">• By students, for students</span>
            </div>
            <div className="text-text-tertiary">
              Made with ❤️ at UW-Madison
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
