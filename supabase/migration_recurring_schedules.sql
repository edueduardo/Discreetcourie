-- Recurring Schedules for B2B Document Delivery
-- Run this migration in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS recurring_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Company/B2B Info
  company_name TEXT,
  billing_email TEXT,
  po_number TEXT,
  
  -- Schedule Configuration
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
  day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
  pickup_time TIME NOT NULL,
  
  -- Route
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  
  -- Service
  service_type TEXT NOT NULL DEFAULT 'b2b' CHECK (service_type IN ('standard', 'confidential', 'b2b')),
  special_instructions TEXT,
  
  -- Pricing
  base_price DECIMAL(10,2) NOT NULL DEFAULT 40.00,
  recurring_discount INTEGER DEFAULT 10,
  discounted_price DECIMAL(10,2),
  
  -- Status
  active BOOLEAN DEFAULT TRUE,
  next_delivery_date DATE,
  last_delivery_date DATE,
  total_deliveries INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_client ON recurring_schedules(client_id);
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_active ON recurring_schedules(active) WHERE active = TRUE;
CREATE INDEX IF NOT EXISTS idx_recurring_schedules_next_date ON recurring_schedules(next_delivery_date) WHERE active = TRUE;

-- Function to auto-create delivery from recurring schedule
CREATE OR REPLACE FUNCTION create_scheduled_delivery()
RETURNS void AS $$
DECLARE
  schedule RECORD;
BEGIN
  FOR schedule IN 
    SELECT * FROM recurring_schedules 
    WHERE active = TRUE 
    AND next_delivery_date = CURRENT_DATE
  LOOP
    -- Create the delivery
    INSERT INTO deliveries (
      client_id,
      tracking_code,
      pickup_address,
      delivery_address,
      scheduled_date,
      scheduled_time,
      special_instructions,
      price,
      service_level,
      status,
      recurring_schedule_id,
      created_at
    ) VALUES (
      schedule.client_id,
      'DC-' || upper(to_hex(floor(random() * 16777215)::int)),
      schedule.pickup_address,
      schedule.delivery_address,
      schedule.next_delivery_date,
      schedule.pickup_time,
      schedule.special_instructions,
      schedule.discounted_price,
      CASE schedule.service_type 
        WHEN 'confidential' THEN 2 
        WHEN 'b2b' THEN 1 
        ELSE 1 
      END,
      'pending',
      schedule.id,
      NOW()
    );
    
    -- Update the schedule
    UPDATE recurring_schedules 
    SET 
      last_delivery_date = CURRENT_DATE,
      total_deliveries = total_deliveries + 1,
      next_delivery_date = CASE frequency
        WHEN 'daily' THEN CURRENT_DATE + INTERVAL '1 day'
        WHEN 'weekly' THEN CURRENT_DATE + INTERVAL '7 days'
        WHEN 'biweekly' THEN CURRENT_DATE + INTERVAL '14 days'
        WHEN 'monthly' THEN CURRENT_DATE + INTERVAL '1 month'
      END,
      updated_at = NOW()
    WHERE id = schedule.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add recurring_schedule_id to deliveries table if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'deliveries' AND column_name = 'recurring_schedule_id'
  ) THEN
    ALTER TABLE deliveries ADD COLUMN recurring_schedule_id UUID REFERENCES recurring_schedules(id);
  END IF;
END $$;

COMMENT ON TABLE recurring_schedules IS 'B2B recurring delivery schedules with auto-booking';
COMMENT ON FUNCTION create_scheduled_delivery() IS 'Auto-creates deliveries from active recurring schedules - run daily via cron';
