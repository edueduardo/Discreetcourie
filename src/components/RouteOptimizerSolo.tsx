'use client'

import { useState, useEffect } from 'react'
import { Navigation, MapPin, DollarSign, Clock, Fuel, TrendingUp, ExternalLink } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface OptimizedDelivery {
  id: string
  address: string
  zone: string
  priority: 'urgent' | 'normal' | 'flexible'
  lat: number
  lng: number
}

interface RouteData {
  totalDeliveries: number
  totalDistance: number
  totalDuration: number
  fuelCost: number
  timeSaved: number
  mapUrl: string
}

interface Earnings {
  gross: number
  fuel: number
  net: number
  hourlyRate: number
}

export function RouteOptimizerSolo() {
  const [optimizing, setOptimizing] = useState(false)
  const [route, setRoute] = useState<RouteData | null>(null)
  const [deliveries, setDeliveries] = useState<OptimizedDelivery[]>([])
  const [earnings, setEarnings] = useState<Earnings | null>(null)
  const [recommendations, setRecommendations] = useState<string[]>([])

  const optimizeRoute = async () => {
    setOptimizing(true)
    try {
      const response = await fetch('/api/route/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startAddress: '1 Nationwide Plaza, Columbus, OH 43215',
          startLat: 39.9612,
          startLng: -82.9988,
        }),
      })

      const result = await response.json()

      if (result.success) {
        setRoute(result.route)
        setDeliveries(result.deliveries || [])
        setEarnings(result.earnings)
        setRecommendations(result.recommendations || [])
      } else {
        alert('No deliveries to optimize today')
      }
    } catch (error) {
      console.error('Optimization error:', error)
      alert('Failed to optimize route')
    } finally {
      setOptimizing(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500'
      case 'normal': return 'bg-blue-500'
      case 'flexible': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="border-2 border-blue-500/20 bg-gradient-to-br from-blue-500/5 to-background">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-500/10 rounded-lg">
                <Navigation className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-2xl">Route Optimizer</CardTitle>
                <CardDescription>Columbus, Ohio - Solo Driver</CardDescription>
              </div>
            </div>
            <Button onClick={optimizeRoute} disabled={optimizing} size="lg">
              {optimizing ? 'Optimizing...' : 'Optimize Today'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Route Summary */}
      {route && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-blue-500" />
                  <p className="text-sm text-muted-foreground">Deliveries</p>
                </div>
                <p className="text-2xl font-bold">{route.totalDeliveries}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Navigation className="h-4 w-4 text-green-500" />
                  <p className="text-sm text-muted-foreground">Distance</p>
                </div>
                <p className="text-2xl font-bold">{route.totalDistance} mi</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <p className="text-sm text-muted-foreground">Duration</p>
                </div>
                <p className="text-2xl font-bold">{Math.round(route.totalDuration / 60)}h {route.totalDuration % 60}m</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Fuel className="h-4 w-4 text-red-500" />
                  <p className="text-sm text-muted-foreground">Fuel Cost</p>
                </div>
                <p className="text-2xl font-bold">${route.fuelCost}</p>
              </CardContent>
            </Card>
          </div>

          {/* Earnings */}
          {earnings && (
            <Card className="border-2 border-green-500/20 bg-gradient-to-br from-green-500/5 to-background">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  Today's Earnings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Gross</p>
                    <p className="text-2xl font-bold text-green-600">${earnings.gross}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fuel</p>
                    <p className="text-2xl font-bold text-red-600">-${earnings.fuel}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Net</p>
                    <p className="text-2xl font-bold text-green-600">${earnings.net}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Hourly</p>
                    <p className="text-2xl font-bold text-blue-600">${earnings.hourlyRate}/hr</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="p-3 bg-accent rounded-lg text-sm">
                      {rec}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Open in Google Maps */}
          <Card>
            <CardContent className="p-4">
              <Button
                onClick={() => window.open(route.mapUrl, '_blank')}
                className="w-full"
                size="lg"
                variant="default"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Optimized Route in Google Maps
              </Button>
              <p className="text-xs text-muted-foreground text-center mt-2">
                ⏱️ Saves {route.timeSaved} minutes compared to unoptimized route
              </p>
            </CardContent>
          </Card>

          {/* Delivery List */}
          <Card>
            <CardHeader>
              <CardTitle>Optimized Delivery Sequence</CardTitle>
              <CardDescription>Follow this order for maximum efficiency</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {deliveries.map((delivery, index) => (
                  <div
                    key={delivery.id}
                    className="flex items-center gap-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold">{delivery.address}</p>
                        <Badge className={getPriorityColor(delivery.priority)}>
                          {delivery.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        📍 {delivery.zone}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(delivery.address)}`,
                        '_blank'
                      )}
                    >
                      Navigate
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Empty State */}
      {!route && !optimizing && (
        <Card>
          <CardContent className="p-12 text-center">
            <Navigation className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Route Optimized Yet</h3>
            <p className="text-muted-foreground mb-4">
              Click "Optimize Today" to generate the most efficient route for your deliveries
            </p>
            <Button onClick={optimizeRoute} size="lg">
              Optimize Route
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
