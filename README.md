# Discreet Courier Columbus

Professional discrete courier delivery management system for Columbus, OH.

## Features

### Admin Panel (Eduardo)
- **Dashboard** - Overview of today's deliveries, revenue, and calls
- **Deliveries Management** - Create, edit, track, and complete deliveries
- **Client Management** - Manage B2B clients and contacts
- **Bland.ai Integration** - AI-powered phone assistant for booking
- **Proof of Delivery** - Photo and signature capture
- **Financial Tracking** - Revenue, invoices, and payments

### Client Portal
- **Delivery Tracking** - Real-time status updates
- **Proof of Delivery** - View photos and signatures
- **History** - Past deliveries and receipts
- **Invoices** - View and download invoices

### Public Pages
- **Landing Page** - Professional business presence
- **Track Delivery** - Public tracking by code

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui
- **Icons**: Lucide React
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Bland.ai account (for AI phone assistant)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/edueduardo/Discreetcourie.git
cd Discreetcourie/discreet-courier
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables in `.env.local`

5. Run the database migrations (in Supabase SQL editor):
```sql
-- See supabase/schema.sql for full schema
```

6. Start the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000)

## Database Schema

### Tables

- **clients** - Customer information
- **deliveries** - Delivery orders
- **delivery_events** - Tracking history
- **bland_calls** - AI phone call records

## Bland.ai Webhook

The system receives Bland.ai call data at:
```
POST /api/webhooks/bland
```

Configure this URL in your Bland.ai dashboard.

## Deployment

### Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy

## Project Structure

```
src/
├── app/
│   ├── (public)/
│   │   ├── page.tsx         # Landing page
│   │   ├── track/           # Public tracking
│   │   └── login/           # Authentication
│   ├── admin/               # Admin panel
│   │   ├── page.tsx         # Dashboard
│   │   ├── deliveries/      # Delivery management
│   │   ├── clients/         # Client management
│   │   ├── calls/           # Bland.ai calls
│   │   └── finances/        # Financial reports
│   ├── portal/              # Client portal
│   │   ├── page.tsx         # Client dashboard
│   │   ├── deliveries/      # Client's deliveries
│   │   └── invoices/        # Client invoices
│   └── api/
│       └── webhooks/
│           └── bland/       # Bland.ai webhook
├── components/
│   └── ui/                  # shadcn/ui components
├── lib/
│   ├── supabase/           # Supabase clients
│   └── utils.ts            # Utility functions
└── types/
    └── index.ts            # TypeScript types
```

## License

Private - All rights reserved.

## Support

Contact: eduardo@discreetcourier.com
