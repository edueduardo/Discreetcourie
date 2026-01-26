'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  MapPin, Navigation, Battery, Clock, RefreshCw,
  Truck, Loader2, Signal, AlertCircle, Search, Map
} from 'lucide-react'
import { GPSMap } from '@/components/tracking'

interface GPSLocation {
  id: string
  driver_id?: string
  delivery_id?: string
  latitude: number
  longitude: number
  speed: number
  heading: number
  battery_level: number
  is_moving: boolean
  last_update?: string
  recorded_at?: string
}

interface Delivery {
  id: string
  tracking_code: string
  status: string
  current_latitude?: number
  current_longitude?: number
  last_location_update?: string
  pickup_address: string
  delivery_address: string
}

export default function TrackingPage() {
  const [drivers, setDrivers] = useState<GPSLocation[]>([])
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [loading, setLoading] = useState(true)
  const [trackingCode, setTrackingCode] = useState('')
  const [trackedDelivery, setTrackedDelivery] = useState<{ location: GPSLocation | null; is_live: boolean } | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      const [driversRes, deliveriesRes] = await Promise.all([
        fetch('/api/gps'),
        fetch('/api/orders?status=in_transit')
      ])
      
      const driversData = await driversRes.json()
      const deliveriesData = await deliveriesRes.json()
      
      setDrivers(driversData.online_drivers || [])
      setDeliveries(deliveriesData.deliveries || [])
      setLastUpdate(new Date())
    } catch (error) {

    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    
    // Auto-refresh a cada 10 segundos
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchData, 10000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, fetchData])

  async function trackDelivery() {
    if (!trackingCode) return
    
    try {
      const res = await fetch(`/api/gps?tracking_code=${trackingCode}`)
      const data = await res.json()
      
      if (res.ok) {
        setTrackedDelivery(data)
      } else {
        setTrackedDelivery({ location: null, is_live: false })
      }
    } catch (error) {

    }
  }

  function formatSpeed(speed: number): string {
    return `${Math.round(speed)} km/h`
  }

  function formatHeading(heading: number): string {
    const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
    const index = Math.round(heading / 45) % 8
    return directions[index]
  }

  function getTimeSince(date: string): string {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    return `${Math.floor(seconds / 3600)}h ago`
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <MapPin className="h-8 w-8 text-green-500" />
            GPS Real-Time Tracking
          </h1>
          <p className="text-gray-500">
            Live location tracking for deliveries
            {lastUpdate && <span className="ml-2 text-xs">· Updated {getTimeSince(lastUpdate.toISOString())}</span>}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Button 
            variant={autoRefresh ? "default" : "outline"} 
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            <Signal className={`h-4 w-4 mr-2 ${autoRefresh ? 'animate-pulse' : ''}`} />
            {autoRefresh ? 'Live' : 'Paused'}
          </Button>
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4 mr-2" />Refresh
          </Button>
        </div>
      </div>

      {/* Search by tracking code */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-2">
            <Input 
              placeholder="Enter tracking code (e.g., DC-ABC123)" 
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && trackDelivery()}
            />
            <Button onClick={trackDelivery}>
              <Search className="h-4 w-4 mr-2" />Track
            </Button>
          </div>
          
          {trackedDelivery && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              {trackedDelivery.location ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge className={trackedDelivery.is_live ? 'bg-green-600' : 'bg-gray-500'}>
                      {trackedDelivery.is_live ? '🟢 LIVE' : '⚫ Offline'}
                    </Badge>
                    <span className="font-bold">{trackingCode}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Latitude:</span> {trackedDelivery.location.latitude}
                    </div>
                    <div>
                      <span className="text-gray-500">Longitude:</span> {trackedDelivery.location.longitude}
                    </div>
                    <div>
                      <span className="text-gray-500">Speed:</span> {formatSpeed(trackedDelivery.location.speed)}
                    </div>
                    <div>
                      <span className="text-gray-500">Heading:</span> {formatHeading(trackedDelivery.location.heading)}
                    </div>
                  </div>
                  <a 
                    href={`https://www.google.com/maps?q=${trackedDelivery.location.latitude},${trackedDelivery.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 text-sm hover:underline"
                  >
                    📍 View on Google Maps
                  </a>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-gray-500">
                  <AlertCircle className="h-4 w-4" />
                  No GPS data available for this delivery
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* GPS Map - Full View */}
      {trackedDelivery?.location && (
        <GPSMap
          trackingCode={trackingCode}
          showControls={true}
          height="400px"
          autoRefresh={true}
          refreshInterval={10000}
        />
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{drivers.length}</p>
                <p className="text-sm text-gray-500">Drivers Online</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Navigation className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-2xl font-bold">{deliveries.length}</p>
                <p className="text-sm text-gray-500">Active Deliveries</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <Signal className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-2xl font-bold">{drivers.filter(d => d.is_moving).length}</p>
                <p className="text-sm text-gray-500">In Motion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Online Drivers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Online Drivers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {drivers.map(driver => (
              <Card key={driver.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge className={driver.is_moving ? 'bg-green-600' : 'bg-yellow-600'}>
                        {driver.is_moving ? 'Moving' : 'Stopped'}
                      </Badge>
                      <span className="font-mono text-sm">
                        {driver.latitude.toFixed(6)}, {driver.longitude.toFixed(6)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span><Navigation className="h-3 w-3 inline mr-1" />{formatSpeed(driver.speed)}</span>
                      <span>{formatHeading(driver.heading)}</span>
                      <span><Battery className="h-3 w-3 inline mr-1" />{driver.battery_level}%</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-500">
                      <Clock className="h-3 w-3 inline mr-1" />
                      {driver.last_update ? getTimeSince(driver.last_update) : 'N/A'}
                    </div>
                    <a 
                      href={`https://www.google.com/maps?q=${driver.latitude},${driver.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 text-xs hover:underline"
                    >
                      View Map
                    </a>
                  </div>
                </div>
              </Card>
            ))}
            {drivers.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No drivers online. GPS updates will appear here when drivers are active.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Active Deliveries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Active Deliveries with GPS
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deliveries.filter(d => d.current_latitude).map(delivery => (
              <Card key={delivery.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge>{delivery.tracking_code}</Badge>
                      <Badge variant="outline">{delivery.status}</Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {delivery.pickup_address} → {delivery.delivery_address}
                    </p>
                  </div>
                  <div className="text-right">
                    {delivery.current_latitude && delivery.current_longitude && (
                      <>
                        <p className="font-mono text-xs">
                          {delivery.current_latitude}, {delivery.current_longitude}
                        </p>
                        <a 
                          href={`https://www.google.com/maps?q=${delivery.current_latitude},${delivery.current_longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 text-xs hover:underline"
                        >
                          View on Map
                        </a>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            ))}
            {deliveries.filter(d => d.current_latitude).length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No active deliveries with GPS data.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
