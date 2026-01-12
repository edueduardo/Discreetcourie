import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Listar registros de vetting
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const client_id = searchParams.get('client_id')
  
  let query = supabase
    .from('vetting_records')
    .select(`
      *,
      clients (id, code_name, name, email, phone)
    `)
    .order('created_at', { ascending: false })
  
  if (status) query = query.eq('status', status)
  if (client_id) query = query.eq('client_id', client_id)
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// POST - Iniciar processo de vetting (Santuário)
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    client_id,
    source,
    referral_code,
    interview_notes,
    risk_assessment = 'unknown',
    red_flags = []
  } = body
  
  if (!client_id) {
    return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
  }
  
  // Verificar se já existe vetting para este cliente
  const { data: existing } = await supabase
    .from('vetting_records')
    .select('id')
    .eq('client_id', client_id)
    .single()
  
  if (existing) {
    return NextResponse.json(
      { error: 'Vetting record already exists for this client' },
      { status: 409 }
    )
  }
  
  const { data, error } = await supabase
    .from('vetting_records')
    .insert({
      client_id,
      status: 'pending',
      source,
      referral_code,
      interview_notes,
      risk_assessment,
      red_flags,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}

// PATCH - Atualizar status de vetting
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    id,
    status,
    reviewed_by,
    decision_notes,
    risk_assessment,
    probation_until,
    probation_conditions
  } = body
  
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }
  
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString()
  }
  
  if (status) {
    updateData.status = status
    updateData.reviewed_at = new Date().toISOString()
  }
  if (reviewed_by) updateData.reviewed_by = reviewed_by
  if (decision_notes) updateData.decision_notes = decision_notes
  if (risk_assessment) updateData.risk_assessment = risk_assessment
  if (probation_until) updateData.probation_until = probation_until
  if (probation_conditions) updateData.probation_conditions = probation_conditions
  
  const { data, error } = await supabase
    .from('vetting_records')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Se aprovado, atualizar status do cliente
  if (status === 'approved') {
    const vetting = data as any
    await supabase
      .from('clients')
      .update({ 
        vetting_status: 'approved',
        is_vip: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', vetting.client_id)
  }
  
  return NextResponse.json(data)
}
