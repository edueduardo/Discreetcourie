-- Migration: Time Capsule Deliveries
-- Tabela para registrar entregas de cápsulas do tempo

CREATE TABLE IF NOT EXISTS time_capsule_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vault_item_id UUID REFERENCES vault_items(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_code VARCHAR(50) NOT NULL,
    recipient_name VARCHAR(255) NOT NULL,
    recipient_phone VARCHAR(50),
    recipient_email VARCHAR(255),
    message TEXT,
    scheduled_date TIMESTAMPTZ NOT NULL,
    delivered_at TIMESTAMPTZ,
    delivery_status VARCHAR(50) DEFAULT 'pending_pickup',
    picked_up_at TIMESTAMPTZ,
    pickup_notes TEXT,
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tcd_vault_item ON time_capsule_deliveries(vault_item_id);
CREATE INDEX IF NOT EXISTS idx_tcd_client ON time_capsule_deliveries(client_id);
CREATE INDEX IF NOT EXISTS idx_tcd_status ON time_capsule_deliveries(delivery_status);
CREATE INDEX IF NOT EXISTS idx_tcd_scheduled ON time_capsule_deliveries(scheduled_date);

-- RLS
ALTER TABLE time_capsule_deliveries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users" ON time_capsule_deliveries;
CREATE POLICY "Allow authenticated users" ON time_capsule_deliveries FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON time_capsule_deliveries TO authenticated;

DO $$ BEGIN
    RAISE NOTICE '✅ Time Capsule tables created successfully!';
END $$;
