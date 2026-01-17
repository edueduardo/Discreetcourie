'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  Camera,
  FileSignature,
  Loader2,
  AlertCircle
} from 'lucide-react'

interface DeliveryEvent {
  status: string
  time: string
  note: string
}

interface DeliveryData {
  id: string
  tracking_code: string
  status: string
  pickup_address: string
  delivery_address: string
  delivered_at?: string
  proof_photo_url?: string
  has_signature?: boolean
  events: DeliveryEvent[]
}

const statusSteps = [
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { status: 'picked_up', label: 'Picked Up', icon: Package },
  { status: 'in_transit', label: 'In Transit', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: PackageCheck },
]

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  picked_up: 'Picked Up',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  failed: 'Failed',
  cancelled: 'Cancelled',
}

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'warning' | 'success'> = {
  pending: 'warning',
  confirmed: 'secondary',
  picked_up: 'default',
  in_transit: 'default',
  delivered: 'success',
  failed: 'destructive',
  cancelled: 'destructive',
}

export default function DeliveryDetailPage() {
  const params = useParams()
  const deliveryId = params.id as string
  
  const [delivery, setDelivery] = useState<DeliveryData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const res = await fetch(`/api/orders/${deliveryId}`)
        if (!res.ok) throw new Error('Delivery not found')
        const data = await res.json()
        
        const formattedDelivery: DeliveryData = {
          id: data.id,
          tracking_code: data.tracking_code,
          status: data.status,
          pickup_address: data.pickup_address || 'N/A',
          delivery_address: data.delivery_address || 'N/A',
          delivered_at: data.delivered_at ? new Date(data.delivered_at).toLocaleString() : undefined,
          proof_photo_url: data.proof_photo_url,
          has_signature: data.has_signature,
          events: data.events || []
        }
        setDelivery(formattedDelivery)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load delivery')
      } finally {
        setLoading(false)
      }
    }
    
    if (deliveryId) fetchDelivery()
  }, [deliveryId])

  const getCurrentStep = () => {
    if (!delivery) return -1
    return statusSteps.findIndex(s => s.status === delivery.status)
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 text-blue-500 mx-auto mb-4 animate-spin" />
          <p className="text-slate-400">Loading delivery details...</p>
        </div>
      </div>
    )
  }

  if (error || !delivery) {
    return (
      <div className="p-6">
        <Card className="bg-red-900/20 border-red-700">
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-4" />
            <h2 className="text-white font-semibold mb-2">Delivery Not Found</h2>
            <p className="text-red-400 mb-4">{error || 'Could not load delivery details'}</p>
            <Link href="/portal">
              <Button variant="outline" className="border-slate-600">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Portal
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/portal">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{delivery.tracking_code}</h1>
            <Badge variant={statusVariants[delivery.status] || 'default'}>
              {statusLabels[delivery.status] || delivery.status}
            </Badge>
          </div>
          {delivery.delivered_at && (
            <p className="text-slate-400">Delivered on {delivery.delivered_at}</p>
          )}
        </div>
      </div>

      {/* Progress */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Delivery Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="flex justify-between">
              {statusSteps.map((step, index) => {
                const isCompleted = index <= getCurrentStep()
                const isCurrent = index === getCurrentStep()
                const Icon = step.icon
                
                return (
                  <div key={step.status} className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-600 text-white'
                          : 'bg-slate-700 text-slate-500'
                      } ${isCurrent ? 'ring-4 ring-green-600/30' : ''}`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className={`mt-2 text-sm text-center ${
                      isCompleted ? 'text-white' : 'text-slate-500'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                )
              })}
            </div>
            {/* Progress Line */}
            <div className="absolute top-6 left-0 right-0 h-0.5 bg-slate-700 -z-10 mx-16">
              <div
                className="h-full bg-green-600 transition-all"
                style={{ width: `${(getCurrentStep() / (statusSteps.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Locations */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Delivery Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-green-600/20 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-green-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Pickup Location</p>
                <p className="text-white">{delivery.pickup_address}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center shrink-0">
                <MapPin className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Delivery Location</p>
                <p className="text-white">{delivery.delivery_address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Proof of Delivery */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Proof of Delivery</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Camera className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Photo Proof</p>
                  <Button variant="link" className="text-blue-500 text-sm p-0 h-auto">
                    View Photo
                  </Button>
                </div>
              </div>
              <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <FileSignature className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Signature</p>
                  {delivery.has_signature ? (
                    <Button variant="link" className="text-blue-500 text-sm p-0 h-auto">
                      View Signature
                    </Button>
                  ) : (
                    <span className="text-slate-600 text-sm">N/A</span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Tracking History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {delivery.events.map((event, index) => (
              <div key={index} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-3 h-3 rounded-full ${
                    index === delivery.events.length - 1 ? 'bg-green-500' : 'bg-blue-600'
                  }`} />
                  {index < delivery.events.length - 1 && (
                    <div className="w-0.5 flex-1 bg-slate-700 my-1" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-white font-medium">{event.note}</p>
                  <p className="text-slate-500 text-sm flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {event.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-4">
        <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
          Download Receipt
        </Button>
        <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
          Contact Support
        </Button>
      </div>
    </div>
  )
}
