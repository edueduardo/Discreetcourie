import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Lista itens do cofre
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vault_items')
    .select(`
      *,
      clients (id, code_name, name)
    `)
    .eq('status', 'active')
    .order('stored_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// POST - Adicionar item ao cofre
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const item_code = `V-${Date.now().toString(36).toUpperCase()}`
  
  const { data, error } = await supabase
    .from('vault_items')
    .insert({
      ...body,
      item_code,
      status: 'active',
      stored_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}
