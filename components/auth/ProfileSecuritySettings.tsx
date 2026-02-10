'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { AtSign, KeyRound, Mail, ShieldCheck } from 'lucide-react'
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
  const [activePanel, setActivePanel] = useState<'handle' | 'recovery' | 'password' | null>(null)
  const [initialized, setInitialized] = useState(false)

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

  useEffect(() => {
    if (!initialized && security.data) {
      setInitialized(true)
      setActivePanel(security.data.requiresRecoverySetup ? 'recovery' : null)
    }
  }, [initialized, security.data])

  const togglePanel = (panel: 'handle' | 'recovery' | 'password') => {
    setActivePanel((prev) => (prev === panel ? null : panel))
  }

  const passwordUpdatedAt = security.data?.passwordUpdatedAt
    ? new Date(security.data.passwordUpdatedAt).toLocaleDateString()
    : null

  if (security.isLoading) {
    return (
      <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-4">
        <h2 className="text-base font-semibold text-text-primary mb-2">Login & Security</h2>
        <p className="text-sm text-text-secondary">Loading account security settings...</p>
      </div>
    )
  }

  if (security.error || !security.data) {
    return (
      <div className="bg-surface-primary rounded-xl border border-red-200 p-4">
        <h2 className="text-base font-semibold text-text-primary mb-2">Login & Security</h2>
        <p className="text-sm text-red-600">Failed to load security settings.</p>
      </div>
    )
  }

  return (
    <div className="bg-surface-primary rounded-xl border border-surface-tertiary p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-text-primary">Login & Security</h2>
          <p className="text-xs text-text-secondary mt-1">
            Status: <span className="font-medium">{security.data.eligibilityStatus}</span>
          </p>
        </div>
        {security.data.requiresRecoverySetup ? (
          <span className="text-[11px] px-2 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
            Recovery needed
          </span>
        ) : (
          <span className="text-[11px] px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
            <ShieldCheck size={12} />
            Secured
          </span>
        )}
      </div>

      <div className="space-y-2">
        <button
          type="button"
          onClick={() => togglePanel('handle')}
          className={`w-full text-left p-3 rounded-lg border transition-colors ${
            activePanel === 'handle'
              ? 'border-uw-red/40 bg-rose-50/50'
              : 'border-surface-tertiary hover:bg-surface-secondary'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary inline-flex items-center gap-1.5">
                <AtSign size={14} />
                Login handle
              </p>
              <p className="text-xs text-text-secondary truncate">
                {security.data.loginHandle ? `@${security.data.loginHandle}` : 'Not set'}
              </p>
            </div>
            <span className="text-xs text-uw-red font-medium">{activePanel === 'handle' ? 'Close' : 'Edit'}</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => togglePanel('recovery')}
          className={`w-full text-left p-3 rounded-lg border transition-colors ${
            activePanel === 'recovery'
              ? 'border-uw-red/40 bg-rose-50/50'
              : 'border-surface-tertiary hover:bg-surface-secondary'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary inline-flex items-center gap-1.5">
                <Mail size={14} />
                Recovery email
              </p>
              <p className="text-xs text-text-secondary truncate">
                {recoveryEmails.length > 0
                  ? recoveryEmails.map((email) => maskEmail(email.email)).join(', ')
                  : 'Not linked'}
              </p>
            </div>
            <span className="text-xs text-uw-red font-medium">{activePanel === 'recovery' ? 'Close' : 'Edit'}</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => togglePanel('password')}
          className={`w-full text-left p-3 rounded-lg border transition-colors ${
            activePanel === 'password'
              ? 'border-uw-red/40 bg-rose-50/50'
              : 'border-surface-tertiary hover:bg-surface-secondary'
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary inline-flex items-center gap-1.5">
                <KeyRound size={14} />
                Password
              </p>
              <p className="text-xs text-text-secondary truncate">
                {security.data.hasPassword
                  ? passwordUpdatedAt
                    ? `Updated ${passwordUpdatedAt}`
                    : 'Configured'
                  : 'Not set'}
              </p>
            </div>
            <span className="text-xs text-uw-red font-medium">{activePanel === 'password' ? 'Close' : 'Edit'}</span>
          </div>
        </button>
      </div>

      {activePanel === 'handle' && (
        <div className="pt-1 space-y-2">
          <label className="text-xs font-medium text-text-secondary">New login handle</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={loginHandle}
              onChange={(e) => setLoginHandle(e.target.value)}
              placeholder="abc123"
              className="flex-1 border border-surface-tertiary rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => updateHandle.mutate({ loginHandle: loginHandle.trim() })}
              disabled={updateHandle.isPending || !loginHandle.trim()}
              className="px-3 py-2 rounded-lg border border-surface-tertiary text-sm hover:bg-surface-secondary disabled:opacity-60"
            >
              {updateHandle.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      {activePanel === 'recovery' && (
        <div className="pt-1 space-y-2">
          <label className="text-xs font-medium text-text-secondary">Recovery email (non-@wisc.edu)</label>
          <input
            type="email"
            value={recoveryEmail}
            onChange={(e) => setRecoveryEmail(e.target.value)}
            placeholder="you@gmail.com"
            className="w-full border border-surface-tertiary rounded-lg px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => requestRecoveryOtp.mutate({ email: recoveryEmail })}
              disabled={requestRecoveryOtp.isPending || !recoveryEmail.includes('@')}
              className="px-3 py-2 rounded-lg border border-surface-tertiary text-sm hover:bg-surface-secondary disabled:opacity-60"
            >
              {requestRecoveryOtp.isPending ? 'Sending...' : 'Send code'}
            </button>
            <input
              type="text"
              value={recoveryCode}
              onChange={(e) => setRecoveryCode(e.target.value)}
              placeholder="6-digit code"
              className="border border-surface-tertiary rounded-lg px-3 py-2 text-sm w-36"
            />
            <button
              type="button"
              onClick={() => verifyRecoveryOtp.mutate({ email: recoveryEmail, code: recoveryCode })}
              disabled={verifyRecoveryOtp.isPending || !recoveryEmail.includes('@') || recoveryCode.length !== 6}
              className="px-3 py-2 rounded-lg bg-uw-red text-white text-sm hover:bg-uw-dark disabled:opacity-60"
            >
              {verifyRecoveryOtp.isPending ? 'Verifying...' : 'Verify'}
            </button>
          </div>
          {security.data.requiresRecoverySetup && (
            <p className="text-xs text-amber-700">
              Recommended: bind a recovery email now to keep account access after graduation.
            </p>
          )}
        </div>
      )}

      {activePanel === 'password' && (
        <div className="pt-1 space-y-2">
          {security.data.hasPassword && (
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="w-full border border-surface-tertiary rounded-lg px-3 py-2 text-sm"
            />
          )}
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min 8)"
            className="w-full border border-surface-tertiary rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
            className="w-full border border-surface-tertiary rounded-lg px-3 py-2 text-sm"
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
            className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:opacity-60"
          >
            {setPassword.isPending ? 'Saving...' : security.data.hasPassword ? 'Change password' : 'Set password'}
          </button>
        </div>
      )}
    </div>
  )
}
