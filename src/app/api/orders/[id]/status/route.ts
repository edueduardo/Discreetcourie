import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Map delivery status to SMS event type
const STATUS_TO_SMS_EVENT: Record<string, string> = {
  'picked_up': 'delivery_picked_up',
  'in_transit': 'delivery_in_transit',
  'delivered': 'delivery_completed',
  'completed': 'delivery_completed',
  'failed': 'delivery_failed',
  'cancelled': 'delivery_failed'
}

// PATCH - Atualizar status do pedido
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { status, notes, send_sms = true } = await request.json()
  
  // Atualizar pedido
  const { data: delivery, error: deliveryError } = await supabase
    .from('deliveries')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', params.id)
    .select('*, clients(phone)')
    .single()
  
  if (deliveryError) {
    return NextResponse.json({ error: deliveryError.message }, { status: 500 })
  }
  
  // Criar evento de histórico
  await supabase
    .from('delivery_events')
    .insert({
      delivery_id: params.id,
      event_type: status,
      description: notes || `Status changed to ${status}`,
      created_at: new Date().toISOString()
    })
  
  // Send automatic SMS notification if applicable
  if (send_sms && STATUS_TO_SMS_EVENT[status]) {
    const smsEventType = STATUS_TO_SMS_EVENT[status]
    const phones: string[] = []
    
    if (delivery.recipient_phone) phones.push(delivery.recipient_phone)
    if ((delivery.clients as any)?.phone) phones.push((delivery.clients as any).phone)
    
    if (phones.length > 0) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sms/events`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            event_type: smsEventType,
            phone_numbers: phones,
            delivery_id: params.id,
            variables: {
              tracking_code: delivery.tracking_code,
              reason: notes || 'No details provided',
              eta: delivery.eta || 'To be confirmed'
            }
          })
        })
      } catch (e) {
        console.error('SMS notification failed:', e)
      }
    }
  }
  
  return NextResponse.json(delivery)
}
