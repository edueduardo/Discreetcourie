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
