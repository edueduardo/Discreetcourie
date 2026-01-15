import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Vercel Cron Job - Executa a cada 6 horas para deletar mensagens expiradas
// Schedule: "0 */6 * * *"

export async function GET(request: NextRequest) {
  // Verificar authorization para CRON
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
    vault_items_deleted: 0,
    files_deleted: 0,
    errors: [] as string[]
  }
  
  try {
    const now = new Date().toISOString()
    
    // 1. Deletar mensagens com self_destruct ativado e prazo expirado
    const { data: expiredMessages, error: msgError } = await supabase
      .from('secure_messages')
      .select('id, client_id, content_encrypted')
      .eq('self_destruct', true)
      .lte('destruct_at', now)
      .eq('status', 'sent')
    
    if (msgError) {
      results.errors.push(`Messages query failed: ${msgError.message}`)
    } else if (expiredMessages && expiredMessages.length > 0) {
      // Deletar mensagens expiradas
      const { error: deleteError } = await supabase
        .from('secure_messages')
        .delete()
        .in('id', expiredMessages.map(m => m.id))
      
      if (deleteError) {
        results.errors.push(`Messages delete failed: ${deleteError.message}`)
      } else {
        results.messages_deleted = expiredMessages.length
        
        // Log da destruição
        for (const msg of expiredMessages) {
          try {
            await supabase.from('destruction_logs').insert({
              item_type: 'ghost_message',
              item_id: msg.id,
              client_id: msg.client_id,
              destruction_method: 'auto_delete',
              destroyed_at: now,
              notes: 'Ghost Communication - Auto-deleted after expiration'
            })
          } catch (e) {}
        }
      }
    }
    
    // 2. Deletar vault items marcados para auto-destruição
    const { data: expiredVaultItems, error: vaultError } = await supabase
      .from('vault_items')
      .select('id, client_id, item_code, item_type')
      .eq('auto_destruct', true)
      .lte('destruct_at', now)
      .eq('status', 'active')
    
    if (vaultError) {
      results.errors.push(`Vault query failed: ${vaultError.message}`)
    } else if (expiredVaultItems && expiredVaultItems.length > 0) {
      // Marcar como destroyed (não deletar fisicamente para auditoria)
      const { error: updateError } = await supabase
        .from('vault_items')
        .update({
          status: 'destroyed',
          destroyed_at: now,
          updated_at: now
        })
        .in('id', expiredVaultItems.map(i => i.id))
      
      if (updateError) {
        results.errors.push(`Vault update failed: ${updateError.message}`)
      } else {
        results.vault_items_deleted = expiredVaultItems.length
        
        // Log da destruição
        for (const item of expiredVaultItems) {
          try {
            await supabase.from('destruction_logs').insert({
              item_type: item.item_type,
              item_id: item.id,
              item_code: item.item_code,
              client_id: item.client_id,
              destruction_method: 'auto_delete',
              destroyed_at: now,
              notes: 'Auto-destruction timer expired'
            })
          } catch (e) {}
        }
      }
    }
    
    // 3. Verificar arquivos com prazo de retenção expirado
    const { data: expiredFiles, error: filesError } = await supabase
      .from('delivery_files')
      .select('id, delivery_id, file_path')
      .eq('auto_delete', true)
      .lte('delete_at', now)
    
    if (!filesError && expiredFiles && expiredFiles.length > 0) {
      // Marcar arquivos como deletados
      const { error: fileDeleteError } = await supabase
        .from('delivery_files')
        .update({
          deleted: true,
          deleted_at: now
        })
        .in('id', expiredFiles.map(f => f.id))
      
      if (!fileDeleteError) {
        results.files_deleted = expiredFiles.length
      }
    }
    
    // Log do CRON
    try {
      await supabase.from('cron_logs').insert({
        job_name: 'auto-delete',
        executed_at: now,
        results: results,
        success: results.errors.length === 0
      })
    } catch (e) {}
    
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

// POST - Deletar item específico manualmente
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
      
      try {
        await supabase.from('destruction_logs').insert({
          item_type: 'ghost_message',
          item_id: id,
          destruction_method: 'manual_delete',
          destroyed_at: now,
          notes: 'Manually triggered ghost message deletion'
        })
      } catch (e) {}
      
    } else if (type === 'vault_item') {
      const { error } = await supabase
        .from('vault_items')
        .update({
          status: 'destroyed',
          destroyed_at: now,
          updated_at: now
        })
        .eq('id', id)
      
      if (error) throw error
      
      try {
        await supabase.from('destruction_logs').insert({
          item_type: 'vault_item',
          item_id: id,
          destruction_method: 'manual_delete',
          destroyed_at: now,
          notes: 'Manually triggered vault item destruction'
        })
      } catch (e) {}
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
