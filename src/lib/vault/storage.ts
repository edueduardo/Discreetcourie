/**
 * Supabase Storage utilities for Human Vault
 *
 * Features:
 * - Upload encrypted files to Supabase Storage
 * - Download encrypted files
 * - Delete files securely
 * - Generate signed URLs for temporary access
 */

import { createClient } from '@/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

const BUCKET_NAME = 'vault-files'
const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB

export interface UploadResult {
  path: string
  fullPath: string
  bucket: string
}

export interface DownloadResult {
  data: ArrayBuffer
  contentType: string
}

/**
 * Get Supabase client
 */
function getSupabase() {
  return createClient()
}

/**
 * Generate unique file path
 */
export function generateFilePath(originalFileName: string): string {
  const timestamp = Date.now()
  const randomId = uuidv4()
  const extension = originalFileName.split('.').pop() || 'bin'
  return `${timestamp}/${randomId}.${extension}`
}

/**
 * Upload encrypted file to Supabase Storage
 */
export async function uploadEncryptedFile(
  encryptedContent: ArrayBuffer,
  fileName: string,
  contentType: string = 'application/octet-stream'
): Promise<UploadResult> {
  const supabase = getSupabase()

  // Validate file size
  if (encryptedContent.byteLength > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`)
  }

  // Generate unique path
  const path = generateFilePath(fileName)

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, encryptedContent, {
      contentType,
      cacheControl: '3600',
      upsert: false
    })

  if (error) {
    console.error('Upload error:', error)
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  if (!data) {
    throw new Error('Upload failed: No data returned')
  }

  return {
    path: data.path,
    fullPath: `${BUCKET_NAME}/${data.path}`,
    bucket: BUCKET_NAME
  }
}

/**
 * Download encrypted file from Supabase Storage
 */
export async function downloadEncryptedFile(path: string): Promise<DownloadResult> {
  const supabase = getSupabase()

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(path)

  if (error) {
    console.error('Download error:', error)
    throw new Error(`Failed to download file: ${error.message}`)
  }

  if (!data) {
    throw new Error('Download failed: No data returned')
  }

  // Convert Blob to ArrayBuffer
  const arrayBuffer = await data.arrayBuffer()

  return {
    data: arrayBuffer,
    contentType: data.type
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(path: string): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path])

  if (error) {
    console.error('Delete error:', error)
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

/**
 * Delete multiple files
 */
export async function deleteFiles(paths: string[]): Promise<void> {
  const supabase = getSupabase()

  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove(paths)

  if (error) {
    console.error('Delete multiple files error:', error)
    throw new Error(`Failed to delete files: ${error.message}`)
  }
}

/**
 * Generate signed URL for temporary access (not commonly used for encrypted files)
 */
export async function getSignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
  const supabase = getSupabase()

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, expiresIn)

  if (error) {
    console.error('Signed URL error:', error)
    throw new Error(`Failed to create signed URL: ${error.message}`)
  }

  if (!data || !data.signedUrl) {
    throw new Error('Failed to create signed URL: No URL returned')
  }

  return data.signedUrl
}

/**
 * Get public URL (for public buckets only - not used for vault)
 */
export function getPublicUrl(path: string): string {
  const supabase = getSupabase()

  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path)

  return data.publicUrl
}

/**
 * List files in storage (admin only)
 */
export async function listFiles(path: string = ''): Promise<any[]> {
  const supabase = getSupabase()

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(path, {
      limit: 100,
      offset: 0,
      sortBy: { column: 'created_at', order: 'desc' }
    })

  if (error) {
    console.error('List files error:', error)
    throw new Error(`Failed to list files: ${error.message}`)
  }

  return data || []
}

/**
 * Check if file exists
 */
export async function fileExists(path: string): Promise<boolean> {
  try {
    const supabase = getSupabase()

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list(path.split('/').slice(0, -1).join('/'))

    if (error) return false

    const fileName = path.split('/').pop()
    return data?.some(file => file.name === fileName) || false
  } catch {
    return false
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata(path: string): Promise<any> {
  const supabase = getSupabase()

  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(path.split('/').slice(0, -1).join('/'))

  if (error) {
    throw new Error(`Failed to get file metadata: ${error.message}`)
  }

  const fileName = path.split('/').pop()
  const file = data?.find(f => f.name === fileName)

  if (!file) {
    throw new Error('File not found')
  }

  return file
}
