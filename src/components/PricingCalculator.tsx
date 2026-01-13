'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calculator,
  DollarSign,
  TrendingUp,
  Clock,
  MapPin,
  Zap,
  Calendar,
  AlertCircle,
  Info
} from 'lucide-react'

interface PricingRules {
  base_rate: number
  distance_rate_per_mile: number
  time_premiums: {
    early_morning: number    // before 8am
    late_evening: number     // after 6pm
    weekend: number          // Saturday
    sunday: number           // Sunday
    holiday: number          // Holidays
  }
  urgency_multipliers: {
    urgent_1h: number        // Need it in 1 hour
    same_day: number         // Same day delivery
    next_day: number         // Next day
  }
  service_tier_multipliers: {
    courier: number          // Basic courier
    discreet: number         // Discreet delivery
    concierge: number        // Concierge service
    fixer: number            // The Fixer / VIP
  }
  multi_stop_fee: number     // Per additional stop
  wait_time_rate: number     // Per hour wait time
}

const DEFAULT_RULES: PricingRules = {
  base_rate: 35,
  distance_rate_per_mile: 2.5,
  time_premiums: {
    early_morning: 1.25,     // +25%
    late_evening: 1.25,      // +25%
    weekend: 1.5,            // +50%
    sunday: 1.75,            // +75%
    holiday: 2.0,            // +100%
  },
  urgency_multipliers: {
    urgent_1h: 2.0,          // +100%
    same_day: 1.3,           // +30%
    next_day: 1.0,           // Standard
  },
  service_tier_multipliers: {
    courier: 1.0,            // Base
    discreet: 1.5,           // +50%
    concierge: 2.0,          // +100%
    fixer: 2.5,              // +150%
  },
  multi_stop_fee: 15,        // $15 per stop
  wait_time_rate: 60,        // $60/hour
}

interface PricingCalculatorProps {
  onPriceCalculated?: (price: number, breakdown: PriceBreakdown) => void
  initialValues?: Partial<DeliveryParams>
}

interface DeliveryParams {
  distance: number
  pickup_time: string
  urgency: 'urgent_1h' | 'same_day' | 'next_day'
  service_tier: 'courier' | 'discreet' | 'concierge' | 'fixer'
  additional_stops: number
  wait_time_hours: number
  is_weekend: boolean
  is_sunday: boolean
  is_holiday: boolean
}

interface PriceBreakdown {
  base_price: number
  distance_cost: number
  time_premium: number
  urgency_cost: number
  service_tier_cost: number
  multi_stop_cost: number
  wait_time_cost: number
  subtotal: number
  total: number
  applied_multipliers: string[]
}

export default function PricingCalculator({ onPriceCalculated, initialValues }: PricingCalculatorProps) {
  const [params, setParams] = useState<DeliveryParams>({
    distance: initialValues?.distance || 5,
    pickup_time: initialValues?.pickup_time || '10:00',
    urgency: initialValues?.urgency || 'same_day',
    service_tier: initialValues?.service_tier || 'courier',
    additional_stops: initialValues?.additional_stops || 0,
    wait_time_hours: initialValues?.wait_time_hours || 0,
    is_weekend: initialValues?.is_weekend || false,
    is_sunday: initialValues?.is_sunday || false,
    is_holiday: initialValues?.is_holiday || false,
  })

  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null)

  const calculatePrice = (deliveryParams: DeliveryParams): PriceBreakdown => {
    const rules = DEFAULT_RULES
    const appliedMultipliers: string[] = []

    // Base calculation
    const base_price = rules.base_rate
    const distance_cost = deliveryParams.distance * rules.distance_rate_per_mile

    // Time premium
    let time_multiplier = 1.0
    const hour = parseInt(deliveryParams.pickup_time.split(':')[0])

    if (deliveryParams.is_holiday) {
      time_multiplier = Math.max(time_multiplier, rules.time_premiums.holiday)
      appliedMultipliers.push(`Holiday (+${((rules.time_premiums.holiday - 1) * 100).toFixed(0)}%)`)
    } else if (deliveryParams.is_sunday) {
      time_multiplier = Math.max(time_multiplier, rules.time_premiums.sunday)
      appliedMultipliers.push(`Sunday (+${((rules.time_premiums.sunday - 1) * 100).toFixed(0)}%)`)
    } else if (deliveryParams.is_weekend) {
      time_multiplier = Math.max(time_multiplier, rules.time_premiums.weekend)
      appliedMultipliers.push(`Weekend (+${((rules.time_premiums.weekend - 1) * 100).toFixed(0)}%)`)
    }

    if (hour < 8) {
      time_multiplier = Math.max(time_multiplier, rules.time_premiums.early_morning)
      appliedMultipliers.push(`Early Morning (+${((rules.time_premiums.early_morning - 1) * 100).toFixed(0)}%)`)
    } else if (hour >= 18) {
      time_multiplier = Math.max(time_multiplier, rules.time_premiums.late_evening)
      appliedMultipliers.push(`Late Evening (+${((rules.time_premiums.late_evening - 1) * 100).toFixed(0)}%)`)
    }

    // Urgency multiplier
    const urgency_multiplier = rules.urgency_multipliers[deliveryParams.urgency]
    if (urgency_multiplier > 1.0) {
      appliedMultipliers.push(`${deliveryParams.urgency.replace('_', ' ').toUpperCase()} (+${((urgency_multiplier - 1) * 100).toFixed(0)}%)`)
    }

    // Service tier multiplier
    const service_multiplier = rules.service_tier_multipliers[deliveryParams.service_tier]
    if (service_multiplier > 1.0) {
      appliedMultipliers.push(`${deliveryParams.service_tier.toUpperCase()} Tier (+${((service_multiplier - 1) * 100).toFixed(0)}%)`)
    }

    // Calculate costs
    const subtotal_before_premiums = base_price + distance_cost
    const time_premium = subtotal_before_premiums * (time_multiplier - 1.0)
    const urgency_cost = subtotal_before_premiums * (urgency_multiplier - 1.0)
    const service_tier_cost = subtotal_before_premiums * (service_multiplier - 1.0)
    const multi_stop_cost = deliveryParams.additional_stops * rules.multi_stop_fee
    const wait_time_cost = deliveryParams.wait_time_hours * rules.wait_time_rate

    const subtotal = subtotal_before_premiums + time_premium + urgency_cost + service_tier_cost
    const total = subtotal + multi_stop_cost + wait_time_cost

    return {
      base_price,
      distance_cost,
      time_premium,
      urgency_cost,
      service_tier_cost,
      multi_stop_cost,
      wait_time_cost,
      subtotal,
      total,
      applied_multipliers: appliedMultipliers
    }
  }

  useEffect(() => {
    const newBreakdown = calculatePrice(params)
    setBreakdown(newBreakdown)
    onPriceCalculated?.(newBreakdown.total, newBreakdown)
  }, [params])

  const updateParam = (key: keyof DeliveryParams, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      {/* Calculator Card */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-500" />
            Dynamic Pricing Calculator
          </CardTitle>
          <CardDescription>
            Adjust parameters to calculate accurate pricing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Distance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-slate-500" />
                Distance (miles)
              </Label>
              <Input
                type="number"
                min="0"
                step="0.1"
                value={params.distance}
                onChange={(e) => updateParam('distance', parseFloat(e.target.value) || 0)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                Pickup Time
              </Label>
              <Input
                type="time"
                value={params.pickup_time}
                onChange={(e) => updateParam('pickup_time', e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Service Tier & Urgency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Service Tier</Label>
              <Select
                value={params.service_tier}
                onValueChange={(value: any) => updateParam('service_tier', value)}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="courier">Courier (Base)</SelectItem>
                  <SelectItem value="discreet">Discreet (+50%)</SelectItem>
                  <SelectItem value="concierge">Concierge (+100%)</SelectItem>
                  <SelectItem value="fixer">The Fixer/VIP (+150%)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Zap className="h-4 w-4 text-slate-500" />
                Urgency
              </Label>
              <Select
                value={params.urgency}
                onValueChange={(value: any) => updateParam('urgency', value)}
              >
                <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="next_day">Next Day (Standard)</SelectItem>
                  <SelectItem value="same_day">Same Day (+30%)</SelectItem>
                  <SelectItem value="urgent_1h">Urgent 1 Hour (+100%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Additional Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-slate-300">Additional Stops ($15 each)</Label>
              <Input
                type="number"
                min="0"
                value={params.additional_stops}
                onChange={(e) => updateParam('additional_stops', parseInt(e.target.value) || 0)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300">Wait Time (hours, $60/hr)</Label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={params.wait_time_hours}
                onChange={(e) => updateParam('wait_time_hours', parseFloat(e.target.value) || 0)}
                className="bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Day Premiums */}
          <div className="space-y-2">
            <Label className="text-slate-300 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              Day Premiums
            </Label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.is_weekend}
                  onChange={(e) => {
                    updateParam('is_weekend', e.target.checked)
                    if (e.target.checked) {
                      updateParam('is_sunday', false)
                      updateParam('is_holiday', false)
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600"
                />
                <span className="text-sm text-slate-400">Saturday (+50%)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.is_sunday}
                  onChange={(e) => {
                    updateParam('is_sunday', e.target.checked)
                    if (e.target.checked) {
                      updateParam('is_weekend', false)
                      updateParam('is_holiday', false)
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600"
                />
                <span className="text-sm text-slate-400">Sunday (+75%)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={params.is_holiday}
                  onChange={(e) => {
                    updateParam('is_holiday', e.target.checked)
                    if (e.target.checked) {
                      updateParam('is_weekend', false)
                      updateParam('is_sunday', false)
                    }
                  }}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600"
                />
                <span className="text-sm text-slate-400">Holiday (+100%)</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Breakdown */}
      {breakdown && (
        <Card className="bg-gradient-to-r from-green-500/10 to-blue-500/10 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-500" />
                Price Breakdown
              </span>
              <span className="text-3xl font-bold text-green-500">
                ${breakdown.total.toFixed(2)}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Line Items */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Base Rate</span>
                <span className="text-white">${breakdown.base_price.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-sm">
                <span className="text-slate-400">
                  Distance ({params.distance} mi × $2.50)
                </span>
                <span className="text-white">${breakdown.distance_cost.toFixed(2)}</span>
              </div>

              {breakdown.time_premium > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1">
                    Time Premium
                    <TrendingUp className="h-3 w-3 text-orange-500" />
                  </span>
                  <span className="text-orange-500">+${breakdown.time_premium.toFixed(2)}</span>
                </div>
              )}

              {breakdown.urgency_cost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 flex items-center gap-1">
                    Urgency Fee
                    <Zap className="h-3 w-3 text-yellow-500" />
                  </span>
                  <span className="text-yellow-500">+${breakdown.urgency_cost.toFixed(2)}</span>
                </div>
              )}

              {breakdown.service_tier_cost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Service Tier Premium</span>
                  <span className="text-blue-500">+${breakdown.service_tier_cost.toFixed(2)}</span>
                </div>
              )}

              {breakdown.multi_stop_cost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">
                    Additional Stops ({params.additional_stops} × $15)
                  </span>
                  <span className="text-white">+${breakdown.multi_stop_cost.toFixed(2)}</span>
                </div>
              )}

              {breakdown.wait_time_cost > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">
                    Wait Time ({params.wait_time_hours}h × $60)
                  </span>
                  <span className="text-white">+${breakdown.wait_time_cost.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-slate-700 my-3"></div>

            {/* Subtotal */}
            <div className="flex justify-between font-medium">
              <span className="text-slate-300">Subtotal</span>
              <span className="text-white">${breakdown.subtotal.toFixed(2)}</span>
            </div>

            {/* Applied Multipliers */}
            {breakdown.applied_multipliers.length > 0 && (
              <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                <div className="flex items-start gap-2">
                  <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs text-blue-400 font-medium">Applied Premiums:</p>
                    <div className="flex flex-wrap gap-2">
                      {breakdown.applied_multipliers.map((multiplier, i) => (
                        <Badge key={i} variant="outline" className="text-xs text-blue-400 border-blue-500/30">
                          {multiplier}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Total */}
            <div className="pt-3 border-t border-slate-700">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-white">Total</span>
                <span className="text-3xl font-bold text-green-500">
                  ${breakdown.total.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Info Alert */}
            <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-900/50 border border-slate-700">
              <AlertCircle className="h-4 w-4 text-slate-500 mt-0.5" />
              <p className="text-xs text-slate-400">
                Prices are calculated automatically. You can override the final amount when creating the delivery.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
