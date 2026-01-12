import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Lista tarefas concierge
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  
  let query = supabase
    .from('concierge_tasks')
    .select(`
      *,
      clients (id, code_name, name, service_level)
    `)
    .order('created_at', { ascending: false })
  
  if (status) query = query.eq('status', status)
  if (type) query = query.eq('task_type', type)
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// POST - Criar tarefa concierge
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const reference = `C-${Date.now().toString(36).toUpperCase()}`
  
  const { data, error } = await supabase
    .from('concierge_tasks')
    .insert({
      ...body,
      reference,
      status: 'pending',
      current_phase: 1,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}
