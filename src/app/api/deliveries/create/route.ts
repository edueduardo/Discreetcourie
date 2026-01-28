import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function generateTrackingCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let code = 'DC-'
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    const body = await request.json()
    const {
      pickup_address,
      delivery_address,
      pickup_time,
      delivery_time,
      urgency,
      service_type,
      price,
      customer_name,
      customer_email,
      customer_phone,
      notes,
      is_zero_trace
    } = body

    // Validate required fields
    if (!pickup_address || !delivery_address) {
      return NextResponse.json(
        { error: 'Pickup and delivery addresses are required' },
        { status: 400 }
      )
    }

    // Generate unique tracking code
    const tracking_code = generateTrackingCode()

    // Get or create client
    let client_id = null
    
    if (customer_email) {
      // Check if client exists
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('email', customer_email)
        .single()

      if (existingClient) {
        client_id = existingClient.id
      } else {
        // Create new client
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert([
            {
              name: customer_name || 'Anonymous',
              email: customer_email,
              phone: customer_phone || null,
              user_id: session?.user?.id || null
            }
          ])
          .select('id')
          .single()

        if (clientError) {
          console.error('Error creating client:', clientError)
        } else {
          client_id = newClient.id
        }
      }
    }

    // Create delivery
    const { data: delivery, error: deliveryError } = await supabase
      .from('deliveries')
      .insert([
        {
          tracking_code,
          client_id,
          pickup_address,
          delivery_address,
          pickup_time: pickup_time || null,
          delivery_time: delivery_time || null,
          status: 'pending',
          urgency: urgency || 'same_day',
          service_type: service_type || 'courier',
          price: price || 0,
          notes: notes || null,
          is_zero_trace: is_zero_trace || false,
          created_at: new Date().toISOString()
        }
      ])
      .select('id, tracking_code, status, created_at')
      .single()

    if (deliveryError) {
      console.error('Error creating delivery:', deliveryError)
      return NextResponse.json(
        { error: 'Failed to create delivery' },
        { status: 500 }
      )
    }

    // Send notifications
    try {
      // Import notification helpers
      const { sendOperatorNotification, SMS_TEMPLATES } = await import('@/lib/twilio')
      const { sendEmail, sendOperatorEmail } = await import('@/lib/email')

      // Notify operator via SMS
      await sendOperatorNotification(
        SMS_TEMPLATES.newDelivery(
          tracking_code,
          pickup_address,
          delivery_address
        )
      )

      // Notify operator via Email
      await sendOperatorEmail(
        'New Delivery Created',
        `New delivery created!\n\nTracking: ${tracking_code}\nPickup: ${pickup_address}\nDelivery: ${delivery_address}\nPrice: $${price}\n\nCheck admin dashboard for details.`
      )

      // Send confirmation to customer if email provided
      if (customer_email) {
        await sendEmail({
          to: customer_email,
          template: 'delivery_created',
          variables: {
            recipientName: customer_name,
            trackingCode: tracking_code,
            actionUrl: `${process.env.NEXTAUTH_URL}/track?code=${tracking_code}`
          }
        })

        // Send SMS to customer if phone provided
        if (customer_phone) {
          const { sendSMS, SMS_TEMPLATES } = await import('@/lib/twilio')
          await sendSMS({
            to: customer_phone,
            message: SMS_TEMPLATES.deliveryConfirmation(tracking_code, 'Within 2 hours')
          })
        }
      }
    } catch (notifError) {
      console.error('Notification error (non-blocking):', notifError)
      // Don't fail the request if notifications fail
    }

    return NextResponse.json(
      {
        success: true,
        delivery: {
          id: delivery.id,
          tracking_code: delivery.tracking_code,
          status: delivery.status,
          created_at: delivery.created_at
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Delivery creation error:', error)
    
    return NextResponse.json(
      { error: error.message || 'Failed to create delivery' },
      { status: 500 }
    )
  }
}
