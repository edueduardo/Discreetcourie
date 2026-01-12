import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST - Check-in para Última Vontade (Last Will)
// Cliente faz check-in para provar que está vivo
// Se não fizer check-in dentro do prazo, gatilho é ativado
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  // Verificar se item existe e é last_will
  const { data: item, error: fetchError } = await supabase
    .from('vault_items')
    .select('*')
    .eq('id', params.id)
    .eq('is_last_will', true)
    .single()
  
  if (fetchError || !item) {
    return NextResponse.json(
      { error: 'Last will item not found or not configured for check-in' },
      { status: 404 }
    )
  }
  
  // Atualizar último check-in
  const { data, error } = await supabase
    .from('vault_items')
    .update({
      last_will_last_checkin: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', params.id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Calcular próximo check-in necessário
  const nextCheckinDue = new Date()
  nextCheckinDue.setDate(nextCheckinDue.getDate() + (item.last_will_checkin_days || 30))
  
  return NextResponse.json({
    success: true,
    message: 'Check-in registered successfully',
    data,
    next_checkin_due: nextCheckinDue.toISOString()
  })
}
