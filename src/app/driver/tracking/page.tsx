'use client'

import { useEffect, useState, useRef } from 'react'
import { MapPin, Pause, Play, Navigation } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface GPSData {
  latitude: number
  longitude: number
  speed: number | null
  heading: number | null
  accuracy: number
  timestamp: number
}

export default function DriverTracking() {
  const [gpsData, setGpsData] = useState<GPSData | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSync, setLastSync] = useState<Date | null>(null)
  const watchIdRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  function startTracking() {
    if (!('geolocation' in navigator)) {
      setError('GPS not available on this device')
      return
    }

    setIsTracking(true)
    setError(null)

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const data: GPSData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          speed: position.coords.speed,
          heading: position.coords.heading,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        }
        setGpsData(data)
        syncToServer(data)
      },
      (err) => {
        setError(`GPS Error: ${err.message}`)
        setIsTracking(false)
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    )
  }

  function stopTracking() {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsTracking(false)
  }

  async function syncToServer(data: GPSData) {
    try {
      await fetch('/api/gps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      setLastSync(new Date())
    } catch (err) {

    }
  }

  function openInMaps() {
    if (gpsData) {
      const url = `https://www.google.com/maps?q=${gpsData.latitude},${gpsData.longitude}`
      window.open(url, '_blank')
    }
  }

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <MapPin /> GPS Tracking
      </h1>

      {/* Status Card */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-medium">Tracking Status</p>
              <p className={`text-sm ${isTracking ? 'text-green-400' : 'text-slate-400'}`}>
                {isTracking ? '● Active' : '○ Inactive'}
              </p>
            </div>
            <Button
              onClick={isTracking ? stopTracking : startTracking}
              className={isTracking ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {isTracking ? <><Pause size={18} className="mr-2" /> Stop</> : <><Play size={18} className="mr-2" /> Start</>}
            </Button>
          </div>

          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 p-2 rounded mb-4">
              {error}
            </div>
          )}

          {gpsData && (
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-slate-700 p-2 rounded">
                  <p className="text-slate-400">Latitude</p>
                  <p className="font-mono">{gpsData.latitude.toFixed(6)}</p>
                </div>
                <div className="bg-slate-700 p-2 rounded">
                  <p className="text-slate-400">Longitude</p>
                  <p className="font-mono">{gpsData.longitude.toFixed(6)}</p>
                </div>
                <div className="bg-slate-700 p-2 rounded">
                  <p className="text-slate-400">Speed</p>
                  <p className="font-mono">
                    {gpsData.speed ? `${(gpsData.speed * 2.237).toFixed(1)} mph` : 'N/A'}
                  </p>
                </div>
                <div className="bg-slate-700 p-2 rounded">
                  <p className="text-slate-400">Accuracy</p>
                  <p className="font-mono">{gpsData.accuracy.toFixed(0)}m</p>
                </div>
              </div>

              <Button 
                onClick={openInMaps} 
                variant="outline" 
                className="w-full mt-2"
              >
                <Navigation size={16} className="mr-2" /> Open in Maps
              </Button>

              {lastSync && (
                <p className="text-xs text-slate-500 text-center">
                  Last sync: {lastSync.toLocaleTimeString()}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4 text-sm text-slate-400">
          <p className="font-medium text-slate-300 mb-2">Tips:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Keep app open for continuous tracking</li>
            <li>GPS updates every 5 seconds</li>
            <li>Clients can see your real-time location</li>
            <li>Works offline - syncs when connected</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
