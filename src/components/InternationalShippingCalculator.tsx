'use client'

import { useState } from 'react'
import { useInternationalShipping } from '@/hooks/useInternationalShipping'
import { useCurrency } from '@/hooks/useCurrency'
import { Carrier } from '@/lib/international-shipping'
import { Globe, Package, DollarSign, FileText, Truck, Clock } from 'lucide-react'

export default function InternationalShippingCalculator() {
  const { 
    countries, 
    getShippingQuote, 
    calculateTotal,
    getRequiredDocuments,
    getDeliveryEstimate,
    isInternational
  } = useInternationalShipping()

  const { format, convert } = useCurrency()

  const [selectedCountry, setSelectedCountry] = useState('US')
  const [itemValue, setItemValue] = useState(100)
  const [weight, setWeight] = useState(1)
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier>('DHL')
  const [showResults, setShowResults] = useState(false)

  const handleCalculate = () => {
    setShowResults(true)
  }

  const quote = showResults ? getShippingQuote(selectedCountry, itemValue, weight) : null
  const total = showResults ? calculateTotal(selectedCountry, itemValue, weight, selectedCarrier) : null
  const documents = showResults ? getRequiredDocuments(selectedCountry) : []
  const estimate = showResults ? getDeliveryEstimate(selectedCountry, selectedCarrier) : null

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-[#1a1a2e] rounded-2xl border border-[#2d3748]">
      <div className="flex items-center gap-3 mb-6">
        <Globe className="w-6 h-6 text-[#e94560]" />
        <h2 className="text-2xl font-bold">International Shipping Calculator</h2>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-6">
        {/* Destination Country */}
        <div>
          <label className="block text-sm font-medium mb-2">Destination Country</label>
          <select
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full px-4 py-3 bg-[#0f0f17] border border-[#2d3748] rounded-lg focus:border-[#e94560] focus:outline-none"
          >
            {Object.values(countries).map(country => (
              <option key={country.code} value={country.code}>
                {country.name} ({country.code})
              </option>
            ))}
          </select>
        </div>

        {/* Carrier */}
        <div>
          <label className="block text-sm font-medium mb-2">Preferred Carrier</label>
          <select
            value={selectedCarrier}
            onChange={(e) => setSelectedCarrier(e.target.value as Carrier)}
            className="w-full px-4 py-3 bg-[#0f0f17] border border-[#2d3748] rounded-lg focus:border-[#e94560] focus:outline-none"
          >
            <option value="DHL">DHL Express</option>
            <option value="FedEx">FedEx International</option>
            <option value="UPS">UPS Worldwide</option>
            <option value="USPS">USPS International</option>
          </select>
        </div>

        {/* Item Value */}
        <div>
          <label className="block text-sm font-medium mb-2">Item Value (USD)</label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="number"
              value={itemValue}
              onChange={(e) => setItemValue(Number(e.target.value))}
              min="0"
              step="10"
              className="w-full pl-10 pr-4 py-3 bg-[#0f0f17] border border-[#2d3748] rounded-lg focus:border-[#e94560] focus:outline-none"
            />
          </div>
        </div>

        {/* Weight */}
        <div>
          <label className="block text-sm font-medium mb-2">Weight (kg)</label>
          <div className="relative">
            <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(Number(e.target.value))}
              min="0.1"
              step="0.1"
              className="w-full pl-10 pr-4 py-3 bg-[#0f0f17] border border-[#2d3748] rounded-lg focus:border-[#e94560] focus:outline-none"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleCalculate}
        className="w-full py-3 bg-[#e94560] hover:bg-[#d63d56] rounded-lg font-semibold transition-colors"
      >
        Calculate Shipping Cost
      </button>

      {showResults && quote && total && estimate && (
        <div className="mt-8 space-y-6">
          {/* Cost Breakdown */}
          <div className="p-6 bg-[#0f0f17] rounded-xl border border-[#2d3748]">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-[#e94560]" />
              Cost Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Item Value:</span>
                <span className="font-semibold">{format(convert(total.breakdown.itemValue))}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Shipping ({selectedCarrier}):</span>
                <span className="font-semibold">{format(convert(total.breakdown.shipping))}</span>
              </div>
              {isInternational(selectedCountry) && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Customs Duty ({quote.customs.breakdown.dutyRate}%):</span>
                    <span className="font-semibold">{format(convert(total.breakdown.duty))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">VAT/Tax ({quote.customs.breakdown.vatRate}%):</span>
                    <span className="font-semibold">{format(convert(total.breakdown.vat))}</span>
                  </div>
                </>
              )}
              <div className="pt-3 border-t border-[#2d3748] flex justify-between text-lg">
                <span className="font-bold">Total Cost:</span>
                <span className="font-bold text-[#e94560]">{format(convert(total.totalCost))}</span>
              </div>
            </div>
          </div>

          {/* Delivery Estimate */}
          <div className="p-6 bg-[#0f0f17] rounded-xl border border-[#2d3748]">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-[#e94560]" />
              Estimated Delivery
            </h3>
            <p className="text-gray-400">
              Between <span className="text-white font-semibold">{estimate.min.toLocaleDateString()}</span> and{' '}
              <span className="text-white font-semibold">{estimate.max.toLocaleDateString()}</span>
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Delivery time may vary based on customs clearance
            </p>
          </div>

          {/* Available Carriers */}
          <div className="p-6 bg-[#0f0f17] rounded-xl border border-[#2d3748]">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Truck className="w-5 h-5 text-[#e94560]" />
              Available Carriers
            </h3>
            <div className="grid md:grid-cols-2 gap-3">
              {quote.rates.map(rate => (
                <div
                  key={rate.carrier}
                  className={`p-4 rounded-lg border transition-all cursor-pointer ${
                    rate.carrier === selectedCarrier
                      ? 'border-[#e94560] bg-[#e94560]/10'
                      : 'border-[#2d3748] hover:border-[#e94560]/50'
                  }`}
                  onClick={() => setSelectedCarrier(rate.carrier)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold">{rate.carrier}</span>
                    <span className="text-[#e94560] font-bold">{format(convert(rate.price))}</span>
                  </div>
                  <div className="text-sm text-gray-400">
                    <div>~{rate.estimatedDays} days</div>
                    <div className="flex gap-2 mt-1">
                      {rate.tracking && <span className="text-green-500">✓ Tracking</span>}
                      {rate.insurance && <span className="text-green-500">✓ Insurance</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Required Documents */}
          {documents.length > 0 && (
            <div className="p-6 bg-[#0f0f17] rounded-xl border border-[#2d3748]">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#e94560]" />
                Required Customs Documents
              </h3>
              <ul className="space-y-2">
                {documents.map((doc, index) => (
                  <li key={index} className="flex items-center gap-2 text-gray-400">
                    <span className="w-2 h-2 bg-[#e94560] rounded-full"></span>
                    {doc}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-gray-500 mt-4">
                All documents will be generated automatically upon booking
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
