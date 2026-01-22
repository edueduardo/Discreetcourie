-- Leads table for tracking potential customers
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Contact Information
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  company VARCHAR(255),

  -- Lead Details
  source VARCHAR(100), -- 'website', 'referral', 'phone', 'email', 'social_media'
  service_interest VARCHAR(100), -- 'courier', 'discreet', 'concierge', 'fixer'
  message TEXT,

  -- Lead Status
  status VARCHAR(50) DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted', 'lost'
  priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'

  -- Conversion
  converted_to_client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,

  -- Assignment
  assigned_to VARCHAR(255), -- Who is following up
  last_contact_at TIMESTAMPTZ,
  next_follow_up_at TIMESTAMPTZ,

  -- Metadata
  notes TEXT,
  tags TEXT[], -- Array of tags for categorization
  metadata JSONB DEFAULT '{}', -- Additional custom data

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_phone ON leads(phone);
CREATE INDEX idx_leads_source ON leads(source);
CREATE INDEX idx_leads_created ON leads(created_at DESC);
CREATE INDEX idx_leads_next_followup ON leads(next_follow_up_at);

-- RLS Policies
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all leads
CREATE POLICY "Authenticated users can read leads"
  ON leads FOR SELECT
  USING (auth.role() = 'authenticated');

-- Authenticated users can insert leads
CREATE POLICY "Authenticated users can create leads"
  ON leads FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Authenticated users can update leads
CREATE POLICY "Authenticated users can update leads"
  ON leads FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Authenticated users can delete leads
CREATE POLICY "Authenticated users can delete leads"
  ON leads FOR DELETE
  USING (auth.role() = 'authenticated');

-- Insert some sample leads for testing (optional)
INSERT INTO leads (name, email, phone, source, service_interest, status, message) VALUES
  ('John Doe', 'john@example.com', '614-555-0100', 'website', 'courier', 'new', 'Need same-day delivery service for my law firm'),
  ('Jane Smith', 'jane@company.com', '614-555-0101', 'referral', 'discreet', 'contacted', 'Looking for confidential package delivery'),
  ('Bob Johnson', 'bob@startup.com', '614-555-0102', 'phone', 'concierge', 'qualified', 'Interested in regular errand service')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE leads IS 'Potential customers and sales leads';
COMMENT ON COLUMN leads.status IS 'Lead status: new, contacted, qualified, converted, lost';
COMMENT ON COLUMN leads.source IS 'Where the lead came from: website, referral, phone, email, social_media';
