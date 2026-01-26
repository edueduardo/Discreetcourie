// International Shipping System
// Handles customs, duties, international carriers, and cross-border logistics

export type ShippingZone = 'domestic' | 'zone1' | 'zone2' | 'zone3' | 'zone4'
export type Carrier = 'DHL' | 'FedEx' | 'UPS' | 'USPS'
export type ShipmentType = 'document' | 'package' | 'express'

export interface Country {
  code: string
  name: string
  zone: ShippingZone
  currency: string
  customsRequired: boolean
  dutyThreshold: number // USD value before duties apply
  vatRate: number // VAT/GST percentage
  estimatedDays: {
    min: number
    max: number
  }
}

export interface CustomsInfo {
  description: string
  value: number // USD
  weight: number // kg
  quantity: number
  hsCode?: string // Harmonized System code
  countryOfOrigin: string
}

export interface ShippingRate {
  carrier: Carrier
  service: string
  price: number // USD
  estimatedDays: number
  tracking: boolean
  insurance: boolean
}

export interface CustomsCalculation {
  dutyAmount: number
  vatAmount: number
  totalTaxes: number
  totalCost: number // item value + shipping + taxes
  breakdown: {
    itemValue: number
    shippingCost: number
    dutyRate: number
    vatRate: number
  }
}

// Supported countries with shipping zones
export const COUNTRIES: Record<string, Country> = {
  US: {
    code: 'US',
    name: 'United States',
    zone: 'domestic',
    currency: 'USD',
    customsRequired: false,
    dutyThreshold: 0,
    vatRate: 0,
    estimatedDays: { min: 1, max: 3 }
  },
  CA: {
    code: 'CA',
    name: 'Canada',
    zone: 'zone1',
    currency: 'CAD',
    customsRequired: true,
    dutyThreshold: 20,
    vatRate: 5, // GST
    estimatedDays: { min: 3, max: 7 }
  },
  MX: {
    code: 'MX',
    name: 'Mexico',
    zone: 'zone1',
    currency: 'MXN',
    customsRequired: true,
    dutyThreshold: 50,
    vatRate: 16, // IVA
    estimatedDays: { min: 4, max: 8 }
  },
  GB: {
    code: 'GB',
    name: 'United Kingdom',
    zone: 'zone2',
    currency: 'GBP',
    customsRequired: true,
    dutyThreshold: 135,
    vatRate: 20,
    estimatedDays: { min: 5, max: 10 }
  },
  DE: {
    code: 'DE',
    name: 'Germany',
    zone: 'zone2',
    currency: 'EUR',
    customsRequired: true,
    dutyThreshold: 150,
    vatRate: 19,
    estimatedDays: { min: 5, max: 10 }
  },
  FR: {
    code: 'FR',
    name: 'France',
    zone: 'zone2',
    currency: 'EUR',
    customsRequired: true,
    dutyThreshold: 150,
    vatRate: 20,
    estimatedDays: { min: 5, max: 10 }
  },
  BR: {
    code: 'BR',
    name: 'Brazil',
    zone: 'zone3',
    currency: 'BRL',
    customsRequired: true,
    dutyThreshold: 50,
    vatRate: 17, // ICMS
    estimatedDays: { min: 10, max: 20 }
  },
  AU: {
    code: 'AU',
    name: 'Australia',
    zone: 'zone3',
    currency: 'AUD',
    customsRequired: true,
    dutyThreshold: 1000,
    vatRate: 10, // GST
    estimatedDays: { min: 7, max: 14 }
  },
  JP: {
    code: 'JP',
    name: 'Japan',
    zone: 'zone3',
    currency: 'JPY',
    customsRequired: true,
    dutyThreshold: 130,
    vatRate: 10,
    estimatedDays: { min: 6, max: 12 }
  },
  CN: {
    code: 'CN',
    name: 'China',
    zone: 'zone4',
    currency: 'CNY',
    customsRequired: true,
    dutyThreshold: 50,
    vatRate: 13,
    estimatedDays: { min: 8, max: 15 }
  }
}

// Base shipping rates by zone and carrier (USD)
export const SHIPPING_RATES: Record<ShippingZone, Record<Carrier, number>> = {
  domestic: {
    DHL: 35,
    FedEx: 30,
    UPS: 32,
    USPS: 25
  },
  zone1: {
    DHL: 65,
    FedEx: 60,
    UPS: 62,
    USPS: 55
  },
  zone2: {
    DHL: 95,
    FedEx: 90,
    UPS: 92,
    USPS: 85
  },
  zone3: {
    DHL: 135,
    FedEx: 130,
    UPS: 132,
    USPS: 120
  },
  zone4: {
    DHL: 175,
    FedEx: 170,
    UPS: 172,
    USPS: 160
  }
}

// Calculate customs duties and taxes
export function calculateCustoms(
  itemValue: number,
  shippingCost: number,
  countryCode: string
): CustomsCalculation {
  const country = COUNTRIES[countryCode]
  
  if (!country) {
    throw new Error(`Country ${countryCode} not supported`)
  }

  // No customs for domestic
  if (country.zone === 'domestic') {
    return {
      dutyAmount: 0,
      vatAmount: 0,
      totalTaxes: 0,
      totalCost: itemValue + shippingCost,
      breakdown: {
        itemValue,
        shippingCost,
        dutyRate: 0,
        vatRate: 0
      }
    }
  }

  // Check if below duty threshold
  if (itemValue < country.dutyThreshold) {
    return {
      dutyAmount: 0,
      vatAmount: 0,
      totalTaxes: 0,
      totalCost: itemValue + shippingCost,
      breakdown: {
        itemValue,
        shippingCost,
        dutyRate: 0,
        vatRate: 0
      }
    }
  }

  // Calculate duty (simplified - real rates vary by product category)
  // Average duty rate: 5-15% depending on zone
  const dutyRates: Record<ShippingZone, number> = {
    domestic: 0,
    zone1: 5,
    zone2: 8,
    zone3: 12,
    zone4: 15
  }

  const dutyRate = dutyRates[country.zone]
  const dutyAmount = itemValue * (dutyRate / 100)

  // VAT/GST calculated on (item value + shipping + duty)
  const taxableAmount = itemValue + shippingCost + dutyAmount
  const vatAmount = taxableAmount * (country.vatRate / 100)

  const totalTaxes = dutyAmount + vatAmount
  const totalCost = itemValue + shippingCost + totalTaxes

  return {
    dutyAmount: Math.round(dutyAmount * 100) / 100,
    vatAmount: Math.round(vatAmount * 100) / 100,
    totalTaxes: Math.round(totalTaxes * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    breakdown: {
      itemValue,
      shippingCost,
      dutyRate,
      vatRate: country.vatRate
    }
  }
}

// Get shipping rates for a destination
export function getShippingRates(
  countryCode: string,
  weight: number // kg
): ShippingRate[] {
  const country = COUNTRIES[countryCode]
  
  if (!country) {
    throw new Error(`Country ${countryCode} not supported`)
  }

  const baseRates = SHIPPING_RATES[country.zone]
  const carriers: Carrier[] = ['DHL', 'FedEx', 'UPS', 'USPS']

  return carriers.map(carrier => {
    const basePrice = baseRates[carrier]
    // Add weight surcharge: $5 per kg over 1kg
    const weightSurcharge = Math.max(0, (weight - 1) * 5)
    const totalPrice = basePrice + weightSurcharge

    return {
      carrier,
      service: country.zone === 'domestic' ? 'Ground' : 'International',
      price: Math.round(totalPrice * 100) / 100,
      estimatedDays: Math.round((country.estimatedDays.min + country.estimatedDays.max) / 2),
      tracking: true,
      insurance: carrier !== 'USPS'
    }
  })
}

// Generate international tracking number
export function generateInternationalTrackingNumber(carrier: Carrier): string {
  const prefixes: Record<Carrier, string> = {
    DHL: 'DHL',
    FedEx: 'FDX',
    UPS: 'UPS',
    USPS: 'USP'
  }

  const prefix = prefixes[carrier]
  const numbers = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0')
  
  return `${prefix}${numbers}`
}

// Get customs documentation requirements
export function getCustomsDocuments(countryCode: string): string[] {
  const country = COUNTRIES[countryCode]
  
  if (!country || !country.customsRequired) {
    return []
  }

  const baseDocuments = [
    'Commercial Invoice',
    'Customs Declaration (CN22/CN23)',
    'Packing List'
  ]

  // Additional documents for certain zones
  if (country.zone === 'zone3' || country.zone === 'zone4') {
    baseDocuments.push('Certificate of Origin')
  }

  if (country.code === 'BR') {
    baseDocuments.push('CPF/CNPJ (Tax ID)')
  }

  return baseDocuments
}

// Estimate delivery date
export function estimateDeliveryDate(countryCode: string, carrier: Carrier): { min: Date; max: Date } {
  const country = COUNTRIES[countryCode]
  
  if (!country) {
    throw new Error(`Country ${countryCode} not supported`)
  }

  const now = new Date()
  const { min, max } = country.estimatedDays

  // Express carriers are faster
  const speedMultiplier = carrier === 'DHL' || carrier === 'FedEx' ? 0.8 : 1

  const minDays = Math.ceil(min * speedMultiplier)
  const maxDays = Math.ceil(max * speedMultiplier)

  const minDate = new Date(now)
  minDate.setDate(minDate.getDate() + minDays)

  const maxDate = new Date(now)
  maxDate.setDate(maxDate.getDate() + maxDays)

  return { min: minDate, max: maxDate }
}
