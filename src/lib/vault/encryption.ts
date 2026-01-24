/**
 * End-to-End Encryption Library for Human Vault
 *
 * Features:
 * - AES-256-GCM encryption/decryption
 * - PBKDF2 key derivation from passwords
 * - Secure random key generation
 * - File chunking for large files
 *
 * Security:
 * - All encryption happens client-side
 * - Server never sees unencrypted content or encryption keys
 * - Uses Web Crypto API (browser standard)
 */

// ============================================
// TYPES
// ============================================

export interface EncryptedData {
  ciphertext: ArrayBuffer
  iv: Uint8Array
  salt: Uint8Array
  authTag?: Uint8Array
}

export interface EncryptionKey {
  raw: CryptoKey
  exported: ArrayBuffer
}

export interface EncryptedFileData {
  encryptedContent: ArrayBuffer
  encryptedKey: string // Base64 encoded
  iv: string // Base64 encoded
  salt: string // Base64 encoded
  fileName: string
  fileType: string
  fileSize: number
}

// ============================================
// CONSTANTS
// ============================================

const PBKDF2_ITERATIONS = 100000
const SALT_LENGTH = 16
const IV_LENGTH = 12
const KEY_LENGTH = 256

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Convert ArrayBuffer to Base64 string
 */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

/**
 * Convert Base64 string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

/**
 * Convert string to ArrayBuffer
 */
export function stringToArrayBuffer(str: string): ArrayBuffer {
  const encoder = new TextEncoder()
  return encoder.encode(str).buffer
}

/**
 * Convert ArrayBuffer to string
 */
export function arrayBufferToString(buffer: ArrayBuffer): string {
  const decoder = new TextDecoder()
  return decoder.decode(buffer)
}

/**
 * Generate cryptographically secure random bytes
 */
export function generateRandomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length))
}

/**
 * Generate SHA-256 hash
 */
export async function sha256(data: string | ArrayBuffer): Promise<ArrayBuffer> {
  const buffer = typeof data === 'string' ? stringToArrayBuffer(data) : data
  return await crypto.subtle.digest('SHA-256', buffer)
}

/**
 * Generate SHA-256 hash as hex string
 */
export async function sha256Hex(data: string | ArrayBuffer): Promise<string> {
  const hashBuffer = await sha256(data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// ============================================
// KEY DERIVATION (PBKDF2)
// ============================================

/**
 * Derive encryption key from password using PBKDF2
 */
export async function deriveKeyFromPassword(
  password: string,
  salt?: Uint8Array
): Promise<{ key: CryptoKey; salt: Uint8Array }> {
  // Generate salt if not provided
  const keySalt = salt || generateRandomBytes(SALT_LENGTH)

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    stringToArrayBuffer(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  // Derive key using PBKDF2
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: keySalt,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: KEY_LENGTH },
    true, // extractable
    ['encrypt', 'decrypt']
  )

  return { key, salt: keySalt }
}

// ============================================
// ENCRYPTION KEY GENERATION
// ============================================

/**
 * Generate random encryption key for file encryption
 */
export async function generateEncryptionKey(): Promise<EncryptionKey> {
  const key = await crypto.subtle.generateKey(
    {
      name: 'AES-GCM',
      length: KEY_LENGTH
    },
    true, // extractable
    ['encrypt', 'decrypt']
  )

  const exported = await crypto.subtle.exportKey('raw', key)

  return { raw: key, exported }
}

/**
 * Import encryption key from raw bytes
 */
export async function importEncryptionKey(keyData: ArrayBuffer): Promise<CryptoKey> {
  return await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'AES-GCM', length: KEY_LENGTH },
    true,
    ['encrypt', 'decrypt']
  )
}

// ============================================
// FILE ENCRYPTION/DECRYPTION (AES-256-GCM)
// ============================================

/**
 * Encrypt data using AES-256-GCM
 */
export async function encryptData(
  data: ArrayBuffer,
  key: CryptoKey,
  iv?: Uint8Array
): Promise<{ ciphertext: ArrayBuffer; iv: Uint8Array }> {
  // Generate IV if not provided
  const encryptionIv = iv || generateRandomBytes(IV_LENGTH)

  // Encrypt using AES-GCM
  const ciphertext = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: encryptionIv
    },
    key,
    data
  )

  return { ciphertext, iv: encryptionIv }
}

/**
 * Decrypt data using AES-256-GCM
 */
export async function decryptData(
  ciphertext: ArrayBuffer,
  key: CryptoKey,
  iv: Uint8Array
): Promise<ArrayBuffer> {
  return await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv
    },
    key,
    ciphertext
  )
}

/**
 * Encrypt file with random key, then encrypt the key with password
 */
export async function encryptFile(
  file: File,
  password: string
): Promise<EncryptedFileData> {
  // Read file as ArrayBuffer
  const fileBuffer = await file.arrayBuffer()

  // Generate random encryption key for the file
  const fileKey = await generateEncryptionKey()

  // Encrypt file content with random key
  const { ciphertext: encryptedContent, iv } = await encryptData(
    fileBuffer,
    fileKey.raw
  )

  // Derive key from password
  const { key: passwordKey, salt } = await deriveKeyFromPassword(password)

  // Encrypt the file encryption key with password-derived key
  const { ciphertext: encryptedKeyBuffer } = await encryptData(
    fileKey.exported,
    passwordKey
  )

  return {
    encryptedContent,
    encryptedKey: arrayBufferToBase64(encryptedKeyBuffer),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt),
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size
  }
}

/**
 * Decrypt file by first decrypting the encryption key with password
 */
export async function decryptFile(
  encryptedContent: ArrayBuffer,
  encryptedKey: string,
  iv: string,
  salt: string,
  password: string,
  fileName: string,
  fileType: string
): Promise<File> {
  // Convert base64 to ArrayBuffer
  const encryptedKeyBuffer = base64ToArrayBuffer(encryptedKey)
  const ivBuffer = new Uint8Array(base64ToArrayBuffer(iv))
  const saltBuffer = new Uint8Array(base64ToArrayBuffer(salt))

  // Derive key from password
  const { key: passwordKey } = await deriveKeyFromPassword(password, saltBuffer)

  // Decrypt the file encryption key
  const fileKeyBuffer = await decryptData(
    encryptedKeyBuffer,
    passwordKey,
    ivBuffer
  )

  // Import the decrypted file key
  const fileKey = await importEncryptionKey(fileKeyBuffer)

  // Get IV for file content (first 12 bytes of encrypted content)
  // Note: In our implementation, IV is stored separately
  const contentIv = ivBuffer

  // Decrypt file content
  const decryptedContent = await decryptData(
    encryptedContent,
    fileKey,
    contentIv
  )

  // Create File object
  return new File([decryptedContent], fileName, { type: fileType })
}

// ============================================
// ENCRYPTION KEY WRAPPING
// ============================================

/**
 * Encrypt encryption key with password for storage
 */
export async function wrapEncryptionKey(
  encryptionKey: ArrayBuffer,
  password: string
): Promise<{ wrappedKey: string; iv: string; salt: string }> {
  // Derive key from password
  const { key: passwordKey, salt } = await deriveKeyFromPassword(password)

  // Encrypt the encryption key
  const { ciphertext, iv } = await encryptData(encryptionKey, passwordKey)

  return {
    wrappedKey: arrayBufferToBase64(ciphertext),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt)
  }
}

/**
 * Decrypt encryption key using password
 */
export async function unwrapEncryptionKey(
  wrappedKey: string,
  iv: string,
  salt: string,
  password: string
): Promise<CryptoKey> {
  // Convert base64 to ArrayBuffer
  const wrappedKeyBuffer = base64ToArrayBuffer(wrappedKey)
  const ivBuffer = new Uint8Array(base64ToArrayBuffer(iv))
  const saltBuffer = new Uint8Array(base64ToArrayBuffer(salt))

  // Derive key from password
  const { key: passwordKey } = await deriveKeyFromPassword(password, saltBuffer)

  // Decrypt the wrapped key
  const unwrappedKeyBuffer = await decryptData(
    wrappedKeyBuffer,
    passwordKey,
    ivBuffer
  )

  // Import as CryptoKey
  return await importEncryptionKey(unwrappedKeyBuffer)
}

// ============================================
// FILE CHUNKING (for large files)
// ============================================

export const CHUNK_SIZE = 1024 * 1024 // 1MB chunks

/**
 * Encrypt large file in chunks
 */
export async function encryptFileInChunks(
  file: File,
  password: string,
  onProgress?: (progress: number) => void
): Promise<EncryptedFileData> {
  const totalSize = file.size
  const chunks: ArrayBuffer[] = []
  let offset = 0

  // Generate file encryption key
  const fileKey = await generateEncryptionKey()
  const iv = generateRandomBytes(IV_LENGTH)

  // Read and encrypt file in chunks
  while (offset < totalSize) {
    const chunkSize = Math.min(CHUNK_SIZE, totalSize - offset)
    const chunk = file.slice(offset, offset + chunkSize)
    const chunkBuffer = await chunk.arrayBuffer()

    // Encrypt chunk
    const { ciphertext } = await encryptData(chunkBuffer, fileKey.raw, iv)
    chunks.push(ciphertext)

    offset += chunkSize

    // Report progress
    if (onProgress) {
      onProgress((offset / totalSize) * 100)
    }
  }

  // Combine all encrypted chunks
  const totalLength = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0)
  const combined = new Uint8Array(totalLength)
  let position = 0
  for (const chunk of chunks) {
    combined.set(new Uint8Array(chunk), position)
    position += chunk.byteLength
  }

  // Encrypt file key with password
  const { key: passwordKey, salt } = await deriveKeyFromPassword(password)
  const { ciphertext: encryptedKeyBuffer } = await encryptData(
    fileKey.exported,
    passwordKey
  )

  return {
    encryptedContent: combined.buffer,
    encryptedKey: arrayBufferToBase64(encryptedKeyBuffer),
    iv: arrayBufferToBase64(iv),
    salt: arrayBufferToBase64(salt),
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size
  }
}

// ============================================
// VALIDATION
// ============================================

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (password.length < 12) {
    return { valid: false, error: 'Password must be at least 12 characters for vault files' }
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 uppercase letter' }
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 lowercase letter' }
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 number' }
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { valid: false, error: 'Password must contain at least 1 special character' }
  }

  return { valid: true }
}

/**
 * Generate secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*(),.?":{}|<>'
  const all = uppercase + lowercase + numbers + special

  let password = ''

  // Ensure at least one of each type
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)]
  }

  // Shuffle
  return password.split('').sort(() => Math.random() - 0.5).join('')
}
