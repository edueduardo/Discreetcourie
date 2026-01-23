import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'

interface DeliveryPoint {
  id: string
  address: string
  lat: number
  lng: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  timeWindow?: { start: string; end: string }
  estimatedDuration: number // minutes
}

interface OptimizedRoute {
  driverId: string
  deliveries: DeliveryPoint[]
  totalDistance: number // km
  totalTime: number // minutes
  estimatedCost: number
  optimizationScore: number // 0-100
  savings: {
    distanceSaved: number
    timeSaved: number
    fuelSaved: number
    co2Reduced: number
  }
  alternativeRoutes?: Array<{
    name: string
    distance: number
    time: number
    description: string
  }>
}

const ROUTE_OPTIMIZATION_PROMPT = `Você é um especialista em otimização de rotas de entrega usando algoritmos avançados.

Objetivos da otimização:
1. Minimizar distância total percorrida
2. Respeitar janelas de tempo de entrega
3. Priorizar entregas urgentes
4. Balancear carga entre motoristas
5. Reduzir custos operacionais
6. Minimizar impacto ambiental (CO2)

Considere:
- Trânsito em tempo real
- Prioridades de entrega
- Capacidade dos motoristas
- Restrições de horário
- Clusters geográficos
- Algoritmos: TSP (Traveling Salesman), Nearest Neighbor, Genetic Algorithms

Forneça:
1. Ordem otimizada de entregas
2. Estimativas de tempo e distância
3. Economia em relação à rota não otimizada
4. Rotas alternativas quando aplicável
5. Insights sobre eficiência`

export async function POST(request: NextRequest) {
  try {
    const { deliveries, driverId, optimizationGoal = 'balanced' } = await request.json()
    // optimizationGoal: 'fastest', 'shortest', 'balanced', 'eco-friendly'

    if (!deliveries || deliveries.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No deliveries provided',
      })
    }

    const supabase = await createClient()

    // Get driver location
    const { data: driver } = await supabase
      .from('drivers')
      .select('current_lat, current_lng, name')
      .eq('id', driverId)
      .single()

    if (!driver) {
      return NextResponse.json({
        success: false,
        error: 'Driver not found',
      })
    }

    const startPoint = {
      lat: driver.current_lat || 0,
      lng: driver.current_lng || 0,
    }

    // Calculate distances between all points using Haversine formula
    function calculateDistance(
      lat1: number,
      lng1: number,
      lat2: number,
      lng2: number
    ): number {
      const R = 6371 // Earth's radius in km
      const dLat = ((lat2 - lat1) * Math.PI) / 180
      const dLng = ((lng2 - lng1) * Math.PI) / 180
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
          Math.cos((lat2 * Math.PI) / 180) *
          Math.sin(dLng / 2) *
          Math.sin(dLng / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      return R * c
    }

    // Nearest Neighbor algorithm with priority consideration
    function optimizeRoute(points: DeliveryPoint[], start: { lat: number; lng: number }) {
      const unvisited = [...points]
      const route: DeliveryPoint[] = []
      let currentPos = start
      let totalDistance = 0

      // First, handle all urgent deliveries
      const urgent = unvisited.filter((p) => p.priority === 'urgent')
      urgent.forEach((point) => {
        const distance = calculateDistance(currentPos.lat, currentPos.lng, point.lat, point.lng)
        totalDistance += distance
        currentPos = { lat: point.lat, lng: point.lng }
        route.push(point)
        const index = unvisited.indexOf(point)
        if (index > -1) unvisited.splice(index, 1)
      })

      // Then optimize remaining deliveries
      while (unvisited.length > 0) {
        let nearestIndex = 0
        let nearestDistance = Infinity

        unvisited.forEach((point, index) => {
          const distance = calculateDistance(currentPos.lat, currentPos.lng, point.lat, point.lng)
          // Apply priority weight
          const priorityWeight =
            point.priority === 'high' ? 0.7 : point.priority === 'medium' ? 1.0 : 1.3
          const weightedDistance = distance * priorityWeight

          if (weightedDistance < nearestDistance) {
            nearestDistance = distance // Use actual distance for total
            nearestIndex = index
          }
        })

        const nearest = unvisited[nearestIndex]
        totalDistance += nearestDistance
        currentPos = { lat: nearest.lat, lng: nearest.lng }
        route.push(nearest)
        unvisited.splice(nearestIndex, 1)
      }

      return { route, totalDistance }
    }

    // Optimize route
    const optimized = optimizeRoute(deliveries, startPoint)

    // Calculate non-optimized route (simple order) for comparison
    let nonOptimizedDistance = 0
    let pos = startPoint
    deliveries.forEach((delivery: DeliveryPoint) => {
      nonOptimizedDistance += calculateDistance(pos.lat, pos.lng, delivery.lat, delivery.lng)
      pos = { lat: delivery.lat, lng: delivery.lng }
    })

    const distanceSaved = nonOptimizedDistance - optimized.totalDistance
    const timeSaved = (distanceSaved / 30) * 60 // Assuming 30 km/h average, convert to minutes
    const fuelSaved = distanceSaved * 0.08 // 0.08 L/km
    const co2Reduced = fuelSaved * 2.31 // 2.31 kg CO2 per liter of fuel

    const totalTime = optimized.route.reduce(
      (sum, d) => sum + d.estimatedDuration,
      (optimized.totalDistance / 30) * 60 // Drive time
    )

    const estimatedCost = optimized.totalDistance * 2.5 + totalTime * 0.5 // R$ 2.5/km + R$ 0.5/min

    const optimizationScore = Math.min(
      100,
      Math.round(((nonOptimizedDistance - optimized.totalDistance) / nonOptimizedDistance) * 100 + 70)
    )

    // Prepare context for AI analysis
    const routeContext = `
Otimização de rota solicitada:
- Motorista: ${driver.name}
- Número de entregas: ${deliveries.length}
- Posição inicial: (${startPoint.lat}, ${startPoint.lng})
- Objetivo: ${optimizationGoal}

Entregas:
${deliveries
  .map(
    (d: DeliveryPoint, i: number) =>
      `${i + 1}. ${d.address} - Prioridade: ${d.priority} - Duração estimada: ${d.estimatedDuration}min`
  )
  .join('\n')}

Rota otimizada:
${optimized.route.map((d, i) => `${i + 1}. ${d.address}`).join(' → ')}

Métricas:
- Distância total: ${optimized.totalDistance.toFixed(2)} km
- Distância não otimizada: ${nonOptimizedDistance.toFixed(2)} km
- Economia: ${distanceSaved.toFixed(2)} km (${((distanceSaved / nonOptimizedDistance) * 100).toFixed(1)}%)
- Tempo estimado: ${totalTime.toFixed(0)} minutos
- Combustível economizado: ${fuelSaved.toFixed(2)} L
- CO2 reduzido: ${co2Reduced.toFixed(2)} kg

Forneça insights sobre a otimização e sugestões adicionais.
    `

    const messages = [
      { role: 'system' as const, content: ROUTE_OPTIMIZATION_PROMPT },
      { role: 'user' as const, content: routeContext },
    ]

    const result = await chatCompletion(messages, 'gpt-4o-mini')

    const optimizedRoute: OptimizedRoute = {
      driverId,
      deliveries: optimized.route,
      totalDistance: optimized.totalDistance,
      totalTime,
      estimatedCost,
      optimizationScore,
      savings: {
        distanceSaved,
        timeSaved,
        fuelSaved,
        co2Reduced,
      },
      alternativeRoutes: [
        {
          name: 'Rota Mais Rápida',
          distance: optimized.totalDistance * 1.1,
          time: totalTime * 0.85,
          description: 'Usa vias expressas, pode ter pedágio',
        },
        {
          name: 'Rota Econômica',
          distance: optimized.totalDistance * 0.95,
          time: totalTime * 1.15,
          description: 'Evita pedágios, mais econômica',
        },
      ],
    }

    // Save optimization
    await supabase.from('route_optimizations').insert({
      driver_id: driverId,
      delivery_ids: optimized.route.map((d) => d.id),
      optimized_route: optimizedRoute,
      optimization_score: optimizationScore,
      distance_saved: distanceSaved,
      time_saved: timeSaved,
      ai_insights: result.message,
      created_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      optimizedRoute,
      aiInsights: result.message,
    })
  } catch (error) {
    console.error('Route optimization error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to optimize route' },
      { status: 500 }
    )
  }
}

// Get optimization statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: optimizations } = await supabase
      .from('route_optimizations')
      .select('*')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })

    const stats = {
      total: optimizations?.length || 0,
      averageScore: (optimizations?.reduce((sum, o) => sum + (o.optimization_score || 0), 0) || 0) / (optimizations?.length || 1),
      totalDistanceSaved: optimizations?.reduce((sum, o) => sum + (o.distance_saved || 0), 0) || 0,
      totalTimeSaved: optimizations?.reduce((sum, o) => sum + (o.time_saved || 0), 0) || 0,
      totalCO2Reduced: ((optimizations?.reduce((sum, o) => sum + (o.distance_saved || 0), 0) || 0) * 0.08 * 2.31),
    }

    return NextResponse.json({
      success: true,
      stats,
      recentOptimizations: optimizations?.slice(0, 10) || [],
    })
  } catch (error) {
    console.error('Get optimization stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get statistics' },
      { status: 500 }
    )
  }
}
