import { NextRequest, NextResponse } from 'next/server'
import { sendEmail, sendBulkEmails, EmailTemplate } from '@/lib/email'
import { createClient } from '@/lib/supabase/server'

// GET - Listar emails enviados (logs)
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  const limit = parseInt(searchParams.get('limit') || '50')

  try {
    let query = supabase
      .from('email_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (clientId) {
      query = query.eq('client_id', clientId)
    }

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ 
        error: 'Failed to fetch email logs',
        logs: [] 
      }, { status: 200 })
    }

    return NextResponse.json({ logs: data || [] })

  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      logs: [] 
    }, { status: 500 })
  }
}

// POST - Enviar email
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      to, 
      template, 
      variables = {},
      customSubject,
      clientId,
      bulk = false,
      emails = []
    } = body

    // Bulk send
    if (bulk && Array.isArray(emails) && emails.length > 0) {
      const results = await sendBulkEmails(emails)
      
      // Log bulk emails
      const supabase = createClient()
      await supabase.from('email_logs').insert({
        template: 'bulk',
        recipient: `${emails.length} recipients`,
        status: results.failed > 0 ? 'partial' : 'sent',
        metadata: { sent: results.sent, failed: results.failed }
      })

      return NextResponse.json({
        success: true,
        sent: results.sent,
        failed: results.failed
      })
    }

    // Single email
    if (!to) {
      return NextResponse.json({ error: 'Recipient email required' }, { status: 400 })
    }

    if (!template) {
      return NextResponse.json({ 
        error: 'Template required',
        availableTemplates: [
          'welcome', 'delivery_created', 'delivery_status', 'delivery_completed',
          'payment_received', 'payment_failed', 'subscription_created', 'subscription_cancelled',
          'guardian_alert', 'guardian_checkin_reminder', 'last_will_triggered', 'last_will_reminder',
          'time_capsule_delivered', 'time_capsule_reminder', 'vetting_approved', 'vetting_rejected',
          'emergency_triggered', 'destruction_complete'
        ]
      }, { status: 400 })
    }

    const result = await sendEmail({
      to,
      template: template as EmailTemplate,
      variables,
      customSubject
    })

    // Log email
    const supabase = createClient()
    await supabase.from('email_logs').insert({
      client_id: clientId || null,
      template,
      recipient: Array.isArray(to) ? to.join(', ') : to,
      subject: customSubject || template,
      status: result.success ? 'sent' : 'failed',
      message_id: result.messageId || null,
      error_message: result.error || null,
      metadata: variables
    })

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: result.error?.includes('not configured') ? 200 : 500 })
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId
    })

  } catch (error: any) {
    console.error('Email API error:', error)
    return NextResponse.json({ 
      error: 'Failed to send email',
      message: error.message 
    }, { status: 500 })
  }
}
