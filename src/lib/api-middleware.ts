/**
 * API Middleware Helpers
 * Reusable middleware for API routes
 */

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getIpAddress, createRateLimitHeaders, RateLimits } from './rate-limit'

/**
 * Rate limiting middleware wrapper
 * Usage:
 *   export async function GET(request: NextRequest) {
 *     const rateLimitResult = await withRateLimit(request, RateLimits.STANDARD)
 *     if (!rateLimitResult.allowed) return rateLimitResult.response
 *     // ... your API logic
 *   }
 */
export function withRateLimit(
  request: NextRequest,
  config: { interval: number; maxRequests: number }
): { allowed: boolean; response?: NextResponse; headers: Record<string, string> } {
  const ip = getIpAddress(request)
  const result = checkRateLimit(ip, config)
  const headers = createRateLimitHeaders(result)

  if (!result.allowed) {
    return {
      allowed: false,
      response: NextResponse.json(
        {
          error: 'Too Many Requests',
          message: `Rate limit exceeded. Try again in ${result.retryAfter} seconds.`,
          retryAfter: result.retryAfter
        },
        {
          status: 429,
          headers
        }
      ),
      headers
    }
  }

  return {
    allowed: true,
    headers
  }
}

/**
 * CORS middleware
 */
export function withCORS<T>(response: NextResponse<T>): NextResponse<T> {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

/**
 * Add security headers
 */
export function withSecurityHeaders<T>(response: NextResponse<T>): NextResponse<T> {
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  return response
}

/**
 * Combine multiple responses (for adding headers)
 */
export function addHeaders<T>(response: NextResponse<T>, headers: Record<string, string>): NextResponse<T> {
  for (const [key, value] of Object.entries(headers)) {
    response.headers.set(key, value)
  }
  return response
}
