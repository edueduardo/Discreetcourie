import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const BLAND_API_URL = 'https://api.bland.ai/v1'

// POST - Iniciar chamada via Bland.AI
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    phone_number,
    client_id,
    delivery_id,
    task_id,
    call_type = 'delivery_update', // delivery_update, checkin, reminder, custom
    custom_message,
    voice = 'matt', // matt, rachel, etc
    language = 'pt-BR'
  } = body
  
  if (!phone_number) {
    return NextResponse.json({ error: 'phone_number is required' }, { status: 400 })
  }
  
  const blandApiKey = process.env.BLAND_API_KEY
  
  if (!blandApiKey) {
    // Modo simulação se não tiver API key
    const simulatedCallId = `SIM-${Date.now().toString(36)}`
    
    // Registrar chamada simulada
    try {
      await supabase.from('bland_calls').insert({
        call_id: simulatedCallId,
        phone_number,
        direction: 'outbound',
        status: 'simulated',
        client_id,
        delivery_id,
        service_type: call_type,
        extracted_data: { simulated: true, message: custom_message }
      })
    } catch (e) {}
    
    return NextResponse.json({
      success: true,
      simulated: true,
      call_id: simulatedCallId,
      message: 'Call simulated (BLAND_API_KEY not configured)'
    })
  }
  
  // Construir prompt baseado no tipo de chamada
  let prompt = ''
  let task = ''
  
  switch (call_type) {
    case 'delivery_update':
      prompt = `Você é um assistente do Discreet Courier. Ligue para informar sobre uma entrega.
                Seja profissional, discreto e objetivo.
                ${custom_message || 'Informe que a entrega está a caminho.'}`
      task = 'Informar status de entrega ao cliente'
      break
      
    case 'checkin':
      prompt = `Você é um assistente do Discreet Courier fazendo check-in de segurança.
                Pergunte se o cliente está bem e se precisa de algo.
                Se o cliente não responder ou parecer em perigo, registre como alerta.
                ${custom_message || ''}`
      task = 'Verificar bem-estar do cliente (Last Will check-in)'
      break
      
    case 'reminder':
      prompt = `Você é um assistente do Discreet Courier enviando um lembrete.
                Seja breve e cordial.
                ${custom_message || 'Lembrar sobre serviço agendado.'}`
      task = 'Enviar lembrete ao cliente'
      break
      
    case 'custom':
      prompt = custom_message || 'Fazer ligação personalizada para o cliente.'
      task = 'Chamada personalizada'
      break
      
    default:
      prompt = custom_message || 'Entrar em contato com o cliente do Discreet Courier.'
      task = 'Contato geral'
  }
  
  try {
    // Fazer chamada real para Bland.AI
    const blandResponse = await fetch(`${BLAND_API_URL}/calls`, {
      method: 'POST',
      headers: {
        'Authorization': blandApiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone_number,
        task,
        model: 'enhanced',
        language,
        voice,
        voice_settings: {
          stability: 0.8,
          similarity: 0.8
        },
        local_dialing: true,
        max_duration: 5, // 5 minutos máximo
        wait_for_greeting: true,
        record: true,
        amd: true, // Answering machine detection
        answered_by_enabled: true,
        webhook: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/bland`,
        metadata: {
          client_id,
          delivery_id,
          task_id,
          call_type
        },
        first_sentence: getFirstSentence(call_type, language),
        prompt
      })
    })
    
    const blandData = await blandResponse.json()
    
    if (!blandResponse.ok) {
      return NextResponse.json({ 
        error: 'Bland.AI API error',
        details: blandData 
      }, { status: 500 })
    }
    
    // Registrar chamada no banco
    const { data: callRecord, error: dbError } = await supabase
      .from('bland_calls')
      .insert({
        call_id: blandData.call_id,
        phone_number,
        direction: 'outbound',
        status: 'initiated',
        client_id,
        delivery_id,
        service_type: call_type,
        extracted_data: { prompt, task }
      })
      .select()
      .single()
    
    return NextResponse.json({
      success: true,
      call_id: blandData.call_id,
      status: blandData.status,
      db_record: callRecord
    })
    
  } catch (error: any) {

    return NextResponse.json({ 
      error: 'Failed to initiate call',
      message: error.message 
    }, { status: 500 })
  }
}

// GET - Listar chamadas ou status da integração
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const client_id = searchParams.get('client_id')
  const status = searchParams.get('status')
  const limit = parseInt(searchParams.get('limit') || '50')
  
  // Se não houver parâmetros, retornar status da integração
  if (!client_id && !status) {
    return NextResponse.json({
      configured: !!process.env.BLAND_API_KEY,
      api_url: BLAND_API_URL,
      features: [
        'Outbound calls for delivery updates',
        'Check-in calls for Last Will',
        'Reminder calls',
        'Custom voice messages',
        'Call recording and transcription'
      ],
      supported_languages: ['pt-BR', 'en-US'],
      voices: ['matt', 'rachel', 'josh', 'dorothy']
    })
  }
  
  try {
    let query = supabase
      .from('bland_calls')
      .select(`
        *,
        clients (id, code_name, name, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (client_id) query = query.eq('client_id', client_id)
    if (status) query = query.eq('status', status)
    
    const { data, error } = await query
    
    if (error) {
      // Tabela pode não existir
      return NextResponse.json({ 
        calls: [],
        error: 'Table bland_calls may not exist',
        message: error.message 
      })
    }
    
    return NextResponse.json({ calls: data || [] })
  } catch (e: any) {
    return NextResponse.json({ 
      calls: [],
      error: e.message 
    })
  }
}

// Primeira frase baseada no tipo de chamada
function getFirstSentence(callType: string, language: string): string {
  if (language === 'pt-BR') {
    switch (callType) {
      case 'delivery_update':
        return 'Olá, aqui é do Discreet Courier. Estou ligando para informar sobre sua entrega.'
      case 'checkin':
        return 'Olá, aqui é do Discreet Courier. Estou fazendo nosso check-in de rotina.'
      case 'reminder':
        return 'Olá, aqui é do Discreet Courier com um lembrete rápido.'
      default:
        return 'Olá, aqui é do Discreet Courier. Como posso ajudá-lo?'
    }
  }
  
  switch (callType) {
    case 'delivery_update':
      return 'Hello, this is Discreet Courier calling about your delivery.'
    case 'checkin':
      return 'Hello, this is Discreet Courier with your routine check-in.'
    case 'reminder':
      return 'Hello, this is Discreet Courier with a quick reminder.'
    default:
      return 'Hello, this is Discreet Courier. How can I help you?'
  }
}

// PATCH - Atualizar status de chamada (usado pelo webhook)
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const { call_id, status, transcript, summary, duration } = body
  
  if (!call_id) {
    return NextResponse.json({ error: 'call_id is required' }, { status: 400 })
  }
  
  const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
  if (status) updateData.status = status
  if (transcript) updateData.transcript = transcript
  if (summary) updateData.summary = summary
  if (duration) updateData.duration = duration
  
  const { data, error } = await supabase
    .from('bland_calls')
    .update(updateData)
    .eq('call_id', call_id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
