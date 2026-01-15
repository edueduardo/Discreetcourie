import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Listar mensagens fantasma (self-destruct)
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const client_id = searchParams.get('client_id')
  const include_expired = searchParams.get('include_expired') === 'true'
  
  let query = supabase
    .from('secure_messages')
    .select(`
      *,
      clients (id, code_name, name)
    `)
    .eq('self_destruct', true)
    .order('created_at', { ascending: false })
  
  if (client_id) {
    query = query.eq('client_id', client_id)
  }
  
  // Por padrão, mostrar apenas não expiradas
  if (!include_expired) {
    query = query.or(`destruct_at.is.null,destruct_at.gt.${new Date().toISOString()}`)
  }
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data || [])
}
