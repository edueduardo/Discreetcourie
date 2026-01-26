import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/middleware/rbac'

const COPILOT_SYSTEM_PROMPT = `Você é o Admin Copilot da DiscreetCourie, um assistente AI para administradores.

Suas capacidades:
- Análise de dados operacionais e financeiros
- Identificação de problemas e gargalos
- Sugestões de otimização e automação
- Insights baseados em métricas
- Alertas sobre situações críticas
- Recomendações de ações prioritárias

Diretrizes:
- Seja proativo e analítico
- Forneça dados concretos e números quando possível
- Priorize ações por impacto e urgência
- Seja direto mas cordial
- Sugira automações quando aplicável
- Alerte sobre riscos e oportunidades

Quando fornecer sugestões, estruture como:
{
  "type": "insight" | "warning" | "action",
  "title": "Título curto",
  "description": "Descrição detalhada",
  "priority": "high" | "medium" | "low"
}`

export async function POST(request: NextRequest) {
  // ✅ SECURITY: Only admins can use the copilot
  const authResult = await requireAdmin()
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const { message, context } = await request.json()
    const supabase = await createClient()

    // Get current operational data
    const [deliveriesResult, driversResult, revenueResult] = await Promise.all([
      supabase
        .from('deliveries')
        .select('status, created_at')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('drivers').select('status, name'),
      supabase
        .from('deliveries')
        .select('price')
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ])

    const deliveries = deliveriesResult.data || []
    const drivers = driversResult.data || []
    const weekRevenue =
      revenueResult.data?.reduce((sum, d) => sum + (d.price || 0), 0) || 0

    // Build context with operational data
    const operationalContext = `
Dados operacionais atuais:
- Entregas nas últimas 24h: ${deliveries.length}
- Entregas pendentes: ${deliveries.filter((d) => d.status === 'pending').length}
- Entregas em andamento: ${deliveries.filter((d) => d.status === 'in_transit').length}
- Entregas completadas: ${deliveries.filter((d) => d.status === 'completed').length}
- Motoristas disponíveis: ${drivers.filter((d) => d.status === 'available').length}/${drivers.length}
- Receita última semana: R$ ${weekRevenue.toFixed(2)}
    `

    const messages = [
      { role: 'system' as const, content: COPILOT_SYSTEM_PROMPT },
      { role: 'system' as const, content: operationalContext },
      ...context.map((m: any) => ({
        role: m.type === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: message },
    ]

    const result = await chatCompletion(messages, 'gpt-4o')

    if (!result.success) {
      throw new Error('Failed to get Copilot response')
    }

    // Try to parse suggestions from response
    let suggestions = undefined
    try {
      const suggestionMatch = result.message.match(/\[SUGGESTIONS\]([\s\S]*?)\[\/SUGGESTIONS\]/)
      if (suggestionMatch) {
        suggestions = JSON.parse(suggestionMatch[1])
      }
    } catch (e) {
      // No suggestions in response
    }

    // Generate intelligent suggestions based on data
    if (!suggestions && message.toLowerCase().includes('problema')) {
      suggestions = []

      // Check for pending deliveries
      const pendingCount = deliveries.filter((d) => d.status === 'pending').length
      if (pendingCount > 5) {
        suggestions.push({
          type: 'warning',
          title: `${pendingCount} entregas pendentes`,
          description: 'Há muitas entregas aguardando atribuição. Considere ativar mais motoristas.',
          priority: 'high',
        })
      }

      // Check driver availability
      const availableDrivers = drivers.filter((d) => d.status === 'available').length
      if (availableDrivers < drivers.length * 0.3) {
        suggestions.push({
          type: 'warning',
          title: 'Poucos motoristas disponíveis',
          description: `Apenas ${availableDrivers} de ${drivers.length} motoristas disponíveis. Pode haver sobrecarga.`,
          priority: 'high',
        })
      }

      // Revenue analysis
      if (weekRevenue < 1000) {
        suggestions.push({
          type: 'insight',
          title: 'Receita abaixo do esperado',
          description: 'Receita semanal baixa. Considere campanhas de marketing ou promoções.',
          priority: 'medium',
        })
      }
    }

    if (message.toLowerCase().includes('otimiza')) {
      suggestions = suggestions || []
      suggestions.push({
        type: 'action',
        title: 'Implementar roteamento inteligente',
        description: 'Use IA para otimizar rotas e reduzir tempo de entrega em até 25%.',
        priority: 'high',
      })
      suggestions.push({
        type: 'action',
        title: 'Automatizar atribuição de entregas',
        description: 'Configure regras automáticas para atribuir entregas aos motoristas mais próximos.',
        priority: 'medium',
      })
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      suggestions,
    })
  } catch (error) {
    console.error('Copilot API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
