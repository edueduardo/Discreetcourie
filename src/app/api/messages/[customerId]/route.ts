import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Lista mensagens de um cliente
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  const supabase = createClient()
  
  // Deletar mensagens expiradas primeiro
  await supabase
    .from('secure_messages')
    .delete()
    .lt('destruct_at', new Date().toISOString())
    .not('destruct_at', 'is', null)
  
  const { data, error } = await supabase
    .from('secure_messages')
    .select('*')
    .eq('client_id', params.customerId)
    .order('created_at', { ascending: true })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
