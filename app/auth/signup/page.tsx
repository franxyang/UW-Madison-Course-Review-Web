import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { Mail, User, AlertCircle } from 'lucide-react'

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo size={48} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Join WiscFlow</h1>
          <p className="text-slate-600">Create your account to start reviewing courses</p>
        </div>

        {/* Sign Up Card */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200">
          {/* Email Requirement Notice */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
            <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
            <div className="text-sm text-blue-800">
              <strong>UW Madison students only.</strong> You must use a @wisc.edu email address.
            </div>
          </div>

          <form action="/api/auth/signup" method="POST" className="space-y-4">
            {/* Name Input */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="text"
                  id="name"
                  name="name"
                  placeholder="Bucky Badger"
                  required
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uw-red/20 focus:border-uw-red"
                />
              </div>
            </div>

            {/* Email Input */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="badger@wisc.edu"
                  required
                  pattern=".*@wisc\.edu$"
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uw-red/20 focus:border-uw-red"
                />
              </div>
              <p className="mt-1.5 text-xs text-slate-500">
                Must end with @wisc.edu
              </p>
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                name="terms"
                required
                className="mt-1 w-4 h-4 text-uw-red border-slate-300 rounded focus:ring-uw-red/20"
              />
              <label htmlFor="terms" className="text-sm text-slate-600">
                I agree to the{' '}
                <Link href="/terms" className="text-uw-red hover:text-uw-dark font-medium">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link href="/privacy" className="text-uw-red hover:text-uw-dark font-medium">
                  Privacy Policy
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-uw-red text-white py-3 rounded-lg font-medium hover:bg-uw-dark transition-colors"
            >
              Create Account
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-slate-500">or</span>
            </div>
          </div>

          {/* Google Sign Up */}
          <Link
            href="/api/auth/signin/google"
            className="w-full border border-slate-300 text-slate-700 py-3 rounded-lg font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </Link>

          {/* Help Text */}
          <p className="mt-6 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/auth/signin" className="text-uw-red hover:text-uw-dark font-medium">
              Sign in
            </Link>
          </p>
        </div>

        {/* Community Guidelines */}
        <div className="mt-6 p-4 bg-white/50 rounded-lg border border-slate-200">
          <p className="text-xs text-slate-600 text-center">
            <strong>Community Guidelines:</strong> Be respectful, honest, and constructive in your reviews. False or misleading information will result in account suspension.
          </p>
        </div>
      </div>
    </div>
  )
}
