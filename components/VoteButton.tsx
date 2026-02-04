'use client'

import { useState, useTransition } from 'react'
import { ThumbsUp } from 'lucide-react'
import { toggleVote } from '@/app/actions/votes'
import { toast } from 'sonner'

interface VoteButtonProps {
  reviewId: string
  initialVoteCount: number
  initialIsVoted: boolean
  userEmail?: string | null
}

export function VoteButton({ 
  reviewId, 
  initialVoteCount, 
  initialIsVoted,
  userEmail 
}: VoteButtonProps) {
  const [isVoted, setIsVoted] = useState(initialIsVoted)
  const [voteCount, setVoteCount] = useState(initialVoteCount)
  const [isPending, startTransition] = useTransition()

  const handleVote = async () => {
    if (!userEmail) {
      toast.error('Please sign in to vote', {
        description: 'You need to be signed in to upvote reviews.'
      })
      return
    }

    // Optimistic update
    const newIsVoted = !isVoted
    const newVoteCount = newIsVoted ? voteCount + 1 : voteCount - 1
    
    setIsVoted(newIsVoted)
    setVoteCount(newVoteCount)

    startTransition(async () => {
      const result = await toggleVote(reviewId)

      if (!result.success) {
        // Revert optimistic update on error
        setIsVoted(isVoted)
        setVoteCount(voteCount)
        toast.error('Failed to vote', {
          description: result.error
        })
      }
    })
  }

  return (
    <button
      onClick={handleVote}
      disabled={isPending}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
        isVoted
          ? 'bg-uw-red text-white border-uw-red hover:bg-uw-dark'
          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 hover:border-slate-400'
      } ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <ThumbsUp size={16} className={isVoted ? 'fill-current' : ''} />
      <span className="text-sm font-medium">
        Helpful {voteCount > 0 && `(${voteCount})`}
      </span>
    </button>
  )
}
