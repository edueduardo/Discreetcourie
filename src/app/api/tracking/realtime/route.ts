import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST - Update driver location in real-time
export async function POST(request: NextRequest) {
  const supabase = createClient()
  
  try {
    const body = await request.json()
    const {
      deliveryId,
      driverId,
      latitude,
      longitude,
      accuracy,
      speed,
      heading,
      altitude,
      battery,
      timestamp
    } = body

    if (!latitude || !longitude) {
      return NextResponse.json({ error: 'Coordinates required' }, { status: 400 })
    }

    if (!deliveryId && !driverId) {
      return NextResponse.json({ error: 'deliveryId or driverId required' }, { status: 400 })
    }

    const locationData = {
      delivery_id: deliveryId || null,
      driver_id: driverId || null,
      latitude,
      longitude,
      accuracy: accuracy || null,
      speed: speed || null,
      heading: heading || null,
      altitude: altitude || null,
      battery_level: battery || null,
      recorded_at: timestamp || new Date().toISOString()
    }

    // Insert into tracking history
    const { data: trackingPoint, error: insertError } = await supabase
      .from('tracking_points')
      .insert(locationData)
      .select()
      .single()

    if (insertError) {
      // Table might not exist, try alternative
      console.error('Tracking insert error:', insertError)
    }

    // Update delivery with latest location
    if (deliveryId) {
      await supabase
        .from('deliveries')
        .update({
          last_known_lat: latitude,
          last_known_lng: longitude,
          last_location_update: new Date().toISOString()
        })
        .eq('id', deliveryId)
    }

    // Calculate ETA if we have speed and destination
    let eta = null
    if (deliveryId && speed && speed > 0) {
      const { data: delivery } = await supabase
        .from('deliveries')
        .select('delivery_lat, delivery_lng')
        .eq('id', deliveryId)
        .single()

      if (delivery?.delivery_lat && delivery?.delivery_lng) {
        const distance = calculateDistance(
          latitude, longitude,
          delivery.delivery_lat, delivery.delivery_lng
        )
        const timeHours = distance / speed
        eta = new Date(Date.now() + timeHours * 60 * 60 * 1000).toISOString()
      }
    }

    return NextResponse.json({
      success: true,
      trackingPoint,
      eta,
      location: { latitude, longitude }
    })

  } catch (error: any) {
    console.error('Realtime tracking error:', error)
    return NextResponse.json({ 
      error: 'Failed to update location',
      message: error.message 
    }, { status: 500 })
  }
}

// GET - Get real-time location for delivery
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  
  const deliveryId = searchParams.get('delivery_id')
  const driverId = searchParams.get('driver_id')
  const trackingCode = searchParams.get('tracking_code')
  const history = searchParams.get('history') === 'true'
  const limit = parseInt(searchParams.get('limit') || '100')

  try {
    // Get delivery by tracking code if provided
    let targetDeliveryId = deliveryId
    if (trackingCode && !deliveryId) {
      const { data: delivery } = await supabase
        .from('deliveries')
        .select('id')
        .eq('tracking_code', trackingCode)
        .single()
      
      if (delivery) {
        targetDeliveryId = delivery.id
      }
    }

    if (!targetDeliveryId && !driverId) {
      return NextResponse.json({ error: 'delivery_id, tracking_code, or driver_id required' }, { status: 400 })
    }

    // Get current location from delivery
    if (targetDeliveryId) {
      const { data: delivery } = await supabase
        .from('deliveries')
        .select(`
          id,
          tracking_code,
          status,
          last_known_lat,
          last_known_lng,
          last_location_update,
          delivery_lat,
          delivery_lng,
          delivery_address,
          estimated_delivery
        `)
        .eq('id', targetDeliveryId)
        .single()

      if (!delivery) {
        return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
      }

      let trackingHistory = []
      if (history) {
        const { data: points } = await supabase
          .from('tracking_points')
          .select('*')
          .eq('delivery_id', targetDeliveryId)
          .order('recorded_at', { ascending: false })
          .limit(limit)
        
        trackingHistory = points || []
      }

      return NextResponse.json({
        delivery: {
          id: delivery.id,
          trackingCode: delivery.tracking_code,
          status: delivery.status,
          estimatedDelivery: delivery.estimated_delivery
        },
        currentLocation: delivery.last_known_lat ? {
          latitude: delivery.last_known_lat,
          longitude: delivery.last_known_lng,
          updatedAt: delivery.last_location_update
        } : null,
        destination: delivery.delivery_lat ? {
          latitude: delivery.delivery_lat,
          longitude: delivery.delivery_lng,
          address: delivery.delivery_address
        } : null,
        history: trackingHistory
      })
    }

    return NextResponse.json({ error: 'No location data' }, { status: 404 })

  } catch (error: any) {
    console.error('Get location error:', error)
    return NextResponse.json({ 
      error: 'Failed to get location',
      message: error.message 
    }, { status: 500 })
  }
}

// Haversine formula for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg: number): number {
  return deg * (Math.PI / 180)
}
