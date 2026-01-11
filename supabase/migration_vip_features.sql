-- ============================================
-- DISCREET COURIER - VIP FEATURES MIGRATION
-- Adds missing tables and fields from PRD v2.0
-- ============================================

-- ============================================
-- 1. USERS TABLE (Admin - Eduardo)
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ADD VIP FIELDS TO CLIENTS
-- ============================================

-- Code name for privacy
ALTER TABLE clients ADD COLUMN IF NOT EXISTS code_name TEXT UNIQUE;

-- Encrypted data
ALTER TABLE clients ADD COLUMN IF NOT EXISTS name_encrypted TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS phone_encrypted TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email_encrypted TEXT;

-- Service level (1=Courier, 2=Discreet, 3=Concierge, 4=Fixer)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS service_level INTEGER DEFAULT 1;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'b2c';

-- Guardian Mode
ALTER TABLE clients ADD COLUMN IF NOT EXISTS guardian_mode_active BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS guardian_mode_until TIMESTAMPTZ;

-- Pact (NDA mútuo)
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pact_signed BOOLEAN DEFAULT FALSE;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS pact_signed_at TIMESTAMPTZ;

-- Vetting
ALTER TABLE clients ADD COLUMN IF NOT EXISTS vetting_status TEXT DEFAULT 'none';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS vetting_notes TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS vetting_date TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS red_flags TEXT[];

-- Preferences
ALTER TABLE clients ADD COLUMN IF NOT EXISTS preferred_payment TEXT DEFAULT 'normal';
ALTER TABLE clients ADD COLUMN IF NOT EXISTS communication_preference TEXT DEFAULT 'sms';

-- Auto-delete
ALTER TABLE clients ADD COLUMN IF NOT EXISTS auto_delete_after_days INTEGER;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ DEFAULT NOW();

-- Generate code_name for existing clients without one
CREATE OR REPLACE FUNCTION generate_client_code()
RETURNS TEXT AS $$
DECLARE
  prefixes TEXT[] := ARRAY['SHADOW', 'GHOST', 'CIPHER', 'PHANTOM', 'ECHO'];
  prefix TEXT;
  number INTEGER;
  code TEXT;
BEGIN
  prefix := prefixes[1 + floor(random() * array_length(prefixes, 1))::int];
  number := 1000 + floor(random() * 9000)::int;
  code := prefix || '-' || number;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Update existing clients with code_name
UPDATE clients
SET code_name = generate_client_code()
WHERE code_name IS NULL;

-- ============================================
-- 3. ADD FIELDS TO DELIVERIES
-- ============================================

-- Service level
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS service_level INTEGER DEFAULT 1;

-- Anonymous payment
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS is_anonymous_payment BOOLEAN DEFAULT FALSE;

-- Tracking level (how much info to show)
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS tracking_level INTEGER DEFAULT 1;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS tracking_token TEXT UNIQUE;

-- No Trace Mode (already exists in current schema, but ensure it's there)
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS no_trace_mode BOOLEAN DEFAULT FALSE;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS auto_delete_at TIMESTAMPTZ;

-- Reference code (like C-001)
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS reference TEXT;

-- Source (manual, blandai, etc)
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- ============================================
-- 4. VAULT ITEMS TABLE (Cofre Humano)
-- ============================================

CREATE TABLE IF NOT EXISTS vault_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Identification
  item_code TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,

  -- Type
  item_type TEXT DEFAULT 'storage', -- storage, last_will, time_capsule

  -- Dates
  stored_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  deliver_at TIMESTAMPTZ,

  -- For Last Will
  is_last_will BOOLEAN DEFAULT FALSE,
  last_will_recipient_name TEXT,
  last_will_recipient_phone TEXT,
  last_will_recipient_relation TEXT,
  last_will_message TEXT,
  last_will_trigger TEXT, -- 'manual', 'no_checkin', 'confirmed_death', 'date'
  last_will_checkin_days INTEGER,
  last_will_last_checkin TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'active', -- active, delivered, expired, destroyed
  delivered_at TIMESTAMPTZ,

  -- Physical location
  storage_location TEXT,

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vault_client ON vault_items(client_id);
CREATE INDEX IF NOT EXISTS idx_vault_code ON vault_items(item_code);
CREATE INDEX IF NOT EXISTS idx_vault_expires ON vault_items(expires_at) WHERE expires_at IS NOT NULL;

-- ============================================
-- 5. SERVICE AGREEMENTS TABLE (Pacto de Lealdade)
-- ============================================

CREATE TABLE IF NOT EXISTS service_agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

  -- Type
  agreement_type TEXT NOT NULL, -- 'nda', 'pact', 'terms'
  version TEXT NOT NULL DEFAULT '1.0',

  -- Content
  content TEXT NOT NULL,

  -- Signatures
  customer_signed BOOLEAN DEFAULT FALSE,
  customer_signed_at TIMESTAMPTZ,
  customer_ip TEXT,

  provider_signed BOOLEAN DEFAULT FALSE,
  provider_signed_at TIMESTAMPTZ,

  -- Validity
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'pending', -- pending, active, expired, terminated

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agreements_client ON service_agreements(client_id);
CREATE INDEX IF NOT EXISTS idx_agreements_type ON service_agreements(agreement_type);

-- ============================================
-- 6. DELIVERY PROOFS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS delivery_proofs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
  task_id UUID REFERENCES concierge_tasks(id) ON DELETE CASCADE,

  -- Type
  type TEXT NOT NULL, -- 'pickup', 'delivery', 'task_completion'

  -- Files
  photo_url TEXT,
  photo_encrypted BOOLEAN DEFAULT FALSE,

  -- Details
  received_by TEXT,
  signature_url TEXT,
  notes TEXT,

  -- Location
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Auto-delete
  auto_delete_at TIMESTAMPTZ,

  captured_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proofs_order ON delivery_proofs(order_id);
CREATE INDEX IF NOT EXISTS idx_proofs_task ON delivery_proofs(task_id);
CREATE INDEX IF NOT EXISTS idx_proofs_auto_delete ON delivery_proofs(auto_delete_at) WHERE auto_delete_at IS NOT NULL;

-- ============================================
-- 7. DESTRUCTION LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS destruction_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID, -- NULL after destruction
  customer_code TEXT NOT NULL,

  -- What was destroyed
  items_destroyed JSONB NOT NULL,

  -- Details
  requested_by TEXT, -- 'customer', 'system', 'admin'
  reason TEXT,

  -- Proof
  video_sent BOOLEAN DEFAULT FALSE,

  executed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_destruction_code ON destruction_log(customer_code);
CREATE INDEX IF NOT EXISTS idx_destruction_date ON destruction_log(executed_at DESC);

-- ============================================
-- 8. SETTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. UPDATE TRIGGERS
-- ============================================

-- Trigger for vault_items
DROP TRIGGER IF EXISTS update_vault_updated_at ON vault_items;
CREATE TRIGGER update_vault_updated_at
  BEFORE UPDATE ON vault_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================
-- 10. ROW LEVEL SECURITY
-- ============================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_proofs ENABLE ROW LEVEL SECURITY;
ALTER TABLE destruction_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Allow authenticated users" ON users
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON vault_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON service_agreements
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON delivery_proofs
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON destruction_log
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users" ON settings
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 11. HELPER FUNCTIONS
-- ============================================

-- Function to destroy all customer data
CREATE OR REPLACE FUNCTION destroy_customer_data(customer_id_param UUID)
RETURNS JSONB AS $$
DECLARE
  customer_code_var TEXT;
  items_destroyed_var JSONB;
BEGIN
  -- Get customer code
  SELECT code_name INTO customer_code_var FROM clients WHERE id = customer_id_param;

  -- Build list of what will be deleted
  items_destroyed_var := jsonb_build_object(
    'orders', (SELECT COUNT(*) FROM deliveries WHERE client_id = customer_id_param),
    'tasks', (SELECT COUNT(*) FROM concierge_tasks WHERE client_id = customer_id_param),
    'messages', (SELECT COUNT(*) FROM secure_messages sm JOIN concierge_tasks ct ON sm.task_id = ct.id WHERE ct.client_id = customer_id_param),
    'vault_items', (SELECT COUNT(*) FROM vault_items WHERE client_id = customer_id_param),
    'proofs', (SELECT COUNT(*) FROM delivery_proofs WHERE order_id IN (SELECT id FROM deliveries WHERE client_id = customer_id_param))
  );

  -- Log the destruction
  INSERT INTO destruction_log (customer_id, customer_code, items_destroyed, requested_by, reason)
  VALUES (customer_id_param, customer_code_var, items_destroyed_var, 'customer', 'Customer requested data deletion');

  -- Delete data (cascades handle most)
  DELETE FROM vault_items WHERE client_id = customer_id_param;
  DELETE FROM service_agreements WHERE client_id = customer_id_param;
  DELETE FROM nda_documents WHERE client_id = customer_id_param;
  DELETE FROM concierge_tasks WHERE client_id = customer_id_param;
  DELETE FROM deliveries WHERE client_id = customer_id_param;
  DELETE FROM clients WHERE id = customer_id_param;

  RETURN items_destroyed_var;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check vault last will items that need delivery
CREATE OR REPLACE FUNCTION check_last_will_triggers()
RETURNS TABLE(item_id UUID, customer_code TEXT, reason TEXT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vi.id,
    c.code_name,
    CASE
      WHEN vi.last_will_trigger = 'no_checkin' AND
           vi.last_will_last_checkin < NOW() - (vi.last_will_checkin_days || ' days')::INTERVAL
      THEN 'No check-in for ' || vi.last_will_checkin_days || ' days'
      WHEN vi.last_will_trigger = 'date' AND vi.deliver_at <= NOW()
      THEN 'Scheduled delivery date reached'
      ELSE NULL
    END as reason
  FROM vault_items vi
  JOIN clients c ON c.id = vi.client_id
  WHERE vi.is_last_will = TRUE
    AND vi.status = 'active'
    AND (
      (vi.last_will_trigger = 'no_checkin' AND
       vi.last_will_last_checkin < NOW() - (vi.last_will_checkin_days || ' days')::INTERVAL)
      OR
      (vi.last_will_trigger = 'date' AND vi.deliver_at <= NOW())
    );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 12. SAMPLE DATA FOR TESTING
-- ============================================

-- Insert sample admin user (password: admin123 - CHANGE THIS!)
INSERT INTO users (email, password_hash, role)
VALUES ('admin@discreetcourier.com', '$2a$10$example_hash_change_this', 'admin')
ON CONFLICT (email) DO NOTHING;

-- Insert sample settings
INSERT INTO settings (key, value) VALUES
  ('company_name', '"Discreet Courier Columbus"'),
  ('company_phone', '"(614) 500-3080"'),
  ('company_email', '"contact@discreetcourier.com"'),
  ('no_trace_auto_delete_days', '7'),
  ('guardian_mode_monthly_fee', '500'),
  ('vault_monthly_fee', '100')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Update bland_calls to detect service type
ALTER TABLE bland_calls ADD COLUMN IF NOT EXISTS service_type TEXT;
UPDATE bland_calls SET service_type =
  CASE
    WHEN extracted_data::text ILIKE '%concierge%' OR
         extracted_data::text ILIKE '%purchase%' OR
         extracted_data::text ILIKE '%buy%' THEN 'concierge'
    ELSE 'delivery'
  END
WHERE service_type IS NULL;

COMMENT ON TABLE vault_items IS 'Cofre Humano - Items stored for clients including Last Will feature';
COMMENT ON TABLE service_agreements IS 'Pacto de Lealdade - Mutual NDA and service agreements';
COMMENT ON TABLE destruction_log IS 'Audit log of data destructions (Ritual de Destruição)';
COMMENT ON COLUMN clients.code_name IS 'Privacy code like SHADOW-7842 instead of real name';
COMMENT ON COLUMN clients.guardian_mode_active IS 'VIP 24/7 availability feature';
COMMENT ON FUNCTION destroy_customer_data(UUID) IS 'Ritual de Destruição - Complete data deletion with audit trail';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
