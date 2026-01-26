/**
 * Centralized Notification Service
 * Handles automatic notifications via SMS, Email, WhatsApp, and Push
 *
 * For Solo Operator in Columbus, Ohio
 */

import { sendEmail, EmailTemplate } from './email'

// Notification types based on delivery status
export type NotificationType =
  | 'order_created'
  | 'order_confirmed'
  | 'picked_up'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'failed'
  | 'cancelled'
  | 'payment_received'
  | 'payment_failed'

// Notification channels
export type NotificationChannel = 'sms' | 'email' | 'whatsapp' | 'push'

// Message templates for each notification type
const NOTIFICATION_TEMPLATES: Record<NotificationType, {
  sms: string
  email: {
    template: EmailTemplate
    subject: string
  }
  whatsapp: string
}> = {
  order_created: {
    sms: '[Discreet Courier] Your order {tracking_code} has been received. Track: {tracking_url}',
    email: {
      template: 'delivery_created',
      subject: 'Order Confirmed - {tracking_code}'
    },
    whatsapp: 'Your Discreet Courier order *{tracking_code}* has been received. Track your delivery: {tracking_url}'
  },
  order_confirmed: {
    sms: '[Discreet Courier] Order {tracking_code} confirmed! We\'ll pick it up soon.',
    email: {
      template: 'delivery_status',
      subject: 'Order Confirmed - {tracking_code}'
    },
    whatsapp: 'Your order *{tracking_code}* is confirmed! We\'ll notify you when pickup begins.'
  },
  picked_up: {
    sms: '[Discreet Courier] Package picked up! Tracking: {tracking_code}. On the way!',
    email: {
      template: 'delivery_status',
      subject: 'Package Picked Up - {tracking_code}'
    },
    whatsapp: 'Great news! Your package *{tracking_code}* has been picked up and is on its way!'
  },
  in_transit: {
    sms: '[Discreet Courier] Your package {tracking_code} is in transit. ETA: {eta}',
    email: {
      template: 'delivery_status',
      subject: 'In Transit - {tracking_code}'
    },
    whatsapp: 'Your package *{tracking_code}* is in transit. Estimated arrival: {eta}'
  },
  out_for_delivery: {
    sms: '[Discreet Courier] Your package {tracking_code} is out for delivery! Arriving soon.',
    email: {
      template: 'delivery_status',
      subject: 'Out for Delivery - {tracking_code}'
    },
    whatsapp: 'Almost there! Your package *{tracking_code}* is out for delivery!'
  },
  delivered: {
    sms: '[Discreet Courier] Delivered! Package {tracking_code} has been delivered successfully.',
    email: {
      template: 'delivery_completed',
      subject: 'Delivered Successfully - {tracking_code}'
    },
    whatsapp: 'Your package *{tracking_code}* has been delivered! Thank you for choosing Discreet Courier.'
  },
  failed: {
    sms: '[Discreet Courier] Delivery failed for {tracking_code}. Reason: {reason}. We\'ll retry.',
    email: {
      template: 'delivery_status',
      subject: 'Delivery Failed - {tracking_code}'
    },
    whatsapp: 'We couldn\'t deliver *{tracking_code)}*. Reason: {reason}. We\'ll try again soon.'
  },
  cancelled: {
    sms: '[Discreet Courier] Order {tracking_code} has been cancelled. Contact us for questions.',
    email: {
      template: 'delivery_status',
      subject: 'Order Cancelled - {tracking_code}'
    },
    whatsapp: 'Your order *{tracking_code}* has been cancelled. Please contact us if you have questions.'
  },
  payment_received: {
    sms: '[Discreet Courier] Payment of ${amount} received for {tracking_code}. Thank you!',
    email: {
      template: 'payment_received',
      subject: 'Payment Received - ${amount}'
    },
    whatsapp: 'Payment of *${amount}* received for order *{tracking_code}*. Thank you!'
  },
  payment_failed: {
    sms: '[Discreet Courier] Payment failed for {tracking_code}. Please update payment method.',
    email: {
      template: 'payment_failed',
      subject: 'Payment Failed - Action Required'
    },
    whatsapp: 'Payment failed for order *{tracking_code}*. Please update your payment method.'
  }
}

// Status to notification type mapping
const STATUS_TO_NOTIFICATION: Record<string, NotificationType> = {
  'pending': 'order_created',
  'confirmed': 'order_confirmed',
  'picked_up': 'picked_up',
  'in_transit': 'in_transit',
  'out_for_delivery': 'out_for_delivery',
  'delivered': 'delivered',
  'failed': 'failed',
  'cancelled': 'cancelled',
  'completed': 'delivered'
}

interface NotificationRecipient {
  phone?: string
  email?: string
  pushToken?: string
}

interface NotificationVariables {
  tracking_code?: string
  tracking_url?: string
  eta?: string
  amount?: string
  reason?: string
  recipientName?: string
  [key: string]: string | undefined
}

interface NotificationResult {
  success: boolean
  channel: NotificationChannel
  error?: string
  messageId?: string
}

/**
 * Replace template variables with actual values
 */
function replaceVariables(template: string, variables: NotificationVariables): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value || '')
  }
  return result
}

/**
 * Send SMS notification via internal API
 */
async function sendSMSNotification(
  phone: string,
  message: string,
  baseUrl: string
): Promise<NotificationResult> {
  try {
    const response = await fetch(`${baseUrl}/api/sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: phone, message })
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      return {
        success: false,
        channel: 'sms',
        error: data.error || 'SMS failed'
      }
    }

    return {
      success: true,
      channel: 'sms',
      messageId: data.messageId
    }
  } catch (error: any) {
    return {
      success: false,
      channel: 'sms',
      error: error.message
    }
  }
}

/**
 * Send Email notification
 */
async function sendEmailNotification(
  email: string,
  template: EmailTemplate,
  variables: NotificationVariables,
  subject?: string
): Promise<NotificationResult> {
  try {
    const result = await sendEmail({
      to: email,
      template,
      variables,
      customSubject: subject ? replaceVariables(subject, variables) : undefined
    })

    if (!result.success) {
      return {
        success: false,
        channel: 'email',
        error: result.error
      }
    }

    return {
      success: true,
      channel: 'email',
      messageId: result.messageId
    }
  } catch (error: any) {
    return {
      success: false,
      channel: 'email',
      error: error.message
    }
  }
}

/**
 * Send WhatsApp notification via internal API
 */
async function sendWhatsAppNotification(
  phone: string,
  message: string,
  baseUrl: string
): Promise<NotificationResult> {
  try {
    const response = await fetch(`${baseUrl}/api/whatsapp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: phone,
        message,
        useTemplate: false
      })
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      return {
        success: false,
        channel: 'whatsapp',
        error: data.error || 'WhatsApp failed'
      }
    }

    return {
      success: true,
      channel: 'whatsapp',
      messageId: data.messageId
    }
  } catch (error: any) {
    return {
      success: false,
      channel: 'whatsapp',
      error: error.message
    }
  }
}

/**
 * Main function to send notifications on status change
 */
export async function sendDeliveryNotification(
  type: NotificationType,
  recipient: NotificationRecipient,
  variables: NotificationVariables,
  channels: NotificationChannel[] = ['sms', 'email']
): Promise<NotificationResult[]> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  const template = NOTIFICATION_TEMPLATES[type]

  if (!template) {
    return [{
      success: false,
      channel: 'sms',
      error: `Unknown notification type: ${type}`
    }]
  }

  // Add tracking URL if not provided
  if (variables.tracking_code && !variables.tracking_url) {
    variables.tracking_url = `${baseUrl}/track?code=${variables.tracking_code}`
  }

  const results: NotificationResult[] = []

  // Send to each channel
  for (const channel of channels) {
    switch (channel) {
      case 'sms':
        if (recipient.phone) {
          const smsMessage = replaceVariables(template.sms, variables)
          results.push(await sendSMSNotification(recipient.phone, smsMessage, baseUrl))
        }
        break

      case 'email':
        if (recipient.email) {
          results.push(await sendEmailNotification(
            recipient.email,
            template.email.template,
            variables,
            template.email.subject
          ))
        }
        break

      case 'whatsapp':
        if (recipient.phone) {
          const whatsappMessage = replaceVariables(template.whatsapp, variables)
          results.push(await sendWhatsAppNotification(recipient.phone, whatsappMessage, baseUrl))
        }
        break

      case 'push':
        // Push notifications would be implemented here
        // For now, skip
        break
    }
  }

  return results
}

/**
 * Trigger notification based on delivery status change
 */
export async function notifyStatusChange(
  deliveryId: string,
  newStatus: string,
  delivery: {
    tracking_code: string
    recipient_phone?: string
    recipient_email?: string
    client?: {
      phone?: string
      email?: string
    }
    eta?: string
  },
  reason?: string
): Promise<NotificationResult[]> {
  const notificationType = STATUS_TO_NOTIFICATION[newStatus]

  if (!notificationType) {
    console.log(`No notification configured for status: ${newStatus}`)
    return []
  }

  // Collect recipient info
  const recipient: NotificationRecipient = {
    phone: delivery.recipient_phone || delivery.client?.phone,
    email: delivery.recipient_email || delivery.client?.email
  }

  // If no contact info, skip
  if (!recipient.phone && !recipient.email) {
    console.log('No recipient contact info available')
    return []
  }

  // Build variables
  const variables: NotificationVariables = {
    tracking_code: delivery.tracking_code,
    eta: delivery.eta || 'To be confirmed',
    reason: reason || 'No details provided'
  }

  // Determine channels based on availability
  const channels: NotificationChannel[] = []
  if (recipient.phone) channels.push('sms')
  if (recipient.email) channels.push('email')

  // Send notifications
  return sendDeliveryNotification(notificationType, recipient, variables, channels)
}

/**
 * Send payment notification
 */
export async function notifyPayment(
  type: 'payment_received' | 'payment_failed',
  recipient: NotificationRecipient,
  amount: number,
  trackingCode?: string
): Promise<NotificationResult[]> {
  const variables: NotificationVariables = {
    amount: amount.toFixed(2),
    tracking_code: trackingCode
  }

  const channels: NotificationChannel[] = []
  if (recipient.phone) channels.push('sms')
  if (recipient.email) channels.push('email')

  return sendDeliveryNotification(type, recipient, variables, channels)
}
