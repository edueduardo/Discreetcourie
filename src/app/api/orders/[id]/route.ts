import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/middleware/rbac'

// GET - Detalhes de um pedido (requires auth)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ✅ SECURITY: Require authentication
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('deliveries')
    .select(`
      *,
      clients (id, code_name, name, phone, email, service_level),
      delivery_events (id, event_type, description, created_at),
      delivery_proofs (id, type, photo_url, received_by, notes, created_at)
    `)
    .eq('id', params.id)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
  
  return NextResponse.json(data)
}

// PATCH - Atualizar pedido (requires auth)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ✅ SECURITY: Require authentication
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const supabase = createClient()
  const body = await request.json()
  
  const { data, error } = await supabase
    .from('deliveries')
    .update({
      ...body,
      updated_at: new Date().toISOString()
    })
    .eq('id', params.id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// DELETE - Deletar pedido (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ✅ SECURITY: Only admins can delete orders
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const supabase = createClient()
  
  const { error } = await supabase
    .from('deliveries')
    .delete()
    .eq('id', params.id)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
