'use client'

import LanguageSwitcher from './LanguageSwitcher'
import CurrencySwitcher from './CurrencySwitcher'

export default function GlobalSwitchers() {
  return (
    <div className="fixed top-6 right-6 z-50 flex gap-3">
      <CurrencySwitcher />
      <LanguageSwitcher />
    </div>
  )
}
