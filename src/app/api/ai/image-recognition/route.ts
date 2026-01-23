import { NextRequest, NextResponse } from 'next/server'
import { analyzeImage } from '@/lib/openai'
import { createClient } from '@/lib/supabase/server'

interface ImageAnalysis {
  type: 'package' | 'signature' | 'damage' | 'location' | 'general'
  confidence: number
  findings: Array<{
    category: string
    description: string
    confidence: number
    severity?: 'low' | 'medium' | 'high'
  }>
  labels: string[]
  text?: string // OCR extracted text
  actionRequired: boolean
  suggestedAction?: string
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const analysisType = (formData.get('type') as string) || 'general'
    const deliveryId = formData.get('deliveryId') as string
    const customPrompt = formData.get('prompt') as string

    if (!imageFile) {
      return NextResponse.json(
        { success: false, error: 'Image file is required' },
        { status: 400 }
      )
    }

    // Convert image to base64
    const bytes = await imageFile.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const base64 = buffer.toString('base64')
    const imageUrl = `data:${imageFile.type};base64,${base64}`

    // Prepare prompt based on analysis type
    let prompt = customPrompt || ''

    switch (analysisType) {
      case 'package':
        prompt = `Analise esta foto de um pacote/encomenda e identifique:
1. Condição do pacote (intacto, danificado, amassado, rasgado, molhado)
2. Tamanho aproximado (pequeno, médio, grande)
3. Tipo de embalagem (caixa, envelope, saco)
4. Qualidade da embalagem
5. Possíveis problemas ou danos
6. Requer ação imediata? (sim/não)
Forneça análise detalhada em JSON.`
        break

      case 'signature':
        prompt = `Analise esta foto de assinatura/comprovante de entrega e identifique:
1. A assinatura é legível?
2. Há nome escrito?
3. Há data/hora?
4. Qualidade da foto
5. É uma assinatura válida para comprovação?
6. Possíveis problemas (ilegível, incompleta, suspeita)
Forneça análise em JSON.`
        break

      case 'damage':
        prompt = `Analise esta foto procurando por DANOS no pacote:
1. Tipo de dano (amassado, rasgado, molhado, quebrado, aberto)
2. Severidade (baixa, média, alta)
3. Extensão do dano (localizado, generalizado)
4. Produto interno pode estar afetado?
5. Foto serve como comprovação?
6. Recomendação (aceitar, recusar, reportar)
Forneça análise detalhada em JSON.`
        break

      case 'location':
        prompt = `Analise esta foto do local de entrega:
1. É um endereço residencial ou comercial?
2. Há números/identificação visível?
3. Condições de acesso (fácil, difícil, portaria)
4. Segurança do local (seguro, risco médio, arriscado)
5. Local apropriado para deixar pacote?
6. Observações sobre o ambiente
Forneça análise em JSON.`
        break

      default:
        prompt = `Analise esta imagem e descreva:
1. O que você vê na imagem
2. Elementos principais
3. Possíveis problemas ou anomalias
4. Texto visível (OCR)
5. Qualidade da imagem
6. Relevância para serviço de entregas
Forneça análise detalhada em JSON.`
    }

    // Analyze image with GPT-4o Vision
    const visionResult = await analyzeImage(imageUrl, prompt)

    if (!visionResult.success) {
      throw new Error('Failed to analyze image')
    }

    // Parse AI response
    let analysis: ImageAnalysis
    try {
      const jsonMatch = visionResult.analysis.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        analysis = {
          type: analysisType as any,
          confidence: parsed.confidence || 80,
          findings: parsed.findings || [],
          labels: parsed.labels || [],
          text: parsed.text,
          actionRequired: parsed.actionRequired || false,
          suggestedAction: parsed.suggestedAction,
        }
      } else {
        // Fallback: extract key information from text response
        analysis = {
          type: analysisType as any,
          confidence: 75,
          findings: [
            {
              category: 'General Analysis',
              description: visionResult.analysis,
              confidence: 75,
            },
          ],
          labels: [],
          actionRequired: visionResult.analysis.toLowerCase().includes('dano') ||
                         visionResult.analysis.toLowerCase().includes('problema'),
          suggestedAction: visionResult.analysis.toLowerCase().includes('dano')
            ? 'Reportar dano ao cliente e iniciar processo de reclamação'
            : undefined,
        }
      }
    } catch (e) {
      analysis = {
        type: analysisType as any,
        confidence: 70,
        findings: [
          {
            category: 'Analysis',
            description: visionResult.analysis,
            confidence: 70,
          },
        ],
        labels: [],
        actionRequired: false,
      }
    }

    // Save analysis to database
    const supabase = await createClient()
    await supabase.from('image_analyses').insert({
      delivery_id: deliveryId,
      analysis_type: analysisType,
      image_url: imageUrl.substring(0, 100) + '...', // Save truncated version
      confidence: analysis.confidence,
      findings: analysis.findings,
      labels: analysis.labels,
      text_extracted: analysis.text,
      action_required: analysis.actionRequired,
      analyzed_at: new Date().toISOString(),
    })

    return NextResponse.json({
      success: true,
      analysis,
      rawAnalysis: visionResult.analysis,
    })
  } catch (error) {
    console.error('Image recognition error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to analyze image' },
      { status: 500 }
    )
  }
}

// Batch analyze multiple images
export async function PUT(request: NextRequest) {
  try {
    const { images, type = 'general' } = await request.json()

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Images array is required' },
        { status: 400 }
      )
    }

    const results = []

    for (const imageUrl of images) {
      try {
        const prompt = `Analise esta imagem rapidamente e identifique problemas principais.`
        const visionResult = await analyzeImage(imageUrl, prompt)

        if (visionResult.success) {
          results.push({
            imageUrl,
            analysis: visionResult.analysis,
            success: true,
          })
        } else {
          results.push({
            imageUrl,
            error: 'Failed to analyze',
            success: false,
          })
        }
      } catch (error) {
        results.push({
          imageUrl,
          error: 'Analysis error',
          success: false,
        })
      }
    }

    return NextResponse.json({
      success: true,
      results,
      total: images.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
    })
  } catch (error) {
    console.error('Batch image analysis error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to analyze images' },
      { status: 500 }
    )
  }
}

// Get image analysis statistics
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: analyses } = await supabase
      .from('image_analyses')
      .select('*')
      .gte('analyzed_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('analyzed_at', { ascending: false })

    const stats = {
      total: analyses?.length || 0,
      byType: {
        package: analyses?.filter((a) => a.analysis_type === 'package').length || 0,
        signature: analyses?.filter((a) => a.analysis_type === 'signature').length || 0,
        damage: analyses?.filter((a) => a.analysis_type === 'damage').length || 0,
        location: analyses?.filter((a) => a.analysis_type === 'location').length || 0,
        general: analyses?.filter((a) => a.analysis_type === 'general').length || 0,
      },
      actionRequired: analyses?.filter((a) => a.action_required).length || 0,
      averageConfidence: (analyses?.reduce((sum, a) => sum + (a.confidence || 0), 0) || 0) / (analyses?.length || 1),
      damagesDetected: analyses?.filter((a) =>
        a.findings?.some((f: any) => f.category?.toLowerCase().includes('dano'))
      ).length || 0,
    }

    return NextResponse.json({
      success: true,
      stats,
      recentAnalyses: analyses?.slice(0, 20) || [],
    })
  } catch (error) {
    console.error('Get image stats error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get statistics' },
      { status: 500 }
    )
  }
}
