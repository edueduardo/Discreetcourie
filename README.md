# Discreet Courier Columbus

**"One Driver. No Trace."**

Professional discrete courier and personal concierge service for Columbus, OH. From simple deliveries to VIP privacy-first services.

## 🌟 Features

### **4-Tier Service System**

1. **Standard Courier** ($35-50) - Document and package delivery
2. **Discreet Courier** ($50-75) - Confidential deliveries with privacy protection
3. **Personal Concierge** ($75-150/hr) - We buy, fetch, and handle tasks you cannot or prefer not to do
4. **The Fixer (VIP)** ($200-500/task) - Complex situations handled with absolute confidence and discretion

### 🔐 **VIP Premium Features**

- **Cofre Humano (Human Vault)** - Secure storage of sensitive items, documents, and secrets
- **Última Vontade (Last Will)** - Posthumous message/item delivery with configurable triggers
- **Guardian Mode 24/7** - Round-the-clock availability with direct line access
- **Ritual de Destruição** - Complete data deletion with video proof
- **Operação Fênix** - Help clients escape difficult situations discreetly
- **Comunicação Fantasma** - Self-destructing encrypted messages
- **Pacto de Lealdade** - Mutual NDA between provider and client
- **Procurador de Sombras** - Act, speak, and represent on client's behalf
- **Cápsula do Tempo** - Time-delayed delivery (months or years)
- **Santuário** - Exclusive vetting process for VIP clients

### 📊 **Admin Panel**

- **Dashboard** - Real-time overview of deliveries, revenue, and alerts
- **Deliveries Management** - Standard courier operations
- **Concierge Tasks** - Premium service requests and tracking
- **Vault Management** - Human vault items with expiration tracking
- **Client Management** - VIP clients with code names (SHADOW-7842)
- **Destruction Portal** - Data deletion with audit trail
- **Bland.ai Integration** - AI phone assistant for automated bookings
- **Financial Tracking** - Revenue, retainers, and invoicing

### 👤 **Client Portal**

- **VIP Dashboard** - Guardian Mode status, vault items, secure chat
- **Task Management** - Request and track concierge services
- **Secure Messaging** - Encrypted chat with auto-delete
- **Data Destruction** - Self-service complete data deletion
- **Last Will Configuration** - Set up posthumous deliveries
- **No-Trace Mode** - Auto-delete after 7 days

### 🌐 **Public Pages**

- **Landing Page** - Service tiers and features
- **Concierge Services** - Premium offerings showcase
- **Track Delivery** - Public tracking by code
- **NDA Signature** - Digital agreement signing

## 🛠️ Tech Stack

- **Framework**: Next.js 14.0.4 (App Router)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Authentication**: Supabase Auth with Row Level Security
- **Styling**: Tailwind CSS 3.3
- **UI Components**: shadcn/ui with Radix primitives
- **Icons**: Lucide React
- **External Services**:
  - Bland.ai (AI phone assistant)
  - Twilio (SMS notifications - optional)
- **Deployment**: Vercel

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account ([supabase.com](https://supabase.com))
- Bland.ai account ([bland.ai](https://bland.ai)) - optional
- Twilio account ([twilio.com](https://twilio.com)) - optional

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/edueduardo/Discreetcourie.git
cd Discreetcourie
```

2. **Install dependencies:**
```bash
npm install
```

3. **Set up environment variables:**
```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual credentials:
- Supabase URL and keys
- Bland.ai API key (optional)
- Twilio credentials (optional)
- Encryption key for VIP features

4. **Set up Supabase database:**

Go to your Supabase project → SQL Editor and run:

```sql
-- First, run the base schema
-- Copy contents of supabase/schema.sql and execute

-- Then, run the VIP features migration
-- Copy contents of supabase/migration_vip_features.sql and execute
```

5. **Configure Bland.ai webhook (optional):**

In your Bland.ai dashboard, set webhook URL to:
```
https://your-domain.vercel.app/api/webhooks/bland
```

6. **Start the development server:**
```bash
npm run dev
```

7. **Open [http://localhost:3000](http://localhost:3000)**

Default admin access: Navigate to `/admin`

## 📁 Project Structure

```
/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Public landing
│   │   ├── login/                      # Authentication
│   │   ├── track/                      # Public tracking
│   │   ├── concierge/                  # Premium services
│   │   │   ├── page.tsx                # Services landing
│   │   │   └── request/                # Request form (4-step wizard)
│   │   ├── admin/                      # Admin panel
│   │   │   ├── page.tsx                # Dashboard
│   │   │   ├── deliveries/             # Delivery management
│   │   │   ├── concierge/              # Concierge tasks
│   │   │   ├── vault/                  # Human vault
│   │   │   ├── destruction/            # Data destruction
│   │   │   ├── clients/                # Client management
│   │   │   ├── calls/                  # Bland.ai calls
│   │   │   └── finances/               # Financial reports
│   │   ├── portal/                     # Client portal (VIP)
│   │   │   ├── page.tsx                # VIP dashboard
│   │   │   ├── deliveries/             # Delivery history
│   │   │   └── invoices/               # Invoicing
│   │   └── api/
│   │       └── webhooks/bland/         # Bland.ai webhook
│   ├── components/
│   │   ├── ui/                         # shadcn/ui components
│   │   └── concierge/                  # Premium features
│   │       ├── NoTraceIndicator.tsx
│   │       ├── NoTraceToggle.tsx
│   │       ├── NDASignature.tsx
│   │       ├── PurchaseForm.tsx
│   │       └── SecureChat.tsx
│   ├── lib/
│   │   ├── supabase/                   # Supabase clients
│   │   │   ├── client.ts               # Browser client
│   │   │   ├── server.ts               # Server client
│   │   │   └── middleware.ts           # Auth middleware
│   │   └── utils.ts
│   ├── types/
│   │   └── index.ts                    # Complete type definitions
│   └── middleware.ts                   # Next.js middleware
├── supabase/
│   ├── schema.sql                      # Base database schema
│   └── migration_vip_features.sql      # VIP features migration
├── docs/
│   ├── DiscreetCourier_MASTER_PRD.docx # Complete PRD
│   └── bland-ai-concierge-script.md    # AI assistant script
├── .env.example                        # Environment variables template
├── package.json
└── README.md
```

## 🗄️ Database Schema

### Core Tables
- **users** - Admin users
- **clients** - Customers with privacy codes (SHADOW-7842)
- **deliveries** - Standard delivery orders
- **delivery_events** - Tracking history
- **bland_calls** - AI phone call records
- **invoices** / **invoice_items** - B2B billing

### VIP Tables
- **concierge_tasks** - Premium service requests
- **vault_items** - Human vault storage
- **service_agreements** - NDAs and pacts
- **secure_messages** - Encrypted chat
- **nda_documents** - Digital signatures
- **delivery_proofs** - Photos and signatures
- **destruction_log** - Data deletion audit trail
- **settings** - System configuration

## 🔐 Security & Privacy Features

- **Row Level Security (RLS)** on all tables
- **Code Names** instead of real names (SHADOW-7842)
- **Encrypted Fields** for VIP client data
- **No-Trace Mode** with auto-deletion (7 days)
- **Vetting System** for VIP client approval
- **Mutual NDA** (Pacto de Lealdade)
- **Data Destruction** with audit trail
- **Anonymous Payment** options

## 📱 Bland.ai Integration

The system automatically:
- Receives phone calls via Bland.ai
- Detects service type (delivery vs concierge)
- Extracts order details from conversation
- Creates clients and orders automatically
- Detects no-trace requests
- Handles VIP service inquiries

Webhook endpoint: `POST /api/webhooks/bland`

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub:**
```bash
git add .
git commit -m "Initial deployment"
git push origin main
```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Framework preset: Next.js

3. **Add Environment Variables:**
   - Copy all variables from `.env.local`
   - Paste in Vercel project settings
   - **Important**: Set `NEXT_PUBLIC_APP_URL` to your Vercel URL

4. **Deploy:**
   - Vercel will automatically deploy
   - Get your production URL (e.g., `discreetcourie.vercel.app`)

5. **Update Bland.ai Webhook:**
   - Change webhook URL to: `https://your-domain.vercel.app/api/webhooks/bland`

6. **Run Database Migrations:**
   - Execute `schema.sql` in Supabase SQL Editor
   - Execute `migration_vip_features.sql` in Supabase SQL Editor

### Custom Domain (Optional)

1. Add domain in Vercel project settings
2. Configure DNS records as instructed
3. Update `NEXT_PUBLIC_APP_URL` in environment variables

## 📋 Post-Deployment Checklist

- [ ] Supabase database schema deployed
- [ ] VIP features migration executed
- [ ] Environment variables configured in Vercel
- [ ] Bland.ai webhook URL updated
- [ ] Test admin panel access
- [ ] Test public tracking
- [ ] Test concierge request form
- [ ] Verify Bland.ai webhook receives calls
- [ ] Test SMS notifications (if Twilio configured)
- [ ] Review RLS policies and security

## 🎯 Roadmap

### Phase 1 ✅ (Current)
- Setup + Auth + Schema + Dashboard
- Standard courier operations
- VIP features foundation

### Phase 2 (Next)
- Real authentication with Supabase
- API endpoints for vault and destruction
- Encrypted chat backend
- Payment processing (Stripe)

### Phase 3 (Future)
- Mobile driver app
- Real-time tracking (WebSockets)
- Automated routing optimization
- Email notifications
- Analytics and reporting

## 📞 Support

**Discreet Courier Columbus**
- Phone: (614) 500-3080
- Email: eduardo@discreetcourier.com
- Location: Columbus, OH

## 📄 License

Private - All rights reserved.

---

**Built with Next.js 14, Supabase, and privacy-first principles.**
