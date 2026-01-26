'use client'

import { useTranslation } from '@/hooks/useTranslation'
import { Locale, LOCALES } from '@/lib/i18n'
import { Globe } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation()
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

  const handleLocaleChange = (newLocale: Locale) => {
    setLocale(newLocale)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 transition-all"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4" />
        <span className="text-sm font-medium uppercase">{locale}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-[#1a1a2e] border border-[#2d3748] shadow-xl z-50">
          <div className="py-2">
            {(Object.keys(LOCALES) as Locale[]).map((lang) => (
              <button
                key={lang}
                onClick={() => handleLocaleChange(lang)}
                className={`w-full px-4 py-2 text-left hover:bg-[#2d3748] transition-colors ${
                  locale === lang ? 'text-[#e94560] font-semibold' : 'text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{LOCALES[lang]}</span>
                  {locale === lang && (
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
