# CLAUDE CODE AUDIT INSTRUCTIONS

## Complete System Audit Guide for Discreet Courier Columbus

Use this document to perform a **total, meticulous, detailed, and molecular audit** of the entire codebase. Validate everything is correct, complete, and nothing is missing or broken.

---

## 1. PROJECT OVERVIEW

**Business**: Solo-operated premium courier service in Columbus, OH
**Tech Stack**: Next.js 14 (App Router), TypeScript, Supabase, Tailwind CSS, Stripe
**Branches**: `master` and `claude/discreetcourier-phase-1-o0xQe` (must be identical)

### Solo Operation Constraints
- **Max 6 deliveries/day**
- **25-mile radius from Columbus (39.9612, -82.9988)**
- **2-hour minimum lead time**
- **Operating hours**: 8 AM - 8 PM local time

---

## 2. FRONTEND AUDIT CHECKLIST

### 2.1 Public Pages
| Page | Path | Status | What to Check |
|------|------|--------|---------------|
| Landing | `/` | ✅ | AIDA structure, English text, CTAs work |
| Concierge | `/concierge` | ✅ | Service options display correctly |
| Request Form | `/concierge/request` | ✅ | 4-step form, dynamic pricing, validation |
| Track | `/track` | ✅ | Tracking code input, status display |
| Login | `/login` | ✅ | Auth flow, role selection |
| Terms | `/terms` | ✅ | Legal content in English |
| Privacy | `/privacy` | ✅ | Privacy policy in English |
| Refund | `/refund-policy` | ✅ | Refund terms in English |

### 2.2 Client Portal (`/portal/*`)
| Page | Path | What to Check |
|------|------|---------------|
| Dashboard | `/portal` | Stats, recent deliveries |
| Delivery Detail | `/portal/deliveries/[id]` | Progress tracker, proof of delivery |
| History | `/portal/history` | Past deliveries list |
| Subscriptions | `/portal/subscriptions` | Stripe subscription management |

### 2.3 Admin Dashboard (`/admin/*`)
| Page | Path | What to Check |
|------|------|---------------|
| Dashboard | `/admin` | Today's stats, revenue, pending |
| Deliveries | `/admin/deliveries` | List, status updates |
| New Delivery | `/admin/deliveries/new` | Create delivery form |
| Clients | `/admin/clients` | Client list, details |
| Concierge Tasks | `/admin/concierge` | Task management |
| Payments | `/admin/payments` | Payment history |
| Expenses | `/admin/expenses` | Expense tracking |
| Finances | `/admin/finances` | Financial overview |
| Tracking | `/admin/tracking` | GPS tracking view |

### 2.4 Components to Verify
```
src/components/
├── ui/                    # shadcn/ui components
├── PricingCalculator.tsx  # Dynamic pricing display
├── VIPTermsModal.tsx      # VIP terms acceptance
└── concierge/
    ├── NDASignature.tsx   # Digital NDA signing
    ├── NoTraceIndicator.tsx # No-trace mode toggle
    └── PurchaseForm.tsx   # Shopping request form
```

---

## 3. BACKEND API AUDIT CHECKLIST

### 3.1 Core Delivery APIs
| Endpoint | Method | What to Check |
|----------|--------|---------------|
| `/api/orders` | GET/POST | List and create deliveries |
| `/api/orders/[id]` | GET/PATCH/DELETE | Single delivery CRUD |
| `/api/orders/[id]/proof` | POST | Photo/signature upload |
| `/api/orders/[id]/status` | PATCH | Status updates |
| `/api/concierge/tasks` | GET/POST | Task management |
| `/api/concierge/tasks/[id]` | GET/PATCH/DELETE | Single task |

### 3.2 Tracking APIs
| Endpoint | Method | What to Check |
|----------|--------|---------------|
| `/api/tracking` | GET/POST | Location tracking |
| `/api/tracking/realtime` | GET/POST | Real-time GPS updates |
| `/api/tracking/history` | GET | Tracking history |
| `/api/gps` | GET/POST | GPS data management |

### 3.3 Payment APIs
| Endpoint | Method | What to Check |
|----------|--------|---------------|
| `/api/payments` | GET/POST | Stripe payment intents |
| `/api/subscriptions` | GET/POST/PATCH/DELETE | Subscription management |
| `/api/subscriptions/portal` | POST | Stripe customer portal |
| `/api/webhooks/stripe` | POST | Stripe webhook handler |

### 3.4 Communication APIs
| Endpoint | Method | What to Check |
|----------|--------|---------------|
| `/api/sms` | GET/POST | Twilio SMS sending |
| `/api/email` | GET/POST | Resend email sending |
| `/api/messages` | GET/POST | Secure messaging |
| `/api/messages/ghost` | POST | Ghost (disappearing) messages |
| `/api/bland` | POST | Bland.ai phone calls |
| `/api/webhooks/bland` | POST | Bland.ai webhook handler |

### 3.5 B2B & Recurring APIs
| Endpoint | Method | What to Check |
|----------|--------|---------------|
| `/api/recurring` | GET/POST/PATCH/DELETE | Recurring delivery schedules |
| `/api/customers` | GET/POST | Customer management |
| `/api/customers/[id]` | GET/PATCH/DELETE | Single customer |

### 3.6 Special Features APIs
| Endpoint | Method | What to Check |
|----------|--------|---------------|
| `/api/agreements` | GET/POST/PATCH | NDA/agreement management |
| `/api/vault` | GET/POST | Secure vault storage |
| `/api/vault/encrypt` | POST | Encryption service |
| `/api/guardian` | GET/POST | Guardian mode check-ins |
| `/api/last-will` | GET/POST | Last will feature |
| `/api/time-capsule` | GET/POST | Time capsule delivery |
| `/api/emergency` | POST | Emergency triggers |
| `/api/destruction` | POST | Secure destruction |
| `/api/phoenix` | POST | Phoenix protocol |

### 3.7 Cron Jobs
| Endpoint | Purpose |
|----------|---------|
| `/api/cron/auto-delete` | Clean up no-trace records |
| `/api/cron/follow-up` | Send follow-up notifications |
| `/api/cron/guardian` | Guardian mode check-ins |
| `/api/cron/last-will` | Process last will triggers |
| `/api/cron/time-capsule` | Deliver time capsules |

---

## 4. DATABASE SCHEMA AUDIT

### 4.1 Core Tables
```sql
-- Verify these tables exist in Supabase:
- clients
- deliveries
- delivery_proofs
- delivery_tracking
- gps_tracking
- tracking_points
- concierge_tasks
```

### 4.2 Payment Tables
```sql
- invoices
- payment_logs
- subscriptions
- expenses
```

### 4.3 Communication Tables
```sql
- secure_messages
- email_logs
- bland_calls
- notifications
```

### 4.4 Special Feature Tables
```sql
- agreements
- vault_items
- guardian_checkins
- last_will_entries
- time_capsules
- recurring_schedules
```

### 4.5 Migration Files to Run
```
supabase/
├── schema.sql                      # Main schema
├── migration_vip_features.sql      # VIP features
└── migration_recurring_schedules.sql # B2B recurring
```

---

## 5. KEY FILES AUDIT

### 5.1 Configuration Files
| File | What to Check |
|------|---------------|
| `package.json` | Dependencies, scripts |
| `next.config.js` | Next.js configuration |
| `tailwind.config.ts` | Theme colors, fonts |
| `tsconfig.json` | TypeScript settings |
| `.env.example` | All required env vars listed |

### 5.2 Core Libraries
| File | Purpose |
|------|---------|
| `src/lib/supabase/server.ts` | Supabase client |
| `src/lib/supabase/client.ts` | Browser Supabase |
| `src/lib/email.ts` | Email templates & sending |
| `src/lib/encryption.ts` | AES encryption |
| `src/lib/validation.ts` | Zod schemas |
| `src/lib/solo-limits.ts` | Solo operation constraints |
| `src/lib/subscription-plans.ts` | Stripe plans config |

### 5.3 Middleware
| File | What to Check |
|------|---------------|
| `src/middleware.ts` | Auth protection, rate limiting |

---

## 6. ENVIRONMENT VARIABLES AUDIT

### 6.1 Required (App won't work without)
```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
```

### 6.2 Optional (Features degraded without)
```env
# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Bland.ai
BLAND_API_KEY=
BLAND_PHONE_NUMBER=

# Resend
RESEND_API_KEY=

# Encryption
ENCRYPTION_KEY=

# Google Maps (optional - zip-based fallback exists)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=
```

---

## 7. FEATURE VERIFICATION MATRIX

### 7.1 Solo-Feasible Services (All 12 Must Work)
| # | Service | Price | Status | Key Files |
|---|---------|-------|--------|-----------|
| 1 | Courier Básico | $35-50 | ✅ | `/api/orders`, booking form |
| 2 | Entrega Confidencial | $50-75 | ✅ | `NDASignature.tsx`, `/api/agreements` |
| 3 | Compras Discretas | $75/hr | ✅ | `PurchaseForm.tsx`, `/api/expenses` |
| 4 | Same-Day B2B | $40+ | ✅ | `/api/recurring`, `/api/subscriptions` |
| 5 | Rastreamento | Included | ✅ | `/api/tracking`, `/api/gps` |
| 6 | Proof of Delivery | Included | ✅ | `/api/orders/[id]/proof` |
| 7 | Pagamentos | Stripe | ✅ | `/api/payments`, `/api/webhooks/stripe` |
| 8 | Agendamento | Included | ✅ | Booking form, solo-limits.ts |
| 9 | Portal Cliente | Included | ✅ | `/portal/*` pages |
| 10 | Bland.AI | Optional | ✅ | `/api/bland` |
| 11 | Chat/Messaging | Multi | ✅ | `/api/sms`, `/api/email`, `/api/messages` |
| 12 | NDA/Confidentiality | Included | ✅ | `NDASignature.tsx`, `/api/agreements` |

### 7.2 Dynamic Pricing Validation
The booking form (`/concierge/request`) must:
- [x] Calculate distance from Columbus center
- [x] Show price breakdown (base + distance + urgency)
- [x] Apply urgency multipliers (ASAP: 1.5x, Today: 1.25x)
- [x] Add confidential surcharge (+$20)
- [x] Validate 25-mile service area
- [x] Show errors for out-of-area addresses
- [x] Display remaining daily slots

### 7.3 Solo Limits Validation
- [x] Max 6 deliveries/day enforced
- [x] 25-mile radius validated
- [x] 2-hour lead time warning
- [x] Capacity check on booking

---

## 8. TESTING COMMANDS

### 8.1 Build Verification
```bash
cd discreet-courier
npm run build
# Should complete with no errors
```

### 8.2 Local Development
```bash
npm run dev
# Open http://localhost:3000
```

### 8.3 Type Checking
```bash
npm run type-check
# Or: npx tsc --noEmit
```

### 8.4 Linting
```bash
npm run lint
```

---

## 9. DEPLOYMENT VERIFICATION

### 9.1 Git Branches
```bash
# Both branches must have identical commits
git log master --oneline -5
git log claude/discreetcourier-phase-1-o0xQe --oneline -5
```

### 9.2 Latest Commits
```
da17a0b - feat: Integrate dynamic pricing and solo limits into booking form
160a9d9 - feat(service-4): Add recurring deliveries API for B2B clients
2beb03d - feat(service-1): Add solo limits enforcement and dynamic pricing
45233f3 - fix: Resolve build errors - encryption imports and email templates
```

### 9.3 Vercel Deployment
- Connect GitHub repo to Vercel
- Set environment variables in Vercel dashboard
- Deploy from `master` branch
- Verify production URL works

---

## 10. COMMON ISSUES & FIXES

### 10.1 Build Errors
| Error | Fix |
|-------|-----|
| `encryptString not found` | Use `encrypt` from `@/lib/encryption` |
| `EmailTemplate type` | Use valid template names from `email.ts` |
| `Module not found` | Check import paths, run `npm install` |

### 10.2 Runtime Errors
| Error | Fix |
|-------|-----|
| `Supabase not configured` | Set SUPABASE env vars |
| `Stripe not configured` | Set STRIPE_SECRET_KEY |
| `Table not found` | Run migration SQL files |

---

## 11. AUDIT SIGN-OFF

After completing audit, verify:
- [ ] All 12 services implemented and working
- [ ] Frontend pages render without errors
- [ ] API endpoints return expected responses
- [ ] Database migrations applied
- [ ] Environment variables documented
- [ ] Both git branches identical
- [ ] Build completes successfully
- [ ] No TypeScript errors
- [ ] No console errors in browser

**Auditor**: ________________
**Date**: ________________
**Status**: ________________

---

## 12. CONTACT & SUPPORT

- **Business Phone**: (614) 500-3080
- **Admin Email**: eduardo@discreetcourier.com
- **GitHub**: https://github.com/edueduardo/Discreetcourie
- **Location**: Columbus, OH (Downtown)

---

*Last Updated: January 2025*
*Version: 1.0*
