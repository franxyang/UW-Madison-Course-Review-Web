'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { signIn } from 'next-auth/react'
import { AlertCircle, KeyRound, Mail, UserCircle } from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'

interface AuthSignInPanelProps {
  callbackUrl?: string
}

export function AuthSignInPanel({ callbackUrl = '/courses' }: AuthSignInPanelProps) {
  const router = useRouter()

  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [isSigningIn, setIsSigningIn] = useState(false)

  const [showReset, setShowReset] = useState(false)
  const [resetIdentifier, setResetIdentifier] = useState('')
  const [resetEmail, setResetEmail] = useState('')
  const [resetCode, setResetCode] = useState('')
  const [resetPassword, setResetPassword] = useState('')

  const requestReset = trpc.auth.requestPasswordResetOtp.useMutation({
    onSuccess: (data) => {
      toast.success('Verification code sent if your account exists.')
      if (data.devCode) {
        toast.info(`Dev OTP: ${data.devCode}`)
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const completeReset = trpc.auth.resetPasswordWithOtp.useMutation({
    onSuccess: () => {
      toast.success('Password reset successful. You can sign in now.')
      setResetCode('')
      setResetPassword('')
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const canSubmit = useMemo(() => identifier.trim().length >= 3 && password.length >= 8, [identifier, password])

  const onCredentialsSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canSubmit) return

    setIsSigningIn(true)
    try {
      const result = await signIn('credentials', {
        identifier: identifier.trim(),
        password,
        redirect: false,
      })

      if (!result || result.error) {
        toast.error('Sign in failed. Check your handle/email and password.')
        return
      }

      router.push(callbackUrl)
      router.refresh()
    } finally {
      setIsSigningIn(false)
    }
  }

  const onGoogleSignIn = async () => {
    await signIn('google', { callbackUrl })
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
        <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-blue-800">
          <strong>UW-Madison verification required.</strong> First-time accounts must verify with a <code>@wisc.edu</code> email. After that, you can use your handle + password.
        </div>
      </div>

      <button
        type="button"
        onClick={onGoogleSignIn}
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

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-2 text-slate-500">or</span>
        </div>
      </div>

      <form onSubmit={onCredentialsSignIn} className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-700 mb-1.5 block">Handle or login email</span>
          <div className="relative">
            <UserCircle size={16} className="absolute left-3 top-3.5 text-slate-400" />
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="abc123 or abc123@wisc.edu"
              className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-uw-red/30 focus:border-uw-red"
              autoComplete="username"
              required
            />
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 mb-1.5 block">Password</span>
          <div className="relative">
            <KeyRound size={16} className="absolute left-3 top-3.5 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-uw-red/30 focus:border-uw-red"
              autoComplete="current-password"
              minLength={8}
              required
            />
          </div>
        </label>

        <button
          type="submit"
          disabled={isSigningIn || !canSubmit}
          className="w-full py-2.5 rounded-lg font-medium bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isSigningIn ? 'Signing in...' : 'Sign in with password'}
        </button>
      </form>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => setShowReset((prev) => !prev)}
          className="text-slate-600 hover:text-slate-800"
        >
          {showReset ? 'Hide password reset' : 'Forgot password?'}
        </button>
        <Link href="/auth/signup" className="text-uw-red hover:text-uw-dark font-medium">
          Create account
        </Link>
      </div>

      {showReset && (
        <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
          <p className="text-sm font-medium text-slate-800">Reset password</p>

          <label className="block">
            <span className="text-xs text-slate-600">Step 1: Request OTP with your handle or email</span>
            <input
              type="text"
              value={resetIdentifier}
              onChange={(e) => setResetIdentifier(e.target.value)}
              placeholder="abc123 or abc123@wisc.edu"
              className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2"
            />
          </label>

          <button
            type="button"
            onClick={() => requestReset.mutate({ identifier: resetIdentifier })}
            disabled={requestReset.isPending || resetIdentifier.trim().length < 3}
            className="w-full py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-white disabled:opacity-60"
          >
            {requestReset.isPending ? 'Sending code...' : 'Send reset code'}
          </button>

          <label className="block">
            <span className="text-xs text-slate-600">Step 2: Enter the email that received the code</span>
            <div className="relative mt-1">
              <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                placeholder="recovery@gmail.com or you@wisc.edu"
                className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2"
              />
            </div>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              type="text"
              value={resetCode}
              onChange={(e) => setResetCode(e.target.value)}
              placeholder="6-digit code"
              className="border border-slate-300 rounded-lg px-3 py-2"
            />
            <input
              type="password"
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              placeholder="New password"
              className="border border-slate-300 rounded-lg px-3 py-2"
            />
          </div>

          <button
            type="button"
            onClick={() =>
              completeReset.mutate({
                email: resetEmail,
                code: resetCode,
                password: resetPassword,
              })
            }
            disabled={
              completeReset.isPending ||
              !resetEmail.includes('@') ||
              resetCode.trim().length !== 6 ||
              resetPassword.length < 8
            }
            className="w-full py-2 rounded-lg bg-uw-red text-white hover:bg-uw-dark disabled:opacity-60"
          >
            {completeReset.isPending ? 'Resetting...' : 'Reset password'}
          </button>
        </div>
      )}
    </div>
  )
}
