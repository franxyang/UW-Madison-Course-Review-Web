export type CanonicalCourseLevel = 'Elementary' | 'Intermediate' | 'Advanced'

export function inferCourseLevelFromNumber(courseNumber: number): CanonicalCourseLevel {
  if (courseNumber < 300) return 'Elementary'
  if (courseNumber < 500) return 'Intermediate'
  return 'Advanced'
}

export function extractCourseNumber(code: string): number | null {
  const match = code.trim().match(/(\d{2,4})(?:[A-Z])?$/i)
  if (!match) return null

  const parsed = Number.parseInt(match[1], 10)
  if (Number.isNaN(parsed)) return null
  return parsed
}

export function inferCourseLevelFromCode(code: string): CanonicalCourseLevel | null {
  const courseNumber = extractCourseNumber(code)
  if (courseNumber == null) return null
  return inferCourseLevelFromNumber(courseNumber)
}

export function isCanonicalCourseLevel(level: string): level is CanonicalCourseLevel {
  return level === 'Elementary' || level === 'Intermediate' || level === 'Advanced'
}
