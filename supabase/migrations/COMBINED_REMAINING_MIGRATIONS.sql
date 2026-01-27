-- ============================================
-- COMBINED MIGRATIONS FILE
-- Migrations 9-20 combined for easy execution
-- Each section is clearly marked with START/END markers
-- If error occurs, check the section number in error message
-- ============================================

-- ============================================
-- MIGRATION 9/20: RBAC PROFILES
-- START: add_rbac_profiles.sql
-- ============================================

-- User role enum (skip if already exists)
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'client', 'driver');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Profiles table (maps to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255),
  role user_role NOT NULL DEFAULT 'client',
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_client ON profiles(client_id);

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own profile" ON profiles;
CREATE POLICY "Users can read own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can do everything" ON profiles;
CREATE POLICY "Admins can do everything" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_user_role()
RETURNS user_role AS $$
DECLARE
  user_role user_role;
BEGIN
  SELECT role INTO user_role
  FROM profiles
  WHERE id = auth.uid();
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE profiles IS 'User profiles with RBAC roles (admin, client, driver)';

DO $$ BEGIN
  RAISE NOTICE '✅ MIGRATION 9/20 COMPLETED: RBAC Profiles';
END $$;

-- ============================================
-- END: add_rbac_profiles.sql
-- ============================================


-- ============================================
-- MIGRATION 10/20: QUOTES TABLE
-- START: add_quotes_table.sql
-- ============================================

DROP TABLE IF EXISTS quotes CASCADE;

CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  distance_miles DECIMAL(10, 2),
  duration_minutes INTEGER,
  urgency VARCHAR(50) DEFAULT 'same_day',
  service_tier VARCHAR(50) DEFAULT 'courier',
  pickup_time VARCHAR(10) DEFAULT '10:00',
  additional_stops INTEGER DEFAULT 0,
  wait_time_hours DECIMAL(10, 2) DEFAULT 0,
  calculated_price DECIMAL(10, 2) NOT NULL,
  price_breakdown JSONB DEFAULT '{}',
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  status VARCHAR(50) DEFAULT 'pending',
  converted_to_delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_contact_email ON quotes(contact_email);
CREATE INDEX IF NOT EXISTS idx_quotes_contact_phone ON quotes(contact_phone);
CREATE INDEX IF NOT EXISTS idx_quotes_created ON quotes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotes_expires ON quotes(expires_at);

ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can create quotes" ON quotes;
CREATE POLICY "Anyone can create quotes"
  ON quotes FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can read quotes" ON quotes;
CREATE POLICY "Authenticated users can read quotes"
  ON quotes FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update quotes" ON quotes;
CREATE POLICY "Authenticated users can update quotes"
  ON quotes FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS quotes_updated_at ON quotes;
CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_updated_at();

COMMENT ON TABLE quotes IS 'Instant price quotes for potential deliveries';

DO $$ BEGIN
  RAISE NOTICE '✅ MIGRATION 10/20 COMPLETED: Quotes Table';
END $$;

-- ============================================
-- END: add_quotes_table.sql
-- ============================================


-- ============================================
-- MIGRATION 11/20: SETTINGS TABLE
-- START: add_settings_table.sql
-- ============================================

CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'general',
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

INSERT INTO settings (key, value, description, category, is_public) VALUES
  ('business_name', '"Discreet Courier Columbus"', 'Business name displayed to customers', 'general', true),
  ('business_phone', '"(614) 500-3080"', 'Main business phone number', 'general', true),
  ('business_email', '"contact@discreetcourier.com"', 'Main business email', 'general', true),
  ('service_radius_miles', '25', 'Maximum service radius in miles', 'operations', false),
  ('max_deliveries_per_day', '6', 'Maximum deliveries per day (solo operator)', 'operations', false),
  ('booking_lead_time_hours', '2', 'Minimum booking notice in hours', 'operations', false),
  ('operating_hours_start', '"09:00"', 'Daily operating hours start time', 'operations', false),
  ('operating_hours_end', '"18:00"', 'Daily operating hours end time', 'operations', false),
  ('weekend_surcharge_percent', '50', 'Weekend surcharge percentage', 'pricing', false),
  ('after_hours_surcharge_percent', '30', 'After-hours surcharge percentage', 'pricing', false),
  ('base_delivery_price', '35', 'Base delivery price in USD', 'pricing', false),
  ('per_mile_rate_after', '2', 'Per mile rate after 10 miles', 'pricing', false),
  ('twilio_configured', 'false', 'Whether Twilio is configured', 'integrations', false),
  ('stripe_configured', 'false', 'Whether Stripe is configured', 'integrations', false),
  ('bland_ai_configured', 'false', 'Whether Bland.AI is configured', 'integrations', false),
  ('auto_delete_days', '30', 'Auto-delete delivery records after X days', 'privacy', false),
  ('allow_anonymous_bookings', 'false', 'Allow bookings without account', 'privacy', false)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read public settings" ON settings;
CREATE POLICY "Anyone can read public settings"
  ON settings FOR SELECT
  USING (is_public = true);

DROP POLICY IF EXISTS "Authenticated users can read private settings" ON settings;
CREATE POLICY "Authenticated users can read private settings"
  ON settings FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Authenticated users can update settings" ON settings;
CREATE POLICY "Authenticated users can update settings"
  ON settings FOR UPDATE
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE settings IS 'System configuration settings';

DO $$ BEGIN
  RAISE NOTICE '✅ MIGRATION 11/20 COMPLETED: Settings Table';
END $$;

-- ============================================
-- END: add_settings_table.sql
-- ============================================


-- ============================================
-- MIGRATION 12/20: SMS EVENT LOGS
-- START: add_sms_event_logs_table.sql
-- ============================================

CREATE TABLE IF NOT EXISTS sms_event_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  phone_numbers TEXT[],
  variables JSONB,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
  success BOOLEAN DEFAULT FALSE,
  error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sms_event_type ON sms_event_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_sms_client ON sms_event_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_sms_delivery ON sms_event_logs(delivery_id);
CREATE INDEX IF NOT EXISTS idx_sms_created ON sms_event_logs(created_at DESC);

ALTER TABLE sms_event_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users" ON sms_event_logs;
CREATE POLICY "Allow authenticated users" ON sms_event_logs FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON sms_event_logs TO authenticated;

DO $$ BEGIN
  RAISE NOTICE '✅ MIGRATION 12/20 COMPLETED: SMS Event Logs';
END $$;

-- ============================================
-- END: add_sms_event_logs_table.sql
-- ============================================


-- ============================================
-- MIGRATION 13/20: EMAIL LOGS
-- START: add_email_logs_table.sql
-- ============================================

CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  template VARCHAR(100) NOT NULL,
  recipient TEXT NOT NULL,
  subject TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'partial', 'bounced')),
  message_id TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_client ON email_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_template ON email_logs(template);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_created ON email_logs(created_at DESC);

ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage all email logs" ON email_logs;
CREATE POLICY "Admins can manage all email logs" ON email_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.raw_user_meta_data->>'role' = 'admin'
    )
  );

CREATE OR REPLACE FUNCTION update_email_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_email_logs_updated_at ON email_logs;
CREATE TRIGGER trigger_email_logs_updated_at
  BEFORE UPDATE ON email_logs
  FOR EACH ROW
  EXECUTE FUNCTION update_email_logs_updated_at();

COMMENT ON TABLE email_logs IS 'Transactional email logs for tracking all automated emails';

DO $$ BEGIN
  RAISE NOTICE '✅ MIGRATION 13/20 COMPLETED: Email Logs';
END $$;

-- ============================================
-- END: add_email_logs_table.sql
-- ============================================


-- ============================================
-- MIGRATION 14/20: PAYMENT LOGS
-- START: add_payment_logs_table.sql
-- ============================================

CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type VARCHAR(100) NOT NULL,
  stripe_payment_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  amount DECIMAL(10, 2),
  currency VARCHAR(10) DEFAULT 'usd',
  customer_email VARCHAR(255),
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
  ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_id VARCHAR(255);
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_pl_event ON payment_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_pl_stripe_id ON payment_logs(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_pl_created ON payment_logs(created_at DESC);

ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users" ON payment_logs;
CREATE POLICY "Allow authenticated users" ON payment_logs FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON payment_logs TO authenticated;

DO $$ BEGIN
  RAISE NOTICE '✅ MIGRATION 14/20 COMPLETED: Payment Logs';
END $$;

-- ============================================
-- END: add_payment_logs_table.sql
-- ============================================


-- ============================================
-- MIGRATION 15/20: BLAND CALLS
-- START: add_bland_calls_table.sql
-- ============================================

CREATE TABLE IF NOT EXISTS bland_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  call_id VARCHAR(100) UNIQUE NOT NULL,
  phone_number VARCHAR(50) NOT NULL,
  direction VARCHAR(20) NOT NULL DEFAULT 'inbound',
  status VARCHAR(50) DEFAULT 'initiated',
  duration INTEGER,
  transcript TEXT,
  summary TEXT,
  extracted_data JSONB,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  delivery_id UUID,
  task_id UUID,
  service_type VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bc_call_id ON bland_calls(call_id);
CREATE INDEX IF NOT EXISTS idx_bc_client ON bland_calls(client_id);
CREATE INDEX IF NOT EXISTS idx_bc_phone ON bland_calls(phone_number);
CREATE INDEX IF NOT EXISTS idx_bc_status ON bland_calls(status);
CREATE INDEX IF NOT EXISTS idx_bc_created ON bland_calls(created_at DESC);

ALTER TABLE bland_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users" ON bland_calls;
CREATE POLICY "Allow authenticated users" ON bland_calls FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON bland_calls TO authenticated;

DO $$ BEGIN
  RAISE NOTICE '✅ MIGRATION 15/20 COMPLETED: Bland Calls';
END $$;

-- ============================================
-- END: add_bland_calls_table.sql
-- ============================================


-- ============================================
-- MIGRATION 16/20: EMERGENCY LOGS
-- START: add_emergency_logs_table.sql
-- ============================================

CREATE TABLE IF NOT EXISTS emergency_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  protocol_id UUID,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  protocol_name VARCHAR(255),
  actions_executed JSONB,
  triggered_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_el_protocol ON emergency_logs(protocol_id);
CREATE INDEX IF NOT EXISTS idx_el_client ON emergency_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_el_triggered ON emergency_logs(triggered_at DESC);

ALTER TABLE emergency_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users" ON emergency_logs;
CREATE POLICY "Allow authenticated users" ON emergency_logs FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON emergency_logs TO authenticated;

DO $$ BEGIN
  RAISE NOTICE '✅ MIGRATION 16/20 COMPLETED: Emergency Logs';
END $$;

-- ============================================
-- END: add_emergency_logs_table.sql
-- ============================================


-- ============================================
-- MIGRATION 17/20: VETTING LOGS
-- START: add_vetting_logs_table.sql
-- ============================================

CREATE TABLE IF NOT EXISTS vetting_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vetting_id UUID,
  client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  performed_by VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ BEGIN
  ALTER TABLE clients ADD COLUMN IF NOT EXISTS vetting_status VARCHAR(50) DEFAULT 'pending';
EXCEPTION
  WHEN duplicate_column THEN null;
END $$;

CREATE INDEX IF NOT EXISTS idx_vl_vetting ON vetting_logs(vetting_id);
CREATE INDEX IF NOT EXISTS idx_vl_client ON vetting_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_vl_action ON vetting_logs(action);
CREATE INDEX IF NOT EXISTS idx_vl_created ON vetting_logs(created_at DESC);

ALTER TABLE vetting_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users" ON vetting_logs;
CREATE POLICY "Allow authenticated users" ON vetting_logs FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON vetting_logs TO authenticated;

DO $$ BEGIN
  RAISE NOTICE '✅ MIGRATION 17/20 COMPLETED: Vetting Logs';
END $$;

-- ============================================
-- END: add_vetting_logs_table.sql
-- ============================================


-- ============================================
-- MIGRATION 18/20: NEW TABLES 2025
-- START: add_new_tables_2025.sql
-- ============================================

CREATE TABLE IF NOT EXISTS driver_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_sessions_token ON driver_sessions(token);
CREATE INDEX IF NOT EXISTS idx_driver_sessions_expires ON driver_sessions(expires_at);

ALTER TABLE driver_sessions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow authenticated users" ON driver_sessions
    FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS gps_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
  driver_id UUID,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  speed DECIMAL(10, 2),
  heading DECIMAL(5, 2),
  altitude DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gps_delivery ON gps_locations(delivery_id);
CREATE INDEX IF NOT EXISTS idx_gps_driver ON gps_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_gps_created ON gps_locations(created_at DESC);

ALTER TABLE gps_locations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Allow authenticated users" ON gps_locations
    FOR ALL USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  RAISE NOTICE '✅ MIGRATION 18/20 COMPLETED: New Tables 2025';
END $$;

-- ============================================
-- END: add_new_tables_2025.sql
-- ============================================


-- ============================================
-- MIGRATION 19/20: FIX AUTO DELETE COLUMNS
-- START: fix_auto_delete_columns.sql
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'secure_messages' AND column_name = 'client_id') THEN
    ALTER TABLE secure_messages ADD COLUMN client_id UUID REFERENCES clients(id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'secure_messages' AND column_name = 'self_destruct') THEN
    ALTER TABLE secure_messages ADD COLUMN self_destruct BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'secure_messages' AND column_name = 'destruct_at') THEN
    ALTER TABLE secure_messages ADD COLUMN destruct_at TIMESTAMPTZ;
  END IF;
EXCEPTION WHEN undefined_table THEN
  CREATE TABLE IF NOT EXISTS secure_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    sender_id UUID,
    recipient_email TEXT,
    recipient_phone TEXT,
    subject TEXT,
    content TEXT,
    content_encrypted TEXT,
    self_destruct BOOLEAN DEFAULT false,
    destruct_at TIMESTAMPTZ,
    status TEXT DEFAULT 'draft',
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
END $$;

DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vault_items') THEN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vault_items' AND column_name = 'auto_destruct') THEN
      ALTER TABLE vault_items ADD COLUMN auto_destruct BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vault_items' AND column_name = 'destruct_at') THEN
      ALTER TABLE vault_items ADD COLUMN destruct_at TIMESTAMPTZ;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vault_items' AND column_name = 'destroyed_at') THEN
      ALTER TABLE vault_items ADD COLUMN destroyed_at TIMESTAMPTZ;
    END IF;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS delivery_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES deliveries(id),
  file_path TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  auto_delete BOOLEAN DEFAULT false,
  delete_at TIMESTAMPTZ,
  deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracking_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES deliveries(id),
  driver_id UUID,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  speed DECIMAL(10, 2),
  heading DECIMAL(5, 2),
  altitude DECIMAL(10, 2),
  battery_level INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'last_known_lat') THEN
    ALTER TABLE deliveries ADD COLUMN last_known_lat DECIMAL(10, 8);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'last_known_lng') THEN
    ALTER TABLE deliveries ADD COLUMN last_known_lng DECIMAL(11, 8);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'last_location_update') THEN
    ALTER TABLE deliveries ADD COLUMN last_location_update TIMESTAMPTZ;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_secure_messages_destruct ON secure_messages(self_destruct, destruct_at) WHERE self_destruct = true;
CREATE INDEX IF NOT EXISTS idx_tracking_points_delivery ON tracking_points(delivery_id, recorded_at DESC);

ALTER TABLE delivery_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_points ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access delivery_files" ON delivery_files;
CREATE POLICY "Admin full access delivery_files" ON delivery_files FOR ALL USING (true);

DROP POLICY IF EXISTS "Admin full access tracking_points" ON tracking_points;
CREATE POLICY "Admin full access tracking_points" ON tracking_points FOR ALL USING (true);

DO $$ BEGIN
  RAISE NOTICE '✅ MIGRATION 19/20 COMPLETED: Fix Auto Delete Columns';
END $$;

-- ============================================
-- END: fix_auto_delete_columns.sql
-- ============================================


-- ============================================
-- MIGRATION 20/20: FINAL NOTICE
-- ============================================

DO $$ BEGIN
  RAISE NOTICE '🎉🎉🎉 ALL 20 MIGRATIONS COMPLETED SUCCESSFULLY! 🎉🎉🎉';
  RAISE NOTICE 'Total tables created: Check with SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = ''public'';';
END $$;

-- ============================================
-- END OF COMBINED MIGRATIONS
-- ============================================
