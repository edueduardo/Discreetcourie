import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { withRateLimit, addHeaders, withSecurityHeaders } from '@/lib/api-middleware'
import { RateLimits } from '@/lib/rate-limit'
import { searchParamsSchema, safeValidateData, formatValidationErrors } from '@/lib/validation'
import { requireAuth, requireRole } from '@/middleware/rbac'

// GET - Lista todos os pedidos (requires auth)
export async function GET(request: NextRequest) {
  // ✅ SECURITY: Require authentication
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) {
    return authResult // Returns 401 if not authenticated
  }
  const { user } = authResult

  // Rate limiting: 120 requests per minute
  const rateLimitResult = withRateLimit(request, RateLimits.READ)
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!
  }

  const supabase = createClient()

  const { searchParams } = new URL(request.url)

  // Validate query parameters
  const validationResult = safeValidateData(searchParamsSchema, {
    status: searchParams.get('status'),
    limit: searchParams.get('limit') || '50',
    offset: searchParams.get('offset'),
    search: searchParams.get('search')
  })

  if (!validationResult.success) {
    return NextResponse.json(formatValidationErrors(validationResult.error), { status: 400 })
  }

  const { status, limit, offset, search } = validationResult.data

  // Ensure limit and offset are numbers
  const limitValue = typeof limit === 'number' ? limit : 50
  const offsetValue = typeof offset === 'number' ? offset : 0

  let query = supabase
    .from('deliveries')
    .select(`
      *,
      clients (id, code_name, name, phone, email)
    `)
    .order('created_at', { ascending: false })
    .limit(limitValue)

  if (status) {
    query = query.eq('status', status)
  }

  if (offsetValue > 0) {
    query = query.range(offsetValue, offsetValue + limitValue - 1)
  }

  if (search) {
    query = query.or(`tracking_code.ilike.%${search}%,delivery_address.ilike.%${search}%`)
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

// POST - Criar novo pedido (requires auth)
export async function POST(request: NextRequest) {
  // ✅ SECURITY: Require authentication
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) {
    return authResult // Returns 401 if not authenticated
  }
  const { user } = authResult

  // Rate limiting: 30 requests per minute (stricter for write operations)
  const rateLimitResult = withRateLimit(request, RateLimits.WRITE)
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!
  }

  const supabase = createClient()

  let body
  try {
    body = await request.json()
  } catch (e) {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  // Validate and sanitize input
  const { createOrderSchema, safeValidateData, formatValidationErrors } = await import('@/lib/validation')
  const validationResult = safeValidateData(createOrderSchema, body)

  if (!validationResult.success) {
    return NextResponse.json(formatValidationErrors(validationResult.error), { status: 400 })
  }

  const validatedData = validationResult.data

  // Gerar código de rastreamento
  const tracking_code = `DC-${Date.now().toString(36).toUpperCase()}`

  const { data, error } = await supabase
    .from('deliveries')
    .insert({
      client_id: validatedData.client_id,
      tracking_code,
      pickup_address: validatedData.pickup_address,
      delivery_address: validatedData.delivery_address,
      scheduled_date: validatedData.scheduled_date,
      scheduled_time: validatedData.scheduled_time,
      item_type: validatedData.item_type,
      item_description: validatedData.item_description,
      special_instructions: validatedData.special_instructions,
      price: validatedData.price,
      service_level: validatedData.service_level || 1,
      no_trace_mode: validatedData.no_trace_mode || false,
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
