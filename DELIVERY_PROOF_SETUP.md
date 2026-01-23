# Delivery Proof Automation Setup

## Overview

Automatically capture and share delivery proof photos with customers via WhatsApp and Email.

## Features

✅ **Photo Upload** - Driver app uploads proof photo
✅ **Auto-Send** - WhatsApp + Email sent immediately
✅ **GPS Embedded** - Location data in photo metadata
✅ **Watermark** - Timestamp and tracking code overlay
✅ **Customer Portal** - Photos viewable in customer portal
✅ **Invoice Integration** - Photos included in invoice PDFs

## Flow

```
1. Driver arrives → Takes photo with phone
2. Photo uploads to Supabase Storage
3. API adds watermark (timestamp + tracking code)
4. WhatsApp sent: "Delivered! 📸 [photo]"
5. Email sent with embedded photo
6. Photo appears in customer portal
7. Photo available in invoice PDF
```

## Setup

### 1. Configure Supabase Storage

1. Go to Supabase Dashboard → Storage
2. Create bucket: `delivery-proofs`
3. Set Public Access:
   ```sql
   -- Public read access for photos
   CREATE POLICY "Public read access"
   ON storage.objects FOR SELECT
   USING (bucket_id = 'delivery-proofs');

   -- Authenticated upload only
   CREATE POLICY "Authenticated upload"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'delivery-proofs');
   ```

### 2. Execute Migration

Run `supabase/migrations/add_delivery_proof_fields.sql` in Supabase SQL Editor.

Adds fields to `deliveries` table:
- `proof_photo_url` - URL to photo
- `proof_sent_at` - When proof was sent
- `signature_url` - Optional signature
- `delivery_notes` - Driver notes

### 3. Test Photo Upload

```bash
# Upload test photo
curl -X POST https://your-project.supabase.co/storage/v1/object/delivery-proofs/test.jpg \
  -H "Authorization: Bearer YOUR_SUPABASE_KEY" \
  -F file=@photo.jpg
```

## Usage

### Auto-Send Proof After Upload

```typescript
// When driver uploads photo
const photoUrl = `https://your-project.supabase.co/storage/v1/object/public/delivery-proofs/${filename}`

// Automatically send to customer
await fetch('/api/proof/send', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    deliveryId: 'delivery-uuid',
    photoUrl
  })
})

// Returns:
// {
//   success: true,
//   results: {
//     email: { success: true },
//     whatsapp: { success: true }
//   }
// }
```

### Check Proof Status

```typescript
const response = await fetch('/api/proof/send?delivery_id=uuid')
const status = await response.json()

// Returns:
// {
//   has_proof: true,
//   proof_sent: true,
//   proof_photo_url: "https://...",
//   proof_sent_at: "2025-01-22T10:30:00Z"
// }
```

### Driver App Integration

```typescript
// src/app/driver/proof/page.tsx enhancement
async function uploadProof(deliveryId: string, photoFile: File) {
  // 1. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('delivery-proofs')
    .upload(`${deliveryId}-${Date.now()}.jpg`, photoFile, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw error

  // 2. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('delivery-proofs')
    .getPublicUrl(data.path)

  // 3. Auto-send to customer
  await fetch('/api/proof/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deliveryId,
      photoUrl: publicUrl
    })
  })

  return publicUrl
}
```

## Photo Requirements

### Recommended Settings

- **Format:** JPEG or PNG
- **Max Size:** 5MB
- **Min Resolution:** 1280x720
- **Max Resolution:** 4096x4096
- **Orientation:** Auto-rotate based on EXIF

### Compression

```typescript
import sharp from 'sharp'

// Compress and resize photo
async function processPhoto(buffer: Buffer) {
  return await sharp(buffer)
    .resize(1920, 1080, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .jpeg({ quality: 85 })
    .toBuffer()
}
```

### Watermark (Optional)

```typescript
import sharp from 'sharp'

async function addWatermark(
  photoBuffer: Buffer,
  trackingCode: string,
  timestamp: string
) {
  const watermarkSVG = `
    <svg width="400" height="80">
      <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" rx="8"/>
      <text x="20" y="30" fill="white" font-size="16" font-weight="bold">
        ${trackingCode}
      </text>
      <text x="20" y="55" fill="white" font-size="14">
        ${timestamp}
      </text>
    </svg>
  `

  return await sharp(photoBuffer)
    .composite([{
      input: Buffer.from(watermarkSVG),
      gravity: 'southeast'
    }])
    .toBuffer()
}
```

## Notifications

### WhatsApp Message

```
📦 Package delivered!

Tracking: TRACK-1234

Your delivery is complete. See photo proof attached.

Thank you for choosing Discreet Courier!
Questions? Call (614) 500-3080
```

### Email

Includes:
- Large embedded photo
- Delivery timestamp
- Tracking code
- Download invoice PDF button
- Feedback request

## Customer Portal Integration

```typescript
// Show photos in portal
const { data: deliveries } = await supabase
  .from('deliveries')
  .select('*, proof_photo_url, proof_sent_at')
  .eq('client_id', clientId)
  .order('created_at', { ascending: false })

// Display photo gallery
{deliveries.map(delivery => (
  delivery.proof_photo_url && (
    <div>
      <img src={delivery.proof_photo_url} alt="Delivery proof" />
      <p>Delivered: {delivery.proof_sent_at}</p>
    </div>
  )
))}
```

## Invoice PDF Integration

```typescript
// Include photo in invoice PDF
if (delivery.proof_photo_url) {
  doc.addPage()
  doc.fontSize(16).text('Delivery Proof', 50, 50)
  doc.image(delivery.proof_photo_url, 50, 80, {
    fit: [500, 600],
    align: 'center'
  })
  doc.fontSize(10).text(
    `Delivered: ${delivery.proof_sent_at}`,
    50, 700
  )
}
```

## Storage Costs

### Supabase Storage Pricing

| Tier | Storage | Bandwidth | Cost |
|------|---------|-----------|------|
| **Free** | 1 GB | 2 GB/mo | $0 |
| **Pro** | 100 GB | 200 GB/mo | $25/mo |

### Cost Calculator

**Assumptions:**
- Average photo: 500 KB (compressed)
- Keep photos for 90 days
- 200 deliveries/month

**Storage:**
- Month 1: 200 × 0.5 MB = 100 MB
- Month 2: 400 × 0.5 MB = 200 MB
- Month 3: 600 × 0.5 MB = 300 MB
- **Total:** 300 MB (well within 1 GB free tier)

**Bandwidth:**
- Each photo viewed 3× (email, WhatsApp, portal)
- 200 photos × 0.5 MB × 3 views = 300 MB/mo
- **Total:** 300 MB (well within 2 GB free tier)

**Cost:** $0/month ✅

## Best Practices

### Photo Quality

✅ **DO:**
- Take photos in good lighting
- Include the entire delivery location
- Capture package clearly
- Use flash if needed
- Hold phone steady

❌ **DON'T:**
- Take blurry photos
- Include customer faces (privacy)
- Take photos from too far away
- Use digital zoom (poor quality)
- Upload without viewing first

### Privacy

- ❌ Don't include identifiable people
- ❌ Don't show sensitive documents
- ✅ Focus on package and location only
- ✅ Blur faces if accidentally captured
- ✅ Respect customer privacy

### Storage Management

```typescript
// Auto-delete photos older than 90 days
// Run as cron job
async function cleanupOldProofs() {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 90)

  const { data: oldDeliveries } = await supabase
    .from('deliveries')
    .select('proof_photo_url')
    .lt('proof_sent_at', cutoffDate.toISOString())

  for (const delivery of oldDeliveries) {
    if (delivery.proof_photo_url) {
      const path = delivery.proof_photo_url.split('/').pop()
      await supabase.storage
        .from('delivery-proofs')
        .remove([path])
    }
  }
}
```

## Troubleshooting

### Photo Upload Fails

1. Check Supabase Storage bucket exists
2. Verify bucket policies (public read, authenticated write)
3. Check file size (<5MB)
4. Check file format (JPEG/PNG only)
5. Verify auth token is valid

### Photo Not Sending

1. Check WhatsApp/Email configuration
2. Verify customer has phone/email
3. Check proof API logs
4. Verify photo URL is public
5. Test photo URL in browser

### Poor Photo Quality

- Enable compression before upload
- Resize to max 1920x1080
- Use JPEG quality 85%
- Ensure good lighting
- Use phone's native camera

## Solo-Operator Benefits

✅ **Instant** - Photos sent immediately
✅ **Automated** - No manual sending needed
✅ **Professional** - Branded notifications
✅ **Cost-Free** - $0 storage costs
✅ **Dispute Resolution** - Photo evidence
✅ **Customer Satisfaction** - Transparency and trust
✅ **Marketing** - Permission to use photos

**Time Saved:** ~10 minutes per delivery = 33 hours/month (for 200 deliveries)
