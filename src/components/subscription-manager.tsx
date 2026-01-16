'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, CreditCard, Check, X, Crown, Shield, Package, Briefcase } from 'lucide-react'

interface SubscriptionPlan {
  name: string
  description: string
  price: number
  interval: string
  features: string[]
}

interface Subscription {
  id: string
  status: string
  currentPeriodEnd: string
  cancelAtPeriodEnd: boolean
  items: Array<{
    productName: string
    amount: number
    interval: string
  }>
}

const PLAN_ICONS: Record<string, React.ReactNode> = {
  guardian_basic: <Shield className="h-6 w-6" />,
  guardian_premium: <Crown className="h-6 w-6" />,
  vault_storage: <Package className="h-6 w-6" />,
  vault_premium: <Package className="h-6 w-6" />,
  concierge_retainer: <Briefcase className="h-6 w-6" />
}

interface SubscriptionManagerProps {
  customerEmail?: string
  clientId?: string
  onSubscriptionChange?: () => void
}

export function SubscriptionManager({ customerEmail, clientId, onSubscriptionChange }: SubscriptionManagerProps) {
  const [plans, setPlans] = useState<Record<string, SubscriptionPlan>>({})
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [subscribing, setSubscribing] = useState<string | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [customerEmail])

  const loadData = async () => {
    setLoading(true)
    try {
      // Load plans
      const plansRes = await fetch('/api/subscriptions?plans=true')
      const plansData = await plansRes.json()
      setPlans(plansData.plans || {})

      // Load current subscriptions
      if (customerEmail) {
        const subsRes = await fetch(`/api/subscriptions?email=${encodeURIComponent(customerEmail)}`)
        const subsData = await subsRes.json()
        setSubscriptions(subsData.subscriptions || [])
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (planKey: string) => {
    if (!customerEmail) {
      setError('Customer email required')
      return
    }

    setSubscribing(planKey)
    setError('')

    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planKey,
          customerEmail,
          clientId
        })
      })

      const data = await res.json()

      if (data.checkoutUrl) {
        // Redirect to Stripe Checkout
        window.location.href = data.checkoutUrl
      } else if (data.subscriptionId) {
        // Subscription created directly
        await loadData()
        onSubscriptionChange?.()
      } else if (data.error) {
        setError(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubscribing(null)
    }
  }

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription? It will remain active until the end of the billing period.')) {
      return
    }

    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId,
          action: 'cancel'
        })
      })

      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        await loadData()
        onSubscriptionChange?.()
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const handleReactivate = async (subscriptionId: string) => {
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId,
          action: 'reactivate'
        })
      })

      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        await loadData()
        onSubscriptionChange?.()
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const openCustomerPortal = async () => {
    try {
      const res = await fetch('/api/subscriptions/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerEmail })
      })

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else if (data.error) {
        setError(data.error)
      }
    } catch (err: any) {
      setError(err.message)
    }
  }

  const getStatusBadge = (status: string, cancelAtPeriodEnd: boolean) => {
    if (cancelAtPeriodEnd) {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">Canceling</Badge>
    }
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>
      case 'trialing':
        return <Badge className="bg-blue-500">Trial</Badge>
      case 'past_due':
        return <Badge variant="destructive">Past Due</Badge>
      case 'canceled':
        return <Badge variant="secondary">Canceled</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const isSubscribedToPlan = (planKey: string) => {
    return subscriptions.some(sub => 
      sub.status === 'active' && 
      sub.items.some(item => item.productName?.toLowerCase().includes(planKey.replace('_', ' ')))
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center gap-2">
          <X className="h-5 w-5" />
          {error}
        </div>
      )}

      {/* Current Subscriptions */}
      {subscriptions.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Your Subscriptions</h3>
            <Button variant="outline" size="sm" onClick={openCustomerPortal}>
              <CreditCard className="h-4 w-4 mr-2" />
              Manage Billing
            </Button>
          </div>

          {subscriptions.map(sub => (
            <Card key={sub.id} className="border-2">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {sub.items[0]?.productName || 'Subscription'}
                      </span>
                      {getStatusBadge(sub.status, sub.cancelAtPeriodEnd)}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      ${sub.items[0]?.amount || 0}/{sub.items[0]?.interval || 'month'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {sub.cancelAtPeriodEnd 
                        ? `Cancels on ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
                        : `Renews on ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
                      }
                    </p>
                  </div>
                  <div>
                    {sub.cancelAtPeriodEnd ? (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleReactivate(sub.id)}
                      >
                        Reactivate
                      </Button>
                    ) : (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleCancel(sub.id)}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Available Plans */}
      <div>
        <h3 className="text-lg font-semibold mb-4">
          {subscriptions.length > 0 ? 'Upgrade or Add Plans' : 'Choose a Plan'}
        </h3>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(plans).map(([key, plan]) => (
            <Card 
              key={key} 
              className={`relative ${isSubscribedToPlan(key) ? 'border-green-500 border-2' : ''}`}
            >
              {isSubscribedToPlan(key) && (
                <div className="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1">
                  <Check className="h-4 w-4" />
                </div>
              )}
              
              <CardHeader>
                <div className="flex items-center gap-2 text-primary">
                  {PLAN_ICONS[key] || <CreditCard className="h-6 w-6" />}
                  <CardTitle className="text-lg">{plan.name}</CardTitle>
                </div>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="mb-4">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-gray-500">/{plan.interval}</span>
                </div>
                
                <ul className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              
              <CardFooter>
                <Button 
                  className="w-full"
                  disabled={isSubscribedToPlan(key) || subscribing === key}
                  onClick={() => handleSubscribe(key)}
                >
                  {subscribing === key ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : isSubscribedToPlan(key) ? (
                    'Subscribed'
                  ) : (
                    'Subscribe'
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
