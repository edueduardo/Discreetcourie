'use client'

import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { Locale, DEFAULT_LOCALE, t as translate, getAllTranslations } from '@/lib/i18n'

interface TranslationContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: string, params?: Record<string, string>) => string
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined)

export function TranslationProvider({ children }: { children: ReactNode }): React.ReactElement {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  // Load locale from localStorage on mount
  useEffect(() => {
    const savedLocale = localStorage.getItem('locale') as Locale
    if (savedLocale && ['en', 'pt', 'es'].includes(savedLocale)) {
      setLocaleState(savedLocale)
    } else {
      // Auto-detect from browser
      const browserLang = navigator.language.split('-')[0] as Locale
      if (['en', 'pt', 'es'].includes(browserLang)) {
        setLocaleState(browserLang)
      }
    }
  }, [])

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale)
    localStorage.setItem('locale', newLocale)
    // Set cookie for server-side
    document.cookie = `locale=${newLocale}; path=/; max-age=31536000` // 1 year
  }

  const t = (key: string, params?: Record<string, string>) => {
    return translate(key, locale, params)
  }

  return React.createElement(
    TranslationContext.Provider,
    { value: { locale, setLocale, t } },
    children
  )
}

export function useTranslation() {
  const context = useContext(TranslationContext)
  if (!context) {
    throw new Error('useTranslation must be used within TranslationProvider')
  }
  return context
}
