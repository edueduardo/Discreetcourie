'use client'

import { useState } from 'react'
import { MapPin, Zap, Navigation } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function RouteOptimizer({ deliveries = [] }: { deliveries?: any[] }) {
  const [optimizing, setOptimizing] = useState(false)
  const [optimizedRoute, setOptimizedRoute] = useState<any>(null)

  const optimizeRoute = async () => {
    setOptimizing(true)
    try {
      const response = await fetch('/api/ai/route-optimization', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveries }),
      })
      const data = await response.json()
      if (data.success) setOptimizedRoute(data.route)
    } catch (error) {
      console.error('Route optimization error:', error)
    } finally {
      setOptimizing(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Navigation className="h-5 w-5 text-blue-500" />
            <CardTitle>AI Route Optimizer</CardTitle>
          </div>
          <Badge variant="secondary">Beta</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Button onClick={optimizeRoute} disabled={optimizing} className="w-full">
          <Zap className="h-4 w-4 mr-2" />
          {optimizing ? 'Optimizing...' : 'Optimize Routes'}
        </Button>
        {optimizedRoute && (
          <div className="mt-4 p-3 bg-green-500/10 rounded-lg">
            <p className="text-sm text-green-600">
              ✓ Route optimized! Save {optimizedRoute.timeSaved} minutes
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
