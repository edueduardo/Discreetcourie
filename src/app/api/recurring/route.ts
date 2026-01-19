import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { SOLO_LIMITS } from '@/lib/solo-limits'

/**
 * Recurring Deliveries API
 * 
 * Manages scheduled recurring deliveries for B2B clients.
 * Auto-creates delivery requests based on configured schedules.
 */

export interface RecurringSchedule {
  id?: string
  client_id: string
  company_name?: string
  billing_email?: string
  po_number?: string
  
  // Schedule
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly'
  day_of_week?: number // 0-6 (Sunday-Saturday), for weekly/biweekly
  day_of_month?: number // 1-31, for monthly
  pickup_time: string // "10:00"
  
  // Route
  pickup_address: string
  delivery_address: string
  
  // Service
  service_type: 'standard' | 'confidential' | 'b2b'
  special_instructions?: string
  
  // Pricing
  base_price: number
  recurring_discount: number // percentage
  
  // Status
  active: boolean
  next_delivery_date?: string
  last_delivery_date?: string
  total_deliveries?: number
}

// GET - List recurring schedules
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const client_id = searchParams.get('client_id')
  const active_only = searchParams.get('active') === 'true'
  
  let query = supabase
    .from('recurring_schedules')
    .select(`
      *,
      clients (id, code_name, name, email, phone)
    `)
    .order('created_at', { ascending: false })
  
  if (client_id) query = query.eq('client_id', client_id)
  if (active_only) query = query.eq('active', true)
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ schedules: data || [] })
}

// POST - Create new recurring schedule
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    client_id,
    company_name,
    billing_email,
    po_number,
    frequency,
    day_of_week,
    day_of_month,
    pickup_time,
    pickup_address,
    delivery_address,
    service_type = 'b2b',
    special_instructions,
    base_price
  } = body
  
  if (!client_id || !frequency || !pickup_time || !pickup_address || !delivery_address) {
    return NextResponse.json({
      error: 'Missing required fields',
      required: ['client_id', 'frequency', 'pickup_time', 'pickup_address', 'delivery_address']
    }, { status: 400 })
  }
  
  // Calculate next delivery date
  const nextDeliveryDate = calculateNextDeliveryDate(frequency, day_of_week, day_of_month)
  
  // Calculate recurring discount (10% for recurring)
  const recurringDiscount = 10
  const finalPrice = base_price || SOLO_LIMITS.basePrices[service_type as keyof typeof SOLO_LIMITS.basePrices] || 40
  const discountedPrice = finalPrice * (1 - recurringDiscount / 100)
  
  const { data, error } = await supabase
    .from('recurring_schedules')
    .insert({
      client_id,
      company_name,
      billing_email,
      po_number,
      frequency,
      day_of_week,
      day_of_month,
      pickup_time,
      pickup_address,
      delivery_address,
      service_type,
      special_instructions,
      base_price: finalPrice,
      recurring_discount: recurringDiscount,
      discounted_price: discountedPrice,
      active: true,
      next_delivery_date: nextDeliveryDate,
      total_deliveries: 0,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({
    schedule: data,
    pricing: {
      base: finalPrice,
      discount: `${recurringDiscount}%`,
      final: discountedPrice
    },
    nextDelivery: nextDeliveryDate
  }, { status: 201 })
}

// PATCH - Update recurring schedule
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const { id, ...updates } = body
  
  if (!id) {
    return NextResponse.json({ error: 'Schedule ID required' }, { status: 400 })
  }
  
  // Recalculate next delivery if schedule changed
  if (updates.frequency || updates.day_of_week || updates.day_of_month) {
    updates.next_delivery_date = calculateNextDeliveryDate(
      updates.frequency,
      updates.day_of_week,
      updates.day_of_month
    )
  }
  
  const { data, error } = await supabase
    .from('recurring_schedules')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ schedule: data })
}

// DELETE - Deactivate recurring schedule (soft delete)
export async function DELETE(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  
  if (!id) {
    return NextResponse.json({ error: 'Schedule ID required' }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('recurring_schedules')
    .update({
      active: false,
      deactivated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ 
    success: true,
    message: 'Recurring schedule deactivated',
    schedule: data
  })
}

// Helper: Calculate next delivery date based on frequency
function calculateNextDeliveryDate(
  frequency: string,
  dayOfWeek?: number,
  dayOfMonth?: number
): string {
  const now = new Date()
  let nextDate = new Date(now)
  
  switch (frequency) {
    case 'daily':
      // Next business day
      nextDate.setDate(nextDate.getDate() + 1)
      // Skip weekends
      while (nextDate.getDay() === 0 || nextDate.getDay() === 6) {
        nextDate.setDate(nextDate.getDate() + 1)
      }
      break
      
    case 'weekly':
      // Next occurrence of specified day
      if (dayOfWeek !== undefined) {
        const currentDay = nextDate.getDay()
        let daysUntil = dayOfWeek - currentDay
        if (daysUntil <= 0) daysUntil += 7
        nextDate.setDate(nextDate.getDate() + daysUntil)
      } else {
        nextDate.setDate(nextDate.getDate() + 7)
      }
      break
      
    case 'biweekly':
      // Next occurrence of specified day, 2 weeks out
      if (dayOfWeek !== undefined) {
        const currentDay = nextDate.getDay()
        let daysUntil = dayOfWeek - currentDay
        if (daysUntil <= 0) daysUntil += 14
        else daysUntil += 7
        nextDate.setDate(nextDate.getDate() + daysUntil)
      } else {
        nextDate.setDate(nextDate.getDate() + 14)
      }
      break
      
    case 'monthly':
      // Next occurrence of specified day of month
      nextDate.setMonth(nextDate.getMonth() + 1)
      if (dayOfMonth !== undefined) {
        nextDate.setDate(Math.min(dayOfMonth, new Date(nextDate.getFullYear(), nextDate.getMonth() + 1, 0).getDate()))
      }
      break
  }
  
  return nextDate.toISOString().split('T')[0]
}
