import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Calculate distance between two addresses using Google Maps Distance Matrix API
async function calculateDistance(pickup: string, delivery: string): Promise<{
  distance_miles: number
  duration_minutes: number
  error?: string
}> {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY

  if (!apiKey) {
    console.warn('GOOGLE_MAPS_API_KEY not configured, using estimated distance')
    // Fallback: estimate ~5 miles for local delivery
    return { distance_miles: 5, duration_minutes: 15 }
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json')
    url.searchParams.set('origins', pickup)
    url.searchParams.set('destinations', delivery)
    url.searchParams.set('key', apiKey)
    url.searchParams.set('units', 'imperial')

    const response = await fetch(url.toString())
    const data = await response.json()

    if (data.status !== 'OK') {
      throw new Error(`Google Maps API error: ${data.status}`)
    }

    const element = data.rows[0]?.elements[0]
    if (!element || element.status !== 'OK') {
      throw new Error('Could not calculate distance')
    }

    // Convert meters to miles
    const distance_miles = Math.round((element.distance.value / 1609.34) * 10) / 10
    const duration_minutes = Math.round(element.duration.value / 60)

    return { distance_miles, duration_minutes }
  } catch (error: any) {
    console.error('Distance calculation error:', error)
    return {
      distance_miles: 5,
      duration_minutes: 15,
      error: error.message
    }
  }
}

// Calculate price based on distance and parameters
function calculatePrice(params: {
  distance: number
  urgency: 'urgent_1h' | 'same_day' | 'next_day'
  service_tier: 'courier' | 'discreet' | 'concierge' | 'fixer'
  pickup_time: string
  is_weekend: boolean
  is_sunday: boolean
  is_holiday: boolean
  additional_stops: number
  wait_time_hours: number
}) {
  const rules = {
    base_rate: 35,
    distance_rate_per_mile: 2.5,
    time_premiums: {
      early_morning: 1.25,
      late_evening: 1.25,
      weekend: 1.5,
      sunday: 1.75,
      holiday: 2.0,
    },
    urgency_multipliers: {
      urgent_1h: 2.0,
      same_day: 1.3,
      next_day: 1.0,
    },
    service_tier_multipliers: {
      courier: 1.0,
      discreet: 1.5,
      concierge: 2.0,
      fixer: 2.5,
    },
    multi_stop_fee: 15,
    wait_time_rate: 60,
  }

  const base_price = rules.base_rate
  const distance_cost = params.distance * rules.distance_rate_per_mile

  // Time premium
  let time_multiplier = 1.0
  const hour = parseInt(params.pickup_time.split(':')[0])

  if (params.is_holiday) {
    time_multiplier = Math.max(time_multiplier, rules.time_premiums.holiday)
  } else if (params.is_sunday) {
    time_multiplier = Math.max(time_multiplier, rules.time_premiums.sunday)
  } else if (params.is_weekend) {
    time_multiplier = Math.max(time_multiplier, rules.time_premiums.weekend)
  }

  if (hour < 8) {
    time_multiplier = Math.max(time_multiplier, rules.time_premiums.early_morning)
  } else if (hour >= 18) {
    time_multiplier = Math.max(time_multiplier, rules.time_premiums.late_evening)
  }

  const urgency_multiplier = rules.urgency_multipliers[params.urgency]
  const service_multiplier = rules.service_tier_multipliers[params.service_tier]

  const subtotal_before_premiums = base_price + distance_cost
  const time_premium = subtotal_before_premiums * (time_multiplier - 1.0)
  const urgency_cost = subtotal_before_premiums * (urgency_multiplier - 1.0)
  const service_tier_cost = subtotal_before_premiums * (service_multiplier - 1.0)
  const multi_stop_cost = params.additional_stops * rules.multi_stop_fee
  const wait_time_cost = params.wait_time_hours * rules.wait_time_rate

  const subtotal = subtotal_before_premiums + time_premium + urgency_cost + service_tier_cost
  const total = subtotal + multi_stop_cost + wait_time_cost

  return {
    base_price,
    distance_cost,
    time_premium,
    urgency_cost,
    service_tier_cost,
    multi_stop_cost,
    wait_time_cost,
    subtotal,
    total
  }
}

// POST - Create a new quote
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      pickup_address,
      delivery_address,
      urgency = 'same_day',
      service_tier = 'courier',
      pickup_time = '10:00',
      additional_stops = 0,
      wait_time_hours = 0,
      contact_name,
      contact_email,
      contact_phone
    } = body

    if (!pickup_address || !delivery_address) {
      return NextResponse.json({
        error: 'Pickup and delivery addresses are required'
      }, { status: 400 })
    }

    // Calculate distance
    const { distance_miles, duration_minutes, error: distanceError } =
      await calculateDistance(pickup_address, delivery_address)

    // Determine day premiums
    const now = new Date()
    const dayOfWeek = now.getDay()
    const is_weekend = dayOfWeek === 6
    const is_sunday = dayOfWeek === 0
    const is_holiday = false // TODO: Add holiday detection

    // Calculate price
    const pricing = calculatePrice({
      distance: distance_miles,
      urgency,
      service_tier,
      pickup_time,
      is_weekend,
      is_sunday,
      is_holiday,
      additional_stops,
      wait_time_hours
    })

    // Save quote to database
    const supabase = await createClient()
    const { data: quote, error } = await supabase
      .from('quotes')
      .insert({
        pickup_address,
        delivery_address,
        distance_miles,
        duration_minutes,
        urgency,
        service_tier,
        pickup_time,
        additional_stops,
        wait_time_hours,
        calculated_price: pricing.total,
        price_breakdown: pricing,
        contact_name,
        contact_email,
        contact_phone,
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving quote:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      quote,
      distance: distance_miles,
      duration: duration_minutes,
      price: pricing.total,
      breakdown: pricing,
      distanceCalculationWarning: distanceError
    }, { status: 201 })

  } catch (error: any) {
    console.error('Quote creation error:', error)
    return NextResponse.json({
      error: 'Failed to create quote',
      message: error.message
    }, { status: 500 })
  }
}

// GET - Fetch quote by ID
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Quote ID required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }

    return NextResponse.json({ quote })
  } catch (error: any) {
    console.error('Quote fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch quote',
      message: error.message
    }, { status: 500 })
  }
}
