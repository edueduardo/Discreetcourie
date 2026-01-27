/**
 * Human Vault™ - Enterprise-grade E2E Encryption
 * AES-256-GCM with zero-knowledge architecture
 * NO ONE can access vault contents except the owner
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 32

interface EncryptedData {
  ciphertext: string
  iv: string
  authTag: string
  salt: string
}

interface VaultMetadata {
  vaultId: string
  ownerId: string
  createdAt: string
  expiresAt?: string
  accessCount: number
  lastAccessedAt?: string
  autoDestructEnabled: boolean
  autoDestructDays?: number
  deadManSwitchEnabled: boolean
  deadManSwitchDays?: number
  biometricRequired: boolean
  blockchainProofHash?: string
}

/**
 * Derive encryption key from user password using PBKDF2
 * This ensures zero-knowledge: we never store the actual key
 */
export function deriveKey(password: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(password, salt, 100000, KEY_LENGTH, 'sha512')
}

/**
 * Encrypt data with AES-256-GCM
 * Returns ciphertext + IV + auth tag + salt
 */
export function encryptVaultData(
  plaintext: string,
  password: string
): EncryptedData {
  // Generate random salt for key derivation
  const salt = crypto.randomBytes(SALT_LENGTH)
  
  // Derive encryption key from password
  const key = deriveKey(password, salt)
  
  // Generate random IV
  const iv = crypto.randomBytes(IV_LENGTH)
  
  // Create cipher
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
  
  // Encrypt data
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex')
  ciphertext += cipher.final('hex')
  
  // Get authentication tag
  const authTag = cipher.getAuthTag()
  
  return {
    ciphertext,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex'),
    salt: salt.toString('hex'),
  }
}

/**
 * Decrypt vault data with AES-256-GCM
 * Throws error if authentication fails (tampered data)
 */
export function decryptVaultData(
  encrypted: EncryptedData,
  password: string
): string {
  try {
    // Convert hex strings back to buffers
    const salt = Buffer.from(encrypted.salt, 'hex')
    const iv = Buffer.from(encrypted.iv, 'hex')
    const authTag = Buffer.from(encrypted.authTag, 'hex')
    
    // Derive the same key from password
    const key = deriveKey(password, salt)
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(authTag)
    
    // Decrypt data
    let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8')
    plaintext += decipher.final('utf8')
    
    return plaintext
  } catch (error) {
    throw new Error('Decryption failed: Invalid password or tampered data')
  }
}

/**
 * Generate blockchain proof of custody
 * SHA-256 hash of encrypted data + timestamp + owner
 */
export function generateBlockchainProof(
  encrypted: EncryptedData,
  metadata: VaultMetadata
): string {
  const proofData = JSON.stringify({
    ciphertext: encrypted.ciphertext,
    authTag: encrypted.authTag,
    vaultId: metadata.vaultId,
    ownerId: metadata.ownerId,
    timestamp: metadata.createdAt,
  })
  
  return crypto.createHash('sha256').update(proofData).digest('hex')
}

/**
 * Verify blockchain proof integrity
 */
export function verifyBlockchainProof(
  encrypted: EncryptedData,
  metadata: VaultMetadata,
  storedProof: string
): boolean {
  const calculatedProof = generateBlockchainProof(encrypted, metadata)
  return calculatedProof === storedProof
}

/**
 * Check if vault should auto-destruct
 */
export function shouldAutoDestruct(metadata: VaultMetadata): boolean {
  if (!metadata.autoDestructEnabled || !metadata.expiresAt) {
    return false
  }
  
  const now = new Date()
  const expiresAt = new Date(metadata.expiresAt)
  
  return now >= expiresAt
}

/**
 * Check if dead man's switch should trigger
 */
export function shouldTriggerDeadManSwitch(metadata: VaultMetadata): boolean {
  if (!metadata.deadManSwitchEnabled || !metadata.lastAccessedAt || !metadata.deadManSwitchDays) {
    return false
  }
  
  const now = new Date()
  const lastAccess = new Date(metadata.lastAccessedAt)
  const daysSinceAccess = (now.getTime() - lastAccess.getTime()) / (1000 * 60 * 60 * 24)
  
  return daysSinceAccess >= metadata.deadManSwitchDays
}

/**
 * Generate secure vault access token (JWT-like)
 */
export function generateVaultAccessToken(
  vaultId: string,
  ownerId: string,
  expiresIn: number = 3600 // 1 hour
): string {
  const payload = {
    vaultId,
    ownerId,
    iat: Date.now(),
    exp: Date.now() + expiresIn * 1000,
  }
  
  const token = Buffer.from(JSON.stringify(payload)).toString('base64')
  const signature = crypto
    .createHmac('sha256', process.env.VAULT_SECRET_KEY || 'vault-secret')
    .update(token)
    .digest('hex')
  
  return `${token}.${signature}`
}

/**
 * Verify vault access token
 */
export function verifyVaultAccessToken(token: string): {
  valid: boolean
  payload?: any
  error?: string
} {
  try {
    const [tokenPart, signature] = token.split('.')
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.VAULT_SECRET_KEY || 'vault-secret')
      .update(tokenPart)
      .digest('hex')
    
    if (signature !== expectedSignature) {
      return { valid: false, error: 'Invalid signature' }
    }
    
    // Decode payload
    const payload = JSON.parse(Buffer.from(tokenPart, 'base64').toString())
    
    // Check expiration
    if (payload.exp < Date.now()) {
      return { valid: false, error: 'Token expired' }
    }
    
    return { valid: true, payload }
  } catch (error) {
    return { valid: false, error: 'Invalid token format' }
  }
}

/**
 * Encrypt file for vault storage
 */
export async function encryptVaultFile(
  fileBuffer: Buffer,
  password: string
): Promise<EncryptedData> {
  const base64Data = fileBuffer.toString('base64')
  return encryptVaultData(base64Data, password)
}

/**
 * Decrypt file from vault
 */
export async function decryptVaultFile(
  encrypted: EncryptedData,
  password: string
): Promise<Buffer> {
  const base64Data = decryptVaultData(encrypted, password)
  return Buffer.from(base64Data, 'base64')
}

/**
 * Create time capsule (encrypted data with future unlock date)
 */
export interface TimeCapsule {
  encrypted: EncryptedData
  unlockDate: string
  message?: string
  recipients?: string[]
}

export function createTimeCapsule(
  data: string,
  password: string,
  unlockDate: Date,
  message?: string,
  recipients?: string[]
): TimeCapsule {
  const encrypted = encryptVaultData(data, password)
  
  return {
    encrypted,
    unlockDate: unlockDate.toISOString(),
    message,
    recipients,
  }
}

/**
 * Check if time capsule can be unlocked
 */
export function canUnlockTimeCapsule(capsule: TimeCapsule): boolean {
  const now = new Date()
  const unlockDate = new Date(capsule.unlockDate)
  return now >= unlockDate
}
