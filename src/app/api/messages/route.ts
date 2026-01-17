import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { encryptString, decryptString, isEncryptionConfigured } from '@/lib/encryption'

// POST - Enviar mensagem
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    client_id,
    content,
    direction, // 'inbound' ou 'outbound'
    self_destruct,
    destruct_after_hours,
    task_id
  } = body
  
  const destruct_at = self_destruct && destruct_after_hours
    ? new Date(Date.now() + destruct_after_hours * 60 * 60 * 1000).toISOString()
    : null
  
  // Encrypt content if encryption is configured
  let encryptedContent = content
  let isEncrypted = false
  
  if (isEncryptionConfigured()) {
    try {
      encryptedContent = encryptString(content)
      isEncrypted = true
    } catch (err) {
      console.error('Encryption failed, storing plaintext:', err)
    }
  }
  
  const { data, error } = await supabase
    .from('secure_messages')
    .insert({
      client_id,
      content_encrypted: encryptedContent,
      is_encrypted: isEncrypted,
      direction,
      self_destruct: self_destruct || false,
      destruct_at,
      task_id: task_id || null,
      status: 'sent',
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}

// GET - Buscar mensagens
export async function GET(request: NextRequest) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const clientId = searchParams.get('client_id')
  const taskId = searchParams.get('task_id')
  
  let query = supabase
    .from('secure_messages')
    .select('*')
    .order('created_at', { ascending: true })
  
  if (clientId) {
    query = query.eq('client_id', clientId)
  }
  if (taskId) {
    query = query.eq('task_id', taskId)
  }
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Decrypt messages if encrypted
  const messages = (data || []).map(msg => {
    if (msg.is_encrypted && isEncryptionConfigured()) {
      try {
        return {
          ...msg,
          content: decryptString(msg.content_encrypted),
          content_encrypted: '[ENCRYPTED]'
        }
      } catch (err) {
        return { ...msg, content: '[DECRYPTION_FAILED]' }
      }
    }
    return { ...msg, content: msg.content_encrypted }
  })
  
  return NextResponse.json({ messages })
}
