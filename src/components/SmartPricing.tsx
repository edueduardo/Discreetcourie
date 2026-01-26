'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Zap, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

interface PricingData {
  basePrice: number
  dynamicPrice: number
  discount: number
  surge: number
  factors: {
    demand: 'low' | 'medium' | 'high'
    time: 'off-peak' | 'normal' | 'peak'
    distance: number
    weather: 'good' | 'fair' | 'poor'
  }
  recommendation: string
}

interface SmartPricingProps {
  distance?: number
  pickupTime?: string
  onPriceCalculated?: (price: number) => void
}

export function SmartPricing({ distance = 5, pickupTime, onPriceCalculated }: SmartPricingProps) {
  const [pricing, setPricing] = useState<PricingData | null>(null)
  const [loading, setLoading] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    calculatePrice()
  }, [distance, pickupTime])

  const calculatePrice = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/ai/smart-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distance,
          pickupTime: pickupTime || new Date().toISOString(),
        }),
      })

      const data = await response.json()

      if (data.success) {
        setPricing(data.pricing)
        if (onPriceCalculated) {
          onPriceCalculated(data.pricing.dynamicPrice)
        }
      }
    } catch (error) {
      console.error('Smart pricing error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !pricing) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500 animate-pulse" />
            <p className="text-sm text-muted-foreground">Calculating optimal price...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const priceChange = pricing.dynamicPrice - pricing.basePrice
  const priceChangePercent = ((priceChange / pricing.basePrice) * 100).toFixed(0)
  const isDiscount = priceChange < 0
  const isSurge = priceChange > 0

  return (
    <Card className="border-2 border-primary/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">Smart Pricing</CardTitle>
          </div>
          <Badge variant={isDiscount ? 'success' : isSurge ? 'destructive' : 'default'}>
            AI Optimized
          </Badge>
        </div>
        <CardDescription>Dynamic pricing based on real-time factors</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Price Display */}
        <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Your Price</p>
          <div className="flex items-center justify-center gap-3">
            {pricing.basePrice !== pricing.dynamicPrice && (
              <span className="text-2xl text-muted-foreground line-through">
                ${pricing.basePrice.toFixed(2)}
              </span>
            )}
            <span className="text-4xl font-bold text-primary">
              ${pricing.dynamicPrice.toFixed(2)}
            </span>
          </div>
          
          {priceChange !== 0 && (
            <div className="flex items-center justify-center gap-2 mt-2">
              {isDiscount ? (
                <>
                  <TrendingDown className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium text-green-500">
                    {priceChangePercent}% discount applied
                  </span>
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <span className="text-sm font-medium text-orange-500">
                    {priceChangePercent}% surge pricing
                  </span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Recommendation */}
        {pricing.recommendation && (
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <p className="text-sm text-blue-600 dark:text-blue-400">
              💡 {pricing.recommendation}
            </p>
          </div>
        )}

        {/* Factors Toggle */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full"
        >
          <Info className="h-4 w-4 mr-2" />
          {showDetails ? 'Hide' : 'Show'} Pricing Factors
        </Button>

        {/* Pricing Factors */}
        {showDetails && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Demand Level</span>
              <Badge variant={
                pricing.factors.demand === 'high' ? 'destructive' :
                pricing.factors.demand === 'medium' ? 'default' : 'secondary'
              }>
                {pricing.factors.demand}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Time of Day</span>
              <Badge variant={
                pricing.factors.time === 'peak' ? 'destructive' :
                pricing.factors.time === 'normal' ? 'default' : 'secondary'
              }>
                {pricing.factors.time}
              </Badge>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Distance</span>
              <span className="font-medium">{pricing.factors.distance} miles</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Weather Conditions</span>
              <Badge variant={
                pricing.factors.weather === 'poor' ? 'destructive' :
                pricing.factors.weather === 'fair' ? 'default' : 'secondary'
              }>
                {pricing.factors.weather}
              </Badge>
            </div>
          </div>
        )}

        {/* Refresh Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={calculatePrice}
          disabled={loading}
          className="w-full"
        >
          <Zap className="h-4 w-4 mr-2" />
          Recalculate Price
        </Button>
      </CardContent>
    </Card>
  )
}
