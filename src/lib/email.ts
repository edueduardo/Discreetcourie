import nodemailer from 'nodemailer'

const FROM_EMAIL = process.env.SMTP_FROM || 'noreply@discreetcourier.com'
const FROM_NAME = 'Discreet Courier'

let transporter: nodemailer.Transporter | null = null

function getTransporter() {
  if (!transporter && process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    })
  }
  return transporter
}

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

  const smtp = getTransporter()
  if (!smtp) {
    console.warn('SMTP not configured, skipping email')
    return { 
      success: false, 
      error: 'SMTP not configured. Add SMTP_HOST, SMTP_USER, SMTP_PASSWORD to environment.' 
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
    const info = await smtp.sendMail({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      replyTo
    })

    console.log('Email sent successfully:', info.messageId)
    return { success: true, messageId: info.messageId }

  } catch (err: any) {
    console.error('Email send error:', err)
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

export async function sendOperatorEmail(subject: string, message: string): Promise<SendEmailResult> {
  const operatorEmail = process.env.OPERATOR_EMAIL || 'admin@discreetcourier.com'
  
  return sendEmail({
    to: operatorEmail,
    template: 'admin_notification',
    variables: {
      subject,
      message
    }
  })
}
