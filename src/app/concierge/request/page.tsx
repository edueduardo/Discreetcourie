'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Shield, Clock, Package, ShoppingBag, FileText, Building2, AlertTriangle, MapPin } from 'lucide-react'

type Step = 1 | 2 | 3 | 4

interface FormData {
  description: string
  service_type: string
  urgency: string
  scheduled_date: string
  scheduled_time: string
  pickup_address: string
  delivery_address: string
  privacy_level: 'standard' | 'confidential'
  phone: string
  communication_preference: 'sms' | 'whatsapp'
  agreed_terms: boolean
}

interface PriceBreakdown {
  basePrice: number
  distanceCharge: number
  urgencyMultiplier: number
  confidentialSurcharge: number
  totalPrice: number
  estimatedDistance: number
}

interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}

// Columbus, OH center coordinates
const COLUMBUS_CENTER = { lat: 39.9612, lng: -82.9988 }
const MAX_DISTANCE_MILES = 25
const MIN_LEAD_TIME_HOURS = 2
const MAX_DAILY_DELIVERIES = 6

// Haversine distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Estimate coordinates from address (Columbus area approximation)
function estimateCoordinates(address: string): { lat: number, lng: number } | null {
  const addr = address.toLowerCase()
  // Columbus area zip code patterns
  const zipMatch = addr.match(/432\d{2}/)
  if (zipMatch) {
    const zip = zipMatch[0]
    // Approximate coordinates for Columbus area zips
    const zipCoords: Record<string, {lat: number, lng: number}> = {
      '43201': { lat: 39.9929, lng: -83.0027 }, // Short North
      '43202': { lat: 40.0173, lng: -83.0186 }, // Clintonville
      '43203': { lat: 39.9711, lng: -82.9654 }, // Near East
      '43204': { lat: 39.9593, lng: -83.0873 }, // Hilltop
      '43205': { lat: 39.9538, lng: -82.9579 }, // Driving Park
      '43206': { lat: 39.9367, lng: -82.9789 }, // German Village
      '43207': { lat: 39.9008, lng: -82.9693 }, // South Side
      '43209': { lat: 39.9632, lng: -82.9145 }, // Bexley
      '43210': { lat: 40.0067, lng: -83.0305 }, // OSU
      '43211': { lat: 40.0281, lng: -82.9563 }, // Linden
      '43212': { lat: 39.9835, lng: -83.0478 }, // Grandview
      '43213': { lat: 39.9693, lng: -82.8638 }, // Whitehall
      '43214': { lat: 40.0545, lng: -83.0186 }, // Worthington
      '43215': { lat: 39.9612, lng: -82.9988 }, // Downtown
      '43216': { lat: 39.9612, lng: -82.9988 }, // Downtown
      '43217': { lat: 39.8167, lng: -82.9333 }, // Lockbourne
      '43219': { lat: 40.0281, lng: -82.9097 }, // Easton
      '43220': { lat: 40.0368, lng: -83.0763 }, // Upper Arlington
      '43221': { lat: 40.0087, lng: -83.0763 }, // Upper Arlington
      '43222': { lat: 39.9593, lng: -83.0305 }, // Franklinton
      '43223': { lat: 39.9155, lng: -83.0186 }, // South Side
      '43224': { lat: 40.0457, lng: -82.9563 }, // Northland
      '43227': { lat: 39.9367, lng: -82.8638 }, // Whitehall
      '43228': { lat: 39.9593, lng: -83.1341 }, // West Side
      '43229': { lat: 40.0893, lng: -82.9789 }, // Westerville
      '43230': { lat: 40.0545, lng: -82.8272 }, // Gahanna
      '43231': { lat: 40.0893, lng: -82.9329 }, // North
      '43232': { lat: 39.9008, lng: -82.8638 }, // South East
      '43235': { lat: 40.1003, lng: -83.0186 }, // Worthington
    }
    return zipCoords[zip] || COLUMBUS_CENTER
  }
  // Default to Columbus center if no zip found
  return COLUMBUS_CENTER
}

function RequestForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialLevel = searchParams.get('level') || '1'
  
  const [step, setStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderCode, setOrderCode] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    description: '',
    service_type: '',
    urgency: '',
    scheduled_date: '',
    scheduled_time: '',
    pickup_address: '',
    delivery_address: '',
    privacy_level: 'standard',
    phone: '',
    communication_preference: 'sms',
    agreed_terms: false
  })

  const [priceBreakdown, setPriceBreakdown] = useState<PriceBreakdown | null>(null)
  const [validation, setValidation] = useState<ValidationResult>({ valid: true, errors: [], warnings: [] })
  const [dailyCount, setDailyCount] = useState(0)

  // Fetch daily delivery count on mount
  useEffect(() => {
    fetch('/api/concierge/tasks?today=true')
      .then(res => res.json())
      .then(data => setDailyCount(data.count || 0))
      .catch(() => setDailyCount(0))
  }, [])

  // Calculate dynamic pricing when addresses change
  useEffect(() => {
    if (formData.pickup_address.length >= 5 && formData.delivery_address.length >= 5) {
      const pickupCoords = estimateCoordinates(formData.pickup_address)
      const deliveryCoords = estimateCoordinates(formData.delivery_address)
      
      if (pickupCoords && deliveryCoords) {
        // Calculate distances
        const pickupFromCenter = calculateDistance(
          COLUMBUS_CENTER.lat, COLUMBUS_CENTER.lng,
          pickupCoords.lat, pickupCoords.lng
        )
        const deliveryFromCenter = calculateDistance(
          COLUMBUS_CENTER.lat, COLUMBUS_CENTER.lng,
          deliveryCoords.lat, deliveryCoords.lng
        )
        const routeDistance = calculateDistance(
          pickupCoords.lat, pickupCoords.lng,
          deliveryCoords.lat, deliveryCoords.lng
        )

        // Validation
        const errors: string[] = []
        const warnings: string[] = []

        if (pickupFromCenter > MAX_DISTANCE_MILES) {
          errors.push(`Pickup location is ${pickupFromCenter.toFixed(1)} miles from Columbus (max ${MAX_DISTANCE_MILES} miles)`)
        }
        if (deliveryFromCenter > MAX_DISTANCE_MILES) {
          errors.push(`Delivery location is ${deliveryFromCenter.toFixed(1)} miles from Columbus (max ${MAX_DISTANCE_MILES} miles)`)
        }
        if (dailyCount >= MAX_DAILY_DELIVERIES) {
          errors.push(`Daily capacity reached (${MAX_DAILY_DELIVERIES} deliveries/day). Please schedule for tomorrow.`)
        }
        if (dailyCount >= MAX_DAILY_DELIVERIES - 1) {
          warnings.push(`Only ${MAX_DAILY_DELIVERIES - dailyCount} delivery slot(s) remaining today`)
        }

        // Lead time validation for ASAP
        if (formData.urgency === 'asap') {
          warnings.push(`ASAP requests require ${MIN_LEAD_TIME_HOURS}+ hours lead time`)
        }

        setValidation({ valid: errors.length === 0, errors, warnings })

        // Dynamic pricing calculation
        const basePrice = formData.service_type === 'standard' ? 35 :
                         formData.service_type === 'confidential' ? 50 :
                         formData.service_type === 'shopping' ? 75 :
                         formData.service_type === 'b2b' ? 40 : 35

        // Distance charge: $1.50 per mile over 5 miles
        const distanceCharge = Math.max(0, (routeDistance - 5) * 1.5)

        // Urgency multiplier
        const urgencyMultiplier = formData.urgency === 'asap' ? 1.5 :
                                  formData.urgency === 'today' ? 1.25 : 1.0

        // Confidential surcharge
        const confidentialSurcharge = formData.privacy_level === 'confidential' ? 20 : 0

        const totalPrice = (basePrice + distanceCharge) * urgencyMultiplier + confidentialSurcharge

        setPriceBreakdown({
          basePrice,
          distanceCharge: Math.round(distanceCharge * 100) / 100,
          urgencyMultiplier,
          confidentialSurcharge,
          totalPrice: Math.round(totalPrice * 100) / 100,
          estimatedDistance: Math.round(routeDistance * 10) / 10
        })
      }
    }
  }, [formData.pickup_address, formData.delivery_address, formData.service_type, formData.urgency, formData.privacy_level, dailyCount])

  const updateForm = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const canProceed = () => {
    switch (step) {
      case 1: return formData.service_type !== ''
      case 2: return formData.urgency !== '' && (formData.urgency !== 'schedule' || (formData.scheduled_date && formData.scheduled_time))
      case 3: return formData.pickup_address.length >= 5 && formData.delivery_address.length >= 5
      case 4: return formData.phone.length >= 10 && formData.agreed_terms
      default: return false
    }
  }

  const getPrice = () => {
    if (priceBreakdown) {
      return `$${priceBreakdown.totalPrice.toFixed(2)}`
    }
    // Fallback static prices
    switch (formData.service_type) {
      case 'standard': return 'From $35'
      case 'confidential': return 'From $55'
      case 'shopping': return '$75/hr'
      case 'b2b': return 'From $40'
      default: return ''
    }
  }

  const getStaticPrice = () => {
    switch (formData.service_type) {
      case 'standard': return '$35'
      case 'confidential': return '$55'
      case 'shopping': return '$75/hr'
      case 'b2b': return 'From $40'
      default: return ''
    }
  }

  const handleSubmit = async () => {
    if (!validation.valid) {
      alert('Please fix the errors before submitting')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/concierge/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: priceBreakdown?.totalPrice || 35,
          price_breakdown: priceBreakdown,
          estimated_distance: priceBreakdown?.estimatedDistance,
          requires_nda: formData.privacy_level === 'confidential'
        })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        alert(data.error || 'Failed to submit request')
        setIsSubmitting(false)
        return
      }
      
      setOrderCode(data.reference || 'DC-' + Date.now().toString(36).toUpperCase())
    } catch (error) {
      console.error('Error:', error)
      setOrderCode('DC-' + Date.now().toString(36).toUpperCase())
    }
    
    setIsSubmitting(false)
  }

  // Success Screen
  if (orderCode) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Request Received.</h1>
          <p className="text-gray-400 mb-8">
            You&apos;ll receive a {formData.communication_preference === 'whatsapp' ? 'WhatsApp' : 'text'} message within 30 minutes.
            <br />
            For urgent requests, call: <span className="text-white">(614) 500-3080</span>
          </p>
          
          <div className="p-6 rounded-xl bg-[#1a1a2e] border border-[#2d3748] mb-8">
            <p className="text-sm text-gray-400 mb-2">Your tracking code:</p>
            <p className="text-2xl font-mono font-bold text-[#e94560]">{orderCode}</p>
            <p className="text-xs text-gray-500 mt-2">
              Save this code. It&apos;s the only way to track your delivery.
            </p>
          </div>

          <div className="text-sm text-gray-500 mb-8">
            <p>Estimated price: <span className="text-white font-semibold">{getPrice()}</span></p>
            <p className="mt-1">Payment will be collected upon confirmation.</p>
          </div>
          
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    )
  }

  const getServiceLabel = (type: string) => {
    switch (type) {
      case 'standard': return 'Standard Delivery'
      case 'confidential': return 'Confidential Delivery'
      case 'shopping': return 'Personal Shopping'
      case 'b2b': return 'Business Documents'
      default: return type
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="p-6 border-b border-[#2d3748]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => step > 1 ? setStep((step - 1) as Step) : router.push('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {step > 1 ? 'Back' : 'Home'}
          </button>
          
          {/* Progress */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-8 h-1 rounded-full transition-colors ${
                  s <= step ? 'bg-[#e94560]' : 'bg-[#2d3748]'
                }`}
              />
            ))}
          </div>
          
          <span className="text-sm text-gray-500">
            Step {step} of 4
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="p-6">
        <div className="max-w-2xl mx-auto">
          
          {/* STEP 1: Select Service Type */}
          {step === 1 && (
            <div className="py-12">
              <h1 className="text-3xl font-bold mb-2">What do you need?</h1>
              <p className="text-gray-400 mb-8">Select the service that best fits your needs.</p>
              
              <div className="space-y-4">
                {[
                  { id: 'standard', label: 'Standard Delivery', desc: 'Same-day courier service with photo proof', price: 'From $35', icon: <Package className="w-6 h-6" /> },
                  { id: 'confidential', label: 'Confidential Delivery', desc: 'Includes NDA, extra discretion guaranteed', price: 'From $55', icon: <Shield className="w-6 h-6" /> },
                  { id: 'shopping', label: 'Personal Shopping', desc: 'I buy and deliver items for you', price: '$75/hr', icon: <ShoppingBag className="w-6 h-6" /> },
                  { id: 'b2b', label: 'Business Documents', desc: 'Professional document courier for businesses', price: 'From $40', icon: <Building2 className="w-6 h-6" /> },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => updateForm('service_type', option.id)}
                    className={`w-full p-6 rounded-xl border text-left transition-all ${
                      formData.service_type === option.id
                        ? 'bg-[#e94560]/10 border-[#e94560]'
                        : 'bg-[#1a1a2e] border-[#2d3748] hover:border-[#e94560]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-lg ${formData.service_type === option.id ? 'bg-[#e94560]/20' : 'bg-[#2d3748]'}`}>
                          {option.icon}
                        </div>
                        <div>
                          <p className="font-semibold">{option.label}</p>
                          <p className="text-sm text-gray-400">{option.desc}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-[#e94560]">{option.price}</p>
                        {formData.service_type === option.id && (
                          <Check className="w-5 h-5 text-[#e94560] ml-auto mt-1" />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="mt-6 p-4 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <p className="text-sm text-blue-300">
                  <Shield className="w-4 h-4 inline mr-1" />
                  All services include photo proof of delivery.
                </p>
                <p className="text-sm text-gray-400 mt-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Service area: {MAX_DISTANCE_MILES} miles from Columbus • Max {MAX_DAILY_DELIVERIES} deliveries/day • {MIN_LEAD_TIME_HOURS}h lead time
                </p>
                {dailyCount > 0 && (
                  <p className="text-sm text-yellow-400 mt-1">
                    <Clock className="w-4 h-4 inline mr-1" />
                    {MAX_DAILY_DELIVERIES - dailyCount} slot(s) available today
                  </p>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: When do you need it? */}
          {step === 2 && (
            <div className="py-12">
              <h1 className="text-3xl font-bold mb-2">When do you need it?</h1>
              <p className="text-gray-400 mb-8">Select timing for your {getServiceLabel(formData.service_type).toLowerCase()}.</p>
              
              {/* Urgency */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-4">Urgency</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'asap', label: 'ASAP (2-4 hrs)', desc: 'Subject to availability' },
                    { id: 'today', label: 'Today', desc: 'Same-day delivery' },
                    { id: 'tomorrow', label: 'Tomorrow', desc: 'Next-day service' },
                    { id: 'schedule', label: 'Schedule', desc: 'Pick date & time' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => updateForm('urgency', option.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        formData.urgency === option.id
                          ? 'bg-[#e94560]/10 border-[#e94560]'
                          : 'bg-[#1a1a2e] border-[#2d3748] hover:border-[#e94560]/50'
                      }`}
                    >
                      <p className="font-semibold">{option.label}</p>
                      <p className="text-xs text-gray-400">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Schedule fields - only show if schedule selected */}
              {formData.urgency === 'schedule' && (
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div>
                    <label className="block text-sm font-medium mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.scheduled_date}
                      onChange={(e) => updateForm('scheduled_date', e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-4 rounded-xl bg-[#1a1a2e] border border-[#2d3748] focus:border-[#e94560] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Time</label>
                    <input
                      type="time"
                      value={formData.scheduled_time}
                      onChange={(e) => updateForm('scheduled_time', e.target.value)}
                      className="w-full p-4 rounded-xl bg-[#1a1a2e] border border-[#2d3748] focus:border-[#e94560] outline-none"
                    />
                  </div>
                </div>
              )}
              
              {/* Service Level */}
              <div>
                <label className="block text-sm font-medium mb-4">Service Level</label>
                <div className="space-y-3">
                  {[
                    { id: 'standard', label: 'Standard', desc: 'Regular delivery with tracking', icon: <Package className="w-5 h-5" /> },
                    { id: 'confidential', label: 'Confidential', desc: 'NDA included, extra discretion', icon: <Shield className="w-5 h-5 text-[#e94560]" /> },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => updateForm('privacy_level', option.id as FormData['privacy_level'])}
                      className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                        formData.privacy_level === option.id
                          ? 'bg-[#e94560]/10 border-[#e94560]'
                          : 'bg-[#1a1a2e] border-[#2d3748] hover:border-[#e94560]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {option.icon}
                        <div>
                          <p className="font-semibold">{option.label}</p>
                          <p className="text-sm text-gray-400">{option.desc}</p>
                        </div>
                      </div>
                      {formData.privacy_level === option.id && (
                        <Check className="w-5 h-5 text-[#e94560]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Addresses */}
          {step === 3 && (
            <div className="py-12">
              <h1 className="text-3xl font-bold mb-2">Where?</h1>
              <p className="text-gray-400 mb-8">Enter pickup and delivery addresses.</p>
              
              {/* Pickup Address */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Pickup Address</label>
                <input
                  type="text"
                  value={formData.pickup_address}
                  onChange={(e) => updateForm('pickup_address', e.target.value)}
                  placeholder="123 Main St, Columbus, OH 43215"
                  className="w-full p-4 rounded-xl bg-[#1a1a2e] border border-[#2d3748] focus:border-[#e94560] outline-none"
                />
              </div>

              {/* Delivery Address */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Delivery Address</label>
                <input
                  type="text"
                  value={formData.delivery_address}
                  onChange={(e) => updateForm('delivery_address', e.target.value)}
                  placeholder="456 Oak Ave, Columbus, OH 43210"
                  className="w-full p-4 rounded-xl bg-[#1a1a2e] border border-[#2d3748] focus:border-[#e94560] outline-none"
                />
              </div>

              {/* Special Instructions */}
              <div>
                <label className="block text-sm font-medium mb-2">Special Instructions (optional)</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => updateForm('description', e.target.value)}
                  placeholder="Gate code, contact name, specific instructions..."
                  className="w-full h-32 p-4 rounded-xl bg-[#1a1a2e] border border-[#2d3748] focus:border-[#e94560] outline-none resize-none"
                />
              </div>

              {/* Validation Messages */}
              {validation.errors.length > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                  <p className="text-sm font-semibold text-red-400 mb-2">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    Cannot proceed:
                  </p>
                  <ul className="text-sm text-red-300 list-disc list-inside">
                    {validation.errors.map((err, i) => <li key={i}>{err}</li>)}
                  </ul>
                </div>
              )}

              {validation.warnings.length > 0 && validation.errors.length === 0 && (
                <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
                  <p className="text-sm text-yellow-400">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    {validation.warnings.join(' • ')}
                  </p>
                </div>
              )}

              {/* Dynamic Price Display */}
              {priceBreakdown && validation.errors.length === 0 && (
                <div className="mt-4 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-400">Estimated Distance</p>
                      <p className="text-lg font-semibold text-white">{priceBreakdown.estimatedDistance} miles</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Dynamic Price</p>
                      <p className="text-2xl font-bold text-[#e94560]">${priceBreakdown.totalPrice.toFixed(2)}</p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-green-500/20 text-xs text-gray-400">
                    <div className="flex justify-between"><span>Base ({formData.service_type})</span><span>${priceBreakdown.basePrice}</span></div>
                    {priceBreakdown.distanceCharge > 0 && (
                      <div className="flex justify-between"><span>Distance charge</span><span>+${priceBreakdown.distanceCharge.toFixed(2)}</span></div>
                    )}
                    {priceBreakdown.urgencyMultiplier > 1 && (
                      <div className="flex justify-between"><span>Urgency ({formData.urgency})</span><span>×{priceBreakdown.urgencyMultiplier}</span></div>
                    )}
                    {priceBreakdown.confidentialSurcharge > 0 && (
                      <div className="flex justify-between"><span>Confidential</span><span>+${priceBreakdown.confidentialSurcharge}</span></div>
                    )}
                  </div>
                </div>
              )}

              <p className="text-sm text-gray-500 mt-4">
                <Clock className="w-4 h-4 inline mr-1" />
                Service area: {MAX_DISTANCE_MILES} miles from downtown Columbus. Minimum {MIN_LEAD_TIME_HOURS} hours lead time.
              </p>
            </div>
          )}

          {/* STEP 4: Contact & Confirm */}
          {step === 4 && (
            <div className="py-12">
              <h1 className="text-3xl font-bold mb-2">Almost done.</h1>
              <p className="text-gray-400 mb-8">How should I contact you?</p>
              
              {/* Phone */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                  placeholder="(614) 555-1234"
                  className="w-full p-4 rounded-xl bg-[#1a1a2e] border border-[#2d3748] focus:border-[#e94560] outline-none text-lg"
                />
              </div>

              {/* Communication Preference */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Preferred Contact Method</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => updateForm('communication_preference', 'sms')}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      formData.communication_preference === 'sms'
                        ? 'bg-[#e94560]/10 border-[#e94560]'
                        : 'bg-[#1a1a2e] border-[#2d3748] hover:border-[#e94560]/50'
                    }`}
                  >
                    <p className="font-semibold">SMS / Text</p>
                    <p className="text-xs text-gray-400">Standard text messages</p>
                  </button>
                  <button
                    onClick={() => updateForm('communication_preference', 'whatsapp')}
                    className={`p-4 rounded-xl border text-center transition-all ${
                      formData.communication_preference === 'whatsapp'
                        ? 'bg-[#e94560]/10 border-[#e94560]'
                        : 'bg-[#1a1a2e] border-[#2d3748] hover:border-[#e94560]/50'
                    }`}
                  >
                    <p className="font-semibold">WhatsApp</p>
                    <p className="text-xs text-gray-400">End-to-end encrypted</p>
                  </button>
                </div>
              </div>
              
              {/* Terms */}
              <div className="mb-8">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreed_terms}
                    onChange={(e) => updateForm('agreed_terms', e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-[#2d3748] bg-[#1a1a2e] text-[#e94560] focus:ring-[#e94560]"
                  />
                  <span className="text-sm text-gray-400">
                    I agree to the{' '}
                    <Link href="/terms" className="text-[#e94560] hover:underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-[#e94560] hover:underline">Privacy Policy</Link>.
                    {formData.privacy_level === 'confidential' && ' I understand an NDA will be required.'}
                  </span>
                </label>
              </div>
              
              {/* Summary */}
              <div className="p-6 rounded-xl bg-[#1a1a2e] border border-[#2d3748] mb-8">
                <h3 className="font-semibold mb-4">Order Summary</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Service:</span>
                    <span>{getServiceLabel(formData.service_type)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Timing:</span>
                    <span className="capitalize">{formData.urgency || 'Not selected'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Level:</span>
                    <span className={formData.privacy_level === 'confidential' ? 'text-[#e94560]' : ''}>
                      {formData.privacy_level === 'confidential' ? 'Confidential (NDA)' : 'Standard'}
                    </span>
                  </div>
                  {priceBreakdown && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Distance:</span>
                        <span>{priceBreakdown.estimatedDistance} miles</span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between pt-2 border-t border-[#2d3748] mt-2">
                    <span className="text-gray-400">Estimated Price:</span>
                    <span className="font-bold text-[#e94560] text-lg">{getPrice()}</span>
                  </div>
                  {priceBreakdown && priceBreakdown.urgencyMultiplier > 1 && (
                    <p className="text-xs text-yellow-400 mt-1">Includes {((priceBreakdown.urgencyMultiplier - 1) * 100).toFixed(0)}% urgency fee</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-8 border-t border-[#2d3748]">
            {step > 1 ? (
              <button
                onClick={() => setStep((step - 1) as Step)}
                className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
              >
                Back
              </button>
            ) : (
              <div />
            )}
            
            {step < 4 ? (
              <button
                onClick={() => setStep((step + 1) as Step)}
                disabled={!canProceed()}
                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all ${
                  canProceed()
                    ? 'bg-[#e94560] hover:bg-[#d63d56]'
                    : 'bg-[#2d3748] text-gray-500 cursor-not-allowed'
                }`}
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all ${
                  canProceed() && !isSubmitting
                    ? 'bg-[#e94560] hover:bg-[#d63d56]'
                    : 'bg-[#2d3748] text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Submitting...' : 'Request Delivery'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

export default function ConciergeRequestPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f]" />}>
      <RequestForm />
    </Suspense>
  )
}
