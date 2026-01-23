import { NextRequest, NextResponse } from 'next/server'
import { chatCompletion } from '@/lib/openai'

type ContentType =
  | 'email_marketing'
  | 'sms_campaign'
  | 'social_media'
  | 'blog_post'
  | 'product_description'
  | 'push_notification'
  | 'customer_support'
  | 'promotional_banner'

interface ContentRequest {
  type: ContentType
  topic?: string
  tone?: 'professional' | 'casual' | 'friendly' | 'urgent' | 'promotional'
  length?: 'short' | 'medium' | 'long'
  audience?: 'customers' | 'drivers' | 'business' | 'general'
  keywords?: string[]
  context?: string
}

interface GeneratedContent {
  content: string
  subject?: string
  hashtags?: string[]
  callToAction?: string
  variations?: string[]
  seoScore?: number
}

const CONTENT_GENERATION_PROMPTS: Record<ContentType, string> = {
  email_marketing: `Crie um email marketing profissional e persuasivo para uma empresa de entregas courier.
Inclua:
- Assunto atraente (menos de 50 caracteres)
- Saudação personalizada
- Corpo do email com proposta de valor clara
- Call-to-action (CTA) forte
- Assinatura profissional
Formato: JSON com "subject", "body", "cta"`,

  sms_campaign: `Crie uma mensagem SMS curta e impactante (máximo 160 caracteres).
Deve ser:
- Direta ao ponto
- Com senso de urgência se aplicável
- Incluir call-to-action claro
- Friendly e profissional
Formato: Texto puro, máximo 160 caracteres`,

  social_media: `Crie um post para redes sociais (Instagram, Facebook, LinkedIn).
Inclua:
- Texto cativante e engajador
- Emojis apropriados
- Hashtags relevantes (5-10)
- Call-to-action
- Tom conversacional
Formato: JSON com "content", "hashtags", "cta"`,

  blog_post: `Crie um artigo de blog informativo e otimizado para SEO.
Estrutura:
- Título chamativo (H1)
- Introdução envolvente
- Subtítulos (H2/H3)
- Conteúdo com 3-5 parágrafos
- Conclusão com CTA
- Palavras-chave naturalmente inseridas
Formato: Markdown`,

  product_description: `Crie uma descrição de produto/serviço persuasiva.
Inclua:
- Título do produto
- Benefícios principais (3-5)
- Recursos técnicos
- Proposta de valor única
- CTA para compra/contratação
Formato: JSON com "title", "benefits", "features", "cta"`,

  push_notification: `Crie uma notificação push mobile efetiva.
Características:
- Título curto (máximo 65 caracteres)
- Mensagem clara (máximo 240 caracteres)
- Ação clara
- Senso de urgência quando apropriado
Formato: JSON com "title", "body", "action"`,

  customer_support: `Crie uma resposta de suporte ao cliente empática e útil.
Tom:
- Profissional e cordial
- Empático com o problema
- Solução clara e prática
- Próximos passos definidos
Formato: Texto corrido`,

  promotional_banner: `Crie texto para banner promocional.
Características:
- Headline chamativo (máximo 10 palavras)
- Subheadline com benefício (máximo 15 palavras)
- CTA direto (máximo 5 palavras)
- Desconto/oferta destacado
Formato: JSON com "headline", "subheadline", "cta", "offer"`,
}

export async function POST(request: NextRequest) {
  try {
    const contentRequest: ContentRequest = await request.json()
    const { type, topic, tone = 'professional', length = 'medium', audience = 'customers', keywords = [], context } = contentRequest

    if (!type) {
      return NextResponse.json(
        { success: false, error: 'Content type is required' },
        { status: 400 }
      )
    }

    const systemPrompt = CONTENT_GENERATION_PROMPTS[type]

    const userPrompt = `
Crie conteúdo sobre: ${topic || 'serviços de entrega courier DiscreetCourie'}
Tom: ${tone}
Tamanho: ${length}
Público-alvo: ${audience}
${keywords.length > 0 ? `Palavras-chave: ${keywords.join(', ')}` : ''}
${context ? `Contexto adicional: ${context}` : ''}

Informações da empresa:
- Nome: DiscreetCourie
- Serviço: Entregas courier expressas e discretas
- Diferenciais: Rapidez, segurança, rastreamento em tempo real, disponível 24/7
- Valores: Confiabilidade, discrição, eficiência

Gere conteúdo de alta qualidade, persuasivo e adaptado ao público.
    `

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content: userPrompt },
    ]

    const result = await chatCompletion(messages, 'gpt-4o')

    if (!result.success) {
      throw new Error('Failed to generate content')
    }

    // Try to parse JSON response
    let generatedContent: GeneratedContent
    try {
      const jsonMatch = result.message.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        generatedContent = {
          content: parsed.body || parsed.content || result.message,
          subject: parsed.subject,
          hashtags: parsed.hashtags,
          callToAction: parsed.cta || parsed.action,
          variations: [],
        }
      } else {
        generatedContent = {
          content: result.message,
        }
      }
    } catch (e) {
      generatedContent = {
        content: result.message,
      }
    }

    // Generate variations for some content types
    if (['email_marketing', 'sms_campaign', 'social_media'].includes(type)) {
      const variationsPrompt = 'Crie 2 variações diferentes deste conteúdo mantendo o mesmo objetivo.'
      const variationsResult = await chatCompletion(
        [
          ...messages,
          { role: 'assistant' as const, content: result.message },
          { role: 'user' as const, content: variationsPrompt },
        ],
        'gpt-4o-mini'
      )

      if (variationsResult.success) {
        // Parse variations
        const lines = variationsResult.message.split('\n\n').filter((l) => l.trim())
        generatedContent.variations = lines.slice(0, 2)
      }
    }

    // Calculate simple SEO score for blog posts
    if (type === 'blog_post' && keywords.length > 0) {
      const content = generatedContent.content.toLowerCase()
      const keywordMatches = keywords.filter((kw) => content.includes(kw.toLowerCase()))
      const seoScore = Math.min(100, (keywordMatches.length / keywords.length) * 100)
      generatedContent.seoScore = Math.round(seoScore)
    }

    return NextResponse.json({
      success: true,
      generated: generatedContent,
      metadata: {
        type,
        tone,
        length,
        audience,
        generatedAt: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error('Content generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}

// Get content generation stats
export async function GET(request: NextRequest) {
  try {
    // This would track usage stats in production
    return NextResponse.json({
      success: true,
      stats: {
        totalGenerated: 0,
        byType: {},
        popular: [],
      },
    })
  } catch (error) {
    console.error('Get stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get statistics' },
      { status: 500 }
    )
  }
}
