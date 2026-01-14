import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST - Cliente faz check-in para confirmar que está vivo
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const { client_id, item_id } = body
  
  if (!client_id && !item_id) {
    return NextResponse.json(
      { error: 'client_id or item_id is required' },
      { status: 400 }
    )
  }
  
  const now = new Date().toISOString()
  
  // Se item_id específico, atualiza apenas ele
  if (item_id) {
    const { data, error } = await supabase
      .from('vault_items')
      .update({
        last_will_last_checkin: now,
        updated_at: now
      })
      .eq('id', item_id)
      .eq('is_last_will', true)
      .eq('status', 'active')
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    const checkinDays = data.last_will_checkin_days || 30
    const nextCheckin = new Date(Date.now() + checkinDays * 24 * 60 * 60 * 1000)
    
    return NextResponse.json({
      success: true,
      message: 'Check-in recorded successfully',
      item_code: data.item_code,
      last_checkin: now,
      next_checkin_due: nextCheckin.toISOString(),
      days_until_next: checkinDays
    })
  }
  
  // Se client_id, atualiza todos os last wills do cliente
  const { data, error } = await supabase
    .from('vault_items')
    .update({
      last_will_last_checkin: now,
      updated_at: now
    })
    .eq('client_id', client_id)
    .eq('is_last_will', true)
    .eq('status', 'active')
    .select()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({
    success: true,
    message: `Check-in recorded for ${data?.length || 0} Last Will items`,
    items_updated: data?.length || 0,
    last_checkin: now
  })
}

// GET - Verificar status de check-in do cliente
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const client_id = searchParams.get('client_id')
  
  if (!client_id) {
    return NextResponse.json({ error: 'client_id is required' }, { status: 400 })
  }
  
  const { data, error } = await supabase
    .from('vault_items')
    .select('id, item_code, last_will_last_checkin, last_will_checkin_days, created_at')
    .eq('client_id', client_id)
    .eq('is_last_will', true)
    .eq('status', 'active')
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  const status = data?.map(item => {
    const lastCheckin = item.last_will_last_checkin 
      ? new Date(item.last_will_last_checkin)
      : new Date(item.created_at)
    
    const checkinDays = item.last_will_checkin_days || 30
    const daysSince = Math.floor((Date.now() - lastCheckin.getTime()) / (1000 * 60 * 60 * 24))
    const daysRemaining = checkinDays - daysSince
    
    return {
      item_code: item.item_code,
      last_checkin: lastCheckin.toISOString(),
      days_since_checkin: daysSince,
      days_remaining: Math.max(0, daysRemaining),
      status: daysRemaining <= 0 ? 'OVERDUE' : daysRemaining <= 7 ? 'WARNING' : 'OK',
      needs_checkin: daysRemaining <= 7
    }
  })
  
  return NextResponse.json({
    client_id,
    items: status,
    any_overdue: status?.some(s => s.status === 'OVERDUE'),
    any_warning: status?.some(s => s.status === 'WARNING')
  })
}
