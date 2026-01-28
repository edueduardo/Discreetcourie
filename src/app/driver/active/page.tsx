'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { MapPin, Navigation, CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ActiveDelivery {
  id: string
  tracking_code: string
  pickup_address: string
  delivery_address: string
  status: string
  notes: string | null
}

export default function DriverActivePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [deliveries, setDeliveries] = useState<ActiveDelivery[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)
  const [gpsEnabled, setGpsEnabled] = useState(false)
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    fetchActiveDeliveries()
    
    // Request GPS permission
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setGpsEnabled(true)
        },
        (error) => {
          console.error('GPS error:', error)
          toast.error('GPS not available. Enable location services.')
        }
      )
    }
  }, [])

  const fetchActiveDeliveries = async () => {
    try {
      const res = await fetch('/api/deliveries/list?status=in_transit,picked_up,confirmed')
      const data = await res.json()
      
      if (data.deliveries) {
        setDeliveries(data.deliveries)
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error)
      toast.error('Failed to load deliveries')
    } finally {
      setLoading(false)
    }
  }

  const updateStatus = async (deliveryId: string, newStatus: string, notes?: string) => {
    setUpdating(deliveryId)
    
    try {
      const res = await fetch('/api/deliveries/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_id: deliveryId,
          status: newStatus,
          notes
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update status')
      }

      toast.success(`Status updated to ${newStatus}`)
      fetchActiveDeliveries()
    } catch (error: any) {
      toast.error(error.message || 'Failed to update status')
    } finally {
      setUpdating(null)
    }
  }

  const updateGPS = async (deliveryId: string) => {
    if (!currentLocation) {
      toast.error('GPS location not available')
      return
    }

    try {
      const res = await fetch('/api/tracking/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          delivery_id: deliveryId,
          latitude: currentLocation.lat,
          longitude: currentLocation.lng
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to update GPS')
      }

      toast.success('Location updated')
    } catch (error: any) {
      toast.error(error.message || 'Failed to update location')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Active Deliveries</h1>
          <div className="flex items-center gap-2">
            {gpsEnabled ? (
              <Badge variant="default" className="bg-green-600">
                <Navigation className="h-3 w-3 mr-1" />
                GPS Active
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertCircle className="h-3 w-3 mr-1" />
                GPS Disabled
              </Badge>
            )}
            <span className="text-slate-400 text-sm">
              {deliveries.length} active {deliveries.length === 1 ? 'delivery' : 'deliveries'}
            </span>
          </div>
        </div>

        {deliveries.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="h-16 w-16 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400 text-lg">No active deliveries</p>
              <p className="text-slate-500 text-sm mt-2">All caught up!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {deliveries.map((delivery) => (
              <Card key={delivery.id} className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white text-lg">
                        {delivery.tracking_code}
                      </CardTitle>
                      <Badge variant="default" className="mt-2">
                        {delivery.status}
                      </Badge>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateGPS(delivery.id)}
                      disabled={!gpsEnabled}
                      className="border-slate-600"
                    >
                      <MapPin className="h-4 w-4 mr-1" />
                      Update GPS
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-green-500 mt-1" />
                      <div>
                        <p className="text-xs text-slate-500">Pickup</p>
                        <p className="text-white text-sm">{delivery.pickup_address}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-blue-500 mt-1" />
                      <div>
                        <p className="text-xs text-slate-500">Delivery</p>
                        <p className="text-white text-sm">{delivery.delivery_address}</p>
                      </div>
                    </div>
                  </div>

                  {delivery.notes && (
                    <div className="p-3 bg-slate-900 rounded-lg">
                      <p className="text-xs text-slate-500 mb-1">Notes</p>
                      <p className="text-white text-sm">{delivery.notes}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Select
                      onValueChange={(value) => updateStatus(delivery.id, value)}
                      disabled={updating === delivery.id}
                    >
                      <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                        <SelectValue placeholder="Update Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="confirmed">Confirmed</SelectItem>
                        <SelectItem value="picked_up">Picked Up</SelectItem>
                        <SelectItem value="in_transit">In Transit</SelectItem>
                        <SelectItem value="delivered">Delivered</SelectItem>
                      </SelectContent>
                    </Select>

                    {updating === delivery.id && (
                      <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
