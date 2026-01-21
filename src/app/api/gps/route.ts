import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST - Receber atualização de GPS do motorista
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    driver_id,
    delivery_id,
    latitude,
    longitude,
    speed,
    heading,
    accuracy,
    altitude
  } = body
  
  if (!latitude || !longitude) {
    return NextResponse.json({ error: 'latitude and longitude required' }, { status: 400 })
  }
  
  // Salvar ponto de GPS na tabela gps_locations
  const { data: gpsPoint, error: gpsError } = await supabase
    .from('gps_locations')
    .insert({
      driver_id: driver_id || null,
      delivery_id: delivery_id || null,
      latitude,
      longitude,
      speed: speed || null,
      heading: heading || null,
      accuracy: accuracy || null,
      altitude: altitude || null,
      is_active: true
    })
    .select()
    .single()
  
  if (gpsError) {
    return NextResponse.json({ error: gpsError.message }, { status: 500 })
  }
  
  return NextResponse.json({
    success: true,
    point: gpsPoint,
    timestamp: gpsPoint.created_at
  })
}

// GET - Buscar localização atual
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const driver_id = searchParams.get('driver_id')
  const delivery_id = searchParams.get('delivery_id')
  const tracking_code = searchParams.get('tracking_code')
  const history = searchParams.get('history') === 'true'
  const limit = parseInt(searchParams.get('limit') || '100')
  
  // Se buscar por tracking_code, primeiro encontrar a entrega
  let targetDeliveryId = delivery_id
  if (tracking_code) {
    const { data: delivery } = await supabase
      .from('deliveries')
      .select('id, client_id, clients(privacy_level)')
      .eq('tracking_code', tracking_code)
      .single()
    
    if (!delivery) {
      return NextResponse.json({ error: 'Delivery not found' }, { status: 404 })
    }
    
    // Verificar nível de privacidade
    const privacyLevel = (delivery as any).clients?.privacy_level
    if (privacyLevel === 'none') {
      return NextResponse.json({ 
        error: 'GPS tracking not available for this delivery',
        privacy_restricted: true 
      }, { status: 403 })
    }
    
    targetDeliveryId = delivery.id
  }
  
  // Buscar histórico de pontos
  if (history && targetDeliveryId) {
    const { data: points, error } = await supabase
      .from('gps_locations')
      .select('*')
      .eq('delivery_id', targetDeliveryId)
      .order('created_at', { ascending: true })
      .limit(limit)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      delivery_id: targetDeliveryId,
      points: points || [],
      count: points?.length || 0
    })
  }
  
  // Buscar localização atual do motorista
  if (driver_id) {
    const { data: location, error } = await supabase
      .from('gps_locations')
      .select('*')
      .eq('driver_id', driver_id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      driver_id,
      location: location || null,
      online: location ? isOnline(location.created_at) : false
    })
  }
  
  // Buscar última localização da entrega
  if (targetDeliveryId) {
    const { data: point, error } = await supabase
      .from('gps_locations')
      .select('*')
      .eq('delivery_id', targetDeliveryId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      delivery_id: targetDeliveryId,
      location: point || null,
      is_live: point ? isOnline(point.created_at) : false
    })
  }
  
  // Buscar motoristas ativos (com GPS nos últimos 5 min)
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
  const { data: recentLocations, error } = await supabase
    .from('gps_locations')
    .select('driver_id, latitude, longitude, speed, created_at')
    .not('driver_id', 'is', null)
    .gte('created_at', fiveMinutesAgo)
    .order('created_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Get unique drivers with their latest location
  const driverMap = new Map()
  for (const loc of recentLocations || []) {
    if (!driverMap.has(loc.driver_id)) {
      driverMap.set(loc.driver_id, loc)
    }
  }
  
  return NextResponse.json({
    online_drivers: Array.from(driverMap.values()),
    count: driverMap.size
  })
}

// Verificar se está online (atualização nos últimos 2 minutos)
function isOnline(lastUpdate: string): boolean {
  const twoMinutesAgo = Date.now() - 2 * 60 * 1000
  return new Date(lastUpdate).getTime() > twoMinutesAgo
}
