import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Get latest location for a delivery
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const deliveryId = searchParams.get('delivery_id')
    const trackingCode = searchParams.get('tracking_code')

    let query = supabase
      .from('delivery_tracking')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(1)

    if (deliveryId) {
      query = query.eq('delivery_id', deliveryId)
    }

    // If tracking by code, first get delivery id
    if (trackingCode) {
      const { data: delivery } = await supabase
        .from('deliveries')
        .select('id')
        .eq('tracking_code', trackingCode)
        .single()

      if (!delivery) {
        return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
      }

      query = query.eq('delivery_id', delivery.id)
    }

    const { data: location, error } = await query.single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    return NextResponse.json({
      location: location || null,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Error fetching location:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Save new location point
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
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
