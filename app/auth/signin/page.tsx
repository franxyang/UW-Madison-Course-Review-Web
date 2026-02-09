import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'
import { signIn } from '@/auth'

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={48} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to MadSpace</h1>
          <p className="text-slate-700 dark:text-slate-300">Sign in with your @wisc.edu Google account</p>
          <Link
            href="/"
            className="inline-block mt-3 text-sm text-slate-600 hover:text-slate-900 underline underline-offset-4"
          >
            Back to homepage
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-800">
              <strong>UW Madison students only.</strong> You must use a @wisc.edu email address to access MadSpace.
            </div>
          </div>

          <form
            action={async () => {
              'use server'
              await signIn('google', { redirectTo: '/courses' })
            }}
          >
            <button
              type="submit"
              className="w-full bg-white text-slate-800 border border-slate-300 py-3 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.3-.99 2.4-2.1 3.13l3.2 2.48c1.86-1.71 2.94-4.22 2.94-7.21 0-.66-.06-1.3-.17-1.9H12z" />
                <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.61-2.44l-3.2-2.48c-.89.59-2.03.95-3.41.95-2.62 0-4.85-1.77-5.65-4.15l-3.31 2.56A9.98 9.98 0 0 0 12 22z" />
                <path fill="#FBBC05" d="M6.35 13.88A5.97 5.97 0 0 1 6 12c0-.65.12-1.28.35-1.88L3.04 7.56A9.98 9.98 0 0 0 2 12c0 1.62.39 3.14 1.04 4.44l3.31-2.56z" />
                <path fill="#4285F4" d="M12 5.97c1.47 0 2.79.5 3.83 1.49l2.87-2.87C16.95 2.96 14.7 2 12 2c-3.9 0-7.25 2.23-8.96 5.56l3.31 2.56c.8-2.38 3.03-4.15 5.65-4.15z" />
              </svg>
              Continue with Google
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-700 dark:text-slate-300">
            New to MadSpace? Just sign in with your UW Madison Google account to get started.
          </p>
        </div>

        <div className="mt-6 text-center text-xs text-slate-600 dark:text-slate-400">
          <p>
            By continuing, you agree to MadSpace's{' '}
            <Link href="/terms" className="underline hover:text-slate-700">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/privacy" className="underline hover:text-slate-700">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
