import { NextRequest, NextResponse } from 'next/server'
import { encrypt, decrypt, encryptForStorage, decryptFromStorage, isEncryptionConfigured, generateSecureToken } from '@/lib/encryption'
import { createClient } from '@/lib/supabase/server'

// POST - Encrypt data for vault storage
export async function POST(request: NextRequest) {
  if (!isEncryptionConfigured()) {
    return NextResponse.json({ 
      error: 'Encryption not configured',
      message: 'Set ENCRYPTION_KEY environment variable'
    }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { data, vaultItemId, action = 'encrypt' } = body

    if (!data) {
      return NextResponse.json({ error: 'Data required' }, { status: 400 })
    }

    if (action === 'decrypt') {
      const decrypted = decryptFromStorage(data)
      return NextResponse.json({ 
        success: true,
        decrypted 
      })
    }

    // Encrypt the data
    const encrypted = encryptForStorage(typeof data === 'string' ? data : JSON.stringify(data))

    // If vaultItemId provided, update the vault item
    if (vaultItemId) {
      const supabase = createClient()
      await supabase
        .from('vault_items')
        .update({ 
          encrypted_content: encrypted,
          is_encrypted: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', vaultItemId)
    }

    return NextResponse.json({
      success: true,
      encrypted,
      length: encrypted.length
    })

  } catch (error: any) {
    console.error('Encryption error:', error)
    return NextResponse.json({ 
      error: 'Encryption failed',
      message: error.message 
    }, { status: 500 })
  }
}

// GET - Check encryption status
export async function GET() {
  return NextResponse.json({
    configured: isEncryptionConfigured(),
    algorithm: 'AES-256-GCM',
    keyDerivation: 'scrypt',
    features: [
      'End-to-end encryption for vault items',
      'Secure key derivation with salt',
      'Authentication tags for integrity',
      'Per-item encryption keys supported'
    ]
  })
}
