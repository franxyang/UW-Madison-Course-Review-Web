'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export type ReviewFormData = {
  courseId: string
  term: string
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
}

export async function submitReview(data: ReviewFormData) {
  try {
    // For now, we'll use a dummy user ID since auth isn't set up yet
    // This will be replaced with the actual user ID from the session
    const userId = 'temp-user-id'

    // Find or create instructor
    let instructor = await prisma.instructor.findFirst({
      where: { name: data.instructorName }
    })

    if (!instructor) {
      instructor = await prisma.instructor.create({
        data: { name: data.instructorName }
      })
    }

    // Create the review
    const review = await prisma.review.create({
      data: {
        courseId: data.courseId,
        term: data.term,
        title: data.title,
        gradeReceived: data.gradeReceived,
        contentRating: data.contentRating,
        teachingRating: data.teachingRating,
        gradingRating: data.gradingRating,
        workloadRating: data.workloadRating,
        contentComment: data.contentComment,
        teachingComment: data.teachingComment,
        gradingComment: data.gradingComment,
        workloadComment: data.workloadComment,
        assessments: data.assessments,
        resourceLink: data.resourceLink,
        instructorId: instructor.id,
        authorId: userId
      }
    })

    // Revalidate the course page to show the new review
    revalidatePath(`/courses/${data.courseId}`)

    return { success: true, reviewId: review.id }
  } catch (error) {
    console.error('Error submitting review:', error)
    return { success: false, error: 'Failed to submit review' }
  }
}