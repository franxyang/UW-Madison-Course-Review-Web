import { Redis } from '@upstash/redis'

// Redis client - only initialized if UPSTASH_REDIS_REST_URL is configured
let redis: Redis | null = null

function getRedis(): Redis | null {
  if (redis) return redis
  
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    return null // Redis not configured - graceful degradation
  }

  redis = new Redis({ url, token })
  return redis
}

// Default TTL values (in seconds)
const TTL = {
  SCHOOLS: 60 * 60 * 24,       // 24 hours - rarely changes
  DEPARTMENTS: 60 * 60 * 24,   // 24 hours
  COURSE_LIST: 60 * 5,          // 5 minutes
  COURSE_DETAIL: 60 * 2,        // 2 minutes - includes reviews
  SEARCH: 60 * 10,              // 10 minutes
} as const

/**
 * Generic cache wrapper
 * - Tries to get from Redis first
 * - Falls back to fetcher function if cache miss
 * - Stores result in Redis with TTL
 * - If Redis is not configured, always calls fetcher
 */
export async function cached<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  const client = getRedis()
  
  if (!client) {
    // No Redis configured - just call fetcher
    return fetcher()
  }

  try {
    // Try cache first
    const cachedData = await client.get<T>(key)
    if (cachedData !== null && cachedData !== undefined) {
      return cachedData
    }
  } catch (error) {
    console.warn('[Redis] Cache read failed:', error)
    // Continue to fetcher on error
  }

  // Cache miss - fetch fresh data
  const data = await fetcher()

  try {
    // Store in cache
    await client.set(key, data, { ex: ttlSeconds })
  } catch (error) {
    console.warn('[Redis] Cache write failed:', error)
    // Don't fail the request if cache write fails
  }

  return data
}

/**
 * Invalidate cache entries matching a pattern
 */
export async function invalidateCache(pattern: string): Promise<void> {
  const client = getRedis()
  if (!client) return

  try {
    // Upstash Redis supports SCAN for pattern matching
    let cursor: number = 0
    do {
      const [nextCursor, keys] = await client.scan(cursor, { match: pattern, count: 100 })
      cursor = typeof nextCursor === 'string' ? parseInt(nextCursor, 10) : nextCursor
      if (keys.length > 0) {
        await Promise.all(keys.map(key => client.del(key)))
      }
    } while (cursor !== 0)
  } catch (error) {
    console.warn('[Redis] Cache invalidation failed:', error)
  }
}

/**
 * Delete specific cache key
 */
export async function deleteCache(key: string): Promise<void> {
  const client = getRedis()
  if (!client) return

  try {
    await client.del(key)
  } catch (error) {
    console.warn('[Redis] Cache delete failed:', error)
  }
}

// Cache key builders
export const cacheKeys = {
  schools: () => 'madspace:schools',
  departments: (schoolId?: string) => 
    schoolId ? `madspace:departments:${schoolId}` : 'madspace:departments:all',
  courseList: (params: Record<string, any>) => 
    `madspace:courses:${JSON.stringify(params)}`,
  courseDetail: (id: string) => `madspace:course:${id}`,
  search: (query: string) => `madspace:search:${query.toLowerCase()}`,
}

export { TTL, getRedis }
