/**
 * API endpoint for downloading encrypted files from Human Vault
 *
 * POST /api/vault/download
 *
 * Body (JSON):
 * - access_token: Token for accessing the file
 * - password: Password to decrypt the file
 * - nda_signature_id: (optional) ID of NDA signature
 *
 * Returns:
 * - encrypted_content: Base64 encoded encrypted file
 * - metadata: File metadata for decryption
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { downloadEncryptedFile, deleteFile } from '@/lib/vault/storage'
import {
  logSuccessfulAccess,
  logFailedAccess,
  incrementDownloadCount,
  hasExceededMaxDownloads,
  updateFileAccessTimestamp
} from '@/lib/vault/audit'
import { arrayBufferToBase64 } from '@/lib/vault/encryption'

export const runtime = 'nodejs'
export const maxDuration = 60

interface DownloadRequest {
  access_token: string
  password: string
  nda_signature_id?: string
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: DownloadRequest = await request.json()

    if (!body.access_token) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 400 }
      )
    }

    if (!body.password) {
      return NextResponse.json(
        { error: 'Password required' },
        { status: 400 }
      )
    }

    // Get file metadata from database
    const supabase = createClientComponentClient()
    const { data: vaultFile, error: fetchError } = await supabase
      .from('vault_files')
      .select('*')
      .eq('access_token', body.access_token)
      .eq('is_destructed', false)
      .single()

    if (fetchError || !vaultFile) {
      await logFailedAccess(
        'unknown',
        'download',
        'Invalid access token',
        false
      )

      return NextResponse.json(
        { error: 'File not found or has been deleted' },
        { status: 404 }
      )
    }

    // Check if file has expired
    if (vaultFile.destruct_at && new Date(vaultFile.destruct_at) < new Date()) {
      await logFailedAccess(
        vaultFile.id,
        'download',
        'File has expired',
        false
      )

      // Mark as destructed
      await supabase
        .from('vault_files')
        .update({
          is_destructed: true,
          destructed_at: new Date().toISOString()
        })
        .eq('id', vaultFile.id)

      return NextResponse.json(
        { error: 'File has expired and been deleted' },
        { status: 410 }
      )
    }

    // Check if max downloads exceeded
    const exceeded = await hasExceededMaxDownloads(vaultFile.id)
    if (exceeded) {
      await logFailedAccess(
        vaultFile.id,
        'download',
        'Maximum downloads exceeded',
        false
      )

      return NextResponse.json(
        { error: 'Maximum downloads exceeded' },
        { status: 403 }
      )
    }

    // Check NDA requirement
    if (vaultFile.requires_nda) {
      if (!body.nda_signature_id) {
        await logFailedAccess(
          vaultFile.id,
          'download',
          'NDA signature required',
          false
        )

        return NextResponse.json(
          { error: 'NDA signature required', requires_nda: true },
          { status: 403 }
        )
      }

      // Verify NDA signature exists
      const { data: signature, error: sigError } = await supabase
        .from('nda_signatures')
        .select('id')
        .eq('id', body.nda_signature_id)
        .eq('vault_file_id', vaultFile.id)
        .single()

      if (sigError || !signature) {
        await logFailedAccess(
          vaultFile.id,
          'download',
          'Invalid NDA signature',
          false
        )

        return NextResponse.json(
          { error: 'Invalid NDA signature', requires_nda: true },
          { status: 403 }
        )
      }
    }

    // Download encrypted file from storage
    let encryptedContent: ArrayBuffer
    try {
      const downloadResult = await downloadEncryptedFile(vaultFile.storage_path)
      encryptedContent = downloadResult.data
    } catch (downloadError) {
      console.error('Download error:', downloadError)

      await logFailedAccess(
        vaultFile.id,
        'download',
        'Failed to download file from storage',
        true
      )

      return NextResponse.json(
        { error: 'Failed to download file' },
        { status: 500 }
      )
    }

    // Log successful access
    await logSuccessfulAccess(
      vaultFile.id,
      'download',
      undefined,
      body.nda_signature_id
    )

    // Increment download count
    await incrementDownloadCount(vaultFile.id)

    // Update access timestamp
    await updateFileAccessTimestamp(vaultFile.id)

    // If single download, schedule deletion
    if (vaultFile.single_download) {
      // Mark for deletion (will be handled by cron job)
      await supabase
        .from('vault_files')
        .update({
          is_destructed: true,
          destructed_at: new Date().toISOString()
        })
        .eq('id', vaultFile.id)

      // Delete file from storage immediately
      try {
        await deleteFile(vaultFile.storage_path)
      } catch (deleteError) {
        console.error('Failed to delete file after single download:', deleteError)
      }
    }

    // Convert encrypted content to base64
    const base64Content = arrayBufferToBase64(encryptedContent)

    // Return encrypted file and metadata
    return NextResponse.json({
      success: true,
      encrypted_content: base64Content,
      metadata: {
        file_name: vaultFile.file_name,
        file_type: vaultFile.file_type,
        file_size: vaultFile.file_size,
        encrypted_file_key: vaultFile.encrypted_file_key,
        watermark_text: vaultFile.watermark_enabled ? vaultFile.watermark_text : null
      },
      single_download: vaultFile.single_download,
      file_deleted: vaultFile.single_download
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to get file metadata without downloading
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const accessToken = searchParams.get('access_token')

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 400 }
      )
    }

    // Get file metadata
    const supabase = createClientComponentClient()
    const { data: vaultFile, error } = await supabase
      .from('vault_files')
      .select('id, file_name, file_type, file_size, requires_nda, created_at, destruct_at, is_destructed, download_count, max_downloads, watermark_enabled')
      .eq('access_token', accessToken)
      .eq('is_destructed', false)
      .single()

    if (error || !vaultFile) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    // Check if expired
    if (vaultFile.destruct_at && new Date(vaultFile.destruct_at) < new Date()) {
      return NextResponse.json(
        { error: 'File has expired' },
        { status: 410 }
      )
    }

    // Get NDA template if required
    let ndaTemplate = null
    if (vaultFile.requires_nda) {
      const { data: template } = await supabase
        .from('nda_templates')
        .select('id, name, content')
        .eq('is_default', true)
        .single()

      ndaTemplate = template
    }

    return NextResponse.json({
      success: true,
      file: {
        id: vaultFile.id,
        file_name: vaultFile.file_name,
        file_type: vaultFile.file_type,
        file_size: vaultFile.file_size,
        requires_nda: vaultFile.requires_nda,
        created_at: vaultFile.created_at,
        destruct_at: vaultFile.destruct_at,
        download_count: vaultFile.download_count,
        downloads_remaining: vaultFile.max_downloads ? vaultFile.max_downloads - vaultFile.download_count : null,
        watermark_enabled: vaultFile.watermark_enabled
      },
      nda_template: ndaTemplate
    })
  } catch (error) {
    console.error('Metadata fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
