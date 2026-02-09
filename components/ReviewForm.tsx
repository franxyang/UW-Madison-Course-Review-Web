'use client'

import React, { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, X, AlertCircle, ThumbsUp, ThumbsDown, Meh, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { trpc } from '@/lib/trpc/client'
import { normalizeInstructorName } from '@/lib/instructorName'

interface ExistingReview {
  id: string
  term: string
  title?: string | null
  gradeReceived?: string | null
  contentRating: string
  teachingRating: string
  gradingRating: string
  workloadRating: string
  contentComment?: string | null
  teachingComment?: string | null
  gradingComment?: string | null
  workloadComment?: string | null
  assessments?: string[] | null
  resourceLink?: string | null
  recommendInstructor?: string | null
  instructor?: { id: string; name: string } | null
  isAnonymous?: boolean
  showRankWhenAnonymous?: boolean
}

interface ReviewFormProps {
  courseId: string
  courseName: string
  courseInstructors?: { instructor: { id: string; name: string } }[]
  gradeDistributions?: { term: string; instructor?: { id: string; name: string } | null }[]
  reviewInstructorsByTerm?: { term: string; names: string[] }[]
  existingReview?: ExistingReview | null
  onEditComplete?: () => void
  onEditCancel?: () => void
  isLoggedIn?: boolean
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
const RATINGS = ['A', 'AB', 'B', 'BC', 'C', 'D', 'F']
const GRADE_COLOR_HEX: Record<string, string> = {
  A: '#10b981',
  AB: '#34d399',
  B: '#fbbf24',
  BC: '#f59e0b',
  C: '#fb923c',
  D: '#f87171',
  F: '#ef4444',
}
const OVERALL_COLOR_STOPS: Array<{ value: number; color: string }> = [
  { value: 0.0, color: GRADE_COLOR_HEX.F },
  { value: 1.0, color: GRADE_COLOR_HEX.D },
  { value: 2.0, color: GRADE_COLOR_HEX.C },
  { value: 2.5, color: GRADE_COLOR_HEX.BC },
  { value: 3.0, color: GRADE_COLOR_HEX.B },
  { value: 3.5, color: GRADE_COLOR_HEX.AB },
  { value: 4.0, color: GRADE_COLOR_HEX.A },
]

// Tooltips explaining what each rating means per dimension
const RATING_HINTS: Record<string, Record<string, string>> = {
  Content: {
    A: 'Exceptional depth and structure',
    AB: 'Very strong with minor gaps',
    B: 'Solid overall coverage',
    BC: 'Usable but somewhat uneven',
    C: 'Average clarity and organization',
    D: 'Hard to follow',
    F: 'Very poor content quality',
  },
  Teaching: {
    A: 'Outstanding teaching clarity',
    AB: 'Very effective teaching',
    B: 'Generally clear instruction',
    BC: 'Mixed teaching effectiveness',
    C: 'Average teaching quality',
    D: 'Mostly unclear delivery',
    F: 'Very ineffective teaching',
  },
  Grading: {
    A: 'Very fair and transparent',
    AB: 'Mostly fair grading',
    B: 'Reasonably fair',
    BC: 'Somewhat inconsistent',
    C: 'Average fairness',
    D: 'Often felt harsh',
    F: 'Very unfair grading',
  },
  Workload: {
    A: 'Very manageable workload',
    AB: 'Light-to-moderate workload',
    B: 'Manageable with planning',
    BC: 'Moderately heavy',
    C: 'Average-heavy workload',
    D: 'Heavy workload',
    F: 'Extremely heavy workload',
  },
}

// Short description shown below each rating section
const DIMENSION_DESC: Record<string, string> = {
  Content: 'How useful and well-organized is the course material?',
  Teaching: 'How effective is the instructor at explaining concepts?',
  Grading: 'How fair and transparent is the grading? A = very fair',
  Workload: 'How manageable is the workload? A = very light, F = extremely heavy',
}
const ASSESSMENTS = ['Midterm', 'Final', 'Project', 'Homework', 'Quiz', 'Lab', 'Essay', 'Presentation', 'Participation']

// Comment examples for each dimension
const COMMENT_EXAMPLES = {
  content: "Example:\nThis course covers foundational topics in [Subject], including:\n1. Major Topic A (e.g., Energy Balance)\n2. Major Topic B (e.g., Heat Transfer)\n3. Major Topic C (e.g., Fluid Flow)\n4. Major Topic D\n\nThe content is well structured for beginners, though some sections could go deeper.",
  teaching: "Example:\nI enjoyed [Instructor Name]'s teaching style. The pace was steady and explanations were clear.\n\nLectures combined demonstrations and practical examples, which made concepts easier to understand. TAs were also helpful and patient.",
  grading: "Example:\n- Participation: 10%\n- Project: 20%\n- Final Exam: 35%\n- Lab Reports: 15% (3 x 5)\n- Homework: 20%\n\nGrading felt transparent overall. Homework was challenging but fair, and expectations were clearly communicated.",
  workload: "Example:\nIf you have prior background in [Related Subject], you may already know much of the material.\n\nWeekly homework volume is moderate, and study time is manageable with consistent effort. Overall workload feels light-to-moderate for this department."
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
    'A': 'bg-emerald-600 border-emerald-600 text-white',
    'AB': 'bg-emerald-400 border-emerald-400 text-white',
    'B': 'bg-amber-400 border-amber-400 text-slate-900',
    'BC': 'bg-amber-500 border-amber-500 text-white',
    'C': 'bg-orange-400 border-orange-400 text-white',
    'D': 'bg-red-400 border-red-400 text-white',
    'F': 'bg-red-500 border-red-500 text-white',
  }
  return colors[grade] || 'bg-wf-crimson border-wf-crimson text-white'
}

// Convert letter grade to numeric value
function gradeToNumeric(grade: string): number {
  const grades: Record<string, number> = {
    'A': 4.0, 'AB': 3.5, 'B': 3.0, 'BC': 2.5, 'C': 2.0, 'D': 1.0, 'F': 0.0
  }
  return grades[grade] ?? -1
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const normalized = hex.replace('#', '')
  const bigint = parseInt(normalized, 16)
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  }
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.round(n).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

function rgba(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function interpolateOverallColor(value: number): string {
  const clamped = Math.max(0, Math.min(4, value))
  for (let i = 0; i < OVERALL_COLOR_STOPS.length - 1; i += 1) {
    const a = OVERALL_COLOR_STOPS[i]
    const b = OVERALL_COLOR_STOPS[i + 1]
    if (clamped >= a.value && clamped <= b.value) {
      const t = (clamped - a.value) / (b.value - a.value || 1)
      const rgbA = hexToRgb(a.color)
      const rgbB = hexToRgb(b.color)
      return rgbToHex(
        rgbA.r + (rgbB.r - rgbA.r) * t,
        rgbA.g + (rgbB.g - rgbA.g) * t,
        rgbA.b + (rgbB.b - rgbA.b) * t,
      )
    }
  }
  return OVERALL_COLOR_STOPS[OVERALL_COLOR_STOPS.length - 1].color
}

function getRatingPanelStyle(rating: string): React.CSSProperties {
  const numeric = gradeToNumeric(rating)
  if (numeric < 0) {
    return {
      background: 'var(--surface-secondary)',
      borderColor: 'var(--surface-tertiary)',
    }
  }

  const color = GRADE_COLOR_HEX[rating] || interpolateOverallColor(numeric)
  return {
    background: `linear-gradient(145deg, ${rgba(color, 0.30)} 0%, ${rgba(color, 0.46)} 100%)`,
    borderColor: rgba(color, 0.95),
  }
}

function getRatingButtonClass(isSelected: boolean) {
  if (isSelected) return 'text-white shadow-sm border'
  return 'text-text-secondary hover:bg-white/50 dark:hover:bg-black/20 border border-transparent'
}

function getSelectedRatingButtonStyle(rating: string): React.CSSProperties {
  const numeric = gradeToNumeric(rating)
  if (numeric < 0) return {}
  const color = GRADE_COLOR_HEX[rating] || interpolateOverallColor(numeric)
  return {
    backgroundColor: color,
    borderColor: rgba(color, 0.98),
    boxShadow: `0 0 0 1px ${rgba(color, 0.35)}`,
  }
}

// Use rating average to drive a strong top accent gradient for the modal.
function getModalGradientStyle(ratings: { content: string; teaching: string; grading: string; workload: string }) {
  const values = [
    gradeToNumeric(ratings.content),
    gradeToNumeric(ratings.teaching),
    gradeToNumeric(ratings.grading),
    gradeToNumeric(ratings.workload)
  ].filter(v => v >= 0)
  
  // If no ratings selected yet, return neutral
  if (values.length === 0) {
    return {
      topBarGradient: 'linear-gradient(90deg, #94a3b8 0%, #64748b 100%)',
      borderColor: 'var(--surface-tertiary)',
    }
  }
  
  const avgNumeric = values.reduce((a, b) => a + b, 0) / values.length
  const centerColor = interpolateOverallColor(avgNumeric)
  const startColor = interpolateOverallColor(Math.min(4, avgNumeric + 0.35))
  const endColor = interpolateOverallColor(Math.max(0, avgNumeric - 0.35))
  
  return {
    topBarGradient: `linear-gradient(90deg, ${startColor} 0%, ${centerColor} 52%, ${endColor} 100%)`,
    borderColor: rgba(centerColor, 0.98),
  }
}

export const ReviewForm: React.FC<ReviewFormProps> = ({ 
  courseId, 
  courseName, 
  courseInstructors = [],
  gradeDistributions = [],
  reviewInstructorsByTerm = [],
  existingReview = null,
  onEditComplete,
  onEditCancel,
  isLoggedIn = true,
}) => {
  const router = useRouter()
  const isEditMode = !!existingReview
  const [isOpen, setIsOpen] = useState(isEditMode)
  const [error, setError] = useState<string | null>(null)
  
  const availableTerms = useMemo(() => generateTerms(), [])
  
  // Extract unique terms from grade distributions (terms that have data)
  const termsWithData = useMemo(() => {
    const terms = new Set<string>()
    gradeDistributions.forEach(gd => terms.add(gd.term))
    return terms
  }, [gradeDistributions])
  
  const [formData, setFormData] = useState<Partial<ReviewFormData>>({
    courseId,
    term: existingReview?.term || availableTerms[0] || '',
    customTerm: '',
    gradeReceived: existingReview?.gradeReceived || '',
    contentRating: existingReview?.contentRating || '',
    teachingRating: existingReview?.teachingRating || '',
    gradingRating: existingReview?.gradingRating || '',
    workloadRating: existingReview?.workloadRating || '',
    contentComment: existingReview?.contentComment || '',
    teachingComment: existingReview?.teachingComment || '',
    gradingComment: existingReview?.gradingComment || '',
    workloadComment: existingReview?.workloadComment || '',
    title: existingReview?.title || '',
    assessments: existingReview?.assessments || [],
    resourceLink: existingReview?.resourceLink || '',
    instructorName: existingReview?.instructor?.name
      ? normalizeInstructorName(existingReview.instructor.name).displayName
      : '',
    isCustomInstructor: false,
    recommendInstructor: (existingReview?.recommendInstructor as any) || ''
  })

  const [isAnonymous, setIsAnonymous] = useState(existingReview?.isAnonymous ?? false)
  // Always show rank when anonymous (no toggle needed)
  const showRankWhenAnonymous = true
  
  // Check if selected term has data in database
  const termHasData = termsWithData.has(formData.term || '')
  const instructorsForTerm = useMemo(() => {
    const selectedTerm = formData.term || ''
    const names = new Set<string>()

    gradeDistributions
      .filter(gd => gd.term === selectedTerm && gd.instructor?.name)
      .forEach(gd => {
        if (gd.instructor?.name) {
          names.add(normalizeInstructorName(gd.instructor.name).displayName)
        }
      })

    reviewInstructorsByTerm
      .find(entry => entry.term === selectedTerm)
      ?.names.forEach(name => names.add(normalizeInstructorName(name).displayName))

    courseInstructors.forEach(entry => {
      if (entry.instructor?.name) {
        names.add(normalizeInstructorName(entry.instructor.name).displayName)
      }
    })

    return [...names].sort((a, b) => a.localeCompare(b))
  }, [formData.term, gradeDistributions, reviewInstructorsByTerm, courseInstructors])

  const instructorSuggestionsId = useMemo(
    () => `instructor-suggestions-${courseId.replace(/[^a-zA-Z0-9_-]/g, '')}`,
    [courseId]
  )

  // Calculate modal gradient based on current ratings (real-time)
  const modalGradient = useMemo(() => getModalGradientStyle({
    content: formData.contentRating || '',
    teaching: formData.teachingRating || '',
    grading: formData.gradingRating || '',
    workload: formData.workloadRating || ''
  }), [formData.contentRating, formData.teachingRating, formData.gradingRating, formData.workloadRating])
  const sectionCardClass = 'rounded-xl border border-surface-tertiary/80 bg-surface-primary/85 p-4 sm:p-5 shadow-sm'
  const overallNumeric = useMemo(() => {
    const values = [
      gradeToNumeric(formData.contentRating || ''),
      gradeToNumeric(formData.teachingRating || ''),
      gradeToNumeric(formData.gradingRating || ''),
      gradeToNumeric(formData.workloadRating || ''),
    ].filter(v => v >= 0)
    if (values.length === 0) return null
    return values.reduce((a, b) => a + b, 0) / values.length
  }, [formData.contentRating, formData.teachingRating, formData.gradingRating, formData.workloadRating])
  const overallLetter = useMemo(() => {
    if (overallNumeric === null) return 'NA'
    if (overallNumeric >= 3.75) return 'A'
    if (overallNumeric >= 3.25) return 'AB'
    if (overallNumeric >= 2.75) return 'B'
    if (overallNumeric >= 2.25) return 'BC'
    if (overallNumeric >= 1.5) return 'C'
    if (overallNumeric >= 0.75) return 'D'
    return 'F'
  }, [overallNumeric])

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

  const updateReviewMutation = trpc.review.update.useMutation({
    onSuccess: () => {
      toast.success('Review updated successfully! ✏️', {
        description: 'Your changes have been saved.'
      })
      utils.course.byId.invalidate({ id: courseId })
      setTimeout(() => {
        onEditComplete?.()
      }, 1000)
    },
    onError: (error) => {
      setError(error.message)
      toast.error('Failed to update review', { description: error.message })
    }
  })

  const activeMutation = isEditMode ? updateReviewMutation : createReviewMutation

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
    const normalizedInstructor = normalizeInstructorName(formData.instructorName || '')
    if (!formData.contentRating || !formData.teachingRating ||
        !formData.gradingRating || !formData.workloadRating || !normalizedInstructor.key) {
      setError('Please fill in all required fields (ratings and instructor)')
      return
    }

    // Validate all 4 comments are filled (minimum 5 characters each)
    const comments = [
      { name: 'Content', value: formData.contentComment },
      { name: 'Teaching', value: formData.teachingComment },
      { name: 'Grading', value: formData.gradingComment },
      { name: 'Workload', value: formData.workloadComment },
    ]
    const missingComments = comments.filter(c => !c.value || c.value.trim().length < 5)
    if (missingComments.length > 0) {
      setError(`Please fill in all comments (minimum 5 characters each). Missing: ${missingComments.map(c => c.name).join(', ')}`)
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

    if (isEditMode && existingReview) {
      updateReviewMutation.mutate({
        reviewId: existingReview.id,
        term: formData.term,
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
        instructorName: normalizedInstructor.displayName,
        isAnonymous,
        showRankWhenAnonymous,
      })
    } else {
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
        instructorName: normalizedInstructor.displayName,
        isAnonymous,
        showRankWhenAnonymous,
      })
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

  if (!isOpen && !isEditMode) {
    if (!isLoggedIn) {
      return (
        <button
          onClick={() => router.push('/auth/signin')}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-wf-crimson text-white rounded-lg hover:bg-wf-crimson-dark transition-colors font-medium"
        >
          <LogIn size={20} />
          Sign in to Write a Review
        </button>
      )
    }
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
        <div className="fixed inset-0 transition-opacity" onClick={() => { if (!activeMutation.isPending) { isEditMode ? onEditCancel?.() : setIsOpen(false) } }}>
          <div className="absolute inset-0 bg-black/50 dark:bg-black/70"></div>
        </div>

        {/* Modal */}
        <div 
          className="inline-block align-bottom rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-5xl sm:w-full border"
          style={{
            background: 'var(--surface-primary)',
            borderColor: modalGradient.borderColor || 'var(--surface-tertiary)'
          }}
        >
          <div
            className="h-4 w-full"
            style={{ background: modalGradient.topBarGradient }}
          />

          {/* Header */}
          <div className="bg-surface-primary px-6 pt-6 pb-4 border-b border-surface-tertiary">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-semibold text-text-primary">{isEditMode ? 'Edit Review' : 'Write a Review'}</h3>
                <p className="mt-1 text-sm text-text-secondary">{courseName}</p>
              </div>
              <button
                onClick={() => { if (!activeMutation.isPending) { isEditMode ? onEditCancel?.() : setIsOpen(false) } }}
                className="text-text-tertiary hover:text-text-primary transition-colors disabled:opacity-50"
                disabled={activeMutation.isPending}
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

            {activeMutation.isSuccess && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <span className="text-sm text-green-700 dark:text-green-300">Review submitted successfully!</span>
              </div>
            )}

            <div className="space-y-5">
              {/* Term & Instructor */}
              <div className={`${sectionCardClass} grid grid-cols-1 md:grid-cols-2 gap-4`}>
                <div>
                  <label className="block text-sm font-medium text-text-primary mb-1">
                    Term <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.term}
                    onChange={(e) => handleTermChange(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-secondary border border-surface-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-wf-crimson/20 focus:border-wf-crimson text-text-primary"
                    disabled={activeMutation.isPending}
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
                  <input
                    type="text"
                    list={instructorSuggestionsId}
                    value={formData.instructorName}
                    onChange={(e) => setFormData({ ...formData, instructorName: e.target.value })}
                    onBlur={() =>
                      setFormData(prev => ({
                        ...prev,
                        instructorName: normalizeInstructorName(prev.instructorName || '').displayName,
                      }))
                    }
                    placeholder="Professor name"
                    className="w-full px-3 py-2 bg-surface-secondary border border-surface-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-wf-crimson/20 focus:border-wf-crimson text-text-primary"
                    disabled={activeMutation.isPending}
                  />
                  <datalist id={instructorSuggestionsId}>
                    {instructorsForTerm.map(name => (
                      <option key={name} value={name} />
                    ))}
                  </datalist>
                  {termHasData ? (
                    <p className="text-xs text-text-tertiary mt-1">
                      Pick from suggestions or type a new instructor.
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                      No official data for this term yet. You can still type or pick a community-entered instructor.
                    </p>
                  )}
                </div>
              </div>

              <div className={`${sectionCardClass} grid grid-cols-1 lg:grid-cols-2 gap-5`}>
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
                        disabled={activeMutation.isPending}
                      >
                        <Icon size={18} />
                        <span className="font-medium">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Grade Received */}
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
                        disabled={activeMutation.isPending}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4-Grid Ratings with required comments */}
              <div className={sectionCardClass}>
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <h4 className="text-sm font-medium text-text-primary mb-1">Detailed Ratings <span className="text-red-500">*</span></h4>
                    <p className="text-xs text-text-tertiary">Use A / AB / B / BC / C / D / F for all four dimensions.</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-text-tertiary uppercase tracking-wide">Current Overall</div>
                    <div className="text-lg font-bold text-text-primary">
                      {overallLetter}{overallNumeric !== null ? ` (${overallNumeric.toFixed(2)})` : ''}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { key: 'contentRating', label: 'Content', comment: 'contentComment', required: true },
                    { key: 'teachingRating', label: 'Teaching', comment: 'teachingComment', required: true },
                    { key: 'gradingRating', label: 'Grading', comment: 'gradingComment', required: true },
                    { key: 'workloadRating', label: 'Workload', comment: 'workloadComment', required: true }
                  ].map(({ key, label, comment, required }) => (
                    <div key={key} className="space-y-2">
                      <div
                        className="p-4 rounded-lg border-2 transition-all"
                        style={getRatingPanelStyle(formData[key as keyof typeof formData] as string)}
                      >
                        <div className="text-xs font-medium mb-1">
                          {label} {required && <span className="text-red-500">*</span>}
                        </div>
                        <div className="text-[10px] text-text-tertiary mb-2 leading-tight">
                          {DIMENSION_DESC[label]}
                        </div>
                        <div className="flex gap-1">
                          {RATINGS.map(rating => (
                            <button
                              key={rating}
                              type="button"
                              onClick={() => setFormData({ ...formData, [key]: rating })}
                              title={RATING_HINTS[label]?.[rating] || rating}
                              className={`px-2 py-1 text-xs font-bold rounded transition-all ${getRatingButtonClass(formData[key as keyof typeof formData] === rating)}`}
                              style={formData[key as keyof typeof formData] === rating ? getSelectedRatingButtonStyle(rating) : undefined}
                              disabled={activeMutation.isPending}
                            >
                              {rating}
                            </button>
                          ))}
                        </div>
                        {formData[key as keyof typeof formData] && (
                          <div className="text-[10px] text-text-secondary mt-1 font-medium">
                            {RATING_HINTS[label]?.[formData[key as keyof typeof formData] as string]}
                          </div>
                        )}
                      </div>
                      <div className="relative">
                        <textarea
                          placeholder={COMMENT_EXAMPLES[label.toLowerCase() as keyof typeof COMMENT_EXAMPLES]}
                          value={formData[comment as keyof typeof formData] as string || ''}
                          onChange={(e) => setFormData({ ...formData, [comment]: e.target.value })}
                          maxLength={3000}
                          className="w-full px-3 py-2 text-sm bg-surface-secondary border border-surface-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-wf-crimson/20 focus:border-wf-crimson resize-y text-text-primary placeholder:text-text-tertiary/70 min-h-[120px]"
                          rows={5}
                          disabled={activeMutation.isPending}
                        />
                        <div className="text-xs text-text-tertiary mt-1 flex justify-between">
                          <span>{required ? 'Required (min 5 chars)' : 'Optional'}</span>
                          <span>{((formData[comment as keyof typeof formData] as string) || '').length}/3000</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Review Title */}
              <div className={sectionCardClass}>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Review Title (optional)
                </label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Summarize your experience"
                  className="w-full px-3 py-2 bg-surface-secondary border border-surface-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-wf-crimson/20 focus:border-wf-crimson text-text-primary"
                  disabled={activeMutation.isPending}
                />
              </div>

              {/* Assessments */}
              <div className={sectionCardClass}>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Assessments
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {ASSESSMENTS.map(assessment => (
                    <button
                      key={assessment}
                      type="button"
                      onClick={() => toggleAssessment(assessment)}
                      className={`px-3 py-2.5 text-sm rounded-xl border transition-all ${
                        formData.assessments?.includes(assessment)
                          ? 'bg-amber-50 border-red-400 text-red-700 font-semibold shadow-sm ring-1 ring-red-200'
                          : 'bg-surface-secondary border-surface-tertiary text-text-secondary hover:border-text-tertiary hover:bg-surface-tertiary/60'
                      }`}
                      disabled={activeMutation.isPending}
                    >
                      {assessment}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resource Link */}
              <div className={sectionCardClass}>
                <label className="block text-sm font-medium text-text-primary mb-1">
                  Course Resources Link (optional)
                </label>
                <input
                  type="url"
                  value={formData.resourceLink || ''}
                  onChange={(e) => setFormData({ ...formData, resourceLink: e.target.value })}
                  placeholder="Google Drive or Box link to notes/resources"
                  className="w-full px-3 py-2 bg-surface-secondary border border-surface-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-wf-crimson/20 focus:border-wf-crimson text-text-primary"
                  disabled={activeMutation.isPending}
                />
              </div>
            </div>

            {/* Anonymous Toggle */}
            <div className="mt-6 pt-4 border-t border-surface-tertiary space-y-3">
              <label className="flex items-start gap-3 cursor-pointer group">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="sr-only peer"
                    disabled={activeMutation.isPending}
                  />
                  <div className="w-9 h-5 bg-surface-tertiary rounded-full peer-checked:bg-wf-crimson transition-colors" />
                  <div className="absolute left-0.5 top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-4" />
                </div>
                <div>
                  <span className="text-sm font-medium text-text-primary">Post anonymously</span>
                  <p className="text-xs text-text-tertiary mt-0.5">Your identity will be hidden from other students</p>
                </div>
              </label>

            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-4 border-t border-surface-tertiary">
              <button
                type="button"
                onClick={() => { isEditMode ? onEditCancel?.() : setIsOpen(false) }}
                className="flex-1 px-4 py-2 bg-surface-secondary border border-surface-tertiary text-text-primary rounded-lg hover:bg-hover-bg transition-colors"
                disabled={activeMutation.isPending}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-wf-crimson text-white rounded-lg hover:bg-wf-crimson-dark transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={activeMutation.isPending}
              >
                {activeMutation.isPending ? (isEditMode ? 'Saving...' : 'Submitting...') : (isEditMode ? 'Save Changes' : 'Submit Review')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
