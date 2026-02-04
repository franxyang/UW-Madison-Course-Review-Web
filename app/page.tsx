import { auth } from '@/auth'
import Link from 'next/link'
import { Logo } from '@/components/Logo'

export default async function Home() {
  const session = await auth()

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Logo size={32} />
            <span className="font-bold text-xl text-slate-900">WiscFlow</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/courses" className="text-slate-600 hover:text-slate-900">
              Courses
            </Link>
            {session?.user ? (
              <Link href="/profile" className="px-4 py-2 bg-uw-red text-white rounded-lg hover:bg-uw-dark transition-colors">
                Profile
              </Link>
            ) : (
              <Link href="/auth/signin" className="px-4 py-2 bg-uw-red text-white rounded-lg hover:bg-uw-dark transition-colors">
                Sign In
              </Link>
            )}
          </nav>
        </div>
      </header>

      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-3xl px-4">
          <h1 className="text-5xl font-bold text-uw-red mb-6">
            WiscFlow
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            UW Madison Course Reviews & Academic Planning
          </p>
          <p className="text-slate-500 mb-12">
            Make informed decisions about your courses. Browse reviews from fellow Badgers and plan your academic journey.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/courses"
              className="inline-block bg-uw-red text-white px-8 py-4 rounded-lg hover:bg-uw-dark transition-colors font-medium text-lg"
            >
              Browse Courses
            </Link>
            {!session?.user && (
              <Link
                href="/auth/signup"
                className="inline-block border-2 border-uw-red text-uw-red px-8 py-4 rounded-lg hover:bg-uw-red hover:text-white transition-colors font-medium text-lg"
              >
                Join WiscFlow
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}