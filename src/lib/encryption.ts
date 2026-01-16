import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const SALT_LENGTH = 32
const TAG_LENGTH = 16
const KEY_LENGTH = 32

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || process.env.VAULT_ENCRYPTION_KEY

function deriveKey(password: string, salt: Buffer): Buffer {
  return scryptSync(password, salt, KEY_LENGTH)
}

export interface EncryptedData {
  encrypted: string
  iv: string
  salt: string
  tag: string
  algorithm: string
}

export function encrypt(plaintext: string, customKey?: string): EncryptedData {
  const keyToUse = customKey || ENCRYPTION_KEY
  
  if (!keyToUse) {
    throw new Error('Encryption key not configured. Set ENCRYPTION_KEY environment variable.')
  }

  const salt = randomBytes(SALT_LENGTH)
  const iv = randomBytes(IV_LENGTH)
  const key = deriveKey(keyToUse, salt)

  const cipher = createCipheriv(ALGORITHM, key, iv)
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  
  const tag = cipher.getAuthTag()

  return {
    encrypted,
    iv: iv.toString('hex'),
    salt: salt.toString('hex'),
    tag: tag.toString('hex'),
    algorithm: ALGORITHM
  }
}

export function decrypt(encryptedData: EncryptedData, customKey?: string): string {
  const keyToUse = customKey || ENCRYPTION_KEY
  
  if (!keyToUse) {
    throw new Error('Encryption key not configured. Set ENCRYPTION_KEY environment variable.')
  }

  const salt = Buffer.from(encryptedData.salt, 'hex')
  const iv = Buffer.from(encryptedData.iv, 'hex')
  const tag = Buffer.from(encryptedData.tag, 'hex')
  const key = deriveKey(keyToUse, salt)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

export function encryptJSON(data: object, customKey?: string): EncryptedData {
  return encrypt(JSON.stringify(data), customKey)
}

export function decryptJSON<T = any>(encryptedData: EncryptedData, customKey?: string): T {
  const decrypted = decrypt(encryptedData, customKey)
  return JSON.parse(decrypted) as T
}

export function encryptForStorage(plaintext: string, customKey?: string): string {
  const encrypted = encrypt(plaintext, customKey)
  return Buffer.from(JSON.stringify(encrypted)).toString('base64')
}

export function decryptFromStorage(storedData: string, customKey?: string): string {
  const encryptedData: EncryptedData = JSON.parse(Buffer.from(storedData, 'base64').toString('utf8'))
  return decrypt(encryptedData, customKey)
}

export function hashSensitiveData(data: string): string {
  const salt = randomBytes(16)
  const hash = scryptSync(data, salt, 64)
  return `${salt.toString('hex')}:${hash.toString('hex')}`
}

export function verifySensitiveData(data: string, storedHash: string): boolean {
  const [saltHex, hashHex] = storedHash.split(':')
  const salt = Buffer.from(saltHex, 'hex')
  const storedHashBuffer = Buffer.from(hashHex, 'hex')
  const hash = scryptSync(data, salt, 64)
  return hash.equals(storedHashBuffer)
}

export function generateSecureToken(length: number = 32): string {
  return randomBytes(length).toString('hex')
}

export function isEncryptionConfigured(): boolean {
  return !!ENCRYPTION_KEY
}
