import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  
  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'You must use a @wisc.edu email address.',
    Verification: 'The verification link has expired or was already used.',
    Default: 'An error occurred during authentication.',
  }

  const error = params.error || 'Default'
  const message = errorMessages[error] || errorMessages.Default

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={48} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Authentication Error</h1>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-red-800">
              <strong>Error: {error}</strong>
              <p className="mt-1">{message}</p>
            </div>
          </div>

          {error === 'AccessDenied' && (
            <p className="text-slate-700 dark:text-slate-300 mb-6">
              MadSpace is only available to UW-Madison students. Please sign in with your @wisc.edu email address.
            </p>
          )}

          {error === 'Configuration' && (
            <p className="text-slate-700 dark:text-slate-300 mb-6">
              The database is not properly configured. Please check the server logs and ensure all environment variables are set correctly.
            </p>
          )}

          <Link
            href="/auth/signin"
            className="w-full bg-uw-red text-white py-3 rounded-lg font-medium hover:bg-uw-dark transition-colors flex items-center justify-center"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  )
}
