const DEFAULT_BASE_URL = 'https://api.madgrades.com/v1'
const DEFAULT_PAGE_SIZE = 100
const RETRYABLE_STATUS = new Set([403, 408, 409, 425, 429, 500, 502, 503, 504])

class NonRetryableMadgradesError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NonRetryableMadgradesError'
  }
}

export type MadgradesSubject = {
  code: string
  name: string
  abbreviation: string
}

export type MadgradesCourse = {
  uuid: string
  number: number
  name: string | null
  names?: string[]
  subjects: MadgradesSubject[]
  url: string
}

type MadgradesPagedResponse<T> = {
  currentPage: number
  totalPages: number
  totalCount: number
  nextPageUrl: string | null
  results: T[]
}

export type MadgradesInstructor = {
  id: number
  name: string
}

export type MadgradesOfferingSection = {
  sectionNumber: number
  instructors?: MadgradesInstructor[]
  total?: number
  aCount?: number
  abCount?: number
  bCount?: number
  bcCount?: number
  cCount?: number
  dCount?: number
  fCount?: number
}

export type MadgradesCourseOfferingGrades = {
  termCode: number
  sections?: MadgradesOfferingSection[]
}

export type MadgradesCourseGrades = {
  courseUuid: string
  cumulative?: {
    total?: number
    aCount?: number
    abCount?: number
    bCount?: number
    bcCount?: number
    cCount?: number
    dCount?: number
    fCount?: number
  }
  courseOfferings?: MadgradesCourseOfferingGrades[]
}

export type MadgradesClientOptions = {
  apiKey?: string
  baseUrl?: string
  pageSize?: number
  maxRetries?: number
  requestTimeoutMs?: number
  retryBaseDelayMs?: number
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function getApiKey(explicit?: string): string {
  const key = explicit ?? process.env.MADGRADES_API_KEY
  if (!key || key.trim().length === 0) {
    throw new Error('MADGRADES_API_KEY is required. Set it in env or pass apiKey option.')
  }
  return key.trim()
}

function normalizeBaseUrl(baseUrl?: string): string {
  const url = (baseUrl ?? DEFAULT_BASE_URL).trim()
  return url.endsWith('/') ? url.slice(0, -1) : url
}

function shouldRetry(status: number): boolean {
  return RETRYABLE_STATUS.has(status)
}

export function toMadgradesCourseCode(subjectAbbr: string, courseNumber: number): string {
  return `${subjectAbbr.trim()} ${courseNumber}`
}

// Correct mapping verified with Madgrades terms endpoint:
// 1252 -> 2024-Fall, 1254 -> 2025-Spring, 1244 -> 2024-Spring
export function termCodeToString(termCode: number): string {
  const baseYear = Math.floor(termCode / 10) + 1900
  const semesterDigit = termCode % 10

  if (semesterDigit === 2) return `${baseYear - 1}-Fall`
  if (semesterDigit === 4) return `${baseYear}-Spring`
  if (semesterDigit === 6) return `${baseYear}-Summer`
  return `${baseYear}-Unknown`
}

export function createMadgradesClient(options: MadgradesClientOptions = {}) {
  const apiKey = getApiKey(options.apiKey)
  const baseUrl = normalizeBaseUrl(options.baseUrl)
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE
  const maxRetries = options.maxRetries ?? 5
  const requestTimeoutMs = options.requestTimeoutMs ?? 20_000
  const retryBaseDelayMs = options.retryBaseDelayMs ?? 600

  async function requestJson<T>(path: string, params?: Record<string, string | number | boolean>): Promise<T> {
    const url = new URL(`${baseUrl}${path.startsWith('/') ? path : `/${path}`}`)
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.set(key, String(value))
      }
    }

    let delay = retryBaseDelayMs
    let lastError: unknown = null

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(requestTimeoutMs),
        })

        if (response.ok) {
          return (await response.json()) as T
        }

        const body = await response.text()
        const error = new Error(`Madgrades API ${response.status} ${response.statusText}: ${body.slice(0, 280)}`)

        if (!shouldRetry(response.status) || attempt === maxRetries) {
          if (!shouldRetry(response.status)) {
            throw new NonRetryableMadgradesError(error.message)
          }
          throw error
        }

        lastError = error
      } catch (error) {
        if (error instanceof NonRetryableMadgradesError) {
          throw error
        }
        if (attempt === maxRetries) {
          throw error
        }
        lastError = error
      }

      await sleep(delay)
      delay = Math.min(delay * 2, 8_000)
    }

    throw lastError ?? new Error(`Madgrades API request failed for ${url.toString()}`)
  }

  async function fetchCoursesPage(page: number): Promise<MadgradesPagedResponse<MadgradesCourse>> {
    return requestJson<MadgradesPagedResponse<MadgradesCourse>>('/courses', {
      page,
      per_page: pageSize,
    })
  }

  async function fetchAllCourses(
    onPage?: (ctx: { page: number; totalPages: number; pageResults: number }) => void,
  ): Promise<MadgradesCourse[]> {
    const all: MadgradesCourse[] = []
    let page = 1
    let totalPages = 1

    while (page <= totalPages) {
      const data = await fetchCoursesPage(page)
      totalPages = data.totalPages || 1
      all.push(...(data.results ?? []))

      onPage?.({
        page,
        totalPages,
        pageResults: data.results?.length ?? 0,
      })

      page += 1
    }

    return all
  }

  async function fetchCourseGrades(courseUuid: string): Promise<MadgradesCourseGrades> {
    return requestJson<MadgradesCourseGrades>(`/courses/${courseUuid}/grades`)
  }

  return {
    pageSize,
    fetchCoursesPage,
    fetchAllCourses,
    fetchCourseGrades,
  }
}
