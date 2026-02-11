import { notFound, redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { CoursePageClient } from './CoursePageClient'

type CoursePageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function CoursePage({ params }: CoursePageProps) {
  const resolvedParams = await params
  const requestedCourse = await prisma.course.findUnique({
    where: { id: resolvedParams.id },
    select: { id: true, code: true },
  })

  if (!requestedCourse) {
    notFound()
  }

  const alias = await prisma.courseCodeAlias.findUnique({
    where: { sourceCode: requestedCourse.code },
    select: { canonicalCourseId: true },
  })

  if (alias?.canonicalCourseId && alias.canonicalCourseId !== requestedCourse.id) {
    redirect(`/courses/${alias.canonicalCourseId}`)
  }

  return <CoursePageClient id={requestedCourse.id} />
}
