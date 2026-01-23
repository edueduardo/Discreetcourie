'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  CheckCircle2,
  Home,
  Mail,
  Phone,
  FileText,
  MapPin,
  Loader2
} from 'lucide-react'

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [paymentDetails, setPaymentDetails] = useState<any>(null)

  const paymentIntentId = searchParams.get('payment_intent')
  const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret')

  useEffect(() => {
    // In a real implementation, you'd fetch payment details from your API
    // For now, we'll just show a success message
    setTimeout(() => {
      setPaymentDetails({
        id: paymentIntentId?.slice(0, 12) || 'payment',
        status: 'succeeded',
        amount: 0 // Would fetch actual amount
      })
      setLoading(false)
    }, 1000)
  }, [paymentIntentId])

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-green-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Confirming payment...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 py-16 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Payment Successful!
          </h1>
          <p className="text-xl text-green-100">
            Your payment has been processed successfully
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-12 space-y-6">
        {/* Payment Confirmation */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Order Confirmed</CardTitle>
            <CardDescription>
              Your delivery has been scheduled and payment confirmed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-green-400 mb-1">
                  Payment Received
                </h4>
                <p className="text-xs text-slate-400">
                  Confirmation email has been sent to your email address
                </p>
              </div>
            </div>

            {paymentIntentId && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment ID:</span>
                  <span className="text-white font-mono text-xs">
                    {paymentIntentId.slice(0, 20)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-green-400 font-medium">Paid</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* What's Next */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">1</span>
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">
                  Check Your Email
                </h4>
                <p className="text-sm text-slate-400">
                  You'll receive a confirmation email with your delivery details and tracking information.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">2</span>
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">
                  Track Your Delivery
                </h4>
                <p className="text-sm text-slate-400">
                  Use the tracking link in your email to monitor your delivery in real-time.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-bold text-white">3</span>
              </div>
              <div>
                <h4 className="text-white font-medium mb-1">
                  Photo Proof Delivery
                </h4>
                <p className="text-sm text-slate-400">
                  You'll receive photo proof of delivery when your package is delivered.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white text-lg">Need Help?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Phone className="h-4 w-4 text-slate-500" />
              <span className="text-slate-400">Call us:</span>
              <a
                href="tel:+16145003080"
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                (614) 500-3080
              </a>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-slate-500" />
              <span className="text-slate-400">Email:</span>
              <a
                href="mailto:contact@discreetcourier.com"
                className="text-blue-400 hover:text-blue-300 font-medium"
              >
                contact@discreetcourier.com
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            asChild
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            <Link href="/">
              <Home className="h-4 w-4 mr-2" />
              Return to Home
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="flex-1 border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            <Link href="/portal">
              <FileText className="h-4 w-4 mr-2" />
              View My Deliveries
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
