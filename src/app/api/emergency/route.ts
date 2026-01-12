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
      .select('*')
      .eq('id', id)
      .single()
    
    if (fetchError || !protocol) {
      return NextResponse.json({ error: 'Protocol not found' }, { status: 404 })
    }
    
    // Atualizar last_triggered_at
    await supabase
      .from('emergency_protocols')
      .update({
        last_triggered_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
    
    // Aqui você implementaria as ações do protocolo
    // Por exemplo: enviar SMS, fazer ligação, notificar contatos, etc.
    
    return NextResponse.json({
      success: true,
      message: 'Emergency protocol triggered',
      protocol_name: protocol.protocol_name,
      actions: protocol.actions,
      emergency_contacts: protocol.emergency_contacts,
      triggered_at: new Date().toISOString()
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
