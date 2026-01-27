import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const trackingCode = params.code

    if (!trackingCode) {
      return NextResponse.json(
        { error: 'Tracking code required' },
        { status: 400 }
      )
    }

    // Get delivery info
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .select(`
        id,
        tracking_code,
        pickup_address,
        delivery_address,
        status,
        urgency,
        service_type,
        created_at,
        updated_at,
        delivered_at,
        is_zero_trace,
        clients (
          name,
          email,
          phone
        )
      `)
      .eq('tracking_code', trackingCode)
      .single()

    if (deliveryError || !delivery) {
      return NextResponse.json(
        { error: 'Delivery not found' },
        { status: 404 }
      )
    }

    // Get GPS tracking history (if not zero-trace)
    let gpsHistory = []
    if (!delivery.is_zero_trace) {
      const { data: gpsData } = await supabase
        .from('gps_tracking')
        .select('latitude, longitude, recorded_at')
        .eq('delivery_id', delivery.id)
        .order('recorded_at', { ascending: true })

      gpsHistory = gpsData || []
    }

    // Build response (hide sensitive info for zero-trace)
    const response: any = {
      tracking_code: delivery.tracking_code,
      status: delivery.status,
      urgency: delivery.urgency,
      service_type: delivery.service_type,
      created_at: delivery.created_at,
      updated_at: delivery.updated_at,
      delivered_at: delivery.delivered_at
    }

    // Only show addresses if not zero-trace
    if (!delivery.is_zero_trace) {
      response.pickup_address = delivery.pickup_address
      response.delivery_address = delivery.delivery_address
      response.gps_history = gpsHistory
      response.current_location = gpsHistory.length > 0 
        ? gpsHistory[gpsHistory.length - 1] 
        : null
    } else {
      response.is_zero_trace = true
      response.message = 'This is a zero-trace delivery. Location details are hidden.'
    }

    // Add estimated time if in transit
    if (delivery.status === 'in_transit' && gpsHistory.length > 0) {
      response.estimated_arrival = 'Within 30 minutes' // TODO: Calculate based on distance
    }

    return NextResponse.json(response)
  } catch (error: any) {
    console.error('Tracking error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to fetch tracking info' },
      { status: 500 }
    )
  }
}
