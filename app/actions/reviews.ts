'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Type export for the form
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
  tags?: string[]
  resourceLink?: string
  instructorName: string
}

// Validation schema
const reviewSchema = z.object({
  courseId: z.string().min(1, 'Course ID is required'),
  instructorName: z.string().min(1, 'Instructor name is required'),
  term: z.string().min(1, 'Term is required'),
  gradeReceived: z.enum(['A', 'AB', 'B', 'BC', 'C', 'D', 'F']),
  
  // 4-Dimensional Ratings
  contentRating: z.enum(['A', 'AB', 'B', 'BC', 'C', 'D', 'F']),
  teachingRating: z.enum(['A', 'AB', 'B', 'BC', 'C', 'D', 'F']),
  gradingRating: z.enum(['A', 'AB', 'B', 'BC', 'C', 'D', 'F']),
  workloadRating: z.enum(['A', 'AB', 'B', 'BC', 'C', 'D', 'F']),
  
  // Comments (optional)
  contentComment: z.string().optional(),
  teachingComment: z.string().optional(),
  gradingComment: z.string().optional(),
  workloadComment: z.string().optional(),
  
  // Metadata
  assessments: z.array(z.string()).default([]),
  tags: z.array(z.string()).optional().default([]),
  resourceLink: z.string().url().optional().or(z.literal('')),
  title: z.string().optional(),
})

export async function submitReview(data: ReviewFormData) {
  try {
    // 1. Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return {
        success: false,
        error: 'You must be signed in to submit a review'
      }
    }

    // 2. Verify @wisc.edu email
    if (!session.user.email.endsWith('@wisc.edu')) {
      return {
        success: false,
        error: 'Only @wisc.edu email addresses are allowed'
      }
    }

    // 3. Validate input
    const validatedData = reviewSchema.parse(data)

    // 4. Find or create instructor
    let instructor = await prisma.instructor.findUnique({
      where: { name: validatedData.instructorName }
    })

    if (!instructor) {
      instructor = await prisma.instructor.create({
        data: {
          name: validatedData.instructorName,
          aliases: []
        }
      })
    }

    // 5. Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return {
        success: false,
        error: 'User account not found. Please sign up first.'
      }
    }

    // 6. Check if user already reviewed this course with this instructor
    const existingReview = await prisma.review.findFirst({
      where: {
        authorId: user.id,
        courseId: validatedData.courseId,
        instructorId: instructor.id
      }
    })

    if (existingReview) {
      return {
        success: false,
        error: 'You have already reviewed this course with this instructor'
      }
    }

    // 7. Create review
    const review = await prisma.review.create({
      data: {
        courseId: validatedData.courseId,
        instructorId: instructor.id,
        authorId: user.id,
        term: validatedData.term,
        title: validatedData.title || null,
        gradeReceived: validatedData.gradeReceived as any,
        
        // Ratings
        contentRating: validatedData.contentRating,
        teachingRating: validatedData.teachingRating,
        gradingRating: validatedData.gradingRating,
        workloadRating: validatedData.workloadRating,
        
        // Comments
        contentComment: validatedData.contentComment || null,
        teachingComment: validatedData.teachingComment || null,
        gradingComment: validatedData.gradingComment || null,
        workloadComment: validatedData.workloadComment || null,
        
        // Metadata
        assessments: validatedData.assessments,
        tags: validatedData.tags || [],
        resourceLink: validatedData.resourceLink || null,
      },
      include: {
        author: true,
        instructor: true,
        course: true
      }
    })

    // 8. Revalidate course page to show new review
    revalidatePath(`/courses/${validatedData.courseId}`)

    return {
      success: true,
      reviewId: review.id,
      message: 'Review submitted successfully!'
    }

  } catch (error) {
    console.error('Error submitting review:', error)
    
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: 'Invalid form data: ' + error.errors[0].message
      }
    }

    return {
      success: false,
      error: 'Failed to submit review. Please try again.'
    }
  }
}
