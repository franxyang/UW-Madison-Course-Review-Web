export type LetterGrade = 'A' | 'AB' | 'B' | 'BC' | 'C' | 'D' | 'F'

export function gpaToLetterGrade(gpa: number): LetterGrade {
  if (gpa >= 3.75) return 'A'
  if (gpa >= 3.25) return 'AB'
  if (gpa >= 2.75) return 'B'
  if (gpa >= 2.25) return 'BC'
  if (gpa >= 1.5) return 'C'
  if (gpa >= 0.5) return 'D'
  return 'F'
}

export function formatGpaWithLetter(gpa: number, decimals = 2): string {
  return `${gpa.toFixed(decimals)} (${gpaToLetterGrade(gpa)})`
}
