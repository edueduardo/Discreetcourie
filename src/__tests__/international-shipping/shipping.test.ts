import {
  COUNTRIES,
  SHIPPING_RATES,
  calculateCustoms,
  getShippingRates,
  generateInternationalTrackingNumber,
  getCustomsDocuments,
  estimateDeliveryDate
} from '@/lib/international-shipping'

describe('International Shipping System', () => {
  describe('COUNTRIES constant', () => {
    it('should have at least 10 countries defined', () => {
      expect(Object.keys(COUNTRIES).length).toBeGreaterThanOrEqual(10)
    })

    it('should have US as domestic zone', () => {
      expect(COUNTRIES.US.zone).toBe('domestic')
      expect(COUNTRIES.US.customsRequired).toBe(false)
    })

    it('should have Canada in zone1', () => {
      expect(COUNTRIES.CA.zone).toBe('zone1')
      expect(COUNTRIES.CA.customsRequired).toBe(true)
    })

    it('should have UK in zone2', () => {
      expect(COUNTRIES.GB.zone).toBe('zone2')
      expect(COUNTRIES.GB.customsRequired).toBe(true)
    })

    it('should have Brazil in zone3', () => {
      expect(COUNTRIES.BR.zone).toBe('zone3')
      expect(COUNTRIES.BR.customsRequired).toBe(true)
    })

    it('should have all countries with valid VAT rates', () => {
      Object.values(COUNTRIES).forEach(country => {
        expect(country.vatRate).toBeGreaterThanOrEqual(0)
        expect(country.vatRate).toBeLessThanOrEqual(25)
      })
    })

    it('should have all countries with duty thresholds', () => {
      Object.values(COUNTRIES).forEach(country => {
        expect(country.dutyThreshold).toBeGreaterThanOrEqual(0)
      })
    })

    it('should have all countries with estimated delivery days', () => {
      Object.values(COUNTRIES).forEach(country => {
        expect(country.estimatedDays.min).toBeGreaterThan(0)
        expect(country.estimatedDays.max).toBeGreaterThan(country.estimatedDays.min)
      })
    })
  })

  describe('SHIPPING_RATES constant', () => {
    it('should have rates for all zones', () => {
      expect(SHIPPING_RATES.domestic).toBeDefined()
      expect(SHIPPING_RATES.zone1).toBeDefined()
      expect(SHIPPING_RATES.zone2).toBeDefined()
      expect(SHIPPING_RATES.zone3).toBeDefined()
      expect(SHIPPING_RATES.zone4).toBeDefined()
    })

    it('should have rates for all carriers', () => {
      Object.values(SHIPPING_RATES).forEach(zoneRates => {
        expect(zoneRates.DHL).toBeGreaterThan(0)
        expect(zoneRates.FedEx).toBeGreaterThan(0)
        expect(zoneRates.UPS).toBeGreaterThan(0)
        expect(zoneRates.USPS).toBeGreaterThan(0)
      })
    })

    it('should have increasing rates for farther zones', () => {
      expect(SHIPPING_RATES.zone1.DHL).toBeGreaterThan(SHIPPING_RATES.domestic.DHL)
      expect(SHIPPING_RATES.zone2.DHL).toBeGreaterThan(SHIPPING_RATES.zone1.DHL)
      expect(SHIPPING_RATES.zone3.DHL).toBeGreaterThan(SHIPPING_RATES.zone2.DHL)
      expect(SHIPPING_RATES.zone4.DHL).toBeGreaterThan(SHIPPING_RATES.zone3.DHL)
    })
  })

  describe('calculateCustoms()', () => {
    it('should return zero customs for US domestic', () => {
      const result = calculateCustoms(100, 30, 'US')
      expect(result.dutyAmount).toBe(0)
      expect(result.vatAmount).toBe(0)
      expect(result.totalTaxes).toBe(0)
      expect(result.totalCost).toBe(130) // item + shipping
    })

    it('should return zero customs for items below threshold', () => {
      const result = calculateCustoms(10, 30, 'CA') // CA threshold is $20
      expect(result.dutyAmount).toBe(0)
      expect(result.vatAmount).toBe(0)
      expect(result.totalTaxes).toBe(0)
    })

    it('should calculate duty and VAT for Canada', () => {
      const result = calculateCustoms(100, 30, 'CA')
      expect(result.dutyAmount).toBeGreaterThan(0) // 5% duty
      expect(result.vatAmount).toBeGreaterThan(0) // 5% GST
      expect(result.totalTaxes).toBeGreaterThan(0)
      expect(result.totalCost).toBeGreaterThan(130)
    })

    it('should calculate duty and VAT for UK', () => {
      const result = calculateCustoms(200, 50, 'GB')
      expect(result.dutyAmount).toBeGreaterThan(0) // 8% duty
      expect(result.vatAmount).toBeGreaterThan(0) // 20% VAT
      expect(result.totalTaxes).toBeGreaterThan(0)
      expect(result.breakdown.dutyRate).toBe(8)
      expect(result.breakdown.vatRate).toBe(20)
    })

    it('should calculate duty and VAT for Brazil', () => {
      const result = calculateCustoms(150, 70, 'BR')
      expect(result.dutyAmount).toBeGreaterThan(0) // 12% duty
      expect(result.vatAmount).toBeGreaterThan(0) // 17% ICMS
      expect(result.breakdown.dutyRate).toBe(12)
      expect(result.breakdown.vatRate).toBe(17)
    })

    it('should throw error for unsupported country', () => {
      expect(() => calculateCustoms(100, 30, 'XX')).toThrow('Country XX not supported')
    })

    it('should have correct breakdown structure', () => {
      const result = calculateCustoms(200, 30, 'DE') // Above €150 threshold
      expect(result.breakdown.itemValue).toBe(200)
      expect(result.breakdown.shippingCost).toBe(30)
      expect(result.breakdown.dutyRate).toBe(8) // Zone2 duty rate
      expect(result.breakdown.vatRate).toBe(19)
    })
  })

  describe('getShippingRates()', () => {
    it('should return rates for all carriers', () => {
      const rates = getShippingRates('US', 1)
      expect(rates).toHaveLength(4)
      expect(rates.map(r => r.carrier)).toContain('DHL')
      expect(rates.map(r => r.carrier)).toContain('FedEx')
      expect(rates.map(r => r.carrier)).toContain('UPS')
      expect(rates.map(r => r.carrier)).toContain('USPS')
    })

    it('should add weight surcharge for heavy packages', () => {
      const light = getShippingRates('US', 1)
      const heavy = getShippingRates('US', 5)
      
      const lightDHL = light.find(r => r.carrier === 'DHL')!
      const heavyDHL = heavy.find(r => r.carrier === 'DHL')!
      
      expect(heavyDHL.price).toBeGreaterThan(lightDHL.price)
      expect(heavyDHL.price - lightDHL.price).toBe(20) // 4kg * $5
    })

    it('should have tracking enabled for all carriers', () => {
      const rates = getShippingRates('GB', 1)
      rates.forEach(rate => {
        expect(rate.tracking).toBe(true)
      })
    })

    it('should have insurance for premium carriers', () => {
      const rates = getShippingRates('DE', 1)
      const dhl = rates.find(r => r.carrier === 'DHL')!
      const fedex = rates.find(r => r.carrier === 'FedEx')!
      const ups = rates.find(r => r.carrier === 'UPS')!
      
      expect(dhl.insurance).toBe(true)
      expect(fedex.insurance).toBe(true)
      expect(ups.insurance).toBe(true)
    })

    it('should throw error for unsupported country', () => {
      expect(() => getShippingRates('XX', 1)).toThrow('Country XX not supported')
    })
  })

  describe('generateInternationalTrackingNumber()', () => {
    it('should generate DHL tracking number', () => {
      const tracking = generateInternationalTrackingNumber('DHL')
      expect(tracking).toMatch(/^DHL\d{9}$/)
    })

    it('should generate FedEx tracking number', () => {
      const tracking = generateInternationalTrackingNumber('FedEx')
      expect(tracking).toMatch(/^FDX\d{9}$/)
    })

    it('should generate UPS tracking number', () => {
      const tracking = generateInternationalTrackingNumber('UPS')
      expect(tracking).toMatch(/^UPS\d{9}$/)
    })

    it('should generate USPS tracking number', () => {
      const tracking = generateInternationalTrackingNumber('USPS')
      expect(tracking).toMatch(/^USP\d{9}$/)
    })

    it('should generate unique tracking numbers', () => {
      const tracking1 = generateInternationalTrackingNumber('DHL')
      const tracking2 = generateInternationalTrackingNumber('DHL')
      expect(tracking1).not.toBe(tracking2)
    })
  })

  describe('getCustomsDocuments()', () => {
    it('should return empty array for US domestic', () => {
      const docs = getCustomsDocuments('US')
      expect(docs).toHaveLength(0)
    })

    it('should return base documents for Canada', () => {
      const docs = getCustomsDocuments('CA')
      expect(docs).toContain('Commercial Invoice')
      expect(docs).toContain('Customs Declaration (CN22/CN23)')
      expect(docs).toContain('Packing List')
    })

    it('should include Certificate of Origin for zone3', () => {
      const docs = getCustomsDocuments('BR')
      expect(docs).toContain('Certificate of Origin')
    })

    it('should include CPF/CNPJ for Brazil', () => {
      const docs = getCustomsDocuments('BR')
      expect(docs).toContain('CPF/CNPJ (Tax ID)')
    })

    it('should return base documents for UK', () => {
      const docs = getCustomsDocuments('GB')
      expect(docs.length).toBeGreaterThan(0)
      expect(docs).toContain('Commercial Invoice')
    })
  })

  describe('estimateDeliveryDate()', () => {
    it('should return future dates', () => {
      const now = new Date()
      const estimate = estimateDeliveryDate('CA', 'DHL')
      
      expect(estimate.min.getTime()).toBeGreaterThan(now.getTime())
      expect(estimate.max.getTime()).toBeGreaterThan(now.getTime())
    })

    it('should have max date after min date', () => {
      const estimate = estimateDeliveryDate('GB', 'FedEx')
      expect(estimate.max.getTime()).toBeGreaterThan(estimate.min.getTime())
    })

    it('should be faster for express carriers', () => {
      const dhl = estimateDeliveryDate('DE', 'DHL')
      const usps = estimateDeliveryDate('DE', 'USPS')
      
      // DHL should arrive earlier than USPS (80% speed multiplier)
      expect(dhl.max.getTime()).toBeLessThanOrEqual(usps.max.getTime())
    })

    it('should take longer for farther destinations', () => {
      const canada = estimateDeliveryDate('CA', 'DHL')
      const china = estimateDeliveryDate('CN', 'DHL')
      
      expect(china.min.getTime()).toBeGreaterThan(canada.min.getTime())
    })

    it('should throw error for unsupported country', () => {
      expect(() => estimateDeliveryDate('XX', 'DHL')).toThrow('Country XX not supported')
    })
  })

  describe('Integration tests', () => {
    it('should calculate complete shipping quote for Canada', () => {
      const rates = getShippingRates('CA', 2)
      const dhlRate = rates.find(r => r.carrier === 'DHL')!
      const customs = calculateCustoms(150, dhlRate.price, 'CA')
      const docs = getCustomsDocuments('CA')
      const estimate = estimateDeliveryDate('CA', 'DHL')

      expect(dhlRate.price).toBeGreaterThan(0)
      expect(customs.totalCost).toBeGreaterThan(150)
      expect(docs.length).toBeGreaterThan(0)
      expect(estimate.min).toBeDefined()
    })

    it('should calculate complete shipping quote for UK', () => {
      const rates = getShippingRates('GB', 1.5)
      const fedexRate = rates.find(r => r.carrier === 'FedEx')!
      const customs = calculateCustoms(200, fedexRate.price, 'GB')
      const docs = getCustomsDocuments('GB')
      const estimate = estimateDeliveryDate('GB', 'FedEx')

      expect(fedexRate.price).toBeGreaterThan(0)
      expect(customs.dutyAmount).toBeGreaterThan(0)
      expect(customs.vatAmount).toBeGreaterThan(0)
      expect(docs).toContain('Commercial Invoice')
      expect(estimate.max.getTime()).toBeGreaterThan(estimate.min.getTime())
    })
  })
})
