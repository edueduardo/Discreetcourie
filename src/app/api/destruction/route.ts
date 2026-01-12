import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST - Iniciar destruição total de dados do cliente (Ritual de Destruição)
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const { client_id, reason, requested_by = 'admin' } = body
  
  if (!client_id) {
    return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
  }
  
  // Buscar cliente para obter code_name
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('code_name, name')
    .eq('id', client_id)
    .single()
  
  if (clientError || !client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }
  
  const customer_code = client.code_name || `DESTROYED-${Date.now()}`
  
  // Contadores de itens destruídos
  const items_destroyed: Record<string, number> = {}
  
  // 1. Contar e deletar mensagens
  const { count: messagesCount } = await supabase
    .from('secure_messages')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', client_id)
  await supabase.from('secure_messages').delete().eq('client_id', client_id)
  items_destroyed.messages = messagesCount || 0
  
  // 2. Contar e deletar tarefas concierge
  const { count: tasksCount } = await supabase
    .from('concierge_tasks')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', client_id)
  await supabase.from('concierge_tasks').delete().eq('client_id', client_id)
  items_destroyed.tasks = tasksCount || 0
  
  // 3. Contar e deletar itens do cofre
  const { count: vaultCount } = await supabase
    .from('vault_items')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', client_id)
  await supabase.from('vault_items').delete().eq('client_id', client_id)
  items_destroyed.vault_items = vaultCount || 0
  
  // 4. Contar e deletar entregas
  const { count: ordersCount } = await supabase
    .from('deliveries')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', client_id)
  await supabase.from('deliveries').delete().eq('client_id', client_id)
  items_destroyed.orders = ordersCount || 0
  
  // 5. Contar e deletar acordos
  const { count: agreementsCount } = await supabase
    .from('service_agreements')
    .select('*', { count: 'exact', head: true })
    .eq('client_id', client_id)
  await supabase.from('service_agreements').delete().eq('client_id', client_id)
  items_destroyed.agreements = agreementsCount || 0
  
  // 6. Criar log de destruição (ANTES de deletar cliente)
  const { data: log, error: logError } = await supabase
    .from('destruction_logs')
    .insert({
      customer_id: null, // Será null após destruição
      customer_code,
      items_destroyed,
      requested_by,
      reason,
      video_sent: false,
      executed_at: new Date().toISOString()
    })
    .select()
    .single()
  
  // 7. Deletar cliente
  await supabase
    .from('clients')
    .delete()
    .eq('id', client_id)
  
  return NextResponse.json({
    success: true,
    message: 'All customer data has been permanently destroyed',
    destruction_log: log,
    items_destroyed,
    customer_code
  })
}

// GET - Buscar logs de destruição
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  
  let query = supabase
    .from('destruction_logs')
    .select('*')
    .order('executed_at', { ascending: false })
  
  if (code) {
    query = query.eq('customer_code', code)
  }
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
