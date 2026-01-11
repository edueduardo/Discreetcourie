import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Bland.ai webhook payload structure
    const {
      call_id,
      status,
      from,
      to,
      duration,
      transcript,
      summary,
      analysis,
      variables,
    } = body

    const supabase = createClient()

    // Extract delivery info from the call
    const extractedData = {
      pickup_address: variables?.pickup_address || analysis?.pickup_address,
      delivery_address: variables?.delivery_address || analysis?.delivery_address,
      package_description: variables?.package_description || analysis?.package_description,
      special_instructions: variables?.special_instructions || analysis?.special_instructions,
      preferred_time: variables?.preferred_time || analysis?.preferred_time,
      caller_name: variables?.caller_name || analysis?.caller_name,
      caller_phone: from,
    }

    // Store the call record
    const { data: callRecord, error: callError } = await supabase
      .from('bland_calls')
      .insert({
        call_id,
        phone_number: from,
        direction: 'inbound',
        status: status === 'completed' ? 'completed' : 'failed',
        duration,
        transcript,
        summary,
        extracted_data: extractedData,
      })
      .select()
      .single()

    if (callError) {
      console.error('Error storing call:', callError)
    }

    // If we have enough info, create a pending delivery
    if (extractedData.pickup_address && extractedData.delivery_address) {
      // Check if client exists by phone
      let clientId = null
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('phone', from)
        .single()

      if (existingClient) {
        clientId = existingClient.id
      } else {
        // Create new client
        const { data: newClient } = await supabase
          .from('clients')
          .insert({
            name: extractedData.caller_name || 'Phone Customer',
            phone: from,
            privacy_level: 'status_only',
          })
          .select('id')
          .single()
        
        clientId = newClient?.id
      }

      if (clientId) {
        // Generate tracking code
        const trackingCode = `DC-${Math.random().toString(36).substring(2, 10).toUpperCase()}`

        // Create delivery
        const { error: deliveryError } = await supabase
          .from('deliveries')
          .insert({
            tracking_code: trackingCode,
            client_id: clientId,
            pickup_address: extractedData.pickup_address,
            delivery_address: extractedData.delivery_address,
            package_description: extractedData.package_description,
            delivery_notes: extractedData.special_instructions,
            status: 'pending',
            priority: 'standard',
            price: 0, // To be set by admin
            bland_call_id: call_id,
          })

        if (deliveryError) {
          console.error('Error creating delivery:', deliveryError)
        }

        // Update call record with delivery reference
        if (callRecord) {
          await supabase
            .from('bland_calls')
            .update({ delivery_id: callRecord.id })
            .eq('id', callRecord.id)
        }
      }
    }

    // TODO: Send notification to Eduardo (SMS/Push)
    // This could integrate with Twilio or other notification service

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Verify webhook signature (optional security measure)
export async function GET(request: NextRequest) {
  return NextResponse.json({ status: 'Bland.ai webhook endpoint active' })
}
