'use client'

import { useState, useTransition } from 'react'
import { MessageSquare, Send, Trash2 } from 'lucide-react'
import { addComment, deleteComment } from '@/app/actions/comments'
import { toast } from 'sonner'

interface Comment {
  id: string
  text: string
  createdAt: Date
  author: {
    id: string
    name: string | null
    email: string
  }
}

interface CommentSectionProps {
  reviewId: string
  comments: Comment[]
  userEmail?: string | null
}

export function CommentSection({ reviewId, comments, userEmail }: CommentSectionProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [commentText, setCommentText] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!userEmail) {
      toast.error('Please sign in to comment')
      return
    }

    if (!commentText.trim()) {
      toast.error('Please enter a comment')
      return
    }

    startTransition(async () => {
      const result = await addComment(reviewId, commentText)

      if (result.success) {
        toast.success('Comment added!')
        setCommentText('')
      } else {
        toast.error('Failed to add comment', {
          description: result.error
        })
      }
    })
  }

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    startTransition(async () => {
      const result = await deleteComment(commentId)

      if (result.success) {
        toast.success('Comment deleted')
      } else {
        toast.error('Failed to delete comment', {
          description: result.error
        })
      }
    })
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
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
          {userEmail && (
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Add a comment..."
                disabled={isPending}
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-uw-red/20 focus:border-uw-red disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isPending || !commentText.trim()}
                className="px-4 py-2 bg-uw-red text-white rounded-lg hover:bg-uw-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Send size={16} />
                <span className="hidden sm:inline">Post</span>
              </button>
            </form>
          )}

          {!userEmail && (
            <div className="text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-3">
              Please sign in to comment
            </div>
          )}

          {/* Comments List */}
          {comments.length > 0 ? (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="p-3 bg-slate-50 rounded-lg border border-slate-100"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-900">
                          {comment.author.name || comment.author.email.split('@')[0]}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700">{comment.text}</p>
                    </div>

                    {/* Delete Button (only for own comments) */}
                    {userEmail === comment.author.email && (
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
            <p className="text-sm text-slate-500 text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          )}
        </div>
      )}
    </div>
  )
}
