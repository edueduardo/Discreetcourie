import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'

interface TicketAnalysis {
  category: 'delivery_issue' | 'payment' | 'account' | 'technical' | 'complaint' | 'inquiry' | 'other'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  sentiment: 'positive' | 'neutral' | 'negative'
  estimatedResolutionTime: number // minutes
  suggestedAssignee: 'support_l1' | 'support_l2' | 'manager' | 'technical'
  suggestedResponse: string
  tags: string[]
  requiresEscalation: boolean
}

const SUPPORT_TICKET_PROMPT = `Você é um especialista em análise e triagem de tickets de suporte ao cliente.

Analise o ticket e forneça:
1. CATEGORIA:
   - delivery_issue: Problemas com entrega
   - payment: Questões de pagamento
   - account: Problemas de conta
   - technical: Problemas técnicos
   - complaint: Reclamações
   - inquiry: Consultas gerais

2. PRIORIDADE:
   - urgent: Requer ação imediata (< 1h)
   - high: Resolver em 4h
   - medium: Resolver em 24h
   - low: Resolver em 48h

3. SENTIMENTO: positive, neutral, negative

4. TEMPO ESTIMADO DE RESOLUÇÃO (minutos)

5. ATRIBUIÇÃO SUGERIDA:
   - support_l1: Suporte nível 1 (questões simples)
   - support_l2: Suporte nível 2 (questões complexas)
   - manager: Gerente (escalações)
   - technical: Time técnico (bugs)

6. RESPOSTA SUGERIDA: Template de resposta personalizado

7. TAGS: Palavras-chave relevantes

8. REQUER ESCALAÇÃO: true/false

Forneça análise em JSON estruturado.`

export async function POST(request: NextRequest) {
  try {
    const { subject, description, customerId, ticketId } = await request.json()

    if (!description) {
      return NextResponse.json(
        { success: false, error: 'Ticket description is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Get customer history for context
    let customerContext = ''
    if (customerId) {
      const { data: customer } = await supabase
        .from('customers')
        .select('name, email, created_at')
        .eq('id', customerId)
        .single()

      const { data: tickets } = await supabase
        .from('support_tickets')
        .select('id, status, priority')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: false })
        .limit(5)

      customerContext = `
Cliente: ${customer?.name || 'N/A'} (${customer?.email || 'N/A'})
Cliente desde: ${customer?.created_at ? new Date(customer.created_at).toLocaleDateString() : 'N/A'}
Tickets anteriores: ${tickets?.length || 0}
      `
    }

    const ticketContext = `
Assunto: ${subject || 'N/A'}
Descrição: ${description}

${customerContext}

Analise o ticket e forneça triagem completa.
    `

    const messages = [
      { role: 'system' as const, content: SUPPORT_TICKET_PROMPT },
      { role: 'user' as const, content: ticketContext },
    ]

    const result = await chatCompletion(messages, 'gpt-4o')

    if (!result.success) {
      throw new Error('Failed to analyze ticket')
    }

    // Parse response
    let analysis: TicketAnalysis
    try {
      const jsonMatch = result.message.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        analysis = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON in response')
      }
    } catch (e) {
      // Fallback analysis
      const lowerDesc = description.toLowerCase()

      let category: TicketAnalysis['category'] = 'inquiry'
      if (lowerDesc.includes('entrega') || lowerDesc.includes('delivery')) category = 'delivery_issue'
      else if (lowerDesc.includes('pagamento') || lowerDesc.includes('payment')) category = 'payment'
      else if (lowerDesc.includes('conta') || lowerDesc.includes('account')) category = 'account'
      else if (lowerDesc.includes('bug') || lowerDesc.includes('erro')) category = 'technical'
      else if (lowerDesc.includes('reclamação') || lowerDesc.includes('insatisfeito')) category = 'complaint'

      const hasUrgentWords = lowerDesc.includes('urgente') || lowerDesc.includes('imediato')
      const priority: TicketAnalysis['priority'] = hasUrgentWords ? 'urgent' : category === 'complaint' ? 'high' : 'medium'

      analysis = {
        category,
        priority,
        sentiment: category === 'complaint' ? 'negative' : 'neutral',
        estimatedResolutionTime: priority === 'urgent' ? 30 : priority === 'high' ? 240 : 1440,
        suggestedAssignee: category === 'technical' ? 'technical' : priority === 'urgent' ? 'manager' : 'support_l1',
        suggestedResponse: result.message,
        tags: [category, priority],
        requiresEscalation: priority === 'urgent' || category === 'complaint',
      }
    }

    // Save analysis if ticket ID provided
    if (ticketId) {
      await supabase.from('support_tickets').update({
        category: analysis.category,
        priority: analysis.priority,
        estimated_resolution_time: analysis.estimatedResolutionTime,
        assigned_to: analysis.suggestedAssignee,
        tags: analysis.tags,
        ai_analysis: result.message,
        updated_at: new Date().toISOString(),
      }).eq('id', ticketId)
    }

    return NextResponse.json({
      success: true,
      analysis,
      aiSuggestion: result.message,
    })
  } catch (error) {
    console.error('Support ticket analysis error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to analyze ticket' },
      { status: 500 }
    )
  }
}

// Auto-respond to simple tickets
export async function PUT(request: NextRequest) {
  try {
    const { ticketId, customerMessage } = await request.json()

    if (!customerMessage) {
      return NextResponse.json(
        { success: false, error: 'Customer message is required' },
        { status: 400 }
      )
    }

    const responsePrompt = `Cliente perguntou: "${customerMessage}"

Gere uma resposta profissional, empática e útil para o cliente da DiscreetCourie.
Seja conciso (máximo 3 parágrafos) e forneça solução clara.`

    const messages = [
      {
        role: 'system' as const,
        content: 'Você é um atendente de suporte ao cliente experiente e empático da DiscreetCourie.',
      },
      { role: 'user' as const, content: responsePrompt },
    ]

    const result = await chatCompletion(messages, 'gpt-4o-mini')

    if (!result.success) {
      throw new Error('Failed to generate response')
    }

    return NextResponse.json({
      success: true,
      response: result.message,
    })
  } catch (error) {
    console.error('Auto-response error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}

// Get support statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: tickets } = await supabase
      .from('support_tickets')
      .select('*')
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })

    const stats = {
      total: tickets?.length || 0,
      byCategory: {
        delivery_issue: tickets?.filter((t) => t.category === 'delivery_issue').length || 0,
        payment: tickets?.filter((t) => t.category === 'payment').length || 0,
        account: tickets?.filter((t) => t.category === 'account').length || 0,
        technical: tickets?.filter((t) => t.category === 'technical').length || 0,
        complaint: tickets?.filter((t) => t.category === 'complaint').length || 0,
        inquiry: tickets?.filter((t) => t.category === 'inquiry').length || 0,
        other: tickets?.filter((t) => t.category === 'other').length || 0,
      },
      byPriority: {
        urgent: tickets?.filter((t) => t.priority === 'urgent').length || 0,
        high: tickets?.filter((t) => t.priority === 'high').length || 0,
        medium: tickets?.filter((t) => t.priority === 'medium').length || 0,
        low: tickets?.filter((t) => t.priority === 'low').length || 0,
      },
      avgResolutionTime: (tickets?.reduce((sum, t) => sum + (t.estimated_resolution_time || 0), 0) || 0) / (tickets?.length || 1),
    }

    return NextResponse.json({
      success: true,
      stats,
      recentTickets: tickets?.slice(0, 20) || [],
    })
  } catch (error) {
    console.error('Get support stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get statistics' },
      { status: 500 }
    )
  }
}
