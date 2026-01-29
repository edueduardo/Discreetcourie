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

    const body = await request.json()
    const { delivery_id, latitude, longitude, status, notes } = body

    if (!delivery_id || !latitude || !longitude) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert GPS location
    const { data: location, error: locationError } = await supabase
      .from('gps_tracking')
      .insert([
        {
          delivery_id,
          latitude,
          longitude,
          recorded_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (locationError) {
      console.error('Error saving GPS location:', locationError)
      return NextResponse.json(
        { error: 'Failed to save location' },
        { status: 500 }
      )
    }

    // Update delivery status if provided
    if (status) {
      const updateData: any = { status }
      if (notes) updateData.notes = notes

      await supabase
        .from('deliveries')
        .update(updateData)
        .eq('id', delivery_id)

      // Send notification to client
      try {
        const { data: delivery } = await supabase
          .from('deliveries')
          .select('tracking_code, clients(email, phone)')
          .eq('id', delivery_id)
          .single()

        if (delivery?.clients) {
          const { sendEmail } = await import('@/lib/email')
          const { sendSMS, SMS_TEMPLATES } = await import('@/lib/twilio')

          // Email notification
          const client = Array.isArray(delivery.clients) ? delivery.clients[0] : delivery.clients
          if (client?.email) {
            await sendEmail({
              to: client.email,
              template: 'delivery_status',
              variables: {
                trackingCode: delivery.tracking_code,
                status,
                message: notes,
                actionUrl: `${process.env.NEXTAUTH_URL}/track?code=${delivery.tracking_code}`
              }
            })
          }

          // SMS notification
          if (client?.phone) {
            await sendSMS({
              to: client.phone,
              message: SMS_TEMPLATES.statusUpdate(delivery.tracking_code, status)
            })
          }
        }
      } catch (notifError) {
        console.error('Notification error:', notifError)
      }
    }

    return NextResponse.json({
      success: true,
      location: {
        id: location.id,
        latitude: location.latitude,
        longitude: location.longitude,
        recorded_at: location.recorded_at
      }
    })
  } catch (error: any) {
    console.error('GPS tracking error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to update tracking' },
      { status: 500 }
    )
  }
}
