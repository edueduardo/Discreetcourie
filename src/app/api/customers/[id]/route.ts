import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Buscar cliente por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', params.id)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
  
  return NextResponse.json(data)
}

// PATCH - Atualizar cliente
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const body = await request.json()
  
  // Campos permitidos para atualização
  const allowedFields = [
    'name', 'company', 'email', 'phone', 'address', 'notes',
    'privacy_level', 'is_vip', 'vip_tier', 'service_level',
    'nda_signed', 'direct_line', 'retainer_active', 'retainer_amount',
    'guardian_mode_active', 'guardian_mode_until',
    'vetting_status', 'vetting_notes',
    'preferred_payment', 'communication_preference'
  ]
  
  const updateData: Record<string, any> = {
    updated_at: new Date().toISOString()
  }
  
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field]
    }
  }
  
  const { data, error } = await supabase
    .from('clients')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
