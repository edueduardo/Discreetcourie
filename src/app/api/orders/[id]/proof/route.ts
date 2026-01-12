import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST - Upload de prova de entrega
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    type, // 'pickup' ou 'delivery'
    photo_url,
    received_by,
    signature_url,
    notes,
    latitude,
    longitude
  } = body
  
  const { data, error } = await supabase
    .from('delivery_proofs')
    .insert({
      delivery_id: params.id,
      type,
      photo_url,
      received_by,
      signature_url,
      notes,
      latitude,
      longitude,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Atualizar status do pedido se necessário
  if (type === 'delivery') {
    await supabase
      .from('deliveries')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      .eq('id', params.id)
  }
  
  return NextResponse.json(data, { status: 201 })
}
