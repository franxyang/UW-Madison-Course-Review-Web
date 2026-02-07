'use client'

import { useState } from 'react'
import { MessageSquare, Send, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'

interface Comment {
  id: string
  text: string
  createdAt: Date
  author: {
    id: string
    name: string | null
    image?: string | null
  }
}

interface CommentSectionProps {
  reviewId: string
  comments: Comment[]
  userId?: string | null
}

export function CommentSection({ reviewId, comments, userId }: CommentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [commentText, setCommentText] = useState('')

  const utils = trpc.useUtils()

  const createCommentMutation = trpc.comment.create.useMutation({
    onSuccess: () => {
      toast.success('Comment added!')
      setCommentText('')
      // Invalidate course query to refresh comments
      utils.course.byId.invalidate()
    },
    onError: (error) => {
      toast.error('Failed to add comment', {
        description: error.message
      })
    }
  })

  const deleteCommentMutation = trpc.comment.delete.useMutation({
    onSuccess: () => {
      toast.success('Comment deleted')
      // Invalidate course query to refresh comments
      utils.course.byId.invalidate()
    },
    onError: (error) => {
      toast.error('Failed to delete comment', {
        description: error.message
      })
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userId) {
      toast.error('Please sign in to comment')
      return
    }

    if (!commentText.trim()) {
      toast.error('Please enter a comment')
      return
    }

    createCommentMutation.mutate({
      reviewId,
      text: commentText
    })
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    deleteCommentMutation.mutate({ commentId })
  }

  const isPending = createCommentMutation.isPending || deleteCommentMutation.isPending

  return (
    <div className="mt-4 pt-4 border-t border-surface-tertiary">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
      >
        <MessageSquare size={16} />
        <span>
          Comments {comments.length > 0 && `(${comments.length})`}
        </span>
      </button>

      {/* Expanded Section */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Comment Form */}
          {userId && (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                disabled={isPending}
                maxLength={500}
                className="flex-1 px-3 py-2 text-sm border border-surface-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-wf-crimson disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isPending || !commentText.trim()}
                className="btn-primary px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={16} />
                <span className="hidden sm:inline">Post</span>
              </button>
            </form>
          )}

          {!userId && (
            <div className="text-sm text-text-secondary bg-surface-secondary border border-surface-tertiary rounded-lg p-3">
              Please sign in to comment
            </div>
          )}

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-3 bg-surface-secondary rounded-lg border border-surface-tertiary"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-text-primary">
                          {comment.author.name || 'Anonymous'}
                        </span>
                        <span className="text-xs text-text-tertiary">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-text-secondary">{comment.text}</p>
                    </div>

                    {/* Delete Button (only for own comments) */}
                    {userId === comment.author.id && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        disabled={isPending}
                        className="text-slate-400 hover:text-red-600 transition-colors p-1"
                        title="Delete comment"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-text-tertiary text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
