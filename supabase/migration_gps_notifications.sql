-- Migration: GPS Tracking & Push Notifications
-- Discreet Courier - Real-time tracking and notifications

-- ============================================
-- GPS TRACKING TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS delivery_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    speed DECIMAL(6, 2) DEFAULT 0,
    heading DECIMAL(5, 2) DEFAULT 0,
    accuracy DECIMAL(6, 2),
    altitude DECIMAL(8, 2),
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups by delivery
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_delivery_id 
ON delivery_tracking(delivery_id);

-- Index for time-based queries
CREATE INDEX IF NOT EXISTS idx_delivery_tracking_recorded_at 
ON delivery_tracking(recorded_at DESC);

-- ============================================
-- ADD LOCATION FIELDS TO DELIVERIES
-- ============================================

ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS current_latitude DECIMAL(10, 8);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS current_longitude DECIMAL(11, 8);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMPTZ;
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS delivery_latitude DECIMAL(10, 8);
ALTER TABLE deliveries ADD COLUMN IF NOT EXISTS delivery_longitude DECIMAL(11, 8);

-- ============================================
-- NOTIFICATION LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB,
    push_token TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    response JSONB,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for user notifications
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_id 
ON notification_logs(user_id);

-- ============================================
-- PUSH TOKENS FOR USERS/CLIENTS
-- ============================================

ALTER TABLE clients ADD COLUMN IF NOT EXISTS push_token TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT true;

-- If users table exists
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE users ADD COLUMN IF NOT EXISTS push_token TEXT;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS push_enabled BOOLEAN DEFAULT true;
    END IF;
END $$;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE delivery_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Tracking: Anyone can read (for client tracking page)
CREATE POLICY "Allow read tracking for all" ON delivery_tracking
    FOR SELECT USING (true);

-- Tracking: Only authenticated users can insert
CREATE POLICY "Allow insert tracking for authenticated" ON delivery_tracking
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Notifications: Users can read their own
CREATE POLICY "Users can read own notifications" ON notification_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Notifications: System can insert
CREATE POLICY "System can insert notifications" ON notification_logs
    FOR INSERT WITH CHECK (true);

-- ============================================
-- FUNCTION: Auto-update delivery location
-- ============================================

CREATE OR REPLACE FUNCTION update_delivery_location()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE deliveries
    SET 
        current_latitude = NEW.latitude,
        current_longitude = NEW.longitude,
        last_location_update = NEW.recorded_at
    WHERE id = NEW.delivery_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update delivery location
DROP TRIGGER IF EXISTS trigger_update_delivery_location ON delivery_tracking;
CREATE TRIGGER trigger_update_delivery_location
    AFTER INSERT ON delivery_tracking
    FOR EACH ROW
    EXECUTE FUNCTION update_delivery_location();

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT SELECT, INSERT ON delivery_tracking TO authenticated;
GRANT SELECT, INSERT ON notification_logs TO authenticated;
