import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'

interface PricingFactors {
  basePrice: number
  distance: number
  timeOfDay: string
  dayOfWeek: string
  demand: 'low' | 'medium' | 'high'
  weather?: string
  urgency: 'normal' | 'express' | 'urgent'
  packageSize: 'small' | 'medium' | 'large'
}

interface PricingSuggestion {
  suggestedPrice: number
  breakdown: {
    basePrice: number
    distanceMultiplier: number
    demandMultiplier: number
    timeMultiplier: number
    urgencyMultiplier: number
    sizeMultiplier: number
    weatherAdjustment: number
  }
  confidence: number
  explanation: string
  competitorComparison?: {
    ourPrice: number
    marketAverage: number
    position: 'below' | 'competitive' | 'above'
  }
}

const PRICING_SYSTEM_PROMPT = `Você é um especialista em precificação dinâmica para serviços de entrega courier.

Fatores a considerar:
1. DISTÂNCIA: Maior distância = maior preço (R$ 3-5/km)
2. HORÁRIO: Pico (7-9h, 12-14h, 17-19h) = +20-30%, Noite/Madrugada = +40-50%
3. DIA DA SEMANA: Fim de semana = +15-25%
4. DEMANDA: Alta demanda = +30-50%, Baixa = -10-20%
5. URGÊNCIA: Express = +50%, Urgente = +100%
6. TAMANHO: Pequeno = base, Médio = +30%, Grande = +60%
7. CLIMA: Chuva/Tempestade = +20-40%

Preço base sugerido: R$ 15-25 + (distância × R$ 4/km)

Retorne análise em JSON:
{
  "suggestedPrice": number,
  "breakdown": {...},
  "confidence": 0-100,
  "explanation": "string"
}`

export async function POST(request: NextRequest) {
  try {
    const factors: PricingFactors = await request.json()
    const supabase = await createClient()

    // Get recent pricing data for analysis
    const { data: recentDeliveries } = await supabase
      .from('deliveries')
      .select('price, distance, created_at, status')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .not('price', 'is', null)

    // Calculate current demand
    const recentHour = recentDeliveries?.filter(
      (d) => new Date(d.created_at).getTime() > Date.now() - 60 * 60 * 1000
    )
    const averageHourlyOrders = (recentDeliveries?.length || 0) / (7 * 24) // Weekly average per hour
    const currentDemand =
      (recentHour?.length || 0) > averageHourlyOrders * 1.5
        ? 'high'
        : (recentHour?.length || 0) < averageHourlyOrders * 0.5
        ? 'low'
        : 'medium'

    // Build pricing context
    const pricingContext = `
Dados para precificação:
- Distância: ${factors.distance} km
- Horário: ${factors.timeOfDay}
- Dia da semana: ${factors.dayOfWeek}
- Demanda atual: ${currentDemand}
- Clima: ${factors.weather || 'normal'}
- Urgência: ${factors.urgency}
- Tamanho do pacote: ${factors.packageSize}

Dados históricos:
- Entregas última semana: ${recentDeliveries?.length || 0}
- Preço médio: R$ ${(
      (recentDeliveries?.reduce((sum, d) => sum + (d.price || 0), 0) || 0) /
        (recentDeliveries?.length || 1) || 0
    ).toFixed(2)}
- Pedidos na última hora: ${recentHour?.length || 0}
- Demanda calculada: ${currentDemand}
    `

    const messages = [
      { role: 'system' as const, content: PRICING_SYSTEM_PROMPT },
      { role: 'user' as const, content: pricingContext },
    ]

    const result = await chatCompletion(messages, 'gpt-4o')

    if (!result.success) {
      throw new Error('Failed to calculate smart pricing')
    }

    // Parse AI response or calculate fallback
    let suggestion: PricingSuggestion

    try {
      const jsonMatch = result.message.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        suggestion = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON in response')
      }
    } catch (e) {
      // Fallback to rule-based pricing
      const basePrice = 20
      const distancePrice = factors.distance * 4

      let timeMultiplier = 1.0
      const hour = parseInt(factors.timeOfDay.split(':')[0])
      if ((hour >= 7 && hour <= 9) || (hour >= 12 && hour <= 14) || (hour >= 17 && hour <= 19)) {
        timeMultiplier = 1.25 // Peak hours
      } else if (hour >= 22 || hour <= 6) {
        timeMultiplier = 1.5 // Night/early morning
      }

      let demandMultiplier = 1.0
      if (currentDemand === 'high') demandMultiplier = 1.4
      if (currentDemand === 'low') demandMultiplier = 0.85

      let urgencyMultiplier = 1.0
      if (factors.urgency === 'express') urgencyMultiplier = 1.5
      if (factors.urgency === 'urgent') urgencyMultiplier = 2.0

      let sizeMultiplier = 1.0
      if (factors.packageSize === 'medium') sizeMultiplier = 1.3
      if (factors.packageSize === 'large') sizeMultiplier = 1.6

      let weatherAdjustment = 0
      if (factors.weather && ['rain', 'storm', 'chuva', 'tempestade'].some((w) => factors.weather?.toLowerCase().includes(w))) {
        weatherAdjustment = (basePrice + distancePrice) * 0.3
      }

      const totalPrice = (basePrice + distancePrice) * timeMultiplier * demandMultiplier * urgencyMultiplier * sizeMultiplier + weatherAdjustment

      suggestion = {
        suggestedPrice: Math.round(totalPrice * 100) / 100,
        breakdown: {
          basePrice,
          distanceMultiplier: distancePrice,
          demandMultiplier,
          timeMultiplier,
          urgencyMultiplier,
          sizeMultiplier,
          weatherAdjustment,
        },
        confidence: 85,
        explanation: result.message,
      }
    }

    // Add competitor comparison
    const marketAverage = 35 // This would come from competitor analysis in production
    suggestion.competitorComparison = {
      ourPrice: suggestion.suggestedPrice,
      marketAverage,
      position:
        suggestion.suggestedPrice < marketAverage * 0.9
          ? 'below'
          : suggestion.suggestedPrice > marketAverage * 1.1
          ? 'above'
          : 'competitive',
    }

    // Log pricing calculation
    await supabase.from('pricing_calculations').insert({
      factors,
      suggested_price: suggestion.suggestedPrice,
      breakdown: suggestion.breakdown,
      confidence: suggestion.confidence,
      calculated_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      pricing: suggestion,
    })
  } catch (error) {
    console.error('Smart pricing error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to calculate pricing' },
      { status: 500 }
    )
  }
}

// Endpoint to get pricing analytics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: calculations } = await supabase
      .from('pricing_calculations')
      .select('*')
      .gte('calculated_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('calculated_at', { ascending: false })
      .limit(100)

    const stats = {
      total: calculations?.length || 0,
      averagePrice: (calculations?.reduce((sum, c) => sum + (c.suggested_price || 0), 0) || 0) / (calculations?.length || 1),
      minPrice: Math.min(...(calculations?.map((c) => c.suggested_price) || [0])),
      maxPrice: Math.max(...(calculations?.map((c) => c.suggested_price) || [0])),
      averageConfidence: (calculations?.reduce((sum, c) => sum + (c.confidence || 0), 0) || 0) / (calculations?.length || 1),
    }

    return NextResponse.json({
      success: true,
      stats,
      recentCalculations: calculations?.slice(0, 10) || [],
    })
  } catch (error) {
    console.error('Pricing analytics error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get pricing analytics' },
      { status: 500 }
    )
  }
}
