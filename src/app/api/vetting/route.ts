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
  
  // Processar decisão e enviar notificações
  const vetting = data as any
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  // Buscar dados do cliente
  const { data: client } = await supabase
    .from('clients')
    .select('*')
    .eq('id', vetting.client_id)
    .single()

  if (status === 'approved') {
    // Atualizar status do cliente
    await supabase
      .from('clients')
      .update({ 
        vetting_status: 'approved',
        is_vip: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', vetting.client_id)

    // Enviar SMS de aprovação
    if (client?.phone) {
      await fetch(`${baseUrl}/api/sms/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'vetting_approved',
          phone: client.phone,
          client_id: client.id
        })
      }).catch(() => {})
    }

    // Registrar log
    await supabase.from('vetting_logs').insert({
      vetting_id: id,
      client_id: vetting.client_id,
      action: 'approved',
      performed_by: reviewed_by,
      notes: decision_notes,
      created_at: new Date().toISOString()
    })
  } else if (status === 'rejected') {
    // Atualizar status do cliente
    await supabase
      .from('clients')
      .update({ 
        vetting_status: 'rejected',
        updated_at: new Date().toISOString()
      })
      .eq('id', vetting.client_id)

    // Enviar SMS de rejeição
    if (client?.phone) {
      await fetch(`${baseUrl}/api/sms/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_type: 'vetting_rejected',
          phone: client.phone,
          client_id: client.id
        })
      }).catch(() => {})
    }

    // Registrar log
    await supabase.from('vetting_logs').insert({
      vetting_id: id,
      client_id: vetting.client_id,
      action: 'rejected',
      performed_by: reviewed_by,
      notes: decision_notes,
      created_at: new Date().toISOString()
    })
  } else if (status === 'probation') {
    // Período probatório
    await supabase
      .from('clients')
      .update({ 
        vetting_status: 'probation',
        updated_at: new Date().toISOString()
      })
      .eq('id', vetting.client_id)

    // Notificar sobre probation
    if (client?.phone) {
      await fetch(`${baseUrl}/api/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: client.phone,
          message: `[Discreet Courier] Your application has been approved with a probationary period. ${probation_conditions || 'Standard conditions apply.'}`
        })
      }).catch(() => {})
    }

    await supabase.from('vetting_logs').insert({
      vetting_id: id,
      client_id: vetting.client_id,
      action: 'probation',
      performed_by: reviewed_by,
      notes: `Probation until: ${probation_until}. ${decision_notes || ''}`,
      created_at: new Date().toISOString()
    })
  } else if (status === 'interview_scheduled') {
    // Agendar entrevista
    if (client?.phone) {
      await fetch(`${baseUrl}/api/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: client.phone,
          message: `[Discreet Courier] Your vetting interview has been scheduled. We will contact you shortly with details.`
        })
      }).catch(() => {})
    }

    await supabase.from('vetting_logs').insert({
      vetting_id: id,
      client_id: vetting.client_id,
      action: 'interview_scheduled',
      performed_by: reviewed_by,
      notes: decision_notes,
      created_at: new Date().toISOString()
    })
  }

  // Notificar admin sobre nova decisão
  if (process.env.ADMIN_PHONE && (status === 'approved' || status === 'rejected')) {
    await fetch(`${baseUrl}/api/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: process.env.ADMIN_PHONE,
        message: `📋 Vetting ${status.toUpperCase()}: ${client?.code_name || client?.name || 'Unknown'} by ${reviewed_by || 'Admin'}`
      })
    }).catch(() => {})
  }
  
  return NextResponse.json(data)
}
