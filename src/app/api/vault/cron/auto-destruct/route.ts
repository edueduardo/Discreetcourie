/**
 * Cron job for auto-destructing expired vault files
 *
 * GET /api/vault/cron/auto-destruct
 *
 * This should be called periodically (e.g., every hour) by Vercel Cron
 *
 * Configuration in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/vault/cron/auto-destruct",
 *     "schedule": "0 * * * *"
 *   }]
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { deleteFile } from '@/lib/vault/storage'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes

export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClientComponentClient()
    const now = new Date().toISOString()

    // Find files that should be auto-destructed
    const { data: filesToDestruct, error: fetchError } = await supabase
      .from('vault_files')
      .select('id, storage_path, file_name')
      .eq('is_destructed', false)
      .eq('auto_destruct_enabled', true)
      .lte('destruct_at', now)

    if (fetchError) {
      console.error('Failed to fetch files for destruction:', fetchError)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (!filesToDestruct || filesToDestruct.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No files to destruct',
        destructed_count: 0
      })
    }

    const results = {
      success: 0,
      failed: 0,
      errors: [] as string[]
    }

    // Process each file
    for (const file of filesToDestruct) {
      try {
        // Delete from storage
        await deleteFile(file.storage_path)

        // Mark as destructed in database
        const { error: updateError } = await supabase
          .from('vault_files')
          .update({
            is_destructed: true,
            destructed_at: now
          })
          .eq('id', file.id)

        if (updateError) {
          console.error(`Failed to mark file ${file.id} as destructed:`, updateError)
          results.failed++
          results.errors.push(`${file.file_name}: ${updateError.message}`)
        } else {
          results.success++
          console.log(`Auto-destructed file: ${file.file_name} (${file.id})`)
        }
      } catch (error) {
        console.error(`Failed to destruct file ${file.id}:`, error)
        results.failed++
        results.errors.push(`${file.file_name}: ${error instanceof Error ? error.message : 'Unknown error'}`)

        // Still mark as destructed in DB even if storage deletion failed
        await supabase
          .from('vault_files')
          .update({
            is_destructed: true,
            destructed_at: now
          })
          .eq('id', file.id)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-destruct completed`,
      total_files: filesToDestruct.length,
      destructed_count: results.success,
      failed_count: results.failed,
      errors: results.errors
    })
  } catch (error) {
    console.error('Auto-destruct cron error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST endpoint for manual trigger (admin only)
export async function POST(request: NextRequest) {
  try {
    // This requires admin authentication
    const authHeader = request.headers.get('authorization')

    // For now, use same cron secret for manual trigger
    // In production, this should check admin session
    const cronSecret = process.env.CRON_SECRET || 'dev-secret-change-in-production'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      )
    }

    // Parse optional body
    const body = await request.json().catch(() => ({}))
    const fileId = body.file_id

    const supabase = createClientComponentClient()
    const now = new Date().toISOString()

    if (fileId) {
      // Destruct specific file
      const { data: file, error: fetchError } = await supabase
        .from('vault_files')
        .select('id, storage_path, file_name')
        .eq('id', fileId)
        .eq('is_destructed', false)
        .single()

      if (fetchError || !file) {
        return NextResponse.json(
          { error: 'File not found' },
          { status: 404 }
        )
      }

      // Delete from storage
      await deleteFile(file.storage_path)

      // Mark as destructed
      await supabase
        .from('vault_files')
        .update({
          is_destructed: true,
          destructed_at: now
        })
        .eq('id', file.id)

      return NextResponse.json({
        success: true,
        message: `File ${file.file_name} destructed manually`,
        file_id: file.id
      })
    } else {
      // Trigger full auto-destruct run
      return await GET(request)
    }
  } catch (error) {
    console.error('Manual destruct error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
