import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

// CRON job para follow-up automático de leads
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient()
  const now = new Date()
  const results = {
    processed: 0,
    emailsSent: 0,
    callsScheduled: 0,
    errors: [] as string[]
  }

  try {
    // Buscar leads que precisam de follow-up
    // Leads criados há mais de 24h sem resposta
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // 1. First follow-up: 24h após criação
    const { data: firstFollowUp } = await supabase
      .from('leads')
      .select('*')
      .eq('status', 'new')
      .lt('created_at', oneDayAgo)
      .is('last_contact_at', null)
      .limit(50)

    for (const lead of firstFollowUp || []) {
      results.processed++
      
      if (lead.email) {
        await sendEmail({
          to: lead.email,
          template: 'welcome',
          variables: {
            recipientName: lead.name || 'Valued Client',
            actionUrl: `${process.env.NEXT_PUBLIC_APP_URL}/concierge`
          }
        })
        results.emailsSent++
      }

      // Update lead
      await supabase
        .from('leads')
        .update({ 
          last_contact_at: now.toISOString(),
          follow_up_count: 1,
          status: 'contacted'
        })
        .eq('id', lead.id)
    }

    // 2. Second follow-up: 3 dias sem resposta
    const { data: secondFollowUp } = await supabase
      .from('leads')
      .select('*')
      .eq('status', 'contacted')
      .eq('follow_up_count', 1)
      .lt('last_contact_at', threeDaysAgo)
      .limit(50)

    for (const lead of secondFollowUp || []) {
      results.processed++

      // Schedule Bland.AI call if phone available
      if (lead.phone) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/bland`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phone_number: lead.phone,
              call_type: 'reminder',
              custom_message: `Follow-up call for lead ${lead.name}. Ask about their interest in our services.`
            })
          })
          results.callsScheduled++
        } catch (e) {
          results.errors.push(`Call failed for lead ${lead.id}`)
        }
      }

      await supabase
        .from('leads')
        .update({ 
          last_contact_at: now.toISOString(),
          follow_up_count: 2
        })
        .eq('id', lead.id)
    }

    // 3. Final follow-up: 7 dias - mark as cold
    const { data: coldLeads } = await supabase
      .from('leads')
      .select('id')
      .in('status', ['new', 'contacted'])
      .lt('created_at', sevenDaysAgo)
      .limit(100)

    if (coldLeads && coldLeads.length > 0) {
      await supabase
        .from('leads')
        .update({ status: 'cold' })
        .in('id', coldLeads.map(l => l.id))
      
      results.processed += coldLeads.length
    }

    // Log CRON execution
    await supabase.from('cron_logs').insert({
      job_name: 'follow_up_leads',
      status: 'success',
      details: results,
      executed_at: now.toISOString()
    })

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      results
    })

  } catch (error: any) {

    
    await supabase.from('cron_logs').insert({
      job_name: 'follow_up_leads',
      status: 'error',
      details: { error: error.message },
      executed_at: now.toISOString()
    })

    return NextResponse.json({ 
      error: 'Follow-up CRON failed',
      message: error.message 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  return GET(request)
}
