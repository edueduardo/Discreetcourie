-- Migration: Emergency Logs
-- Tabela para registrar execuções de protocolos de emergência

CREATE TABLE IF NOT EXISTS emergency_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    protocol_id UUID REFERENCES emergency_protocols(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    protocol_name VARCHAR(255),
    actions_executed JSONB,
    triggered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_el_protocol ON emergency_logs(protocol_id);
CREATE INDEX IF NOT EXISTS idx_el_client ON emergency_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_el_triggered ON emergency_logs(triggered_at DESC);

-- RLS
ALTER TABLE emergency_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users" ON emergency_logs;
CREATE POLICY "Allow authenticated users" ON emergency_logs FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON emergency_logs TO authenticated;

DO $$ BEGIN
    RAISE NOTICE '✅ Emergency Logs table created successfully!';
END $$;
