import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, requireAdmin } from '@/middleware/rbac'

// Gerar código de cliente
function generateClientCode(): string {
  const prefixes = ['SHADOW', 'GHOST', 'CIPHER', 'PHANTOM', 'ECHO']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const number = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${number}`
}

// GET - Lista clientes (admin only)
export async function GET(request: NextRequest) {
  // ✅ SECURITY: Only admins can view all customers
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const level = searchParams.get('level')
  const vip = searchParams.get('vip')
  
  let query = supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (level) query = query.eq('service_level', parseInt(level))
  if (vip === 'true') query = query.eq('is_vip', true)
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// POST - Criar cliente (admin only)
export async function POST(request: NextRequest) {
  // ✅ SECURITY: Only admins can create customers
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const supabase = createClient()
  const body = await request.json()
  
  const code_name = generateClientCode()
  
  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...body,
      code_name,
      service_level: body.service_level || 1,
      is_vip: body.is_vip || false,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}
