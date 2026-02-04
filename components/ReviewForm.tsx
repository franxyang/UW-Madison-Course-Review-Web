'use client'

import React, { useState } from 'react'
import { submitReview, ReviewFormData } from '@/app/actions/reviews'
import { MessageSquare, X, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ReviewFormProps {
  courseId: string
  courseName: string
}

const GRADES = ['A', 'AB', 'B', 'BC', 'C', 'D', 'F']
const RATINGS = ['A', 'B', 'C', 'D', 'F']
const ASSESSMENTS = ['Midterm', 'Final', 'Project', 'Homework', 'Quiz', 'Lab', 'Essay', 'Presentation', 'Participation']
const TERMS = ['Fall 2024', 'Summer 2024', 'Spring 2024', 'Fall 2023', 'Summer 2023', 'Spring 2023']

function getRatingColor(rating: string) {
  const colors: Record<string, string> = {
    'A': 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200',
    'B': 'bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200',
    'C': 'bg-yellow-100 border-yellow-300 text-yellow-700 hover:bg-yellow-200',
    'D': 'bg-orange-100 border-orange-300 text-orange-700 hover:bg-orange-200',
    'F': 'bg-red-100 border-red-300 text-red-700 hover:bg-red-200',
    '': 'bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200'
  }
  return colors[rating] || colors['']
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ courseId, courseName }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [formData, setFormData] = useState<Partial<ReviewFormData>>({
    courseId,
    term: TERMS[0],
    gradeReceived: '',
    contentRating: '',
    teachingRating: '',
    gradingRating: '',
    workloadRating: '',
    assessments: [],
    instructorName: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required fields
    if (!formData.gradeReceived || !formData.contentRating || !formData.teachingRating ||
        !formData.gradingRating || !formData.workloadRating || !formData.instructorName) {
      setError('Please fill in all required fields')
      return
    }

    setIsSubmitting(true)

    try {
      const result = await submitReview(formData as ReviewFormData)

      if (result.success) {
        setSuccess(true)
        toast.success('Review submitted successfully! 🎉', {
          description: 'Your review is now visible to other students.'
        })
        
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(false)
          // Reset form
          setFormData({
            courseId,
            term: TERMS[0],
            gradeReceived: '',
            contentRating: '',
            teachingRating: '',
            gradingRating: '',
            workloadRating: '',
            assessments: [],
            instructorName: ''
          })
        }, 1500)
      } else {
        setError(result.error || 'Failed to submit review')
        toast.error('Failed to submit review', {
          description: result.error || 'Please try again later.'
        })
      }
    } catch (err) {
      setError('An error occurred while submitting your review')
      toast.error('An error occurred', {
        description: 'Please try again later.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleAssessment = (assessment: string) => {
    setFormData(prev => ({
      ...prev,
      assessments: prev.assessments?.includes(assessment)
        ? prev.assessments.filter(a => a !== assessment)
        : [...(prev.assessments || []), assessment]
    }))
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-uw-red text-white rounded-lg hover:bg-uw-dark transition-colors font-medium"
      >
        <MessageSquare size={20} />
        Write a Review
      </button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 transition-opacity" onClick={() => setIsOpen(false)}>
          <div className="absolute inset-0 bg-slate-900 opacity-50"></div>
        </div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 pt-6 pb-4 border-b border-slate-200">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-slate-900">Write a Review</h3>
                <p className="mt-1 text-sm text-slate-600">{courseName}</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <AlertCircle size={20} className="text-red-600 mt-0.5" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <span className="text-sm text-green-700">Review submitted successfully!</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Term <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.term}
                    onChange={(e) => setFormData({ ...formData, term: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-uw-red/20 focus:border-uw-red"
                  >
                    {TERMS.map(term => (
                      <option key={term} value={term}>{term}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Instructor <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.instructorName}
                    onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                    placeholder="Professor name"
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-uw-red/20 focus:border-uw-red"
                  />
                </div>
              </div>

              {/* Grade Received */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Grade Received <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  {GRADES.map(grade => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setFormData({ ...formData, gradeReceived: grade })}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${
                        formData.gradeReceived === grade
                          ? 'bg-uw-red border-uw-red text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4-Grid Ratings */}
              <div>
                <h4 className="text-sm font-medium text-slate-700 mb-3">Course Ratings <span className="text-red-500">*</span></h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'contentRating', label: 'Content', comment: 'contentComment' },
                    { key: 'teachingRating', label: 'Teaching', comment: 'teachingComment' },
                    { key: 'gradingRating', label: 'Grading', comment: 'gradingComment' },
                    { key: 'workloadRating', label: 'Workload', comment: 'workloadComment' }
                  ].map(({ key, label, comment }) => (
                    <div key={key} className="space-y-2">
                      <div className={`p-4 rounded-lg border-2 transition-all ${getRatingColor(formData[key as keyof typeof formData] as string)}`}>
                        <div className="text-xs font-medium mb-2">{label}</div>
                        <div className="flex gap-1">
                          {RATINGS.map(rating => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setFormData({ ...formData, [key]: rating })}
                              className={`px-2 py-1 text-sm font-bold rounded transition-all ${
                                formData[key as keyof typeof formData] === rating
                                  ? 'bg-white/80 text-slate-900 shadow-sm'
                                  : 'hover:bg-white/40'
                              }`}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="relative">
                        <textarea
                          placeholder={`Comments about ${label.toLowerCase()} (optional)`}
                          value={formData[comment as keyof typeof formData] as string || ''}
                          onChange={(e) => setFormData({ ...formData, [comment]: e.target.value })}
                          maxLength={3000}
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-uw-red/20 focus:border-uw-red resize-none"
                          rows={2}
                        />
                        <div className="text-xs text-slate-400 mt-1">
                          {((formData[comment as keyof typeof formData] as string) || '').length}/3000
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Review Title (optional)
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Summarize your experience"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-uw-red/20 focus:border-uw-red"
                />
              </div>

              {/* Assessments */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Assessments
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ASSESSMENTS.map(assessment => (
                    <button
                      key={assessment}
                      type="button"
                      onClick={() => toggleAssessment(assessment)}
                      className={`px-3 py-2 text-sm rounded-lg border transition-all ${
                        formData.assessments?.includes(assessment)
                          ? 'bg-uw-red border-uw-red text-white'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {assessment}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resource Link */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Course Resources Link (optional)
                </label>
                <input
                  type="url"
                  value={formData.resourceLink || ''}
                  onChange={(e) => setFormData({ ...formData, resourceLink: e.target.value })}
                  placeholder="Google Drive or Box link to notes/resources"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-uw-red/20 focus:border-uw-red"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-uw-red text-white rounded-lg hover:bg-uw-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}