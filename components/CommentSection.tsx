'use client'

import React, { useState } from 'react'
import { addComment } from '@/app/actions/comments'
import { MessageSquare, Send, User } from 'lucide-react'

interface Comment {
  id: string
  text: string
  author: {
    name: string | null
    email: string
  }
  createdAt: Date
}

interface CommentSectionProps {
  reviewId: string
  comments: Comment[]
}

export const CommentSection: React.FC<CommentSectionProps> = ({ reviewId, comments: initialComments }) => {
  const [comments, setComments] = useState(initialComments)
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showComments, setShowComments] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newComment.trim()) return

    setIsSubmitting(true)

    try {
      const result = await addComment(reviewId, newComment)

      if (result.success && result.comment) {
        setComments([...comments, result.comment])
        setNewComment('')
      }
    } catch (error) {
      console.error('Error submitting comment:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      {/* Toggle Comments Button */}
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
      >
        <MessageSquare size={16} />
        {comments.length} {comments.length === 1 ? 'Comment' : 'Comments'}
      </button>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 space-y-4">
          {/* Existing Comments */}
          {comments.length > 0 && (
            <div className="space-y-3">
              {comments.map(comment => (
                <div key={comment.id} className="bg-slate-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-slate-300 rounded-full flex items-center justify-center">
                        <User size={12} className="text-slate-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">
                        {comment.author.name || 'Anonymous'}
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 ml-8">{comment.text}</p>
                </div>
              ))}
            </div>
          )}

          {/* Add Comment Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              disabled={isSubmitting}
              className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-uw-red/20 focus:border-uw-red disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSubmitting || !newComment.trim()}
              className="px-3 py-2 bg-uw-red text-white rounded-lg hover:bg-uw-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}