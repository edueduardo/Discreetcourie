import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Get full route history for a delivery
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const deliveryId = searchParams.get('delivery_id')
    const trackingCode = searchParams.get('tracking_code')

    let targetDeliveryId = deliveryId

    // If tracking by code, first get delivery id
    if (trackingCode && !deliveryId) {
      const { data: delivery } = await supabase
        .from('deliveries')
        .select('id, status, no_trace')
        .eq('tracking_code', trackingCode)
        .single()

      if (!delivery) {
        return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
      }

      // Don't show tracking for no-trace deliveries
      if (delivery.no_trace) {
        return NextResponse.json({ 
          error: 'Tracking not available for this delivery',
          no_trace: true 
        }, { status: 403 })
      }

      targetDeliveryId = delivery.id
    }

    if (!targetDeliveryId) {
      return NextResponse.json(
        { error: 'delivery_id or tracking_code required' },
        { status: 400 }
      )
    }

    // Get all tracking points
    const { data: history, error } = await supabase
      .from('delivery_tracking')
      .select('*')
      .eq('delivery_id', targetDeliveryId)
      .order('recorded_at', { ascending: true })

    if (error) throw error

    // Calculate stats
    let totalDistance = 0
    if (history && history.length > 1) {
      for (let i = 1; i < history.length; i++) {
        totalDistance += calculateDistance(
          history[i - 1].latitude,
          history[i - 1].longitude,
          history[i].latitude,
          history[i].longitude
        )
      }
    }

    const startTime = history?.[0]?.recorded_at
    const endTime = history?.[history.length - 1]?.recorded_at
    const durationMs = startTime && endTime 
      ? new Date(endTime).getTime() - new Date(startTime).getTime()
      : 0
    const durationMinutes = Math.round(durationMs / 1000 / 60)

    return NextResponse.json({
      history: history || [],
      stats: {
        points: history?.length || 0,
        distance_km: Math.round(totalDistance * 100) / 100,
        duration_minutes: durationMinutes,
        avg_speed_kmh: durationMinutes > 0 
          ? Math.round((totalDistance / durationMinutes) * 60) 
          : 0
      }
    })

  } catch (error: any) {
    console.error('Error fetching tracking history:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}
