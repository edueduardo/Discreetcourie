'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, TrendingDown, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function ChurnPredictor() {
  const [predictions, setPredictions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPredictions()
  }, [])

  const fetchPredictions = async () => {
    try {
      const response = await fetch('/api/ai/churn-prediction')
      const data = await response.json()
      if (data.success) setPredictions(data.predictions || [])
    } catch (error) {
      console.error('Churn prediction error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-orange-500" />
            <CardTitle>Churn Risk</CardTitle>
          </div>
          <Badge variant={predictions.length > 0 ? 'destructive' : 'secondary'}>
            {predictions.length} at risk
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Analyzing customer behavior...</p>
        ) : predictions.length === 0 ? (
          <div className="flex items-center gap-2 text-green-600">
            <Users className="h-4 w-4" />
            <p className="text-sm">All customers engaged</p>
          </div>
        ) : (
          <div className="space-y-2">
            {predictions.slice(0, 5).map((pred: any, idx: number) => (
              <div key={idx} className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium">{pred.customerName}</p>
                      <p className="text-xs text-muted-foreground">{pred.reason}</p>
                    </div>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {pred.risk}% risk
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
