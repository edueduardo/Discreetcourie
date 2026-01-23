import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'

interface DemandForecast {
  hourly: Array<{ hour: string; predicted: number; confidence: number }>
  daily: Array<{ date: string; predicted: number; confidence: number }>
  insights: string[]
  recommendations: string[]
  peakHours: string[]
  lowHours: string[]
}

const FORECAST_SYSTEM_PROMPT = `Você é um especialista em previsão de demanda usando análise de séries temporais e machine learning.

Analise os dados históricos de entregas e forneça:
1. Previsão de demanda por hora para as próximas 24 horas
2. Previsão de demanda por dia para os próximos 7 dias
3. Identificação de horários de pico e baixa demanda
4. Insights sobre padrões e tendências
5. Recomendações operacionais

Considere:
- Padrões por dia da semana (seg-dom)
- Padrões por horário (0-23h)
- Tendências de crescimento ou queda
- Sazonalidade
- Eventos especiais ou anomalias

Retorne em JSON estruturado com previsões numéricas e insights acionáveis.`

export async function POST(request: NextRequest) {
  try {
    const { forecastType = 'both' } = await request.json() // 'hourly', 'daily', or 'both'
    const supabase = await createClient()

    // Get historical data (last 30 days)
    const { data: historicalData } = await supabase
      .from('deliveries')
      .select('created_at, status')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })

    if (!historicalData || historicalData.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient historical data for forecasting',
      })
    }

    // Aggregate data by hour
    const hourlyData: Record<string, number> = {}
    const dailyData: Record<string, number> = {}

    historicalData.forEach((delivery) => {
      const date = new Date(delivery.created_at)
      const hour = date.getHours()
      const dayOfWeek = date.getDay()
      const dateStr = date.toISOString().split('T')[0]

      // Hourly aggregation
      const hourKey = `${dayOfWeek}-${hour}`
      hourlyData[hourKey] = (hourlyData[hourKey] || 0) + 1

      // Daily aggregation
      dailyData[dateStr] = (dailyData[dateStr] || 0) + 1
    })

    // Prepare analysis context
    const analysisContext = `
Dados históricos de entregas (últimos 30 dias):
- Total de entregas: ${historicalData.length}
- Média diária: ${(historicalData.length / 30).toFixed(1)}
- Média horária: ${(historicalData.length / (30 * 24)).toFixed(1)}

Distribuição por dia da semana:
${[0, 1, 2, 3, 4, 5, 6]
  .map((day) => {
    const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day]
    const count = Object.entries(hourlyData)
      .filter(([k]) => k.startsWith(`${day}-`))
      .reduce((sum, [, v]) => sum + v, 0)
    return `${dayName}: ${count} entregas`
  })
  .join('\n')}

Horários mais movimentados:
${Object.entries(hourlyData)
  .sort(([, a], [, b]) => b - a)
  .slice(0, 5)
  .map(([k, v]) => {
    const [day, hour] = k.split('-')
    const dayName = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][parseInt(day)]
    return `${dayName} ${hour}h: ${v} entregas`
  })
  .join('\n')}

Últimos 7 dias:
${Object.entries(dailyData)
  .slice(-7)
  .map(([date, count]) => `${date}: ${count} entregas`)
  .join('\n')}

Forneça previsões detalhadas e insights acionáveis.
    `

    const messages = [
      { role: 'system' as const, content: FORECAST_SYSTEM_PROMPT },
      { role: 'user' as const, content: analysisContext },
      {
        role: 'user' as const,
        content: `Gere previsões de demanda para as próximas 24 horas e 7 dias. Use os padrões históricos para estimar a demanda futura.`,
      },
    ]

    const result = await chatCompletion(messages, 'gpt-4o')

    if (!result.success) {
      throw new Error('Failed to generate forecast')
    }

    // Generate rule-based forecast as backup
    const now = new Date()
    const currentDayOfWeek = now.getDay()
    const currentHour = now.getHours()

    // Hourly forecast for next 24 hours
    const hourlyForecast = Array.from({ length: 24 }, (_, i) => {
      const futureHour = (currentHour + i) % 24
      const futureDayOfWeek = currentDayOfWeek + Math.floor((currentHour + i) / 24)
      const hourKey = `${futureDayOfWeek % 7}-${futureHour}`

      const historicalAvg = hourlyData[hourKey] || 0
      const weekAvg = Object.values(hourlyData).reduce((a, b) => a + b, 0) / Object.keys(hourlyData).length

      // Use historical avg if available, otherwise use weekly average
      const predicted = Math.max(1, Math.round(historicalAvg || weekAvg || 5))

      return {
        hour: `${String(futureHour).padStart(2, '0')}:00`,
        predicted,
        confidence: historicalAvg > 0 ? 85 : 60,
      }
    })

    // Daily forecast for next 7 days
    const dailyForecast = Array.from({ length: 7 }, (_, i) => {
      const futureDate = new Date(now.getTime() + i * 24 * 60 * 60 * 1000)
      const futureDayOfWeek = futureDate.getDay()

      // Calculate average for this day of week from historical data
      const dayPattern = Object.entries(hourlyData)
        .filter(([k]) => k.startsWith(`${futureDayOfWeek}-`))
        .reduce((sum, [, v]) => sum + v, 0)

      const predicted = Math.max(10, Math.round(dayPattern || historicalData.length / 30))

      return {
        date: futureDate.toISOString().split('T')[0],
        predicted,
        confidence: dayPattern > 0 ? 80 : 55,
      }
    })

    // Identify peak and low hours
    const hourlyAverages = Object.entries(hourlyData).reduce((acc, [k, v]) => {
      const hour = k.split('-')[1]
      acc[hour] = (acc[hour] || 0) + v
      return acc
    }, {} as Record<string, number>)

    const sortedHours = Object.entries(hourlyAverages).sort(([, a], [, b]) => b - a)
    const peakHours = sortedHours.slice(0, 3).map(([h]) => `${h}:00`)
    const lowHours = sortedHours.slice(-3).map(([h]) => `${h}:00`)

    // Generate insights
    const insights = [
      `Demanda média diária: ${(historicalData.length / 30).toFixed(1)} entregas`,
      `Horários de pico: ${peakHours.join(', ')}`,
      `Horários de baixa demanda: ${lowHours.join(', ')}`,
      `Tendência: ${
        dailyForecast[6].predicted > dailyForecast[0].predicted ? 'Crescimento' : 'Estável'
      }`,
    ]

    const recommendations = [
      `Mantenha ${Math.ceil(dailyForecast[0].predicted / 8)} motoristas disponíveis durante o dia`,
      `Aumente equipe em ${Math.ceil(dailyForecast[0].predicted * 0.3)} motoristas nos horários de pico`,
      `Considere promoções nos horários de baixa demanda (${lowHours.join(', ')})`,
      `Prepare-se para pico de ${dailyForecast.reduce((max, d) => Math.max(max, d.predicted), 0)} entregas`,
    ]

    const forecast: DemandForecast = {
      hourly: hourlyForecast,
      daily: dailyForecast,
      insights,
      recommendations,
      peakHours,
      lowHours,
    }

    // Save forecast
    await supabase.from('demand_forecasts').insert({
      forecast_data: forecast,
      generated_at: new Date().toISOString(),
      ai_analysis: result.message,
    })

    return NextResponse.json({
      success: true,
      forecast,
      aiAnalysis: result.message,
    })
  } catch (error) {
    console.error('Demand forecast error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate demand forecast' },
      { status: 500 }
    )
  }
}

// Get latest forecast
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: latestForecast } = await supabase
      .from('demand_forecasts')
      .select('*')
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()

    if (!latestForecast) {
      return NextResponse.json({
        success: false,
        error: 'No forecast available',
      })
    }

    return NextResponse.json({
      success: true,
      forecast: latestForecast.forecast_data,
      generatedAt: latestForecast.generated_at,
      aiAnalysis: latestForecast.ai_analysis,
    })
  } catch (error) {
    console.error('Get forecast error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get forecast' },
      { status: 500 }
    )
  }
}
