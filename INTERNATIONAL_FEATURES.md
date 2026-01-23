# 🌍 International Features Guide

**Status**: ✅ READY FOR IMPLEMENTATION
**SEMANA**: 10.3
**Features**: 3 (Multi-Language, Multi-Currency, International Shipping)
**Markets**: Global expansion ready

---

## 📋 Features Overview

### 1. Multi-Language Support (i18n) ✅

**Supported Languages**:
- 🇺🇸 English (en-US)
- 🇧🇷 Portuguese (pt-BR)
- 🇪🇸 Spanish (es-ES)

**Implementation**: `next-intl` library

#### Setup

```bash
npm install next-intl
```

#### Configuration

**File**: `src/i18n.ts`
```typescript
import { getRequestConfig } from 'next-intl/server'

export default getRequestConfig(async ({ locale }) => ({
  messages: (await import(`../messages/${locale}.json`)).default,
}))
```

**File**: `messages/en.json`
```json
{
  "common": {
    "hello": "Hello",
    "welcome": "Welcome to DiscreetCourie",
    "track": "Track Delivery",
    "book": "Book Now"
  },
  "delivery": {
    "status": {
      "pending": "Pending",
      "in_transit": "In Transit",
      "completed": "Delivered"
    },
    "create": "Create Delivery",
    "pickup": "Pickup Address",
    "delivery": "Delivery Address"
  },
  "payment": {
    "total": "Total",
    "pay": "Pay Now",
    "success": "Payment Successful"
  }
}
```

**File**: `messages/pt-BR.json`
```json
{
  "common": {
    "hello": "Olá",
    "welcome": "Bem-vindo à DiscreetCourie",
    "track": "Rastrear Entrega",
    "book": "Reservar Agora"
  },
  "delivery": {
    "status": {
      "pending": "Pendente",
      "in_transit": "Em Trânsito",
      "completed": "Entregue"
    },
    "create": "Criar Entrega",
    "pickup": "Endereço de Coleta",
    "delivery": "Endereço de Entrega"
  },
  "payment": {
    "total": "Total",
    "pay": "Pagar Agora",
    "success": "Pagamento Realizado"
  }
}
```

**File**: `messages/es-ES.json`
```json
{
  "common": {
    "hello": "Hola",
    "welcome": "Bienvenido a DiscreetCourie",
    "track": "Rastrear Entrega",
    "book": "Reservar Ahora"
  },
  "delivery": {
    "status": {
      "pending": "Pendiente",
      "in_transit": "En Tránsito",
      "completed": "Entregado"
    },
    "create": "Crear Entrega",
    "pickup": "Dirección de Recogida",
    "delivery": "Dirección de Entrega"
  },
  "payment": {
    "total": "Total",
    "pay": "Pagar Ahora",
    "success": "Pago Exitoso"
  }
}
```

#### Usage in Components

```typescript
import { useTranslations } from 'next-intl'

export default function HomePage() {
  const t = useTranslations('common')

  return (
    <div>
      <h1>{t('welcome')}</h1>
      <button>{t('book')}</button>
    </div>
  )
}
```

#### Language Switcher Component

```typescript
'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useLocale } from 'next-intl'

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ]

  const switchLanguage = (newLocale: string) => {
    const newPathname = pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(newPathname)
  }

  return (
    <select value={locale} onChange={(e) => switchLanguage(e.target.value)}>
      {languages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.flag} {lang.name}
        </option>
      ))}
    </select>
  )
}
```

---

### 2. Multi-Currency Support ✅

**Supported Currencies**:
- 💵 USD (United States Dollar)
- 💵 BRL (Brazilian Real)
- 💶 EUR (Euro)
- 💷 GBP (British Pound)

**Features**:
- Real-time exchange rates
- Currency conversion
- Localized formatting
- Payment processing in local currency

#### Implementation

**File**: `src/lib/currency.ts`

```typescript
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
})

export const SUPPORTED_CURRENCIES = {
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US' },
  BRL: { symbol: 'R$', name: 'Brazilian Real', locale: 'pt-BR' },
  EUR: { symbol: '€', name: 'Euro', locale: 'en-EU' },
  GBP: { symbol: '£', name: 'British Pound', locale: 'en-GB' },
}

// Get exchange rates from Stripe or external API
export async function getExchangeRates(baseCurrency: string = 'USD') {
  try {
    // Using exchangerate-api.com (free tier: 1500 requests/month)
    const response = await fetch(
      `https://api.exchangerate-api.com/v4/latest/${baseCurrency}`
    )
    const data = await response.json()
    return data.rates
  } catch (error) {
    console.error('Failed to fetch exchange rates:', error)
    // Fallback to static rates
    return {
      USD: 1,
      BRL: 5.0,
      EUR: 0.92,
      GBP: 0.79,
    }
  }
}

// Convert amount between currencies
export async function convertCurrency(
  amount: number,
  from: string,
  to: string
): Promise<number> {
  if (from === to) return amount

  const rates = await getExchangeRates(from)
  return amount * rates[to]
}

// Format currency for display
export function formatCurrency(
  amount: number,
  currency: string = 'USD',
  locale?: string
): string {
  const currencyInfo = SUPPORTED_CURRENCIES[currency as keyof typeof SUPPORTED_CURRENCIES]

  return new Intl.NumberFormat(locale || currencyInfo?.locale || 'en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

// Get user's currency based on location
export function getCurrencyByLocation(countryCode: string): string {
  const currencyMap: Record<string, string> = {
    US: 'USD',
    BR: 'BRL',
    PT: 'EUR',
    ES: 'EUR',
    FR: 'EUR',
    DE: 'EUR',
    IT: 'EUR',
    GB: 'GBP',
    UK: 'GBP',
  }

  return currencyMap[countryCode] || 'USD'
}

// Create Stripe payment intent with currency
export async function createPaymentIntent(
  amount: number,
  currency: string,
  customerId: string
) {
  // Convert amount to smallest currency unit
  const amountInCents = Math.round(amount * 100)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountInCents,
    currency: currency.toLowerCase(),
    customer: customerId,
    metadata: {
      original_currency: currency,
      converted_amount: amount,
    },
  })

  return paymentIntent
}
```

#### Usage Example

```typescript
'use client'

import { useState, useEffect } from 'react'
import { formatCurrency, convertCurrency } from '@/lib/currency'

export function PriceDisplay({ basePrice }: { basePrice: number }) {
  const [currency, setCurrency] = useState('USD')
  const [convertedPrice, setConvertedPrice] = useState(basePrice)

  useEffect(() => {
    convertCurrency(basePrice, 'USD', currency).then(setConvertedPrice)
  }, [basePrice, currency])

  return (
    <div>
      <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
        <option value="USD">🇺🇸 USD</option>
        <option value="BRL">🇧🇷 BRL</option>
        <option value="EUR">🇪🇺 EUR</option>
        <option value="GBP">🇬🇧 GBP</option>
      </select>

      <p className="text-2xl font-bold">
        {formatCurrency(convertedPrice, currency)}
      </p>
    </div>
  )
}
```

---

### 3. International Shipping ✅

**Features**:
- Customs documentation
- International address validation
- Duty/tax calculation
- Cross-border tracking
- Country-specific regulations

#### Implementation

**File**: `src/lib/international-shipping.ts`

```typescript
interface InternationalDelivery {
  origin_country: string
  destination_country: string
  package_weight: number // kg
  package_value: number // USD
  contents_description: string
  customs_category: 'gift' | 'merchandise' | 'documents' | 'sample'
}

// Calculate customs duties and taxes
export async function calculateCustomsDuty(delivery: InternationalDelivery) {
  const { destination_country, package_value, customs_category } = delivery

  // Country-specific duty rates (simplified)
  const dutyRates: Record<string, number> = {
    US: 0.05, // 5%
    BR: 0.6, // 60%
    EU: 0.12, // 12%
    GB: 0.20, // 20%
  }

  const rate = dutyRates[destination_country] || 0.1
  const duty = customs_category === 'gift' ? 0 : package_value * rate

  return {
    duty_amount: duty,
    vat_amount: package_value * 0.20, // 20% VAT
    total_taxes: duty + package_value * 0.20,
  }
}

// Generate customs declaration
export function generateCustomsDeclaration(delivery: InternationalDelivery) {
  return {
    form_type: 'CN22', // For packages < 2kg
    shipper: {
      name: 'DiscreetCourie',
      address: '123 Main St, Columbus, OH',
      country: delivery.origin_country,
    },
    recipient: {
      // From delivery data
    },
    contents: [
      {
        description: delivery.contents_description,
        quantity: 1,
        weight: delivery.package_weight,
        value: delivery.package_value,
        origin_country: delivery.origin_country,
      },
    ],
    total_value: delivery.package_value,
    currency: 'USD',
    category: delivery.customs_category,
    shipping_date: new Date().toISOString(),
  }
}

// Validate international address
export async function validateInternationalAddress(
  address: string,
  country: string
) {
  try {
    // Using Google Maps Geocoding API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
        address
      )}&components=country:${country}&key=${process.env.GOOGLE_MAPS_API_KEY}`
    )

    const data = await response.json()

    if (data.status === 'OK' && data.results.length > 0) {
      const result = data.results[0]
      return {
        valid: true,
        formatted_address: result.formatted_address,
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
        components: result.address_components,
      }
    }

    return { valid: false }
  } catch (error) {
    console.error('Address validation error:', error)
    return { valid: false }
  }
}

// Get restricted/prohibited items by country
export function getRestrictedItems(country: string): string[] {
  const restrictions: Record<string, string[]> = {
    US: ['alcohol', 'tobacco', 'weapons', 'prescription_drugs'],
    BR: ['electronics', 'cosmetics', 'dietary_supplements'],
    CN: ['books', 'publications', 'religious_materials'],
    AE: ['alcohol', 'pork_products', 'gambling_materials'],
  }

  return restrictions[country] || []
}

// Estimate international shipping cost
export async function estimateInternationalShipping(
  delivery: InternationalDelivery
) {
  const { origin_country, destination_country, package_weight } = delivery

  // Base rates per kg
  const baseRates: Record<string, number> = {
    DOMESTIC: 5,
    ZONE1: 15, // North America
    ZONE2: 25, // Europe
    ZONE3: 35, // Asia
    ZONE4: 40, // South America
    ZONE5: 45, // Africa
  }

  // Determine zone
  let zone = 'ZONE3' // Default
  if (origin_country === destination_country) zone = 'DOMESTIC'
  else if (['US', 'CA', 'MX'].includes(destination_country)) zone = 'ZONE1'
  else if (['GB', 'FR', 'DE', 'ES', 'IT'].includes(destination_country)) zone = 'ZONE2'
  else if (['BR', 'AR', 'CL'].includes(destination_country)) zone = 'ZONE4'

  const baseRate = baseRates[zone]
  const shippingCost = baseRate * package_weight

  // Add fuel surcharge (10%) and handling (5%)
  const totalCost = shippingCost * 1.15

  return {
    base_cost: shippingCost,
    fuel_surcharge: shippingCost * 0.1,
    handling_fee: shippingCost * 0.05,
    total_cost: totalCost,
    estimated_days: zone === 'DOMESTIC' ? 3 : zone === 'ZONE1' ? 7 : 14,
  }
}
```

#### API Route

**File**: `src/app/api/international/quote/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import {
  estimateInternationalShipping,
  calculateCustomsDuty,
  validateInternationalAddress,
} from '@/lib/international-shipping'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate addresses
    const originValid = await validateInternationalAddress(
      body.origin_address,
      body.origin_country
    )
    const destValid = await validateInternationalAddress(
      body.destination_address,
      body.destination_country
    )

    if (!originValid.valid || !destValid.valid) {
      return NextResponse.json(
        { error: 'Invalid address' },
        { status: 400 }
      )
    }

    // Calculate shipping cost
    const shipping = await estimateInternationalShipping({
      origin_country: body.origin_country,
      destination_country: body.destination_country,
      package_weight: body.package_weight,
      package_value: body.package_value,
      contents_description: body.contents_description,
      customs_category: body.customs_category,
    })

    // Calculate customs duties
    const duties = await calculateCustomsDuty({
      origin_country: body.origin_country,
      destination_country: body.destination_country,
      package_weight: body.package_weight,
      package_value: body.package_value,
      contents_description: body.contents_description,
      customs_category: body.customs_category,
    })

    return NextResponse.json({
      success: true,
      quote: {
        shipping_cost: shipping.total_cost,
        duties_taxes: duties.total_taxes,
        total_cost: shipping.total_cost + duties.total_taxes,
        estimated_delivery_days: shipping.estimated_days,
        currency: 'USD',
      },
    })
  } catch (error) {
    console.error('International quote error:', error)
    return NextResponse.json(
      { error: 'Failed to generate quote' },
      { status: 500 }
    )
  }
}
```

---

## 🌐 Country-Specific Features

### United States 🇺🇸
- Currency: USD
- Language: English
- Measurement: Imperial (miles, lbs)
- Address format: Street, City, State, ZIP

### Brazil 🇧🇷
- Currency: BRL
- Language: Portuguese
- Measurement: Metric (km, kg)
- Address format: Rua, Número, Bairro, Cidade, Estado, CEP
- Tax: CPF/CNPJ required

### European Union 🇪🇺
- Currency: EUR
- Languages: Multiple
- Measurement: Metric
- GDPR compliance required
- VAT handling

---

## 💰 Cost Estimate

**Per Language**:
- Translation: $500-1000 one-time
- Maintenance: $200/month

**Multi-Currency**:
- Exchange rate API: Free (limited) or $10/month
- No additional Stripe fees

**International Shipping**:
- Customs API: $50/month
- Address validation: Included in Google Maps API

**Total**: ~$100-200/month for full international support

---

## 🚀 Rollout Plan

### Phase 1: Language Support (Week 1)
1. Install next-intl
2. Create translation files
3. Add language switcher
4. Test all pages

### Phase 2: Multi-Currency (Week 2)
1. Integrate exchange rate API
2. Update pricing displays
3. Configure Stripe for multiple currencies
4. Test payment flows

### Phase 3: International Shipping (Week 3-4)
1. Implement customs calculations
2. Add address validation
3. Create documentation generator
4. Partner with international carriers

---

**Created**: 2026-01-23
**Status**: Ready for Implementation
**Est. Implementation**: 3-4 weeks
