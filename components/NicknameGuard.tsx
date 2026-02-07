'use client'

import { useSession } from 'next-auth/react'
import { useState, useCallback } from 'react'
import { trpc } from '@/lib/trpc/client'
import { NicknameSetupModal } from './NicknameSetupModal'

/**
 * Shows a nickname setup modal if the logged-in user hasn't set one yet.
 * Place this in the root layout (inside Providers) so it applies globally.
 */
export function NicknameGuard() {
  const { data: session, status } = useSession()
  const [dismissed, setDismissed] = useState(false)

  // Only query if user is logged in
  const { data: me, refetch } = trpc.user.me.useQuery(undefined, {
    enabled: status === 'authenticated',
    staleTime: Infinity, // Only fetch once per session
  })

  const handleComplete = useCallback(() => {
    setDismissed(true)
    refetch()
  }, [refetch])

  // Show modal if: logged in + loaded + no nickname + not dismissed
  const shouldShow = status === 'authenticated' && me && !me.hasNickname && !dismissed

  return <NicknameSetupModal show={!!shouldShow} onComplete={handleComplete} />
}
