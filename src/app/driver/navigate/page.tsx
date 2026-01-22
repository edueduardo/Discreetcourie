'use client'

import { useState } from 'react'
import { Navigation, MapPin, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function DriverNavigate() {
  const [destination, setDestination] = useState('')
  const [recentAddresses] = useState([
    '123 Main St, Columbus, OH',
    '456 High St, Columbus, OH',
    '789 Broad St, Columbus, OH'
  ])

  function openGoogleMaps(address: string) {
    const encoded = encodeURIComponent(address)
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${encoded}`, '_blank')
  }

  function openWaze(address: string) {
    const encoded = encodeURIComponent(address)
    window.open(`https://waze.com/ul?q=${encoded}&navigate=yes`, '_blank')
  }

  function openAppleMaps(address: string) {
    const encoded = encodeURIComponent(address)
    window.open(`https://maps.apple.com/?daddr=${encoded}`, '_blank')
  }

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-xl font-bold flex items-center gap-2">
        <Navigation /> Navigate
      </h1>

      {/* Destination Input */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <label className="text-sm text-slate-400 block mb-2">Enter Destination</label>
          <Input
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="Address, city, zip..."
            className="bg-slate-700 border-slate-600 mb-3"
          />
          
          {destination && (
            <div className="grid grid-cols-3 gap-2">
              <Button 
                onClick={() => openGoogleMaps(destination)}
                className="bg-blue-600 text-xs"
              >
                Google
              </Button>
              <Button 
                onClick={() => openWaze(destination)}
                className="bg-cyan-600 text-xs"
              >
                Waze
              </Button>
              <Button 
                onClick={() => openAppleMaps(destination)}
                className="bg-slate-600 text-xs"
              >
                Apple
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">Quick Navigate</h3>
          <div className="space-y-2">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => {
                navigator.geolocation.getCurrentPosition((pos) => {
                  window.open(`https://www.google.com/maps?q=${pos.coords.latitude},${pos.coords.longitude}`, '_blank')
                })
              }}
            >
              <MapPin size={16} className="mr-2" /> Current Location
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Addresses */}
      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-4">
          <h3 className="font-medium mb-3">Recent Addresses</h3>
          <div className="space-y-2">
            {recentAddresses.map((addr, i) => (
              <div 
                key={i}
                className="flex items-center justify-between p-2 bg-slate-700 rounded"
              >
                <span className="text-sm truncate flex-1">{addr}</span>
                <button 
                  onClick={() => openGoogleMaps(addr)}
                  className="text-blue-400 p-1"
                >
                  <ExternalLink size={16} />
                </button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <p className="text-xs text-slate-500 text-center">
        Tip: Use Waze for traffic alerts, Google for accuracy
      </p>
    </div>
  )
}
