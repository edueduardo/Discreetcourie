'use client'

import { useState, useEffect } from 'react'
import { Shield, AlertTriangle, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export function FraudDetector() {
  const [alerts, setAlerts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 60000) // Check every minute
    return () => clearInterval(interval)
  }, [])

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/ai/fraud-detection')
      const data = await response.json()
      if (data.success) setAlerts(data.alerts || [])
    } catch (error) {
      console.error('Fraud detection error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-500" />
            <CardTitle>Fraud Detection</CardTitle>
          </div>
          <Badge variant={alerts.length > 0 ? 'destructive' : 'secondary'}>
            {alerts.length} alerts
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-sm text-muted-foreground">Scanning for fraud...</p>
        ) : alerts.length === 0 ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle className="h-4 w-4" />
            <p className="text-sm">No suspicious activity detected</p>
          </div>
        ) : (
          <div className="space-y-2">
            {alerts.map((alert: any, idx: number) => (
              <div key={idx} className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-600">{alert.type}</p>
                    <p className="text-xs text-red-500/80">{alert.description}</p>
                  </div>
                  <Badge variant="destructive" className="text-xs">
                    {alert.risk}
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
