'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { 
  Package, 
  Clock, 
  CheckCircle, 
  MapPin,
  Navigation,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RouteOptimizerSolo } from '@/components/RouteOptimizerSolo'

interface Delivery {
  id: string
  tracking_code: string
  pickup_address: string
  delivery_address: string
  status: string
  scheduled_time: string
  client_name?: string
}

export default function DriverDashboard() {
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(true)
  const [gpsActive, setGpsActive] = useState(false)

  useEffect(() => {
    fetchTodayDeliveries()
    
    // Check online status
    setIsOnline(navigator.onLine)
    window.addEventListener('online', () => setIsOnline(true))
    window.addEventListener('offline', () => setIsOnline(false))
    
    return () => {
      window.removeEventListener('online', () => setIsOnline(true))
      window.removeEventListener('offline', () => setIsOnline(false))
    }
  }, [])

  async function fetchTodayDeliveries() {
    try {
      const res = await fetch('/api/orders?status=pending,confirmed,in_transit&limit=10')
      if (res.ok) {
        const data = await res.json()
        setDeliveries(data.deliveries || [])
      }
    } catch (error) {

    } finally {
      setLoading(false)
    }
  }

  function startGPSTracking() {
    if ('geolocation' in navigator) {
      setGpsActive(true)
      navigator.geolocation.watchPosition(
        (position) => {
          // Send GPS to server
          fetch('/api/gps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              speed: position.coords.speed,
              heading: position.coords.heading
            })
          }).catch(() => { /* GPS update failed */ })
        },
        (error) => {

          setGpsActive(false)
        },
        { enableHighAccuracy: true, maximumAge: 10000 }
      )
    }
  }

  const activeDeliveries = deliveries.filter(d => d.status === 'in_transit')
  const pendingDeliveries = deliveries.filter(d => ['pending', 'confirmed'].includes(d.status))

  return (
    <div className="space-y-4 py-4">
      {/* Status Bar */}
      <div className="flex items-center gap-2 text-sm">
        <span className={`flex items-center gap-1 ${isOnline ? 'text-green-400' : 'text-red-400'}`}>
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-400' : 'bg-red-400'}`} />
          {isOnline ? 'Online' : 'Offline'}
        </span>
        <span className="text-slate-500">|</span>
        <span className={`flex items-center gap-1 ${gpsActive ? 'text-blue-400' : 'text-slate-400'}`}>
          <MapPin size={14} />
          GPS {gpsActive ? 'Active' : 'Off'}
        </span>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-2">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-3 text-center">
            <Package className="mx-auto text-blue-400 mb-1" size={20} />
            <p className="text-2xl font-bold">{activeDeliveries.length}</p>
            <p className="text-xs text-slate-400">Active</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-3 text-center">
            <Clock className="mx-auto text-yellow-400 mb-1" size={20} />
            <p className="text-2xl font-bold">{pendingDeliveries.length}</p>
            <p className="text-xs text-slate-400">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-3 text-center">
            <CheckCircle className="mx-auto text-green-400 mb-1" size={20} />
            <p className="text-2xl font-bold">0</p>
            <p className="text-xs text-slate-400">Today</p>
          </CardContent>
        </Card>
      </div>

      {/* GPS Control */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">GPS Tracking</h3>
              <p className="text-sm text-slate-400">Share location for deliveries</p>
            </div>
            <Button
              onClick={startGPSTracking}
              disabled={gpsActive}
              className={gpsActive ? 'bg-green-600' : 'bg-blue-600'}
            >
              {gpsActive ? 'Tracking...' : 'Start'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Route Optimizer - Solo Driver Columbus */}
      <RouteOptimizerSolo />

      {/* Active Deliveries */}
      <div>
        <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
          <Package size={20} /> Today's Deliveries
        </h2>
        
        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : deliveries.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="p-4 text-center text-slate-400">
              <CheckCircle className="mx-auto mb-2" size={32} />
              <p>No deliveries scheduled</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {deliveries.map((delivery) => (
              <Link key={delivery.id} href={`/driver/deliveries/${delivery.id}`}>
                <Card className="bg-slate-800 border-slate-700 hover:bg-slate-750">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-mono text-sm text-blue-400">{delivery.tracking_code}</p>
                        <p className="text-sm text-slate-300 mt-1 truncate">{delivery.pickup_address}</p>
                        <p className="text-sm text-slate-400">→ {delivery.delivery_address}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs ${
                        delivery.status === 'in_transit' ? 'bg-blue-600' :
                        delivery.status === 'confirmed' ? 'bg-yellow-600' :
                        'bg-slate-600'
                      }`}>
                        {delivery.status.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" className="flex-1 text-xs">
                        <Navigation size={14} className="mr-1" /> Navigate
                      </Button>
                      <Button size="sm" className="flex-1 text-xs bg-green-600">
                        <CheckCircle size={14} className="mr-1" /> Complete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
