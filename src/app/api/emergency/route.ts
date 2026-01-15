import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Listar protocolos de emergência
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const client_id = searchParams.get('client_id')
  const active_only = searchParams.get('active') !== 'false'
  
  let query = supabase
    .from('emergency_protocols')
    .select(`
      *,
      clients (id, code_name, name, phone, email, direct_line)
    `)
    .order('created_at', { ascending: false })
  
  if (client_id) query = query.eq('client_id', client_id)
  if (active_only) query = query.eq('is_active', true)
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// POST - Criar protocolo de emergência
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    client_id,
    protocol_name,
    trigger_condition,
    actions,
    emergency_contacts
  } = body
  
  if (!client_id || !protocol_name || !trigger_condition || !actions) {
    return NextResponse.json(
      { error: 'client_id, protocol_name, trigger_condition, and actions are required' },
      { status: 400 }
    )
  }
  
  const { data, error } = await supabase
    .from('emergency_protocols')
    .insert({
      client_id,
      protocol_name,
      trigger_condition,
      actions,
      emergency_contacts,
      is_active: true,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}

// PATCH - Atualizar ou disparar protocolo
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const { id, trigger, ...updateFields } = body
  
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }
  
  // Se for para disparar o protocolo
  if (trigger) {
    const { data: protocol, error: fetchError } = await supabase
      .from('emergency_protocols')
      .select('*, clients(id, code_name, name, phone, email)')
      .eq('id', id)
      .single()
    
    if (fetchError || !protocol) {
      return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })
    }

    const now = new Date().toISOString()
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const client = protocol.clients as any
    const executedActions: any[] = []
    
    // Atualizar last_triggered_at
    await supabase
      .from('emergency_protocols')
      .update({
        last_triggered_at: now,
        updated_at: now
      })
      .eq('id', id)
    
    // EXECUTAR AÇÕES REAIS DO PROTOCOLO
    const actions = protocol.actions as any[] || []
    
    for (const action of actions) {
      const actionType = action.type || action
      
      switch (actionType) {
        case 'sms_client':
          // SMS para o cliente
          if (client?.phone) {
            const res = await fetch(`${baseUrl}/api/sms`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: client.phone,
                message: `🆘 EMERGENCY PROTOCOL "${protocol.protocol_name}" ACTIVATED. ${action.message || 'Immediate action required.'}`
              })
            }).catch(() => null)
            executedActions.push({ type: 'sms_client', success: res?.ok || false })
          }
          break

        case 'sms_contacts':
          // SMS para contatos de emergência
          const contacts = protocol.emergency_contacts as any[] || []
          for (const contact of contacts) {
            if (contact.phone) {
              const res = await fetch(`${baseUrl}/api/sms`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  to: contact.phone,
                  message: `🆘 EMERGENCY: ${client?.code_name || client?.name || 'Client'} triggered protocol "${protocol.protocol_name}". ${action.message || 'Please respond immediately.'}`
                })
              }).catch(() => null)
              executedActions.push({ type: 'sms_contact', contact: contact.name, success: res?.ok || false })
            }
          }
          break

        case 'call_ai':
          // Ligação via Bland.AI
          const phoneToCall = action.phone || client?.phone
          if (phoneToCall) {
            const res = await fetch(`${baseUrl}/api/bland`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                phone_number: phoneToCall,
                call_type: 'emergency',
                client_id: protocol.client_id,
                custom_prompt: action.script || `This is an emergency call regarding protocol ${protocol.protocol_name}. Please confirm your safety status.`
              })
            }).catch(() => null)
            executedActions.push({ type: 'call_ai', success: res?.ok || false })
          }
          break

        case 'notify_admin':
          // Notificar admin
          if (process.env.ADMIN_PHONE) {
            await fetch(`${baseUrl}/api/sms`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: process.env.ADMIN_PHONE,
                message: `🔴 EMERGENCY TRIGGERED: ${client?.code_name || 'Unknown'} - Protocol: ${protocol.protocol_name}`
              })
            }).catch(() => null)
            executedActions.push({ type: 'notify_admin', success: true })
          }
          break

        case 'destroy_data':
          // Destruir dados do cliente
          await fetch(`${baseUrl}/api/destruction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              client_id: protocol.client_id,
              reason: `Emergency protocol: ${protocol.protocol_name}`
            })
          }).catch(() => null)
          executedActions.push({ type: 'destroy_data', success: true })
          break

        case 'deliver_vault':
          // Entregar itens do vault
          await fetch(`${baseUrl}/api/cron/last-will`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.CRON_SECRET}`
            },
            body: JSON.stringify({ client_id: protocol.client_id, force: true })
          }).catch(() => null)
          executedActions.push({ type: 'deliver_vault', success: true })
          break
      }
    }

    // Registrar execução
    await supabase.from('emergency_logs').insert({
      protocol_id: id,
      client_id: protocol.client_id,
      protocol_name: protocol.protocol_name,
      actions_executed: executedActions,
      triggered_at: now
    })
    
    return NextResponse.json({
      success: true,
      message: 'Emergency protocol triggered and executed',
      protocol_name: protocol.protocol_name,
      actions_executed: executedActions,
      emergency_contacts: protocol.emergency_contacts,
      triggered_at: now
    })
  }
  
  // Atualização normal
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString()
  }
  
  if (updateFields.protocol_name) updateData.protocol_name = updateFields.protocol_name
  if (updateFields.trigger_condition) updateData.trigger_condition = updateFields.trigger_condition
  if (updateFields.actions) updateData.actions = updateFields.actions
  if (updateFields.emergency_contacts) updateData.emergency_contacts = updateFields.emergency_contacts
  if (typeof updateFields.is_active === 'boolean') updateData.is_active = updateFields.is_active
  
  const { data, error } = await supabase
    .from('emergency_protocols')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// DELETE - Desativar protocolo
export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }
  
  const { error } = await supabase
    .from('emergency_protocols')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true, message: 'Protocol deactivated' })
}
