'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { signIn } from 'next-auth/react'
import { AlertCircle, CheckCircle2, KeyRound, Mail, UserCircle } from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'

export function AuthSignupPanel() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loginHandle, setLoginHandle] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  const requestOtp = trpc.auth.requestWiscSignupOtp.useMutation({
    onSuccess: (data) => {
      setOtpSent(true)
      toast.success('Verification code sent to your @wisc.edu email.')
      if (data.devCode) {
        toast.info(`Dev OTP: ${data.devCode}`)
      }
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const completeSignup = trpc.auth.completeWiscSignup.useMutation({
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const canRequestOtp = useMemo(() => {
    const normalized = email.trim().toLowerCase()
    return normalized.endsWith('@wisc.edu')
  }, [email])

  const canComplete = useMemo(() => {
    return (
      otpSent &&
      email.trim().toLowerCase().endsWith('@wisc.edu') &&
      code.trim().length === 6 &&
      password.length >= 8 &&
      confirmPassword.length >= 8
    )
  }, [otpSent, email, code, password, confirmPassword])

  const onGoogleSignup = async () => {
    await signIn('google', { callbackUrl: '/courses' })
  }

  const onCompleteSignup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!canComplete) return

    if (password !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }

    const result = await completeSignup.mutateAsync({
      email,
      code,
      password,
      loginHandle: loginHandle.trim() || undefined,
    })

    const loginIdentifier = result.loginHandle || email
    const signInResult = await signIn('credentials', {
      identifier: loginIdentifier,
      password,
      redirect: false,
    })

    if (!signInResult || signInResult.error) {
      toast.success('Account created. Please sign in with your new credentials.')
      router.push('/auth/signin')
      return
    }

    toast.success(`Welcome! Your login handle is ${result.loginHandle}.`)
    router.push('/courses')
    router.refresh()
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 space-y-6">
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
        <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-blue-800">
          <strong>Step 1 verification uses @wisc.edu.</strong> After signup, you can log in with your handle + password, and later bind a recovery email for post-graduation access.
        </div>
      </div>

      <button
        type="button"
        onClick={onGoogleSignup}
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
          <span className="bg-white px-2 text-slate-500">or sign up with code</span>
        </div>
      </div>

      <form onSubmit={onCompleteSignup} className="space-y-3">
        <label className="block">
          <span className="text-sm font-medium text-slate-700 mb-1.5 block">@wisc.edu email</span>
          <div className="relative">
            <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="abc123@wisc.edu"
              className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5"
              required
            />
          </div>
        </label>

        <button
          type="button"
          onClick={() => requestOtp.mutate({ email })}
          disabled={requestOtp.isPending || !canRequestOtp}
          className="w-full py-2.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-60"
        >
          {requestOtp.isPending ? 'Sending code...' : otpSent ? 'Resend code' : 'Send verification code'}
        </button>

        {otpSent && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800 flex items-start gap-2">
            <CheckCircle2 size={16} className="mt-0.5" />
            <span>Code sent. Check your inbox and complete the fields below.</span>
          </div>
        )}

        <label className="block">
          <span className="text-sm font-medium text-slate-700 mb-1.5 block">Verification code</span>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="6-digit code"
            maxLength={6}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5"
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 mb-1.5 block">Login handle</span>
          <div className="relative">
            <UserCircle size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={loginHandle}
              onChange={(e) => setLoginHandle(e.target.value)}
              placeholder="abc123 (optional, auto-generated if empty)"
              className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5"
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">Use letters, numbers, dot, underscore, or hyphen.</p>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 mb-1.5 block">Password</span>
          <div className="relative">
            <KeyRound size={16} className="absolute left-3 top-3 text-slate-400" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              minLength={8}
              className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5"
              required
            />
          </div>
        </label>

        <label className="block">
          <span className="text-sm font-medium text-slate-700 mb-1.5 block">Confirm password</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Repeat password"
            minLength={8}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5"
            required
          />
        </label>

        <button
          type="submit"
          disabled={completeSignup.isPending || !canComplete}
          className="w-full py-2.5 rounded-lg font-medium bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {completeSignup.isPending ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{' '}
        <Link href="/auth/signin" className="text-uw-red hover:text-uw-dark font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
