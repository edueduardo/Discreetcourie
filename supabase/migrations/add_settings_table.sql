-- Settings table for system configuration
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

-- Create index for faster lookups
CREATE INDEX idx_settings_key ON settings(key);
CREATE INDEX idx_settings_category ON settings(category);

-- Insert default settings
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

-- RLS Policies
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all settings
CREATE POLICY "Anyone can read public settings"
  ON settings FOR SELECT
  USING (is_public = true);

-- Only authenticated users can read private settings
CREATE POLICY "Authenticated users can read private settings"
  ON settings FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only authenticated users can update settings
CREATE POLICY "Authenticated users can update settings"
  ON settings FOR UPDATE
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE settings IS 'System configuration settings';
