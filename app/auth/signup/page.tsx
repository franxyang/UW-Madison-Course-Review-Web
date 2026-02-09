import Link from 'next/link'
import { Logo } from '@/components/Logo'
import { AuthSignupPanel } from '@/components/auth/AuthSignupPanel'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4 py-10">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={48} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Join MadSpace</h1>
          <p className="text-slate-700">Verify with @wisc.edu, then keep using handle + password</p>
          <Link
            href="/"
            className="inline-block mt-3 text-sm text-slate-600 hover:text-slate-900 underline underline-offset-4"
          >
            Back to homepage
          </Link>
        </div>

        <AuthSignupPanel />
      </div>
    </div>
  )
}
