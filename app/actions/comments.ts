'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function addComment(reviewId: string, text: string) {
  try {
    // 1. Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return {
        success: false,
        error: 'You must be signed in to comment'
      }
    }

    // 2. Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return {
        success: false,
        error: 'User account not found'
      }
    }

    // 3. Validate text
    if (!text || text.trim().length === 0) {
      return {
        success: false,
        error: 'Comment text cannot be empty'
      }
    }

    if (text.length > 3000) {
      return {
        success: false,
        error: 'Comment is too long (max 3000 characters)'
      }
    }

    // 4. Create comment
    const comment = await prisma.comment.create({
      data: {
        reviewId,
        authorId: user.id,
        text: text.trim()
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    // 5. Revalidate the course page
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { courseId: true }
    })

    if (review) {
      revalidatePath(`/courses/${review.courseId}`)
    }

    return {
      success: true,
      comment,
      message: 'Comment added successfully'
    }

  } catch (error) {
    console.error('Error adding comment:', error)
    return {
      success: false,
      error: 'Failed to add comment'
    }
  }
}

export async function deleteComment(commentId: string) {
  try {
    // 1. Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return {
        success: false,
        error: 'You must be signed in to delete comments'
      }
    }

    // 2. Get user from database
    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return {
        success: false,
        error: 'User account not found'
      }
    }

    // 3. Check if comment exists and belongs to user
    const comment = await prisma.comment.findUnique({
      where: { id: commentId }
    })

    if (!comment) {
      return {
        success: false,
        error: 'Comment not found'
      }
    }

    if (comment.authorId !== user.id) {
      return {
        success: false,
        error: 'You can only delete your own comments'
      }
    }

    // 4. Delete comment
    await prisma.comment.delete({
      where: { id: commentId }
    })

    // 5. Revalidate the course page
    const review = await prisma.review.findUnique({
      where: { id: comment.reviewId },
      select: { courseId: true }
    })

    if (review) {
      revalidatePath(`/courses/${review.courseId}`)
    }

    return {
      success: true,
      message: 'Comment deleted successfully'
    }

  } catch (error) {
    console.error('Error deleting comment:', error)
    return {
      success: false,
      error: 'Failed to delete comment'
    }
  }
}
