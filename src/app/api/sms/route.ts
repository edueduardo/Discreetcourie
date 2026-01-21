import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { withRateLimit, addHeaders, withSecurityHeaders } from '@/lib/api-middleware'
import { RateLimits } from '@/lib/rate-limit'
import { sendSMSSchema, safeValidateData, formatValidationErrors } from '@/lib/validation'

// Twilio client (conditional)
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhone = process.env.TWILIO_PHONE_NUMBER

// GET - List sent SMS from database
export async function GET(request: NextRequest) {
  // Rate limiting: 120 requests per minute
  const rateLimitResult = withRateLimit(request, RateLimits.READ)
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!
  }

  const supabase = createClient()

  const { searchParams } = new URL(request.url)
  const limit = parseInt(searchParams.get('limit') || '20')

  // Get SMS logs from secure_messages table
  const { data, error } = await supabase
    .from('secure_messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  let response = NextResponse.json({ messages: data || [] })
  response = addHeaders(response, rateLimitResult.headers)
  response = withSecurityHeaders(response)
  return response
}

// POST - Send SMS via Twilio
export async function POST(request: NextRequest) {
  // STRICT rate limiting: 5 requests per 15 minutes (SMS costs money!)
  const rateLimitResult = withRateLimit(request, RateLimits.STRICT)
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!
  }

  if (!accountSid || !authToken || !twilioPhone) {
    return NextResponse.json({
      error: 'Twilio not configured',
      message: 'Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER to environment variables',
      configured: false
    }, { status: 200 })
  }

  try {
    const body = await request.json()

    // Validate and sanitize input
    const validationResult = safeValidateData(sendSMSSchema, body)

    if (!validationResult.success) {
      return NextResponse.json(formatValidationErrors(validationResult.error), { status: 400 })
    }

    const { to, message, deliveryId, clientId } = validationResult.data

    // Format phone number (ensure +1 for US)
    const formattedPhone = to.startsWith('+') ? to : `+1${to}`

    // Send SMS via Twilio REST API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

    const twilioResponse = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: twilioPhone,
        To: formattedPhone,
        Body: message,
      }),
    })

    const twilioData = await twilioResponse.json()

    if (!twilioResponse.ok) {
      return NextResponse.json({
        error: 'Twilio API error',
        message: twilioData.message || 'Failed to send SMS'
      }, { status: 500 })
    }

    // Log to Supabase (sanitized message already)
    const supabase = createClient()
    await supabase.from('secure_messages').insert({
      sender_type: 'admin',
      content: message,
      encrypted: false,
    })

    let response = NextResponse.json({
      success: true,
      messageId: twilioData.sid,
      to: formattedPhone,
      status: twilioData.status
    })
    response = addHeaders(response, rateLimitResult.headers)
    response = withSecurityHeaders(response)
    return response

  } catch (error: any) {

    return NextResponse.json({
      error: 'Failed to send SMS',
      message: error.message
    }, { status: 500 })
  }
}
