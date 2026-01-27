'use client'

import { useState } from 'react'
import {
  Country,
  COUNTRIES,
  ShippingRate,
  CustomsCalculation,
  Carrier,
  calculateCustoms,
  getShippingRates,
  generateInternationalTrackingNumber,
  getCustomsDocuments,
  estimateDeliveryDate
} from '@/lib/international-shipping'

export function useInternationalShipping() {
  const [selectedCountry, setSelectedCountry] = useState<string>('US')
  const [itemValue, setItemValue] = useState<number>(0)
  const [weight, setWeight] = useState<number>(1)

  const country = COUNTRIES[selectedCountry]

  const getShippingQuote = (countryCode: string, itemVal: number, wt: number) => {
    const rates = getShippingRates(countryCode, wt)
    const cheapestRate = rates.reduce((min, rate) => 
      rate.price < min.price ? rate : min
    )

    const customs = calculateCustoms(itemVal, cheapestRate.price, countryCode)

    return {
      rates,
      cheapestRate,
      customs,
      country: COUNTRIES[countryCode]
    }
  }

  const calculateTotal = (countryCode: string, itemVal: number, wt: number, carrier: Carrier) => {
    const rates = getShippingRates(countryCode, wt)
    const selectedRate = rates.find(r => r.carrier === carrier)
    
    if (!selectedRate) {
      throw new Error(`Carrier ${carrier} not available`)
    }

    const customs = calculateCustoms(itemVal, selectedRate.price, countryCode)

    return {
      shippingCost: selectedRate.price,
      customsCost: customs.totalTaxes,
      totalCost: customs.totalCost,
      breakdown: {
        itemValue: itemVal,
        shipping: selectedRate.price,
        duty: customs.dutyAmount,
        vat: customs.vatAmount
      }
    }
  }

  const getRequiredDocuments = (countryCode: string) => {
    return getCustomsDocuments(countryCode)
  }

  const getDeliveryEstimate = (countryCode: string, carrier: Carrier) => {
    return estimateDeliveryDate(countryCode, carrier)
  }

  const generateTracking = (carrier: Carrier) => {
    return generateInternationalTrackingNumber(carrier)
  }

  const isInternational = (countryCode: string) => {
    const country = COUNTRIES[countryCode]
    return country && country.zone !== 'domestic'
  }

  const requiresCustoms = (countryCode: string) => {
    const country = COUNTRIES[countryCode]
    return country && country.customsRequired
  }

  return {
    selectedCountry,
    setSelectedCountry,
    itemValue,
    setItemValue,
    weight,
    setWeight,
    country,
    countries: COUNTRIES,
    getShippingQuote,
    calculateTotal,
    getRequiredDocuments,
    getDeliveryEstimate,
    generateTracking,
    isInternational,
    requiresCustoms
  }
}
