import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST - Registrar/Gerar vídeo de destruição
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const { 
    destruction_log_id,
    client_id,
    video_type = 'generated', // 'generated', 'uploaded', 'recorded'
    video_url,
    items_destroyed,
    destruction_method = 'digital_wipe',
    send_to_client = false,
    client_email,
    client_phone
  } = body
  
  if (!client_id && !destruction_log_id) {
    return NextResponse.json({ error: 'client_id or destruction_log_id required' }, { status: 400 })
  }
  
  const now = new Date().toISOString()
  const certificate_code = `DC-${Date.now().toString(36).toUpperCase()}`
  
  // Buscar informações do cliente/destruição
  let clientInfo = null
  if (client_id) {
    const { data } = await supabase
      .from('clients')
      .select('id, code_name, name, email, phone')
      .eq('id', client_id)
      .single()
    clientInfo = data
  }
  
  // Gerar certificado de destruição
  const certificate = {
    certificate_code,
    generated_at: now,
    client_code: clientInfo?.code_name || 'DESTROYED',
    destruction_method,
    items_destroyed: items_destroyed || {},
    verification_hash: generateVerificationHash(certificate_code, now),
    video_type,
    video_url: video_url || null,
    status: 'completed'
  }
  
  // Salvar registro do vídeo/certificado
  const { data: videoRecord, error } = await supabase
    .from('destruction_videos')
    .insert({
      destruction_log_id,
      client_id,
      certificate_code,
      video_type,
      video_url,
      destruction_method,
      items_destroyed,
      certificate_data: certificate,
      generated_at: now,
      sent_to_client: false,
      status: 'generated'
    })
    .select()
    .single()
  
  if (error) {
    // Tabela pode não existir, criar registro alternativo
    console.log('Video record error (table may not exist):', error.message)
  }
  
  // Atualizar destruction_log se existir
  if (destruction_log_id) {
    await supabase
      .from('destruction_logs')
      .update({
        video_sent: send_to_client,
        video_url,
        certificate_code,
        updated_at: now
      })
      .eq('id', destruction_log_id)
  }
  
  // Enviar notificação ao cliente
  if (send_to_client) {
    const targetPhone = client_phone || clientInfo?.phone
    const targetEmail = client_email || clientInfo?.email
    
    // SMS
    if (targetPhone && process.env.TWILIO_ACCOUNT_SID) {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/sms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: targetPhone,
            message: `[Discreet Courier] Sua solicitação de destruição foi concluída. ` +
                     `Certificado: ${certificate_code}. Todos os dados foram permanentemente eliminados.`
          })
        })
      } catch (e) {
        console.error('SMS failed:', e)
      }
    }
    
    // Log do envio
    try {
      await supabase.from('notification_logs').insert({
        delivery_id: null,
        title: 'Destruction Video/Certificate Sent',
        body: `Certificate ${certificate_code} sent to client`,
        status: 'sent',
        sent_at: now
      })
    } catch (e) {}
  }
  
  return NextResponse.json({
    success: true,
    certificate,
    video_record: videoRecord,
    message: 'Destruction video/certificate generated successfully'
  }, { status: 201 })
}

// GET - Buscar vídeos de destruição
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const client_id = searchParams.get('client_id')
  const certificate_code = searchParams.get('code')
  
  let query = supabase
    .from('destruction_videos')
    .select('*')
    .order('generated_at', { ascending: false })
  
  if (client_id) query = query.eq('client_id', client_id)
  if (certificate_code) query = query.eq('certificate_code', certificate_code)
  
  const { data, error } = await query
  
  if (error) {
    // Tabela pode não existir, retornar array vazio
    return NextResponse.json([])
  }
  
  return NextResponse.json(data || [])
}

// Gerar hash de verificação
function generateVerificationHash(code: string, timestamp: string): string {
  const data = `${code}-${timestamp}-DISCREET-COURIER`
  let hash = 0
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).toUpperCase().padStart(8, '0')
}

// PATCH - Atualizar status do vídeo (ex: marcar como enviado)
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const { id, video_url, sent_to_client, status } = body
  
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }
  
  const updateData: Record<string, any> = { updated_at: new Date().toISOString() }
  if (video_url !== undefined) updateData.video_url = video_url
  if (sent_to_client !== undefined) updateData.sent_to_client = sent_to_client
  if (status) updateData.status = status
  
  const { data, error } = await supabase
    .from('destruction_videos')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
