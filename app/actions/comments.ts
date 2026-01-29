'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { auth } from '@/auth'

export async function addComment(reviewId: string, text: string) {
  try {
    const session = await auth()

    // For now, use temp user if no session
    const userId = session?.user?.id || 'temp-user-id'

    const comment = await prisma.comment.create({
      data: {
        text,
        reviewId,
        authorId: userId
      },
      include: {
        author: true
      }
    })

    // Get course ID to revalidate the correct page
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { courseId: true }
    })

    if (review) {
      revalidatePath(`/courses/${review.courseId}`)
    }

    return { success: true, comment }
  } catch (error) {
    console.error('Error adding comment:', error)
    return { success: false, error: 'Failed to add comment' }
  }
}

export async function deleteComment(commentId: string) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return { success: false, error: 'Unauthorized' }
    }

    // Check if user owns the comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        review: {
          select: { courseId: true }
        }
      }
    })

    if (!comment || comment.authorId !== session.user.id) {
      return { success: false, error: 'Unauthorized' }
    }

    await prisma.comment.delete({
      where: { id: commentId }
    })

    // Revalidate the course page
    if (comment.review.courseId) {
      revalidatePath(`/courses/${comment.review.courseId}`)
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting comment:', error)
    return { success: false, error: 'Failed to delete comment' }
  }
}