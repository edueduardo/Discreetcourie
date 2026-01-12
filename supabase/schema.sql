-- Discreet Courier Columbus - Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM Types
CREATE TYPE delivery_status AS ENUM (
  'pending',
  'confirmed', 
  'picked_up',
  'in_transit',
  'delivered',
  'failed',
  'cancelled'
);

CREATE TYPE delivery_priority AS ENUM (
  'standard',
  'express',
  'urgent'
);

CREATE TYPE privacy_level AS ENUM (
  'full',
  'city_only',
  'status_only',
  'none'
);

CREATE TYPE call_direction AS ENUM (
  'inbound',
  'outbound'
);

CREATE TYPE call_status AS ENUM (
  'completed',
  'failed',
  'no_answer'
);

-- Clients Table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  address TEXT,
  notes TEXT,
  privacy_level privacy_level DEFAULT 'status_only',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on phone for quick lookups
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_email ON clients(email);

-- Deliveries Table
CREATE TABLE deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tracking_code VARCHAR(20) UNIQUE NOT NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Pickup details
  pickup_address TEXT NOT NULL,
  pickup_contact VARCHAR(255),
  pickup_phone VARCHAR(50),
  pickup_notes TEXT,
  pickup_time TIMESTAMPTZ,
  
  -- Delivery details
  delivery_address TEXT NOT NULL,
  delivery_contact VARCHAR(255),
  delivery_phone VARCHAR(50),
  delivery_notes TEXT,
  delivery_time TIMESTAMPTZ,
  
  -- Package info
  package_description TEXT,
  package_size VARCHAR(20) DEFAULT 'small', -- small, medium, large
  is_fragile BOOLEAN DEFAULT FALSE,
  is_confidential BOOLEAN DEFAULT FALSE,
  
  -- Status
  status delivery_status DEFAULT 'pending',
  priority delivery_priority DEFAULT 'standard',
  
  -- Pricing
  price DECIMAL(10, 2) DEFAULT 0,
  paid BOOLEAN DEFAULT FALSE,
  payment_method VARCHAR(50),
  
  -- Proof of delivery
  proof_photo_url TEXT,
  signature_url TEXT,
  delivered_at TIMESTAMPTZ,
  delivery_notes_final TEXT,
  
  -- Bland.ai reference
  bland_call_id VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_deliveries_tracking ON deliveries(tracking_code);
CREATE INDEX idx_deliveries_client ON deliveries(client_id);
CREATE INDEX idx_deliveries_status ON deliveries(status);
CREATE INDEX idx_deliveries_created ON deliveries(created_at DESC);

-- Delivery Events Table (for tracking history)
CREATE TABLE delivery_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
  status delivery_status NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_delivery ON delivery_events(delivery_id);

-- Bland.ai Calls Table
CREATE TABLE bland_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id VARCHAR(255) UNIQUE NOT NULL,
  delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  phone_number VARCHAR(50) NOT NULL,
  direction call_direction DEFAULT 'inbound',
  status call_status DEFAULT 'completed',
  duration INTEGER, -- in seconds
  transcript TEXT,
  summary TEXT,
  extracted_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_calls_delivery ON bland_calls(delivery_id);
CREATE INDEX idx_calls_phone ON bland_calls(phone_number);

-- Invoices Table (for B2B clients)
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_client ON invoices(client_id);

-- Invoice Items Table
CREATE TABLE invoice_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
  delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_deliveries_updated_at
  BEFORE UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Auto-create delivery event on status change
CREATE OR REPLACE FUNCTION create_delivery_event()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO delivery_events (delivery_id, status, notes)
    VALUES (NEW.id, NEW.status, 'Status updated');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER delivery_status_change
  AFTER UPDATE ON deliveries
  FOR EACH ROW
  EXECUTE FUNCTION create_delivery_event();

-- Row Level Security (RLS) Policies
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE bland_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Admin can do everything (you'll need to set up admin role)
-- For now, allow authenticated users full access (configure based on your needs)
CREATE POLICY "Allow authenticated users" ON clients
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON deliveries
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON delivery_events
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON bland_calls
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON invoices
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON invoice_items
  FOR ALL USING (auth.role() = 'authenticated');

-- Public tracking access (read-only for specific delivery by tracking code)
CREATE POLICY "Public tracking access" ON deliveries
  FOR SELECT USING (true);

CREATE POLICY "Public tracking events" ON delivery_events
  FOR SELECT USING (true);

-- ============================================
-- DISCREET CONCIERGE - Premium Services Tables
-- ============================================

-- Service tier enum
CREATE TYPE service_tier AS ENUM (
  'courier',
  'discreet', 
  'concierge',
  'fixer'
);

-- Task category enum
CREATE TYPE task_category AS ENUM (
  'delivery',
  'discreet_delivery',
  'purchase',
  'errand',
  'retrieval',
  'representation',
  'waiting',
  'special'
);

-- Task status enum
CREATE TYPE task_status AS ENUM (
  'requested',
  'quoted',
  'accepted',
  'in_progress',
  'completed',
  'cancelled'
);

-- Concierge Tasks Table
CREATE TABLE concierge_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  
  -- Task details
  service_tier service_tier NOT NULL DEFAULT 'concierge',
  category task_category NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  special_instructions TEXT,
  
  -- Location (if applicable)
  location_address TEXT,
  location_contact VARCHAR(255),
  location_phone VARCHAR(50),
  
  -- Purchase details (if purchase task)
  purchase_items JSONB,
  purchase_budget DECIMAL(10, 2),
  purchase_receipt_url TEXT,
  
  -- Status & Pricing
  status task_status DEFAULT 'requested',
  quoted_price DECIMAL(10, 2),
  final_price DECIMAL(10, 2),
  paid BOOLEAN DEFAULT FALSE,
  
  -- Privacy - NO TRACE MODE
  no_trace_mode BOOLEAN DEFAULT FALSE,
  auto_delete_at TIMESTAMPTZ,
  
  -- Proof
  proof_photos TEXT[],
  notes TEXT,
  
  -- NDA
  nda_required BOOLEAN DEFAULT FALSE,
  nda_signed BOOLEAN DEFAULT FALSE,
  nda_signed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_client ON concierge_tasks(client_id);
CREATE INDEX idx_tasks_status ON concierge_tasks(status);
CREATE INDEX idx_tasks_tier ON concierge_tasks(service_tier);
CREATE INDEX idx_tasks_auto_delete ON concierge_tasks(auto_delete_at) WHERE auto_delete_at IS NOT NULL;

-- Secure Messages Table (Encrypted Chat)
CREATE TABLE secure_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES concierge_tasks(id) ON DELETE CASCADE,
  sender_type VARCHAR(10) NOT NULL CHECK (sender_type IN ('client', 'admin')),
  sender_id UUID,
  content TEXT NOT NULL,
  encrypted BOOLEAN DEFAULT TRUE,
  read BOOLEAN DEFAULT FALSE,
  auto_delete_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_task ON secure_messages(task_id);
CREATE INDEX idx_messages_auto_delete ON secure_messages(auto_delete_at) WHERE auto_delete_at IS NOT NULL;

-- NDA Documents Table
CREATE TABLE nda_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  version VARCHAR(20) NOT NULL DEFAULT '1.0',
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address VARCHAR(45),
  user_agent TEXT,
  signature_data TEXT,
  terms_accepted JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_nda_client ON nda_documents(client_id);

-- VIP Clients (upgraded to premium tiers)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS vip_tier service_tier;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS nda_signed BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS direct_line VARCHAR(50);
ALTER TABLE clients ADD COLUMN IF NOT EXISTS retainer_active BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS retainer_amount DECIMAL(10, 2);

-- Trigger for auto-updating concierge tasks
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON concierge_tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Function to auto-delete no-trace records
CREATE OR REPLACE FUNCTION cleanup_no_trace_records()
RETURNS void AS $$
BEGIN
  -- Delete expired tasks
  DELETE FROM concierge_tasks 
  WHERE no_trace_mode = TRUE 
    AND auto_delete_at IS NOT NULL 
    AND auto_delete_at < NOW();
  
  -- Delete expired messages
  DELETE FROM secure_messages 
  WHERE auto_delete_at IS NOT NULL 
    AND auto_delete_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to set auto-delete date (7 days after completion)
CREATE OR REPLACE FUNCTION set_auto_delete_on_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.no_trace_mode = TRUE THEN
    NEW.auto_delete_at = NOW() + INTERVAL '7 days';
    NEW.completed_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_completion_auto_delete
  BEFORE UPDATE ON concierge_tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION set_auto_delete_on_complete();

-- RLS for new tables
ALTER TABLE concierge_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE secure_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE nda_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users" ON concierge_tasks
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON secure_messages
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON nda_documents
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- END DISCREET CONCIERGE TABLES
-- ============================================

-- ============================================
-- PREMIUM SERVICES TABLES (Features 10-15 + Top 10)
-- ============================================

-- Vault Items (Cofre Humano + Última Vontade + Cápsula do Tempo)
CREATE TABLE vault_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Identification
  item_code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  
  -- Type
  item_type VARCHAR(20) NOT NULL DEFAULT 'storage' CHECK (item_type IN ('storage', 'last_will', 'time_capsule')),
  
  -- Dates
  stored_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  deliver_at TIMESTAMPTZ,
  
  -- Last Will specific
  is_last_will BOOLEAN DEFAULT FALSE,
  last_will_recipient_name VARCHAR(255),
  last_will_recipient_phone VARCHAR(50),
  last_will_recipient_email VARCHAR(255),
  last_will_recipient_relation VARCHAR(100),
  last_will_message TEXT,
  last_will_trigger VARCHAR(20) CHECK (last_will_trigger IN ('manual', 'no_checkin', 'confirmed_death', 'date')),
  last_will_checkin_days INTEGER DEFAULT 30,
  last_will_last_checkin TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'delivered', 'expired', 'destroyed')),
  delivered_at TIMESTAMPTZ,
  
  -- Storage
  storage_location VARCHAR(255),
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vault_client ON vault_items(client_id);
CREATE INDEX idx_vault_status ON vault_items(status);
CREATE INDEX idx_vault_type ON vault_items(item_type);
CREATE INDEX idx_vault_checkin ON vault_items(last_will_last_checkin) WHERE is_last_will = TRUE;

-- Destruction Logs (Ritual de Destruição)
CREATE TABLE destruction_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  customer_code VARCHAR(50) NOT NULL,
  
  -- What was destroyed
  items_destroyed JSONB NOT NULL DEFAULT '{}',
  
  -- Details
  requested_by VARCHAR(20) NOT NULL CHECK (requested_by IN ('customer', 'system', 'admin')),
  reason TEXT,
  
  -- Proof
  video_url TEXT,
  video_sent BOOLEAN DEFAULT FALSE,
  
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_destruction_customer ON destruction_logs(customer_code);

-- Client Codes (Código Anônimo - Feature 10)
CREATE TABLE client_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  code VARCHAR(50) UNIQUE NOT NULL,
  code_type VARCHAR(20) DEFAULT 'primary' CHECK (code_type IN ('primary', 'temporary', 'burner')),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_codes_client ON client_codes(client_id);
CREATE INDEX idx_codes_code ON client_codes(code);

-- Emergency Protocols (Feature 13)
CREATE TABLE emergency_protocols (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Protocol details
  protocol_name VARCHAR(255) NOT NULL,
  trigger_condition TEXT NOT NULL,
  actions JSONB NOT NULL,
  
  -- Contacts
  emergency_contacts JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  last_triggered_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_emergency_client ON emergency_protocols(client_id);

-- Vetting Records (Feature 14 - Santuário)
CREATE TABLE vetting_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Vetting process
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_review', 'approved', 'rejected', 'probation')),
  
  -- Evaluation
  source VARCHAR(100),
  referral_code VARCHAR(50),
  interview_notes TEXT,
  risk_assessment VARCHAR(20) CHECK (risk_assessment IN ('low', 'medium', 'high', 'unknown')),
  red_flags JSONB,
  
  -- Decision
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  decision_notes TEXT,
  
  -- Probation
  probation_until TIMESTAMPTZ,
  probation_conditions TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vetting_client ON vetting_records(client_id);
CREATE INDEX idx_vetting_status ON vetting_records(status);

-- Service Agreements (Feature 15 - Termos VIP + Pacto de Lealdade)
CREATE TABLE service_agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Type
  agreement_type VARCHAR(20) NOT NULL CHECK (agreement_type IN ('nda', 'pact', 'terms', 'vip_terms')),
  version VARCHAR(20) DEFAULT '1.0',
  
  -- Content
  content TEXT NOT NULL,
  
  -- Customer signature
  customer_signed BOOLEAN DEFAULT FALSE,
  customer_signed_at TIMESTAMPTZ,
  customer_ip VARCHAR(45),
  customer_signature_data TEXT,
  
  -- Provider signature (for mutual NDAs)
  provider_signed BOOLEAN DEFAULT FALSE,
  provider_signed_at TIMESTAMPTZ,
  
  -- Validity
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  
  -- Status
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'terminated')),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agreements_client ON service_agreements(client_id);
CREATE INDEX idx_agreements_type ON service_agreements(agreement_type);

-- Guardian Mode Subscriptions (Serviço Premium 3)
CREATE TABLE guardian_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Subscription
  is_active BOOLEAN DEFAULT TRUE,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Pricing
  monthly_rate DECIMAL(10, 2) DEFAULT 500.00,
  last_payment_at TIMESTAMPTZ,
  
  -- Contact
  direct_line VARCHAR(50),
  priority_level INTEGER DEFAULT 1,
  
  -- Stats
  total_alerts INTEGER DEFAULT 0,
  last_alert_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_guardian_client ON guardian_subscriptions(client_id);
CREATE INDEX idx_guardian_active ON guardian_subscriptions(is_active) WHERE is_active = TRUE;

-- Apply triggers for updated_at
CREATE TRIGGER update_vault_updated_at
  BEFORE UPDATE ON vault_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_emergency_updated_at
  BEFORE UPDATE ON emergency_protocols
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_vetting_updated_at
  BEFORE UPDATE ON vetting_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- RLS for new tables
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE destruction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE vetting_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardian_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users" ON vault_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON destruction_logs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON client_codes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON emergency_protocols
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON vetting_records
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON service_agreements
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON guardian_subscriptions
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- END PREMIUM SERVICES TABLES
-- ============================================

-- Sample data for testing
INSERT INTO clients (name, company, email, phone, privacy_level) VALUES
  ('Medical Office', 'Columbus Medical Center', 'contact@colmed.com', '(614) 555-0101', 'city_only'),
  ('Law Firm LLC', 'Smith & Associates', 'office@smithlaw.com', '(614) 555-0202', 'status_only'),
  ('Pharmacy Plus', 'HealthFirst Pharmacy', 'orders@healthfirst.com', '(614) 555-0303', 'full');

-- Insert sample deliveries
INSERT INTO deliveries (tracking_code, client_id, pickup_address, delivery_address, status, priority, price) 
SELECT 
  'DC-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)),
  id,
  '123 Main St, Columbus, OH',
  '456 Oak Ave, Westerville, OH',
  'delivered',
  'standard',
  35.00
FROM clients WHERE name = 'Medical Office';
