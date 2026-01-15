// SMS Event Templates and Automatic Notifications
// Sistema para enviar SMS automáticos em eventos do sistema

export type SMSEventType = 
  | 'delivery_created'
  | 'delivery_picked_up'
  | 'delivery_in_transit'
  | 'delivery_completed'
  | 'delivery_failed'
  | 'payment_received'
  | 'vault_item_added'
  | 'guardian_alert'
  | 'emergency_triggered'
  | 'vetting_approved'
  | 'vetting_rejected'
  | 'last_will_reminder'
  | 'time_capsule_delivered'
  | 'message_received'

interface SMSTemplate {
  subject: string
  template: string
}

export const SMS_TEMPLATES: Record<SMSEventType, SMSTemplate> = {
  delivery_created: {
    subject: 'New Delivery',
    template: '[Discreet Courier] Your delivery #{tracking_code} has been created. We will notify you when it\'s picked up.'
  },
  delivery_picked_up: {
    subject: 'Delivery Picked Up',
    template: '[Discreet Courier] Your package #{tracking_code} has been picked up and is now in our care. Track: {track_url}'
  },
  delivery_in_transit: {
    subject: 'In Transit',
    template: '[Discreet Courier] Your delivery #{tracking_code} is now in transit. ETA: {eta}. Track: {track_url}'
  },
  delivery_completed: {
    subject: 'Delivery Complete',
    template: '[Discreet Courier] ✅ Your delivery #{tracking_code} has been completed successfully. Thank you for trusting us!'
  },
  delivery_failed: {
    subject: 'Delivery Issue',
    template: '[Discreet Courier] ⚠️ Delivery #{tracking_code} could not be completed. Reason: {reason}. Contact us for assistance.'
  },
  payment_received: {
    subject: 'Payment Confirmed',
    template: '[Discreet Courier] Payment of ${amount} received. Thank you! Invoice: {invoice_number}'
  },
  vault_item_added: {
    subject: 'Vault Updated',
    template: '[Discreet Courier] 🔐 New item added to your secure vault. Access your vault to view details.'
  },
  guardian_alert: {
    subject: 'Guardian Alert',
    template: '[Discreet Courier] 🚨 GUARDIAN ALERT: {alert_message}. Immediate attention required!'
  },
  emergency_triggered: {
    subject: 'Emergency Protocol',
    template: '[Discreet Courier] 🆘 EMERGENCY PROTOCOL ACTIVATED for {client_name}. Protocol: {protocol_type}.'
  },
  vetting_approved: {
    subject: 'Application Approved',
    template: '[Discreet Courier] ✅ Welcome! Your application has been approved. You now have access to our exclusive services.'
  },
  vetting_rejected: {
    subject: 'Application Status',
    template: '[Discreet Courier] Thank you for your interest. Unfortunately, we cannot proceed with your application at this time.'
  },
  last_will_reminder: {
    subject: 'Check-in Reminder',
    template: '[Discreet Courier] 📋 Reminder: Please check in to confirm your well-being. Your Last Will items depend on it.'
  },
  time_capsule_delivered: {
    subject: 'Time Capsule',
    template: '[Discreet Courier] 💊 Your time capsule has been delivered as scheduled. Check your email for details.'
  },
  message_received: {
    subject: 'New Message',
    template: '[Discreet Courier] 💬 You have a new secure message. Log in to view it.'
  }
}

// Helper to replace template variables
export function formatSMSTemplate(eventType: SMSEventType, variables: Record<string, string | number>): string {
  let message = SMS_TEMPLATES[eventType].template
  
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value))
  }
  
  return message
}

// Main function to send event-based SMS
export async function sendEventSMS(
  eventType: SMSEventType,
  phoneNumber: string,
  variables: Record<string, string | number> = {},
  baseUrl?: string
): Promise<{ success: boolean; error?: string }> {
  if (!phoneNumber) {
    return { success: false, error: 'No phone number provided' }
  }

  const message = formatSMSTemplate(eventType, variables)
  const url = baseUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  try {
    const response = await fetch(`${url}/api/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phoneNumber,
        message
      })
    })

    if (!response.ok) {
      const data = await response.json()
      return { success: false, error: data.error || 'SMS send failed' }
    }

    return { success: true }
  } catch (error: any) {
    console.error('SMS Event Error:', error)
    return { success: false, error: error.message }
  }
}

// Batch send to multiple numbers
export async function sendEventSMSBatch(
  eventType: SMSEventType,
  phoneNumbers: string[],
  variables: Record<string, string | number> = {},
  baseUrl?: string
): Promise<{ sent: number; failed: number; errors: string[] }> {
  const results = await Promise.all(
    phoneNumbers.map(phone => sendEventSMS(eventType, phone, variables, baseUrl))
  )

  return {
    sent: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    errors: results.filter(r => r.error).map(r => r.error!)
  }
}
