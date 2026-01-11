export type DeliveryStatus = 
  | 'pending'
  | 'confirmed'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'cancelled'

export type DeliveryPriority = 'standard' | 'express' | 'urgent'

export type PrivacyLevel = 'full' | 'city_only' | 'status_only' | 'none'

export interface Client {
  id: string

  // Privacy Code Name (SHADOW-7842)
  code_name?: string

  // Encrypted data (for VIP clients)
  name_encrypted?: string
  phone_encrypted?: string
  email_encrypted?: string

  // Regular data (for standard clients)
  name: string
  company?: string
  email: string
  phone: string
  address?: string
  notes?: string

  // Service level
  type: 'b2b' | 'b2c'
  service_level: number // 1=Courier, 2=Discreet, 3=Concierge, 4=Fixer
  privacy_level: PrivacyLevel

  // VIP Status
  is_vip: boolean
  vip_tier?: ServiceTier

  // Guardian Mode (24/7 availability)
  guardian_mode_active: boolean
  guardian_mode_until?: string

  // Pacto de Lealdade (Mutual NDA)
  pact_signed: boolean
  pact_signed_at?: string
  nda_signed: boolean

  // Vetting
  vetting_status: 'none' | 'pending' | 'approved' | 'rejected' | 'probation'
  vetting_notes?: string
  vetting_date?: string
  red_flags?: string[]

  // Preferences
  preferred_payment: 'normal' | 'anonymous'
  communication_preference: 'sms' | 'chat' | 'both'
  direct_line?: string

  // Retainer
  retainer_active: boolean
  retainer_amount?: number

  // Auto-delete
  auto_delete_after_days?: number
  last_activity: string

  created_at: string
  updated_at: string
}

export interface Delivery {
  id: string
  tracking_code: string
  client_id: string
  client?: Client
  
  // Pickup details
  pickup_address: string
  pickup_contact?: string
  pickup_phone?: string
  pickup_notes?: string
  pickup_time?: string
  
  // Delivery details
  delivery_address: string
  delivery_contact?: string
  delivery_phone?: string
  delivery_notes?: string
  delivery_time?: string
  
  // Package info
  package_description?: string
  package_size?: 'small' | 'medium' | 'large'
  is_fragile: boolean
  is_confidential: boolean
  
  // Status
  status: DeliveryStatus
  priority: DeliveryPriority
  
  // Pricing
  price: number
  paid: boolean
  payment_method?: string
  
  // Proof of delivery
  proof_photo_url?: string
  signature_url?: string
  delivered_at?: string
  delivery_notes_final?: string
  
  // Bland.ai reference
  bland_call_id?: string
  
  created_at: string
  updated_at: string
}

export interface DeliveryEvent {
  id: string
  delivery_id: string
  status: DeliveryStatus
  location?: string
  notes?: string
  created_at: string
}

export interface BlandAICall {
  id: string
  call_id: string
  delivery_id?: string
  client_id?: string
  phone_number: string
  direction: 'inbound' | 'outbound'
  status: 'completed' | 'failed' | 'no_answer'
  duration?: number
  transcript?: string
  summary?: string
  extracted_data?: {
    pickup_address?: string
    delivery_address?: string
    package_description?: string
    special_instructions?: string
    preferred_time?: string
  }
  created_at: string
}

export interface DashboardStats {
  today_deliveries: number
  pending_deliveries: number
  completed_today: number
  revenue_today: number
  revenue_week: number
  revenue_month: number
}

// ============================================
// DISCREET CONCIERGE - Premium Services
// ============================================

export type ServiceTier = 'courier' | 'discreet' | 'concierge' | 'fixer'

export type TaskCategory = 
  | 'delivery'           // Standard delivery
  | 'discreet_delivery'  // Confidential delivery  
  | 'purchase'           // Buy and deliver
  | 'errand'             // Run errands
  | 'retrieval'          // Pick up items (ex's house, etc)
  | 'representation'     // Represent client
  | 'waiting'            // Wait in lines
  | 'special'            // The Fixer tasks

export type TaskStatus = 
  | 'requested'
  | 'quoted'
  | 'accepted'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface ServiceTierInfo {
  id: ServiceTier
  name: string
  tagline: string
  description: string
  priceRange: string
  features: string[]
  icon: string
}

export const SERVICE_TIERS: ServiceTierInfo[] = [
  {
    id: 'courier',
    name: 'Standard Courier',
    tagline: 'Fast & Reliable',
    description: 'Document and package delivery across Columbus',
    priceRange: '$35-50',
    features: ['Same-day delivery', 'Real-time tracking', 'Proof of delivery', 'Photo confirmation'],
    icon: 'Package'
  },
  {
    id: 'discreet',
    name: 'Discreet Courier',
    tagline: 'Privacy Protected',
    description: 'Confidential deliveries with absolute discretion',
    priceRange: '$50-75',
    features: ['No-trace mode', 'Private proofs', 'Unmarked packaging', 'No questions asked', 'Auto-delete history'],
    icon: 'EyeOff'
  },
  {
    id: 'concierge',
    name: 'Personal Concierge',
    tagline: 'We Handle Everything',
    description: 'We buy, fetch, and handle tasks you cannot or prefer not to do',
    priceRange: '$75-150/hr',
    features: ['Purchase service', 'Errand running', 'Representation', 'Encrypted chat', '24/7 availability', 'Zero judgment'],
    icon: 'UserCheck'
  },
  {
    id: 'fixer',
    name: 'The Fixer',
    tagline: 'Problems Solved',
    description: 'Complex situations handled with absolute confidence and discretion',
    priceRange: '$200-500/task',
    features: ['VIP priority', 'Direct line access', 'No time limits', 'Complete confidentiality', 'NDA protected', 'Retainer available'],
    icon: 'Shield'
  }
]

export interface ConciergeTask {
  id: string
  client_id: string
  client?: Client
  
  // Task details
  service_tier: ServiceTier
  category: TaskCategory
  title: string
  description: string
  special_instructions?: string
  
  // Location (if applicable)
  location_address?: string
  location_contact?: string
  location_phone?: string
  
  // Purchase details (if purchase task)
  purchase_items?: PurchaseItem[]
  purchase_budget?: number
  purchase_receipt_url?: string
  
  // Status & Pricing
  status: TaskStatus
  quoted_price?: number
  final_price?: number
  paid: boolean
  
  // Privacy
  no_trace_mode: boolean
  auto_delete_at?: string
  
  // Proof
  proof_photos?: string[]
  notes?: string
  
  // NDA
  nda_signed: boolean
  nda_signed_at?: string
  
  created_at: string
  updated_at: string
  completed_at?: string
}

export interface PurchaseItem {
  id: string
  description: string
  store?: string
  quantity: number
  estimated_price?: number
  actual_price?: number
  purchased: boolean
}

export interface SecureMessage {
  id: string
  task_id?: string
  sender_type: 'client' | 'admin'
  sender_id: string
  content: string
  encrypted: boolean
  read: boolean
  auto_delete_at?: string
  created_at: string
}

export interface NDADocument {
  id: string
  client_id: string
  version: string
  signed_at: string
  ip_address?: string
  signature_data?: string
  terms_accepted: string[]
}

// Price examples for reference
export const TASK_PRICE_GUIDE = {
  // Discreet purchases
  'pregnancy_test': { min: 40, max: 60, description: 'Discreet pharmacy purchase' },
  'sensitive_medication': { min: 50, max: 80, description: 'Pharmacy pickup' },
  'adult_store': { min: 60, max: 100, description: 'Adult store purchase' },

  // Retrieval tasks
  'ex_belongings': { min: 100, max: 200, description: 'Retrieve items from ex' },
  'return_gifts': { min: 75, max: 150, description: 'Return items to someone' },

  // Waiting/Errand
  'dmv_wait': { min: 40, max: 50, description: 'Per hour waiting' },
  'store_complaint': { min: 75, max: 125, description: 'Handle complaint for you' },

  // Documents
  'divorce_papers': { min: 150, max: 250, description: 'Deliver legal documents' },
  'medical_results': { min: 75, max: 125, description: 'Pick up medical results' },

  // Premium
  'complex_situation': { min: 300, max: 500, description: 'The Fixer tasks' },
  'monthly_retainer': { min: 500, max: 1000, description: '24/7 availability' },
}

// ============================================
// VIP FEATURES - NEW TYPES
// ============================================

export interface User {
  id: string
  email: string
  role: 'admin' | 'driver'
  created_at: string
}

export type VaultItemType = 'storage' | 'last_will' | 'time_capsule'
export type VaultItemStatus = 'active' | 'delivered' | 'expired' | 'destroyed'
export type LastWillTrigger = 'manual' | 'no_checkin' | 'confirmed_death' | 'date'

export interface VaultItem {
  id: string
  client_id: string
  client?: Client

  // Identification
  item_code: string // V-001
  description: string

  // Type
  item_type: VaultItemType

  // Dates
  stored_at: string
  expires_at?: string
  deliver_at?: string

  // Last Will specific
  is_last_will: boolean
  last_will_recipient_name?: string
  last_will_recipient_phone?: string
  last_will_recipient_relation?: string
  last_will_message?: string
  last_will_trigger?: LastWillTrigger
  last_will_checkin_days?: number
  last_will_last_checkin?: string

  // Status
  status: VaultItemStatus
  delivered_at?: string

  // Location
  storage_location?: string

  // Notes
  notes?: string

  created_at: string
  updated_at: string
}

export type AgreementType = 'nda' | 'pact' | 'terms'
export type AgreementStatus = 'pending' | 'active' | 'expired' | 'terminated'

export interface ServiceAgreement {
  id: string
  client_id: string
  client?: Client

  // Type
  agreement_type: AgreementType
  version: string

  // Content
  content: string

  // Signatures
  customer_signed: boolean
  customer_signed_at?: string
  customer_ip?: string

  provider_signed: boolean
  provider_signed_at?: string

  // Validity
  valid_from?: string
  valid_until?: string

  // Status
  status: AgreementStatus

  created_at: string
}

export type DeliveryProofType = 'pickup' | 'delivery' | 'task_completion'

export interface DeliveryProof {
  id: string
  order_id?: string
  task_id?: string

  // Type
  type: DeliveryProofType

  // Files
  photo_url?: string
  photo_encrypted: boolean

  // Details
  received_by?: string
  signature_url?: string
  notes?: string

  // Location
  latitude?: number
  longitude?: number

  // Auto-delete
  auto_delete_at?: string

  captured_at: string
}

export interface DestructionLog {
  id: string
  customer_id?: string // NULL after destruction
  customer_code: string

  // What was destroyed
  items_destroyed: {
    orders?: number
    tasks?: number
    messages?: number
    vault_items?: number
    proofs?: number
  }

  // Details
  requested_by: 'customer' | 'system' | 'admin'
  reason?: string

  // Proof
  video_sent: boolean

  executed_at: string
}

export interface Setting {
  key: string
  value: any
  updated_at: string
}

// ============================================
// PREMIUM SERVICES - TOP 10
// ============================================

export interface PremiumService {
  id: string
  name: string
  tagline: string
  description: string
  how_it_works: string
  price: string
  why_powerful: string
  examples?: string[]
  tier: ServiceTier
}

export const PREMIUM_SERVICES: PremiumService[] = [
  {
    id: 'last_will',
    name: 'Última Vontade',
    tagline: 'Suas palavras finais, entregues com honra',
    description: 'Entrega de carta/item/mensagem quando cliente falecer',
    how_it_works: 'Cliente deixa item selado + instruções + destinatário. Disparamos conforme gatilho configurado.',
    price: '$300 setup + $50/ano',
    why_powerful: 'Atende medo da morte + desejo de legado',
    tier: 'fixer',
    examples: ['Carta para filho quando completar 18', 'Despedida para esposa', 'Revelação póstuma']
  },
  {
    id: 'vault',
    name: 'Cofre Humano',
    tagline: 'O que você não pode guardar, eu guardo',
    description: 'Guarda objetos, documentos, segredos que cliente não pode ter em casa',
    how_it_works: 'Cliente entrega, armazenamos em local seguro, devolvemos quando solicitado',
    price: '$100/mês',
    why_powerful: 'Atende medo de exposição + necessidade de controle',
    tier: 'fixer',
    examples: ['Documentos de divórcio escondidos', 'Presentes secretos', 'Evidências protegidas']
  },
  {
    id: 'guardian_mode',
    name: 'Guardian Mode 24/7',
    tagline: 'Você nunca está sozinho',
    description: 'Disponibilidade total, qualquer hora, qualquer situação',
    how_it_works: 'Cliente paga retainer mensal, tem linha direta 24h',
    price: '$500/mês',
    why_powerful: 'Atende medo de abandono + desejo de proteção',
    tier: 'fixer'
  },
  {
    id: 'ritual',
    name: 'Ritual de Destruição',
    tagline: 'Assista seu segredo desaparecer',
    description: 'Vídeo mostrando deleção completa de todos os dados do cliente',
    how_it_works: 'Gravamos tela deletando arquivos, enviamos prova',
    price: '$50',
    why_powerful: 'Prova visual de que segredo morreu',
    tier: 'fixer'
  },
  {
    id: 'phoenix',
    name: 'Operação Fênix',
    tagline: 'Ajudo você renascer',
    description: 'Ajuda cliente sair de situação difícil (abuso, crise, etc)',
    how_it_works: 'Planejamento + execução + discrição total',
    price: '$500+',
    why_powerful: 'Atende medo + desejo de liberdade',
    tier: 'fixer',
    examples: ['Sair de relacionamento abusivo', 'Começar vida nova', 'Desaparecer temporariamente']
  },
  {
    id: 'ghost_chat',
    name: 'Comunicação Fantasma',
    tagline: 'Palavras que nunca existiram',
    description: 'Mensagens que se autodestroem após leitura',
    how_it_works: 'Chat criptografado, mensagens somem após tempo configurado',
    price: 'Incluso Nível 4',
    why_powerful: 'Zero rastro de comunicação',
    tier: 'fixer'
  },
  {
    id: 'sanctuary',
    name: 'Santuário',
    tagline: 'Nem todos entram aqui',
    description: 'Serviço exclusivo - vetting antes de aceitar como VIP',
    how_it_works: 'Conversa + verificação + período de teste',
    price: 'Processo de entrada',
    why_powerful: 'Cria exclusividade, cliente se sente especial',
    tier: 'fixer'
  },
  {
    id: 'pact',
    name: 'Pacto de Lealdade',
    tagline: 'Minha palavra é minha honra',
    description: 'NDA mútuo - você não conta sobre ele, ele não conta sobre você',
    how_it_works: 'Contrato digital assinado por ambas as partes',
    price: '$200/ano',
    why_powerful: 'Atende medo de traição',
    tier: 'fixer'
  },
  {
    id: 'shadow_proxy',
    name: 'Procurador de Sombras',
    tagline: 'Eu enfrento por você',
    description: 'Agimos, falamos, representamos no lugar do cliente',
    how_it_works: 'Cliente dá instruções, executamos a interação',
    price: '$150-200/tarefa',
    why_powerful: 'Atende medo de confronto',
    tier: 'concierge',
    examples: ['Devolver presente do ex', 'Fazer reclamação', 'Buscar pertences']
  },
  {
    id: 'time_capsule',
    name: 'Cápsula do Tempo',
    tagline: 'Entregue quando o momento chegar',
    description: 'Entrega agendada para futuro (meses ou anos)',
    how_it_works: 'Cliente agenda data, guardamos e entregamos no dia',
    price: '$150 + $25/ano',
    why_powerful: 'Legado + controle sobre o futuro',
    tier: 'fixer',
    examples: ['Carta para filho aos 18', 'Presente de aniversário futuro', 'Revelação agendada']
  }
]
