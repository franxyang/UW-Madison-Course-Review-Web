'use client'

import React, { useState, useMemo } from 'react'
import { MessageSquare, X, AlertCircle, ThumbsUp, ThumbsDown, Meh } from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'

interface ReviewFormProps {
  courseId: string
  courseName: string
  courseInstructors?: { instructor: { id: string; name: string } }[]
  gradeDistributions?: { term: string; instructor?: { id: string; name: string } | null }[]
}

type ReviewFormData = {
  courseId: string
  term: string
  customTerm: string
  title?: string
  gradeReceived: string
  contentRating: string
  teachingRating: string
  gradingRating: string
  workloadRating: string
  contentComment?: string
  teachingComment?: string
  gradingComment?: string
  workloadComment?: string
  assessments: string[]
  resourceLink?: string
  instructorName: string
  isCustomInstructor: boolean
  recommendInstructor: 'yes' | 'no' | 'neutral' | ''
}

const GRADES = ['A', 'AB', 'B', 'BC', 'C', 'D', 'F']
const RATINGS = ['A', 'B', 'C', 'D', 'F']
const ASSESSMENTS = ['Midterm', 'Final', 'Project', 'Homework', 'Quiz', 'Lab', 'Essay', 'Presentation', 'Participation']

// Comment examples for each dimension
const COMMENT_EXAMPLES = {
  content: "e.g., Chapter 1: Introduction to... Midterm covers Ch 1-5, Final covers Ch 6-12. Key topics include...",
  teaching: "e.g., Professor explains concepts clearly, very open to questions. Office hours are helpful. Uses real-world examples...",
  grading: "e.g., Midterm 30%, Final 40%, HW 20%, Participation 10%. Exams are multiple choice. Grading curve applied...",
  workload: "e.g., Light workload with 2 problem sets per week (~3 hours). Reading is optional. No group projects..."
}

// Generate available terms (current + past 3 years)
// Format: "YYYY-Season" to match database format
function generateTerms() {
  const terms: string[] = []
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonth = now.getMonth()
  
  for (let year = currentYear; year >= currentYear - 3; year--) {
    if (year === currentYear) {
      if (currentMonth >= 8) terms.push(`${year}-Fall`)
      if (currentMonth >= 5) terms.push(`${year}-Summer`)
      terms.push(`${year}-Spring`)
    } else {
      terms.push(`${year}-Fall`)
      terms.push(`${year}-Summer`)
      terms.push(`${year}-Spring`)
    }
  }
  return terms.slice(0, 12)
}

// Format term for display (e.g., "2024-Fall" -> "Fall 2024")
function formatTermForDisplay(term: string): string {
  const match = term.match(/^(\d{4})-(\w+)$/)
  if (match) {
    return `${match[2]} ${match[1]}`
  }
  return term
}

// Get grade-specific color for Grade Received
function getGradeButtonColor(grade: string, isSelected: boolean) {
  if (!isSelected) {
    return 'bg-surface-secondary border-surface-tertiary text-text-secondary hover:border-text-tertiary'
  }
  const colors: Record<string, string> = {
    'A': 'bg-emerald-500 border-emerald-500 text-white',
    'AB': 'bg-emerald-400 border-emerald-400 text-white',
    'B': 'bg-blue-500 border-blue-500 text-white',
    'BC': 'bg-blue-400 border-blue-400 text-white',
    'C': 'bg-amber-500 border-amber-500 text-white',
    'D': 'bg-orange-500 border-orange-500 text-white',
    'F': 'bg-red-500 border-red-500 text-white',
  }
  return colors[grade] || 'bg-wf-crimson border-wf-crimson text-white'
}

// Get rating color for the 4-dimension cards
function getRatingColor(rating: string) {
  const colors: Record<string, string> = {
    'A': 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300',
    'B': 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300',
    'C': 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300',
    'D': 'bg-orange-100 dark:bg-orange-900/30 border-orange-300 dark:border-orange-700 text-orange-700 dark:text-orange-300',
    'F': 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300',
    '': 'bg-surface-secondary border-surface-tertiary text-text-secondary'
  }
  return colors[rating] || colors['']
}

// Convert letter grade to numeric value
function gradeToNumeric(grade: string): number {
  const grades: Record<string, number> = {
    'A': 4.0, 'AB': 3.5, 'B': 3.0, 'BC': 2.5, 'C': 2.0, 'D': 1.0, 'F': 0.0
  }
  return grades[grade] ?? -1
}

// Get modal background gradient based on average of 4 ratings
function getModalGradientStyle(ratings: { content: string; teaching: string; grading: string; workload: string }) {
  const values = [
    gradeToNumeric(ratings.content),
    gradeToNumeric(ratings.teaching),
    gradeToNumeric(ratings.grading),
    gradeToNumeric(ratings.workload)
  ].filter(v => v >= 0)
  
  // If no ratings selected yet, return neutral
  if (values.length === 0) {
    return { background: undefined, borderColor: undefined }
  }
  
  const avgNumeric = values.reduce((a, b) => a + b, 0) / values.length
  // Map 0-4 to hue 0-120 (red to green)
  const hue = (avgNumeric / 4) * 120
  
  return {
    background: `linear-gradient(135deg, hsl(${hue}, 60%, 98%) 0%, hsl(${hue}, 50%, 95%) 100%)`,
    borderColor: `hsl(${hue}, 50%, 80%)`
  }
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ 
  courseId, 
  courseName, 
  courseInstructors = [],
  gradeDistributions = []
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const availableTerms = useMemo(() => generateTerms(), [])
  
  // Extract unique terms from grade distributions (terms that have data)
  const termsWithData = useMemo(() => {
    const terms = new Set<string>()
    gradeDistributions.forEach(gd => terms.add(gd.term))
    return terms
  }, [gradeDistributions])
  
  // Get instructors for a specific term
  const getInstructorsForTerm = (term: string) => {
    const instructors = new Map<string, string>()
    gradeDistributions
      .filter(gd => gd.term === term && gd.instructor)
      .forEach(gd => {
        if (gd.instructor) {
          instructors.set(gd.instructor.id, gd.instructor.name)
        }
      })
    return Array.from(instructors.entries()).map(([id, name]) => ({ id, name }))
  }

  const [formData, setFormData] = useState<Partial<ReviewFormData>>({
    courseId,
    term: availableTerms[0] || '',
    customTerm: '',
    gradeReceived: '',
    contentRating: '',
    teachingRating: '',
    gradingRating: '',
    workloadRating: '',
    assessments: [],
    instructorName: '',
    isCustomInstructor: false,
    recommendInstructor: ''
  })
  
  // Check if selected term has data in database
  const termHasData = termsWithData.has(formData.term || '')
  const instructorsForTerm = termHasData ? getInstructorsForTerm(formData.term || '') : []

  // Calculate modal gradient based on current ratings (real-time)
  const modalGradient = useMemo(() => getModalGradientStyle({
    content: formData.contentRating || '',
    teaching: formData.teachingRating || '',
    grading: formData.gradingRating || '',
    workload: formData.workloadRating || ''
  }), [formData.contentRating, formData.teachingRating, formData.gradingRating, formData.workloadRating])

  const utils = trpc.useUtils()
  const createReviewMutation = trpc.review.create.useMutation({
    onSuccess: () => {
      toast.success('Review submitted successfully! 🎉', {
        description: 'Your review is now visible to other students.'
      })
      
      utils.course.byId.invalidate({ id: courseId })
      
      setTimeout(() => {
        setIsOpen(false)
        setError(null)
        setFormData({
          courseId,
          term: availableTerms[0] || '',
          customTerm: '',
          gradeReceived: '',
          contentRating: '',
          teachingRating: '',
          gradingRating: '',
          workloadRating: '',
          assessments: [],
          instructorName: '',
          isCustomInstructor: false,
          recommendInstructor: ''
        })
      }, 1500)
    },
    onError: (error) => {
      setError(error.message)
      toast.error('Failed to submit review', { description: error.message })
    }
  })

  const handleTermChange = (term: string) => {
    const hasData = termsWithData.has(term)
    setFormData(prev => ({ 
      ...prev, 
      term, 
      instructorName: '', 
      isCustomInstructor: !hasData 
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate required fields
    if (!formData.contentRating || !formData.teachingRating ||
        !formData.gradingRating || !formData.workloadRating || !formData.instructorName) {
      setError('Please fill in all required fields (ratings and instructor)')
      return
    }

    // Validate all 4 comments are filled (minimum 20 characters each)
    const comments = [
      { name: 'Content', value: formData.contentComment },
      { name: 'Teaching', value: formData.teachingComment },
      { name: 'Grading', value: formData.gradingComment },
      { name: 'Workload', value: formData.workloadComment },
    ]
    const missingComments = comments.filter(c => !c.value || c.value.trim().length < 20)
    if (missingComments.length > 0) {
      setError(`Please fill in all comments (minimum 20 characters each). Missing: ${missingComments.map(c => c.name).join(', ')}`)
      return
    }

    // Validate rating values
    const validRatings = ['A', 'AB', 'B', 'BC', 'C', 'D', 'F']
    if (!validRatings.includes(formData.contentRating) ||
        !validRatings.includes(formData.teachingRating) ||
        !validRatings.includes(formData.gradingRating) ||
        !validRatings.includes(formData.workloadRating)) {
      setError('Invalid rating values')
      return
    }

    if (formData.gradeReceived && !validRatings.includes(formData.gradeReceived)) {
      setError('Invalid grade value')
      return
    }

    createReviewMutation.mutate({
      courseId: formData.courseId!,
      term: formData.term!,
      title: formData.title,
      gradeReceived: (formData.gradeReceived || undefined) as 'A' | 'AB' | 'B' | 'BC' | 'C' | 'D' | 'F' | undefined,
      contentRating: formData.contentRating as 'A' | 'AB' | 'B' | 'BC' | 'C' | 'D' | 'F',
      teachingRating: formData.teachingRating as 'A' | 'AB' | 'B' | 'BC' | 'C' | 'D' | 'F',
      gradingRating: formData.gradingRating as 'A' | 'AB' | 'B' | 'BC' | 'C' | 'D' | 'F',
      workloadRating: formData.workloadRating as 'A' | 'AB' | 'B' | 'BC' | 'C' | 'D' | 'F',
      contentComment: formData.contentComment,
      teachingComment: formData.teachingComment,
      gradingComment: formData.gradingComment,
      workloadComment: formData.workloadComment,
      assessments: formData.assessments,
      resourceLink: formData.resourceLink,
      recommendInstructor: formData.recommendInstructor as 'yes' | 'no' | 'neutral' | undefined,
      instructorName: formData.instructorName!,
    })
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
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-wf-crimson text-white rounded-lg hover:bg-wf-crimson-dark transition-colors font-medium"
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
        <div className="fixed inset-0 transition-opacity" onClick={() => !createReviewMutation.isPending && setIsOpen(false)}>
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70"></div>
        </div>

        {/* Modal */}
        <div 
          className="inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full border"
          style={{
            background: modalGradient.background || 'var(--surface-primary)',
            borderColor: modalGradient.borderColor || 'var(--surface-tertiary)'
          }}
        >
          {/* Header */}
          <div className="bg-surface-primary px-6 pt-6 pb-4 border-b border-surface-tertiary">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-text-primary">Write a Review</h3>
                <p className="mt-1 text-sm text-text-secondary">{courseName}</p>
              </div>
              <button
                onClick={() => !createReviewMutation.isPending && setIsOpen(false)}
                className="text-text-tertiary hover:text-text-primary transition-colors disabled:opacity-50"
                disabled={createReviewMutation.isPending}
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-4 max-h-[70vh] overflow-y-auto">
            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-2">
                <AlertCircle size={20} className="text-red-600 dark:text-red-400 mt-0.5" />
                <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              </div>
            )}

            {createReviewMutation.isSuccess && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <span className="text-sm text-green-700 dark:text-green-300">Review submitted successfully!</span>
              </div>
            )}

            <div className="space-y-6">
              {/* Term & Instructor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Term <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.term}
                    onChange={(e) => handleTermChange(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-secondary border border-surface-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-wf-crimson/20 focus:border-wf-crimson text-text-primary"
                    disabled={createReviewMutation.isPending}
                  >
                    {availableTerms.map(term => (
                      <option key={term} value={term}>
                        {formatTermForDisplay(term)} {termsWithData.has(term) ? '' : '(manual entry)'}
                      </option>
                    ))}
                  </select>
                  {!termHasData && (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      No data for this term - enter instructor manually
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Instructor <span className="text-red-500">*</span>
                  </label>
                  {termHasData && instructorsForTerm.length > 0 ? (
                    <select
                      value={formData.instructorName}
                      onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                      className="w-full px-3 py-2 bg-surface-secondary border border-surface-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-wf-crimson/20 focus:border-wf-crimson text-text-primary"
                      disabled={createReviewMutation.isPending}
                    >
                      <option value="">Select instructor...</option>
                      {instructorsForTerm.map(inst => (
                        <option key={inst.id} value={inst.name}>{inst.name}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={formData.instructorName}
                      onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                      placeholder="Professor name"
                      className="w-full px-3 py-2 bg-surface-secondary border border-surface-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-wf-crimson/20 focus:border-wf-crimson text-text-primary"
                      disabled={createReviewMutation.isPending}
                    />
                  )}
                </div>
              </div>

              {/* Recommend Instructor */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Would you recommend this instructor?
                </label>
                <div className="flex gap-3">
                  {[
                    { value: 'yes', icon: ThumbsUp, label: 'Yes', color: 'emerald' },
                    { value: 'neutral', icon: Meh, label: 'Neutral', color: 'amber' },
                    { value: 'no', icon: ThumbsDown, label: 'No', color: 'red' },
                  ].map(({ value, icon: Icon, label, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, recommendInstructor: formData.recommendInstructor === value ? '' : value as any })}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all ${
                        formData.recommendInstructor === value
                          ? `bg-${color}-100 dark:bg-${color}-900/30 border-${color}-400 text-${color}-700 dark:text-${color}-300`
                          : 'bg-surface-secondary border-surface-tertiary text-text-secondary hover:border-text-tertiary'
                      }`}
                      disabled={createReviewMutation.isPending}
                    >
                      <Icon size={18} />
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Grade Received - Now with grade-specific colors */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Grade Received <span className="text-text-tertiary text-xs">(optional)</span>
                </label>
                <div className="flex gap-2 flex-wrap">
                  {GRADES.map(grade => (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => setFormData({ ...formData, gradeReceived: formData.gradeReceived === grade ? '' : grade })}
                      className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${getGradeButtonColor(grade, formData.gradeReceived === grade)}`}
                      disabled={createReviewMutation.isPending}
                    >
                      {grade}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4-Grid Ratings with required comments */}
              <div>
                <h4 className="text-sm font-medium text-text-primary mb-1">Course Ratings <span className="text-red-500">*</span></h4>
                <p className="text-xs text-text-tertiary mb-3">All 4 dimension ratings and comments are required (min 20 chars each)</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'contentRating', label: 'Content', comment: 'contentComment', required: true },
                    { key: 'teachingRating', label: 'Teaching', comment: 'teachingComment', required: true },
                    { key: 'gradingRating', label: 'Grading', comment: 'gradingComment', required: true },
                    { key: 'workloadRating', label: 'Workload', comment: 'workloadComment', required: true }
                  ].map(({ key, label, comment, required }) => (
                    <div key={key} className="space-y-2">
                      <div className={`p-4 rounded-lg border-2 transition-all ${getRatingColor(formData[key as keyof typeof formData] as string)}`}>
                        <div className="text-xs font-medium mb-2">
                          {label} {required && <span className="text-red-500">*</span>}
                        </div>
                        <div className="flex gap-1">
                          {RATINGS.map(rating => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setFormData({ ...formData, [key]: rating })}
                              className={`px-2 py-1 text-sm font-bold rounded transition-all ${
                                formData[key as keyof typeof formData] === rating
                                  ? 'bg-white/80 dark:bg-black/30 shadow-sm'
                                  : 'hover:bg-white/40 dark:hover:bg-black/20'
                              }`}
                              disabled={createReviewMutation.isPending}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="relative">
                        <textarea
                          placeholder={COMMENT_EXAMPLES[label.toLowerCase() as keyof typeof COMMENT_EXAMPLES]}
                          value={formData[comment as keyof typeof formData] as string || ''}
                          onChange={(e) => setFormData({ ...formData, [comment]: e.target.value })}
                          maxLength={3000}
                          className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-wf-crimson/20 focus:border-wf-crimson resize-y text-text-primary placeholder:text-text-tertiary/70 min-h-[120px]"
                          rows={5}
                          disabled={createReviewMutation.isPending}
                        />
                        <div className="text-xs text-text-tertiary mt-1 flex justify-between">
                          <span>{required ? 'Required (min 20 chars)' : 'Optional'}</span>
                          <span>{((formData[comment as keyof typeof formData] as string) || '').length}/3000</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Title */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Review Title (optional)
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Summarize your experience"
                  className="w-full px-3 py-2 bg-surface-secondary border border-surface-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-wf-crimson/20 focus:border-wf-crimson text-text-primary"
                  disabled={createReviewMutation.isPending}
                />
              </div>

              {/* Assessments */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
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
                          ? 'bg-wf-crimson/10 border-wf-crimson text-wf-crimson font-medium'
                          : 'bg-surface-secondary border-surface-tertiary text-text-secondary hover:border-text-tertiary'
                      }`}
                      disabled={createReviewMutation.isPending}
                    >
                      {assessment}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resource Link */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Course Resources Link (optional)
                </label>
                <input
                  type="url"
                  value={formData.resourceLink || ''}
                  onChange={(e) => setFormData({ ...formData, resourceLink: e.target.value })}
                  placeholder="Google Drive or Box link to notes/resources"
                  className="w-full px-3 py-2 bg-surface-secondary border border-surface-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-wf-crimson/20 focus:border-wf-crimson text-text-primary"
                  disabled={createReviewMutation.isPending}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-surface-tertiary">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 px-4 py-2 bg-surface-secondary border border-surface-tertiary text-text-primary rounded-lg hover:bg-hover-bg transition-colors"
                disabled={createReviewMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-wf-crimson text-white rounded-lg hover:bg-wf-crimson-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={createReviewMutation.isPending}
              >
                {createReviewMutation.isPending ? 'Submitting...' : 'Submit Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
