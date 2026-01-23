-- Quotes table for storing instant price quotes
DROP TABLE IF EXISTS quotes CASCADE;

CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Addresses
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,

  -- Distance & Duration
  distance_miles DECIMAL(10, 2),
  duration_minutes INTEGER,

  -- Service Details
  urgency VARCHAR(50) DEFAULT 'same_day', -- 'urgent_1h', 'same_day', 'next_day'
  service_tier VARCHAR(50) DEFAULT 'courier', -- 'courier', 'discreet', 'concierge', 'fixer'
  pickup_time VARCHAR(10) DEFAULT '10:00',
  additional_stops INTEGER DEFAULT 0,
  wait_time_hours DECIMAL(10, 2) DEFAULT 0,

  -- Pricing
  calculated_price DECIMAL(10, 2) NOT NULL,
  price_breakdown JSONB DEFAULT '{}',

  -- Contact Information
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'booked', 'expired'
  converted_to_delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,

  -- Notes
  notes TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- Indexes
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_contact_email ON quotes(contact_email);
CREATE INDEX idx_quotes_contact_phone ON quotes(contact_phone);
CREATE INDEX idx_quotes_created ON quotes(created_at DESC);
CREATE INDEX idx_quotes_expires ON quotes(expires_at);

-- RLS Policies
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Anyone can create a quote (public access)
CREATE POLICY "Anyone can create quotes"
  ON quotes FOR INSERT
  WITH CHECK (true);

-- Only authenticated users can view all quotes
CREATE POLICY "Authenticated users can read quotes"
  ON quotes FOR SELECT
  USING (auth.role() = 'authenticated');

-- Authenticated users can update quotes
CREATE POLICY "Authenticated users can update quotes"
  ON quotes FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quotes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER quotes_updated_at
  BEFORE UPDATE ON quotes
  FOR EACH ROW
  EXECUTE FUNCTION update_quotes_updated_at();

COMMENT ON TABLE quotes IS 'Instant price quotes for potential deliveries';
COMMENT ON COLUMN quotes.status IS 'Quote status: pending, accepted, booked, expired';
COMMENT ON COLUMN quotes.expires_at IS 'When the quote expires (default 7 days)';
