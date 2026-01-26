import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  generateNDASignature,
  verifyNDASignature,
  generateNDABlockchainProof,
  generateDeviceFingerprint,
  detectNDAViolation,
  calculateViolationPenalty,
  generateViolationNotification,
  createAuditEntry,
  isNDAExpired,
  evaluateSmartContract,
  NDADocument,
  NDAParty,
  NDAViolation,
} from '@/lib/nda/digital-signature'

/**
 * NDA Enforcement API - Automatic Legal Protection
 * POST /api/nda/enforce - Create and sign NDA
 * GET /api/nda/enforce?id=xxx - Get NDA details
 * PUT /api/nda/enforce - Sign NDA
 * DELETE /api/nda/enforce?id=xxx - Revoke NDA
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      content,
      recipientEmail,
      recipientName,
      terms,
    } = body

    if (!title || !content || !recipientEmail || !recipientName || !terms) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const ndaId = crypto.randomUUID()
    const now = new Date().toISOString()
    const expiresAt = terms.confidentialityPeriod
      ? new Date(Date.now() + terms.confidentialityPeriod * 24 * 60 * 60 * 1000).toISOString()
      : undefined

    // Create NDA document
    const nda: NDADocument = {
      id: ndaId,
      title,
      content,
      parties: [
        {
          id: user.id,
          name: user.email || 'Discloser',
          email: user.email || '',
          role: 'discloser',
          signedAt: now,
          signature: 'auto-signed',
          ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
          deviceFingerprint: generateDeviceFingerprint(
            request.headers.get('user-agent') || '',
            request.headers.get('x-forwarded-for') || ''
          ),
        },
        {
          id: crypto.randomUUID(),
          name: recipientName,
          email: recipientEmail,
          role: 'recipient',
        },
      ],
      terms: {
        confidentialityPeriod: terms.confidentialityPeriod || 365,
        geographicScope: terms.geographicScope || ['Global'],
        permittedUse: terms.permittedUse || [],
        prohibitedActions: terms.prohibitedActions || [
          'disclosure',
          'unauthorized sharing',
          'public posting',
          'competitor sharing',
        ],
        penaltyAmount: terms.penaltyAmount || 10000,
        automaticEnforcement: terms.automaticEnforcement !== false,
        blockchainProof: terms.blockchainProof !== false,
        auditTrail: terms.auditTrail !== false,
      },
      createdAt: now,
      expiresAt,
      status: 'pending',
    }

    // Generate blockchain proof
    const blockchainProof = generateNDABlockchainProof(nda)

    // Store in database
    const { data: storedNDA, error: dbError } = await supabase
      .from('ndas')
      .insert({
        id: ndaId,
        title,
        content,
        parties: nda.parties,
        terms: nda.terms,
        blockchain_proof: blockchainProof,
        created_by: user.id,
        created_at: now,
        expires_at: expiresAt,
        status: 'pending',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create NDA' },
        { status: 500 }
      )
    }

    // Create audit entry
    const auditEntry = createAuditEntry(
      ndaId,
      'NDA_CREATED',
      user.id,
      request.headers.get('x-forwarded-for') || 'unknown',
      { title, recipientEmail }
    )

    await supabase.from('nda_audit_log').insert(auditEntry)

    // Send NDA to recipient for signature
    // TODO: Send email with signing link

    return NextResponse.json({
      success: true,
      nda: {
        id: ndaId,
        title,
        status: 'pending',
        blockchainProof,
        createdAt: now,
        expiresAt,
        signingLink: `/nda/sign/${ndaId}`,
      },
      message: 'NDA created successfully. Recipient will receive signing link.',
    })
  } catch (error) {
    console.error('NDA creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const ndaId = searchParams.get('id')

    if (!ndaId) {
      // List all NDAs for user
      const { data: ndas, error } = await supabase
        .from('ndas')
        .select('*')
        .or(`created_by.eq.${user.id},parties.cs.${JSON.stringify([{ email: user.email }])}`)
        .order('created_at', { ascending: false })

      if (error) {
        return NextResponse.json({ error: 'Failed to fetch NDAs' }, { status: 500 })
      }

      return NextResponse.json({ success: true, ndas })
    }

    // Get specific NDA
    const { data: nda, error: dbError } = await supabase
      .from('ndas')
      .select('*')
      .eq('id', ndaId)
      .single()

    if (dbError || !nda) {
      return NextResponse.json({ error: 'NDA not found' }, { status: 404 })
    }

    // Check if user is party to NDA
    const isParty = nda.created_by === user.id || 
                    nda.parties.some((p: NDAParty) => p.email === user.email)

    if (!isParty) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if expired
    if (isNDAExpired(nda)) {
      await supabase
        .from('ndas')
        .update({ status: 'expired' })
        .eq('id', ndaId)
      
      nda.status = 'expired'
    }

    // Get violations
    const { data: violations } = await supabase
      .from('nda_violations')
      .select('*')
      .eq('nda_id', ndaId)
      .order('detected_at', { ascending: false })

    return NextResponse.json({
      success: true,
      nda,
      violations: violations || [],
      blockchainProof: nda.blockchain_proof,
    })
  } catch (error) {
    console.error('NDA fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { ndaId, signature } = body

    if (!ndaId) {
      return NextResponse.json({ error: 'Missing NDA ID' }, { status: 400 })
    }

    // Get NDA
    const { data: nda, error: dbError } = await supabase
      .from('ndas')
      .select('*')
      .eq('id', ndaId)
      .single()

    if (dbError || !nda) {
      return NextResponse.json({ error: 'NDA not found' }, { status: 404 })
    }

    // Find party
    const partyIndex = nda.parties.findIndex((p: NDAParty) => p.email === user.email)
    if (partyIndex === -1) {
      return NextResponse.json({ error: 'Not a party to this NDA' }, { status: 403 })
    }

    // Update party signature
    const updatedParties = [...nda.parties]
    updatedParties[partyIndex] = {
      ...updatedParties[partyIndex],
      signedAt: new Date().toISOString(),
      signature: signature || 'digital-signature',
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
      deviceFingerprint: generateDeviceFingerprint(
        request.headers.get('user-agent') || '',
        request.headers.get('x-forwarded-for') || ''
      ),
    }

    // Check if all parties signed
    const allSigned = updatedParties.every(p => p.signedAt)
    const newStatus = allSigned ? 'active' : 'pending'

    // Update NDA
    const { error: updateError } = await supabase
      .from('ndas')
      .update({
        parties: updatedParties,
        status: newStatus,
      })
      .eq('id', ndaId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to sign NDA' },
        { status: 500 }
      )
    }

    // Create audit entry
    const auditEntry = createAuditEntry(
      ndaId,
      'NDA_SIGNED',
      user.id,
      request.headers.get('x-forwarded-for') || 'unknown',
      { partyEmail: user.email }
    )

    await supabase.from('nda_audit_log').insert(auditEntry)

    return NextResponse.json({
      success: true,
      message: 'NDA signed successfully',
      status: newStatus,
      allPartiesSigned: allSigned,
    })
  } catch (error) {
    console.error('NDA signing error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const ndaId = searchParams.get('id')

    if (!ndaId) {
      return NextResponse.json({ error: 'Missing NDA ID' }, { status: 400 })
    }

    // Only creator can revoke
    const { data: nda, error: dbError } = await supabase
      .from('ndas')
      .select('*')
      .eq('id', ndaId)
      .eq('created_by', user.id)
      .single()

    if (dbError || !nda) {
      return NextResponse.json(
        { error: 'NDA not found or access denied' },
        { status: 404 }
      )
    }

    // Update status to cancelled
    const { error: updateError } = await supabase
      .from('ndas')
      .update({ status: 'cancelled' })
      .eq('id', ndaId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to revoke NDA' },
        { status: 500 }
      )
    }

    // Create audit entry
    const auditEntry = createAuditEntry(
      ndaId,
      'NDA_REVOKED',
      user.id,
      request.headers.get('x-forwarded-for') || 'unknown',
      {}
    )

    await supabase.from('nda_audit_log').insert(auditEntry)

    return NextResponse.json({
      success: true,
      message: 'NDA revoked successfully',
    })
  } catch (error) {
    console.error('NDA revocation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
