import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { SOLO_LIMITS, validateBooking, calculateDeliveryPrice } from '@/lib/solo-limits'
import { requireAuth } from '@/middleware/rbac'

// GET - Lista tarefas concierge (requires auth)
export async function GET(request: NextRequest) {
  // ✅ SECURITY: Require authentication
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) {
    return authResult
  }

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

// POST - Criar tarefa concierge (requires auth)
export async function POST(request: NextRequest) {
  // ✅ SECURITY: Require authentication
  const authResult = await requireAuth()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const supabase = createClient()
  const body = await request.json()
  
  // Parse requested time
  let requestedTime = new Date()
  if (body.urgency === 'asap') {
    requestedTime = new Date(Date.now() + 2 * 60 * 60 * 1000) // 2 hours from now
  } else if (body.urgency === 'today') {
    requestedTime = new Date()
  } else if (body.urgency === 'tomorrow') {
    requestedTime = new Date(Date.now() + 24 * 60 * 60 * 1000)
  } else if (body.scheduled_date && body.scheduled_time) {
    requestedTime = new Date(`${body.scheduled_date}T${body.scheduled_time}`)
  }
  
  // Check daily capacity for the requested date
  const requestedDateStr = requestedTime.toISOString().split('T')[0]
  const { data: existingDeliveries } = await supabase
    .from('deliveries')
    .select('id')
    .gte('scheduled_date', requestedDateStr)
    .lt('scheduled_date', new Date(requestedTime.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0])
  
  const currentDayDeliveries = existingDeliveries?.length || 0
  
  // Validate booking against solo limits
  const validation = await validateBooking({
    requestedTime,
    currentDayDeliveries
  })
  
  if (!validation.valid) {
    return NextResponse.json({
      error: 'Booking validation failed',
      errors: validation.errors,
      warnings: validation.warnings
    }, { status: 400 })
  }
  
  // Calculate dynamic price
  const serviceType = body.service_type as 'standard' | 'confidential' | 'shopping' | 'b2b'
  const pricing = calculateDeliveryPrice({
    serviceType: serviceType || 'standard',
    distanceMiles: 10, // Default estimate, actual distance calculated later
    pickupTime: requestedTime,
    isRecurring: body.is_recurring || false
  })
  
  const reference = `DC-${Date.now().toString(36).toUpperCase()}`
  
  const { data, error } = await supabase
    .from('concierge_tasks')
    .insert({
      ...body,
      reference,
      status: 'pending',
      current_phase: 1,
      estimated_price: pricing.total,
      price_breakdown: pricing.breakdown,
      validation_warnings: validation.warnings,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({
    ...data,
    pricing: {
      estimated: pricing.total,
      breakdown: pricing.breakdown
    },
    warnings: validation.warnings,
    limits: {
      remainingToday: SOLO_LIMITS.maxDeliveriesPerDay - currentDayDeliveries - 1
    }
  }, { status: 201 })
}
