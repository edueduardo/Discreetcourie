import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Listar cápsulas do tempo
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const client_id = searchParams.get('client_id')
  const status = searchParams.get('status')
  
  let query = supabase
    .from('vault_items')
    .select(`
      *,
      clients (id, code_name, name, phone, email)
    `)
    .eq('item_type', 'time_capsule')
    .order('deliver_at', { ascending: true })
  
  if (client_id) query = query.eq('client_id', client_id)
  if (status) query = query.eq('status', status)
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Calcular dias até entrega para cada cápsula
  const capsulesWithInfo = data?.map(item => {
    const deliverAt = item.deliver_at ? new Date(item.deliver_at) : null
    const daysUntilDelivery = deliverAt 
      ? Math.ceil((deliverAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null
    
    return {
      ...item,
      days_until_delivery: daysUntilDelivery,
      ready_for_delivery: daysUntilDelivery !== null && daysUntilDelivery <= 0,
      delivery_soon: daysUntilDelivery !== null && daysUntilDelivery <= 7 && daysUntilDelivery > 0
    }
  })
  
  return NextResponse.json(capsulesWithInfo)
}

// POST - Criar cápsula do tempo
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    client_id,
    description,
    deliver_at, // Data de entrega
    recipient_name,
    recipient_phone,
    recipient_email,
    recipient_relation,
    message,
    storage_location,
    notes
  } = body
  
  if (!client_id || !deliver_at) {
    return NextResponse.json(
      { error: 'client_id and deliver_at are required' },
      { status: 400 }
    )
  }
  
  // Validar que a data é no futuro
  const deliveryDate = new Date(deliver_at)
  if (deliveryDate <= new Date()) {
    return NextResponse.json(
      { error: 'deliver_at must be a future date' },
      { status: 400 }
    )
  }
  
  const item_code = `TC-${Date.now().toString(36).toUpperCase()}`
  
  const { data, error } = await supabase
    .from('vault_items')
    .insert({
      client_id,
      item_code,
      description: description || 'Time Capsule',
      item_type: 'time_capsule',
      deliver_at: deliveryDate.toISOString(),
      last_will_recipient_name: recipient_name,
      last_will_recipient_phone: recipient_phone,
      last_will_recipient_email: recipient_email,
      last_will_recipient_relation: recipient_relation,
      last_will_message: message,
      storage_location,
      notes,
      status: 'active',
      stored_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  const daysUntilDelivery = Math.ceil(
    (deliveryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  
  return NextResponse.json({
    success: true,
    message: 'Time Capsule created successfully',
    data,
    deliver_at: deliveryDate.toISOString(),
    days_until_delivery: daysUntilDelivery
  }, { status: 201 })
}

// PATCH - Atualizar cápsula do tempo
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const { id, status, ...updateFields } = body
  
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }
  
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString()
  }
  
  if (status) updateData.status = status
  if (status === 'delivered') updateData.delivered_at = new Date().toISOString()
  
  if (updateFields.deliver_at) updateData.deliver_at = updateFields.deliver_at
  if (updateFields.description) updateData.description = updateFields.description
  if (updateFields.recipient_name) updateData.last_will_recipient_name = updateFields.recipient_name
  if (updateFields.recipient_phone) updateData.last_will_recipient_phone = updateFields.recipient_phone
  if (updateFields.message) updateData.last_will_message = updateFields.message
  if (updateFields.notes) updateData.notes = updateFields.notes
  
  const { data, error } = await supabase
    .from('vault_items')
    .update(updateData)
    .eq('id', id)
    .eq('item_type', 'time_capsule')
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
