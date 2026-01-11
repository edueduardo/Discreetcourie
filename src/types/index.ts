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
  name: string
  company?: string
  email: string
  phone: string
  address?: string
  notes?: string
  privacy_level: PrivacyLevel
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
