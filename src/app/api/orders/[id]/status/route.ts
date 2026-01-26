import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { requireRole } from '@/middleware/rbac'
import { notifyStatusChange } from '@/lib/notifications'

// PATCH - Atualizar status do pedido (admin or courier)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  // ✅ SECURITY: Only admin or courier can update status
  const authResult = await requireRole(['admin', 'courier'])
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const supabase = createClient()
  const { status, notes, send_notifications = true } = await request.json()

  // Atualizar pedido
  const { data: delivery, error: deliveryError } = await supabase
    .from('deliveries')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', params.id)
    .select(`
      *,
      clients (
        id,
        name,
        phone,
        email
      )
    `)
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

  // ✅ Send automatic notifications via centralized service
  let notificationResults: any[] = []
  if (send_notifications) {
    try {
      notificationResults = await notifyStatusChange(
        params.id,
        status,
        {
          tracking_code: delivery.tracking_code,
          recipient_phone: delivery.recipient_phone,
          recipient_email: delivery.recipient_email,
          client: delivery.clients as any,
          eta: delivery.eta
        },
        notes
      )

      // Log notification results
      console.log(`[Notifications] Status ${status} for ${delivery.tracking_code}:`, {
        sent: notificationResults.filter(r => r.success).length,
        failed: notificationResults.filter(r => !r.success).length
      })
    } catch (e) {
      console.error('[Notifications] Error sending notifications:', e)
    }
  }

  return NextResponse.json({
    ...delivery,
    notifications: {
      sent: notificationResults.filter(r => r.success).length,
      failed: notificationResults.filter(r => !r.success).length,
      results: notificationResults
    }
  })
}
