import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Get tracking information for a delivery (supports ?code= parameter)
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const deliveryId = searchParams.get('delivery_id')
    const trackingCode = searchParams.get('code') || searchParams.get('tracking_code')

    // Se não houver parâmetros, retornar status da API
    if (!deliveryId && !trackingCode) {
      return NextResponse.json({
        status: 'operational',
        features: [
          'Real-time GPS tracking',
          'Speed and heading data',
          'Historical tracking points',
          'ETA calculations'
        ],
        endpoints: {
          get: '/api/tracking?code=DC-XXX or ?delivery_id=xxx',
          post: '/api/tracking (body: delivery_id, latitude, longitude)',
          realtime: '/api/tracking/realtime'
        }
      })
    }

    // Buscar entrega completa com eventos
    let query = supabase
      .from('deliveries')
      .select(`
        id,
        tracking_code,
        status,
        pickup_address,
        delivery_address,
        created_at,
        scheduled_date,
        scheduled_time,
        estimated_delivery_time,
        current_latitude,
        current_longitude,
        last_location_update,
        clients (
          id,
          name,
          phone,
          email
        )
      `)

    if (trackingCode) {
      query = query.eq('tracking_code', trackingCode)
    } else if (deliveryId) {
      query = query.eq('id', deliveryId)
    }

    const { data: delivery, error: deliveryError } = await query.single()

    if (deliveryError || !delivery) {
      return NextResponse.json({
        error: 'Delivery not found',
        delivery: null
      }, { status: 404 })
    }

    // Buscar eventos de histórico
    const { data: events } = await supabase
      .from('delivery_events')
      .select('*')
      .eq('delivery_id', delivery.id)
      .order('created_at', { ascending: false })

    // Buscar localização mais recente
    const { data: location } = await supabase
      .from('delivery_tracking')
      .select('*')
      .eq('delivery_id', delivery.id)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single()

    // Formatar eventos para o formato esperado pela página
    const formattedEvents = (events || []).map(event => ({
      status: event.event_type,
      time: new Date(event.created_at).toLocaleString(),
      note: event.description || `Status changed to ${event.event_type}`
    }))

    // Se não tiver eventos, criar um evento inicial
    if (formattedEvents.length === 0) {
      formattedEvents.push({
        status: delivery.status,
        time: new Date(delivery.created_at).toLocaleString(),
        note: 'Order created and confirmed'
      })
    }

    return NextResponse.json({
      delivery: {
        tracking_code: delivery.tracking_code,
        status: delivery.status,
        pickup_address: delivery.pickup_address,
        delivery_address: delivery.delivery_address,
        created_at: delivery.created_at,
        estimated_delivery: delivery.estimated_delivery_time,
        current_location: location || null,
        events: formattedEvents
      },
      location: location || null,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      delivery: null
    }, { status: 500 })
  }
}

// POST - Save new location point
export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    const { delivery_id, latitude, longitude, speed, heading } = body

    if (!delivery_id || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'delivery_id, latitude, and longitude are required' },
        { status: 400 }
      )
    }

    // Insert new tracking point
    const { data, error } = await supabase
      .from('delivery_tracking')
      .insert({
        delivery_id,
        latitude,
        longitude,
        speed: speed || 0,
        heading: heading || 0,
        recorded_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Also update delivery's last known location
    await supabase
      .from('deliveries')
      .update({
        current_latitude: latitude,
        current_longitude: longitude,
        last_location_update: new Date().toISOString()
      })
      .eq('id', delivery_id)

    return NextResponse.json({
      success: true,
      tracking: data
    })

  } catch (error: any) {

    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
