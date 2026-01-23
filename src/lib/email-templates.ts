/**
 * Email Templates for Automated Customer Communication
 *
 * All templates use HTML for rich formatting and branding
 */

const baseStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  line-height: 1.6;
  color: #333;
`

const containerStyles = `
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  background-color: #ffffff;
`

const headerStyles = `
  background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);
  color: white;
  padding: 30px 20px;
  text-align: center;
  border-radius: 8px 8px 0 0;
`

const buttonStyles = `
  display: inline-block;
  padding: 12px 30px;
  background-color: #1e40af;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  margin: 15px 0;
`

const footerStyles = `
  text-align: center;
  padding: 20px;
  color: #666;
  font-size: 12px;
  border-top: 1px solid #eee;
  margin-top: 30px;
`

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

export const EmailTemplates = {
  /**
   * Quote Confirmation
   * Sent when customer gets instant quote
   */
  quoteConfirmation: (data: {
    customerName: string
    quoteId: string
    amount: number
    pickup: string
    delivery: string
    quoteUrl: string
  }): EmailTemplate => ({
    subject: `Your Delivery Quote: $${data.amount.toFixed(2)} - Discreet Courier`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="${baseStyles}">
          <div style="${containerStyles}">
            <div style="${headerStyles}">
              <h1 style="margin: 0; font-size: 28px;">📋 Your Quote is Ready!</h1>
            </div>

            <div style="padding: 30px 20px;">
              <p style="font-size: 16px;">Hi ${data.customerName},</p>

              <p>Thank you for requesting a quote! We're excited to help with your delivery.</p>

              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #1e40af;">Quote Details</h2>
                <p style="margin: 5px 0;"><strong>Quote #:</strong> ${data.quoteId.slice(0, 8)}</p>
                <p style="margin: 5px 0;"><strong>Total:</strong> <span style="font-size: 24px; color: #10b981; font-weight: bold;">$${data.amount.toFixed(2)}</span></p>
                <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 15px 0;">
                <p style="margin: 5px 0;"><strong>From:</strong> ${data.pickup}</p>
                <p style="margin: 5px 0;"><strong>To:</strong> ${data.delivery}</p>
              </div>

              <div style="text-align: center;">
                <a href="${data.quoteUrl}" style="${buttonStyles}">
                  View Full Quote & Book Now
                </a>
              </div>

              <p style="margin-top: 25px;">This quote is valid for 7 days. Questions? Call us at <a href="tel:+16145003080">(614) 500-3080</a></p>
            </div>

            <div style="${footerStyles}">
              <p><strong>Discreet Courier Columbus</strong></p>
              <p>Professional • Private • Punctual</p>
              <p>(614) 500-3080 | <a href="mailto:contact@discreetcourier.com">contact@discreetcourier.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hi ${data.customerName},

Thank you for requesting a quote! Your delivery quote is ready.

Quote Details:
- Quote #: ${data.quoteId.slice(0, 8)}
- Total: $${data.amount.toFixed(2)}
- From: ${data.pickup}
- To: ${data.delivery}

View full quote and book now: ${data.quoteUrl}

This quote is valid for 7 days. Questions? Call (614) 500-3080

- Discreet Courier Columbus
Professional • Private • Punctual
(614) 500-3080`
  }),

  /**
   * Booking Confirmation
   * Sent when delivery is booked
   */
  bookingConfirmation: (data: {
    customerName: string
    trackingCode: string
    pickup: string
    delivery: string
    pickupTime: string
    trackingUrl: string
  }): EmailTemplate => ({
    subject: `Delivery Confirmed: ${data.trackingCode} - Discreet Courier`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="${baseStyles}">
          <div style="${containerStyles}">
            <div style="${headerStyles}">
              <h1 style="margin: 0; font-size: 28px;">✅ Delivery Confirmed!</h1>
            </div>

            <div style="padding: 30px 20px;">
              <p style="font-size: 16px;">Hi ${data.customerName},</p>

              <p>Great news! Your delivery has been confirmed and scheduled.</p>

              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
                <h2 style="margin-top: 0; color: #059669;">Tracking Information</h2>
                <p style="margin: 5px 0; font-size: 18px;"><strong>Tracking Code:</strong> <code style="background: #fff; padding: 5px 10px; border-radius: 4px; font-family: monospace;">${data.trackingCode}</code></p>
                <p style="margin: 5px 0;"><strong>Scheduled Pickup:</strong> ${data.pickupTime}</p>
              </div>

              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>📍 Pickup:</strong> ${data.pickup}</p>
                <p style="margin: 5px 0;"><strong>🎯 Delivery:</strong> ${data.delivery}</p>
              </div>

              <div style="text-align: center;">
                <a href="${data.trackingUrl}" style="${buttonStyles}">
                  Track Your Delivery Live
                </a>
              </div>

              <div style="background-color: #eff6ff; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 0; font-size: 14px;"><strong>What's Next?</strong></p>
                <ul style="margin: 10px 0;">
                  <li>You'll receive updates via SMS/WhatsApp</li>
                  <li>Track live GPS when pickup occurs</li>
                  <li>Get photo proof upon delivery</li>
                </ul>
              </div>
            </div>

            <div style="${footerStyles}">
              <p><strong>Discreet Courier Columbus</strong></p>
              <p>(614) 500-3080 | <a href="mailto:contact@discreetcourier.com">contact@discreetcourier.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hi ${data.customerName},

Great news! Your delivery has been confirmed.

Tracking Information:
- Tracking Code: ${data.trackingCode}
- Scheduled Pickup: ${data.pickupTime}

Addresses:
- Pickup: ${data.pickup}
- Delivery: ${data.delivery}

Track your delivery live: ${data.trackingUrl}

What's Next?
- You'll receive updates via SMS/WhatsApp
- Track live GPS when pickup occurs
- Get photo proof upon delivery

Questions? Call (614) 500-3080

- Discreet Courier Columbus`
  }),

  /**
   * Delivery Completed
   * Sent when delivery is completed with photo proof
   */
  deliveryCompleted: (data: {
    customerName: string
    trackingCode: string
    deliveryTime: string
    photoUrl?: string
    invoiceUrl?: string
  }): EmailTemplate => ({
    subject: `Delivered! ${data.trackingCode} - Photo Proof Included`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="${baseStyles}">
          <div style="${containerStyles}">
            <div style="${headerStyles}">
              <h1 style="margin: 0; font-size: 28px;">🎉 Delivered Successfully!</h1>
            </div>

            <div style="padding: 30px 20px;">
              <p style="font-size: 16px;">Hi ${data.customerName},</p>

              <p>Your package has been delivered successfully!</p>

              <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>Tracking Code:</strong> ${data.trackingCode}</p>
                <p style="margin: 5px 0;"><strong>Delivered:</strong> ${data.deliveryTime}</p>
                <p style="margin: 5px 0;"><strong>Status:</strong> <span style="color: #10b981; font-weight: bold;">✓ Complete</span></p>
              </div>

              ${data.photoUrl ? `
                <div style="text-align: center; margin: 25px 0;">
                  <h3 style="color: #1e40af;">📸 Photo Proof of Delivery</h3>
                  <img src="${data.photoUrl}" alt="Delivery proof" style="max-width: 100%; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                </div>
              ` : ''}

              ${data.invoiceUrl ? `
                <div style="text-align: center;">
                  <a href="${data.invoiceUrl}" style="${buttonStyles}">
                    Download Invoice PDF
                  </a>
                </div>
              ` : ''}

              <div style="background-color: #fefce8; padding: 15px; border-radius: 6px; margin: 25px 0; border-left: 4px solid #eab308;">
                <p style="margin: 0; font-size: 14px;">💬 <strong>How was your experience?</strong></p>
                <p style="margin: 10px 0 0 0; font-size: 13px;">Your feedback helps us improve. Reply to this email or call (614) 500-3080</p>
              </div>

              <p style="text-align: center; font-size: 16px; color: #059669; font-weight: 600;">Thank you for choosing Discreet Courier!</p>
            </div>

            <div style="${footerStyles}">
              <p><strong>Discreet Courier Columbus</strong></p>
              <p>(614) 500-3080 | <a href="mailto:contact@discreetcourier.com">contact@discreetcourier.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hi ${data.customerName},

Your package has been delivered successfully!

Details:
- Tracking Code: ${data.trackingCode}
- Delivered: ${data.deliveryTime}
- Status: ✓ Complete

${data.photoUrl ? `Photo proof: ${data.photoUrl}\n\n` : ''}
${data.invoiceUrl ? `Download invoice: ${data.invoiceUrl}\n\n` : ''}

How was your experience? Your feedback helps us improve.
Reply to this email or call (614) 500-3080

Thank you for choosing Discreet Courier!

- Discreet Courier Columbus
(614) 500-3080`
  }),

  /**
   * Payment Receipt
   * Sent when payment is received
   */
  paymentReceipt: (data: {
    customerName: string
    amount: number
    invoiceNumber: string
    paymentMethod: string
    invoicePdfUrl?: string
  }): EmailTemplate => ({
    subject: `Payment Received: $${data.amount.toFixed(2)} - Receipt #${data.invoiceNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="${baseStyles}">
          <div style="${containerStyles}">
            <div style="${headerStyles}">
              <h1 style="margin: 0; font-size: 28px;">💳 Payment Received!</h1>
            </div>

            <div style="padding: 30px 20px;">
              <p style="font-size: 16px;">Hi ${data.customerName},</p>

              <p>Thank you for your payment! Your transaction has been processed successfully.</p>

              <div style="background-color: #f0fdf4; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <p style="margin: 0; color: #059669; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Amount Paid</p>
                <p style="margin: 10px 0 0 0; font-size: 42px; font-weight: bold; color: #10b981;">\$${data.amount.toFixed(2)}</p>
              </div>

              <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #1e40af;">Payment Details</h3>
                <p style="margin: 5px 0;"><strong>Invoice #:</strong> ${data.invoiceNumber}</p>
                <p style="margin: 5px 0;"><strong>Payment Method:</strong> ${data.paymentMethod}</p>
                <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date().toLocaleDateString()}</p>
              </div>

              ${data.invoicePdfUrl ? `
                <div style="text-align: center;">
                  <a href="${data.invoicePdfUrl}" style="${buttonStyles}">
                    Download Invoice PDF
                  </a>
                </div>
              ` : ''}

              <p style="margin-top: 25px; font-size: 14px; color: #666;">
                Keep this email for your records. Questions about your payment? Contact us at (614) 500-3080
              </p>
            </div>

            <div style="${footerStyles}">
              <p><strong>Discreet Courier Columbus</strong></p>
              <p>(614) 500-3080 | <a href="mailto:contact@discreetcourier.com">contact@discreetcourier.com</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hi ${data.customerName},

Thank you for your payment! Your transaction has been processed successfully.

Payment Details:
- Amount Paid: $${data.amount.toFixed(2)}
- Invoice #: ${data.invoiceNumber}
- Payment Method: ${data.paymentMethod}
- Date: ${new Date().toLocaleDateString()}

${data.invoicePdfUrl ? `Download invoice PDF: ${data.invoicePdfUrl}\n\n` : ''}

Keep this email for your records. Questions? Call (614) 500-3080

- Discreet Courier Columbus`
  }),

  /**
   * Follow-Up Email
   * Sent to inactive customers
   */
  followUp: (data: {
    customerName: string
    daysInactive: number
    lastDeliveryDate: string
    quoteUrl: string
    discountCode?: string
  }): EmailTemplate => ({
    subject: `We Miss You! ${data.discountCode ? 'Special Offer Inside' : 'Book Your Next Delivery'}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="${baseStyles}">
          <div style="${containerStyles}">
            <div style="${headerStyles}">
              <h1 style="margin: 0; font-size: 28px;">👋 We Miss You!</h1>
            </div>

            <div style="padding: 30px 20px;">
              <p style="font-size: 16px;">Hi ${data.customerName},</p>

              <p>It's been ${data.daysInactive} days since your last delivery on ${data.lastDeliveryDate}. We hope you're doing well!</p>

              ${data.discountCode ? `
                <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 25px; border-radius: 8px; margin: 25px 0; text-align: center; color: white;">
                  <p style="margin: 0; font-size: 18px; font-weight: bold;">🎁 Special Offer Just For You!</p>
                  <p style="margin: 15px 0; font-size: 32px; font-weight: bold; letter-spacing: 2px; background: rgba(255,255,255,0.2); padding: 15px; border-radius: 6px;">${data.discountCode}</p>
                  <p style="margin: 0; font-size: 14px;">10% off your next delivery</p>
                </div>
              ` : ''}

              <p>Need another discreet delivery? We're here when you need us:</p>

              <ul style="margin: 20px 0; padding-left: 20px;">
                <li>Same-day delivery available</li>
                <li>Photo proof included</li>
                <li>100% confidential service</li>
                <li>Live GPS tracking</li>
              </ul>

              <div style="text-align: center;">
                <a href="${data.quoteUrl}" style="${buttonStyles}">
                  Get Instant Quote
                </a>
              </div>

              <p style="text-align: center; margin-top: 20px; font-size: 14px; color: #666;">
                Or call us: <a href="tel:+16145003080" style="color: #1e40af; text-decoration: none; font-weight: 600;">(614) 500-3080</a>
              </p>
            </div>

            <div style="${footerStyles}">
              <p><strong>Discreet Courier Columbus</strong></p>
              <p>(614) 500-3080 | <a href="mailto:contact@discreetcourier.com">contact@discreetcourier.com</a></p>
              <p style="margin-top: 10px; font-size: 11px;">
                <a href="{{unsubscribe_url}}" style="color: #999;">Unsubscribe</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hi ${data.customerName},

It's been ${data.daysInactive} days since your last delivery on ${data.lastDeliveryDate}. We hope you're doing well!

${data.discountCode ? `🎁 SPECIAL OFFER: Use code ${data.discountCode} for 10% off your next delivery!\n\n` : ''}

Need another discreet delivery? We're here when you need us:
- Same-day delivery available
- Photo proof included
- 100% confidential service
- Live GPS tracking

Get instant quote: ${data.quoteUrl}
Or call: (614) 500-3080

- Discreet Courier Columbus`
  })
}

export default EmailTemplates
