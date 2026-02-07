'use client'

import React, { useState } from 'react'
import { MessageSquare } from 'lucide-react'

interface CourseReviewFormProps {
  courseId: string
}

export const CourseReviewForm: React.FC<CourseReviewFormProps> = ({ courseId }) => {
  const [isOpen, setIsOpen] = useState(false)

  if (!isOpen) {
    return (
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-uw-red text-white rounded-lg hover:bg-uw-dark transition-colors font-medium"
        >
          <MessageSquare size={20} />
          Write a Review
        </button>
      </div>
    )
  }

  return (
    <div className="bg-surface-primary rounded-lg border border-surface-tertiary p-6">
      <h4 className="font-medium text-text-primary mb-4">Write a Review</h4>
      <p className="text-text-secondary text-sm">Review submission form coming soon!</p>
      <button
        onClick={() => setIsOpen(false)}
        className="mt-4 px-4 py-2 text-text-secondary hover:text-text-primary"
      >
        Cancel
      </button>
    </div>
  )
}