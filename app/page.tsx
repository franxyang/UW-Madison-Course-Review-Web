import { auth } from '@/auth'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { prisma } from '@/lib/prisma'
import { BookOpen, Users, Star, Building2, ArrowRight, MessageSquare, GraduationCap, Search, PenLine, Unlock, CheckCircle2 } from 'lucide-react'
import { AcademicCalendar } from '@/components/AcademicCalendar'
import { toOfficialCode } from '@/lib/courseCodeDisplay'
import { HomeSearch } from '@/components/HomeSearch'
import { ContributorProgress } from '@/components/ContributorProgress'
import { Header } from '@/components/Header'

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
      <Header currentPath="/" />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-6 mb-6">
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-text-primary mb-2">
                Welcome to MadSpace 👋
              </h1>
              <p className="text-text-secondary mb-2">
                A course review community built by UW-Madison students, for UW-Madison students. 
                Search courses, check real grade distributions, and read honest reviews from fellow Badgers before you register.
              </p>
              <p className="text-text-tertiary text-sm">
                Choosing classes shouldn&apos;t feel like a gamble. MadSpace runs on one simple idea: every Badger shares a little, 
                and everyone benefits a lot. Your one honest review could save a fellow student from a rough semester — and theirs 
                could save yours. No ads, no agenda — just real students helping each other navigate college, one review at a time.
              </p>
            </div>
            <div className="lg:w-80">
              <HomeSearch />
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-6 mb-6">
          <h2 className="font-semibold text-text-primary mb-5 text-center">How It Works</h2>
          <div className="grid sm:grid-cols-4 gap-4 relative">
            {/* Connecting line - hidden on mobile */}
            <div className="hidden sm:block absolute top-8 left-[calc(12.5%+20px)] right-[calc(12.5%+20px)] h-[2px] bg-surface-tertiary" />
            
            {/* Step 1 */}
            <div className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 text-center">
              <div className="relative z-10 flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-wf-crimson/10 text-wf-crimson shrink-0">
                <Search size={20} />
              </div>
              <div className="sm:mt-1">
                <div className="font-medium text-text-primary text-sm">Find a Course</div>
                <p className="text-xs text-text-tertiary mt-0.5">Search by name, code, or browse by department</p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 text-center">
              <div className="relative z-10 flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0">
                <PenLine size={20} />
              </div>
              <div className="sm:mt-1">
                <div className="font-medium text-text-primary text-sm">Write a Review</div>
                <p className="text-xs text-text-tertiary mt-0.5">Rate the course, pick an instructor & term, and share your honest experience</p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 text-center">
              <div className="relative z-10 flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-amber-500/10 text-amber-600 shrink-0">
                <Unlock size={20} />
              </div>
              <div className="sm:mt-1">
                <div className="font-medium text-text-primary text-sm">Unlock Full Access</div>
                <p className="text-xs text-text-tertiary mt-0.5">One review unlocks all reviews across the entire platform</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 text-center">
              <div className="relative z-10 flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-full bg-blue-500/10 text-blue-600 shrink-0">
                <CheckCircle2 size={20} />
              </div>
              <div className="sm:mt-1">
                <div className="font-medium text-text-primary text-sm">Choose Wisely</div>
                <p className="text-xs text-text-tertiary mt-0.5">Read reviews, compare grades & instructors — register with confidence</p>
              </div>
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
          <div className="flex flex-col items-center gap-3 text-sm">
            <div className="flex items-center gap-2 text-text-secondary">
              <Logo size={20} />
              <span className="text-text-tertiary">• By students, for students</span>
            </div>
            <p className="text-xs text-text-tertiary text-center max-w-xl">
              MadSpace is an independent student project and is not affiliated with, endorsed by, or officially connected to the University of Wisconsin-Madison.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
