import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'

// Vercel Cron Job - Executa diariamente para verificar Last Wills
// Configure em vercel.json: { "crons": [{ "path": "/api/cron/last-will", "schedule": "0 9 * * *" }] }

export async function GET(request: NextRequest) {
  // Verificar authorization para CRON (Vercel envia header especial)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  // Em produção, validar o secret
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    // Permitir em desenvolvimento
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  
  const supabase = createClient()
  const results = {
    checked: 0,
    triggered: 0,
    warnings_sent: 0,
    errors: [] as string[]
  }
  
  try {
    // 1. Buscar todos os Last Wills ativos com trigger 'no_checkin'
    const { data: lastWills, error } = await supabase
      .from('vault_items')
      .select(`
        *,
        clients (id, code_name, name, phone, email)
      `)
      .eq('is_last_will', true)
      .eq('status', 'active')
      .eq('last_will_trigger', 'no_checkin')
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    results.checked = lastWills?.length || 0
    
    for (const item of lastWills || []) {
      const lastCheckin = item.last_will_last_checkin 
        ? new Date(item.last_will_last_checkin)
        : new Date(item.created_at)
      
      const checkinDays = item.last_will_checkin_days || 30
      const daysSince = Math.floor((Date.now() - lastCheckin.getTime()) / (1000 * 60 * 60 * 24))
      const daysRemaining = checkinDays - daysSince
      
      // TRIGGER: Se passou do prazo de check-in
      if (daysRemaining <= 0) {
        try {
          await triggerLastWillDelivery(supabase, item)
          results.triggered++
        } catch (err: any) {
          results.errors.push(`Failed to trigger ${item.item_code}: ${err.message}`)
        }
      }
      // WARNING: Se faltam 7 dias ou menos
      else if (daysRemaining <= 7) {
        try {
          await sendCheckinReminder(supabase, item, daysRemaining)
          results.warnings_sent++
        } catch (err: any) {
          results.errors.push(`Failed to send warning for ${item.item_code}: ${err.message}`)
        }
      }
    }
    
    // 2. Verificar Last Wills com trigger 'specific_date'
    const { data: dateTriggered } = await supabase
      .from('vault_items')
      .select(`
        *,
        clients (id, code_name, name, phone, email)
      `)
      .eq('is_last_will', true)
      .eq('status', 'active')
      .eq('last_will_trigger', 'specific_date')
      .lte('deliver_at', new Date().toISOString())
    
    for (const item of dateTriggered || []) {
      try {
        await triggerLastWillDelivery(supabase, item)
        results.triggered++
      } catch (err: any) {
        results.errors.push(`Failed to trigger dated ${item.item_code}: ${err.message}`)
      }
    }
    
    // Log do CRON
    try {
      await supabase.from('cron_logs').insert({
        job_name: 'last-will-check',
        executed_at: new Date().toISOString(),
        results: results,
        success: results.errors.length === 0
      })
    } catch (e) {
      // Ignore se tabela não existe
    }
    
    return NextResponse.json({
      success: true,
      message: 'Last Will check completed',
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

// Função para disparar a entrega da Última Vontade
async function triggerLastWillDelivery(supabase: any, item: any) {
  const now = new Date().toISOString()
  
  // 1. Atualizar status do item para 'delivered'
  await supabase
    .from('vault_items')
    .update({
      status: 'delivered',
      delivered_at: now,
      updated_at: now
    })
    .eq('id', item.id)
  
  // 2. Criar registro de entrega/evento
  try {
    await supabase.from('last_will_deliveries').insert({
      vault_item_id: item.id,
      client_id: item.client_id,
      client_code: item.clients?.code_name || 'UNKNOWN',
      recipient_name: item.last_will_recipient_name,
      recipient_phone: item.last_will_recipient_phone,
      recipient_email: item.last_will_recipient_email,
      message: item.last_will_message,
      trigger_type: item.last_will_trigger,
      triggered_at: now,
      delivery_status: 'pending',
      notification_sent: false
    })
  } catch (e) {
    // Tabela pode não existir ainda
  }
  
  // 3. Enviar SMS para destinatário (se Twilio configurado)
  if (item.last_will_recipient_phone && process.env.TWILIO_ACCOUNT_SID) {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: item.last_will_recipient_phone,
          message: `Você recebeu uma mensagem importante de alguém especial através do Discreet Courier. ` +
                   `Por favor, entre em contato conosco para receber sua entrega. Código: ${item.item_code}`
        })
      })
      
      if (response.ok) {
        // Log SMS enviado
        try {
          await supabase.from('secure_messages').insert({
            client_id: item.client_id,
            sender_type: 'system',
            content: `Last Will SMS sent to ${item.last_will_recipient_name} - Code: ${item.item_code}`,
            encrypted: false
          })
        } catch (e) {
          // Ignore
        }
      }
    } catch (smsError) {
      console.error('SMS send failed:', smsError)
    }
  }
  
  // 4. Enviar email para destinatário (se configurado)
  if (item.last_will_recipient_email) {
    try {
      await sendEmail({
        to: item.last_will_recipient_email,
        template: 'lastWillDelivery',
        data: {
          recipient_name: item.last_will_recipient_name || 'Recipient',
          sender_name: item.clients?.code_name || 'Someone special',
          item_code: item.item_code,
          message: item.last_will_message || 'You have received a private message.',
          pickup_instructions: 'Please contact Discreet Courier to arrange secure delivery of your package.',
        }
      })
      
      // Log email enviado
      try {
        await supabase.from('email_logs').insert({
          to_email: item.last_will_recipient_email,
          template: 'lastWillDelivery',
          status: 'sent',
          sent_at: new Date().toISOString()
        })
      } catch (e) {
        // Ignore if table doesn't exist
      }
    } catch (emailError) {
      console.error('Email send failed:', emailError)
    }
  }
  
  return { success: true, item_code: item.item_code }
}

// Função para enviar lembrete de check-in
async function sendCheckinReminder(supabase: any, item: any, daysRemaining: number) {
  const clientPhone = item.clients?.phone
  const clientEmail = item.clients?.email
  
  // Enviar SMS de lembrete ao cliente
  if (clientPhone && process.env.TWILIO_ACCOUNT_SID) {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: clientPhone,
          message: `[Discreet Courier] Lembrete: Seu Last Will (${item.item_code}) requer check-in em ${daysRemaining} dias. ` +
                   `Faça check-in para confirmar que está bem. Código: ${item.clients?.code_name || 'VIP'}`
        })
      })
    } catch (smsError) {
      console.error('Reminder SMS failed:', smsError)
    }
  }
  
  // Enviar email de lembrete ao cliente
  if (clientEmail) {
    try {
      await sendEmail({
        to: clientEmail,
        template: 'checkinReminder',
        data: {
          client_name: item.clients?.code_name || item.clients?.name || 'Valued Client',
          item_code: item.item_code,
          days_remaining: daysRemaining,
          checkin_url: `${process.env.NEXT_PUBLIC_APP_URL || ''}/portal/vault/checkin?code=${item.item_code}`,
        }
      })
    } catch (emailError) {
      console.error('Reminder email failed:', emailError)
    }
  }
  
  // Registrar que lembrete foi enviado
  try {
    await supabase.from('notification_logs').insert({
      delivery_id: null,
      title: 'Last Will Check-in Reminder',
      body: `Reminder sent to client for ${item.item_code}. ${daysRemaining} days remaining.`,
      status: 'sent',
      sent_at: new Date().toISOString()
    })
  } catch (e) {
    // Ignore
  }
  
  return { success: true }
}

// POST - Trigger manual (para admin)
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const { item_id, trigger_reason = 'manual' } = body
  
  if (!item_id) {
    return NextResponse.json({ error: 'item_id is required' }, { status: 400 })
  }
  
  // Buscar o item
  const { data: item, error } = await supabase
    .from('vault_items')
    .select(`
      *,
      clients (id, code_name, name, phone, email)
    `)
    .eq('id', item_id)
    .eq('is_last_will', true)
    .single()
  
  if (error || !item) {
    return NextResponse.json({ error: 'Last Will not found' }, { status: 404 })
  }
  
  if (item.status !== 'active') {
    return NextResponse.json({ error: 'Last Will is not active' }, { status: 400 })
  }
  
  try {
    await triggerLastWillDelivery(supabase, item)
    
    return NextResponse.json({
      success: true,
      message: 'Last Will delivery triggered',
      item_code: item.item_code,
      recipient: item.last_will_recipient_name,
      trigger_reason,
      triggered_at: new Date().toISOString()
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
