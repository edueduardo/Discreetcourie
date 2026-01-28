import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Only admin and courier can update status
    if (session.user.role !== 'admin' && session.user.role !== 'courier') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { delivery_id, status, notes } = body

    if (!delivery_id || !status) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Valid statuses
    const validStatuses = ['pending', 'confirmed', 'picked_up', 'in_transit', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      )
    }

    // Update delivery
    const updateData: any = { 
      status,
      updated_at: new Date().toISOString()
    }
    
    if (notes) updateData.notes = notes
    if (status === 'delivered') updateData.delivered_at = new Date().toISOString()

    const { data: delivery, error: updateError } = await supabase
      .from('deliveries')
      .update(updateData)
      .eq('id', delivery_id)
      .select('id, tracking_code, status, clients(email, phone, name)')
      .single()

    if (updateError) {
      console.error('Error updating delivery:', updateError)
      return NextResponse.json(
        { error: 'Failed to update delivery' },
        { status: 500 }
      )
    }

    // Send notifications
    try {
      if (delivery.clients) {
        const { sendEmail } = await import('@/lib/email')
        const { sendSMS, SMS_TEMPLATES } = await import('@/lib/twilio')

        // Email notification
        if (delivery.clients.email) {
          const template = status === 'delivered' ? 'delivery_completed' : 'delivery_status'
          await sendEmail({
            to: delivery.clients.email,
            template,
            variables: {
              recipientName: delivery.clients.name,
              trackingCode: delivery.tracking_code,
              status,
              message: notes,
              actionUrl: `${process.env.NEXTAUTH_URL}/track?code=${delivery.tracking_code}`
            }
          })
        }

        // SMS notification
        if (delivery.clients.phone) {
          const message = status === 'delivered' 
            ? SMS_TEMPLATES.deliveryCompleted(delivery.tracking_code)
            : SMS_TEMPLATES.statusUpdate(delivery.tracking_code, status)
          
          await sendSMS({
            to: delivery.clients.phone,
            message
          })
        }
      }
    } catch (notifError) {
      console.error('Notification error:', notifError)
    }

    return NextResponse.json({
      success: true,
      delivery: {
        id: delivery.id,
        tracking_code: delivery.tracking_code,
        status: delivery.status
      }
    })
  } catch (error: any) {
    console.error('Status update error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to update status' },
      { status: 500 }
    )
  }
}
