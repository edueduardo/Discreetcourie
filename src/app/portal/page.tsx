'use client'

import { useState, useEffect } from 'react'
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
  Loader2,
  AlertCircle
} from 'lucide-react'

interface Delivery {
  id: string
  tracking_code: string
  status: string
  delivery_address: string | null
  estimated_time: string | null
  delivered_at: string | null
  created_at: string
}

const statusColors = {
  pending: 'warning',
  in_transit: 'default',
  delivered: 'success',
} as const

const statusLabels = {
  pending: 'Pending',
  in_transit: 'In Transit',
  delivered: 'Delivered',
}

export default function ClientPortal() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDeliveries() {
      try {
        setLoading(true)
        setError(null)

        const res = await fetch('/api/orders')
        const data = await res.json()

        if (data.error) {
          setError(data.error)
        } else if (data.orders) {
          setDeliveries(data.orders)
        }
      } catch (err) {

        setError('Failed to load deliveries')
      } finally {
        setLoading(false)
      }
    }

    fetchDeliveries()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your deliveries...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Error Loading Deliveries</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Welcome Back</h1>
        <p className="text-slate-400">Track your deliveries and view history</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-blue-600/20 flex items-center justify-center">
                <Truck className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Active Deliveries</p>
                <p className="text-2xl font-bold text-white">
                  {deliveries.filter(d => ['pending', 'confirmed', 'picked_up', 'in_transit'].includes(d.status)).length}
                </p>
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
                <p className="text-2xl font-bold text-white">
                  {deliveries.filter(d => d.status === 'delivered').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center">
                <Package className="h-6 w-6 text-slate-400" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Total Orders</p>
                <p className="text-2xl font-bold text-white">{deliveries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Delivery */}
      {deliveries.filter(d => d.status === 'in_transit').length > 0 && (
        <Card className="bg-gradient-to-r from-blue-600/20 to-blue-700/20 border-blue-600/50">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Active Delivery
            </CardTitle>
          </CardHeader>
          <CardContent>
            {deliveries
              .filter(d => d.status === 'in_transit')
              .map(delivery => (
                <div key={delivery.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-mono font-bold">{delivery.tracking_code}</span>
                      <Badge variant="default">In Transit</Badge>
                    </div>
                    <p className="text-slate-300 flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {delivery.delivery_address}
                    </p>
                    <p className="text-blue-400 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Estimated: {delivery.estimated_time}
                    </p>
                  </div>
                  <Link href={`/portal/deliveries/${delivery.id}`}>
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Track Delivery
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              ))}
          </CardContent>
        </Card>
      )}

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
          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <Link 
                key={delivery.id}
                href={`/portal/deliveries/${delivery.id}`}
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
                  <Badge variant={statusColors[delivery.status as keyof typeof statusColors]}>
                    {statusLabels[delivery.status as keyof typeof statusLabels]}
                  </Badge>
                  {delivery.delivered_at && (
                    <p className="text-slate-500 text-xs mt-1">{delivery.delivered_at}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center">
                <Package className="h-6 w-6 text-slate-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">Need a delivery?</h3>
                <p className="text-slate-400 text-sm">Call us to schedule a pickup</p>
              </div>
              <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                (614) 500-3080
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-slate-700 flex items-center justify-center">
                <FileText className="h-6 w-6 text-slate-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-white font-medium">View Invoices</h3>
                <p className="text-slate-400 text-sm">See your billing history</p>
              </div>
              <Link href="/portal/invoices">
                <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
                  View
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
