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
