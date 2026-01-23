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
  | 'admin_notification'
  | 'client_reminder'

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
  admin_notification: {
    subject: '🔔 Admin Notification - #{subject}',
    html: (vars) => `
      <h1>Admin Notification</h1>
      <p>${vars.message || 'You have a new notification.'}</p>
      ${vars.actionUrl ? `<p><a href="${vars.actionUrl}">View Details</a></p>` : ''}
    `
  },
  client_reminder: {
    subject: 'Reminder from Discreet Courier',
    html: (vars) => `
      <h1>Reminder</h1>
      <p>Dear ${vars.recipientName || 'Valued Client'},</p>
      <p>${vars.message || 'This is a reminder from Discreet Courier.'}</p>
      ${vars.actionUrl ? `<p><a href="${vars.actionUrl}">Take Action</a></p>` : ''}
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

      return { success: false, error: error.message }
    }


    return { success: true, messageId: data?.id }

  } catch (err: any) {

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

/**
 * Send Rich HTML Email Templates
 * Uses the new professionally-designed templates from email-templates.ts
 */
import EmailTemplates, { EmailTemplate as RichEmailTemplate } from './email-templates'

interface SendRichEmailParams {
  to: string | string[]
  template: RichEmailTemplate
  replyTo?: string
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

export async function sendRichEmail({
  to,
  template,
  replyTo,
  attachments
}: SendRichEmailParams): Promise<SendEmailResult> {
  if (!resend) {
    console.warn('Resend not configured - email not sent')
    return {
      success: false,
      error: 'Resend not configured. Set RESEND_API_KEY environment variable.'
    }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: Array.isArray(to) ? to : [to],
      subject: template.subject,
      html: template.html,
      text: template.text,
      replyTo,
      attachments
    })

    if (error) {
      console.error('Email send error:', error)
      return { success: false, error: error.message }
    }

    console.log('Email sent successfully:', data?.id)
    return { success: true, messageId: data?.id }

  } catch (err: any) {
    console.error('Email send error:', err)
    return { success: false, error: err.message }
  }
}

export { EmailTemplates }
