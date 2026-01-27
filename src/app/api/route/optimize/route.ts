import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  optimizeRoute,
  estimateDailyEarnings,
  getNextDelivery,
  identifyZone,
  Delivery,
} from '@/lib/route/optimizer'

/**
 * Route Optimization API - Solo Driver Columbus, Ohio
 * POST /api/route/optimize - Optimize today's deliveries
 * GET /api/route/optimize/next - Get next delivery recommendation
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      startAddress = '1 Nationwide Plaza, Columbus, OH 43215', // Default: Downtown Columbus
      startLat = 39.9612,
      startLng = -82.9988,
      deliveryIds,
    } = body

    // Fetch pending deliveries for today
    const today = new Date().toISOString().split('T')[0]
    
    let query = supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .gte('created_at', `${today}T00:00:00`)
      .lte('created_at', `${today}T23:59:59`)

    // If specific delivery IDs provided, filter by them
    if (deliveryIds && deliveryIds.length > 0) {
      query = query.in('id', deliveryIds)
    }

    const { data: orders, error: dbError } = await query

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json(
        { error: 'Failed to fetch deliveries' },
        { status: 500 }
      )
    }

    if (!orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No deliveries to optimize',
        deliveries: [],
      })
    }

    // Convert orders to Delivery format
    const deliveries: Delivery[] = orders.map((order) => ({
      id: order.id,
      address: order.delivery_address || order.address,
      lat: order.delivery_lat || 39.9612,
      lng: order.delivery_lng || -82.9988,
      priority: order.priority || 'normal',
      timeWindow: order.time_window,
      estimatedDuration: order.estimated_duration || 10, // 10 min default
    }))

    // Optimize route
    const optimizedRoute = await optimizeRoute(
      deliveries,
      startAddress,
      startLat,
      startLng
    )

    // Calculate earnings
    const earnings = estimateDailyEarnings(deliveries, 25) // $25 per delivery

    // Add zone information
    const deliveriesWithZones = optimizedRoute.deliveries.map((d) => ({
      ...d,
      zone: identifyZone(d.lat, d.lng),
    }))

    // Update order sequence in database
    for (let i = 0; i < deliveriesWithZones.length; i++) {
      await supabase
        .from('orders')
        .update({ route_sequence: i + 1 })
        .eq('id', deliveriesWithZones[i].id)
    }

    return NextResponse.json({
      success: true,
      route: {
        totalDeliveries: deliveries.length,
        totalDistance: optimizedRoute.totalDistance,
        totalDuration: optimizedRoute.totalDuration,
        fuelCost: optimizedRoute.fuelCost,
        timeSaved: optimizedRoute.timeSaved,
        mapUrl: optimizedRoute.mapUrl,
      },
      deliveries: deliveriesWithZones,
      earnings: {
        gross: earnings.grossRevenue,
        fuel: earnings.fuelCost,
        net: earnings.netRevenue,
        hourlyRate: earnings.hourlyRate,
      },
      recommendations: [
        optimizedRoute.timeSaved > 30
          ? `✅ Optimized route saves ${optimizedRoute.timeSaved} minutes!`
          : '⚠️ Route is already fairly optimal',
        earnings.hourlyRate > 30
          ? `✅ Great hourly rate: $${earnings.hourlyRate}/hour`
          : `⚠️ Consider increasing prices or efficiency`,
        optimizedRoute.totalDistance > 50
          ? `⚠️ Long route (${optimizedRoute.totalDistance} miles). Consider splitting.`
          : `✅ Efficient route (${optimizedRoute.totalDistance} miles)`,
      ],
    })
  } catch (error) {
    console.error('Route optimization error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const currentLat = parseFloat(searchParams.get('lat') || '39.9612')
    const currentLng = parseFloat(searchParams.get('lng') || '-82.9988')

    // Fetch pending deliveries
    const { data: orders, error: dbError } = await supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .order('route_sequence', { ascending: true })

    if (dbError || !orders || orders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending deliveries',
        nextDelivery: null,
      })
    }

    // Convert to Delivery format
    const deliveries: Delivery[] = orders.map((order) => ({
      id: order.id,
      address: order.delivery_address || order.address,
      lat: order.delivery_lat || 39.9612,
      lng: order.delivery_lng || -82.9988,
      priority: order.priority || 'normal',
      timeWindow: order.time_window,
      estimatedDuration: order.estimated_duration || 10,
    }))

    // Get next delivery recommendation
    const nextDelivery = getNextDelivery(deliveries, currentLat, currentLng)

    if (!nextDelivery) {
      return NextResponse.json({
        success: true,
        message: 'No deliveries available',
        nextDelivery: null,
      })
    }

    // Calculate distance and ETA
    const distance = Math.sqrt(
      Math.pow(nextDelivery.lat - currentLat, 2) +
      Math.pow(nextDelivery.lng - currentLng, 2)
    ) * 69 // Rough miles conversion

    const eta = Math.round((distance / 30) * 60) // 30 mph average, in minutes

    return NextResponse.json({
      success: true,
      nextDelivery: {
        id: nextDelivery.id,
        address: nextDelivery.address,
        zone: identifyZone(nextDelivery.lat, nextDelivery.lng),
        priority: nextDelivery.priority,
        distance: Math.round(distance * 10) / 10,
        eta,
        mapUrl: `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(nextDelivery.address)}`,
      },
      remaining: deliveries.length - 1,
    })
  } catch (error) {
    console.error('Next delivery error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
