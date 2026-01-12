import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST - Enviar mensagem
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    client_id,
    content,
    direction, // 'inbound' ou 'outbound'
    self_destruct,
    destruct_after_hours
  } = body
  
  const destruct_at = self_destruct && destruct_after_hours
    ? new Date(Date.now() + destruct_after_hours * 60 * 60 * 1000).toISOString()
    : null
  
  const { data, error } = await supabase
    .from('secure_messages')
    .insert({
      client_id,
      content_encrypted: content, // TODO: Implementar criptografia real
      direction,
      self_destruct: self_destruct || false,
      destruct_at,
      status: 'sent',
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}
