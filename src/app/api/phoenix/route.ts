import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Operação Fênix - Ajudar cliente a renascer/sair de situação difícil
// Tipos: escape_abuse, start_fresh, temporary_disappear, crisis_exit

export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    client_id,
    operation_type, // escape_abuse, start_fresh, temporary_disappear, crisis_exit
    situation_description,
    urgency_level = 'normal', // low, normal, high, critical
    timeline,
    safe_contact_method,
    safe_contact_info,
    items_to_retrieve,
    destination_info,
    special_requirements,
    budget_estimate,
    notes
  } = body
  
  if (!client_id || !operation_type) {
    return NextResponse.json({ error: 'client_id and operation_type required' }, { status: 400 })
  }
  
  const now = new Date().toISOString()
  const operation_code = `FENIX-${Date.now().toString(36).toUpperCase()}`
  
  // Criar operação
  const { data: operation, error } = await supabase
    .from('phoenix_operations')
    .insert({
      operation_code,
      client_id,
      operation_type,
      situation_description,
      urgency_level,
      timeline,
      safe_contact_method,
      safe_contact_info,
      items_to_retrieve,
      destination_info,
      special_requirements,
      budget_estimate,
      notes,
      status: 'initiated',
      phase: 'planning',
      created_at: now,
      updated_at: now
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Criar log inicial
  await supabase.from('phoenix_logs').insert({
    operation_id: operation.id,
    phase: 'planning',
    action: 'Operation initiated',
    details: { operation_type, urgency_level },
    created_at: now
  })
  
  // Se urgência crítica, enviar alerta
  if (urgency_level === 'critical') {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: process.env.ADMIN_PHONE || '+1234567890',
          message: `🔴 OPERAÇÃO FÊNIX CRÍTICA: ${operation_code} - ${operation_type}. Ação imediata necessária!`
        })
      })
    } catch (e) {}
  }
  
  return NextResponse.json({
    success: true,
    operation,
    message: 'Phoenix operation initiated successfully'
  }, { status: 201 })
}

// GET - Listar operações
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const client_id = searchParams.get('client_id')
  const status = searchParams.get('status')
  const operation_code = searchParams.get('code')
  
  let query = supabase
    .from('phoenix_operations')
    .select(`
      *,
      clients (id, code_name, name, phone, email),
      phoenix_logs (id, phase, action, created_at)
    `)
    .order('created_at', { ascending: false })
  
  if (client_id) query = query.eq('client_id', client_id)
  if (status) query = query.eq('status', status)
  if (operation_code) query = query.eq('operation_code', operation_code)
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data || [])
}

// PATCH - Atualizar operação (avançar fase, atualizar status)
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    id,
    status,
    phase,
    action_notes,
    checklist_completed,
    items_retrieved,
    destination_confirmed,
    final_notes
  } = body
  
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }
  
  const now = new Date().toISOString()
  const updateData: Record<string, any> = { updated_at: now }
  
  if (status) updateData.status = status
  if (phase) updateData.phase = phase
  if (checklist_completed) updateData.checklist_completed = checklist_completed
  if (items_retrieved !== undefined) updateData.items_retrieved = items_retrieved
  if (destination_confirmed !== undefined) updateData.destination_confirmed = destination_confirmed
  if (final_notes) updateData.final_notes = final_notes
  
  const { data: operation, error } = await supabase
    .from('phoenix_operations')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Registrar log da atualização
  if (phase || status) {
    await supabase.from('phoenix_logs').insert({
      operation_id: id,
      phase: phase || operation.phase,
      action: action_notes || `Status updated to ${status || phase}`,
      details: updateData,
      created_at: now
    })
  }
  
  // Se completado, notificar
  if (status === 'completed') {
    await supabase.from('phoenix_logs').insert({
      operation_id: id,
      phase: 'completed',
      action: 'Operation completed successfully - Client has risen from the ashes 🔥',
      created_at: now
    })
  }
  
  return NextResponse.json(operation)
}
