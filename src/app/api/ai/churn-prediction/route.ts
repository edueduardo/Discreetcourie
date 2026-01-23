import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'

interface ChurnPrediction {
  customerId: string
  churnRisk: 'very_low' | 'low' | 'medium' | 'high' | 'very_high'
  churnScore: number // 0-100 (probability of churning)
  confidence: number // 0-100
  riskFactors: Array<{
    factor: string
    impact: 'high' | 'medium' | 'low'
    description: string
  }>
  retentionStrategy: {
    priority: 'urgent' | 'high' | 'medium' | 'low'
    suggestedActions: string[]
    discountRecommendation?: number // percentage
    personalizedMessage?: string
  }
  customerSegment: string
  lifetimeValue: number
  daysUntilPredictedChurn?: number
}

const CHURN_PREDICTION_PROMPT = `Você é um especialista em análise preditiva de churn (evasão de clientes) usando machine learning.

Analise os dados do cliente e prediga:

1. RISCO DE CHURN (0-100):
   - 0-20: very_low (cliente fiel)
   - 21-40: low (satisfeito)
   - 41-60: medium (em risco)
   - 61-80: high (provável churn)
   - 81-100: very_high (churn iminente)

2. FATORES DE RISCO:
   - Frequência decrescente de pedidos
   - Tempo desde último pedido
   - Feedback negativo
   - Problemas não resolvidos
   - Mudança de comportamento
   - Comparação com concorrentes
   - Valor médio de pedido diminuindo

3. ESTRATÉGIA DE RETENÇÃO:
   - Ações prioritárias
   - Desconto recomendado (se aplicável)
   - Mensagem personalizada
   - Timing de abordagem

4. SEGMENTO DO CLIENTE:
   - VIP (high value, high frequency)
   - Regular (medium value, medium frequency)
   - Ocasional (low frequency)
   - Novo (< 3 meses)
   - Em risco (showing churn signals)

Considere:
- Recência: Tempo desde último pedido
- Frequência: Número de pedidos no período
- Monetário: Valor total gasto
- Engagement: Interações com app/email
- Satisfação: NPS, reviews, feedback

Retorne análise em JSON estruturado.`

export async function POST(request: NextRequest) {
  try {
    const { customerId } = await request.json()

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get customer data
    const { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single()

    if (!customer) {
      return NextResponse.json(
        { success: false, error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Get delivery history
    const { data: deliveries } = await supabase
      .from('deliveries')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    const allDeliveries = deliveries || []
    const recentDeliveries = allDeliveries.filter(
      (d) => new Date(d.created_at).getTime() > Date.now() - 90 * 24 * 60 * 60 * 1000
    )

    // Calculate RFM metrics
    const daysSinceLastOrder = allDeliveries.length > 0
      ? Math.floor((Date.now() - new Date(allDeliveries[0].created_at).getTime()) / (24 * 60 * 60 * 1000))
      : 999

    const orderFrequency = recentDeliveries.length
    const totalSpent = allDeliveries.reduce((sum, d) => sum + (d.price || 0), 0)
    const averageOrderValue = totalSpent / (allDeliveries.length || 1)

    // Get feedback/ratings
    const { data: feedbacks } = await supabase
      .from('feedback')
      .select('rating, comment')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(5)

    const averageRating = (feedbacks?.reduce((sum, f) => sum + (f.rating || 0), 0) || 0) / (feedbacks?.length || 1)
    const hasNegativeFeedback = feedbacks?.some((f) => f.rating && f.rating < 3) || false

    // Calculate customer lifetime value
    const lifetimeValue = totalSpent
    const monthsActive = allDeliveries.length > 0
      ? (Date.now() - new Date(allDeliveries[allDeliveries.length - 1].created_at).getTime()) / (30 * 24 * 60 * 60 * 1000)
      : 1

    // Prepare context for AI
    const customerContext = `
Dados do cliente para análise de churn:

ID: ${customerId}
Email: ${customer.email}
Nome: ${customer.name || 'N/A'}

MÉTRICAS RFM:
- Recência: ${daysSinceLastOrder} dias desde último pedido
- Frequência: ${orderFrequency} pedidos nos últimos 90 dias (total: ${allDeliveries.length})
- Monetário: R$ ${totalSpent.toFixed(2)} total (média: R$ ${averageOrderValue.toFixed(2)}/pedido)

ENGAGEMENT:
- Tempo como cliente: ${monthsActive.toFixed(1)} meses
- Rating médio: ${averageRating.toFixed(1)}/5 (${feedbacks?.length || 0} avaliações)
- Feedback negativo: ${hasNegativeFeedback ? 'SIM' : 'NÃO'}

COMPORTAMENTO RECENTE:
- Pedidos últimos 30 dias: ${recentDeliveries.filter(d => new Date(d.created_at).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000).length}
- Pedidos últimos 60 dias: ${recentDeliveries.filter(d => new Date(d.created_at).getTime() > Date.now() - 60 * 24 * 60 * 60 * 1000).length}
- Pedidos últimos 90 dias: ${recentDeliveries.length}

TENDÊNCIAS:
- ${daysSinceLastOrder > 30 ? '⚠️ Não faz pedidos há mais de 30 dias' : '✅ Cliente ativo recentemente'}
- ${orderFrequency < 2 ? '⚠️ Baixa frequência de pedidos' : '✅ Boa frequência'}
- ${hasNegativeFeedback ? '⚠️ Tem feedback negativo' : '✅ Feedback positivo'}
- ${averageOrderValue < 30 ? '⚠️ Baixo valor médio de pedido' : '✅ Bom valor médio'}

Lifetime Value: R$ ${lifetimeValue.toFixed(2)}

Forneça análise completa de risco de churn e estratégia de retenção.
    `

    const messages = [
      { role: 'system' as const, content: CHURN_PREDICTION_PROMPT },
      { role: 'user' as const, content: customerContext },
    ]

    const result = await chatCompletion(messages, 'gpt-4o')

    if (!result.success) {
      throw new Error('Failed to predict churn')
    }

    // Parse AI response
    let prediction: ChurnPrediction
    try {
      const jsonMatch = result.message.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        prediction = {
          customerId,
          churnRisk: parsed.churnRisk || 'medium',
          churnScore: parsed.churnScore || 50,
          confidence: parsed.confidence || 70,
          riskFactors: parsed.riskFactors || [],
          retentionStrategy: parsed.retentionStrategy || {
            priority: 'medium',
            suggestedActions: [],
          },
          customerSegment: parsed.customerSegment || 'Regular',
          lifetimeValue,
          daysUntilPredictedChurn: parsed.daysUntilPredictedChurn,
        }
      } else {
        throw new Error('No JSON in response')
      }
    } catch (e) {
      // Fallback to rule-based prediction
      let churnScore = 0

      // Recency factor (40% weight)
      if (daysSinceLastOrder > 60) churnScore += 40
      else if (daysSinceLastOrder > 30) churnScore += 25
      else if (daysSinceLastOrder > 14) churnScore += 10

      // Frequency factor (30% weight)
      if (orderFrequency === 0) churnScore += 30
      else if (orderFrequency < 2) churnScore += 20
      else if (orderFrequency < 5) churnScore += 10

      // Feedback factor (20% weight)
      if (hasNegativeFeedback) churnScore += 20
      else if (averageRating < 3.5) churnScore += 15
      else if (averageRating < 4.0) churnScore += 5

      // Value factor (10% weight)
      if (averageOrderValue < 20) churnScore += 10
      else if (averageOrderValue < 30) churnScore += 5

      const churnRisk: ChurnPrediction['churnRisk'] =
        churnScore >= 80 ? 'very_high' :
        churnScore >= 60 ? 'high' :
        churnScore >= 40 ? 'medium' :
        churnScore >= 20 ? 'low' : 'very_low'

      const riskFactors = []
      if (daysSinceLastOrder > 30) riskFactors.push({
        factor: 'Inatividade prolongada',
        impact: 'high' as const,
        description: `Sem pedidos há ${daysSinceLastOrder} dias`
      })
      if (orderFrequency < 2) riskFactors.push({
        factor: 'Baixa frequência',
        impact: 'medium' as const,
        description: `Apenas ${orderFrequency} pedidos em 90 dias`
      })
      if (hasNegativeFeedback) riskFactors.push({
        factor: 'Feedback negativo',
        impact: 'high' as const,
        description: 'Cliente deixou avaliações negativas'
      })

      prediction = {
        customerId,
        churnRisk,
        churnScore,
        confidence: 75,
        riskFactors,
        retentionStrategy: {
          priority: churnScore >= 60 ? 'urgent' : churnScore >= 40 ? 'high' : 'medium',
          suggestedActions: [
            'Enviar email personalizado com oferta especial',
            'Ligar para entender necessidades atuais',
            churnScore >= 60 ? 'Oferecer desconto de reativação (15-20%)' : 'Oferecer cupom de incentivo (10%)',
          ],
          discountRecommendation: churnScore >= 60 ? 20 : churnScore >= 40 ? 15 : 10,
        },
        customerSegment: lifetimeValue > 500 ? 'VIP' : orderFrequency > 10 ? 'Regular' : 'Ocasional',
        lifetimeValue,
        daysUntilPredictedChurn: churnScore >= 80 ? 7 : churnScore >= 60 ? 30 : churnScore >= 40 ? 60 : undefined,
      }
    }

    // Save prediction
    await supabase.from('churn_predictions').insert({
      customer_id: customerId,
      churn_risk: prediction.churnRisk,
      churn_score: prediction.churnScore,
      confidence: prediction.confidence,
      risk_factors: prediction.riskFactors,
      retention_strategy: prediction.retentionStrategy,
      customer_segment: prediction.customerSegment,
      lifetime_value: prediction.lifetimeValue,
      predicted_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      prediction,
      aiAnalysis: result.message,
    })
  } catch (error) {
    console.error('Churn prediction error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to predict churn' },
      { status: 500 }
    )
  }
}

// Get churn statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: predictions } = await supabase
      .from('churn_predictions')
      .select('*')
      .gte('predicted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('predicted_at', { ascending: false })

    const stats = {
      total: predictions?.length || 0,
      byRisk: {
        very_high: predictions?.filter((p) => p.churn_risk === 'very_high').length || 0,
        high: predictions?.filter((p) => p.churn_risk === 'high').length || 0,
        medium: predictions?.filter((p) => p.churn_risk === 'medium').length || 0,
        low: predictions?.filter((p) => p.churn_risk === 'low').length || 0,
        very_low: predictions?.filter((p) => p.churn_risk === 'very_low').length || 0,
      },
      averageChurnScore: (predictions?.reduce((sum, p) => sum + (p.churn_score || 0), 0) || 0) / (predictions?.length || 1),
      urgentActions: predictions?.filter((p) => p.retention_strategy?.priority === 'urgent').length || 0,
      totalLifetimeValueAtRisk: predictions
        ?.filter((p) => p.churn_risk === 'high' || p.churn_risk === 'very_high')
        .reduce((sum, p) => sum + (p.lifetime_value || 0), 0) || 0,
    }

    return NextResponse.json({
      success: true,
      stats,
      highRiskCustomers: predictions?.filter((p) => p.churn_score >= 60).slice(0, 20) || [],
    })
  } catch (error) {
    console.error('Get churn stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get statistics' },
      { status: 500 }
    )
  }
}
