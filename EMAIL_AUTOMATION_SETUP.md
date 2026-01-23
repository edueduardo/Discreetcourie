# Email Automation Setup Guide

## Overview

Automated email notifications for complete customer journey with professional branded HTML templates.

## Features

✅ **Rich HTML Templates** - Professional branded emails
✅ **Automatic Sending** - Triggered by events
✅ **PDF Attachments** - Invoices attached automatically
✅ **Text Fallbacks** - Plain text for email clients
✅ **Unsubscribe Management** - Compliance ready
✅ **Cost Effective** - Free tier: 3,000 emails/month

## Email Templates

### 1. Quote Confirmation
**Trigger:** When customer gets instant quote
**Includes:**
- Quote details and pricing
- Pickup and delivery addresses
- "View & Book" CTA button
- 7-day validity notice

### 2. Booking Confirmation
**Trigger:** When delivery is booked
**Includes:**
- Tracking code
- Pickup time and addresses
- Live tracking link
- What's next checklist

### 3. Delivery Completed
**Trigger:** When delivery is marked complete
**Includes:**
- Photo proof of delivery (embedded)
- Delivery timestamp
- Invoice PDF download link
- Feedback request

### 4. Payment Receipt
**Trigger:** When payment is received
**Includes:**
- Amount paid (large, bold)
- Invoice number and payment method
- Invoice PDF attachment
- Receipt for records

### 5. Follow-Up Email
**Trigger:** Customer inactive for 30/60/90 days
**Includes:**
- Personalized message
- Discount code (optional)
- Service highlights
- "Get Quote" CTA button

## Setup

### 1. Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for free account
3. Verify your email

### 2. Get API Key

1. Go to [Resend Dashboard](https://resend.com/api-keys)
2. Click "Create API Key"
3. Name: "Discreet Courier Production"
4. Copy the API key

### 3. Configure Environment Variables

Add to `.env.local`:

```bash
# Resend (for email automation)
RESEND_API_KEY=re_your_api_key_here

# Email sender (optional, defaults shown)
FROM_EMAIL=noreply@discreetcourier.com
FROM_NAME=Discreet Courier
```

### 4. Verify Domain (For Production)

#### Option A: Use resend.dev (Free, Immediate)
- Emails will come from: `onboarding@resend.dev`
- Good for testing
- 100 emails/day limit

#### Option B: Custom Domain (Professional)
1. Go to Resend Dashboard → Domains
2. Add your domain: `discreetcourier.com`
3. Add DNS records (provided by Resend):
   ```
   Type: TXT
   Name: @
   Value: [verification code]

   Type: MX
   Name: @
   Value: feedback-smtp.us-east-1.amazonses.com
   Priority: 10
   ```
4. Wait 24-48h for verification
5. Update `FROM_EMAIL` to your custom email

### 5. Test Email Sending

```bash
# Test endpoint
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your@email.com",
    "template": "quoteConfirmation"
  }'
```

## Usage

### Send Quote Confirmation

```typescript
import { sendRichEmail, EmailTemplates } from '@/lib/email'

const quoteEmail = EmailTemplates.quoteConfirmation({
  customerName: 'John Doe',
  quoteId: 'quote-uuid',
  amount: 45.00,
  pickup: '123 Main St, Columbus, OH',
  delivery: '456 Oak Ave, Columbus, OH',
  quoteUrl: 'https://discreetcourier.com/quote/quote-uuid'
})

await sendRichEmail({
  to: 'customer@example.com',
  template: quoteEmail
})
```

### Send Booking Confirmation

```typescript
const bookingEmail = EmailTemplates.bookingConfirmation({
  customerName: 'John Doe',
  trackingCode: 'TRACK-1234',
  pickup: '123 Main St',
  delivery: '456 Oak Ave',
  pickupTime: 'Today at 2:00 PM',
  trackingUrl: 'https://discreetcourier.com/track/TRACK-1234'
})

await sendRichEmail({
  to: 'customer@example.com',
  template: bookingEmail
})
```

### Send Delivery Completed (with Photo)

```typescript
const deliveryEmail = EmailTemplates.deliveryCompleted({
  customerName: 'John Doe',
  trackingCode: 'TRACK-1234',
  deliveryTime: 'Today at 3:45 PM',
  photoUrl: 'https://storage.supabase.co/proof/photo.jpg',
  invoiceUrl: 'https://discreetcourier.com/api/invoices/inv-123/pdf'
})

await sendRichEmail({
  to: 'customer@example.com',
  template: deliveryEmail
})
```

### Send Payment Receipt (with PDF)

```typescript
const receiptEmail = EmailTemplates.paymentReceipt({
  customerName: 'John Doe',
  amount: 45.00,
  invoiceNumber: 'INV-20250122-0001',
  paymentMethod: 'Visa ****1234',
  invoicePdfUrl: 'https://discreetcourier.com/api/invoices/inv-123/pdf'
})

// With PDF attachment
const pdfBuffer = await generateInvoicePDF(invoiceId)

await sendRichEmail({
  to: 'customer@example.com',
  template: receiptEmail,
  attachments: [{
    filename: 'invoice-INV-20250122-0001.pdf',
    content: pdfBuffer,
    contentType: 'application/pdf'
  }]
})
```

### Send Follow-Up Email

```typescript
const followUpEmail = EmailTemplates.followUp({
  customerName: 'John Doe',
  daysInactive: 30,
  lastDeliveryDate: 'December 15, 2024',
  quoteUrl: 'https://discreetcourier.com/quote',
  discountCode: 'WELCOME10'  // Optional
})

await sendRichEmail({
  to: 'customer@example.com',
  template: followUpEmail
})
```

## Automation Triggers

### Automatic Sending

Emails are automatically sent when:

1. **Quote Created** (`POST /api/quote`)
   - Sends: Quote Confirmation
   - Delay: Immediate

2. **Booking Confirmed** (`POST /api/deliveries`)
   - Sends: Booking Confirmation
   - Delay: Immediate

3. **Delivery Completed** (`PATCH /api/deliveries/:id`)
   - Sends: Delivery Completed
   - Delay: Immediate

4. **Payment Received** (Stripe Webhook)
   - Sends: Payment Receipt
   - Delay: Immediate

5. **Inactive Customer** (Cron Job)
   - Sends: Follow-Up Email
   - Schedule: 30/60/90 days after last delivery

## Integration Points

### Quote API Integration

```typescript
// src/app/api/quote/route.ts
import { sendRichEmail, EmailTemplates } from '@/lib/email'

export async function POST(request: NextRequest) {
  // ... create quote logic ...

  // Send email confirmation
  if (contact_email) {
    const quoteEmail = EmailTemplates.quoteConfirmation({
      customerName: contact_name || 'Customer',
      quoteId: quote.id,
      amount: quote.calculated_price,
      pickup: pickup_address,
      delivery: delivery_address,
      quoteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/quote?id=${quote.id}`
    })

    await sendRichEmail({
      to: contact_email,
      template: quoteEmail
    })
  }

  return NextResponse.json({ quote })
}
```

### Stripe Webhook Integration

```typescript
// src/app/api/webhooks/stripe/route.ts
case 'payment_intent.succeeded': {
  const paymentIntent = event.data.object

  // ... update invoice logic ...

  // Send receipt email
  const receiptEmail = EmailTemplates.paymentReceipt({
    customerName: paymentIntent.metadata?.customer_name || 'Customer',
    amount: paymentIntent.amount / 100,
    invoiceNumber: invoiceNumber,
    paymentMethod: 'Credit Card',
    invoicePdfUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/invoices/${invoiceId}/pdf`
  })

  await sendRichEmail({
    to: paymentIntent.receipt_email,
    template: receiptEmail
  })

  break
}
```

## Email Templates Customization

Edit `/src/lib/email-templates.ts`:

### Change Colors

```typescript
const headerStyles = `
  background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%);  // Change gradient
  color: white;
  ...
`

const buttonStyles = `
  background-color: #1e40af;  // Change button color
  ...
`
```

### Add Logo

```typescript
const headerStyles = `
  ...
  <img src="https://yourdomain.com/logo.png" alt="Logo" style="height: 50px; margin-bottom: 15px;">
  ...
`
```

### Modify Text

All text is inline in templates - simply edit the strings.

## Pricing

### Resend Pricing

| Plan | Monthly Cost | Emails/Month | Features |
|------|-------------|--------------|----------|
| **Free** | $0 | 3,000 | Perfect for starting |
| **Pro** | $20 | 50,000 | Custom domain, analytics |
| **Business** | $85 | 100,000 | Dedicated IP, priority |

### Cost Calculator

**For 200 deliveries/month:**
- Quote emails: 200
- Booking confirmations: 200
- Delivery completed: 200
- Payment receipts: 200
- Follow-ups (monthly): 50
- **Total:** 850 emails/month

**Cost:** $0/month (within free tier) ✅

**For 1,000 deliveries/month:**
- Total emails: ~4,250/month
- **Cost:** $20/month (Pro plan)

## Deliverability Best Practices

### Avoid Spam Filters

✅ **DO:**
- Use custom domain (not resend.dev)
- Add unsubscribe link
- Keep HTML clean and simple
- Include plain text version
- Warm up sending gradually
- Monitor bounce rates

❌ **DON'T:**
- Use ALL CAPS in subject
- Include too many links
- Send to purchased lists
- Ignore unsubscribe requests
- Send from free email providers

### Email Metrics to Track

- **Open Rate:** Target 25%+
- **Click Rate:** Target 10%+
- **Bounce Rate:** Keep <5%
- **Spam Complaints:** Keep <0.1%
- **Unsubscribe Rate:** Keep <1%

## Testing

### Test with Mailtrap (Staging)

1. Go to [mailtrap.io](https://mailtrap.io)
2. Create free account
3. Get SMTP credentials
4. Update `.env.local` for staging:
   ```bash
   RESEND_API_KEY=  # Leave empty
   SMTP_HOST=smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_USER=your_mailtrap_user
   SMTP_PASS=your_mailtrap_pass
   ```
5. All emails go to Mailtrap inbox (not real recipients)

### Test Email Preview

```bash
# Start dev server
npm run dev

# Open browser
http://localhost:3000/api/email/preview?template=quoteConfirmation
```

## Troubleshooting

### Emails Not Sending

1. **Check API Key**
   ```bash
   echo $RESEND_API_KEY
   ```

2. **Check Logs**
   ```bash
   # Vercel logs
   vercel logs

   # Local logs
   tail -f .next/trace
   ```

3. **Test API Connection**
   ```bash
   curl https://api.resend.com/emails \
     -H "Authorization: Bearer $RESEND_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "from": "onboarding@resend.dev",
       "to": "your@email.com",
       "subject": "Test",
       "html": "<p>Test email</p>"
     }'
   ```

### Emails in Spam

- Verify custom domain
- Add SPF, DKIM, DMARC records
- Warm up sending (start with 10/day, increase gradually)
- Monitor Resend analytics

### Bounced Emails

- Check email address validity
- Remove hard bounces from list
- Investigate soft bounces
- Check domain reputation

## Solo-Operator Benefits

✅ **Fully Automated** - No manual email sending
✅ **Professional** - Branded HTML templates
✅ **Cost Effective** - $0-20/month
✅ **Time Saving** - ~15 hours/month saved
✅ **Customer Engagement** - Higher satisfaction
✅ **Scalable** - Handles growth automatically

## Support

- **Resend Docs**: [resend.com/docs](https://resend.com/docs)
- **Support**: [support@resend.com](mailto:support@resend.com)
- **Status**: [status.resend.com](https://status.resend.com)
