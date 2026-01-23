import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/openai'

const SYSTEM_PROMPT = `Você é um assistente virtual da DiscreetCourie, uma empresa de entregas courier.

Suas responsabilidades:
- Ajudar clientes com rastreamento de pedidos
- Responder dúvidas sobre preços e prazos
- Orientar sobre como fazer um novo pedido
- Resolver problemas e reclamações com empatia
- Fornecer informações sobre áreas de cobertura
- Explicar políticas de entrega

Diretrizes:
- Seja sempre cordial, profissional e prestativo
- Use linguagem clara e objetiva em português brasileiro
- Se não souber algo, seja honesto e ofereça alternativas
- Mantenha as respostas concisas mas completas
- Priorize a satisfação do cliente
- Para problemas complexos, sugira contato com suporte humano

Informações da empresa:
- Nome: DiscreetCourie
- Serviço: Entregas courier expressas e discretas
- Áreas: Grandes centros urbanos
- Horário: 24/7 disponível para pedidos
- Suporte: Chat, telefone e email disponíveis`

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { success: false, error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    // Add system prompt
    const fullMessages = [
      { role: 'system' as const, content: SYSTEM_PROMPT },
      ...messages,
    ]

    // Get AI response
    const result = await chatCompletion(fullMessages, 'gpt-4o-mini')

    if (!result.success) {
      throw new Error('Failed to get AI response')
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      usage: result.usage,
    })
  } catch (error) {
    console.error('AI Chat API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
