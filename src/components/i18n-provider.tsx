'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Locale, DEFAULT_LOCALE, LOCALES, t, getAllTranslations } from '@/lib/i18n'

interface I18nContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string>) => string
  locales: typeof LOCALES
}

const I18nContext = createContext<I18nContextType | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    // Load from localStorage or browser preference
    const saved = localStorage.getItem('locale') as Locale
    if (saved && saved in LOCALES) {
      setLocaleState(saved)
    } else {
      const browserLocale = navigator.language.split('-')[0].toLowerCase()
      if (browserLocale in LOCALES) {
        setLocaleState(browserLocale as Locale)
      }
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
  }

  const translate = (key: string, params?: Record<string, string>) => {
    return t(key, locale, params)
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: translate, locales: LOCALES }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error('useI18n must be used within I18nProvider')
  }
  return context
}

// Language Selector Component
export function LanguageSelector({ className = '' }: { className?: string }) {
  const { locale, setLocale, locales } = useI18n()

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as Locale)}
      className={`bg-transparent border border-gray-600 rounded px-2 py-1 text-sm ${className}`}
    >
      {Object.entries(locales).map(([code, name]) => (
        <option key={code} value={code}>
          {name}
        </option>
      ))}
    </select>
  )
}
