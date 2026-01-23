import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'

interface FraudAnalysis {
  riskScore: number // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  flags: string[]
  recommendation: 'approve' | 'review' | 'reject'
  explanation: string
}

const FRAUD_DETECTION_PROMPT = `Você é um especialista em detecção de fraudes para uma empresa de entregas courier.

Analise os dados fornecidos e identifique possíveis sinais de fraude:

Indicadores de risco:
- Múltiplos pedidos do mesmo IP/dispositivo em curto período
- Endereços suspeitos ou não verificáveis
- Padrões de comportamento anormais
- Valores muito altos ou muito baixos
- Horários incomuns (madrugada)
- Informações inconsistentes
- CPF/CNPJ inválidos ou bloqueados
- Histórico de chargebacks
- Pedidos para áreas de risco
- Métodos de pagamento suspeitos

Retorne uma análise estruturada em JSON:
{
  "riskScore": 0-100,
  "riskLevel": "low" | "medium" | "high" | "critical",
  "flags": ["flag1", "flag2"],
  "recommendation": "approve" | "review" | "reject",
  "explanation": "Explicação detalhada"
}`

export async function POST(request: NextRequest) {
  try {
    const { deliveryId, customerId, orderData } = await request.json()
    const supabase = await createClient()

    // Get customer history
    const { data: customerHistory } = await supabase
      .from('deliveries')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get recent orders from same IP (if available)
    const recentOrders = customerHistory || []

    // Build analysis context
    const analysisContext = `
Dados do pedido atual:
${JSON.stringify(orderData, null, 2)}

Histórico do cliente:
- Total de pedidos: ${recentOrders.length}
- Pedidos completados: ${recentOrders.filter((d) => d.status === 'completed').length}
- Pedidos cancelados: ${recentOrders.filter((d) => d.status === 'cancelled').length}
- Valor médio: R$ ${(recentOrders.reduce((sum, d) => sum + (d.price || 0), 0) / recentOrders.length || 0).toFixed(2)}

Pedidos recentes nas últimas 24h: ${recentOrders.filter(
      (d) => new Date(d.created_at).getTime() > Date.now() - 24 * 60 * 60 * 1000
    ).length}
    `

    const messages = [
      { role: 'system' as const, content: FRAUD_DETECTION_PROMPT },
      { role: 'user' as const, content: analysisContext },
    ]

    const result = await chatCompletion(messages, 'gpt-4o')

    if (!result.success) {
      throw new Error('Failed to analyze fraud risk')
    }

    // Parse AI response
    let analysis: FraudAnalysis
    try {
      // Try to extract JSON from response
      const jsonMatch = result.message.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (e) {
      // Fallback to basic analysis
      analysis = {
        riskScore: 30,
        riskLevel: 'low',
        flags: [],
        recommendation: 'approve',
        explanation: result.message,
      }
    }

    // Additional rule-based checks
    const additionalFlags: string[] = []

    // Check for multiple orders in short time
    const ordersLast1Hour = recentOrders.filter(
      (d) => new Date(d.created_at).getTime() > Date.now() - 60 * 60 * 1000
    )
    if (ordersLast1Hour.length > 3) {
      additionalFlags.push('Múltiplos pedidos em 1 hora')
      analysis.riskScore = Math.min(100, analysis.riskScore + 20)
    }

    // Check for high value
    if (orderData.price && orderData.price > 500) {
      additionalFlags.push('Valor acima da média')
      analysis.riskScore = Math.min(100, analysis.riskScore + 10)
    }

    // Check for late night orders
    const hour = new Date().getHours()
    if (hour >= 1 && hour <= 5) {
      additionalFlags.push('Pedido em horário incomum (madrugada)')
      analysis.riskScore = Math.min(100, analysis.riskScore + 5)
    }

    // Merge flags
    analysis.flags = [...analysis.flags, ...additionalFlags]

    // Update risk level based on final score
    if (analysis.riskScore >= 80) {
      analysis.riskLevel = 'critical'
      analysis.recommendation = 'reject'
    } else if (analysis.riskScore >= 60) {
      analysis.riskLevel = 'high'
      analysis.recommendation = 'review'
    } else if (analysis.riskScore >= 40) {
      analysis.riskLevel = 'medium'
      analysis.recommendation = 'review'
    } else {
      analysis.riskLevel = 'low'
      analysis.recommendation = 'approve'
    }

    // Log fraud check
    await supabase.from('fraud_checks').insert({
      delivery_id: deliveryId,
      customer_id: customerId,
      risk_score: analysis.riskScore,
      risk_level: analysis.riskLevel,
      flags: analysis.flags,
      recommendation: analysis.recommendation,
      explanation: analysis.explanation,
      checked_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      analysis,
    })
  } catch (error) {
    console.error('Fraud detection error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to analyze fraud risk' },
      { status: 500 }
    )
  }
}

// Endpoint to get fraud statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: checks } = await supabase
      .from('fraud_checks')
      .select('*')
      .gte('checked_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('checked_at', { ascending: false })

    const stats = {
      total: checks?.length || 0,
      low: checks?.filter((c) => c.risk_level === 'low').length || 0,
      medium: checks?.filter((c) => c.risk_level === 'medium').length || 0,
      high: checks?.filter((c) => c.risk_level === 'high').length || 0,
      critical: checks?.filter((c) => c.risk_level === 'critical').length || 0,
      approved: checks?.filter((c) => c.recommendation === 'approve').length || 0,
      reviewed: checks?.filter((c) => c.recommendation === 'review').length || 0,
      rejected: checks?.filter((c) => c.recommendation === 'reject').length || 0,
    }

    return NextResponse.json({
      success: true,
      stats,
      recentChecks: checks?.slice(0, 10) || [],
    })
  } catch (error) {
    console.error('Fraud stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get fraud statistics' },
      { status: 500 }
    )
  }
}
