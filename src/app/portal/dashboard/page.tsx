'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Package,
  Truck,
  Clock,
  CheckCircle2,
  MapPin,
  ArrowRight,
  FileText,
  Shield,
  CreditCard,
  Lock,
  Bell,
  RefreshCw
} from 'lucide-react'

interface Delivery {
  id: string
  tracking_code: string
  status: string
  delivery_address: string
  estimated_delivery?: string
  delivered_at?: string
}

interface Subscription {
  id: string
  status: string
  planName: string
  amount: number
  currentPeriodEnd: string
}

interface ClientStats {
  activeDeliveries: number
  completedDeliveries: number
  pendingInvoices: number
}

const statusColors: Record<string, 'warning' | 'default' | 'success' | 'destructive'> = {
  pending: 'warning',
  in_transit: 'default',
  delivered: 'success',
  cancelled: 'destructive'
}

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
}

export default function ClientDashboard() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [stats, setStats] = useState<ClientStats>({
    activeDeliveries: 0,
    completedDeliveries: 0,
    pendingInvoices: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      // Fetch deliveries
      const deliveriesRes = await fetch('/api/orders?limit=10')
      if (deliveriesRes.ok) {
        const deliveriesData = await deliveriesRes.json()
        setDeliveries(deliveriesData.slice(0, 5))
        
        const active = deliveriesData.filter((d: Delivery) => 
          ['pending', 'in_transit', 'picked_up'].includes(d.status)
        ).length
        const completed = deliveriesData.filter((d: Delivery) => 
          d.status === 'delivered'
        ).length
        
        setStats(prev => ({ ...prev, activeDeliveries: active, completedDeliveries: completed }))
      }

      // Fetch subscriptions
      const subsRes = await fetch('/api/subscriptions')
      if (subsRes.ok) {
        const subsData = await subsRes.json()
        if (subsData.subscriptions?.length > 0) {
          const activeSub = subsData.subscriptions.find((s: any) => s.status === 'active')
          if (activeSub) {
            setSubscription({
              id: activeSub.id,
              status: activeSub.status,
              planName: activeSub.items?.[0]?.productName || 'Premium',
              amount: activeSub.items?.[0]?.amount || 0,
              currentPeriodEnd: activeSub.currentPeriodEnd
            })
          }
        }
      }

      
    } catch (error) {

    } finally {
      setLoading(false)
    }
  }

  const activeDelivery = deliveries.find(d => ['pending', 'in_transit', 'picked_up'].includes(d.status))

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Client Portal</h1>
          <p className="text-slate-400">Manage your deliveries and services</p>
        </div>
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchData}
          disabled={loading}
          className="border-slate-600"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                <Truck className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Active Deliveries</p>
                <p className="text-2xl font-bold text-white">{stats.activeDeliveries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-green-600/20 flex items-center justify-center">
                <CheckCircle2 className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Completed</p>
                <p className="text-2xl font-bold text-white">{stats.completedDeliveries}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                subscription ? 'bg-green-600/20' : 'bg-slate-700'
              }`}>
                <Shield className={`h-6 w-6 ${subscription ? 'text-green-500' : 'text-slate-400'}`} />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Subscription</p>
                <p className="text-lg font-bold text-white">
                  {subscription ? subscription.planName : 'None'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Delivery */}
      {activeDelivery && (
        <Card className="bg-gradient-to-r from-blue-600/20 to-blue-700/20 border-blue-600/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Active Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-white font-mono font-bold">{activeDelivery.tracking_code}</span>
                  <Badge variant="default">{statusLabels[activeDelivery.status] || activeDelivery.status}</Badge>
                </div>
                <p className="text-slate-300 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {activeDelivery.delivery_address}
                </p>
                {activeDelivery.estimated_delivery && (
                  <p className="text-blue-400 flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    Estimated: {new Date(activeDelivery.estimated_delivery).toLocaleString()}
                  </p>
                )}
              </div>
              <Link href={`/track?code=${activeDelivery.tracking_code}`}>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  Track Delivery
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link href="/portal/subscriptions">
          <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-green-600/20 flex items-center justify-center">
                  <CreditCard className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <h3 className="text-white font-medium">Manage Subscription</h3>
                  <p className="text-slate-400 text-sm">View plans & billing</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/portal/requests">
          <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-purple-600/20 flex items-center justify-center">
                  <FileText className="h-6 w-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-white font-medium">New Request</h3>
                  <p className="text-slate-400 text-sm">Submit delivery request</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Deliveries */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-white">Recent Deliveries</CardTitle>
            <CardDescription className="text-slate-400">Your delivery history</CardDescription>
          </div>
          <Link href="/portal/deliveries">
            <Button variant="ghost" className="text-blue-500 hover:text-blue-400">
              View All
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">Loading...</div>
          ) : deliveries.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No deliveries found</div>
          ) : (
            <div className="space-y-4">
              {deliveries.map((delivery) => (
                <Link 
                  key={delivery.id}
                  href={`/track?code=${delivery.tracking_code}`}
                  className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 hover:bg-slate-900 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <Package className="h-5 w-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{delivery.tracking_code}</p>
                      <p className="text-slate-500 text-sm">{delivery.delivery_address}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant={statusColors[delivery.status] || 'default'}>
                      {statusLabels[delivery.status] || delivery.status}
                    </Badge>
                    {delivery.delivered_at && (
                      <p className="text-slate-500 text-xs mt-1">
                        {new Date(delivery.delivered_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Subscription Status */}
      {subscription && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Your Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">{subscription.planName}</p>
                <p className="text-slate-400">
                  ${subscription.amount}/month • Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </div>
              <Link href="/portal/subscriptions">
                <Button variant="outline" className="border-slate-600">
                  Manage
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
