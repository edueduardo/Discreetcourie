# 🚚 Discreet Courier

[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)](https://supabase.com/)
[![Stripe](https://img.shields.io/badge/Stripe-Payments-purple)](https://stripe.com/)
[![Status](https://img.shields.io/badge/Status-85%25%20Functional-success)](https://github.com/edueduardo/Discreetcourie)

**Professional discreet courier delivery service for Columbus, Ohio**

A complete, production-ready courier management system with real-time GPS tracking, automated notifications, Stripe payments, and secure vault storage.

---

## ✨ Features

### ✅ Fully Implemented (85% Functional)

#### 🔐 Authentication & Security
- ✅ User registration and login (NextAuth)
- ✅ Password reset with email tokens
- ✅ Role-based access control (Admin, Client, Courier)
- ✅ Bcrypt password hashing
- ✅ JWT sessions

#### 📦 Delivery Management
- ✅ Create deliveries with automatic tracking codes
- ✅ Real-time status updates
- ✅ Client management
- ✅ Price calculation
- ✅ Delivery history

#### 📱 Notifications
- ✅ SMS notifications via Twilio
- ✅ Email notifications via SMTP
- ✅ Automated alerts for operators
- ✅ Customer confirmations
- ✅ Status update notifications

#### � Payments
- ✅ Stripe payment intents
- ✅ Webhook processing
- ✅ Payment logs
- ✅ Automatic status updates

#### �️ GPS Tracking
- ✅ Real-time location updates
- ✅ Route history
- ✅ Public tracking page
- ✅ Driver interface
- ✅ Zero-trace mode support

#### 👨‍💼 Admin Dashboard
- ✅ Statistics APIs (revenue, deliveries)
- ✅ Client management
- ✅ Delivery overview

#### 🚚 Driver Interface
- ✅ Active deliveries view
- ✅ One-click GPS updates
- ✅ Status management
- ✅ Automatic notifications

#### 🔒 Vault (Secure Storage)
- ✅ Encrypted file uploads
- ✅ Supabase Storage integration
- ✅ Auto-destruct timers
- ✅ NDA enforcement
- ✅ Access control

### 🔄 In Progress (15% Remaining)

- ⏳ Admin Dashboard UI (charts, filters)
- ⏳ Interactive maps (Google Maps/Mapbox)
- ⏳ Analytics & reporting
- ⏳ 2FA authentication
- ⏳ Refunds UI
- ⏳ Invoice PDF generation

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.0
- **Styling**: Tailwind CSS 3.4
- **UI Components**: shadcn/ui + Radix UI
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js
- **Storage**: Supabase Storage
- **APIs**: Next.js API Routes

### Integrations
- **Payments**: Stripe
- **SMS**: Twilio
- **Email**: SMTP (Nodemailer)
- **Maps**: Ready for Google Maps/Mapbox

### Infrastructure
- **Hosting**: Vercel (recommended)
- **Database**: Supabase Cloud
- **CDN**: Vercel Edge Network
- **SSL**: Automatic (Let's Encrypt)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier works)
- Stripe account (optional, for payments)
- Twilio account (optional, for SMS)
- SMTP email (Gmail works)

### Installation

```bash
# 1. Clone repository
git clone https://github.com/edueduardo/Discreetcourie.git
cd discreet-courier

# 2. Install dependencies
npm install

# 3. Setup environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# 4. Run database migrations
# Execute SQL files in supabase/migrations/ in Supabase SQL Editor

# 5. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

**Required**:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret_here
```

**Optional** (but recommended):
```bash
# Twilio SMS
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+16145551234
OPERATOR_PHONE_NUMBER=+16145551234

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASSWORD=your_app_password
OPERATOR_EMAIL=your_email@gmail.com

# Stripe Payments
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 📖 Documentation

Comprehensive guides available:

- **[SISTEMA_COMPLETO.md](./SISTEMA_COMPLETO.md)** - Complete system overview
- **[SETUP_TWILIO.md](./SETUP_TWILIO.md)** - SMS notifications setup (5 min)
- **[SETUP_SMTP.md](./SETUP_SMTP.md)** - Email notifications setup (5 min)
- **[SETUP_STRIPE_RAPIDO.md](./SETUP_STRIPE_RAPIDO.md)** - Stripe payments setup (15 min)
- **[DEPLOY_AGORA.md](./DEPLOY_AGORA.md)** - Production deployment guide (2-3 hours)
- **[ROADMAP_100_PORCENTO.md](./ROADMAP_100_PORCENTO.md)** - Roadmap to 100%

---

## 🎯 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth handlers
- `POST /api/auth/reset-password` - Password reset

### Deliveries
- `POST /api/deliveries/create` - Create delivery
- `GET /api/deliveries/list` - List deliveries
- `POST /api/deliveries/update-status` - Update status

### Payments
- `POST /api/payments/create-intent` - Create Stripe payment intent
- `POST /api/webhooks/stripe` - Stripe webhook handler

### Tracking
- `POST /api/tracking/update` - Update GPS location
- `GET /api/track/[code]` - Public tracking (no auth)

### Admin
- `GET /api/admin/stats` - Dashboard statistics
- `GET /api/admin/clients` - Client list

### Vault
- `POST /api/vault/upload` - Upload encrypted file
- `GET /api/vault/upload` - List user files

---

## 💰 Operating Costs

### Monthly Fixed Costs
```
Supabase:           $0 (free tier, up to 500MB)
Vercel:             $0 (hobby plan)
Twilio:             $1/month (phone number)
SMTP Email:         $0 (Gmail free)
Stripe:             $0 (no monthly fee)

TOTAL FIXED:        ~$1-2/month
```

### Variable Costs
```
Twilio SMS:         $0.0075 per SMS
Stripe:             2.9% + $0.30 per transaction

Example (100 deliveries/month @ $50 avg):
- Revenue:          $5,000
- Stripe fees:      $150 (3%)
- SMS (200):        $2
- Total costs:      $152
- Net profit:       $4,848 (97%)
```

---

## 🚀 Deployment

### Production Deployment (Vercel + Supabase)

1. **Create Supabase Production Project**
   - Run all migrations
   - Configure storage bucket
   - Get production API keys

2. **Deploy to Vercel**
   ```bash
   npm i -g vercel
   vercel login
   vercel --prod
   ```

3. **Configure Environment Variables**
   - Add all variables in Vercel dashboard
   - Update `NEXTAUTH_URL` to production URL
   - Use production Supabase keys

4. **Setup Stripe Webhook**
   - Add endpoint: `https://your-domain.vercel.app/api/webhooks/stripe`
   - Update `STRIPE_WEBHOOK_SECRET`

Detailed guide: [DEPLOY_AGORA.md](./DEPLOY_AGORA.md)

---

## 🧪 Testing

Test your setup:

```bash
# 1. Create account
http://localhost:3000/register

# 2. Login
http://localhost:3000/login

# 3. Create delivery
http://localhost:3000/quote

# 4. Check Supabase
SELECT * FROM deliveries;

# 5. Test payment (if Stripe configured)
Card: 4242 4242 4242 4242
Date: 12/34
CVC: 123
```

---

## 🤝 Contributing

This is a solo operator project. For bugs or suggestions, open an issue.

---

## 📄 License

Private - All rights reserved.

---

## 📞 Contact

**Discreet Courier**
- Location: Columbus, OH
- GitHub: [@edueduardo](https://github.com/edueduardo)

---

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database by [Supabase](https://supabase.com/)
- Payments by [Stripe](https://stripe.com/)

---

**Status**: 85% Functional - Production Ready  
**Last Updated**: January 27, 2026  
**Version**: 1.0.0

---

⭐ **Star this repo if you find it useful!**
