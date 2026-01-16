import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, addHeaders, withSecurityHeaders } from '@/lib/api-middleware'
import { RateLimits } from '@/lib/rate-limit'

// GET - Lista todos os pedidos
export async function GET(request: NextRequest) {
  // Rate limiting: 120 requests per minute
  const rateLimitResult = withRateLimit(request, RateLimits.READ)
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!
  }

  const supabase = createClient()

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = searchParams.get('limit') || '50'

  let query = supabase
    .from('deliveries')
    .select(`
      *,
      clients (id, code_name, name, phone, email)
    `)
    .order('created_at', { ascending: false })
    .limit(parseInt(limit))

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let response = NextResponse.json(data)
  response = addHeaders(response, rateLimitResult.headers)
  response = withSecurityHeaders(response)
  return response
}

// POST - Criar novo pedido
export async function POST(request: NextRequest) {
  // Rate limiting: 30 requests per minute (stricter for write operations)
  const rateLimitResult = withRateLimit(request, RateLimits.WRITE)
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!
  }

  const supabase = createClient()
  const body = await request.json()

  const {
    client_id,
    pickup_address,
    delivery_address,
    scheduled_date,
    scheduled_time,
    item_type,
    item_description,
    special_instructions,
    price,
    service_level,
    no_trace_mode
  } = body

  // Gerar código de rastreamento
  const tracking_code = `DC-${Date.now().toString(36).toUpperCase()}`

  const { data, error } = await supabase
    .from('deliveries')
    .insert({
      client_id,
      tracking_code,
      pickup_address,
      delivery_address,
      scheduled_date,
      scheduled_time,
      item_type,
      item_description,
      special_instructions,
      price,
      service_level: service_level || 1,
      no_trace_mode: no_trace_mode || false,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let response = NextResponse.json(data, { status: 201 })
  response = addHeaders(response, rateLimitResult.headers)
  response = withSecurityHeaders(response)
  return response
}
