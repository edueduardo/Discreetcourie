/**
 * WhatsApp Notification Utilities
 *
 * Helper functions for sending WhatsApp messages via Twilio
 */

interface WhatsAppParams {
  to: string
  message: string
  mediaUrl?: string
}

export async function sendWhatsApp({ to, message, mediaUrl }: WhatsAppParams) {
  try {
    const response = await fetch('/api/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to, message, mediaUrl })
    })

    const data = await response.json()
    return { success: data.success, data }
  } catch (error: any) {
    console.error('WhatsApp send error:', error)
    return { success: false, error: error.message }
  }
}

// Pre-built notification templates
export const WhatsAppTemplates = {
  // Quote notification
  quoteReady: (customerName: string, amount: number, quoteUrl: string) => {
    return `Hi ${customerName}! 📋

Your delivery quote is ready: $${amount.toFixed(2)}

View details: ${quoteUrl}

Book now or call (614) 500-3080

- Discreet Courier Columbus`
  },

  // Booking confirmation
  bookingConfirmed: (customerName: string, trackingCode: string, pickupTime: string) => {
    return `Hi ${customerName}! ✅

Your delivery is confirmed!

Tracking: ${trackingCode}
Pickup: ${pickupTime}

Track your delivery: ${process.env.NEXT_PUBLIC_APP_URL}/track

Questions? Call (614) 500-3080

- Discreet Courier Columbus`
  },

  // Pickup notification
  pickedUp: (trackingCode: string) => {
    return `📦 Package picked up!

Tracking: ${trackingCode}

Your delivery is on the way. Track live:
${process.env.NEXT_PUBLIC_APP_URL}/track

- Discreet Courier Columbus`
  },

  // Delivery notification
  delivered: (trackingCode: string, photoUrl?: string) => {
    let message = `✅ Delivered successfully!

Tracking: ${trackingCode}

Your package has been delivered.`

    if (photoUrl) {
      message += `\n\nPhoto proof: ${photoUrl}`
    }

    message += `\n\nThank you for choosing Discreet Courier!
Questions? Call (614) 500-3080`

    return message
  },

  // Payment received
  paymentReceived: (amount: number, invoiceNumber: string) => {
    return `💳 Payment received!

Amount: $${amount.toFixed(2)}
Invoice: ${invoiceNumber}

Thank you for your payment!

- Discreet Courier Columbus
(614) 500-3080`
  },

  // Reminder notification
  followUpReminder: (customerName: string, daysInactive: number) => {
    return `Hi ${customerName}! 👋

It's been ${daysInactive} days since your last delivery.

Need another discreet delivery?
• Same-day available
• Photo proof included
• 100% confidential

Book online: ${process.env.NEXT_PUBLIC_APP_URL}/quote
Or call: (614) 500-3080

- Discreet Courier Columbus`
  },

  // Custom message
  custom: (message: string) => {
    return `${message}

- Discreet Courier Columbus
(614) 500-3080`
  }
}

// Send notification with automatic template
export async function notifyCustomer(
  type: keyof typeof WhatsAppTemplates,
  phone: string,
  ...args: any[]
) {
  const template = WhatsAppTemplates[type]
  if (!template) {
    throw new Error(`Unknown template: ${type}`)
  }

  // @ts-ignore - Dynamic template function
  const message = template(...args)

  return sendWhatsApp({
    to: phone,
    message
  })
}

// Check if WhatsApp is configured
export async function isWhatsAppConfigured() {
  try {
    const response = await fetch('/api/whatsapp')
    const data = await response.json()
    return data.configured
  } catch (error) {
    return false
  }
}
