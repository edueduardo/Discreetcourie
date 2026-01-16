-- URGENT: Create vault_items table for Last Will and Time Capsule features
-- Run this in Supabase SQL Editor

-- Vault Items table (Cofre Humano)
CREATE TABLE IF NOT EXISTS vault_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    item_type VARCHAR(50) NOT NULL, -- 'document', 'package', 'digital', 'message'
    description TEXT,
    storage_location TEXT,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'delivered', 'destroyed'
    
    -- Time Capsule fields
    deliver_at TIMESTAMPTZ,
    
    -- Last Will fields
    is_last_will BOOLEAN DEFAULT FALSE,
    last_will_recipient_name TEXT,
    last_will_recipient_phone TEXT,
    last_will_recipient_email TEXT,
    last_will_recipient_relation TEXT,
    last_will_message TEXT,
    last_will_trigger TEXT, -- 'manual', 'no_checkin', 'specific_date'
    last_will_checkin_days INTEGER DEFAULT 30,
    last_will_last_checkin TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vault_client ON vault_items(client_id);
CREATE INDEX IF NOT EXISTS idx_vault_status ON vault_items(status);
CREATE INDEX IF NOT EXISTS idx_vault_last_will ON vault_items(is_last_will) WHERE is_last_will = TRUE;
CREATE INDEX IF NOT EXISTS idx_vault_deliver ON vault_items(deliver_at) WHERE deliver_at IS NOT NULL;

-- RLS
ALTER TABLE vault_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "vault_items_policy" ON vault_items;
CREATE POLICY "vault_items_policy" ON vault_items FOR ALL USING (true);

-- Time Capsules table
CREATE TABLE IF NOT EXISTS time_capsules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    vault_item_id UUID REFERENCES vault_items(id) ON DELETE SET NULL,
    capsule_code VARCHAR(50) UNIQUE NOT NULL,
    recipient_name TEXT NOT NULL,
    recipient_email TEXT,
    recipient_phone TEXT,
    message TEXT,
    delivery_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'delivered', 'cancelled'
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tc_client ON time_capsules(client_id);
CREATE INDEX IF NOT EXISTS idx_tc_delivery ON time_capsules(delivery_date);
CREATE INDEX IF NOT EXISTS idx_tc_status ON time_capsules(status);

ALTER TABLE time_capsules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "time_capsules_policy" ON time_capsules;
CREATE POLICY "time_capsules_policy" ON time_capsules FOR ALL USING (true);

-- Ghost Messages table (auto-delete)
CREATE TABLE IF NOT EXISTS ghost_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    message_code VARCHAR(50) UNIQUE NOT NULL,
    content TEXT NOT NULL,
    recipient_identifier TEXT,
    self_destruct_at TIMESTAMPTZ NOT NULL,
    read_at TIMESTAMPTZ,
    destroyed_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'read', 'destroyed'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gm_destruct ON ghost_messages(self_destruct_at);
CREATE INDEX IF NOT EXISTS idx_gm_status ON ghost_messages(status);

ALTER TABLE ghost_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ghost_messages_policy" ON ghost_messages;
CREATE POLICY "ghost_messages_policy" ON ghost_messages FOR ALL USING (true);

-- CRON Logs table
CREATE TABLE IF NOT EXISTS cron_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name VARCHAR(100) NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL,
    results JSONB,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cron_job ON cron_logs(job_name);
ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cron_logs_policy" ON cron_logs;
CREATE POLICY "cron_logs_policy" ON cron_logs FOR ALL USING (true);

-- Last Will Deliveries table
CREATE TABLE IF NOT EXISTS last_will_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vault_item_id UUID REFERENCES vault_items(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_code VARCHAR(50) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50),
    recipient_email VARCHAR(255),
    message TEXT,
    trigger_type VARCHAR(50) NOT NULL,
    triggered_at TIMESTAMPTZ NOT NULL,
    delivery_status VARCHAR(50) DEFAULT 'pending',
    delivered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE last_will_deliveries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lwd_policy" ON last_will_deliveries;
CREATE POLICY "lwd_policy" ON last_will_deliveries FOR ALL USING (true);

SELECT 'SUCCESS: All tables created!' as result;
