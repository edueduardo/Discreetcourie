import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Listar clientes com Guardian Mode ativo
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const client_id = searchParams.get('client_id')
  const active_only = searchParams.get('active') !== 'false'
  
  let query = supabase
    .from('guardian_subscriptions')
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

// POST - Ativar Guardian Mode para cliente
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    client_id,
    monthly_rate = 500.00,
    direct_line,
    months = 1 // Duração em meses
  } = body
  
  if (!client_id) {
    return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
  }
  
  // Verificar se já existe subscription ativa
  const { data: existing } = await supabase
    .from('guardian_subscriptions')
    .select('id')
    .eq('client_id', client_id)
    .eq('is_active', true)
    .single()
  
  if (existing) {
    return NextResponse.json(
      { error: 'Guardian Mode already active for this client' },
      { status: 409 }
    )
  }
  
  // Calcular data de expiração
  const expires_at = new Date()
  expires_at.setMonth(expires_at.getMonth() + months)
  
  // Gerar linha direta se não fornecida
  const generatedLine = direct_line || `614-GUARD-${Math.floor(1000 + Math.random() * 9000)}`
  
  const { data, error } = await supabase
    .from('guardian_subscriptions')
    .insert({
      client_id,
      is_active: true,
      started_at: new Date().toISOString(),
      expires_at: expires_at.toISOString(),
      monthly_rate,
      direct_line: generatedLine,
      priority_level: 1,
      last_payment_at: new Date().toISOString(),
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Atualizar cliente com guardian mode
  await supabase
    .from('clients')
    .update({
      guardian_mode_active: true,
      guardian_mode_until: expires_at.toISOString(),
      direct_line: generatedLine,
      is_vip: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', client_id)
  
  return NextResponse.json({
    success: true,
    message: 'Guardian Mode activated',
    subscription: data,
    direct_line: generatedLine,
    expires_at: expires_at.toISOString()
  }, { status: 201 })
}

// DELETE - Desativar Guardian Mode
export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const client_id = searchParams.get('client_id')
  
  if (!client_id) {
    return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
  }
  
  // Desativar subscription
  const { error } = await supabase
    .from('guardian_subscriptions')
    .update({ is_active: false })
    .eq('client_id', client_id)
    .eq('is_active', true)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Atualizar cliente
  await supabase
    .from('clients')
    .update({
      guardian_mode_active: false,
      guardian_mode_until: null,
      updated_at: new Date().toISOString()
    })
    .eq('id', client_id)
  
  return NextResponse.json({
    success: true,
    message: 'Guardian Mode deactivated'
  })
}
