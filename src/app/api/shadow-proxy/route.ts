import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Procurador de Sombras - Agir, falar, representar no lugar do cliente
// Tipos: return_items, make_complaint, deliver_message, pick_up_items, confrontation, negotiation

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    client_id,
    proxy_type, // return_items, make_complaint, deliver_message, pick_up_items, confrontation, negotiation
    target_name,
    target_phone,
    target_address,
    target_relation, // ex, family, business, neighbor, etc
    mission_description,
    talking_points,
    items_involved,
    desired_outcome,
    boundaries, // What NOT to do/say
    client_script, // What client wants us to say
    backup_plan,
    price_quoted,
    notes
  } = body
  
  if (!client_id || !proxy_type || !mission_description) {
    return NextResponse.json({ error: 'client_id, proxy_type, and mission_description required' }, { status: 400 })
  }
  
  const now = new Date().toISOString()
  const mission_code = `SHADOW-${Date.now().toString(36).toUpperCase()}`
  
  // Criar missão
  const { data: mission, error } = await supabase
    .from('shadow_proxy_missions')
    .insert({
      mission_code,
      client_id,
      proxy_type,
      target_name,
      target_phone,
      target_address,
      target_relation,
      mission_description,
      talking_points,
      items_involved,
      desired_outcome,
      boundaries,
      client_script,
      backup_plan,
      price_quoted,
      notes,
      status: 'pending',
      created_at: now,
      updated_at: now
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Log de criação
  await supabase.from('shadow_proxy_logs').insert({
    mission_id: mission.id,
    action: 'Mission created',
    details: { proxy_type, target_name },
    created_at: now
  })
  
  return NextResponse.json({
    success: true,
    mission,
    message: 'Shadow proxy mission created'
  }, { status: 201 })
}

// GET - Listar missões
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const client_id = searchParams.get('client_id')
  const status = searchParams.get('status')
  const mission_code = searchParams.get('code')
  
  let query = supabase
    .from('shadow_proxy_missions')
    .select(`
      *,
      clients (id, code_name, name, phone),
      shadow_proxy_logs (id, action, details, created_at)
    `)
    .order('created_at', { ascending: false })
  
  if (client_id) query = query.eq('client_id', client_id)
  if (status) query = query.eq('status', status)
  if (mission_code) query = query.eq('mission_code', mission_code)
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data || [])
}

// PATCH - Atualizar missão
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    id,
    status,
    execution_notes,
    outcome_achieved,
    items_returned,
    target_response,
    evidence_photos,
    final_report,
    actual_price
  } = body
  
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }
  
  const now = new Date().toISOString()
  const updateData: Record<string, any> = { updated_at: now }
  
  if (status) updateData.status = status
  if (execution_notes) updateData.execution_notes = execution_notes
  if (outcome_achieved !== undefined) updateData.outcome_achieved = outcome_achieved
  if (items_returned !== undefined) updateData.items_returned = items_returned
  if (target_response) updateData.target_response = target_response
  if (evidence_photos) updateData.evidence_photos = evidence_photos
  if (final_report) updateData.final_report = final_report
  if (actual_price) updateData.actual_price = actual_price
  
  if (status === 'completed') {
    updateData.completed_at = now
  }
  
  const { data: mission, error } = await supabase
    .from('shadow_proxy_missions')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Log da atualização
  await supabase.from('shadow_proxy_logs').insert({
    mission_id: id,
    action: status ? `Status changed to ${status}` : 'Mission updated',
    details: updateData,
    created_at: now
  })
  
  return NextResponse.json(mission)
}
