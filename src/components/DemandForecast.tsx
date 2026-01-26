'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, Calendar, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function DemandForecast() {
  const [forecast, setForecast] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchForecast()
  }, [])

  const fetchForecast = async () => {
    try {
      const response = await fetch('/api/ai/demand-forecast')
      const data = await response.json()
      if (data.success) setForecast(data.forecast)
    } catch (error) {
      console.error('Forecast error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Card><CardContent className="p-6">Loading forecast...</CardContent></Card>

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-purple-500" />
          <CardTitle>Demand Forecast</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {forecast?.predictions?.map((pred: any, idx: number) => (
          <div key={idx} className="flex items-center justify-between p-2 bg-muted rounded">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="text-sm">{pred.period}</span>
            </div>
            <Badge variant={pred.level === 'high' ? 'destructive' : 'default'}>
              {pred.deliveries} deliveries
            </Badge>
          </div>
        ))}
        {forecast?.alert && (
          <div className="p-3 bg-orange-500/10 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5" />
            <p className="text-sm text-orange-600">{forecast.alert}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
