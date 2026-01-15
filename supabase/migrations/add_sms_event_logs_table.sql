-- Migration: SMS Event Logs
-- Tabela para registrar todos os SMS automáticos enviados

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

-- Índices
CREATE INDEX IF NOT EXISTS idx_sms_event_type ON sms_event_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_sms_client ON sms_event_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_sms_delivery ON sms_event_logs(delivery_id);
CREATE INDEX IF NOT EXISTS idx_sms_created ON sms_event_logs(created_at DESC);

-- RLS
ALTER TABLE sms_event_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users" ON sms_event_logs;
CREATE POLICY "Allow authenticated users" ON sms_event_logs FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON sms_event_logs TO authenticated;

DO $$ BEGIN
    RAISE NOTICE '✅ SMS Event Logs table created successfully!';
END $$;
