import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { AuthSignInPanel } from '@/components/auth/AuthSignInPanel'

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>
}) {
  const params = await searchParams
  const callbackUrl = params.callbackUrl || '/courses'

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={48} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Welcome to MadSpace</h1>
          <p className="text-slate-700">Sign in with Google or with your handle + password</p>
          <Link
            href="/"
            className="inline-block mt-3 text-sm text-slate-600 hover:text-slate-900 underline underline-offset-4"
          >
            Back to homepage
          </Link>
        </div>

        <AuthSignInPanel callbackUrl={callbackUrl} />

        <div className="mt-6 text-center text-xs text-slate-600">
          <p>
            By continuing, you agree to MadSpace&apos;s{' '}
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
