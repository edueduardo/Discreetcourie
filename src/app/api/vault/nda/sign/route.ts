/**
 * API endpoint for signing NDA
 *
 * POST /api/vault/nda/sign
 *
 * Body (JSON):
 * - access_token: Token for accessing the file
 * - full_name: Signer's full name
 * - email: Signer's email
 * - signature_data: Digital signature (typed name)
 * - ip_address: (optional) IP address
 * - user_agent: (optional) User agent
 *
 * Returns:
 * - nda_signature_id: ID of created signature
 * - verification_hash: Hash for verification
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sha256Hex } from '@/lib/vault/encryption'
import { logSuccessfulAccess } from '@/lib/vault/audit'

export const runtime = 'nodejs'

interface SignNDARequest {
  access_token: string
  full_name: string
  email: string
  signature_data: string
  ip_address?: string
  user_agent?: string
  geolocation?: {
    lat?: number
    lon?: number
    city?: string
    country?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: SignNDARequest = await request.json()

    // Validate required fields
    if (!body.access_token) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 400 }
      )
    }

    if (!body.full_name || !body.email || !body.signature_data) {
      return NextResponse.json(
        { error: 'Full name, email, and signature required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      )
    }

    // Get session (optional - can sign NDA without being logged in)
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || null

    // Get file metadata
    const supabase = createClient()
    const { data: vaultFile, error: fileError } = await supabase
      .from('vault_files')
      .select('id, nda_template_id, requires_nda')
      .eq('access_token', body.access_token)
      .eq('is_destructed', false)
      .single()

    if (fileError || !vaultFile) {
      return NextResponse.json(
        { error: 'File not found' },
        { status: 404 }
      )
    }

    if (!vaultFile.requires_nda) {
      return NextResponse.json(
        { error: 'This file does not require NDA' },
        { status: 400 }
      )
    }

    // Get NDA template
    const { data: ndaTemplate, error: templateError } = await supabase
      .from('nda_templates')
      .select('id, content')
      .eq('id', vaultFile.nda_template_id || '')
      .single()

    if (!ndaTemplate) {
      // Get default template
      const { data: defaultTemplate } = await supabase
        .from('nda_templates')
        .select('id, content')
        .eq('is_default', true)
        .single()

      if (!defaultTemplate) {
        return NextResponse.json(
          { error: 'NDA template not found' },
          { status: 500 }
        )
      }
    }

    const template = ndaTemplate || { content: '' }

    // Check if already signed
    const { data: existingSignature } = await supabase
      .from('nda_signatures')
      .select('id')
      .eq('vault_file_id', vaultFile.id)
      .eq('email', body.email)
      .single()

    if (existingSignature) {
      return NextResponse.json({
        success: true,
        nda_signature_id: existingSignature.id,
        already_signed: true,
        message: 'You have already signed this NDA'
      })
    }

    // Get IP address and user agent
    const ip = body.ip_address || request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const userAgent = body.user_agent || request.headers.get('user-agent') || 'unknown'

    // Generate verification hash
    const timestamp = new Date().toISOString()
    const hashData = `${template.content}|${body.full_name}|${body.email}|${body.signature_data}|${timestamp}`
    const verificationHash = await sha256Hex(hashData)

    // Create NDA signature record
    const { data: signature, error: signError } = await supabase
      .from('nda_signatures')
      .insert([
        {
          nda_template_id: vaultFile.nda_template_id,
          vault_file_id: vaultFile.id,
          user_id: userId,
          signature_data: body.signature_data,
          ip_address: ip,
          user_agent: userAgent,
          geolocation: body.geolocation || null,
          full_name: body.full_name,
          email: body.email,
          accepted_terms: true,
          acceptance_timestamp: timestamp,
          verification_hash: verificationHash,
          is_verified: true,
          verification_method: 'electronic_signature',
          signed_at: timestamp
        }
      ])
      .select()
      .single()

    if (signError) {
      console.error('NDA signature creation error:', signError)
      return NextResponse.json(
        { error: 'Failed to create NDA signature' },
        { status: 500 }
      )
    }

    // Log the NDA viewing/signing
    await logSuccessfulAccess(
      vaultFile.id,
      'nda_view',
      userId || undefined,
      signature.id
    )

    return NextResponse.json({
      success: true,
      nda_signature_id: signature.id,
      verification_hash: verificationHash,
      signed_at: timestamp,
      message: 'NDA signed successfully'
    })
  } catch (error) {
    console.error('NDA signing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to verify NDA signature
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const signatureId = searchParams.get('signature_id')
    const verificationHash = searchParams.get('verification_hash')

    if (!signatureId && !verificationHash) {
      return NextResponse.json(
        { error: 'Signature ID or verification hash required' },
        { status: 400 }
      )
    }

    const supabase = createClient()

    let query = supabase
      .from('nda_signatures')
      .select('*')

    if (signatureId) {
      query = query.eq('id', signatureId)
    } else if (verificationHash) {
      query = query.eq('verification_hash', verificationHash)
    }

    const { data: signature, error } = await query.single()

    if (error || !signature) {
      return NextResponse.json(
        { error: 'Signature not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      signature: {
        id: signature.id,
        full_name: signature.full_name,
        email: signature.email,
        signed_at: signature.signed_at,
        verification_hash: signature.verification_hash,
        is_verified: signature.is_verified,
        ip_address: signature.ip_address,
        geolocation: signature.geolocation
      }
    })
  } catch (error) {
    console.error('NDA verification error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
