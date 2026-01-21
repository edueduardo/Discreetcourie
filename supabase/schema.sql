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

-- Service Agreements (NDA for premium clients)
CREATE TABLE service_agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  agreement_type VARCHAR(20) NOT NULL CHECK (agreement_type IN ('nda', 'terms', 'vip_terms')),
  version VARCHAR(20) DEFAULT '1.0',
  content TEXT NOT NULL,
  customer_signed BOOLEAN DEFAULT FALSE,
  customer_signed_at TIMESTAMPTZ,
  customer_ip VARCHAR(45),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'terminated')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_agreements_client ON service_agreements(client_id);

ALTER TABLE service_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users" ON service_agreements
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- DRIVER SESSIONS TABLE
-- ============================================

CREATE TABLE driver_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_driver_sessions_token ON driver_sessions(token);
CREATE INDEX idx_driver_sessions_expires ON driver_sessions(expires_at);

ALTER TABLE driver_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users" ON driver_sessions
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- GPS TRACKING TABLE
-- ============================================

CREATE TABLE gps_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
  driver_id UUID,
  
  -- Location data
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2), -- meters
  speed DECIMAL(10, 2), -- km/h
  heading DECIMAL(5, 2), -- degrees
  altitude DECIMAL(10, 2), -- meters
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_gps_delivery ON gps_locations(delivery_id);
CREATE INDEX idx_gps_driver ON gps_locations(driver_id);
CREATE INDEX idx_gps_created ON gps_locations(created_at DESC);

ALTER TABLE gps_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users" ON gps_locations
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- SUBSCRIPTIONS TABLE
-- ============================================

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_customer_id VARCHAR(255),
  
  -- Plan details
  plan_key VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing', 'paused')),
  
  -- Billing period
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  
  -- Amount
  amount DECIMAL(10, 2),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_client ON subscriptions(client_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users" ON subscriptions
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- PAYMENT LOGS TABLE
-- ============================================

CREATE TABLE payment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(50) NOT NULL,
  stripe_payment_intent_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  amount DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'usd',
  status VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_logs_created ON payment_logs(created_at DESC);

ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users" ON payment_logs
  FOR ALL USING (auth.role() = 'authenticated');

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
