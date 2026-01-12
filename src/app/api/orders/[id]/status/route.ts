import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PATCH - Atualizar status do pedido
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { status, notes } = await request.json()
  
  // Atualizar pedido
  const { data: delivery, error: deliveryError } = await supabase
    .from('deliveries')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', params.id)
    .select()
    .single()
  
  if (deliveryError) {
    return NextResponse.json({ error: deliveryError.message }, { status: 500 })
  }
  
  // Criar evento de histórico
  await supabase
    .from('delivery_events')
    .insert({
      delivery_id: params.id,
      event_type: status,
      description: notes || `Status changed to ${status}`,
      created_at: new Date().toISOString()
    })
  
  return NextResponse.json(delivery)
}
