'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Check, CreditCard, ExternalLink, Loader2 } from 'lucide-react'

interface Plan {
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

export default function PortalSubscriptions() {
  const [plans, setPlans] = useState<Record<string, Plan>>({})
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const res = await fetch('/api/subscriptions?plans=true')
      const data = await res.json()
      setPlans(data.plans || {})
      if (data.subscriptions?.length > 0) {
        const activeSub = data.subscriptions.find((s: Subscription) => 
          s.status === 'active' || s.status === 'trialing'
        )
        setSubscription(activeSub || null)
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubscribe(planKey: string) {
    setActionLoading(planKey)
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planKey,
          customerEmail: 'client@example.com' // In real app, get from auth
        })
      })
      const data = await res.json()
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else if (data.subscriptionId) {
        await fetchData()
      }
    } catch (error) {
      console.error('Subscribe error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleManageBilling() {
    setActionLoading('portal')
    try {
      const res = await fetch('/api/subscriptions/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: 'client@example.com' // In real app, get from auth
        })
      })
      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch (error) {
      console.error('Portal error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleCancelSubscription() {
    if (!subscription) return
    if (!confirm('Are you sure you want to cancel your subscription?')) return

    setActionLoading('cancel')
    try {
      await fetch('/api/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscriptionId: subscription.id,
          action: 'cancel'
        })
      })
      await fetchData()
    } catch (error) {
      console.error('Cancel error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Subscription Plans</h1>
        <p className="text-slate-400">Choose the plan that works for you</p>
      </div>

      {/* Current Subscription */}
      {subscription && (
        <Card className="bg-gradient-to-r from-green-600/20 to-green-700/20 border-green-600/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <p className="text-white font-medium text-lg">
                  {subscription.items?.[0]?.productName || 'Premium Plan'}
                </p>
                <p className="text-slate-300">
                  ${subscription.items?.[0]?.amount || 0}/{subscription.items?.[0]?.interval || 'month'}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  {subscription.cancelAtPeriodEnd 
                    ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                  }
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="border-slate-600"
                  onClick={handleManageBilling}
                  disabled={actionLoading === 'portal'}
                >
                  {actionLoading === 'portal' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Manage Billing
                </Button>
                {!subscription.cancelAtPeriodEnd && (
                  <Button 
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    disabled={actionLoading === 'cancel'}
                  >
                    {actionLoading === 'cancel' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(plans).map(([key, plan]) => {
          const isCurrentPlan = subscription?.items?.[0]?.productName === plan.name
          
          return (
            <Card 
              key={key} 
              className={`bg-slate-800 border-slate-700 ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white">{plan.name}</CardTitle>
                    <CardDescription className="text-slate-400">{plan.description}</CardDescription>
                  </div>
                  {isCurrentPlan && (
                    <Badge variant="success" className="bg-green-600">Current</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="text-3xl font-bold text-white">${plan.price}</span>
                  <span className="text-slate-400">/{plan.interval}</span>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-slate-300 text-sm">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Button 
                  className="w-full"
                  variant={isCurrentPlan ? 'outline' : 'default'}
                  disabled={isCurrentPlan || actionLoading === key}
                  onClick={() => handleSubscribe(key)}
                >
                  {actionLoading === key && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isCurrentPlan ? 'Current Plan' : 'Subscribe'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* No plans message */}
      {Object.keys(plans).length === 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-12 text-center">
            <p className="text-slate-400">No subscription plans available at this time.</p>
            <p className="text-slate-500 text-sm mt-2">Please contact support for more information.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
