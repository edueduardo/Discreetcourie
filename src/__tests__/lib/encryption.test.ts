/**
 * Tests for encryption utilities
 */

import { encrypt, decrypt, isEncryptionConfigured, hashSensitiveData, verifySensitiveData, generateSecureToken, encryptForStorage, decryptFromStorage } from '@/lib/encryption'

describe('Encryption Utilities', () => {
  const testKey = 'test-encryption-key-for-unit-tests'

  describe('encrypt and decrypt', () => {
    it('should encrypt and decrypt a simple string', () => {
      const plaintext = 'Hello, World!'
      const encrypted = encrypt(plaintext, testKey)
      
      expect(encrypted.encrypted).not.toBe(plaintext)
      expect(encrypted.iv).toBeDefined()
      expect(encrypted.salt).toBeDefined()
      expect(encrypted.tag).toBeDefined()
      expect(encrypted.algorithm).toBe('aes-256-gcm')
      
      const decrypted = decrypt(encrypted, testKey)
      expect(decrypted).toBe(plaintext)
    })

    it('should encrypt and decrypt unicode characters', () => {
      const plaintext = 'Olá, Mundo! 🌍 日本語'
      const encrypted = encrypt(plaintext, testKey)
      const decrypted = decrypt(encrypted, testKey)
      
      expect(decrypted).toBe(plaintext)
    })

    it('should produce different ciphertext for same plaintext (random salt/IV)', () => {
      const plaintext = 'Same message'
      const encrypted1 = encrypt(plaintext, testKey)
      const encrypted2 = encrypt(plaintext, testKey)
      
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted)
      expect(encrypted1.iv).not.toBe(encrypted2.iv)
      expect(encrypted1.salt).not.toBe(encrypted2.salt)
    })

    it('should handle empty strings', () => {
      const plaintext = ''
      const encrypted = encrypt(plaintext, testKey)
      const decrypted = decrypt(encrypted, testKey)
      
      expect(decrypted).toBe(plaintext)
    })
  })

  describe('encryptForStorage and decryptFromStorage', () => {
    it('should encrypt to base64 and decrypt back', () => {
      const plaintext = 'Secret data for storage'
      const stored = encryptForStorage(plaintext, testKey)
      
      expect(typeof stored).toBe('string')
      expect(stored).not.toBe(plaintext)
      
      const decrypted = decryptFromStorage(stored, testKey)
      expect(decrypted).toBe(plaintext)
    })
  })

  describe('hashSensitiveData and verifySensitiveData', () => {
    it('should hash data with random salt', () => {
      const data = 'sensitive-data-123'
      const hash1 = hashSensitiveData(data)
      const hash2 = hashSensitiveData(data)
      
      // Hashes should be different due to random salt
      expect(hash1).not.toBe(hash2)
      // But format should be salt:hash
      expect(hash1).toContain(':')
      expect(hash2).toContain(':')
    })

    it('should verify correct data against hash', () => {
      const data = 'my-secret-password'
      const hash = hashSensitiveData(data)
      
      expect(verifySensitiveData(data, hash)).toBe(true)
      expect(verifySensitiveData('wrong-password', hash)).toBe(false)
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

  describe('isEncryptionConfigured', () => {
    it('should check if encryption key is set', () => {
      // This will depend on environment - just verify function works
      const result = isEncryptionConfigured()
      expect(typeof result).toBe('boolean')
    })
  })
})
