'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SmartPricing } from '@/components/SmartPricing'
import {
  CreditCard,
  DollarSign,
  Loader2,
  CheckCircle2,
  XCircle,
  Lock,
  MapPin
} from 'lucide-react'
import { toast } from 'sonner'

// Initialize Stripe (client-side publishable key)
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ''
)

interface CheckoutData {
  amount: number
  description: string
  customerEmail?: string
  metadata?: Record<string, any>
  quoteId?: string
  deliveryId?: string
}

function CheckoutForm({ checkoutData }: { checkoutData: CheckoutData }) {
  const stripe = useStripe()
  const elements = useElements()
  const router = useRouter()
  const [processing, setProcessing] = useState(false)
  const [succeeded, setSucceeded] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setProcessing(true)
    setError(null)

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        throw new Error(submitError.message)
      }

      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      })

      if (confirmError) {
        throw new Error(confirmError.message)
      }

      // Payment succeeded
      setSucceeded(true)
      toast.success('Payment successful!')

      // Redirect after short delay
      setTimeout(() => {
        router.push('/checkout/success')
      }, 1500)

    } catch (err: any) {
      setError(err.message || 'Payment failed')
      toast.error(err.message || 'Payment failed')
    } finally {
      setProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment Element */}
      <div className="p-4 rounded-lg bg-white">
        <PaymentElement />
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-red-500/10 border border-red-500/30">
          <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {succeeded && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
          <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
          <p className="text-sm text-green-400">Payment successful! Redirecting...</p>
        </div>
      )}

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={!stripe || processing || succeeded}
        className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
      >
        {processing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : succeeded ? (
          <>
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Payment Complete
          </>
        ) : (
          <>
            <Lock className="h-5 w-5 mr-2" />
            Pay ${checkoutData.amount.toFixed(2)}
          </>
        )}
      </Button>

      <p className="text-xs text-slate-500 text-center">
        Secured by Stripe. Your payment information is encrypted.
      </p>
    </form>
  )
}

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null)

  useEffect(() => {
    const initializePayment = async () => {
      // Get checkout parameters from URL
      const amount = parseFloat(searchParams.get('amount') || '0')
      const description = searchParams.get('description') || 'Delivery Service'
      const quoteId = searchParams.get('quote_id') || undefined
      const deliveryId = searchParams.get('delivery_id') || undefined
      const email = searchParams.get('email') || undefined

      if (!amount || amount <= 0) {
        toast.error('Invalid payment amount')
        setLoading(false)
        return
      }

      const metadata: Record<string, any> = {}
      if (quoteId) metadata.quote_id = quoteId
      if (deliveryId) metadata.delivery_id = deliveryId

      setCheckoutData({
        amount,
        description,
        customerEmail: email,
        metadata,
        quoteId,
        deliveryId
      })

      try {
        // Create payment intent
        const response = await fetch('/api/payments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount,
            customerEmail: email,
            description,
            metadata
          })
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to create payment')
        }

        setClientSecret(data.clientSecret)
      } catch (error: any) {
        console.error('Payment initialization error:', error)
        toast.error(error.message || 'Failed to initialize payment')
      } finally {
        setLoading(false)
      }
    }

    initializePayment()
  }, [searchParams])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Initializing payment...</p>
        </div>
      </div>
    )
  }

  if (!clientSecret || !checkoutData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <Card className="bg-slate-800 border-slate-700 max-w-md w-full">
          <CardContent className="p-6">
            <div className="flex items-start gap-3 text-red-400">
              <XCircle className="h-6 w-6 mt-1" />
              <div>
                <h3 className="font-semibold mb-2">Payment Error</h3>
                <p className="text-sm text-slate-400">
                  Unable to initialize payment. Please check the payment details and try again.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 py-12 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 flex items-center justify-center gap-3">
            <CreditCard className="h-8 w-8" />
            Secure Checkout
          </h1>
          <p className="text-blue-100">
            Complete your payment securely
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="space-y-6">
          {/* Order Summary */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-2xl text-green-500">
                  ${checkoutData.amount.toFixed(2)}
                </span>
              </CardTitle>
              <CardDescription>{checkoutData.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Service</span>
                <span className="text-white">{checkoutData.description}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Amount</span>
                <span className="text-white font-medium">
                  ${checkoutData.amount.toFixed(2)}
                </span>
              </div>
              {checkoutData.metadata?.pickup_address && (
                <div className="flex justify-between items-start">
                  <span className="text-slate-400">Pickup</span>
                  <span className="text-white text-right max-w-[60%]">
                    {checkoutData.metadata.pickup_address}
                  </span>
                </div>
              )}
              {checkoutData.metadata?.delivery_address && (
                <div className="flex justify-between items-start">
                  <span className="text-slate-400">Delivery</span>
                  <span className="text-white text-right max-w-[60%]">
                    {checkoutData.metadata.delivery_address}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Form */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Lock className="h-5 w-5 text-green-500" />
                Payment Information
              </CardTitle>
              <CardDescription>
                Enter your payment details below
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'night',
                    variables: {
                      colorPrimary: '#10b981',
                      colorBackground: '#0f172a',
                      colorText: '#f1f5f9',
                      colorDanger: '#ef4444',
                      fontFamily: 'system-ui, sans-serif',
                      borderRadius: '8px',
                    }
                  }
                }}
              >
                <CheckoutForm checkoutData={checkoutData} />
              </Elements>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="flex items-center justify-center gap-6 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 text-green-500" />
              <span>256-bit SSL</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span>PCI Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-green-500" />
              <span>Secured by Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
