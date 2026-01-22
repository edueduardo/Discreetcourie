'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calculator,
  MapPin,
  Clock,
  Zap,
  DollarSign,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  User,
  CreditCard
} from 'lucide-react'
import { toast } from 'sonner'

interface QuoteFormData {
  pickup_address: string
  delivery_address: string
  urgency: 'urgent_1h' | 'same_day' | 'next_day'
  service_tier: 'courier' | 'discreet' | 'concierge' | 'fixer'
  pickup_time: string
  additional_stops: number
  wait_time_hours: number
  contact_name: string
  contact_email: string
  contact_phone: string
}

export default function QuotePage() {
  const router = useRouter()
  const [calculating, setCalculating] = useState(false)
  const [quoteData, setQuoteData] = useState<any>(null)
  const [formData, setFormData] = useState<QuoteFormData>({
    pickup_address: '',
    delivery_address: '',
    urgency: 'same_day',
    service_tier: 'courier',
    pickup_time: '10:00',
    additional_stops: 0,
    wait_time_hours: 0,
    contact_name: '',
    contact_email: '',
    contact_phone: ''
  })

  const updateField = <K extends keyof QuoteFormData>(key: K, value: QuoteFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }))
  }

  const calculateQuote = async () => {
    // Validate addresses
    if (!formData.pickup_address || !formData.delivery_address) {
      toast.error('Please enter both pickup and delivery addresses')
      return
    }

    setCalculating(true)
    setQuoteData(null)

    try {
      const response = await fetch('/api/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate quote')
      }

      setQuoteData(data)
      toast.success('Quote calculated successfully!')

      // Scroll to results
      setTimeout(() => {
        document.getElementById('quote-results')?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (error: any) {
      console.error('Quote calculation error:', error)
      toast.error(error.message || 'Failed to calculate quote')
    } finally {
      setCalculating(false)
    }
  }

  const bookNow = () => {
    if (quoteData?.quote?.id) {
      router.push(`/concierge/request?quote_id=${quoteData.quote.id}`)
    }
  }

  const payNow = () => {
    if (quoteData?.quote?.id) {
      const params = new URLSearchParams({
        amount: quoteData.price.toFixed(2),
        description: `Delivery: ${formData.pickup_address} → ${formData.delivery_address}`,
        quote_id: quoteData.quote.id,
        email: formData.contact_email || ''
      })
      router.push(`/checkout?${params.toString()}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Calculator className="h-10 w-10" />
            Get Instant Quote
          </h1>
          <p className="text-xl text-blue-100">
            Calculate your delivery price in seconds. No signup required.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12 space-y-8">
        {/* Address Inputs */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5 text-blue-500" />
              Delivery Details
            </CardTitle>
            <CardDescription>
              Enter pickup and delivery addresses for instant pricing
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Addresses */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Pickup Address</Label>
                <Input
                  placeholder="e.g., 123 Main St, Columbus, OH 43215"
                  value={formData.pickup_address}
                  onChange={(e) => updateField('pickup_address', e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Delivery Address</Label>
                <Input
                  placeholder="e.g., 456 Oak Ave, Columbus, OH 43201"
                  value={formData.delivery_address}
                  onChange={(e) => updateField('delivery_address', e.target.value)}
                  className="bg-slate-900 border-slate-700 text-white"
                />
              </div>
            </div>

            {/* Service Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Service Type</Label>
                <Select
                  value={formData.service_tier}
                  onValueChange={(value: any) => updateField('service_tier', value)}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="courier">Courier (Base)</SelectItem>
                    <SelectItem value="discreet">Discreet (+50%)</SelectItem>
                    <SelectItem value="concierge">Concierge (+100%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300 flex items-center gap-2">
                  <Zap className="h-4 w-4 text-slate-500" />
                  Urgency
                </Label>
                <Select
                  value={formData.urgency}
                  onValueChange={(value: any) => updateField('urgency', value)}
                >
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="next_day">Next Day (Standard)</SelectItem>
                    <SelectItem value="same_day">Same Day (+30%)</SelectItem>
                    <SelectItem value="urgent_1h">Urgent 1 Hour (+100%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pickup Time */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                Preferred Pickup Time
              </Label>
              <Input
                type="time"
                value={formData.pickup_time}
                onChange={(e) => updateField('pickup_time', e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            {/* Contact Info (Optional) */}
            <div className="border-t border-slate-700 pt-6 space-y-4">
              <p className="text-sm text-slate-400">
                Contact information (optional - to save this quote)
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Name
                  </Label>
                  <Input
                    placeholder="Your name"
                    value={formData.contact_name}
                    onChange={(e) => updateField('contact_name', e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={formData.contact_email}
                    onChange={(e) => updateField('contact_email', e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300 flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone
                  </Label>
                  <Input
                    type="tel"
                    placeholder="(614) 555-0100"
                    value={formData.contact_phone}
                    onChange={(e) => updateField('contact_phone', e.target.value)}
                    className="bg-slate-900 border-slate-700 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Calculate Button */}
            <Button
              onClick={calculateQuote}
              disabled={calculating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6"
            >
              {calculating ? (
                <>
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                  Calculating...
                </>
              ) : (
                <>
                  <Calculator className="h-5 w-5 mr-2" />
                  Calculate Price
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Quote Results */}
        {quoteData && (
          <div id="quote-results" className="space-y-6">
            {/* Price Display */}
            <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/30">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-green-500" />
                    Your Quote
                  </span>
                  <span className="text-4xl font-bold text-green-500">
                    ${quoteData.price.toFixed(2)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Distance & Duration */}
                <div className="flex flex-wrap gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-400">Distance:</span>
                    <span className="text-white font-medium">{quoteData.distance} miles</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-slate-500" />
                    <span className="text-slate-400">Est. Duration:</span>
                    <span className="text-white font-medium">{quoteData.duration} min</span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="border-t border-slate-700 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Base Rate</span>
                    <span className="text-white">${quoteData.breakdown.base_price.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Distance ({quoteData.distance} mi × $2.50)</span>
                    <span className="text-white">${quoteData.breakdown.distance_cost.toFixed(2)}</span>
                  </div>
                  {quoteData.breakdown.urgency_cost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Urgency Fee</span>
                      <span className="text-yellow-500">+${quoteData.breakdown.urgency_cost.toFixed(2)}</span>
                    </div>
                  )}
                  {quoteData.breakdown.service_tier_cost > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Service Tier</span>
                      <span className="text-blue-500">+${quoteData.breakdown.service_tier_cost.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Warning if distance calculation failed */}
                {quoteData.distanceCalculationWarning && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                    <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5" />
                    <p className="text-xs text-yellow-400">
                      Estimated distance used. Actual price may vary slightly.
                    </p>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                      onClick={payNow}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-lg py-6"
                    >
                      <CreditCard className="h-5 w-5 mr-2" />
                      Pay Now & Book
                      <ArrowRight className="h-5 w-5 ml-2" />
                    </Button>
                    <Button
                      onClick={bookNow}
                      variant="outline"
                      className="flex-1 border-green-600 text-green-500 hover:bg-green-600/10 text-lg py-6"
                    >
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Book Later
                    </Button>
                  </div>
                  <Button
                    onClick={() => window.print()}
                    variant="outline"
                    className="w-full border-slate-700 text-slate-300 hover:bg-slate-800"
                  >
                    Save Quote
                  </Button>
                </div>

                <p className="text-xs text-slate-500 text-center">
                  Quote valid for 7 days. Final price confirmed at booking.
                </p>
              </CardContent>
            </Card>

            {/* Quote Details */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Quote Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Pickup:</span>
                  <span className="text-white text-right">{formData.pickup_address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Delivery:</span>
                  <span className="text-white text-right">{formData.delivery_address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Service:</span>
                  <span className="text-white capitalize">{formData.service_tier}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Urgency:</span>
                  <span className="text-white">{formData.urgency.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Quote ID:</span>
                  <span className="text-white font-mono text-xs">{quoteData.quote.id.slice(0, 8)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Help Section */}
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <p className="text-slate-400 text-center">
              Need help or have questions?{' '}
              <a href="tel:+16145003080" className="text-blue-400 hover:text-blue-300">
                Call (614) 500-3080
              </a>
              {' '}or{' '}
              <Link href="/concierge/request" className="text-blue-400 hover:text-blue-300">
                contact us
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
