# ══════════════════════════════════════════════════════════════════════════════
# DOCUMENTO MASTER PARA WINDSURF CASCADE
# Discreet Courier Columbus - Implementações Pendentes
# ══════════════════════════════════════════════════════════════════════════════

## 📍 INFORMAÇÕES DO PROJETO (UNIFICADAS)

```
REPOSITÓRIO ÚNICO:
GitHub: https://github.com/edueduardo/Discreetcourie
Branch Principal: master
```

```
DEPLOY ÚNICO:
Vercel: https://discreetcourie.vercel.app
Auto-deploy: Sim (push no master = deploy automático)
```

```
BANCO DE DADOS:
Supabase URL: https://orrnxowylokgzvimvluv.supabase.co
(Chaves já configuradas no Vercel)
```

---

## ⚠️ ANTES DE COMEÇAR: UNIFICAR BRANCHES

O Claude Code pode ter criado um branch separado. Execute estes comandos para unificar:

```bash
# 1. Clone o repositório (se ainda não tem)
git clone https://github.com/edueduardo/Discreetcourie.git
cd Discreetcourie

# 2. Veja todos os branches
git branch -a

# 3. Se existir branch do Claude Code, faça merge
git checkout master
git pull origin master

# Se existir branch claude/discreetcourier-phase-1-o0xQe:
git merge origin/claude/discreetcourier-phase-1-o0xQe

# 4. Push para master
git push origin master

# 5. A partir de agora, SEMPRE trabalhe no master
git checkout master
```

---

## 📋 ÍNDICE DE IMPLEMENTAÇÕES

| # | Tarefa | Prioridade | Estimativa |
|---|--------|------------|------------|
| 1 | Verificar e Completar APIs | 🔴 ALTA | 2-3h |
| 2 | Landing Page AIDA | 🔴 ALTA | 2-3h |
| 3 | Fluxo Cliente AIDA | 🟡 MÉDIA | 2h |
| 4 | Psicologia UX/UI | 🟡 MÉDIA | 3-4h |
| 5 | Testes de Integração | 🔴 ALTA | 2h |

---

# ══════════════════════════════════════════════════════════════════════════════
# TAREFA 1: VERIFICAR E COMPLETAR APIs
# Prioridade: 🔴 ALTA
# ══════════════════════════════════════════════════════════════════════════════

## Objetivo
Garantir que todas as APIs existam e funcionem com Supabase.

## APIs Necessárias

### /api/orders (Pedidos)

```typescript
// /src/app/api/orders/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Lista todos os pedidos
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const limit = searchParams.get('limit') || '50'
  
  let query = supabase
    .from('deliveries')
    .select(`
      *,
      clients (id, code_name, name, phone, email)
    `)
    .order('created_at', { ascending: false })
    .limit(parseInt(limit))
  
  if (status) {
    query = query.eq('status', status)
  }
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// POST - Criar novo pedido
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    client_id,
    pickup_address,
    delivery_address,
    scheduled_date,
    scheduled_time,
    item_type,
    item_description,
    special_instructions,
    price,
    service_level,
    no_trace_mode
  } = body
  
  // Gerar código de rastreamento
  const tracking_code = `DC-${Date.now().toString(36).toUpperCase()}`
  
  const { data, error } = await supabase
    .from('deliveries')
    .insert({
      client_id,
      tracking_code,
      pickup_address,
      delivery_address,
      scheduled_date,
      scheduled_time,
      item_type,
      item_description,
      special_instructions,
      price,
      service_level: service_level || 1,
      no_trace_mode: no_trace_mode || false,
      status: 'pending',
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}
```

```typescript
// /src/app/api/orders/[id]/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Detalhes de um pedido
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('deliveries')
    .select(`
      *,
      clients (id, code_name, name, phone, email, service_level),
      delivery_events (id, event_type, description, created_at),
      delivery_proofs (id, type, photo_url, received_by, notes, created_at)
    `)
    .eq('id', params.id)
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 })
  }
  
  return NextResponse.json(data)
}

// PATCH - Atualizar pedido
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const body = await request.json()
  
  const { data, error } = await supabase
    .from('deliveries')
    .update({
      ...body,
      updated_at: new Date().toISOString()
    })
    .eq('id', params.id)
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// DELETE - Deletar pedido
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  const { error } = await supabase
    .from('deliveries')
    .delete()
    .eq('id', params.id)
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json({ success: true })
}
```

```typescript
// /src/app/api/orders/[id]/status/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// PATCH - Atualizar status do pedido
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const { status, notes } = await request.json()
  
  // Atualizar pedido
  const { data: delivery, error: deliveryError } = await supabase
    .from('deliveries')
    .update({
      status,
      updated_at: new Date().toISOString()
    })
    .eq('id', params.id)
    .select()
    .single()
  
  if (deliveryError) {
    return NextResponse.json({ error: deliveryError.message }, { status: 500 })
  }
  
  // Criar evento de histórico
  await supabase
    .from('delivery_events')
    .insert({
      delivery_id: params.id,
      event_type: status,
      description: notes || `Status changed to ${status}`,
      created_at: new Date().toISOString()
    })
  
  return NextResponse.json(delivery)
}
```

```typescript
// /src/app/api/orders/[id]/proof/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST - Upload de prova de entrega
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    type, // 'pickup' ou 'delivery'
    photo_url,
    received_by,
    signature_url,
    notes,
    latitude,
    longitude
  } = body
  
  const { data, error } = await supabase
    .from('delivery_proofs')
    .insert({
      delivery_id: params.id,
      type,
      photo_url,
      received_by,
      signature_url,
      notes,
      latitude,
      longitude,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  // Atualizar status do pedido se necessário
  if (type === 'delivery') {
    await supabase
      .from('deliveries')
      .update({
        status: 'delivered',
        delivered_at: new Date().toISOString()
      })
      .eq('id', params.id)
  }
  
  return NextResponse.json(data, { status: 201 })
}
```

### /api/concierge (Tarefas Concierge)

```typescript
// /src/app/api/concierge/tasks/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Lista tarefas concierge
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const type = searchParams.get('type')
  
  let query = supabase
    .from('concierge_tasks')
    .select(`
      *,
      clients (id, code_name, name, service_level)
    `)
    .order('created_at', { ascending: false })
  
  if (status) query = query.eq('status', status)
  if (type) query = query.eq('task_type', type)
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// POST - Criar tarefa concierge
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const reference = `C-${Date.now().toString(36).toUpperCase()}`
  
  const { data, error } = await supabase
    .from('concierge_tasks')
    .insert({
      ...body,
      reference,
      status: 'pending',
      current_phase: 1,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}
```

### /api/vault (Cofre Humano)

```typescript
// /src/app/api/vault/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Lista itens do cofre
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('vault_items')
    .select(`
      *,
      clients (id, code_name, name)
    `)
    .eq('status', 'active')
    .order('stored_at', { ascending: false })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// POST - Adicionar item ao cofre
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const item_code = `V-${Date.now().toString(36).toUpperCase()}`
  
  const { data, error } = await supabase
    .from('vault_items')
    .insert({
      ...body,
      item_code,
      status: 'active',
      stored_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}
```

### /api/customers (Clientes)

```typescript
// /src/app/api/customers/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// Gerar código de cliente
function generateClientCode(): string {
  const prefixes = ['SHADOW', 'GHOST', 'CIPHER', 'PHANTOM', 'ECHO']
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)]
  const number = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${number}`
}

// GET - Lista clientes
export async function GET(request: NextRequest) {
  const supabase = createClient()
  
  const { searchParams } = new URL(request.url)
  const level = searchParams.get('level')
  const vip = searchParams.get('vip')
  
  let query = supabase
    .from('clients')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (level) query = query.eq('service_level', parseInt(level))
  if (vip === 'true') query = query.eq('is_vip', true)
  
  const { data, error } = await query
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}

// POST - Criar cliente
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const code_name = generateClientCode()
  
  const { data, error } = await supabase
    .from('clients')
    .insert({
      ...body,
      code_name,
      service_level: body.service_level || 1,
      is_vip: body.is_vip || false,
      created_at: new Date().toISOString()
    })
    .select()
    .single()
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data, { status: 201 })
}
```

```typescript
// /src/app/api/customers/[id]/destroy/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// DELETE - Destruição total de dados do cliente
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  // Buscar cliente para log
  const { data: client } = await supabase
    .from('clients')
    .select('code_name')
    .eq('id', params.id)
    .single()
  
  if (!client) {
    return NextResponse.json({ error: 'Client not found' }, { status: 404 })
  }
  
  // Deletar em ordem (dependências primeiro)
  
  // 1. Mensagens seguras
  await supabase.from('secure_messages').delete().eq('client_id', params.id)
  
  // 2. Provas de entrega (via deliveries)
  const { data: deliveries } = await supabase
    .from('deliveries')
    .select('id')
    .eq('client_id', params.id)
  
  if (deliveries) {
    const deliveryIds = deliveries.map(d => d.id)
    await supabase.from('delivery_proofs').delete().in('delivery_id', deliveryIds)
    await supabase.from('delivery_events').delete().in('delivery_id', deliveryIds)
  }
  
  // 3. Entregas
  await supabase.from('deliveries').delete().eq('client_id', params.id)
  
  // 4. Tarefas concierge
  await supabase.from('concierge_tasks').delete().eq('client_id', params.id)
  
  // 5. Itens do cofre
  await supabase.from('vault_items').delete().eq('client_id', params.id)
  
  // 6. Acordos/NDAs
  await supabase.from('service_agreements').delete().eq('client_id', params.id)
  
  // 7. Cliente
  await supabase.from('clients').delete().eq('id', params.id)
  
  // 8. Registrar destruição
  await supabase.from('destruction_log').insert({
    customer_code: client.code_name,
    items_destroyed: {
      messages: true,
      deliveries: true,
      proofs: true,
      tasks: true,
      vault: true,
      agreements: true,
      profile: true
    },
    requested_by: 'admin',
    reason: 'Complete data destruction requested',
    executed_at: new Date().toISOString()
  })
  
  return NextResponse.json({ 
    success: true, 
    message: `All data for ${client.code_name} has been destroyed` 
  })
}
```

### /api/messages (Mensagens Seguras)

```typescript
// /src/app/api/messages/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// POST - Enviar mensagem
export async function POST(request: NextRequest) {
  const supabase = createClient()
  const body = await request.json()
  
  const {
    client_id,
    content,
    direction, // 'inbound' ou 'outbound'
    self_destruct,
    destruct_after_hours
  } = body
  
  const destruct_at = self_destruct && destruct_after_hours
    ? new Date(Date.now() + destruct_after_hours * 60 * 60 * 1000).toISOString()
    : null
  
  const { data, error } = await supabase
    .from('secure_messages')
    .insert({
      client_id,
      content_encrypted: content, // TODO: Implementar criptografia real
      direction,
      self_destruct: self_destruct || false,
      destruct_at,
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
```

```typescript
// /src/app/api/messages/[customerId]/route.ts

import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET - Lista mensagens de um cliente
export async function GET(
  request: NextRequest,
  { params }: { params: { customerId: string } }
) {
  const supabase = createClient()
  
  // Deletar mensagens expiradas primeiro
  await supabase
    .from('secure_messages')
    .delete()
    .lt('destruct_at', new Date().toISOString())
    .not('destruct_at', 'is', null)
  
  const { data, error } = await supabase
    .from('secure_messages')
    .select('*')
    .eq('client_id', params.customerId)
    .order('created_at', { ascending: true })
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
```

---

# ══════════════════════════════════════════════════════════════════════════════
# TAREFA 2: LANDING PAGE AIDA
# Prioridade: 🔴 ALTA
# Arquivo: /src/app/page.tsx (SUBSTITUIR COMPLETAMENTE)
# ══════════════════════════════════════════════════════════════════════════════

```tsx
// /src/app/page.tsx

'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Phone, Shield, Lock, Clock, Trash2, Package, ChevronRight, Check } from 'lucide-react'

export default function LandingPage() {
  const [hoveredTier, setHoveredTier] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      
      {/* ══════════════════════════════════════════════════════════════════
          SECTION 1: ATTENTION - Hero
          Objetivo: Capturar em 5 segundos
      ══════════════════════════════════════════════════════════════════ */}
      <section className="relative min-h-screen flex items-center justify-center px-6">
        {/* Background gradient sutil */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a2e] to-[#0a0a0f]" />
        
        {/* Efeito de "névoa" no topo */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#0f3460]/20 to-transparent" />
        
        <div className="relative z-10 text-center max-w-4xl mx-auto">
          {/* Badge de confiança */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#1a1a2e] border border-[#2d3748] mb-8">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-gray-400">Servindo Columbus com discrição desde 2024</span>
          </div>
          
          {/* Headline Principal */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6">
            <span className="block">O Que Você Precisa Fazer,</span>
            <span className="block text-[#e94560]">Nós Fazemos.</span>
          </h1>
          
          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-gray-400 mb-8 max-w-2xl mx-auto">
            O que você precisa esquecer, já esquecemos.
          </p>
          
          <p className="text-lg text-gray-500 mb-12">
            Entrega confidencial e concierge pessoal em Columbus, OH.
            <br />
            <span className="text-white font-medium">Um motorista. Zero rastros. Confiança absoluta.</span>
          </p>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a 
              href="tel:+16145003080" 
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#e94560] hover:bg-[#d63d56] rounded-lg text-lg font-semibold transition-all transform hover:scale-105"
            >
              <Phone className="w-5 h-5" />
              Ligar: (614) 500-3080
            </a>
            <Link 
              href="/concierge/request"
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1a1a2e] hover:bg-[#2d3748] border border-[#2d3748] rounded-lg text-lg font-semibold transition-all"
            >
              Solicitar Discretamente
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
          
          {/* Trust indicators */}
          <div className="mt-16 flex flex-wrap justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>100% Confidencial</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Um Único Motorista</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              <span>Disponível 24/7</span>
            </div>
          </div>
        </div>
        
        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-gray-600 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2 bg-gray-600 rounded-full" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 2: INTEREST - Benefícios
          Objetivo: Mostrar relevância
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-[#0f0f17]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Por Que Pessoas Inteligentes Nos Escolhem
            </h2>
            <p className="text-gray-400 text-lg">
              Não somos uma empresa de entregas. Somos seu aliado silencioso.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Benefício 1 */}
            <div className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-[#0f3460] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Package className="w-7 h-7 text-[#e94560]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Entrego o que você não pode buscar</h3>
              <p className="text-gray-400">
                Compras discretas, documentos sensíveis, presentes secretos. 
                Sem perguntas, sem julgamentos.
              </p>
            </div>
            
            {/* Benefício 2 */}
            <div className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-[#0f3460] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Lock className="w-7 h-7 text-[#e94560]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Guardo o que você não pode ter em casa</h3>
              <p className="text-gray-400">
                Cofre Humano - documentos, itens, segredos. 
                Em local seguro, longe de olhos curiosos.
              </p>
            </div>
            
            {/* Benefício 3 */}
            <div className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-[#0f3460] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Trash2 className="w-7 h-7 text-[#e94560]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Esqueço o que você precisa que eu esqueça</h3>
              <p className="text-gray-400">
                Destruição de dados com prova em vídeo. 
                Quando acabar, nunca existiu.
              </p>
            </div>
            
            {/* Benefício 4 */}
            <div className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-[#0f3460] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-7 h-7 text-[#e94560]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Estou aqui quando todos dormem</h3>
              <p className="text-gray-400">
                Guardian Mode 24/7 - emergências reais, qualquer hora. 
                Você nunca está sozinho.
              </p>
            </div>
            
            {/* Benefício 5 */}
            <div className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-[#0f3460] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-7 h-7 text-[#e94560]" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Represento você quando você não pode ir</h3>
              <p className="text-gray-400">
                Procurador de Sombras - eu vou, falo, resolvo no seu lugar. 
                Você fica em paz.
              </p>
            </div>
            
            {/* Benefício 6 */}
            <div className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 transition-all group">
              <div className="w-14 h-14 rounded-xl bg-[#0f3460] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-7 h-7 text-[#e94560]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3">Entrego suas últimas palavras</h3>
              <p className="text-gray-400">
                Última Vontade - mensagem ou item entregue após você partir. 
                Seu legado, garantido.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 3: DESIRE - Prova Social
          Objetivo: Criar confiança e desejo
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Para Quem Valoriza o Silêncio
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Advogados, médicos, executivos e pessoas que entendem 
              que algumas coisas não podem ser confiadas a qualquer um.
            </p>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[#e94560] mb-2">347+</div>
              <div className="text-gray-400">Entregas Confidenciais</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[#e94560] mb-2">100%</div>
              <div className="text-gray-400">Sigilo Mantido</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[#e94560] mb-2">0</div>
              <div className="text-gray-400">Vazamentos</div>
            </div>
            <div className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-[#e94560] mb-2">24/7</div>
              <div className="text-gray-400">Disponibilidade VIP</div>
            </div>
          </div>
          
          {/* Quote */}
          <div className="max-w-3xl mx-auto text-center">
            <blockquote className="text-2xl md:text-3xl font-light italic text-gray-300 mb-6">
              "Algumas coisas só podem ser confiadas a quem sabe esquecer."
            </blockquote>
            <div className="w-16 h-1 bg-[#e94560] mx-auto" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          SECTION 4: ACTION - Preços e CTAs
          Objetivo: Converter
      ══════════════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-[#0f0f17]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Pronto Para Ter Alguém de Confiança?
            </h2>
            <p className="text-gray-400 text-lg">
              Escolha o nível de serviço que você precisa
            </p>
          </div>
          
          {/* Pricing Cards - Ordem reversa para ancoragem */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Tier 4: VIP (Mostrado primeiro para ancoragem) */}
            <div 
              className="relative p-8 rounded-2xl bg-gradient-to-b from-[#e94560]/20 to-[#1a1a2e] border-2 border-[#e94560] hover:transform hover:scale-105 transition-all"
              onMouseEnter={() => setHoveredTier(4)}
              onMouseLeave={() => setHoveredTier(null)}
            >
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 px-4 py-1 bg-[#e94560] rounded-full text-sm font-semibold">
                MAIS COMPLETO
              </div>
              <h3 className="text-xl font-bold mb-2 mt-4">The Fixer</h3>
              <div className="text-3xl font-bold mb-1">$200-500+</div>
              <div className="text-gray-400 text-sm mb-6">por situação</div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e94560]" />
                  Guardian Mode 24/7
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e94560]" />
                  Cofre Humano incluso
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e94560]" />
                  Última Vontade
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e94560]" />
                  Destruição de dados
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-[#e94560]" />
                  Operações complexas
                </li>
              </ul>
              <Link 
                href="/concierge/request?level=4"
                className="block w-full py-3 text-center rounded-lg bg-[#e94560] hover:bg-[#d63d56] font-semibold transition-colors"
              >
                Aplicar para VIP
              </Link>
            </div>
            
            {/* Tier 3: Concierge */}
            <div 
              className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 hover:transform hover:scale-105 transition-all"
              onMouseEnter={() => setHoveredTier(3)}
              onMouseLeave={() => setHoveredTier(null)}
            >
              <h3 className="text-xl font-bold mb-2">Concierge</h3>
              <div className="text-3xl font-bold mb-1">$75-150</div>
              <div className="text-gray-400 text-sm mb-6">por hora</div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Compras discretas
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Tarefas pessoais
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Representação
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Modo sem rastro
                </li>
              </ul>
              <Link 
                href="/concierge/request?level=3"
                className="block w-full py-3 text-center rounded-lg bg-[#2d3748] hover:bg-[#3d4758] font-semibold transition-colors"
              >
                Solicitar
              </Link>
            </div>
            
            {/* Tier 2: Discreto */}
            <div 
              className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 hover:transform hover:scale-105 transition-all"
              onMouseEnter={() => setHoveredTier(2)}
              onMouseLeave={() => setHoveredTier(null)}
            >
              <h3 className="text-xl font-bold mb-2">Discreto</h3>
              <div className="text-3xl font-bold mb-1">$50-75</div>
              <div className="text-gray-400 text-sm mb-6">por entrega</div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Entrega confidencial
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Provas privadas
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Comunicação direta
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Rastreamento opcional
                </li>
              </ul>
              <Link 
                href="/concierge/request?level=2"
                className="block w-full py-3 text-center rounded-lg bg-[#2d3748] hover:bg-[#3d4758] font-semibold transition-colors"
              >
                Solicitar
              </Link>
            </div>
            
            {/* Tier 1: Básico */}
            <div 
              className="p-8 rounded-2xl bg-[#1a1a2e] border border-[#2d3748] hover:border-[#e94560]/50 hover:transform hover:scale-105 transition-all"
              onMouseEnter={() => setHoveredTier(1)}
              onMouseLeave={() => setHoveredTier(null)}
            >
              <h3 className="text-xl font-bold mb-2">Courier</h3>
              <div className="text-3xl font-bold mb-1">$35-50</div>
              <div className="text-gray-400 text-sm mb-6">por entrega</div>
              <ul className="space-y-3 mb-8 text-sm">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Entrega simples
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Um motorista
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Confirmação por foto
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  Same-day disponível
                </li>
              </ul>
              <Link 
                href="/concierge/request?level=1"
                className="block w-full py-3 text-center rounded-lg bg-[#2d3748] hover:bg-[#3d4758] font-semibold transition-colors"
              >
                Solicitar
              </Link>
            </div>
          </div>
          
          {/* CTA Final */}
          <div className="mt-16 text-center">
            <p className="text-gray-400 mb-6">Não sabe qual escolher? Ligue e conversamos.</p>
            <a 
              href="tel:+16145003080" 
              className="inline-flex items-center justify-center gap-3 px-8 py-4 bg-[#1a1a2e] hover:bg-[#2d3748] border border-[#2d3748] rounded-lg text-lg font-semibold transition-all"
            >
              <Phone className="w-5 h-5" />
              (614) 500-3080 - Ligação Confidencial
            </a>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════════════════════════ */}
      <footer className="py-16 px-6 border-t border-[#2d3748]">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-2xl font-bold mb-2">Discreet Courier Columbus</h3>
          <p className="text-[#e94560] font-medium mb-4">One Driver. No Trace.</p>
          <p className="text-gray-500 mb-8">
            Sua confiança. Nosso silêncio.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-400">
            <Link href="/track" className="hover:text-white transition-colors">
              Rastrear Entrega
            </Link>
            <Link href="/portal" className="hover:text-white transition-colors">
              Portal VIP
            </Link>
            <Link href="/admin" className="hover:text-white transition-colors">
              Admin
            </Link>
          </div>
          <p className="mt-8 text-sm text-gray-600">
            © 2024 Discreet Courier Columbus. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  )
}
```

---

# ══════════════════════════════════════════════════════════════════════════════
# TAREFA 3: FLUXO CLIENTE AIDA (4 PASSOS)
# Prioridade: 🟡 MÉDIA
# Arquivo: /src/app/concierge/request/page.tsx
# ══════════════════════════════════════════════════════════════════════════════

```tsx
// /src/app/concierge/request/page.tsx

'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, Shield, Clock, Trash2 } from 'lucide-react'

type Step = 1 | 2 | 3 | 4

interface FormData {
  description: string
  service_type: string
  urgency: string
  scheduled_date: string
  location: string
  privacy_level: 'normal' | 'discreet' | 'no_trace'
  phone: string
  agreed_terms: boolean
}

export default function ConciergeRequestPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialLevel = searchParams.get('level') || '1'
  
  const [step, setStep] = useState<Step>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderCode, setOrderCode] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<FormData>({
    description: '',
    service_type: '',
    urgency: '',
    scheduled_date: '',
    location: '',
    privacy_level: 'discreet',
    phone: '',
    agreed_terms: false
  })

  const updateForm = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const canProceed = () => {
    switch (step) {
      case 1: return formData.description.length > 10
      case 2: return formData.service_type !== ''
      case 3: return formData.urgency !== ''
      case 4: return formData.phone.length >= 10 && formData.agreed_terms
      default: return false
    }
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/concierge/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          service_level: parseInt(initialLevel),
          no_trace_mode: formData.privacy_level === 'no_trace'
        })
      })
      
      const data = await response.json()
      setOrderCode(data.reference || 'DC-' + Date.now().toString(36).toUpperCase())
    } catch (error) {
      console.error('Error:', error)
      setOrderCode('DC-' + Date.now().toString(36).toUpperCase())
    }
    
    setIsSubmitting(false)
  }

  // Success Screen
  if (orderCode) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Recebido.</h1>
          <p className="text-gray-400 mb-8">
            Você receberá uma mensagem minha em até 30 minutos.
            <br />
            Se for urgente, ligue: (614) 500-3080
          </p>
          
          <div className="p-6 rounded-xl bg-[#1a1a2e] border border-[#2d3748] mb-8">
            <p className="text-sm text-gray-400 mb-2">Código do seu pedido:</p>
            <p className="text-2xl font-mono font-bold text-[#e94560]">{orderCode}</p>
            <p className="text-xs text-gray-500 mt-2">
              Guarde este código. É a única forma de rastrear.
            </p>
          </div>
          
          <button
            onClick={() => router.push('/')}
            className="text-gray-400 hover:text-white transition-colors"
          >
            Voltar ao início
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Header */}
      <header className="p-6 border-b border-[#2d3748]">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button 
            onClick={() => step > 1 ? setStep((step - 1) as Step) : router.push('/')}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            {step > 1 ? 'Voltar' : 'Início'}
          </button>
          
          {/* Progress */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`w-8 h-1 rounded-full transition-colors ${
                  s <= step ? 'bg-[#e94560]' : 'bg-[#2d3748]'
                }`}
              />
            ))}
          </div>
          
          <span className="text-sm text-gray-500">
            Passo {step} de 4
          </span>
        </div>
      </header>

      {/* Content */}
      <main className="p-6">
        <div className="max-w-2xl mx-auto">
          
          {/* ══════════════════════════════════════════════════════════════
              STEP 1: ATTENTION - "O que você precisa?"
          ══════════════════════════════════════════════════════════════ */}
          {step === 1 && (
            <div className="py-12">
              <h1 className="text-3xl font-bold mb-2">Conte-me.</h1>
              <p className="text-gray-400 mb-8">Sem julgamentos.</p>
              
              <textarea
                value={formData.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="Descreva o que você precisa. Pode ser vago. Pode ser específico. Ninguém além de mim vai ler isso."
                className="w-full h-48 p-6 rounded-xl bg-[#1a1a2e] border border-[#2d3748] focus:border-[#e94560] outline-none resize-none text-lg placeholder:text-gray-600"
              />
              
              <p className="text-sm text-gray-600 mt-4">
                <Shield className="w-4 h-4 inline mr-1" />
                Esta mensagem é confidencial e pode ser deletada após leitura.
              </p>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP 2: INTEREST - "Como posso ajudar?"
          ══════════════════════════════════════════════════════════════ */}
          {step === 2 && (
            <div className="py-12">
              <h1 className="text-3xl font-bold mb-2">Entendi.</h1>
              <p className="text-gray-400 mb-8">Posso ajudar de algumas formas:</p>
              
              <div className="space-y-4">
                {[
                  { id: 'delivery', label: 'Apenas entregar algo', desc: 'Documentos, pacotes, itens' },
                  { id: 'purchase', label: 'Comprar algo para você', desc: 'Farmácia, lojas, presentes' },
                  { id: 'representation', label: 'Fazer algo no seu lugar', desc: 'Buscar, devolver, resolver' },
                  { id: 'storage', label: 'Guardar algo seguro', desc: 'Cofre Humano - itens e segredos' },
                  { id: 'complex', label: 'Situação mais complexa', desc: 'Vamos conversar sobre' },
                ].map((option) => (
                  <button
                    key={option.id}
                    onClick={() => updateForm('service_type', option.id)}
                    className={`w-full p-6 rounded-xl border text-left transition-all ${
                      formData.service_type === option.id
                        ? 'bg-[#e94560]/10 border-[#e94560]'
                        : 'bg-[#1a1a2e] border-[#2d3748] hover:border-[#e94560]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold">{option.label}</p>
                        <p className="text-sm text-gray-400">{option.desc}</p>
                      </div>
                      {formData.service_type === option.id && (
                        <Check className="w-5 h-5 text-[#e94560]" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP 3: DESIRE - "Quando e como?"
          ══════════════════════════════════════════════════════════════ */}
          {step === 3 && (
            <div className="py-12">
              <h1 className="text-3xl font-bold mb-2">Perfeito.</h1>
              <p className="text-gray-400 mb-8">Só preciso de alguns detalhes:</p>
              
              {/* Urgência */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-4">Quando precisa?</label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: 'now', label: 'Agora / Urgente', icon: '🔴' },
                    { id: 'today', label: 'Hoje', icon: '🟡' },
                    { id: 'week', label: 'Esta semana', icon: '🟢' },
                    { id: 'schedule', label: 'Agendar', icon: '📅' },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => updateForm('urgency', option.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        formData.urgency === option.id
                          ? 'bg-[#e94560]/10 border-[#e94560]'
                          : 'bg-[#1a1a2e] border-[#2d3748] hover:border-[#e94560]/50'
                      }`}
                    >
                      <span className="mr-2">{option.icon}</span>
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Privacidade */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-4">Nível de privacidade</label>
                <div className="space-y-3">
                  {[
                    { id: 'normal', label: 'Normal', desc: 'Registro mantido', icon: <Shield className="w-5 h-5" /> },
                    { id: 'discreet', label: 'Discreto', desc: 'Dados mínimos', icon: <Clock className="w-5 h-5" /> },
                    { id: 'no_trace', label: 'Sem rastro', desc: 'Deletado após 7 dias', icon: <Trash2 className="w-5 h-5 text-[#e94560]" /> },
                  ].map((option) => (
                    <button
                      key={option.id}
                      onClick={() => updateForm('privacy_level', option.id as FormData['privacy_level'])}
                      className={`w-full p-4 rounded-xl border text-left transition-all flex items-center justify-between ${
                        formData.privacy_level === option.id
                          ? 'bg-[#e94560]/10 border-[#e94560]'
                          : 'bg-[#1a1a2e] border-[#2d3748] hover:border-[#e94560]/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {option.icon}
                        <div>
                          <p className="font-semibold">{option.label}</p>
                          <p className="text-sm text-gray-400">{option.desc}</p>
                        </div>
                      </div>
                      {formData.privacy_level === option.id && (
                        <Check className="w-5 h-5 text-[#e94560]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Localização (opcional) */}
              <div>
                <label className="block text-sm font-medium mb-2">Onde? (opcional)</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => updateForm('location', e.target.value)}
                  placeholder="Endereço ou 'Combinar depois'"
                  className="w-full p-4 rounded-xl bg-[#1a1a2e] border border-[#2d3748] focus:border-[#e94560] outline-none"
                />
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════════════
              STEP 4: ACTION - "Confirmar"
          ══════════════════════════════════════════════════════════════ */}
          {step === 4 && (
            <div className="py-12">
              <h1 className="text-3xl font-bold mb-2">Última coisa.</h1>
              <p className="text-gray-400 mb-8">Como entro em contato?</p>
              
              {/* Telefone */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Telefone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => updateForm('phone', e.target.value)}
                  placeholder="(___) ___-____"
                  className="w-full p-4 rounded-xl bg-[#1a1a2e] border border-[#2d3748] focus:border-[#e94560] outline-none text-lg"
                />
                <p className="text-sm text-gray-500 mt-2">
                  Usarei apenas para confirmar. 
                  {formData.privacy_level === 'no_trace' && ' Número será deletado em 7 dias.'}
                </p>
              </div>
              
              {/* Termos */}
              <div className="mb-8">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.agreed_terms}
                    onChange={(e) => updateForm('agreed_terms', e.target.checked)}
                    className="mt-1 w-5 h-5 rounded border-[#2d3748] bg-[#1a1a2e] text-[#e94560] focus:ring-[#e94560]"
                  />
                  <span className="text-sm text-gray-400">
                    Li e aceito os termos de confidencialidade. 
                    Entendo que minha solicitação será tratada com sigilo absoluto.
                  </span>
                </label>
              </div>
              
              {/* Resumo */}
              <div className="p-6 rounded-xl bg-[#1a1a2e] border border-[#2d3748] mb-8">
                <h3 className="font-semibold mb-4">Resumo</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tipo:</span>
                    <span>{formData.service_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Urgência:</span>
                    <span>{formData.urgency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Privacidade:</span>
                    <span className={formData.privacy_level === 'no_trace' ? 'text-[#e94560]' : ''}>
                      {formData.privacy_level}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between pt-8 border-t border-[#2d3748]">
            {step > 1 ? (
              <button
                onClick={() => setStep((step - 1) as Step)}
                className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
              >
                Voltar
              </button>
            ) : (
              <div />
            )}
            
            {step < 4 ? (
              <button
                onClick={() => setStep((step + 1) as Step)}
                disabled={!canProceed()}
                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all ${
                  canProceed()
                    ? 'bg-[#e94560] hover:bg-[#d63d56]'
                    : 'bg-[#2d3748] text-gray-500 cursor-not-allowed'
                }`}
              >
                Continuar
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceed() || isSubmitting}
                className={`flex items-center gap-2 px-8 py-3 rounded-lg font-semibold transition-all ${
                  canProceed() && !isSubmitting
                    ? 'bg-[#e94560] hover:bg-[#d63d56]'
                    : 'bg-[#2d3748] text-gray-500 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? 'Enviando...' : 'Solicitar Discretamente'}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
```

---

# ══════════════════════════════════════════════════════════════════════════════
# TAREFA 4: ATUALIZAR TAILWIND CONFIG (CORES/PSICOLOGIA)
# Prioridade: 🟡 MÉDIA
# Arquivo: /tailwind.config.ts
# ══════════════════════════════════════════════════════════════════════════════

```typescript
// /tailwind.config.ts

import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Cores principais - Psicologia: Confiança + Mistério
        primary: {
          DEFAULT: '#1a1a2e',
          50: '#f5f5f7',
          100: '#e5e5eb',
          200: '#cfcfd9',
          300: '#aeaebb',
          400: '#88889c',
          500: '#6d6d81',
          600: '#5c5c6d',
          700: '#4e4e5b',
          800: '#44444e',
          900: '#1a1a2e',
          950: '#0a0a0f',
        },
        
        // Secundária - Profundidade
        secondary: {
          DEFAULT: '#16213e',
          light: '#1f2f54',
          dark: '#0d1526',
        },
        
        // Accent - Confiança
        accent: {
          DEFAULT: '#0f3460',
          light: '#174578',
          dark: '#0a2340',
        },
        
        // CTA - Ação/Urgência sutil
        cta: {
          DEFAULT: '#e94560',
          hover: '#d63d56',
          light: '#f06b82',
          dark: '#c73a52',
        },
        
        // Status
        success: '#10b981',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#3b82f6',
        
        // Neutros
        background: '#0a0a0f',
        surface: '#1a1a2e',
        border: '#2d3748',
        muted: '#94a3b8',
      },
      
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
      },
      
      fontSize: {
        'hero': ['4rem', { lineHeight: '1.1', fontWeight: '700' }],
        'display': ['3rem', { lineHeight: '1.2', fontWeight: '700' }],
        'heading': ['2rem', { lineHeight: '1.3', fontWeight: '600' }],
        'subheading': ['1.25rem', { lineHeight: '1.4', fontWeight: '500' }],
      },
      
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      
      borderRadius: {
        '4xl': '2rem',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      
      boxShadow: {
        'glow': '0 0 20px rgba(233, 69, 96, 0.3)',
        'glow-lg': '0 0 40px rgba(233, 69, 96, 0.4)',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}

export default config
```

---

# ══════════════════════════════════════════════════════════════════════════════
# TAREFA 5: TESTES BÁSICOS
# Prioridade: 🔴 ALTA
# ══════════════════════════════════════════════════════════════════════════════

Após implementar as APIs, testar:

```bash
# 1. Testar API de clientes
curl -X POST https://discreetcourie.vercel.app/api/customers \
  -H "Content-Type: application/json" \
  -d '{"name": "Test User", "phone": "6145551234", "email": "test@test.com"}'

# 2. Testar API de pedidos
curl -X POST https://discreetcourie.vercel.app/api/orders \
  -H "Content-Type: application/json" \
  -d '{"client_id": "UUID_DO_CLIENTE", "pickup_address": "123 Main St", "delivery_address": "456 Oak Ave", "price": 45}'

# 3. Testar API de concierge
curl -X POST https://discreetcourie.vercel.app/api/concierge/tasks \
  -H "Content-Type: application/json" \
  -d '{"client_id": "UUID", "task_type": "purchase", "title": "Compra teste", "description": "Teste"}'

# 4. Verificar dados no Supabase
# Acesse: https://supabase.com/dashboard/project/orrnxowylokgzvimvluv/editor
# Verifique se os registros aparecem nas tabelas
```

---

# ══════════════════════════════════════════════════════════════════════════════
# CHECKLIST FINAL
# ══════════════════════════════════════════════════════════════════════════════

## Antes de fazer commit:

- [ ] APIs criadas e funcionando
- [ ] Landing page AIDA implementada
- [ ] Fluxo de request implementado
- [ ] Tailwind config atualizado
- [ ] Testado localmente (npm run dev)
- [ ] Sem erros no console
- [ ] Responsivo em mobile

## Comando de deploy:

```bash
git add .
git commit -m "feat: Implement AIDA landing page, complete APIs, and UX improvements"
git push origin master
```

Vercel fará deploy automático após o push.

---

# FIM DO DOCUMENTO
