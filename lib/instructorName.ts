export type NormalizedInstructorName = {
  raw: string
  displayName: string
  key: string
}

// Normalize instructor names for matching and storage consistency.
// - Unicode NFKC: normalize full-width/half-width variants
// - collapse whitespace and trim
// - uppercase to match current instructor display convention
export function normalizeInstructorName(input: string): NormalizedInstructorName {
  const raw = input ?? ''
  const normalizedUnicode = raw.normalize('NFKC')
  const collapsedWhitespace = normalizedUnicode.replace(/\s+/g, ' ').trim()
  const displayName = collapsedWhitespace.toLocaleUpperCase('en-US')

  return {
    raw,
    displayName,
    key: displayName,
  }
}

export function normalizeInstructorNameKey(input: string): string {
  return normalizeInstructorName(input).key
}
