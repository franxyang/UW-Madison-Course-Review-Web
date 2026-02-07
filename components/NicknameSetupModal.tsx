'use client'

import { useState, useEffect } from 'react'
import { trpc } from '@/lib/trpc/client'
import { UserCircle, Sparkles } from 'lucide-react'

const RANDOM_ADJECTIVES = [
  'Happy', 'Clever', 'Brave', 'Chill', 'Wise', 'Swift', 'Bright', 'Bold',
  'Calm', 'Eager', 'Fair', 'Keen', 'Noble', 'Quick', 'Sharp', 'Witty',
]

const RANDOM_NOUNS = [
  'Badger', 'Bucky', 'Scholar', 'Learner', 'Pioneer', 'Explorer',
  'Reader', 'Thinker', 'Seeker', 'Mentor', 'Ranger', 'Ace',
]

function generateRandomNickname() {
  const adj = RANDOM_ADJECTIVES[Math.floor(Math.random() * RANDOM_ADJECTIVES.length)]
  const noun = RANDOM_NOUNS[Math.floor(Math.random() * RANDOM_NOUNS.length)]
  return `${adj}${noun}${Math.floor(Math.random() * 100)}`
}

interface NicknameSetupModalProps {
  /** If true, the user hasn't set a nickname yet */
  show: boolean
  onComplete: () => void
}

export function NicknameSetupModal({ show, onComplete }: NicknameSetupModalProps) {
  const [nickname, setNickname] = useState('')
  const [suggestion, setSuggestion] = useState('')

  useEffect(() => {
    setSuggestion(generateRandomNickname())
  }, [])

  const updateNickname = trpc.user.updateNickname.useMutation({
    onSuccess: () => {
      onComplete()
    },
  })

  if (!show) return null

  const handleSubmit = () => {
    const value = (nickname.trim() || suggestion).trim()
    if (value) {
      updateNickname.mutate({ nickname: value })
    }
  }

  const handleRandomize = () => {
    setSuggestion(generateRandomNickname())
    setNickname('')
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 animate-in fade-in zoom-in-95">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-uw-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserCircle className="w-8 h-8 text-uw-red" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900">Welcome to WiscFlow!</h2>
          <p className="text-slate-600 mt-2">
            Choose a nickname for your account. This is what other students will see — your real name will stay private.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Your Nickname
            </label>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={suggestion}
              maxLength={30}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-uw-red focus:ring-2 focus:ring-uw-red/20 outline-none text-lg"
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSubmit()
              }}
              autoFocus
            />
            <div className="flex items-center justify-between mt-1.5">
              <span className="text-xs text-slate-500">
                {nickname.length}/30 characters
              </span>
              <button
                type="button"
                onClick={handleRandomize}
                className="text-xs text-uw-red hover:text-uw-dark flex items-center gap-1"
              >
                <Sparkles size={12} />
                Random suggestion
              </button>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>⚠️ Privacy note:</strong> Your nickname appears on all reviews and comments you post. Choose something that doesn&apos;t reveal your identity.
            </p>
          </div>

          {updateNickname.isError && (
            <p className="text-sm text-red-600">Failed to save nickname. Please try again.</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={updateNickname.isPending}
            className="w-full py-3 bg-uw-red text-white font-semibold rounded-lg hover:bg-uw-dark transition-colors disabled:opacity-50"
          >
            {updateNickname.isPending ? 'Saving...' : 'Set Nickname & Continue'}
          </button>

          <p className="text-xs text-center text-slate-500">
            You can change your nickname anytime in your profile settings.
          </p>
        </div>
      </div>
    </div>
  )
}
