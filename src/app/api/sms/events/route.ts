import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEventSMS, sendEventSMSBatch, SMSEventType } from '@/lib/sms-events'

// POST - Send event-based SMS notifications
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()

  const {
    event_type,
    phone_numbers, // Array of phones or single phone
    phone, // Single phone (alternative)
    variables = {},
    client_id,
    delivery_id
  } = body

  if (!event_type) {
    return NextResponse.json({ error: 'event_type is required' }, { status: 400 })
  }

  const now = new Date().toISOString()
  let phones: string[] = []

  // Get phone numbers
  if (phone_numbers && Array.isArray(phone_numbers)) {
    phones = phone_numbers
  } else if (phone) {
    phones = [phone]
  } else if (client_id) {
    // Get client phone
    const { data: client } = await supabase
      .from('clients')
      .select('phone')
      .eq('id', client_id)
      .single()
    if (client?.phone) phones = [client.phone]
  } else if (delivery_id) {
    // Get delivery recipient phone
    const { data: delivery } = await supabase
      .from('deliveries')
      .select('recipient_phone, client:clients(phone)')
      .eq('id', delivery_id)
      .single()
    if (delivery?.recipient_phone) phones.push(delivery.recipient_phone)
    if (delivery && (delivery.client as any)?.phone) phones.push((delivery.client as any).phone)
  }

  if (phones.length === 0) {
    return NextResponse.json({ error: 'No phone numbers found' }, { status: 400 })
  }

  // Add tracking URL if delivery
  if (delivery_id && !variables.track_url) {
    const { data: delivery } = await supabase
      .from('deliveries')
      .select('tracking_code')
      .eq('id', delivery_id)
      .single()
    if (delivery?.tracking_code) {
      variables.track_url = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/track?code=${delivery.tracking_code}`
      variables.tracking_code = delivery.tracking_code
    }
  }

  // Send SMS
  const result = phones.length === 1
    ? await sendEventSMS(event_type as SMSEventType, phones[0], variables)
    : await sendEventSMSBatch(event_type as SMSEventType, phones, variables)

  // Log the event
  await supabase.from('sms_event_logs').insert({
    event_type,
    phone_numbers: phones,
    variables,
    client_id,
    delivery_id,
    success: 'sent' in result ? result.sent > 0 : result.success,
    error: 'errors' in result ? result.errors.join(', ') : result.error,
    created_at: now
  })

  return NextResponse.json({
    success: true,
    result,
    phones_notified: phones.length
  })
}

// GET - List SMS event logs
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  
  const limit = parseInt(searchParams.get('limit') || '50')
  const event_type = searchParams.get('event_type')
  const client_id = searchParams.get('client_id')

  let query = supabase
    .from('sms_event_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (event_type) query = query.eq('event_type', event_type)
  if (client_id) query = query.eq('client_id', client_id)

  const { data, error } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(data || [])
}
