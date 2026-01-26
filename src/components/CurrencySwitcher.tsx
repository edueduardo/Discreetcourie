'use client'

import { useCurrency, Currency, CURRENCIES } from '@/hooks/useCurrency'
import { DollarSign } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 transition-all"
        aria-label="Change currency"
      >
        <DollarSign className="w-4 h-4" />
        <span className="text-sm font-medium">{CURRENCIES[currency].symbol} {currency}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 rounded-lg bg-[#1a1a2e] border border-[#2d3748] shadow-xl z-50">
          <div className="py-2">
            {(Object.keys(CURRENCIES) as Currency[]).map((curr) => (
              <button
                key={curr}
                onClick={() => handleCurrencyChange(curr)}
                className={`w-full px-4 py-2 text-left hover:bg-[#2d3748] transition-colors ${
                  currency === curr ? 'text-[#e94560] font-semibold' : 'text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{CURRENCIES[curr].symbol} {curr}</div>
                    <div className="text-xs text-gray-500">{CURRENCIES[curr].name}</div>
                  </div>
                  {currency === curr && (
                    <span className="text-[#e94560]">✓</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
