import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhone = process.env.TWILIO_PHONE_NUMBER

let twilioClient: ReturnType<typeof twilio> | null = null

function getTwilioClient() {
  if (!twilioClient && accountSid && authToken) {
    twilioClient = twilio(accountSid, authToken)
  }
  return twilioClient
}

export interface SendSMSParams {
  to: string
  message: string
}

export async function sendSMS({ to, message }: SendSMSParams): Promise<{ success: boolean; error?: string; sid?: string }> {
  try {
    const client = getTwilioClient()
    
    if (!client || !twilioPhone) {
      console.warn('Twilio not configured, skipping SMS')
      return { success: false, error: 'Twilio not configured' }
    }

    // Format phone number (remove non-digits, add +1 if needed)
    let formattedPhone = to.replace(/\D/g, '')
    if (formattedPhone.length === 10) {
      formattedPhone = '+1' + formattedPhone
    } else if (!formattedPhone.startsWith('+')) {
      formattedPhone = '+' + formattedPhone
    }

    const result = await client.messages.create({
      body: message,
      from: twilioPhone,
      to: formattedPhone
    })

    console.log('SMS sent successfully:', result.sid)
    return { success: true, sid: result.sid }
  } catch (error: any) {
    console.error('SMS send error:', error)
    return { success: false, error: error.message }
  }
}

export async function sendOperatorNotification(message: string): Promise<void> {
  const operatorPhone = process.env.OPERATOR_PHONE_NUMBER || '+16145003080'
  await sendSMS({ to: operatorPhone, message })
}

export const SMS_TEMPLATES = {
  newDelivery: (trackingCode: string, pickup: string, delivery: string) => 
    `🚨 NEW DELIVERY!\n\nTracking: ${trackingCode}\nPickup: ${pickup}\nDelivery: ${delivery}\n\nCheck admin dashboard for details.`,
  
  deliveryConfirmation: (trackingCode: string, estimatedTime: string) =>
    `✅ Delivery confirmed!\n\nTracking: ${trackingCode}\nEstimated: ${estimatedTime}\n\nTrack at: discreetcourier.com/track`,
  
  deliveryCompleted: (trackingCode: string) =>
    `✅ Delivery completed!\n\nTracking: ${trackingCode}\n\nThank you for using Discreet Courier!`,
  
  statusUpdate: (trackingCode: string, status: string) =>
    `📦 Status Update\n\nTracking: ${trackingCode}\nStatus: ${status}\n\nTrack at: discreetcourier.com/track`
}
