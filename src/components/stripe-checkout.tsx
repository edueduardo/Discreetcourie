'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Loader2, CheckCircle, XCircle, CreditCard } from 'lucide-react'

// Initialize Stripe
const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null

interface CheckoutFormProps {
  amount: number
  description?: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

function CheckoutForm({ amount, description, onSuccess, onError }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<'idle' | 'processing' | 'succeeded' | 'failed'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setStatus('processing')
    setErrorMessage('')

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/admin/payments?success=true`,
        },
        redirect: 'if_required'
      })

      if (error) {
        setStatus('failed')
        setErrorMessage(error.message || 'Payment failed')
        onError?.(error.message || 'Payment failed')
      } else if (paymentIntent?.status === 'succeeded') {
        setStatus('succeeded')
        onSuccess?.()
      } else if (paymentIntent?.status === 'processing') {
        setStatus('processing')
      }
    } catch (err: any) {
      setStatus('failed')
      setErrorMessage(err.message || 'An error occurred')
      onError?.(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'succeeded') {
    return (
      <div className="text-center py-8">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-green-700">Payment Successful!</h3>
        <p className="text-gray-600 mt-2">Thank you for your payment of ${amount.toFixed(2)}</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-600">Amount:</span>
          <span className="text-2xl font-bold">${amount.toFixed(2)}</span>
        </div>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>

      <PaymentElement 
        options={{
          layout: 'tabs'
        }}
      />

      {errorMessage && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
          <XCircle className="h-5 w-5" />
          <span>{errorMessage}</span>
        </div>
      )}

      <Button 
        type="submit" 
        disabled={!stripe || loading}
        className="w-full h-12 text-lg"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="h-5 w-5 mr-2" />
            Pay ${amount.toFixed(2)}
          </>
        )}
      </Button>
    </form>
  )
}

interface StripeCheckoutProps {
  clientSecret: string
  amount: number
  description?: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function StripeCheckout({ clientSecret, amount, description, onSuccess, onError }: StripeCheckoutProps) {
  if (!stripePromise) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-yellow-600">
            <p>Stripe not configured. Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable payments.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Elements 
      stripe={stripePromise} 
      options={{ 
        clientSecret,
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0070f3',
            borderRadius: '8px'
          }
        }
      }}
    >
      <CheckoutForm 
        amount={amount} 
        description={description}
        onSuccess={onSuccess}
        onError={onError}
      />
    </Elements>
  )
}

// Standalone checkout component that creates its own payment intent
interface CheckoutButtonProps {
  amount: number
  customerEmail?: string
  customerPhone?: string
  deliveryId?: string
  description?: string
  onSuccess?: () => void
}

export function CheckoutButton({ amount, customerEmail, customerPhone, deliveryId, description, onSuccess }: CheckoutButtonProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showCheckout, setShowCheckout] = useState(false)

  const createPaymentIntent = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          customerEmail,
          description: description || 'Discreet Courier Service',
          metadata: {
            delivery_id: deliveryId,
            customer_phone: customerPhone
          }
        })
      })

      const data = await res.json()

      if (data.clientSecret) {
        setClientSecret(data.clientSecret)
        setShowCheckout(true)
      } else {
        setError(data.error || 'Failed to create payment')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  if (showCheckout && clientSecret) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Complete Payment
          </CardTitle>
          <CardDescription>Secure payment powered by Stripe</CardDescription>
        </CardHeader>
        <CardContent>
          <StripeCheckout 
            clientSecret={clientSecret}
            amount={amount}
            description={description}
            onSuccess={() => {
              setShowCheckout(false)
              onSuccess?.()
            }}
            onError={setError}
          />
          <Button 
            variant="ghost" 
            className="w-full mt-4"
            onClick={() => setShowCheckout(false)}
          >
            Cancel
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>
      )}
      <Button 
        onClick={createPaymentIntent}
        disabled={loading}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4 mr-2" />
        )}
        Pay ${amount.toFixed(2)}
      </Button>
    </div>
  )
}
