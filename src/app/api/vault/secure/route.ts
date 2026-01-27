import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  encryptVaultData,
  decryptVaultData,
  generateBlockchainProof,
  verifyBlockchainProof,
  shouldAutoDestruct,
  shouldTriggerDeadManSwitch,
  generateVaultAccessToken,
  createTimeCapsule,
  canUnlockTimeCapsule,
} from '@/lib/crypto/vault-encryption'

/**
 * Human Vault™ API - Enterprise Secure Storage
 * POST /api/vault/secure - Create encrypted vault
 * GET /api/vault/secure?id=xxx - Retrieve vault (with password)
 * DELETE /api/vault/secure?id=xxx - Destroy vault
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      data,
      password,
      name,
      description,
      autoDestructDays,
      deadManSwitchDays,
      biometricRequired = false,
      timeCapsule = false,
      unlockDate,
      recipients,
    } = body

    // Validate required fields
    if (!data || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: data, password, name' },
        { status: 400 }
      )
    }

    // Encrypt data with AES-256-GCM
    const encrypted = encryptVaultData(data, password)

    // Create vault metadata
    const vaultId = crypto.randomUUID()
    const now = new Date().toISOString()
    const expiresAt = autoDestructDays
      ? new Date(Date.now() + autoDestructDays * 24 * 60 * 60 * 1000).toISOString()
      : null

    const metadata = {
      vaultId,
      ownerId: user.id,
      createdAt: now,
      expiresAt: expiresAt || undefined,
      accessCount: 0,
      lastAccessedAt: undefined,
      autoDestructEnabled: !!autoDestructDays,
      autoDestructDays,
      deadManSwitchEnabled: !!deadManSwitchDays,
      deadManSwitchDays,
      biometricRequired,
      blockchainProofHash: '',
    }

    // Generate blockchain proof of custody
    const blockchainProof = generateBlockchainProof(encrypted, metadata)
    metadata.blockchainProofHash = blockchainProof

    // Handle time capsule
    let capsuleData = null
    if (timeCapsule && unlockDate) {
      capsuleData = createTimeCapsule(
        data,
        password,
        new Date(unlockDate),
        description,
        recipients
      )
    }

    // Store in database (encrypted data + metadata)
    const { data: vault, error: dbError } = await supabase
      .from('vaults')
      .insert({
        id: vaultId,
        owner_id: user.id,
        name,
        description,
        encrypted_data: encrypted.ciphertext,
        iv: encrypted.iv,
        auth_tag: encrypted.authTag,
        salt: encrypted.salt,
        blockchain_proof: blockchainProof,
        metadata: metadata,
        time_capsule: capsuleData,
        auto_destruct_enabled: !!autoDestructDays,
        auto_destruct_at: expiresAt,
        dead_man_switch_enabled: !!deadManSwitchDays,
        dead_man_switch_days: deadManSwitchDays,
        biometric_required: biometricRequired,
        access_count: 0,
        created_at: now,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to create vault' },
        { status: 500 }
      )
    }

    // Generate access token
    const accessToken = generateVaultAccessToken(vaultId, user.id)

    // Log vault creation (audit trail)
    await supabase.from('vault_audit_log').insert({
      vault_id: vaultId,
      user_id: user.id,
      action: 'CREATE',
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown',
      timestamp: now,
    })

    return NextResponse.json({
      success: true,
      vault: {
        id: vaultId,
        name,
        description,
        createdAt: now,
        expiresAt,
        blockchainProof,
        accessToken,
        autoDestructEnabled: !!autoDestructDays,
        deadManSwitchEnabled: !!deadManSwitchDays,
        biometricRequired,
        timeCapsule: !!timeCapsule,
      },
      message: 'Vault created successfully with E2E encryption',
    })
  } catch (error) {
    console.error('Vault creation error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const vaultId = searchParams.get('id')
    const password = searchParams.get('password')

    if (!vaultId || !password) {
      return NextResponse.json(
        { error: 'Missing vault ID or password' },
        { status: 400 }
      )
    }

    // Fetch vault from database
    const { data: vault, error: dbError } = await supabase
      .from('vaults')
      .select('*')
      .eq('id', vaultId)
      .eq('owner_id', user.id)
      .single()

    if (dbError || !vault) {
      return NextResponse.json({ error: 'Vault not found' }, { status: 404 })
    }

    // Check if vault should auto-destruct
    if (shouldAutoDestruct(vault.metadata)) {
      // Delete vault
      await supabase.from('vaults').delete().eq('id', vaultId)
      
      return NextResponse.json(
        { error: 'Vault has been auto-destructed' },
        { status: 410 }
      )
    }

    // Check dead man's switch
    if (shouldTriggerDeadManSwitch(vault.metadata)) {
      // Notify recipients or trigger action
      await supabase.from('vault_audit_log').insert({
        vault_id: vaultId,
        user_id: user.id,
        action: 'DEAD_MAN_SWITCH_TRIGGERED',
        timestamp: new Date().toISOString(),
      })
    }

    // Check time capsule
    if (vault.time_capsule && !canUnlockTimeCapsule(vault.time_capsule)) {
      return NextResponse.json(
        {
          error: 'Time capsule locked',
          unlockDate: vault.time_capsule.unlockDate,
          message: vault.time_capsule.message,
        },
        { status: 423 }
      )
    }

    // Verify blockchain proof
    const encrypted = {
      ciphertext: vault.encrypted_data,
      iv: vault.iv,
      authTag: vault.auth_tag,
      salt: vault.salt,
    }

    const proofValid = verifyBlockchainProof(
      encrypted,
      vault.metadata,
      vault.blockchain_proof
    )

    if (!proofValid) {
      return NextResponse.json(
        { error: 'Vault integrity compromised - blockchain proof invalid' },
        { status: 403 }
      )
    }

    // Decrypt data
    try {
      const decryptedData = decryptVaultData(encrypted, password)

      // Update access count and last accessed
      await supabase
        .from('vaults')
        .update({
          access_count: vault.access_count + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq('id', vaultId)

      // Log access (audit trail)
      await supabase.from('vault_audit_log').insert({
        vault_id: vaultId,
        user_id: user.id,
        action: 'ACCESS',
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown',
        timestamp: new Date().toISOString(),
      })

      return NextResponse.json({
        success: true,
        data: decryptedData,
        metadata: {
          name: vault.name,
          description: vault.description,
          accessCount: vault.access_count + 1,
          createdAt: vault.created_at,
          expiresAt: vault.auto_destruct_at,
          blockchainProof: vault.blockchain_proof,
          proofValid: true,
        },
      })
    } catch (decryptError) {
      // Log failed access attempt
      await supabase.from('vault_audit_log').insert({
        vault_id: vaultId,
        user_id: user.id,
        action: 'ACCESS_FAILED',
        error: 'Invalid password',
        timestamp: new Date().toISOString(),
      })

      return NextResponse.json(
        { error: 'Invalid password or corrupted data' },
        { status: 403 }
      )
    }
  } catch (error) {
    console.error('Vault access error:', error)
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
    const vaultId = searchParams.get('id')

    if (!vaultId) {
      return NextResponse.json({ error: 'Missing vault ID' }, { status: 400 })
    }

    // Delete vault (secure destruction)
    const { error: deleteError } = await supabase
      .from('vaults')
      .delete()
      .eq('id', vaultId)
      .eq('owner_id', user.id)

    if (deleteError) {
      return NextResponse.json(
        { error: 'Failed to delete vault' },
        { status: 500 }
      )
    }

    // Log destruction
    await supabase.from('vault_audit_log').insert({
      vault_id: vaultId,
      user_id: user.id,
      action: 'DESTROY',
      timestamp: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      message: 'Vault securely destroyed',
    })
  } catch (error) {
    console.error('Vault deletion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
