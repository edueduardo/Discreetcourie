import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendEmail } from '@/lib/email'

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

    // Detect service type from variables or analysis
    const serviceType = variables?.service_type || analysis?.service_type || 'courier'
    const taskCategory = variables?.task_category || analysis?.task_category || 'delivery'
    const noTraceRequested = variables?.no_trace_requested || analysis?.no_trace_requested || false

    // Extract delivery/task info from the call
    const extractedData = {
      pickup_address: variables?.pickup_address || analysis?.pickup_address,
      delivery_address: variables?.delivery_address || analysis?.delivery_address,
      package_description: variables?.package_description || analysis?.package_description,
      special_instructions: variables?.special_instructions || analysis?.special_instructions,
      preferred_time: variables?.preferred_time || analysis?.preferred_time,
      caller_name: variables?.caller_name || analysis?.caller_name,
      caller_phone: from,
      // Concierge-specific fields
      service_type: serviceType,
      task_category: taskCategory,
      task_description: variables?.description || analysis?.description,
      location: variables?.location || analysis?.location,
      urgency: variables?.urgency || analysis?.urgency || 'flexible',
      no_trace_requested: noTraceRequested,
      callback_time: variables?.callback_time || analysis?.callback_time,
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
        service_type: serviceType, // delivery or concierge
      })
      .select()
      .single()

    if (callError) {
      console.error('Error storing call:', callError)
    }

    // Check if client exists by phone, or create new
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
          privacy_level: noTraceRequested ? 'none' : 'status_only',
        })
        .select('id')
        .single()
      
      clientId = newClient?.id
    }

    // Handle based on service type
    if (serviceType === 'concierge' || serviceType === 'fixer' || taskCategory !== 'delivery') {
      // Create concierge task
      if (clientId) {
        const { error: taskError } = await supabase
          .from('concierge_tasks')
          .insert({
            client_id: clientId,
            service_tier: serviceType === 'fixer' ? 'fixer' : 'concierge',
            category: taskCategory,
            title: extractedData.task_description?.substring(0, 100) || 'Phone Request',
            description: extractedData.task_description || transcript || 'Details to be confirmed via callback',
            special_instructions: extractedData.special_instructions,
            location_address: extractedData.location || extractedData.pickup_address,
            status: 'requested',
            no_trace_mode: noTraceRequested,
            nda_required: serviceType === 'fixer',
          })

        if (taskError) {
          console.error('Error creating concierge task:', taskError)
        }
      }
    } else if (extractedData.pickup_address && extractedData.delivery_address) {
      // Standard delivery flow
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
            is_confidential: serviceType === 'discreet',
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

    // Send notification to admin about new call/request
    const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL
    if (adminEmail) {
      try {
        await sendEmail({
          to: adminEmail,
          template: 'newDeliveryRequest',
          data: {
            tracking_code: `CALL-${call_id}`,
            pickup_address: extractedData.pickup_address || 'Via phone call',
            delivery_address: extractedData.delivery_address || 'To be confirmed',
            service_type: serviceType,
            caller_phone: from,
            summary: summary || 'New phone request received',
          }
        })
      } catch (emailError) {
        console.error('Failed to send admin notification:', emailError)
      }
    }

    // Also try push notification if configured
    if (process.env.VAPID_PRIVATE_KEY) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/push`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: `New ${serviceType} Request`,
            body: `From: ${from} - ${extractedData.task_description || 'Phone call received'}`,
            url: '/admin/deliveries'
          })
        })
      } catch (pushError) {
        console.error('Failed to send push notification:', pushError)
      }
    }

    return NextResponse.json({ 
      success: true,
      service_type: serviceType,
      task_category: taskCategory 
    })
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
