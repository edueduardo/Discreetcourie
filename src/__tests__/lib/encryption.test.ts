/**
 * Tests for encryption utilities
 */

import { encryptString, decryptString, isEncryptionConfigured, hashSensitiveData, generateSecureToken } from '@/lib/encryption'

describe('Encryption Utilities', () => {
  const testKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'
  
  beforeAll(() => {
    process.env.ENCRYPTION_KEY = testKey
  })

  describe('isEncryptionConfigured', () => {
    it('should return true when ENCRYPTION_KEY is set', () => {
      expect(isEncryptionConfigured()).toBe(true)
    })

    it('should return false when ENCRYPTION_KEY is not set', () => {
      const originalKey = process.env.ENCRYPTION_KEY
      delete process.env.ENCRYPTION_KEY
      expect(isEncryptionConfigured()).toBe(false)
      process.env.ENCRYPTION_KEY = originalKey
    })
  })

  describe('encryptString and decryptString', () => {
    it('should encrypt and decrypt a simple string', () => {
      const plaintext = 'Hello, World!'
      const encrypted = encryptString(plaintext)
      
      expect(encrypted).not.toBe(plaintext)
      expect(encrypted).toContain(':') // IV:ciphertext:tag format
      
      const decrypted = decryptString(encrypted)
      expect(decrypted).toBe(plaintext)
    })

    it('should encrypt and decrypt unicode characters', () => {
      const plaintext = 'Olá, Mundo! 🌍 日本語'
      const encrypted = encryptString(plaintext)
      const decrypted = decryptString(encrypted)
      
      expect(decrypted).toBe(plaintext)
    })

    it('should produce different ciphertext for same plaintext (random IV)', () => {
      const plaintext = 'Same message'
      const encrypted1 = encryptString(plaintext)
      const encrypted2 = encryptString(plaintext)
      
      expect(encrypted1).not.toBe(encrypted2)
    })

    it('should handle empty strings', () => {
      const plaintext = ''
      const encrypted = encryptString(plaintext)
      const decrypted = decryptString(encrypted)
      
      expect(decrypted).toBe(plaintext)
    })
  })

  describe('hashSensitiveData', () => {
    it('should produce consistent hash for same input', () => {
      const data = 'sensitive-data-123'
      const hash1 = hashSensitiveData(data)
      const hash2 = hashSensitiveData(data)
      
      expect(hash1).toBe(hash2)
    })

    it('should produce different hash for different input', () => {
      const hash1 = hashSensitiveData('data1')
      const hash2 = hashSensitiveData('data2')
      
      expect(hash1).not.toBe(hash2)
    })

    it('should produce 64-character hex string', () => {
      const hash = hashSensitiveData('test')
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  describe('generateSecureToken', () => {
    it('should generate token of specified length', () => {
      const token16 = generateSecureToken(16)
      const token32 = generateSecureToken(32)
      
      expect(token16).toHaveLength(32) // hex is 2x bytes
      expect(token32).toHaveLength(64)
    })

    it('should generate unique tokens', () => {
      const token1 = generateSecureToken()
      const token2 = generateSecureToken()
      
      expect(token1).not.toBe(token2)
    })
  })
})
