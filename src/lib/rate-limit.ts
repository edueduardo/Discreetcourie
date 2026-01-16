/**
 * Rate Limiting Utility
 * Protects APIs from abuse and DDoS attacks
 *
 * Strategy: Sliding Window with IP-based tracking
 * Storage: In-memory Map (use Redis for production)
 */

interface RateLimitConfig {
  interval: number // Time window in milliseconds
  maxRequests: number // Max requests per window
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (use Redis in production for distributed systems)
const store = new Map<string, RateLimitEntry>()

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  const keysToDelete: string[] = []

  store.forEach((entry, key) => {
    if (entry.resetTime < now) {
      keysToDelete.push(key)
    }
  })

  keysToDelete.forEach(key => store.delete(key))
}, 5 * 60 * 1000)

/**
 * Check if request is rate limited
 * @param identifier - Unique identifier (IP address, user ID, etc.)
 * @param config - Rate limit configuration
 * @returns { allowed: boolean, remaining: number, resetTime: number }
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetTime: number; retryAfter?: number } {
  const now = Date.now()
  const entry = store.get(identifier)

  // No entry or expired window - create new entry
  if (!entry || entry.resetTime < now) {
    const resetTime = now + config.interval
    store.set(identifier, {
      count: 1,
      resetTime
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime
    }
  }

  // Within window - check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
      retryAfter: Math.ceil((entry.resetTime - now) / 1000) // seconds
    }
  }

  // Increment counter
  entry.count++
  store.set(identifier, entry)

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.resetTime
  }
}

/**
 * Predefined rate limit configurations
 */
export const RateLimits = {
  // Strict - for sensitive operations (login, password reset)
  STRICT: {
    interval: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5
  },

  // Standard - for authenticated API calls
  STANDARD: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 60
  },

  // Relaxed - for public endpoints
  RELAXED: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 100
  },

  // Write operations - CREATE/UPDATE/DELETE
  WRITE: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 30
  },

  // Read operations - GET
  READ: {
    interval: 60 * 1000, // 1 minute
    maxRequests: 120
  }
}

/**
 * Get IP address from request
 */
export function getIpAddress(request: Request): string {
  // Try to get real IP from headers (proxy/load balancer)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback to a default (should not happen in production)
  return 'unknown'
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: {
  remaining: number
  resetTime: number
  retryAfter?: number
}): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetTime.toString()
  }

  if (result.retryAfter !== undefined) {
    headers['Retry-After'] = result.retryAfter.toString()
  }

  return headers
}
