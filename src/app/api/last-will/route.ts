import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Listar últimas vontades
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const client_id = searchParams.get('client_id')
  
  let query = supabase
    .from('vault_items')
    .select(`
      *,
      clients (id, code_name, name, phone, email)
    `)
    .eq('is_last_will', true)
    .order('created_at', { ascending: false })
  
  if (client_id) query = query.eq('client_id', client_id)
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Calcular status de check-in para cada item
  const itemsWithStatus = data?.map(item => {
    const lastCheckin = item.last_will_last_checkin 
      ? new Date(item.last_will_last_checkin)
      : new Date(item.created_at)
    
    const daysSinceCheckin = Math.floor(
      (Date.now() - lastCheckin.getTime()) / (1000 * 60 * 60 * 24)
    )
    
    const checkinDays = item.last_will_checkin_days || 30
    const daysUntilTrigger = checkinDays - daysSinceCheckin
    
    return {
      ...item,
      days_since_checkin: daysSinceCheckin,
      days_until_trigger: Math.max(0, daysUntilTrigger),
      needs_checkin: daysUntilTrigger <= 7,
      overdue: daysUntilTrigger <= 0
    }
  })
  
  return NextResponse.json(itemsWithStatus)
}

// POST - Criar última vontade
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    client_id,
    description,
    recipient_name,
    recipient_phone,
    recipient_email,
    recipient_relation,
    message,
    trigger = 'no_checkin',
    checkin_days = 30,
    deliver_at, // Para trigger = 'date'
    storage_location
  } = body
  
  if (!client_id || !recipient_name) {
    return NextResponse.json(
      { error: 'client_id and recipient_name are required' },
      { status: 400 }
    )
  }
  
  const item_code = `LW-${Date.now().toString(36).toUpperCase()}`
  
  const { data, error } = await supabase
    .from('vault_items')
    .insert({
      client_id,
      item_code,
      description: description || 'Last Will Package',
      item_type: 'last_will',
      is_last_will: true,
      last_will_recipient_name: recipient_name,
      last_will_recipient_phone: recipient_phone,
      last_will_recipient_email: recipient_email,
      last_will_recipient_relation: recipient_relation,
      last_will_message: message,
      last_will_trigger: trigger,
      last_will_checkin_days: checkin_days,
      last_will_last_checkin: new Date().toISOString(),
      deliver_at: trigger === 'date' ? deliver_at : null,
      storage_location,
      status: 'active',
      stored_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({
    success: true,
    message: 'Last Will created successfully',
    data,
    next_checkin_due: new Date(Date.now() + checkin_days * 24 * 60 * 60 * 1000).toISOString()
  }, { status: 201 })
}

// PATCH - Atualizar última vontade
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const { id, ...updateFields } = body
  
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }
  
  // Mapear campos do body para campos do banco
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString()
  }
  
  if (updateFields.recipient_name) updateData.last_will_recipient_name = updateFields.recipient_name
  if (updateFields.recipient_phone) updateData.last_will_recipient_phone = updateFields.recipient_phone
  if (updateFields.recipient_email) updateData.last_will_recipient_email = updateFields.recipient_email
  if (updateFields.recipient_relation) updateData.last_will_recipient_relation = updateFields.recipient_relation
  if (updateFields.message) updateData.last_will_message = updateFields.message
  if (updateFields.trigger) updateData.last_will_trigger = updateFields.trigger
  if (updateFields.checkin_days) updateData.last_will_checkin_days = updateFields.checkin_days
  if (updateFields.description) updateData.description = updateFields.description
  if (updateFields.storage_location) updateData.storage_location = updateFields.storage_location
  
  const { data, error } = await supabase
    .from('vault_items')
    .update(updateData)
    .eq('id', id)
    .eq('is_last_will', true)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
