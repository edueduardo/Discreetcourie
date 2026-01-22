# WhatsApp Business Integration Setup

## Overview

Send automated WhatsApp notifications to customers for quotes, bookings, deliveries, and payments using Twilio's WhatsApp Business API.

## Why WhatsApp?

✅ **High Open Rate** - 98% open rate vs 20% for email
✅ **Instant Delivery** - Real-time notifications
✅ **Global Reach** - 2+ billion users worldwide
✅ **Rich Media** - Send photos, tracking links, PDFs
✅ **Two-Way Communication** - Customers can reply
✅ **Professional** - WhatsApp Business verified account

## Setup Steps

### 1. Create Twilio Account

1. Go to [twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for free ($15 trial credit)
3. Verify your phone number

### 2. Enable WhatsApp (Choose One)

#### Option A: Sandbox (Free - For Testing)

1. Go to [Twilio Console → Messaging → Try it Out → Send a WhatsApp message](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn)
2. Send "join [your-sandbox-code]" to +1 (415) 523-8886 from your WhatsApp
3. Use sandbox number: `whatsapp:+14155238886`

**Limitations:**
- Must join sandbox first
- Shows "Twilio Sandbox" in messages
- Not for production use

#### Option B: Production (Paid - For Live Business)

1. Go to [Twilio Console → Messaging → Senders → WhatsApp senders](https://console.twilio.com/us1/develop/sms/senders/whatsapp-senders)
2. Click "Request Sender"
3. Submit business information for verification
4. Wait 1-3 business days for approval
5. Get your verified WhatsApp Business number

**Costs:**
- **Verification**: Free
- **Messages**: $0.005 per message (~$5 for 1000 messages)
- **No monthly fee**

### 3. Get API Credentials

1. Go to [Twilio Console](https://console.twilio.com/)
2. Copy **Account SID**
3. Copy **Auth Token** (click "View" to reveal)
4. Copy your **WhatsApp Number** (from sandbox or production)

### 4. Configure Environment Variables

Add to `.env.local`:

```bash
# Twilio (for SMS and WhatsApp)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here

# WhatsApp specific
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886  # Sandbox
# OR for production:
# TWILIO_WHATSAPP_NUMBER=whatsapp:+16145003080  # Your verified number
```

### 5. Test the Integration

```bash
# Test if configured
curl http://localhost:3000/api/whatsapp

# Send test message
curl -X POST http://localhost:3000/api/whatsapp \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+16145550100",
    "message": "Test message from Discreet Courier!"
  }'
```

## Automated Notifications

The system automatically sends WhatsApp messages for:

### 1. Quote Ready ✅
When customer gets instant quote:
```
Hi John! 📋
Your delivery quote is ready: $45.00
View details: [link]
Book now or call (614) 500-3080
```

### 2. Booking Confirmed ✅
When delivery is booked:
```
Hi John! ✅
Your delivery is confirmed!
Tracking: TRACK-1234
Pickup: Today at 2:00 PM
Track: [link]
```

### 3. Picked Up 📦
When package is picked up:
```
📦 Package picked up!
Tracking: TRACK-1234
Your delivery is on the way. Track live: [link]
```

### 4. Delivered ✅
When delivered (with photo proof):
```
✅ Delivered successfully!
Tracking: TRACK-1234
Photo proof: [image]
Thank you for choosing Discreet Courier!
```

### 5. Payment Received 💳
When payment is processed:
```
💳 Payment received!
Amount: $45.00
Invoice: INV-20250122-0001
Thank you for your payment!
```

### 6. Follow-Up Reminders 👋
For inactive customers:
```
Hi John! 👋
It's been 30 days since your last delivery.
Need another discreet delivery?
Book online: [link]
```

## Usage in Code

### Send Basic Message

```typescript
import { sendWhatsApp } from '@/lib/whatsapp'

await sendWhatsApp({
  to: '+16145550100',
  message: 'Your delivery is on the way!'
})
```

### Use Pre-Built Templates

```typescript
import { notifyCustomer } from '@/lib/whatsapp'

// Booking confirmation
await notifyCustomer(
  'bookingConfirmed',
  '+16145550100',
  'John',
  'TRACK-1234',
  'Today at 2:00 PM'
)

// Delivery notification
await notifyCustomer(
  'delivered',
  '+16145550100',
  'TRACK-1234',
  'https://photos.com/proof.jpg'
)

// Payment received
await notifyCustomer(
  'paymentReceived',
  '+16145550100',
  45.00,
  'INV-20250122-0001'
)
```

### Send with Media (Photos)

```typescript
await sendWhatsApp({
  to: '+16145550100',
  message: 'Photo proof of delivery',
  mediaUrl: 'https://your-domain.com/delivery-photo.jpg'
})
```

## API Endpoints

### POST /api/whatsapp
Send WhatsApp message

**Body:**
```json
{
  "to": "+16145550100",
  "message": "Your message here",
  "mediaUrl": "https://optional-image-url.jpg"
}
```

**Response:**
```json
{
  "success": true,
  "messageId": "SMxxxxxxxxxxxxxxxx",
  "status": "queued"
}
```

### GET /api/whatsapp
Check configuration status

**Response:**
```json
{
  "configured": true,
  "whatsappNumber": "whatsapp:+14155238886",
  "provider": "Twilio WhatsApp Business API"
}
```

## Message Templates

Located in `/src/lib/whatsapp.ts`:

- `quoteReady` - Quote notification
- `bookingConfirmed` - Booking confirmation
- `pickedUp` - Pickup notification
- `delivered` - Delivery confirmation
- `paymentReceived` - Payment confirmation
- `followUpReminder` - Follow-up reminder
- `custom` - Custom message

## Best Practices

### ✅ DO:
- Keep messages under 1000 characters
- Include clear call-to-action
- Add company name in signature
- Use emojis sparingly (1-2 per message)
- Include tracking links
- Send during business hours (9 AM - 8 PM)

### ❌ DON'T:
- Send promotional spam
- Use ALL CAPS
- Send after 8 PM
- Include sensitive information (passwords, SSN)
- Send too frequently (max 3 per day per customer)

## Troubleshooting

### Message Not Sending

1. **Check configuration**
   ```bash
   curl http://localhost:3000/api/whatsapp
   ```

2. **Verify phone number format**
   - Must include country code: `+1` for US
   - No spaces or dashes: `+16145550100` ✅
   - With spaces: `+1 614 555 0100` ❌

3. **Check Twilio logs**
   - Go to [Twilio Console → Monitor → Logs → Messaging](https://console.twilio.com/us1/monitor/logs/messaging)
   - Look for error messages

### "Not Opted In" Error

**Sandbox Mode:**
- Customer must send "join [your-code]" to sandbox number first
- Check at: Console → Messaging → Try it Out

**Production Mode:**
- Requires approved WhatsApp Business Account
- Must use approved message templates (for first 24h)

### Rate Limits

- **Sandbox**: 50 messages/day
- **Production**: 1000 messages/day (can be increased)
- **Concurrent**: 30 messages/second

## Costs (Production)

| Item | Cost |
|------|------|
| Account Verification | Free |
| Inbound Messages | Free |
| Outbound Messages | $0.005/message |
| Media Messages | $0.005/message |
| Monthly Fee | $0 |

**Example:**
- 200 deliveries/month × 3 notifications = 600 messages
- Cost: 600 × $0.005 = **$3.00/month**

## Solo-Operator Benefits

✅ **Low Cost** - ~$3/month for 600 messages
✅ **Automated** - No manual messaging needed
✅ **Professional** - WhatsApp Business verified
✅ **High Engagement** - 98% open rate
✅ **Easy Setup** - 15 minutes to configure
✅ **Scalable** - Handles growth automatically

## Support

- **Twilio Docs**: [twilio.com/docs/whatsapp](https://www.twilio.com/docs/whatsapp)
- **Support**: [support.twilio.com](https://support.twilio.com)
- **Community**: [twilio.com/community](https://www.twilio.com/community)
