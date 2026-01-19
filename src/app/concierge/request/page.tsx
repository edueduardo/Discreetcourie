'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, Check, Shield, Clock, Package, ShoppingBag, FileText, Building2 } from 'lucide-react'

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
    switch (formData.service_type) {
      case 'standard': return '$35'
      case 'confidential': return '$55'
      case 'shopping': return '$75/hr'
      case 'b2b': return 'From $40'
      default: return ''
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/concierge/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price: getPrice(),
          requires_nda: formData.privacy_level === 'confidential'
        })
      })
      
      const data = await response.json()
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
                  { id: 'standard', label: 'Standard Delivery', desc: 'Same-day courier service with photo proof', price: '$35', icon: <Package className="w-6 h-6" /> },
                  { id: 'confidential', label: 'Confidential Delivery', desc: 'Includes NDA, extra discretion guaranteed', price: '$55', icon: <Shield className="w-6 h-6" /> },
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

              <p className="text-sm text-gray-600 mt-6">
                <Shield className="w-4 h-4 inline mr-1" />
                All services include photo proof of delivery. Service area: 25 miles from Columbus.
              </p>
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

              <p className="text-sm text-gray-500 mt-4">
                <Clock className="w-4 h-4 inline mr-1" />
                Service area: 25 miles from downtown Columbus. Minimum 2 hours lead time.
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
                  <div className="flex justify-between pt-2 border-t border-[#2d3748] mt-2">
                    <span className="text-gray-400">Estimated Price:</span>
                    <span className="font-bold text-[#e94560]">{getPrice()}</span>
                  </div>
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
