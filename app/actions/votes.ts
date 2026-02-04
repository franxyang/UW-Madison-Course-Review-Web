'use server'

import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function toggleVote(reviewId: string) {
  try {
    // 1. Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return {
        success: false,
        error: 'You must be signed in to vote'
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

    // 3. Check if vote already exists
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_reviewId: {
          userId: user.id,
          reviewId: reviewId
        }
      }
    })

    if (existingVote) {
      // Remove vote (unlike)
      await prisma.vote.delete({
        where: { id: existingVote.id }
      })

      // Get review to revalidate its course page
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        select: { courseId: true }
      })

      if (review) {
        revalidatePath(`/courses/${review.courseId}`)
      }

      return {
        success: true,
        action: 'removed',
        message: 'Vote removed'
      }
    } else {
      // Add vote
      await prisma.vote.create({
        data: {
          userId: user.id,
          reviewId: reviewId
        }
      })

      // Get review to revalidate its course page
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        select: { courseId: true }
      })

      if (review) {
        revalidatePath(`/courses/${review.courseId}`)
      }

      return {
        success: true,
        action: 'added',
        message: 'Vote added'
      }
    }

  } catch (error) {
    console.error('Error toggling vote:', error)
    return {
      success: false,
      error: 'Failed to update vote'
    }
  }
}

export async function getVoteStatus(reviewId: string, userEmail: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!user) return false

    const vote = await prisma.vote.findUnique({
      where: {
        userId_reviewId: {
          userId: user.id,
          reviewId: reviewId
        }
      }
    })

    return !!vote
  } catch (error) {
    console.error('Error checking vote status:', error)
    return false
  }
}
