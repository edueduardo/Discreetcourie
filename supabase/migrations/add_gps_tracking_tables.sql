-- Migration: GPS Real-Time Tracking
-- Tabelas para tracking GPS em tempo real

CREATE TABLE IF NOT EXISTS gps_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID,
    delivery_id UUID,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed DECIMAL(6, 2) DEFAULT 0,
    heading DECIMAL(5, 2) DEFAULT 0,
    accuracy DECIMAL(6, 2) DEFAULT 0,
    altitude DECIMAL(8, 2) DEFAULT 0,
    battery_level INTEGER DEFAULT 100,
    is_moving BOOLEAN DEFAULT TRUE,
    recorded_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS driver_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID UNIQUE NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed DECIMAL(6, 2) DEFAULT 0,
    heading DECIMAL(5, 2) DEFAULT 0,
    battery_level INTEGER DEFAULT 100,
    is_moving BOOLEAN DEFAULT TRUE,
    is_online BOOLEAN DEFAULT TRUE,
    last_update TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_gps_delivery ON gps_tracking(delivery_id);
CREATE INDEX IF NOT EXISTS idx_gps_driver ON gps_tracking(driver_id);
CREATE INDEX IF NOT EXISTS idx_gps_recorded ON gps_tracking(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_driver_loc ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_update ON driver_locations(last_update DESC);

-- Adicionar campos de localização nas deliveries se não existirem
DO $$ BEGIN
    ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10, 8);
    ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(11, 8);
    ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMPTZ;
    ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS eta_updated_at TIMESTAMPTZ;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- RLS
ALTER TABLE gps_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users" ON gps_tracking;
CREATE POLICY "Allow authenticated users" ON gps_tracking FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users" ON driver_locations;
CREATE POLICY "Allow authenticated users" ON driver_locations FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON gps_tracking TO authenticated;
GRANT ALL ON driver_locations TO authenticated;

DO $$ BEGIN
    RAISE NOTICE '✅ GPS Tracking tables created successfully!';
END $$;
