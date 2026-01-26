'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Navigation,
  MapPin,
  Truck,
  Clock,
  RefreshCw,
  Maximize2,
  Loader2,
  Phone,
  Package
} from 'lucide-react'

interface GPSLocation {
  latitude: number
  longitude: number
  speed?: number
  heading?: number
  accuracy?: number
  created_at: string
}

interface DeliveryInfo {
  id: string
  tracking_code: string
  status: string
  pickup_address: string
  delivery_address: string
  recipient_phone?: string
  eta?: string
}

interface GPSMapProps {
  deliveryId?: string
  trackingCode?: string
  showControls?: boolean
  height?: string
  autoRefresh?: boolean
  refreshInterval?: number
}

export function GPSMap({
  deliveryId,
  trackingCode,
  showControls = true,
  height = '400px',
  autoRefresh = true,
  refreshInterval = 10000 // 10 seconds
}: GPSMapProps) {
  const [location, setLocation] = useState<GPSLocation | null>(null)
  const [history, setHistory] = useState<GPSLocation[]>([])
  const [delivery, setDelivery] = useState<DeliveryInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const pathRef = useRef<any>(null)

  // Fetch GPS data
  const fetchGPSData = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (trackingCode) params.append('tracking_code', trackingCode)
      if (deliveryId) params.append('delivery_id', deliveryId)
      params.append('history', 'true')

      const response = await fetch(`/api/gps?${params.toString()}`)
      const data = await response.json()

      if (data.error) {
        if (data.privacy_restricted) {
          setError('GPS tracking is not available for this delivery due to privacy settings.')
        } else {
          setError(data.error)
        }
        return
      }

      if (data.location) {
        setLocation(data.location)
        setIsLive(isOnline(data.location.created_at))
        setLastUpdate(new Date())
      }

      if (data.points) {
        setHistory(data.points)
      }

      setError(null)
    } catch (err) {
      console.error('Failed to fetch GPS data:', err)
      setError('Failed to load GPS data')
    }
  }, [trackingCode, deliveryId])

  // Fetch delivery info
  const fetchDeliveryInfo = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (trackingCode) params.append('code', trackingCode)
      if (deliveryId) params.append('delivery_id', deliveryId)

      const response = await fetch(`/api/tracking?${params.toString()}`)
      const data = await response.json()

      if (data.delivery) {
        setDelivery(data.delivery)
      }
    } catch (err) {
      console.error('Failed to fetch delivery info:', err)
    }
  }, [trackingCode, deliveryId])

  // Check if location is recent (within 2 minutes)
  const isOnline = (timestamp: string): boolean => {
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000
    return new Date(timestamp).getTime() > twoMinutesAgo
  }

  // Initialize map
  useEffect(() => {
    // Dynamic import of Leaflet for SSR compatibility
    const initMap = async () => {
      if (!mapRef.current || mapInstanceRef.current) return

      // Check if Leaflet is already loaded
      if (typeof window !== 'undefined' && !window.L) {
        // Load Leaflet CSS
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
        document.head.appendChild(link)

        // Load Leaflet JS
        const script = document.createElement('script')
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
        script.async = true
        await new Promise((resolve) => {
          script.onload = resolve
          document.head.appendChild(script)
        })
      }

      // Wait for Leaflet to be available
      while (!window.L) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      const L = window.L

      // Columbus, Ohio center coordinates
      const defaultCenter: [number, number] = [39.9612, -82.9988]

      // Initialize map
      const map = L.map(mapRef.current, {
        center: defaultCenter,
        zoom: 13,
        zoomControl: showControls
      })

      // Add tile layer (OpenStreetMap - free)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      }).addTo(map)

      mapInstanceRef.current = map
      setLoading(false)
    }

    initMap()

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [showControls])

  // Update map with location data
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return

    const L = window.L
    const map = mapInstanceRef.current

    // Update marker
    if (location) {
      const latlng: [number, number] = [location.latitude, location.longitude]

      // Custom truck icon
      const truckIcon = L.divIcon({
        className: 'custom-truck-icon',
        html: `
          <div style="
            background: ${isLive ? '#22c55e' : '#6b7280'};
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
            border: 3px solid white;
            transform: rotate(${location.heading || 0}deg);
          ">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="m12 2 9 6-9 6-9-6 9-6Z" />
              <path d="m3 12 9 6 9-6" />
            </svg>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20]
      })

      if (markerRef.current) {
        markerRef.current.setLatLng(latlng)
        markerRef.current.setIcon(truckIcon)
      } else {
        markerRef.current = L.marker(latlng, { icon: truckIcon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width: 200px;">
              <strong>${delivery?.tracking_code || 'Delivery'}</strong><br/>
              Speed: ${location.speed ? `${location.speed.toFixed(1)} km/h` : 'N/A'}<br/>
              Accuracy: ${location.accuracy ? `${location.accuracy.toFixed(0)}m` : 'N/A'}<br/>
              Last update: ${new Date(location.created_at).toLocaleTimeString()}
            </div>
          `)
      }

      // Center map on location
      map.setView(latlng, map.getZoom())
    }

    // Draw path from history
    if (history.length > 1) {
      const pathCoords = history.map(h => [h.latitude, h.longitude] as [number, number])

      if (pathRef.current) {
        pathRef.current.setLatLngs(pathCoords)
      } else {
        pathRef.current = L.polyline(pathCoords, {
          color: '#3b82f6',
          weight: 4,
          opacity: 0.7,
          smoothFactor: 1
        }).addTo(map)
      }

      // Fit map to show entire path
      if (pathCoords.length > 0) {
        const bounds = L.latLngBounds(pathCoords)
        map.fitBounds(bounds, { padding: [50, 50] })
      }
    }
  }, [location, history, isLive, delivery?.tracking_code])

  // Initial fetch
  useEffect(() => {
    fetchGPSData()
    fetchDeliveryInfo()
  }, [fetchGPSData, fetchDeliveryInfo])

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      fetchGPSData()
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, fetchGPSData])

  const handleRefresh = () => {
    fetchGPSData()
    fetchDeliveryInfo()
  }

  const handleCenter = () => {
    if (location && mapInstanceRef.current) {
      mapInstanceRef.current.setView([location.latitude, location.longitude], 15)
    }
  }

  const formatSpeed = (speed?: number) => {
    if (!speed) return 'N/A'
    return `${speed.toFixed(1)} km/h`
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Live GPS Tracking
            </CardTitle>
            <CardDescription className="text-slate-400">
              {delivery?.tracking_code || trackingCode || 'Real-time location'}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isLive ? 'default' : 'secondary'} className={isLive ? 'bg-green-600' : ''}>
              {isLive ? 'LIVE' : 'OFFLINE'}
            </Badge>
            {showControls && (
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" onClick={handleRefresh}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={handleCenter}>
                  <Maximize2 className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Map Container */}
        <div
          ref={mapRef}
          style={{ height, width: '100%' }}
          className="rounded-b-lg overflow-hidden relative"
        >
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            </div>
          )}
          {error && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80 z-10">
              <div className="text-center text-slate-400">
                <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Info Bar */}
        {location && showControls && (
          <div className="p-4 border-t border-slate-700 bg-slate-900/50">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* Speed */}
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-blue-600/20 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Speed</p>
                  <p className="text-sm font-medium text-white">{formatSpeed(location.speed)}</p>
                </div>
              </div>

              {/* Last Update */}
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-green-600/20 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Last Update</p>
                  <p className="text-sm font-medium text-white">{formatTime(location.created_at)}</p>
                </div>
              </div>

              {/* Coordinates */}
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-purple-600/20 flex items-center justify-center">
                  <MapPin className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Coordinates</p>
                  <p className="text-sm font-medium text-white">
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </p>
                </div>
              </div>

              {/* ETA */}
              {delivery?.eta && (
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-yellow-600/20 flex items-center justify-center">
                    <Package className="h-4 w-4 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">ETA</p>
                    <p className="text-sm font-medium text-white">{delivery.eta}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Add Leaflet type declaration
declare global {
  interface Window {
    L: any
  }
}
