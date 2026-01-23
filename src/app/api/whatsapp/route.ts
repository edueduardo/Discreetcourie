import { NextRequest, NextResponse } from 'next/server'

/*
 * WhatsApp Business API Integration
 *
 * This endpoint sends WhatsApp messages using Twilio's WhatsApp API.
 * Twilio provides a production-ready WhatsApp Business API solution.
 *
 * Setup Required:
 * 1. Twilio account with WhatsApp enabled
 * 2. Verified WhatsApp Business profile
 * 3. Environment variables configured
 */

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const whatsappFrom = process.env.TWILIO_WHATSAPP_NUMBER || 'whatsapp:+14155238886' // Twilio Sandbox

interface WhatsAppMessage {
  to: string
  message: string
  template?: string
  mediaUrl?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: WhatsAppMessage = await request.json()
    const { to, message, template, mediaUrl } = body

    if (!to || !message) {
      return NextResponse.json({
        error: 'Phone number and message are required'
      }, { status: 400 })
    }

    // Check if Twilio is configured
    if (!accountSid || !authToken) {
      console.warn('Twilio not configured - WhatsApp message not sent')
      return NextResponse.json({
        success: false,
        error: 'WhatsApp not configured',
        message: 'Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN to enable WhatsApp'
      }, { status: 200 })
    }

    // Format phone number (must include country code)
    let formattedTo = to.replace(/\D/g, '') // Remove non-digits
    if (!formattedTo.startsWith('1') && formattedTo.length === 10) {
      formattedTo = '1' + formattedTo // Add US country code if missing
    }
    formattedTo = 'whatsapp:+' + formattedTo

    // Send via Twilio WhatsApp API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

    const params = new URLSearchParams({
      From: whatsappFrom,
      To: formattedTo,
      Body: message
    })

    if (mediaUrl) {
      params.append('MediaUrl', mediaUrl)
    }

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || 'Failed to send WhatsApp message')
    }

    return NextResponse.json({
      success: true,
      messageId: data.sid,
      status: data.status,
      to: formattedTo
    })

  } catch (error: any) {
    console.error('WhatsApp send error:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to send WhatsApp message',
      message: error.message
    }, { status: 500 })
  }
}

// GET - Check WhatsApp configuration status
export async function GET() {
  return NextResponse.json({
    configured: !!(accountSid && authToken),
    whatsappNumber: whatsappFrom,
    provider: 'Twilio WhatsApp Business API',
    documentation: 'https://www.twilio.com/docs/whatsapp/api'
  })
}
