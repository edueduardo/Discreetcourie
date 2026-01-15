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
    altitude,
    battery_level,
    is_moving
  } = body
  
  if (!latitude || !longitude) {
    return NextResponse.json({ error: 'latitude and longitude required' }, { status: 400 })
  }
  
  const now = new Date().toISOString()
  
  // Salvar ponto de tracking
  const { data: trackingPoint, error: trackingError } = await supabase
    .from('gps_tracking')
    .insert({
      driver_id,
      delivery_id,
      latitude,
      longitude,
      speed: speed || 0,
      heading: heading || 0,
      accuracy: accuracy || 0,
      altitude: altitude || 0,
      battery_level: battery_level || 100,
      is_moving: is_moving ?? true,
      recorded_at: now
    })
    .select()
    .single()
  
  if (trackingError) {
    console.error('GPS tracking error:', trackingError)
  }
  
  // Atualizar posição atual do motorista
  if (driver_id) {
    await supabase
      .from('driver_locations')
      .upsert({
        driver_id,
        latitude,
        longitude,
        speed,
        heading,
        battery_level,
        is_moving,
        last_update: now
      }, { onConflict: 'driver_id' })
  }
  
  // Atualizar entrega se especificada
  if (delivery_id) {
    await supabase
      .from('deliveries')
      .update({
        current_latitude: latitude,
        current_longitude: longitude,
        last_location_update: now
      })
      .eq('id', delivery_id)
    
    // Calcular ETA se tiver destino
    const { data: delivery } = await supabase
      .from('deliveries')
      .select('delivery_address, status')
      .eq('id', delivery_id)
      .single()
    
    if (delivery && delivery.status === 'in_transit') {
      // ETA simples baseado em distância (em produção, usar API de rotas)
      // Por ora, apenas atualizar timestamp
      await supabase
        .from('deliveries')
        .update({ eta_updated_at: now })
        .eq('id', delivery_id)
    }
  }
  
  return NextResponse.json({
    success: true,
    point: trackingPoint,
    timestamp: now
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
      .from('gps_tracking')
      .select('*')
      .eq('delivery_id', targetDeliveryId)
      .order('recorded_at', { ascending: true })
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
      .from('driver_locations')
      .select('*')
      .eq('driver_id', driver_id)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      driver_id,
      location: location || null,
      online: location ? isOnline(location.last_update) : false
    })
  }
  
  // Buscar última localização da entrega
  if (targetDeliveryId) {
    const { data: point, error } = await supabase
      .from('gps_tracking')
      .select('*')
      .eq('delivery_id', targetDeliveryId)
      .order('recorded_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      delivery_id: targetDeliveryId,
      location: point || null,
      is_live: point ? isOnline(point.recorded_at) : false
    })
  }
  
  // Listar todos os motoristas online
  const { data: drivers, error } = await supabase
    .from('driver_locations')
    .select('*')
    .gte('last_update', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Últimos 5 min
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({
    online_drivers: drivers || [],
    count: drivers?.length || 0
  })
}

// Verificar se está online (atualização nos últimos 2 minutos)
function isOnline(lastUpdate: string): boolean {
  const twoMinutesAgo = Date.now() - 2 * 60 * 1000
  return new Date(lastUpdate).getTime() > twoMinutesAgo
}
