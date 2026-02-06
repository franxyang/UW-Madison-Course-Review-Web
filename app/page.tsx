import { auth } from '@/auth'
import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { prisma } from '@/lib/prisma'
import { Search, BookOpen, Users, Star, TrendingUp, ArrowRight, Sparkles } from 'lucide-react'

async function getStats() {
  const [courseCount, reviewCount, instructorCount] = await Promise.all([
    prisma.course.count(),
    prisma.review.count(),
    prisma.instructor.count(),
  ])
  return { courseCount, reviewCount, instructorCount }
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

export default async function Home() {
  const session = await auth()
  const stats = await getStats()
  const featuredCourses = await getFeaturedCourses()

  return (
    <div className="min-h-screen bg-surface-primary">
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
              {session?.user ? (
                <Link href="/profile" className="px-4 py-2 bg-wf-crimson text-white rounded-lg hover:bg-wf-crimson-dark transition-colors font-medium">
                  Profile
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/auth/signin" className="text-text-secondary hover:text-text-primary transition-colors">
                    Sign In
                  </Link>
                  <Link href="/auth/signup" className="px-4 py-2 bg-wf-crimson text-white rounded-lg hover:bg-wf-crimson-dark transition-colors font-medium">
                    Sign Up
                  </Link>
                </div>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-wf-crimson/5 via-transparent to-amber-50/50" />
        
        <div className="relative max-w-6xl mx-auto px-6 py-20">
          <div className="text-center max-w-3xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-wf-crimson/10 text-wf-crimson rounded-full text-sm font-medium mb-6">
              <Sparkles size={16} />
              <span>Trusted by UW-Madison Students</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl font-bold text-text-primary mb-6 leading-tight">
              Make Smarter
              <span className="text-wf-crimson"> Course Decisions</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-text-secondary mb-10 leading-relaxed">
              Real reviews from fellow Badgers. Grade distributions, instructor ratings, and everything you need to plan your academic journey.
            </p>

            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <form action="/courses" method="get" className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary" size={20} />
                <input
                  type="text"
                  name="search"
                  placeholder="Search courses (e.g., CS 577, Calculus, Economics...)"
                  className="w-full pl-12 pr-32 py-4 text-lg bg-surface-primary border-2 border-surface-tertiary rounded-xl
                           focus:outline-none focus:border-wf-crimson focus:ring-4 focus:ring-wf-crimson/10
                           shadow-sm hover:shadow-md transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2.5 bg-wf-crimson text-white font-medium rounded-lg
                           hover:bg-wf-crimson-dark transition-colors"
                >
                  Search
                </button>
              </form>
            </div>

            {/* Quick Links */}
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className="text-text-tertiary">Popular:</span>
              <Link href="/courses?search=COMP SCI" className="px-3 py-1.5 bg-surface-secondary hover:bg-hover-bg rounded-full text-text-secondary transition-colors">
                Computer Science
              </Link>
              <Link href="/courses?search=MATH" className="px-3 py-1.5 bg-surface-secondary hover:bg-hover-bg rounded-full text-text-secondary transition-colors">
                Mathematics
              </Link>
              <Link href="/courses?search=ECON" className="px-3 py-1.5 bg-surface-secondary hover:bg-hover-bg rounded-full text-text-secondary transition-colors">
                Economics
              </Link>
              <Link href="/courses?search=PSYCH" className="px-3 py-1.5 bg-surface-secondary hover:bg-hover-bg rounded-full text-text-secondary transition-colors">
                Psychology
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-surface-tertiary bg-surface-secondary/50">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-wf-crimson/10 rounded-xl">
                <BookOpen className="text-wf-crimson" size={24} />
              </div>
              <div className="text-3xl font-bold text-text-primary">{stats.courseCount.toLocaleString()}</div>
              <div className="text-sm text-text-secondary">Courses</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-emerald-100 rounded-xl">
                <Star className="text-emerald-600" size={24} />
              </div>
              <div className="text-3xl font-bold text-text-primary">{stats.reviewCount.toLocaleString()}</div>
              <div className="text-sm text-text-secondary">Reviews</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-amber-100 rounded-xl">
                <Users className="text-amber-600" size={24} />
              </div>
              <div className="text-3xl font-bold text-text-primary">{stats.instructorCount.toLocaleString()}</div>
              <div className="text-sm text-text-secondary">Instructors</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center w-12 h-12 mx-auto mb-3 bg-blue-100 rounded-xl">
                <TrendingUp className="text-blue-600" size={24} />
              </div>
              <div className="text-3xl font-bold text-text-primary">23</div>
              <div className="text-sm text-text-secondary">Schools</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {featuredCourses.length > 0 && (
        <section className="max-w-6xl mx-auto px-6 py-16">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-text-primary">Most Reviewed Courses</h2>
              <p className="text-text-secondary mt-1">See what fellow students are saying</p>
            </div>
            <Link 
              href="/courses" 
              className="flex items-center gap-2 text-wf-crimson hover:text-wf-crimson-dark font-medium transition-colors"
            >
              View all courses
              <ArrowRight size={18} />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredCourses.map(course => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="group p-5 bg-surface-primary border border-surface-tertiary rounded-xl hover:shadow-md hover:border-wf-crimson/30 transition-all"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-text-primary group-hover:text-wf-crimson transition-colors">
                      {course.code}
                    </h3>
                    <p className="text-sm text-text-secondary line-clamp-1">{course.name}</p>
                  </div>
                  {course.avgGPA != null && course.avgGPA > 0 && (
                    <div className={`text-lg font-bold ${
                      course.avgGPA >= 3.5 ? 'text-emerald-500' :
                      course.avgGPA >= 3.0 ? 'text-emerald-400' :
                      course.avgGPA >= 2.5 ? 'text-amber-500' : 'text-orange-500'
                    }`}>
                      {course.avgGPA.toFixed(2)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <Star size={12} className="text-amber-400" />
                    {course._count.reviews} reviews
                  </span>
                  <span>{course.credits} credits</span>
                  <span className={`px-2 py-0.5 rounded ${
                    course.level === 'Elementary' ? 'bg-emerald-50 text-emerald-700' :
                    course.level === 'Intermediate' ? 'bg-amber-50 text-amber-700' :
                    'bg-orange-50 text-orange-700'
                  }`}>
                    {course.level}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* How It Works */}
      <section className="bg-surface-secondary/50 border-y border-surface-tertiary">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-text-primary mb-2">How WiscFlow Works</h2>
            <p className="text-text-secondary">Three simple steps to better course decisions</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-wf-crimson text-white rounded-2xl flex items-center justify-center text-xl font-bold">
                1
              </div>
              <h3 className="font-semibold text-text-primary mb-2">Search Courses</h3>
              <p className="text-sm text-text-secondary">
                Browse 10,000+ courses across all UW-Madison schools and departments
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-wf-crimson text-white rounded-2xl flex items-center justify-center text-xl font-bold">
                2
              </div>
              <h3 className="font-semibold text-text-primary mb-2">Read Reviews</h3>
              <p className="text-sm text-text-secondary">
                Get insights from real students on content, teaching, grading, and workload
              </p>
            </div>
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-4 bg-wf-crimson text-white rounded-2xl flex items-center justify-center text-xl font-bold">
                3
              </div>
              <h3 className="font-semibold text-text-primary mb-2">Share Your Experience</h3>
              <p className="text-sm text-text-secondary">
                Write one review to unlock full access and help future Badgers
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="bg-gradient-to-r from-wf-crimson to-wf-crimson-dark rounded-2xl p-10 text-center text-white">
          <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-white/80 mb-8 max-w-xl mx-auto">
            Join thousands of UW-Madison students making informed course decisions with WiscFlow.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/courses"
              className="px-8 py-3 bg-white text-wf-crimson font-semibold rounded-lg hover:bg-white/90 transition-colors"
            >
              Browse Courses
            </Link>
            {!session?.user && (
              <Link
                href="/auth/signup"
                className="px-8 py-3 bg-white/10 text-white font-semibold rounded-lg border-2 border-white/30 hover:bg-white/20 transition-colors"
              >
                Create Account
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-surface-tertiary bg-surface-secondary/30">
        <div className="max-w-6xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Logo size={24} />
              <span className="font-semibold text-text-primary">WiscFlow</span>
            </div>
            <div className="text-sm text-text-tertiary">
              Made with ❤️ for UW-Madison students
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
