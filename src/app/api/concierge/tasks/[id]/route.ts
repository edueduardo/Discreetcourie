import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Buscar tarefa por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('concierge_tasks')
    .select(`
      *,
      clients (id, code_name, name, phone, email, service_level, is_vip)
    `)
    .eq('id', params.id)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
  
  return NextResponse.json(data)
}

// PATCH - Atualizar tarefa
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const body = await request.json()
  
  const updateData: Record<string, any> = {
    ...body,
    updated_at: new Date().toISOString()
  }
  
  // Se status mudou para completed, setar completed_at
  if (body.status === 'completed') {
    updateData.completed_at = new Date().toISOString()
    
    // Se no_trace_mode, setar auto_delete_at para 7 dias
    const { data: task } = await supabase
      .from('concierge_tasks')
      .select('no_trace_mode')
      .eq('id', params.id)
      .single()
    
    if (task?.no_trace_mode) {
      updateData.auto_delete_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    }
  }
  
  const { data, error } = await supabase
    .from('concierge_tasks')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// DELETE - Deletar tarefa
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('concierge_tasks')
    .delete()
    .eq('id', params.id)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true, message: 'Task deleted' })
}
