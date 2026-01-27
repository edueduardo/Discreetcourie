'use client'

import { useState, useEffect } from 'react'
import { Check, TrendingUp, DollarSign, Zap } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface Plan {
  id: string
  name: string
  price: number
  interval: string
  deliveries: number
  features: string[]
  recommended?: boolean
  targetCustomer: string
  roi: {
    savings: number
    savingsPercentage: number
    breakEvenDeliveries: number
  }
}

export function SubscriptionPlans() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans')
      const result = await response.json()
      if (result.success) {
        setPlans(result.plans)
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error)
    } finally {
      setLoading(false)
    }
  }

  const subscribeToPlan = async (planId: string) => {
    setSubscribing(planId)
    try {
      const response = await fetch('/api/subscriptions/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      })

      const result = await response.json()

      if (result.success) {
        alert(`✅ ${result.message}`)
        window.location.href = '/portal/subscriptions'
      } else {
        alert(`❌ ${result.error}`)
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to subscribe. Please try again.')
    } finally {
      setSubscribing(null)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading plans...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Choose Your Plan</h2>
        <p className="text-muted-foreground">
          Save money with monthly subscriptions. Cancel anytime.
        </p>
      </div>

      {/* Plans Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={`relative ${
              plan.recommended
                ? 'border-2 border-primary shadow-lg scale-105'
                : 'border'
            }`}
          >
            {plan.recommended && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary text-primary-foreground px-4 py-1">
                  <Zap className="h-3 w-3 mr-1 inline" />
                  Most Popular
                </Badge>
              </div>
            )}

            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl">{plan.name}</CardTitle>
              <CardDescription className="text-sm">
                {plan.targetCustomer}
              </CardDescription>
              <div className="mt-4">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                {plan.roi.savings > 0 && (
                  <div className="mt-2 text-sm text-green-600 font-semibold">
                    Save ${plan.roi.savings}/month ({plan.roi.savingsPercentage}%)
                  </div>
                )}
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Deliveries */}
              <div className="text-center p-3 bg-accent rounded-lg">
                <p className="text-2xl font-bold">
                  {plan.deliveries === -1 ? '∞' : plan.deliveries}
                </p>
                <p className="text-sm text-muted-foreground">
                  {plan.deliveries === -1 ? 'Unlimited' : 'Deliveries/month'}
                </p>
              </div>

              {/* Features */}
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* ROI Info */}
              <div className="pt-4 border-t space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Break-even:</span>
                  <span className="font-semibold">
                    {plan.roi.breakEvenDeliveries} deliveries
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  After {plan.roi.breakEvenDeliveries} deliveries, everything is pure savings
                </p>
              </div>

              {/* CTA */}
              <Button
                onClick={() => subscribeToPlan(plan.id)}
                disabled={subscribing !== null}
                className="w-full"
                size="lg"
                variant={plan.recommended ? 'default' : 'outline'}
              >
                {subscribing === plan.id ? 'Processing...' : 'Subscribe Now'}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Why Subscribe?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                <DollarSign className="h-6 w-6 text-green-500" />
              </div>
              <h3 className="font-semibold">Save Money</h3>
              <p className="text-sm text-muted-foreground">
                Save up to 68% compared to pay-per-delivery pricing
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                <Zap className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="font-semibold">Predictable Costs</h3>
              <p className="text-sm text-muted-foreground">
                Fixed monthly fee. No surprises. Budget with confidence.
              </p>
            </div>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto">
                <Check className="h-6 w-6 text-purple-500" />
              </div>
              <h3 className="font-semibold">Priority Service</h3>
              <p className="text-sm text-muted-foreground">
                Dedicated account manager and priority support
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Columbus Business Types */}
      <Card>
        <CardHeader>
          <CardTitle>Perfect for Columbus Businesses</CardTitle>
          <CardDescription>
            Join law firms, medical offices, and businesses across Columbus
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">🏛️ Law Firms</h4>
              <p className="text-sm text-muted-foreground">
                Court filings, confidential documents, time-sensitive deliveries
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">🏥 Medical Offices</h4>
              <p className="text-sm text-muted-foreground">
                HIPAA compliant, lab results, prescriptions, patient privacy
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">🏠 Real Estate</h4>
              <p className="text-sm text-muted-foreground">
                Contracts, keys, documents, time-sensitive closings
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-semibold mb-2">💼 Small Business</h4>
              <p className="text-sm text-muted-foreground">
                Customer deliveries, supplier pickups, same-day needs
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* FAQ */}
      <Card>
        <CardHeader>
          <CardTitle>Frequently Asked Questions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold mb-1">Can I cancel anytime?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! Cancel anytime with no penalties. Your plan remains active until the end of your billing period.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">What happens if I exceed my delivery limit?</h4>
            <p className="text-sm text-muted-foreground">
              Additional deliveries are charged at $25 each. We'll notify you when you're close to your limit.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Do you serve all of Columbus?</h4>
            <p className="text-sm text-muted-foreground">
              Yes! We cover Columbus metro area and suburbs including Dublin, Westerville, Grove City, and Hilliard.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-1">Is there a contract?</h4>
            <p className="text-sm text-muted-foreground">
              No long-term contracts. Month-to-month billing. Cancel anytime.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
