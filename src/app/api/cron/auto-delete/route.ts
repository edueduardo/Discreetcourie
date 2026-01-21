import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Vercel Cron Job - Executa a cada 6 horas para deletar mensagens expiradas
// Schedule: "0 */6 * * *"

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }
  
  const supabase = createClient()
  const results = {
    messages_deleted: 0,
    files_deleted: 0,
    errors: [] as string[]
  }
  
  try {
    const now = new Date().toISOString()
    
    // 1. Deletar mensagens com self_destruct ativado e prazo expirado
    const { data: expiredMessages, error: msgError } = await supabase
      .from('secure_messages')
      .select('id')
      .eq('self_destruct', true)
      .lte('destruct_at', now)
      .eq('status', 'sent')
    
    if (msgError) {
      results.errors.push(`Messages query failed: ${msgError.message}`)
    } else if (expiredMessages && expiredMessages.length > 0) {
      const { error: deleteError } = await supabase
        .from('secure_messages')
        .delete()
        .in('id', expiredMessages.map(m => m.id))
      
      if (deleteError) {
        results.errors.push(`Messages delete failed: ${deleteError.message}`)
      } else {
        results.messages_deleted = expiredMessages.length
      }
    }
    
    // 2. Verificar arquivos com prazo de retenção expirado
    const { data: expiredFiles, error: filesError } = await supabase
      .from('delivery_files')
      .select('id')
      .eq('auto_delete', true)
      .lte('delete_at', now)
    
    if (!filesError && expiredFiles && expiredFiles.length > 0) {
      const { error: fileDeleteError } = await supabase
        .from('delivery_files')
        .update({ deleted: true, deleted_at: now })
        .in('id', expiredFiles.map(f => f.id))
      
      if (!fileDeleteError) {
        results.files_deleted = expiredFiles.length
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Auto-delete check completed',
      ...results,
      executed_at: now
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: 'CRON job failed',
      message: error.message 
    }, { status: 500 })
  }
}

// POST - Deletar mensagem específica manualmente
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const { type, id } = body
  
  if (!type || !id) {
    return NextResponse.json({ error: 'type and id are required' }, { status: 400 })
  }
  
  const now = new Date().toISOString()
  
  try {
    if (type === 'message') {
      const { error } = await supabase
        .from('secure_messages')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    }
    
    return NextResponse.json({
      success: true,
      message: `${type} deleted successfully`,
      deleted_at: now
    })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
