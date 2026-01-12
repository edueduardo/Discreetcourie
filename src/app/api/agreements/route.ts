import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Conteúdo padrão dos termos
const DEFAULT_TERMS = {
  nda: `CONFIDENTIALITY AGREEMENT

This Non-Disclosure Agreement ("Agreement") is entered into by and between Discreet Courier Columbus ("Provider") and the Client.

1. CONFIDENTIAL INFORMATION
The Client agrees that all information shared with Provider regarding deliveries, tasks, or services is confidential.

2. PROVIDER OBLIGATIONS
Provider agrees to:
- Maintain complete confidentiality about all client matters
- Not disclose any client information to third parties
- Delete all records upon client request (No Trace Mode)
- Never discuss client business with anyone

3. MUTUAL PROTECTION
Both parties agree to maintain confidentiality for the duration of their relationship and indefinitely thereafter.

4. BREACH
Any breach of this agreement will result in immediate termination of services.`,

  pact: `PACTO DE LEALDADE MÚTUA (MUTUAL LOYALTY PACT)

This Mutual Loyalty Pact is a binding agreement between Discreet Courier Columbus ("Provider") and the Client.

1. PROVIDER PROMISES
- Complete confidentiality about all client matters
- No judgment, no questions about nature of tasks
- Priority service at all times
- Direct communication line
- Immediate response to emergencies

2. CLIENT PROMISES
- Honest communication about task requirements
- Timely payment for services
- No illegal activities
- Respect for Provider's safety and boundaries

3. MUTUAL TRUST
Both parties enter this pact understanding that trust is the foundation of our relationship.

"What happens with us, stays with us. Forever."`,

  vip_terms: `VIP SERVICE TERMS

Welcome to VIP status at Discreet Courier Columbus.

1. VIP BENEFITS
- 24/7 Guardian Mode availability
- Direct phone line to your dedicated driver
- Priority handling for all requests
- No Trace Mode on all services
- Vault storage access
- Last Will service eligibility

2. VIP RESPONSIBILITIES
- Monthly retainer payment
- Minimum 30-day notice for cancellation
- Honest disclosure of task requirements

3. PRICING
- Base retainer: $500/month
- Additional services billed separately
- Emergency calls: Included in retainer

4. TERMINATION
Either party may terminate with 30 days notice.
All client data will be destroyed upon termination if requested.`
}

// GET - Listar acordos do cliente
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const client_id = searchParams.get('client_id')
  const type = searchParams.get('type')
  
  let query = supabase
    .from('service_agreements')
    .select(`
      *,
      clients (id, code_name, name)
    `)
    .order('created_at', { ascending: false })
  
  if (client_id) query = query.eq('client_id', client_id)
  if (type) query = query.eq('agreement_type', type)
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// POST - Criar novo acordo
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    client_id,
    agreement_type,
    content,
    version = '1.0',
    valid_until
  } = body
  
  if (!client_id || !agreement_type) {
    return NextResponse.json(
      { error: 'client_id and agreement_type are required' },
      { status: 400 }
    )
  }
  
  // Usar conteúdo padrão se não fornecido
  const agreementContent = content || DEFAULT_TERMS[agreement_type as keyof typeof DEFAULT_TERMS] || ''
  
  const { data, error } = await supabase
    .from('service_agreements')
    .insert({
      client_id,
      agreement_type,
      version,
      content: agreementContent,
      status: 'pending',
      valid_from: new Date().toISOString(),
      valid_until,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}

// PATCH - Assinar acordo
export async function PATCH(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    id,
    customer_signed,
    customer_ip,
    customer_signature_data,
    provider_signed
  } = body
  
  if (!id) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 })
  }
  
  const updateData: Record<string, any> = {}
  
  if (customer_signed) {
    updateData.customer_signed = true
    updateData.customer_signed_at = new Date().toISOString()
    if (customer_ip) updateData.customer_ip = customer_ip
    if (customer_signature_data) updateData.customer_signature_data = customer_signature_data
  }
  
  if (provider_signed) {
    updateData.provider_signed = true
    updateData.provider_signed_at = new Date().toISOString()
  }
  
  // Se ambos assinaram, ativar acordo
  const { data: current } = await supabase
    .from('service_agreements')
    .select('customer_signed, provider_signed')
    .eq('id', id)
    .single()
  
  const willBeFullySigned = 
    (current?.customer_signed || customer_signed) && 
    (current?.provider_signed || provider_signed)
  
  if (willBeFullySigned) {
    updateData.status = 'active'
  }
  
  const { data, error } = await supabase
    .from('service_agreements')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
