import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { signIn } from '@/auth'
import { AlertCircle, Shield } from 'lucide-react'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo and Title */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-6">
            <Logo size={48} />
            <span className="text-2xl font-bold text-slate-900">WiscFlow</span>
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome Back, Badger!</h1>
          <p className="text-slate-600">Sign in to share your course experiences</p>
        </div>

        {/* Sign In Card */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm p-6">
          {/* @wisc.edu Restriction Notice */}
          <div className="mb-6 p-4 bg-uw-subtle border border-uw-red/20 rounded-lg">
            <div className="flex items-start gap-3">
              <Shield className="text-uw-red mt-0.5" size={20} />
              <div>
                <h3 className="font-medium text-slate-900 mb-1">UW Madison Students Only</h3>
                <p className="text-sm text-slate-600">
                  WiscFlow is exclusively for UW Madison students. You must sign in with your
                  <span className="font-semibold"> @wisc.edu</span> email address to access the platform.
                </p>
              </div>
            </div>
          </div>

          {/* Sign In Button */}
          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: '/courses' })
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google (@wisc.edu)
            </button>
          </form>

          {/* Additional Info */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <AlertCircle size={16} />
              <p>
                Don't have a @wisc.edu email? WiscFlow is only available to current UW Madison students.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-slate-600">
          <p>
            By signing in, you agree to follow the{' '}
            <Link href="/code-of-conduct" className="text-uw-red hover:text-uw-dark">
              Badger Code of Conduct
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}