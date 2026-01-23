import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'

interface SentimentAnalysis {
  sentiment: 'very_positive' | 'positive' | 'neutral' | 'negative' | 'very_negative'
  score: number // -1 to 1
  confidence: number // 0 to 100
  emotions: Array<{ emotion: string; intensity: number }>
  topics: string[]
  urgency: 'low' | 'medium' | 'high' | 'critical'
  actionRequired: boolean
  suggestedResponse?: string
  keywords: string[]
}

const SENTIMENT_ANALYSIS_PROMPT = `Você é um especialista em análise de sentimento e processamento de linguagem natural.

Analise o texto fornecido e identifique:

1. SENTIMENTO GERAL:
   - very_positive: Extremamente satisfeito, elogios
   - positive: Satisfeito, feedback positivo
   - neutral: Neutro, informativo
   - negative: Insatisfeito, reclamação leve
   - very_negative: Muito insatisfeito, raiva, frustração

2. SCORE NUMÉRICO: -1 (muito negativo) a 1 (muito positivo)

3. EMOÇÕES DETECTADAS:
   - Felicidade, Satisfação, Gratidão
   - Frustração, Raiva, Decepção
   - Preocupação, Ansiedade
   - Surpresa, Confusão
   (Intensidade: 0-100)

4. TÓPICOS PRINCIPAIS:
   - Qualidade do serviço
   - Atendimento
   - Preço
   - Pontualidade
   - Produto/Entrega

5. URGÊNCIA:
   - critical: Requer ação imediata
   - high: Requer atenção em breve
   - medium: Pode esperar
   - low: Apenas informativo

6. AÇÃO REQUERIDA: true/false
   - true se precisa resposta ou ação
   - false se apenas informativo

7. PALAVRAS-CHAVE: Termos importantes mencionados

Retorne análise estruturada em JSON.`

export async function POST(request: NextRequest) {
  try {
    const { text, source = 'feedback', referenceId } = await request.json()

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Text is required for analysis' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    // Prepare analysis request
    const analysisContext = `
Texto para análise:
"${text}"

Fonte: ${source}
Contexto: Feedback/avaliação de cliente sobre serviço de entrega courier.

Forneça análise completa em JSON estruturado.
    `

    const messages = [
      { role: 'system' as const, content: SENTIMENT_ANALYSIS_PROMPT },
      { role: 'user' as const, content: analysisContext },
    ]

    const result = await chatCompletion(messages, 'gpt-4o')

    if (!result.success) {
      throw new Error('Failed to analyze sentiment')
    }

    // Parse AI response
    let analysis: SentimentAnalysis
    try {
      const jsonMatch = result.message.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        analysis = {
          sentiment: parsed.sentiment || 'neutral',
          score: parsed.score || 0,
          confidence: parsed.confidence || 70,
          emotions: parsed.emotions || [],
          topics: parsed.topics || [],
          urgency: parsed.urgency || 'medium',
          actionRequired: parsed.actionRequired || false,
          suggestedResponse: parsed.suggestedResponse,
          keywords: parsed.keywords || [],
        }
      } else {
        throw new Error('No JSON in response')
      }
    } catch (e) {
      // Fallback to basic analysis
      const lowerText = text.toLowerCase()

      // Simple keyword-based sentiment detection
      const positiveWords = ['ótimo', 'excelente', 'bom', 'rápido', 'eficiente', 'satisfeito', 'recomendo', 'parabéns']
      const negativeWords = ['ruim', 'péssimo', 'lento', 'atrasado', 'problema', 'insatisfeito', 'horrível', 'nunca mais']

      const positiveCount = positiveWords.filter((w) => lowerText.includes(w)).length
      const negativeCount = negativeWords.filter((w) => lowerText.includes(w)).length

      let sentiment: SentimentAnalysis['sentiment'] = 'neutral'
      let score = 0

      if (positiveCount > negativeCount) {
        sentiment = positiveCount >= 3 ? 'very_positive' : 'positive'
        score = Math.min(1, positiveCount * 0.3)
      } else if (negativeCount > positiveCount) {
        sentiment = negativeCount >= 3 ? 'very_negative' : 'negative'
        score = Math.max(-1, -negativeCount * 0.3)
      }

      const urgency = negativeCount >= 2 ? 'high' : negativeCount > 0 ? 'medium' : 'low'

      analysis = {
        sentiment,
        score,
        confidence: 60,
        emotions: [],
        topics: [],
        urgency,
        actionRequired: negativeCount > 0,
        keywords: [...positiveWords, ...negativeWords].filter((w) => lowerText.includes(w)),
      }
    }

    // Generate suggested response if action is required
    if (analysis.actionRequired && !analysis.suggestedResponse) {
      const responsePrompt = `Gere uma resposta empática e profissional para este feedback: "${text}"`
      const responseResult = await chatCompletion(
        [
          {
            role: 'system' as const,
            content: 'Você é um atendente de suporte ao cliente cordial e profissional.',
          },
          { role: 'user' as const, content: responsePrompt },
        ],
        'gpt-4o-mini'
      )

      if (responseResult.success) {
        analysis.suggestedResponse = responseResult.message
      }
    }

    // Save analysis
    await supabase.from('sentiment_analyses').insert({
      reference_id: referenceId,
      source,
      text,
      sentiment: analysis.sentiment,
      score: analysis.score,
      confidence: analysis.confidence,
      emotions: analysis.emotions,
      topics: analysis.topics,
      urgency: analysis.urgency,
      action_required: analysis.actionRequired,
      keywords: analysis.keywords,
      analyzed_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      analysis,
      rawAnalysis: result.message,
    })
  } catch (error) {
    console.error('Sentiment analysis error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to analyze sentiment' },
      { status: 500 }
    )
  }
}

// Get sentiment statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    const { data: analyses } = await supabase
      .from('sentiment_analyses')
      .select('*')
      .gte('analyzed_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('analyzed_at', { ascending: false })

    const stats = {
      total: analyses?.length || 0,
      bysentiment: {
        very_positive: analyses?.filter((a) => a.sentiment === 'very_positive').length || 0,
        positive: analyses?.filter((a) => a.sentiment === 'positive').length || 0,
        neutral: analyses?.filter((a) => a.sentiment === 'neutral').length || 0,
        negative: analyses?.filter((a) => a.sentiment === 'negative').length || 0,
        very_negative: analyses?.filter((a) => a.sentiment === 'very_negative').length || 0,
      },
      averageScore: (analyses?.reduce((sum, a) => sum + (a.score || 0), 0) || 0) / (analyses?.length || 1),
      actionRequired: analyses?.filter((a) => a.action_required).length || 0,
      criticalUrgency: analyses?.filter((a) => a.urgency === 'critical').length || 0,
      topTopics: [] as Array<{ topic: string; count: number }>,
      topKeywords: [] as Array<{ keyword: string; count: number }>,
    }

    // Aggregate topics
    const topicCounts: Record<string, number> = {}
    analyses?.forEach((a) => {
      a.topics?.forEach((topic: string) => {
        topicCounts[topic] = (topicCounts[topic] || 0) + 1
      })
    })
    stats.topTopics = Object.entries(topicCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }))

    // Aggregate keywords
    const keywordCounts: Record<string, number> = {}
    analyses?.forEach((a) => {
      a.keywords?.forEach((keyword: string) => {
        keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1
      })
    })
    stats.topKeywords = Object.entries(keywordCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }))

    return NextResponse.json({
      success: true,
      stats,
      recentAnalyses: analyses?.slice(0, 20) || [],
    })
  } catch (error) {
    console.error('Get sentiment stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get statistics' },
      { status: 500 }
    )
  }
}
