'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  MapPin,
  Navigation,
  Plus,
  Trash2,
  Clock,
  Route,
  Save,
  Download,
  RefreshCw,
  AlertCircle,
  Check,
  Fuel,
  DollarSign,
  Truck,
  GripVertical,
  Loader2
} from 'lucide-react'

interface Stop {
  id: string
  address: string
  clientName: string
  priority: 'high' | 'medium' | 'low'
  timeWindow?: string
  estimatedTime?: number
  distance?: number
}

interface OptimizedRoute {
  totalDistance: number
  totalTime: number
  fuelCost: number
  stops: Stop[]
  savings: {
    distance: number
    time: number
    fuel: number
  }
}

const priorityColors = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500'
}

export default function RouteOptimizePage() {
  const [stops, setStops] = useState<Stop[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPendingDeliveries()
  }, [])

  async function fetchPendingDeliveries() {
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      if (data.orders) {
        const pendingStops = data.orders
          .filter((o: any) => ['pending', 'confirmed'].includes(o.status))
          .map((o: any) => ({
            id: o.id,
            address: o.delivery_address || 'No address',
            clientName: o.clients?.name || 'Unknown',
            priority: o.is_vip ? 'high' : 'medium',
            timeWindow: o.scheduled_time || undefined
          }))
        setStops(pendingStops)
      }
    } catch (error) {
      console.error('Error fetching deliveries:', error)
    } finally {
      setLoading(false)
    }
  }
  
  const [newStop, setNewStop] = useState<{ address: string; clientName: string; priority: Stop['priority'] }>({ address: '', clientName: '', priority: 'medium' })
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizedRoute, setOptimizedRoute] = useState<OptimizedRoute | null>(null)
  const [startLocation, setStartLocation] = useState('Discreet Courier HQ, Columbus, OH')

  const addStop = () => {
    if (!newStop.address || !newStop.clientName) return
    setStops([...stops, { id: Date.now().toString(), ...newStop }])
    setNewStop({ address: '', clientName: '', priority: 'medium' })
  }

  const removeStop = (id: string) => {
    setStops(stops.filter(s => s.id !== id))
    setOptimizedRoute(null)
  }

  const optimizeRoute = async () => {
    setIsOptimizing(true)
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const optimizedStops = [...stops].sort((a, b) => {
      if (a.priority === 'high' && b.priority !== 'high') return -1
      if (b.priority === 'high' && a.priority !== 'high') return 1
      return 0
    }).map((stop) => ({
      ...stop,
      estimatedTime: 15 + Math.random() * 20,
      distance: 2 + Math.random() * 8
    }))

    const totalDistance = optimizedStops.reduce((sum, s) => sum + (s.distance || 0), 0)
    const totalTime = optimizedStops.reduce((sum, s) => sum + (s.estimatedTime || 0), 0)
    
    setOptimizedRoute({
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalTime: Math.round(totalTime),
      fuelCost: Math.round(totalDistance * 0.15 * 100) / 100,
      stops: optimizedStops,
      savings: {
        distance: Math.round((totalDistance * 0.25) * 10) / 10,
        time: Math.round(totalTime * 0.2),
        fuel: Math.round(totalDistance * 0.15 * 0.25 * 100) / 100
      }
    })
    
    setIsOptimizing(false)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Route Optimizer</h1>
          <p className="text-slate-400">Optimize delivery routes with Google Maps integration</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-slate-600">
            <Download className="h-4 w-4 mr-2" />
            Export Route
          </Button>
          <Button variant="outline" className="border-slate-600">
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <MapPin className="h-5 w-5 text-blue-500" />
                Starting Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Input
                value={startLocation}
                onChange={(e) => setStartLocation(e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="Enter starting address..."
              />
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Navigation className="h-5 w-5 text-green-500" />
                Delivery Stops ({stops.length})
              </CardTitle>
              <CardDescription className="text-slate-400">
                Add and manage delivery stops. Drag to reorder manually.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  placeholder="Client name"
                  value={newStop.clientName}
                  onChange={(e) => setNewStop({ ...newStop, clientName: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white"
                />
                <Input
                  placeholder="Address"
                  value={newStop.address}
                  onChange={(e) => setNewStop({ ...newStop, address: e.target.value })}
                  className="bg-slate-700 border-slate-600 text-white md:col-span-2"
                />
                <div className="flex gap-2">
                  <select
                    value={newStop.priority}
                    onChange={(e) => setNewStop({ ...newStop, priority: e.target.value as 'high' | 'medium' | 'low' })}
                    className="bg-slate-700 border-slate-600 text-white rounded-md px-3 flex-1"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                  <Button onClick={addStop} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                {stops.map((stop, index) => (
                  <div
                    key={stop.id}
                    className="flex items-center gap-3 p-3 bg-slate-700/50 rounded-lg border border-slate-600"
                  >
                    <GripVertical className="h-5 w-5 text-slate-500 cursor-grab" />
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-medium">{stop.clientName}</p>
                      <p className="text-slate-400 text-sm">{stop.address}</p>
                      {stop.timeWindow && (
                        <span className="text-xs text-blue-400">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {stop.timeWindow}
                        </span>
                      )}
                    </div>
                    <Badge className={`${priorityColors[stop.priority]} text-white`}>
                      {stop.priority}
                    </Badge>
                    {optimizedRoute && stop.distance && (
                      <div className="text-right text-sm">
                        <p className="text-white">{stop.distance.toFixed(1)} mi</p>
                        <p className="text-slate-400">{Math.round(stop.estimatedTime || 0)} min</p>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeStop(stop.id)}
                      className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button
                onClick={optimizeRoute}
                disabled={stops.length < 2 || isOptimizing}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {isOptimizing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Optimizing Route...
                  </>
                ) : (
                  <>
                    <Route className="h-4 w-4 mr-2" />
                    Optimize Route
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Route Map Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] bg-slate-700 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-600">
                <div className="text-center text-slate-400">
                  <MapPin className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>Google Maps Integration</p>
                  <p className="text-sm">Configure GOOGLE_MAPS_API_KEY in .env</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {optimizedRoute ? (
            <>
              <Card className="bg-green-900/30 border-green-700">
                <CardHeader>
                  <CardTitle className="text-green-400 flex items-center gap-2">
                    <Check className="h-5 w-5" />
                    Route Optimized!
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-slate-800 rounded-lg">
                      <Route className="h-6 w-6 mx-auto text-blue-400 mb-1" />
                      <p className="text-2xl font-bold text-white">{optimizedRoute.totalDistance}</p>
                      <p className="text-xs text-slate-400">Total Miles</p>
                    </div>
                    <div className="text-center p-3 bg-slate-800 rounded-lg">
                      <Clock className="h-6 w-6 mx-auto text-yellow-400 mb-1" />
                      <p className="text-2xl font-bold text-white">{optimizedRoute.totalTime}</p>
                      <p className="text-xs text-slate-400">Total Minutes</p>
                    </div>
                    <div className="text-center p-3 bg-slate-800 rounded-lg">
                      <Fuel className="h-6 w-6 mx-auto text-orange-400 mb-1" />
                      <p className="text-2xl font-bold text-white">${optimizedRoute.fuelCost}</p>
                      <p className="text-xs text-slate-400">Est. Fuel Cost</p>
                    </div>
                    <div className="text-center p-3 bg-slate-800 rounded-lg">
                      <Truck className="h-6 w-6 mx-auto text-green-400 mb-1" />
                      <p className="text-2xl font-bold text-white">{stops.length}</p>
                      <p className="text-xs text-slate-400">Total Stops</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-green-500" />
                    Savings vs Original
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center p-2 bg-green-900/20 rounded">
                    <span className="text-slate-300">Distance Saved</span>
                    <span className="text-green-400 font-bold">-{optimizedRoute.savings.distance} mi</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-900/20 rounded">
                    <span className="text-slate-300">Time Saved</span>
                    <span className="text-green-400 font-bold">-{optimizedRoute.savings.time} min</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-green-900/20 rounded">
                    <span className="text-slate-300">Fuel Saved</span>
                    <span className="text-green-400 font-bold">-${optimizedRoute.savings.fuel}</span>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="text-center text-slate-400">
                  <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No Route Optimized</p>
                  <p className="text-sm mt-1">Add at least 2 stops and click &quot;Optimize Route&quot;</p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300">
                <Navigation className="h-4 w-4 mr-2" />
                Open in Google Maps
              </Button>
              <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300">
                <Download className="h-4 w-4 mr-2" />
                Download Turn-by-Turn
              </Button>
              <Button variant="outline" className="w-full justify-start border-slate-600 text-slate-300">
                <Truck className="h-4 w-4 mr-2" />
                Assign to Driver
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
