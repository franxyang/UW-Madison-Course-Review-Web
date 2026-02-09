'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!local || !domain) return 'Hidden'
  if (local.length <= 2) return `${local[0] || '*'}***@${domain}`
  return `${local.slice(0, 2)}***@${domain}`
}

export function ProfileSecuritySettings() {
  const security = trpc.auth.getSecurityProfile.useQuery()
  const utils = trpc.useUtils()

  const [loginHandle, setLoginHandle] = useState('')
  const [recoveryEmail, setRecoveryEmail] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const updateHandle = trpc.auth.updateLoginHandle.useMutation({
    onSuccess: (data) => {
      toast.success(`Login handle updated to ${data.loginHandle}`)
      utils.auth.getSecurityProfile.invalidate()
    },
    onError: (error) => toast.error(error.message),
  })

  const requestRecoveryOtp = trpc.auth.requestRecoveryEmailOtp.useMutation({
    onSuccess: (data) => {
      toast.success('Recovery verification code sent.')
      if (data.devCode) {
        toast.info(`Dev OTP: ${data.devCode}`)
      }
    },
    onError: (error) => toast.error(error.message),
  })

  const verifyRecoveryOtp = trpc.auth.verifyRecoveryEmailOtp.useMutation({
    onSuccess: () => {
      toast.success('Recovery email linked successfully.')
      setRecoveryCode('')
      utils.auth.getSecurityProfile.invalidate()
    },
    onError: (error) => toast.error(error.message),
  })

  const setPassword = trpc.auth.setPassword.useMutation({
    onSuccess: () => {
      toast.success('Password updated.')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      utils.auth.getSecurityProfile.invalidate()
    },
    onError: (error) => toast.error(error.message),
  })

  const recoveryEmails = useMemo(
    () => security.data?.emails?.filter((e) => e.type === 'RECOVERY') ?? [],
    [security.data?.emails]
  )

  useEffect(() => {
    if (security.data?.loginHandle && !loginHandle) {
      setLoginHandle(security.data.loginHandle)
    }
  }, [security.data?.loginHandle, loginHandle])

  if (security.isLoading) {
    return (
      <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-6">
        <h2 className="text-lg font-bold text-text-primary mb-2">Login & Security</h2>
        <p className="text-sm text-text-secondary">Loading account security settings...</p>
      </div>
    )
  }

  if (security.error || !security.data) {
    return (
      <div className="bg-surface-primary rounded-xl border border-red-200 p-6">
        <h2 className="text-lg font-bold text-text-primary mb-2">Login & Security</h2>
        <p className="text-sm text-red-600">Failed to load security settings.</p>
      </div>
    )
  }

  return (
    <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-text-primary">Login & Security</h2>
        <p className="text-sm text-text-secondary mt-1">
          Verification status: <span className="font-medium">{security.data.eligibilityStatus}</span>
        </p>
        {security.data.requiresRecoverySetup && (
          <p className="text-sm text-amber-700 mt-2">
            Add a recovery email now to keep access after graduation.
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">Login handle</label>
        <input
          type="text"
          value={loginHandle}
          onChange={(e) => setLoginHandle(e.target.value)}
          placeholder="Set your login handle"
          className="w-full border border-surface-tertiary rounded-lg px-3 py-2"
        />
        <button
          type="button"
          onClick={() => updateHandle.mutate({ loginHandle: loginHandle.trim() })}
          disabled={updateHandle.isPending || !loginHandle.trim()}
          className="px-4 py-2 rounded-lg border border-surface-tertiary text-sm hover:bg-surface-secondary disabled:opacity-60"
        >
          {updateHandle.isPending ? 'Saving...' : 'Update handle'}
        </button>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">Recovery email (non-@wisc.edu)</label>
        <input
          type="email"
          value={recoveryEmail}
          onChange={(e) => setRecoveryEmail(e.target.value)}
          placeholder="you@gmail.com"
          className="w-full border border-surface-tertiary rounded-lg px-3 py-2"
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => requestRecoveryOtp.mutate({ email: recoveryEmail })}
            disabled={requestRecoveryOtp.isPending || !recoveryEmail.includes('@')}
            className="px-4 py-2 rounded-lg border border-surface-tertiary text-sm hover:bg-surface-secondary disabled:opacity-60"
          >
            {requestRecoveryOtp.isPending ? 'Sending...' : 'Send verification code'}
          </button>
          <input
            type="text"
            value={recoveryCode}
            onChange={(e) => setRecoveryCode(e.target.value)}
            placeholder="6-digit code"
            className="border border-surface-tertiary rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={() => verifyRecoveryOtp.mutate({ email: recoveryEmail, code: recoveryCode })}
            disabled={verifyRecoveryOtp.isPending || !recoveryEmail.includes('@') || recoveryCode.length !== 6}
            className="px-4 py-2 rounded-lg bg-uw-red text-white text-sm hover:bg-uw-dark disabled:opacity-60"
          >
            {verifyRecoveryOtp.isPending ? 'Verifying...' : 'Verify recovery email'}
          </button>
        </div>

        {recoveryEmails.length > 0 && (
          <p className="text-xs text-text-secondary">
            Linked recovery emails: {recoveryEmails.map((email) => maskEmail(email.email)).join(', ')}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-text-primary">Password</label>
        {security.data.hasPassword && (
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password"
            className="w-full border border-surface-tertiary rounded-lg px-3 py-2"
          />
        )}
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          placeholder="New password (min 8)"
          className="w-full border border-surface-tertiary rounded-lg px-3 py-2"
        />
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Confirm new password"
          className="w-full border border-surface-tertiary rounded-lg px-3 py-2"
        />
        <button
          type="button"
          onClick={() => {
            if (newPassword !== confirmPassword) {
              toast.error('Passwords do not match.')
              return
            }
            setPassword.mutate({
              currentPassword: security.data.hasPassword ? currentPassword : undefined,
              newPassword,
            })
          }}
          disabled={
            setPassword.isPending ||
            newPassword.length < 8 ||
            confirmPassword.length < 8 ||
            (security.data.hasPassword && !currentPassword)
          }
          className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:opacity-60"
        >
          {setPassword.isPending ? 'Saving...' : security.data.hasPassword ? 'Change password' : 'Set password'}
        </button>
      </div>
    </div>
  )
}
