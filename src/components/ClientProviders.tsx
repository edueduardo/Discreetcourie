'use client'

import { TranslationProvider } from '@/hooks/useTranslation'
import { CurrencyProvider } from '@/hooks/useCurrency'
import { ReactNode } from 'react'

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <TranslationProvider>
      <CurrencyProvider>
        {children}
      </CurrencyProvider>
    </TranslationProvider>
  )
}
