import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY)
  : null

const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@discreetcourier.com'
const FROM_NAME = 'Discreet Courier'

export type EmailTemplate = 
  | 'welcome'
  | 'delivery_created'
  | 'delivery_status'
  | 'delivery_completed'
  | 'payment_received'
  | 'payment_failed'
  | 'subscription_created'
  | 'subscription_cancelled'
  | 'guardian_alert'
  | 'guardian_checkin_reminder'
  | 'last_will_triggered'
  | 'last_will_reminder'
  | 'time_capsule_delivered'
  | 'time_capsule_reminder'
  | 'vetting_approved'
  | 'vetting_rejected'
  | 'emergency_triggered'
  | 'destruction_complete'

interface EmailVariables {
  recipientName?: string
  clientCode?: string
  deliveryId?: string
  trackingCode?: string
  status?: string
  amount?: number
  planName?: string
  daysRemaining?: number
  message?: string
  actionUrl?: string
  [key: string]: any
}

const EMAIL_TEMPLATES: Record<EmailTemplate, { subject: string; html: (vars: EmailVariables) => string }> = {
  welcome: {
    subject: 'Welcome to Discreet Courier',
    html: (vars) => `
      <h1>Welcome, ${vars.recipientName || 'Valued Client'}!</h1>
      <p>Your account has been created successfully.</p>
      <p>Client Code: <strong>${vars.clientCode || 'N/A'}</strong></p>
      <p>Use this code for all communications to maintain your privacy.</p>
      <p><a href="${vars.actionUrl || '#'}">Access Your Portal</a></p>
    `
  },
  delivery_created: {
    subject: 'New Delivery Created - #{trackingCode}',
    html: (vars) => `
      <h1>Delivery Confirmed</h1>
      <p>Your delivery has been scheduled.</p>
      <p>Tracking Code: <strong>${vars.trackingCode}</strong></p>
      <p><a href="${vars.actionUrl || '#'}">Track Your Delivery</a></p>
    `
  },
  delivery_status: {
    subject: 'Delivery Update - #{trackingCode}',
    html: (vars) => `
      <h1>Delivery Status Update</h1>
      <p>Tracking Code: <strong>${vars.trackingCode}</strong></p>
      <p>New Status: <strong>${vars.status}</strong></p>
      ${vars.message ? `<p>${vars.message}</p>` : ''}
      <p><a href="${vars.actionUrl || '#'}">Track Your Delivery</a></p>
    `
  },
  delivery_completed: {
    subject: 'Delivery Completed - #{trackingCode}',
    html: (vars) => `
      <h1>Delivery Completed Successfully</h1>
      <p>Your delivery has been completed.</p>
      <p>Tracking Code: <strong>${vars.trackingCode}</strong></p>
      <p>Thank you for choosing Discreet Courier.</p>
    `
  },
  payment_received: {
    subject: 'Payment Received - $#{amount}',
    html: (vars) => `
      <h1>Payment Confirmed</h1>
      <p>We have received your payment of <strong>$${vars.amount?.toFixed(2)}</strong>.</p>
      <p>Thank you for your business.</p>
    `
  },
  payment_failed: {
    subject: 'Payment Failed - Action Required',
    html: (vars) => `
      <h1>Payment Failed</h1>
      <p>We were unable to process your payment of <strong>$${vars.amount?.toFixed(2)}</strong>.</p>
      <p>Please update your payment method.</p>
      <p><a href="${vars.actionUrl || '#'}">Update Payment Method</a></p>
    `
  },
  subscription_created: {
    subject: 'Subscription Activated - #{planName}',
    html: (vars) => `
      <h1>Subscription Activated</h1>
      <p>Your <strong>${vars.planName}</strong> subscription is now active.</p>
      <p>Monthly charge: <strong>$${vars.amount?.toFixed(2)}</strong></p>
      <p><a href="${vars.actionUrl || '#'}">Manage Subscription</a></p>
    `
  },
  subscription_cancelled: {
    subject: 'Subscription Cancelled',
    html: (vars) => `
      <h1>Subscription Cancelled</h1>
      <p>Your <strong>${vars.planName}</strong> subscription has been cancelled.</p>
      <p>You will continue to have access until the end of your billing period.</p>
    `
  },
  guardian_alert: {
    subject: '🚨 GUARDIAN ALERT - Immediate Attention Required',
    html: (vars) => `
      <h1 style="color: red;">GUARDIAN MODE ALERT</h1>
      <p>Client: <strong>${vars.clientCode}</strong></p>
      <p>${vars.message || 'A Guardian Mode alert has been triggered.'}</p>
      <p>This requires immediate attention.</p>
      <p><a href="${vars.actionUrl || '#'}">View Alert Details</a></p>
    `
  },
  guardian_checkin_reminder: {
    subject: 'Guardian Mode Check-in Reminder',
    html: (vars) => `
      <h1>Check-in Reminder</h1>
      <p>This is a reminder to complete your Guardian Mode check-in.</p>
      <p>Days remaining: <strong>${vars.daysRemaining}</strong></p>
      <p><a href="${vars.actionUrl || '#'}">Check In Now</a></p>
    `
  },
  last_will_triggered: {
    subject: 'Important Message - Last Will Delivery',
    html: (vars) => `
      <h1>You Have Received a Last Will Message</h1>
      <p>Dear ${vars.recipientName || 'Recipient'},</p>
      <p>You have received an important message from one of our clients.</p>
      <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-left: 4px solid #333;">
        ${vars.message || 'Please contact us for details.'}
      </div>
      <p><a href="${vars.actionUrl || '#'}">View Full Message</a></p>
    `
  },
  last_will_reminder: {
    subject: 'Last Will Check-in Required - #{daysRemaining} Days Remaining',
    html: (vars) => `
      <h1>Check-in Required</h1>
      <p>Your Last Will service requires a check-in.</p>
      <p>Days remaining before automatic delivery: <strong>${vars.daysRemaining}</strong></p>
      <p><a href="${vars.actionUrl || '#'}">Check In Now</a></p>
    `
  },
  time_capsule_delivered: {
    subject: 'Time Capsule Delivered',
    html: (vars) => `
      <h1>You Have Received a Time Capsule</h1>
      <p>Dear ${vars.recipientName || 'Recipient'},</p>
      <p>A time capsule message has been delivered to you.</p>
      <div style="background: #f5f5f5; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6;">
        ${vars.message || 'Please contact us for details.'}
      </div>
    `
  },
  time_capsule_reminder: {
    subject: 'Time Capsule Delivery Upcoming',
    html: (vars) => `
      <h1>Time Capsule Reminder</h1>
      <p>Your time capsule is scheduled for delivery in <strong>${vars.daysRemaining} days</strong>.</p>
      <p><a href="${vars.actionUrl || '#'}">View Time Capsule</a></p>
    `
  },
  vetting_approved: {
    subject: '✅ Vetting Approved - Welcome to Our Circle',
    html: (vars) => `
      <h1>Vetting Approved</h1>
      <p>Congratulations! Your vetting process has been approved.</p>
      <p>You now have access to our premium services.</p>
      <p><a href="${vars.actionUrl || '#'}">Access Your Account</a></p>
    `
  },
  vetting_rejected: {
    subject: 'Vetting Application Update',
    html: (vars) => `
      <h1>Vetting Application Update</h1>
      <p>After careful review, we are unable to approve your application at this time.</p>
      ${vars.message ? `<p>Notes: ${vars.message}</p>` : ''}
    `
  },
  emergency_triggered: {
    subject: '🚨 EMERGENCY PROTOCOL ACTIVATED',
    html: (vars) => `
      <h1 style="color: red;">EMERGENCY PROTOCOL ACTIVATED</h1>
      <p>Client: <strong>${vars.clientCode}</strong></p>
      <p>An emergency protocol has been triggered.</p>
      <p>${vars.message || 'Immediate action is being taken.'}</p>
    `
  },
  destruction_complete: {
    subject: 'Data Destruction Completed',
    html: (vars) => `
      <h1>Data Destruction Complete</h1>
      <p>Your data destruction request has been completed.</p>
      <p>Certificate ID: <strong>${vars.certificateId || 'N/A'}</strong></p>
      ${vars.actionUrl ? `<p><a href="${vars.actionUrl}">View Certificate</a></p>` : ''}
    `
  }
}

export interface SendEmailParams {
  to: string | string[]
  template: EmailTemplate
  variables?: EmailVariables
  customSubject?: string
  replyTo?: string
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  error?: string
}

export async function sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
  const { to, template, variables = {}, customSubject, replyTo } = params

  if (!resend) {
    console.log('[Email] Resend not configured. Would send:', { to, template, variables })
    return { 
      success: false, 
      error: 'Email service not configured. Add RESEND_API_KEY to environment.' 
    }
  }

  const templateConfig = EMAIL_TEMPLATES[template]
  if (!templateConfig) {
    return { success: false, error: `Unknown email template: ${template}` }
  }

  const subject = (customSubject || templateConfig.subject)
    .replace(/#{(\w+)}/g, (_, key) => variables[key]?.toString() || '')

  const html = templateConfig.html(variables)

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      replyTo
    })

    if (error) {
      console.error('[Email] Send error:', error)
      return { success: false, error: error.message }
    }

    console.log('[Email] Sent successfully:', data?.id)
    return { success: true, messageId: data?.id }

  } catch (err: any) {
    console.error('[Email] Exception:', err)
    return { success: false, error: err.message }
  }
}

export async function sendBulkEmails(
  emails: Array<{ to: string; template: EmailTemplate; variables?: EmailVariables }>
): Promise<{ sent: number; failed: number; results: SendEmailResult[] }> {
  const results: SendEmailResult[] = []
  let sent = 0
  let failed = 0

  for (const email of emails) {
    const result = await sendEmail(email)
    results.push(result)
    if (result.success) sent++
    else failed++
  }

  return { sent, failed, results }
}
