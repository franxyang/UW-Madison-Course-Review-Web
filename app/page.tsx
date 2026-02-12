import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { prisma } from '@/lib/prisma'
import { BookOpen, Users, Building2, ArrowRight, MessageSquare, GraduationCap, Search, PenLine, Unlock, CheckCircle2, TrendingUp, TrendingDown } from 'lucide-react'
import { AcademicCalendar } from '@/components/AcademicCalendar'
import { toOfficialCode } from '@/lib/courseCodeDisplay'
import { HomeSearch } from '@/components/HomeSearch'
import { ContributorProgress } from '@/components/ContributorProgress'
import { Header } from '@/components/Header'
import { gpaToLetterGrade } from '@/lib/gpaLetter'

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

async function getRatingRankedCourses() {
  const scoredCourses = await prisma.$queryRawUnsafe<any[]>(`
    SELECT
      c."id",
      c."code",
      c."name",
      c."avgGPA",
      COUNT(r."id")::int AS review_count,
      AVG(
        (
          CASE r."contentRating"
            WHEN 'A' THEN 4.0
            WHEN 'AB' THEN 3.5
            WHEN 'B' THEN 3.0
            WHEN 'BC' THEN 2.5
            WHEN 'C' THEN 2.0
            WHEN 'D' THEN 1.0
            ELSE 0.0
          END
          +
          CASE r."teachingRating"
            WHEN 'A' THEN 4.0
            WHEN 'AB' THEN 3.5
            WHEN 'B' THEN 3.0
            WHEN 'BC' THEN 2.5
            WHEN 'C' THEN 2.0
            WHEN 'D' THEN 1.0
            ELSE 0.0
          END
          +
          CASE r."gradingRating"
            WHEN 'A' THEN 4.0
            WHEN 'AB' THEN 3.5
            WHEN 'B' THEN 3.0
            WHEN 'BC' THEN 2.5
            WHEN 'C' THEN 2.0
            WHEN 'D' THEN 1.0
            ELSE 0.0
          END
          +
          CASE r."workloadRating"
            WHEN 'A' THEN 4.0
            WHEN 'AB' THEN 3.5
            WHEN 'B' THEN 3.0
            WHEN 'BC' THEN 2.5
            WHEN 'C' THEN 2.0
            WHEN 'D' THEN 1.0
            ELSE 0.0
          END
        ) / 4.0
      ) AS rating_score
    FROM "Course" c
    JOIN "Review" r ON r."courseId" = c."id"
    GROUP BY c."id", c."code", c."name", c."avgGPA"
  `)

  const normalized = scoredCourses.map((course) => ({
    id: course.id,
    code: course.code,
    name: course.name,
    avgGPA: course.avgGPA,
    reviewCount: Number(course.review_count),
    ratingScore: Number(course.rating_score),
  }))

  const highestRated = [...normalized]
    .sort(
      (a, b) =>
        b.ratingScore - a.ratingScore ||
        b.reviewCount - a.reviewCount ||
        a.code.localeCompare(b.code),
    )
    .slice(0, 6)

  const highestIds = new Set(highestRated.map((course) => course.id))

  const lowestRated = normalized
    .filter((course) => course.ratingScore < 2.0 && !highestIds.has(course.id))
    .sort(
      (a, b) =>
        a.ratingScore - b.ratingScore ||
        b.reviewCount - a.reviewCount ||
        a.code.localeCompare(b.code),
    )
    .slice(0, 5)

  return { highestRated, lowestRated }
}

export default async function Home() {
  const stats = await getStats()
  const { highestRated, lowestRated } = await getRatingRankedCourses()

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
                A nickname-based course review community built by UW-Madison students, for UW-Madison students. 
                Search courses, check grade distributions, and read reviews from fellow Badgers before you register.
              </p>
              <p className="text-text-secondary">
                Choosing classes shouldn&apos;t feel like a gamble. MadSpace runs on one simple idea: <strong className="text-text-primary">every Badger shares a little, 
                and everyone benefits a lot.</strong> Your one honest review could save a fellow student from a rough semester — and theirs 
                could save yours. No ads, no agenda — just real students helping each other navigate college, helping our community better 🙌
              </p>
            </div>
            <div className="lg:w-80">
              <HomeSearch />
            </div>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-surface-primary rounded-xl border border-surface-tertiary px-6 py-4 mb-6">
          <h2 className="font-semibold text-text-primary mb-3 text-center text-sm">How It Works</h2>
          <div className="grid grid-cols-4 gap-3 relative">
            {/* Connecting line */}
            <div className="hidden sm:block absolute top-5 left-[calc(12.5%+16px)] right-[calc(12.5%+16px)] h-[2px] bg-surface-tertiary" />
            
            {/* Step 1 */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-wf-crimson/10 text-wf-crimson shrink-0">
                <Search size={18} />
              </div>
              <div className="font-medium text-text-primary text-xs">Find a Course</div>
              <p className="text-[11px] text-text-tertiary leading-tight hidden sm:block">Search by name, code, or department</p>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 shrink-0">
                <PenLine size={18} />
              </div>
              <div className="font-medium text-text-primary text-xs">Write a Review</div>
              <p className="text-[11px] text-text-tertiary leading-tight hidden sm:block">Rate, pick instructor & term, share your experience</p>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/10 text-amber-600 shrink-0">
                <Unlock size={18} />
              </div>
              <div className="font-medium text-text-primary text-xs">Unlock Access</div>
              <p className="text-[11px] text-text-tertiary leading-tight hidden sm:block">One review unlocks all reviews platform-wide</p>
            </div>

            {/* Step 4 */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-blue-500/10 text-blue-600 shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div className="font-medium text-text-primary text-xs">Choose Wisely</div>
              <p className="text-[11px] text-text-tertiary leading-tight hidden sm:block">Compare grades & instructors with confidence</p>
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

            {/* Highest Rated Courses */}
            <div className="bg-surface-primary rounded-xl border border-surface-tertiary overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-surface-tertiary">
                <h2 className="font-semibold text-text-primary flex items-center gap-2">
                  <TrendingUp size={18} className="text-wf-crimson" />
                  Highest Rated Courses
                </h2>
                <Link href="/courses" className="text-sm text-wf-crimson hover:text-wf-crimson-dark flex items-center gap-1">
                  View all <ArrowRight size={14} />
                </Link>
              </div>
              <div className="divide-y divide-surface-tertiary">
                {highestRated.map(course => (
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
                          {course.reviewCount} reviews
                        </span>
                      </div>
                      <div className="text-sm text-text-secondary truncate">
                        {course.name}
                      </div>
                    </div>
                    {course.ratingScore > 0 && (
                      <div className={`text-lg font-bold ml-4 ${
                        course.ratingScore >= 3.5 ? 'text-emerald-500' :
                        course.ratingScore >= 3.0 ? 'text-emerald-400' :
                        course.ratingScore >= 2.5 ? 'text-amber-500' : 'text-orange-500'
                      }`}>
                        {course.ratingScore.toFixed(2)} ({gpaToLetterGrade(course.ratingScore)})
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
                  { name: 'Computer Sciences', code: 'COMP SCI' },
                  { name: 'Mathematics', code: 'MATH' },
                  { name: 'Economics', code: 'ECON' },
                  { name: 'Psychology', code: 'PSYCH' },
                  { name: 'Biology', code: 'BIOLOGY' },
                  { name: 'Chemistry', code: 'CHEM' },
                  { name: 'Physics', code: 'PHYSICS' },
                  { name: 'Statistics', code: 'STAT' }
                ].map(dept => (
                  <Link
                    key={dept.code}
                    href={`/courses?dept=${encodeURIComponent(dept.code)}`}
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
            {/* Academic Calendar Mini */}
            <AcademicCalendar />

            {/* Contributor Progress */}
            <ContributorProgress />

            {/* Lowest Rated */}
            <div className="bg-surface-primary rounded-xl border border-surface-tertiary overflow-hidden">
              <div className="px-5 py-4 border-b border-surface-tertiary">
                <h2 className="font-semibold text-text-primary flex items-center gap-2">
                  <TrendingDown size={18} className="text-red-500" />
                  Lowest Rated Courses
                </h2>
              </div>
              <div className="divide-y divide-surface-tertiary">
                {lowestRated.map(course => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    className="block px-5 py-3 hover:bg-hover-bg transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-text-primary truncate">
                          {toOfficialCode(course.code)}
                        </div>
                        <div className="text-xs text-text-tertiary">{course.reviewCount} reviews</div>
                      </div>
                      <div className={`text-sm font-semibold ${
                        course.ratingScore >= 3.5 ? 'text-emerald-500' :
                        course.ratingScore >= 3.0 ? 'text-emerald-400' :
                        course.ratingScore >= 2.5 ? 'text-amber-500' :
                        course.ratingScore >= 2.0 ? 'text-orange-500' : 'text-red-500'
                      }`}>
                        {course.ratingScore.toFixed(2)} ({gpaToLetterGrade(course.ratingScore)})
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

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
