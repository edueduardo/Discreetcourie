import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Buscar mensagem por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('secure_messages')
    .select('*')
    .eq('id', params.id)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
  
  // Marcar como lida
  if (!data.read) {
    await supabase
      .from('secure_messages')
      .update({ read: true })
      .eq('id', params.id)
  }
  
  return NextResponse.json(data)
}

// DELETE - Destruir mensagem (Comunicação Fantasma)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  // Deletar permanentemente (não há recuperação)
  const { error } = await supabase
    .from('secure_messages')
    .delete()
    .eq('id', params.id)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ 
    success: true, 
    message: 'Message permanently destroyed' 
  })
}
