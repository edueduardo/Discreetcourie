import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Vercel Cron Job - Executa diariamente para verificar Time Capsules
// Schedule: "0 10 * * *" (todo dia às 10h)

export async function GET(request: NextRequest) {
  // Verificar authorization para CRON
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  
  const supabase = createClient()
  const results = {
    checked: 0,
    delivered: 0,
    reminders_sent: 0,
    errors: [] as string[]
  }
  
  try {
    // 1. Buscar todas as Time Capsules ativas
    const { data: capsules, error } = await supabase
      .from('vault_items')
      .select(`
        *,
        clients (id, code_name, name, phone, email)
      `)
      .eq('item_type', 'time_capsule')
      .eq('status', 'active')
      .not('deliver_at', 'is', null)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    results.checked = capsules?.length || 0
    const now = new Date()
    
    for (const capsule of capsules || []) {
      const deliverAt = new Date(capsule.deliver_at)
      const daysUntil = Math.ceil((deliverAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      // DELIVER: Se a data chegou ou passou
      if (daysUntil <= 0) {
        try {
          await deliverTimeCapsule(supabase, capsule)
          results.delivered++
        } catch (err: any) {
          results.errors.push(`Failed to deliver ${capsule.item_code}: ${err.message}`)
        }
      }
      // REMINDER: Se faltam 7 dias ou menos
      else if (daysUntil <= 7) {
        try {
          await sendDeliveryReminder(supabase, capsule, daysUntil)
          results.reminders_sent++
        } catch (err: any) {
          results.errors.push(`Failed to send reminder for ${capsule.item_code}: ${err.message}`)
        }
      }
    }
    
    // Log do CRON
    try {
      await supabase.from('cron_logs').insert({
        job_name: 'time-capsule-check',
        executed_at: new Date().toISOString(),
        results: results,
        success: results.errors.length === 0
      })
    } catch (e) {
      // Ignore
    }
    
    return NextResponse.json({
      success: true,
      message: 'Time Capsule check completed',
      ...results,
      executed_at: new Date().toISOString()
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'CRON job failed',
      message: error.message 
    }, { status: 500 })
  }
}

// Função para entregar a Time Capsule
async function deliverTimeCapsule(supabase: any, capsule: any) {
  const now = new Date().toISOString()
  
  // 1. Atualizar status para 'delivered'
  await supabase
    .from('vault_items')
    .update({
      status: 'delivered',
      delivered_at: now,
      updated_at: now
    })
    .eq('id', capsule.id)
  
  // 2. Criar registro de entrega
  try {
    await supabase.from('time_capsule_deliveries').insert({
      vault_item_id: capsule.id,
      client_id: capsule.client_id,
      client_code: capsule.clients?.code_name || 'UNKNOWN',
      recipient_name: capsule.last_will_recipient_name,
      recipient_phone: capsule.last_will_recipient_phone,
      recipient_email: capsule.last_will_recipient_email,
      message: capsule.last_will_message,
      scheduled_date: capsule.deliver_at,
      delivered_at: now,
      delivery_status: 'pending_pickup',
      notification_sent: false
    })
  } catch (e) {
    // Tabela pode não existir
  }
  
  // 3. Notificar destinatário via SMS
  if (capsule.last_will_recipient_phone && process.env.TWILIO_ACCOUNT_SID) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: capsule.last_will_recipient_phone,
          message: `🎁 Uma Cápsula do Tempo foi aberta para você! ` +
                   `Alguém especial preparou uma surpresa que estava guardada aguardando este momento. ` +
                   `Entre em contato com Discreet Courier para receber. Código: ${capsule.item_code}`
        })
      })
      
      // Log
      try {
        await supabase.from('secure_messages').insert({
          client_id: capsule.client_id,
          sender_type: 'system',
          content: `Time Capsule delivered - SMS sent to ${capsule.last_will_recipient_name}`,
          encrypted: false
        })
      } catch (e) {}
    } catch (smsError) {
      console.error('SMS failed:', smsError)
    }
  }
  
  // 4. Notificar cliente que a cápsula foi entregue
  if (capsule.clients?.phone && process.env.TWILIO_ACCOUNT_SID) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: capsule.clients.phone,
          message: `[Discreet Courier] Sua Cápsula do Tempo (${capsule.item_code}) foi entregue ao destinatário conforme agendado.`
        })
      })
    } catch (e) {}
  }
  
  return { success: true, item_code: capsule.item_code }
}

// Função para enviar lembrete de entrega próxima
async function sendDeliveryReminder(supabase: any, capsule: any, daysUntil: number) {
  const clientPhone = capsule.clients?.phone
  
  // Notificar cliente que entrega está próxima
  if (clientPhone && process.env.TWILIO_ACCOUNT_SID) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: clientPhone,
          message: `[Discreet Courier] Lembrete: Sua Cápsula do Tempo (${capsule.item_code}) ` +
                   `será entregue em ${daysUntil} dia(s). ` +
                   `Destinatário: ${capsule.last_will_recipient_name}`
        })
      })
    } catch (e) {}
  }
  
  // Log
  try {
    await supabase.from('notification_logs').insert({
      delivery_id: null,
      title: 'Time Capsule Delivery Reminder',
      body: `Reminder sent for ${capsule.item_code}. ${daysUntil} days until delivery.`,
      status: 'sent',
      sent_at: new Date().toISOString()
    })
  } catch (e) {}
  
  return { success: true }
}

// POST - Entrega manual (para admin)
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const { item_id } = body
  
  if (!item_id) {
    return NextResponse.json({ error: 'item_id is required' }, { status: 400 })
  }
  
  const { data: capsule, error } = await supabase
    .from('vault_items')
    .select(`
      *,
      clients (id, code_name, name, phone, email)
    `)
    .eq('id', item_id)
    .eq('item_type', 'time_capsule')
    .single()
  
  if (error || !capsule) {
    return NextResponse.json({ error: 'Time Capsule not found' }, { status: 404 })
  }
  
  if (capsule.status !== 'active') {
    return NextResponse.json({ error: 'Time Capsule is not active' }, { status: 400 })
  }
  
  try {
    await deliverTimeCapsule(supabase, capsule)
    
    return NextResponse.json({
      success: true,
      message: 'Time Capsule delivered manually',
      item_code: capsule.item_code,
      recipient: capsule.last_will_recipient_name,
      delivered_at: new Date().toISOString()
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
