import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { UserDataExport, createAuditLog } from '@/lib/gdpr-compliance'

// GET - Export all user data (GDPR Right to Data Portability)
export async function GET(request: NextRequest) {
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

    // Get all deliveries
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('*')
      .eq('client_id', profile.id)
      .order('created_at', { ascending: false })

    // Get all payments
    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('client_id', profile.id)
      .order('created_at', { ascending: false })

    // Get consent preferences from localStorage (client-side only)
    // For server-side, we'll include a placeholder
    const consents = {
      essential: true,
      analytics: false,
      marketing: false,
      timestamp: new Date().toISOString(),
      version: '1.0'
    }

    // Create audit log for data export
    const auditLog = createAuditLog(
      profile.id,
      profile.email,
      'export',
      'user_data',
      profile.id,
      { format: 'json', ipAddress: request.headers.get('x-forwarded-for') || 'unknown' }
    )

    // Save audit log
    await supabase.from('audit_logs').insert(auditLog)

    // Compile all user data
    const exportData: UserDataExport = {
      exportDate: new Date().toISOString(),
      userId: profile.id,
      email: profile.email,
      personalData: {
        name: profile.name,
        email: profile.email,
        phone: profile.phone || '',
        company: profile.company || '',
        createdAt: profile.created_at
      },
      deliveries: deliveries || [],
      payments: payments || [],
      consents,
      auditLogs: [auditLog]
    }

    // Return data as JSON
    return NextResponse.json({
      success: true,
      data: exportData,
      exportDate: exportData.exportDate,
      message: 'Your data has been exported successfully'
    })

  } catch (error: any) {
    console.error('GDPR Export Error:', error)
    return NextResponse.json({ 
      error: 'Failed to export data',
      message: error.message 
    }, { status: 500 })
  }
}
