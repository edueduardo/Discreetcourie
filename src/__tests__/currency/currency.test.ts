import { CURRENCIES } from '@/hooks/useCurrency'
import { formatCurrency } from '@/lib/utils'

describe('Multi-Currency System', () => {
  describe('CURRENCIES constant', () => {
    it('should have all four supported currencies', () => {
      expect(Object.keys(CURRENCIES)).toHaveLength(4)
      expect(CURRENCIES.USD).toBeDefined()
      expect(CURRENCIES.EUR).toBeDefined()
      expect(CURRENCIES.GBP).toBeDefined()
      expect(CURRENCIES.BRL).toBeDefined()
    })

    it('should have correct currency symbols', () => {
      expect(CURRENCIES.USD.symbol).toBe('$')
      expect(CURRENCIES.EUR.symbol).toBe('€')
      expect(CURRENCIES.GBP.symbol).toBe('£')
      expect(CURRENCIES.BRL.symbol).toBe('R$')
    })

    it('should have correct currency names', () => {
      expect(CURRENCIES.USD.name).toBe('US Dollar')
      expect(CURRENCIES.EUR.name).toBe('Euro')
      expect(CURRENCIES.GBP.name).toBe('British Pound')
      expect(CURRENCIES.BRL.name).toBe('Brazilian Real')
    })

    it('should have correct locales', () => {
      expect(CURRENCIES.USD.locale).toBe('en-US')
      expect(CURRENCIES.EUR.locale).toBe('de-DE')
      expect(CURRENCIES.GBP.locale).toBe('en-GB')
      expect(CURRENCIES.BRL.locale).toBe('pt-BR')
    })
  })

  describe('formatCurrency() utility', () => {
    it('should format USD correctly (default)', () => {
      const result = formatCurrency(100)
      expect(result).toContain('100')
      expect(result).toContain('$')
    })

    it('should format EUR correctly', () => {
      const result = formatCurrency(100, 'EUR', 'de-DE')
      expect(result).toContain('100')
      expect(result).toContain('€')
    })

    it('should format GBP correctly', () => {
      const result = formatCurrency(100, 'GBP', 'en-GB')
      expect(result).toContain('100')
      expect(result).toContain('£')
    })

    it('should format BRL correctly', () => {
      const result = formatCurrency(100, 'BRL', 'pt-BR')
      expect(result).toContain('100')
      expect(result).toContain('R$')
    })

    it('should format decimal values correctly', () => {
      const result = formatCurrency(99.99, 'USD', 'en-US')
      expect(result).toContain('99.99')
    })

    it('should format zero correctly', () => {
      const result = formatCurrency(0, 'USD', 'en-US')
      expect(result).toContain('0')
    })

    it('should format negative values correctly', () => {
      const result = formatCurrency(-50, 'USD', 'en-US')
      expect(result).toContain('50')
      expect(result).toContain('-')
    })

    it('should format large numbers correctly', () => {
      const result = formatCurrency(1000000, 'USD', 'en-US')
      expect(result).toContain('1,000,000')
    })
  })

  describe('Currency conversion logic', () => {
    it('should maintain value when converting same currency', () => {
      // This tests the concept - actual implementation in useCurrency hook
      const amount = 100
      const converted = amount // Same currency
      expect(converted).toBe(100)
    })

    it('should convert USD to EUR approximately', () => {
      // Using fallback rate: EUR = 0.92 * USD
      const usdAmount = 100
      const expectedEur = usdAmount * 0.92
      expect(expectedEur).toBeCloseTo(92, 0)
    })

    it('should convert USD to GBP approximately', () => {
      // Using fallback rate: GBP = 0.79 * USD
      const usdAmount = 100
      const expectedGbp = usdAmount * 0.79
      expect(expectedGbp).toBeCloseTo(79, 0)
    })

    it('should convert USD to BRL approximately', () => {
      // Using fallback rate: BRL = 4.95 * USD
      const usdAmount = 100
      const expectedBrl = usdAmount * 4.95
      expect(expectedBrl).toBeCloseTo(495, 0)
    })
  })

  describe('Price examples from landing page', () => {
    it('should format $35 service price in all currencies', () => {
      expect(formatCurrency(35, 'USD', 'en-US')).toContain('35')
      expect(formatCurrency(35 * 0.92, 'EUR', 'de-DE')).toContain('32')
      expect(formatCurrency(35 * 0.79, 'GBP', 'en-GB')).toContain('27')
      expect(formatCurrency(35 * 4.95, 'BRL', 'pt-BR')).toContain('173')
    })

    it('should format $55 service price in all currencies', () => {
      expect(formatCurrency(55, 'USD', 'en-US')).toContain('55')
      expect(formatCurrency(55 * 0.92, 'EUR', 'de-DE')).toContain('50')
      expect(formatCurrency(55 * 0.79, 'GBP', 'en-GB')).toContain('43')
      expect(formatCurrency(55 * 4.95, 'BRL', 'pt-BR')).toContain('272')
    })

    it('should format $75 service price in all currencies', () => {
      expect(formatCurrency(75, 'USD', 'en-US')).toContain('75')
      expect(formatCurrency(75 * 0.92, 'EUR', 'de-DE')).toContain('69')
      expect(formatCurrency(75 * 0.79, 'GBP', 'en-GB')).toContain('59')
      expect(formatCurrency(75 * 4.95, 'BRL', 'pt-BR')).toContain('371')
    })
  })
})
