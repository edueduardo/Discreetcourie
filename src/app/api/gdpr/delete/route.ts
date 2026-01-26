import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { createAuditLog, anonymizeData } from '@/lib/gdpr-compliance'

// POST - Request account deletion (GDPR Right to be Forgotten)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('clients')
      .select('*')
      .eq('email', user.email)
      .single()

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Create audit log before deletion
    const auditLog = createAuditLog(
      profile.id,
      profile.email,
      'delete',
      'user_account',
      profile.id,
      { 
        reason: 'GDPR Right to be Forgotten',
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    )

    // Save audit log (will be retained for legal compliance)
    await supabase.from('audit_logs').insert(auditLog)

    // Anonymize user data instead of hard delete (for legal/audit trail)
    const anonymized = anonymizeData(profile)
    
    await supabase
      .from('clients')
      .update(anonymized)
      .eq('id', profile.id)

    // Mark deliveries as anonymized
    await supabase
      .from('deliveries')
      .update({
        client_id: null,
        pickup_contact: '[DELETED]',
        pickup_phone: '[DELETED]',
        delivery_contact: '[DELETED]',
        delivery_phone: '[DELETED]',
        anonymized_at: new Date().toISOString()
      })
      .eq('client_id', profile.id)

    // Delete auth user
    const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)
    
    if (deleteError) {
      console.error('Auth deletion error:', deleteError)
    }

    return NextResponse.json({
      success: true,
      message: 'Your account has been deleted. All personal data has been anonymized.',
      deletedAt: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('GDPR Delete Error:', error)
    return NextResponse.json({ 
      error: 'Failed to delete account',
      message: error.message 
    }, { status: 500 })
  }
}
