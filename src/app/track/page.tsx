'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Package, ArrowLeft, MapPin, Clock, CheckCircle2, Truck, PackageCheck, Loader2 } from 'lucide-react'

const statusSteps = [
  { status: 'confirmed', label: 'Order Confirmed', icon: CheckCircle2 },
  { status: 'picked_up', label: 'Picked Up', icon: Package },
  { status: 'in_transit', label: 'In Transit', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: PackageCheck },
]

interface TrackingEvent {
  status: string
  time: string
  note: string
}

interface DeliveryData {
  tracking_code: string
  status: string
  pickup_address: string
  delivery_address: string
  created_at: string
  estimated_delivery?: string
  events: TrackingEvent[]
}

export default function TrackPage() {
  const [trackingCode, setTrackingCode] = useState('')
  const [delivery, setDelivery] = useState<DeliveryData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trackingCode.trim()) {
      setError('Please enter a tracking code')
      return
    }
    
    setIsLoading(true)
    setError('')
    
    try {
      const res = await fetch(`/api/tracking?code=${encodeURIComponent(trackingCode.trim())}`)
      const data = await res.json()
      
      if (!res.ok || !data.delivery) {
        setError(data.error || 'Delivery not found. Please check your tracking code.')
        setDelivery(null)
      } else {
        setDelivery(data.delivery)
      }
    } catch (err) {
      setError('Failed to track delivery. Please try again.')
      setDelivery(null)
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentStep = () => {
    return statusSteps.findIndex(s => s.status === delivery?.status)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800">
      {/* Header */}
      <header className="border-b border-slate-700">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2 text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Link>
          <Link href="/login">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Sign In
            </Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        {/* Search Card */}
        <Card className="max-w-2xl mx-auto bg-slate-800 border-slate-700 mb-8">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <MapPin className="h-12 w-12 text-blue-500" />
            </div>
            <CardTitle className="text-2xl text-white">Track Your Delivery</CardTitle>
            <CardDescription className="text-slate-400">
              Enter your tracking code to see the status of your delivery
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTrack} className="flex gap-4">
              <Input
                placeholder="Enter tracking code (e.g., DC-ABC12345)"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
              />
              <Button 
                type="submit" 
                className="bg-blue-600 hover:bg-blue-700 px-8"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Tracking...
                  </>
                ) : 'Track'}
              </Button>
            </form>
            {error && (
              <p className="mt-4 text-red-400 text-center">{error}</p>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {delivery && (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Status Overview */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Package className="h-5 w-5 text-blue-500" />
                      {delivery.tracking_code}
                    </CardTitle>
                    <CardDescription className="text-slate-400 mt-1">
                      Estimated delivery: Today by 2:00 PM
                    </CardDescription>
                  </div>
                  <Badge variant="warning" className="text-sm">
                    In Transit
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {/* Progress Steps */}
                <div className="relative">
                  <div className="flex justify-between">
                    {statusSteps.map((step, index) => {
                      const isCompleted = index <= getCurrentStep()
                      const isCurrent = index === getCurrentStep()
                      const Icon = step.icon
                      
                      return (
                        <div key={step.status} className="flex flex-col items-center flex-1">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isCompleted
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-700 text-slate-500'
                            } ${isCurrent ? 'ring-4 ring-blue-600/30' : ''}`}
                          >
                            <Icon className="h-5 w-5" />
                          </div>
                          <span className={`mt-2 text-xs text-center ${
                            isCompleted ? 'text-white' : 'text-slate-500'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                  {/* Progress Line */}
                  <div className="absolute top-5 left-0 right-0 h-0.5 bg-slate-700 -z-10 mx-12">
                    <div
                      className="h-full bg-blue-600 transition-all"
                      style={{ width: `${(getCurrentStep() / (statusSteps.length - 1)) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Delivery Details */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Delivery Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-500 text-sm">From</p>
                    <p className="text-white">{delivery.pickup_address}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-sm">To</p>
                    <p className="text-white">{delivery.delivery_address}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Tracking History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {delivery.events.map((event, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className="w-3 h-3 rounded-full bg-blue-600" />
                        {index < delivery.events.length - 1 && (
                          <div className="w-0.5 h-full bg-slate-700 my-1" />
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
          </div>
        )}
      </div>
    </div>
  )
}
