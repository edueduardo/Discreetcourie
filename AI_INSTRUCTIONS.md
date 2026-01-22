# AI Instructions for Discreet Courier Columbus

## Project Overview
Solo courier service in Columbus, Ohio, USA. One operator (Eduardo), 25-mile service radius.

## Critical Rules

### Language
- **Frontend (customer-facing)**: 100% English
- **Backend/Admin**: Can have Portuguese comments, but UI should be English

### Services & Pricing (Solo-Feasible Only)
| Service | Price | Description |
|---------|-------|-------------|
| Standard Delivery | $35 | Same-day courier with photo proof |
| Confidential Delivery | $55 | Includes NDA via DocuSign |
| Personal Shopping | $75/hour | Buy and deliver items |
| B2B Documents | From $40 | Business document courier |

### Operational Limits
- Max 6 deliveries per day
- Service area: 25 miles from downtown Columbus
- Minimum booking lead time: 2 hours
- Operating hours: 7:00 AM - 9:00 PM, 7 days/week

### Features NOT Feasible for Solo Operation (DO NOT IMPLEMENT)
- Vault/Human Vault storage
- Guardian Mode 24/7 monitoring
- Last Will delivery
- Phoenix Protocol
- Shadow Proxy
- Time Capsule
- Destruction protocols
- VIP Vetting beyond basic
- 24/7 emergency protocols

## Tech Stack
- **Framework**: Next.js 14+
- **Styling**: Tailwind CSS
- **Icons**: lucide-react
- **Database**: Supabase (PostgreSQL)
- **Payments**: Stripe
- **SMS/WhatsApp**: Twilio
- **NDA Signing**: DocuSign
- **AI Phone Agent**: Bland.AI

## Key Files

### Customer-Facing Pages
- `src/app/page.tsx` - Landing page (AIDA structure)
- `src/app/concierge/request/page.tsx` - Booking form
- `src/app/track/page.tsx` - Delivery tracking
- `src/app/portal/` - Client portal
- `src/app/terms/page.tsx` - Terms of Service
- `src/app/privacy/page.tsx` - Privacy Policy
- `src/app/refund-policy/page.tsx` - Refund Policy

### Admin Pages
- `src/app/admin/page.tsx` - Dashboard
- `src/app/admin/layout.tsx` - Navigation (simplified for solo)
- `src/app/admin/deliveries/` - Delivery management
- `src/app/admin/clients/` - Client management

### API Routes
- `src/app/api/orders/` - Order management
- `src/app/api/concierge/` - Request handling
- `src/app/api/tracking/` - GPS tracking
- `src/app/api/sms/` - Twilio SMS
- `src/app/api/payments/` - Stripe payments

## Environment Variables Required
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
DOCUSIGN_INTEGRATION_KEY=
BLAND_API_KEY=
```

## Contact Info (Use in Pages)
- **Phone**: (614) 500-3080
- **Email**: contact@discreetcourier.com
- **Location**: Columbus, Ohio

## Git Branches
- `master` - Production branch
- `claude` - Development branch

**Keep both branches in sync after significant changes.**

## Recent Changes (Session Update)

### Completed Tasks
1. **Removed Ghost Code:**
   - Deleted `/api/emergency/route.ts` and `/api/vetting/route.ts`
   - Removed ghost types: `VaultItem`, `DestructionLog`, `guardian_mode_*`, `vetting_*`
   - Cleaned email templates in `src/lib/email.ts`
   - Removed references from Stripe webhook, subscriptions, and customers APIs

2. **Database Schema Updates (`supabase/schema.sql`):**
   - Added `gps_locations` table for GPS tracking persistence
   - Added `subscriptions` table for Stripe subscriptions
   - Added `payment_logs` table for payment event logging
   - Added `driver_sessions` table for driver authentication

3. **Driver App Authentication:**
   - Created `/api/driver/auth/route.ts` for PIN-based login
   - Created `/driver/login/page.tsx` login page
   - Updated driver layout with auth check and logout

4. **New Admin Pages:**
   - `/admin/analytics` - Analytics dashboard with KPIs
   - `/admin/reports` - Report generation (deliveries, revenue, clients, performance)
   - `/admin/settings` - App settings management
   - `/admin/invoices` - Invoice management

5. **Updated `.env.example`:**
   - Added Stripe keys (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
   - Added RESEND_API_KEY for emails
   - Added VAPID keys for push notifications
   - Added DRIVER_AUTH_SECRET for driver authentication

### Pending Tasks
- Sync `master` and `claude` branches
- Configure real Twilio SMS
- Configure real Resend emails
- Implement real push notifications
- Generate invoice PDFs
- WhatsApp Business integration

## Color Scheme
- Background: `#0a0a0f` (dark)
- Accent: `#e94560` (red)
- Secondary: `#1a1a2e` (dark blue)
- Border: `#2d3748` (gray)

## Testing
- Jest configured for unit tests
- Tests in `src/__tests__/`
- Run: `npm test`

## Deployment
- Configured for Netlify deployment
- Run `npm run build` to verify build succeeds before deploying

---
*Last updated: January 2025*
