'use client'

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react'

export type Currency = 'USD' | 'EUR' | 'GBP' | 'BRL'

export const CURRENCIES: Record<Currency, { name: string; symbol: string; locale: string }> = {
  USD: { name: 'US Dollar', symbol: '$', locale: 'en-US' },
  EUR: { name: 'Euro', symbol: '€', locale: 'de-DE' },
  GBP: { name: 'British Pound', symbol: '£', locale: 'en-GB' },
  BRL: { name: 'Brazilian Real', symbol: 'R$', locale: 'pt-BR' }
}

interface ExchangeRates {
  [key: string]: number
}

interface CurrencyContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
  rates: ExchangeRates
  convert: (amount: number, from?: Currency, to?: Currency) => number
  format: (amount: number, currencyCode?: Currency) => string
  isLoading: boolean
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined)

const CACHE_KEY = 'currency_rates'
const CACHE_DURATION = 60 * 60 * 1000 // 1 hour

// Fallback rates if API fails
const FALLBACK_RATES: ExchangeRates = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  BRL: 4.95
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('USD')
  const [rates, setRates] = useState<ExchangeRates>(FALLBACK_RATES)
  const [isLoading, setIsLoading] = useState(true)

  // Load currency from localStorage and fetch rates
  useEffect(() => {
    const savedCurrency = localStorage.getItem('currency') as Currency
    if (savedCurrency && CURRENCIES[savedCurrency]) {
      setCurrencyState(savedCurrency)
    }

    // Check cache first
    const cachedData = localStorage.getItem(CACHE_KEY)
    if (cachedData) {
      try {
        const { rates: cachedRates, timestamp } = JSON.parse(cachedData)
        if (Date.now() - timestamp < CACHE_DURATION) {
          setRates(cachedRates)
          setIsLoading(false)
          return
        }
      } catch (e) {
        // Invalid cache, continue to fetch
      }
    }

    // Fetch fresh rates
    fetchExchangeRates()
  }, [])

  const fetchExchangeRates = async () => {
    try {
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      if (!response.ok) throw new Error('Failed to fetch rates')
      
      const data = await response.json()
      const newRates: ExchangeRates = {
        USD: 1,
        EUR: data.rates.EUR,
        GBP: data.rates.GBP,
        BRL: data.rates.BRL
      }

      setRates(newRates)
      
      // Cache the rates
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        rates: newRates,
        timestamp: Date.now()
      }))
    } catch (error) {
      console.error('Failed to fetch exchange rates, using fallback:', error)
      setRates(FALLBACK_RATES)
    } finally {
      setIsLoading(false)
    }
  }

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency)
    localStorage.setItem('currency', newCurrency)
    // Set cookie for server-side
    document.cookie = `currency=${newCurrency}; path=/; max-age=31536000` // 1 year
  }

  const convert = (amount: number, from: Currency = 'USD', to?: Currency): number => {
    const targetCurrency = to || currency
    if (from === targetCurrency) return amount
    
    // Convert to USD first, then to target currency
    const amountInUSD = amount / rates[from]
    return amountInUSD * rates[targetCurrency]
  }

  const format = (amount: number, currencyCode?: Currency): string => {
    const targetCurrency = currencyCode || currency
    const currencyInfo = CURRENCIES[targetCurrency]
    
    return new Intl.NumberFormat(currencyInfo.locale, {
      style: 'currency',
      currency: targetCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  return React.createElement(
    CurrencyContext.Provider,
    { value: { currency, setCurrency, rates, convert, format, isLoading } },
    children
  )
}

export function useCurrency() {
  const context = useContext(CurrencyContext)
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider')
  }
  return context
}
