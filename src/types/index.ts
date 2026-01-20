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
    features: ['Purchase service', 'Errand running', 'Representation', 'Direct SMS chat', 'Extended hours 8AM-8PM', 'Zero judgment'],
    icon: 'UserCheck'
  },
  {
    id: 'fixer',
    name: 'The Fixer',
    tagline: 'Problems Solved',
    description: 'Complex situations handled with absolute confidence and discretion',
    priceRange: '$200-500/task',
    features: ['VIP priority', 'Direct line access', 'Up to 4 hours per task', 'Complete confidentiality', 'NDA protected', 'Monthly retainer (48h notice)'],
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
  'monthly_retainer': { min: 500, max: 1000, description: 'Priority access retainer' },
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
  video_url?: string
  certificate_code?: string

  executed_at: string
  updated_at?: string
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

// Solo-viable premium services only
export const PREMIUM_SERVICES: PremiumService[] = [
  {
    id: 'nda_protection',
    name: 'NDA Protection',
    tagline: 'Your privacy, legally protected',
    description: 'Mutual non-disclosure agreement for complete confidentiality',
    how_it_works: 'Digital NDA signed before any service - legally binding protection',
    price: 'Included',
    why_powerful: 'Legal protection for sensitive deliveries',
    tier: 'discreet'
  },
  {
    id: 'photo_proof',
    name: 'Photo Proof of Delivery',
    tagline: 'Visual confirmation, instant peace of mind',
    description: 'Timestamped photo evidence of every delivery',
    how_it_works: 'Photo taken at delivery with GPS coordinates and timestamp',
    price: 'Included',
    why_powerful: 'Proof without paper trail',
    tier: 'standard'
  },
  {
    id: 'personal_errand',
    name: 'Personal Errand Service',
    tagline: 'Your task, handled discreetly',
    description: 'Purchase, pickup, or handle personal errands on your behalf',
    how_it_works: 'You provide instructions, we execute with discretion',
    price: 'From $75/hour',
    why_powerful: 'Avoid being seen, save time',
    tier: 'concierge',
    examples: ['Purchase embarrassing items', 'Pick up from awkward locations', 'Return items to ex']
  },
  {
    id: 'soft_delete',
    name: 'Data Deletion on Request',
    tagline: 'No trace left behind',
    description: 'Complete deletion of your data from our systems on request',
    how_it_works: 'One request = all your data permanently deleted',
    price: 'Free',
    why_powerful: 'True privacy - we forget you existed',
    tier: 'discreet'
  },
  {
    id: 'priority_booking',
    name: 'Priority Scheduling',
    tagline: 'Your delivery comes first',
    description: 'VIP clients get priority in scheduling queue',
    how_it_works: 'Monthly retainer guarantees same-day availability',
    price: '$99/month',
    why_powerful: 'Never wait for availability',
    tier: 'concierge'
  },
  {
    id: 'recurring_delivery',
    name: 'Recurring Delivery',
    tagline: 'Set it and forget it',
    description: 'Scheduled recurring deliveries with automatic booking',
    how_it_works: 'Weekly, bi-weekly, or monthly automated pickups',
    price: '10% discount on recurring',
    why_powerful: 'Convenience + savings',
    tier: 'standard',
    examples: ['Weekly document exchange', 'Monthly supply delivery', 'Regular prescription pickup']
  }
]
