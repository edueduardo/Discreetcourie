import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Get latest location for a delivery or status
export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const deliveryId = searchParams.get('delivery_id')
    const trackingCode = searchParams.get('tracking_code')

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
          get: '/api/tracking?delivery_id=xxx or ?tracking_code=xxx',
          post: '/api/tracking (body: delivery_id, latitude, longitude)',
          realtime: '/api/tracking/realtime'
        }
      })
    }

    // Tentar buscar da tabela delivery_tracking
    try {
      let targetDeliveryId = deliveryId

      // If tracking by code, first get delivery id
      if (trackingCode && !deliveryId) {
        const { data: delivery } = await supabase
          .from('deliveries')
          .select('id')
          .eq('tracking_code', trackingCode)
          .single()

        if (!delivery) {
          return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
        }
        targetDeliveryId = delivery.id
      }

      const { data: location, error } = await supabase
        .from('delivery_tracking')
        .select('*')
        .eq('delivery_id', targetDeliveryId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .single()

      if (error && error.code !== 'PGRST116') {
        // Tabela pode não existir
        return NextResponse.json({
          location: null,
          message: 'No tracking data available',
          timestamp: new Date().toISOString()
        })
      }

      return NextResponse.json({
        location: location || null,
        timestamp: new Date().toISOString()
      })
    } catch (e: any) {
      return NextResponse.json({
        location: null,
        error: e.message,
        timestamp: new Date().toISOString()
      })
    }

  } catch (error: any) {
    console.error('Error fetching location:', error)
    return NextResponse.json({ 
      location: null,
      error: error.message 
    })
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
    console.error('Error saving location:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
