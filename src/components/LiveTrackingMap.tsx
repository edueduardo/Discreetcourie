'use client'

import { useEffect, useState, useCallback } from 'react'
import { MapPin, Navigation, Clock, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface LocationData {
  latitude: number
  longitude: number
  updatedAt: string
  speed?: number
  heading?: number
}

interface LiveTrackingMapProps {
  trackingCode: string
  deliveryId?: string
  pickupAddress?: string
  deliveryAddress?: string
  onLocationUpdate?: (location: LocationData | null) => void
}

export default function LiveTrackingMap({
  trackingCode,
  deliveryId,
  pickupAddress,
  deliveryAddress,
  onLocationUpdate
}: LiveTrackingMapProps) {
  const [location, setLocation] = useState<LocationData | null>(null)
  const [isLive, setIsLive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [privacyRestricted, setPrivacyRestricted] = useState(false)
  const [isPolling, setIsPolling] = useState(true)

  const fetchLocation = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (trackingCode) params.set('tracking_code', trackingCode)
      if (deliveryId) params.set('delivery_id', deliveryId)

      const res = await fetch(`/api/gps?${params.toString()}`)
      const data = await res.json()

      if (data.privacy_restricted) {
        setPrivacyRestricted(true)
        setError('GPS tracking disabled for privacy')
        return
      }

      if (data.location) {
        const loc: LocationData = {
          latitude: data.location.latitude,
          longitude: data.location.longitude,
          updatedAt: data.location.recorded_at || data.location.last_update,
          speed: data.location.speed,
          heading: data.location.heading
        }
        setLocation(loc)
        setIsLive(data.is_live || isRecent(loc.updatedAt))
        setLastUpdate(new Date())
        setError(null)
        onLocationUpdate?.(loc)
      } else {
        setLocation(null)
        setIsLive(false)
        onLocationUpdate?.(null)
      }
    } catch (err) {
      console.error('Failed to fetch location:', err)
      setError('Failed to fetch location')
    }
  }, [trackingCode, deliveryId, onLocationUpdate])

  useEffect(() => {
    fetchLocation()

    // Poll every 10 seconds for real-time updates
    let interval: NodeJS.Timeout | null = null
    if (isPolling) {
      interval = setInterval(fetchLocation, 10000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [fetchLocation, isPolling])

  function isRecent(timestamp: string): boolean {
    const twoMinutesAgo = Date.now() - 2 * 60 * 1000
    return new Date(timestamp).getTime() > twoMinutesAgo
  }

  function openInGoogleMaps() {
    if (location) {
      const url = `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
      window.open(url, '_blank')
    }
  }

  function getDirections() {
    if (location && deliveryAddress) {
      const origin = `${location.latitude},${location.longitude}`
      const dest = encodeURIComponent(deliveryAddress)
      const url = `https://www.google.com/maps/dir/${origin}/${dest}`
      window.open(url, '_blank')
    }
  }

  if (privacyRestricted) {
    return (
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6 text-center">
          <EyeOff className="mx-auto text-slate-500 mb-3" size={48} />
          <p className="text-slate-400">GPS tracking is disabled for this delivery</p>
          <p className="text-xs text-slate-500 mt-2">Privacy settings prevent location sharing</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <MapPin className={`${isLive ? 'text-green-400' : 'text-slate-400'}`} size={20} />
            <span className="font-medium text-white">Live Location</span>
            {isLive && (
              <span className="flex items-center gap-1 text-xs text-green-400">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                LIVE
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setIsPolling(!isPolling)}
              className="text-slate-400 hover:text-white"
            >
              {isPolling ? <Eye size={16} /> : <EyeOff size={16} />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={fetchLocation}
              className="text-slate-400 hover:text-white"
            >
              <RefreshCw size={16} />
            </Button>
          </div>
        </div>

        {error && !location && (
          <div className="text-center py-8 text-slate-400">
            <MapPin className="mx-auto mb-2 opacity-50" size={32} />
            <p>{error}</p>
          </div>
        )}

        {location ? (
          <>
            {/* Map Embed */}
            <div className="relative rounded-lg overflow-hidden mb-4 bg-slate-900">
              <iframe
                width="100%"
                height="250"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY || 'AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8'}&q=${location.latitude},${location.longitude}&zoom=15`}
              />
              {/* Live indicator overlay */}
              {isLive && (
                <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  Tracking Live
                </div>
              )}
            </div>

            {/* Location Details */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-slate-700/50 p-3 rounded">
                <p className="text-slate-400 text-xs">Coordinates</p>
                <p className="font-mono text-white">
                  {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
                </p>
              </div>
              <div className="bg-slate-700/50 p-3 rounded">
                <p className="text-slate-400 text-xs">Speed</p>
                <p className="text-white">
                  {location.speed ? `${(location.speed * 2.237).toFixed(0)} mph` : 'Stationary'}
                </p>
              </div>
            </div>

            {/* Last Update */}
            {lastUpdate && (
              <p className="text-xs text-slate-500 mt-3 flex items-center gap-1">
                <Clock size={12} />
                Updated: {lastUpdate.toLocaleTimeString()}
              </p>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                onClick={openInGoogleMaps}
                className="text-xs"
              >
                <MapPin size={14} className="mr-1" /> View on Map
              </Button>
              <Button
                size="sm"
                onClick={getDirections}
                className="bg-blue-600 hover:bg-blue-700 text-xs"
              >
                <Navigation size={14} className="mr-1" /> Get Directions
              </Button>
            </div>
          </>
        ) : !error && (
          <div className="text-center py-8">
            <div className="animate-pulse">
              <MapPin className="mx-auto text-blue-400 mb-2" size={32} />
              <p className="text-slate-400">Waiting for driver location...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
