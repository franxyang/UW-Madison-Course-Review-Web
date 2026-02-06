/**
 * Course Code Display Mapping
 * 
 * Converts stored short codes (CS) to official UW-Madison codes (COMP SCI) for display.
 * The database stores short codes for historical reasons, but we display official codes.
 */

// Short code → Official code mapping
const SHORT_TO_OFFICIAL: Record<string, string> = {
  'CS': 'COMP SCI',
  'ECE': 'E C E',
  'ME': 'M E',
  'AAE': 'A A E',
  'BME': 'B M E',
  'STAT': 'STAT',
  'MATH': 'MATH',
  'ECON': 'ECON',
  'PSYCH': 'PSYCH',
  'CHEM': 'CHEM',
  'PHYSICS': 'PHYSICS',
  'SOC': 'SOC',
  'PHIL': 'PHIL',
  'ANTHRO': 'ANTHRO',
  'ENGLISH': 'ENGLISH',
  'HISTORY': 'HISTORY',
  'ART': 'ART',
  'MUSIC': 'MUSIC',
  'BIOLOGY': 'BIOLOGY',
  'POLI SCI': 'POLI SCI',
}

// Official code → Short code mapping (for search normalization)
const OFFICIAL_TO_SHORT: Record<string, string> = {
  'COMP SCI': 'CS',
  'E C E': 'ECE',
  'M E': 'ME',
  'A A E': 'AAE',
  'B M E': 'BME',
}

/**
 * Convert stored course code to official display format.
 * e.g., "CS 514" → "COMP SCI 514"
 */
export function toOfficialCode(storedCode: string): string {
  const parts = storedCode.split(' ')
  if (parts.length < 2) return storedCode
  
  const courseNumber = parts[parts.length - 1]
  const deptCode = parts.slice(0, -1).join(' ')
  
  const officialDept = SHORT_TO_OFFICIAL[deptCode]
  if (officialDept) {
    return `${officialDept} ${courseNumber}`
  }
  
  return storedCode
}

/**
 * Convert official course code to stored format for database queries.
 * e.g., "COMP SCI 514" → "CS 514"
 */
export function toStoredCode(officialCode: string): string {
  const upper = officialCode.toUpperCase().trim()
  
  // Try to match known official prefixes
  for (const [official, short] of Object.entries(OFFICIAL_TO_SHORT)) {
    if (upper.startsWith(official + ' ')) {
      const rest = upper.slice(official.length + 1)
      return `${short} ${rest}`
    }
  }
  
  return officialCode
}

/**
 * Extract department prefix from course code.
 * e.g., "COMP SCI 514" → "COMP SCI"
 */
export function getDeptPrefix(code: string): string {
  const parts = code.split(' ')
  if (parts.length < 2) return code
  return parts.slice(0, -1).join(' ')
}

/**
 * Extract course number from course code.
 * e.g., "COMP SCI 514" → "514"
 */
export function getCourseNumber(code: string): string {
  const parts = code.split(' ')
  return parts[parts.length - 1]
}

/**
 * Get the official department code for display from a stored course code.
 * e.g., "CS 514" → "COMP SCI"
 */
export function getOfficialDeptPrefix(storedCode: string): string {
  const parts = storedCode.split(' ')
  if (parts.length < 2) return storedCode
  
  const deptCode = parts.slice(0, -1).join(' ')
  return SHORT_TO_OFFICIAL[deptCode] || deptCode
}
