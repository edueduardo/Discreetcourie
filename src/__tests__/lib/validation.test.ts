/**
 * Tests for input validation utilities
 */

import { sanitizeString, sanitizeHTML, sanitizePhone } from '@/lib/validation'

describe('Validation Utilities', () => {
  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello')
    })

    it('should remove null bytes', () => {
      expect(sanitizeString('hello\x00world')).toBe('helloworld')
    })

    it('should limit length', () => {
      const longString = 'a'.repeat(1000)
      const result = sanitizeString(longString, 100)
      expect(result).toHaveLength(100)
    })

    it('should handle empty strings', () => {
      expect(sanitizeString('')).toBe('')
      expect(sanitizeString('   ')).toBe('')
    })
  })

  describe('sanitizeHTML', () => {
    it('should escape HTML tags', () => {
      const input = '<script>alert("xss")</script>'
      const result = sanitizeHTML(input)
      expect(result).not.toContain('<script>')
      expect(result).toContain('&lt;script&gt;')
    })

    it('should escape angle brackets', () => {
      const input = '5 > 3 and 2 < 4'
      const result = sanitizeHTML(input)
      expect(result).toContain('&gt;')
      expect(result).toContain('&lt;')
    })

    it('should escape quotes', () => {
      const input = 'He said "hello" and \'goodbye\''
      const result = sanitizeHTML(input)
      expect(result).toContain('&quot;')
      expect(result).toContain('&#x27;')
    })

    it('should escape forward slashes', () => {
      const input = 'path/to/file'
      const result = sanitizeHTML(input)
      expect(result).toContain('&#x2F;')
    })

    it('should handle normal text with letters and numbers', () => {
      const input = 'Hello World 123'
      expect(sanitizeHTML(input)).toBe('Hello World 123')
    })
  })

  describe('sanitizePhone', () => {
    it('should keep only digits and plus sign', () => {
      expect(sanitizePhone('+1 (555) 123-4567')).toBe('+15551234567')
    })

    it('should handle international formats', () => {
      expect(sanitizePhone('+55 11 98765-4321')).toBe('+5511987654321')
    })

    it('should handle numbers without country code', () => {
      expect(sanitizePhone('555-123-4567')).toBe('5551234567')
    })

    it('should return empty for invalid input', () => {
      expect(sanitizePhone('abc')).toBe('')
      expect(sanitizePhone('')).toBe('')
    })
  })
})
