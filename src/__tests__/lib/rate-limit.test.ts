/**
 * Tests for rate limiting utilities
 */

import { checkRateLimit } from '@/lib/rate-limit'

describe('Rate Limiting', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  describe('checkRateLimit', () => {
    it('should allow requests under the limit', () => {
      const config = { interval: 60000, maxRequests: 5 }
      const identifier = 'test-user-1'

      for (let i = 0; i < 5; i++) {
        const result = checkRateLimit(identifier, config)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(4 - i)
      }
    })

    it('should block requests over the limit', () => {
      const config = { interval: 60000, maxRequests: 3 }
      const identifier = 'test-user-2'

      // Use up the limit
      for (let i = 0; i < 3; i++) {
        checkRateLimit(identifier, config)
      }

      // Next request should be blocked
      const result = checkRateLimit(identifier, config)
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
    })

    it('should reset after interval expires', () => {
      const config = { interval: 60000, maxRequests: 2 }
      const identifier = 'test-user-3'

      // Use up the limit
      checkRateLimit(identifier, config)
      checkRateLimit(identifier, config)
      
      let result = checkRateLimit(identifier, config)
      expect(result.allowed).toBe(false)

      // Advance time past the interval
      jest.advanceTimersByTime(61000)

      // Should be allowed again
      result = checkRateLimit(identifier, config)
      expect(result.allowed).toBe(true)
    })

    it('should track different identifiers separately', () => {
      const config = { interval: 60000, maxRequests: 1 }

      const result1 = checkRateLimit('user-a', config)
      const result2 = checkRateLimit('user-b', config)

      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)

      // Both should now be blocked
      expect(checkRateLimit('user-a', config).allowed).toBe(false)
      expect(checkRateLimit('user-b', config).allowed).toBe(false)
    })
  })
})
