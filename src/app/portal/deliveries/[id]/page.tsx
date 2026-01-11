'use client'

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
  FileSignature
} from 'lucide-react'

// Demo delivery data
const delivery = {
  id: '1',
  tracking_code: 'DC-ABC12345',
  status: 'delivered',
  pickup_address: 'Downtown Columbus, OH',
  delivery_address: '456 Oak Ave, Westerville, OH 43081',
  delivered_at: 'January 10, 2024 at 2:15 PM',
  proof_photo_url: '/proof-demo.jpg',
  has_signature: true,
  events: [
    { status: 'confirmed', time: 'Jan 10, 10:00 AM', note: 'Order confirmed' },
    { status: 'picked_up', time: 'Jan 10, 10:45 AM', note: 'Package picked up from sender' },
    { status: 'in_transit', time: 'Jan 10, 11:15 AM', note: 'On the way to destination' },
    { status: 'delivered', time: 'Jan 10, 2:15 PM', note: 'Delivered successfully' },
  ]
}

const statusSteps = [
  { status: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { status: 'picked_up', label: 'Picked Up', icon: Package },
  { status: 'in_transit', label: 'In Transit', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: PackageCheck },
]

export default function DeliveryDetailPage() {
  const getCurrentStep = () => {
    return statusSteps.findIndex(s => s.status === delivery.status)
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/portal/deliveries">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{delivery.tracking_code}</h1>
            <Badge variant="success">Delivered</Badge>
          </div>
          <p className="text-slate-400">Delivered on {delivery.delivered_at}</p>
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
