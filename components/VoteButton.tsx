'use client'

import { useState } from 'react'
import { ThumbsUp } from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'

interface VoteButtonProps {
  reviewId: string
  initialVoteCount: number
  initialIsVoted: boolean
  userId?: string | null
  compact?: boolean
}

export function VoteButton({ 
  reviewId, 
  initialVoteCount, 
  initialIsVoted,
  userId,
  compact: _compact = false,
}: VoteButtonProps) {
  const [isVoted, setIsVoted] = useState(initialIsVoted)
  const [voteCount, setVoteCount] = useState(initialVoteCount)

  const utils = trpc.useUtils()
  const voteMutation = trpc.review.vote.useMutation({
    onMutate: async () => {
      // Optimistic update
      const newIsVoted = !isVoted
      const newVoteCount = newIsVoted ? voteCount + 1 : voteCount - 1
      
      setIsVoted(newIsVoted)
      setVoteCount(newVoteCount)
    },
    onError: (error) => {
      // Revert optimistic update on error
      setIsVoted(!isVoted)
      setVoteCount(isVoted ? voteCount - 1 : voteCount + 1)
      toast.error('Failed to vote', {
        description: error.message
      })
    },
    onSuccess: (data) => {
      // Update state from server response
      setIsVoted(data.isVoted)
      
      // Optionally invalidate course query to refresh all reviews
      // utils.course.byId.invalidate()
    }
  })

  const handleVote = async () => {
    if (!userId) {
      toast.error('Please sign in to vote', {
        description: 'You need to be signed in to upvote reviews.'
      })
      return
    }

    voteMutation.mutate({ reviewId })
  }

  return (
    <button
      onClick={handleVote}
      disabled={voteMutation.isPending}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
        isVoted
          ? 'bg-uw-red text-white border-uw-red hover:bg-uw-dark'
          : 'bg-surface-primary text-text-secondary border-surface-tertiary hover:bg-hover-bg hover:border-text-tertiary'
      } ${voteMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      <ThumbsUp size={16} className={isVoted ? 'fill-current' : ''} />
      <span className="text-sm font-medium">
        Helpful {voteCount > 0 && `(${voteCount})`}
      </span>
    </button>
  )
}
