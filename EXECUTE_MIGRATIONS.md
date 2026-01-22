# 🚀 EXECUTAR MIGRATIONS - GUIA RÁPIDO

## PASSO 1: MIGRATION 1 - SETTINGS

Copie o SQL abaixo e cole no SQL Editor do Supabase:

```sql
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

CREATE INDEX idx_settings_key ON settings(key);
CREATE INDEX idx_settings_category ON settings(category);

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

CREATE POLICY "Anyone can read public settings"
  ON settings FOR SELECT
  USING (is_public = true);

CREATE POLICY "Authenticated users can read private settings"
  ON settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update settings"
  ON settings FOR UPDATE
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE settings IS 'System configuration settings';
```

---

## PASSO 2: MIGRATION 2 - LEADS

Copie o SQL abaixo e cole no SQL Editor do Supabase:

```sql
-- Leads table for tracking potential customers
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),
  source VARCHAR(100),
  service_interest VARCHAR(100),
  message TEXT,
  status VARCHAR(50) DEFAULT 'new',
  priority VARCHAR(20) DEFAULT 'medium',
  converted_to_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  assigned_to VARCHAR(255),
  last_contact_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,
  notes TEXT,
  tags TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_leads_next_followup ON leads(next_follow_up_at);

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read leads"
  ON leads FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create leads"
  ON leads FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update leads"
  ON leads FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete leads"
  ON leads FOR DELETE
  USING (auth.role() = 'authenticated');

INSERT INTO leads (name, email, phone, source, service_interest, status, message) VALUES
  ('John Doe', 'john@example.com', '614-555-0100', 'website', 'courier', 'new', 'Need same-day delivery service for my law firm'),
  ('Jane Smith', 'jane@company.com', '614-555-0101', 'referral', 'discreet', 'contacted', 'Looking for confidential package delivery'),
  ('Bob Johnson', 'bob@startup.com', '614-555-0102', 'phone', 'concierge', 'qualified', 'Interested in regular errand service')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE leads IS 'Potential customers and sales leads';
```

---

## COMO EXECUTAR:

1. **Acesse:** https://supabase.com/dashboard
2. **Selecione** seu projeto
3. **Clique** em "SQL Editor" no menu lateral
4. **Copie** o SQL da MIGRATION 1 (acima)
5. **Cole** no editor
6. **Clique** em "Run" (ou Ctrl+Enter)
7. **Aguarde** aparecer "Success"
8. **Repita** com a MIGRATION 2

---

## VERIFICAR SE FUNCIONOU:

Após executar, teste:

```sql
-- Deve retornar 17 linhas
SELECT * FROM settings;

-- Deve retornar 3 linhas
SELECT * FROM leads;
```

---

**Pronto! Migrations executadas com sucesso!** ✅
