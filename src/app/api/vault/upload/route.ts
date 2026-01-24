/**
 * API endpoint for uploading encrypted files to Human Vault
 *
 * POST /api/vault/upload
 *
 * Body (multipart/form-data):
 * - file: encrypted file content (ArrayBuffer)
 * - metadata: JSON string with file metadata
 *
 * Returns:
 * - vault_file_id: UUID of created vault file
 * - access_token: Token for public access
 * - access_url: URL for accessing the file
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@/lib/supabase/client'
import { uploadEncryptedFile } from '@/lib/vault/storage'
import { v4 as uuidv4 } from 'uuid'

export const runtime = 'nodejs'
export const maxDuration = 60 // 60 seconds for large uploads

interface UploadMetadata {
  fileName: string
  fileType: string
  fileSize: number
  encryptedFileKey: string
  iv: string
  salt: string
  deliveryId?: string
  requiresNda?: boolean
  singleDownload?: boolean
  autoDestructAfterDays?: number
  autoDestructAfterDelivery?: boolean
  watermarkEnabled?: boolean
  watermarkText?: string
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File
    const metadataStr = formData.get('metadata') as string

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!metadataStr) {
      return NextResponse.json(
        { error: 'No metadata provided' },
        { status: 400 }
      )
    }

    // Parse metadata
    let metadata: UploadMetadata
    try {
      metadata = JSON.parse(metadataStr)
    } catch {
      return NextResponse.json(
        { error: 'Invalid metadata JSON' },
        { status: 400 }
      )
    }

    // Validate metadata
    if (!metadata.fileName || !metadata.fileType || !metadata.fileSize) {
      return NextResponse.json(
        { error: 'Missing required metadata fields' },
        { status: 400 }
      )
    }

    if (!metadata.encryptedFileKey || !metadata.iv || !metadata.salt) {
      return NextResponse.json(
        { error: 'Missing encryption metadata' },
        { status: 400 }
      )
    }

    // Convert file to ArrayBuffer
    const fileBuffer = await file.arrayBuffer()

    // Upload to Supabase Storage
    const uploadResult = await uploadEncryptedFile(
      fileBuffer,
      metadata.fileName,
      'application/octet-stream' // Always use binary for encrypted files
    )

    // Generate access token
    const accessToken = uuidv4()

    // Create vault file record
    const supabase = createClient()
    const { data: vaultFile, error: dbError } = await supabase
      .from('vault_files')
      .insert([
        {
          delivery_id: metadata.deliveryId || null,
          uploaded_by: session.user.id,
          file_name: metadata.fileName,
          file_type: metadata.fileType,
          file_size: metadata.fileSize,
          encrypted_file_key: metadata.encryptedFileKey,
          storage_path: uploadResult.path,
          storage_bucket: uploadResult.bucket,
          requires_nda: metadata.requiresNda !== false, // Default true
          single_download: metadata.singleDownload !== false, // Default true
          auto_destruct_enabled: true,
          auto_destruct_after_days: metadata.autoDestructAfterDays || 7,
          auto_destruct_after_delivery: metadata.autoDestructAfterDelivery !== false,
          watermark_enabled: metadata.watermarkEnabled !== false,
          watermark_text: metadata.watermarkText || `${session.user.name || session.user.email} - ${new Date().toLocaleDateString()}`,
          password_protected: true,
          access_token: accessToken
        }
      ])
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)

      // Cleanup: delete uploaded file
      try {
        const { deleteFile } = await import('@/lib/vault/storage')
        await deleteFile(uploadResult.path)
      } catch (cleanupError) {
        console.error('Failed to cleanup file after DB error:', cleanupError)
      }

      return NextResponse.json(
        { error: 'Failed to create vault file record' },
        { status: 500 }
      )
    }

    // Get default NDA template
    const { data: ndaTemplate } = await supabase
      .from('nda_templates')
      .select('id')
      .eq('is_default', true)
      .single()

    // Update with NDA template
    if (ndaTemplate) {
      await supabase
        .from('vault_files')
        .update({ nda_template_id: ndaTemplate.id })
        .eq('id', vaultFile.id)
    }

    // Generate access URL
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const accessUrl = `${baseUrl}/vault/access/${accessToken}`

    return NextResponse.json({
      success: true,
      vault_file_id: vaultFile.id,
      access_token: accessToken,
      access_url: accessUrl,
      storage_path: uploadResult.path,
      expires_at: vaultFile.destruct_at
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve vault file metadata
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient()

    // Get all vault files uploaded by user
    const { data: vaultFiles, error } = await supabase
      .from('vault_files')
      .select('*')
      .eq('uploaded_by', session.user.id)
      .eq('is_destructed', false)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch vault files' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      files: vaultFiles
    })
  } catch (error) {
    console.error('Fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
