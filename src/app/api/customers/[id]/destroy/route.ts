import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// DELETE - Destruição total de dados do cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  const { data: client } = await supabase
    .from('clients')
    .select('name')
    .eq('id', params.id)
    .single()
  
  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }
  
  // Deletar em ordem (dependências primeiro)
  
  // 1. Mensagens seguras
  await supabase.from('secure_messages').delete().eq('client_id', params.id)
  
  // 2. Provas de entrega (via deliveries)
  const { data: deliveries } = await supabase
    .from('deliveries')
    .select('id')
    .eq('client_id', params.id)
  
  if (deliveries) {
    const deliveryIds = deliveries.map(d => d.id)
    await supabase.from('delivery_proofs').delete().in('delivery_id', deliveryIds)
    await supabase.from('delivery_events').delete().in('delivery_id', deliveryIds)
  }
  
  // 3. Entregas
  await supabase.from('deliveries').delete().eq('client_id', params.id)
  
  // 4. Tarefas concierge
  await supabase.from('concierge_tasks').delete().eq('client_id', params.id)
  
  // 5. Acordos/NDAs
  await supabase.from('service_agreements').delete().eq('client_id', params.id)
  
  // 6. Cliente
  await supabase.from('clients').delete().eq('id', params.id)
  
  return NextResponse.json({ 
    success: true, 
    message: `All data for client has been destroyed` 
  })
}
