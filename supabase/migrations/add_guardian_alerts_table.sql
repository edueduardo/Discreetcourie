-- Migration: Guardian Alerts
-- Tabela para registrar alertas do sistema Guardian Mode 24/7

CREATE TABLE IF NOT EXISTS guardian_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    alert_type VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    urgency VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
    acknowledged BOOLEAN DEFAULT FALSE,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar campos de contatos de emergência aos clientes se não existir
DO $$ BEGIN
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS emergency_contacts JSONB;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS guardian_mode_active BOOLEAN DEFAULT FALSE;
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS guardian_mode_until TIMESTAMPTZ;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_ga_client ON guardian_alerts(client_id);
CREATE INDEX IF NOT EXISTS idx_ga_type ON guardian_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_ga_urgency ON guardian_alerts(urgency);
CREATE INDEX IF NOT EXISTS idx_ga_created ON guardian_alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ga_ack ON guardian_alerts(acknowledged);

-- RLS
ALTER TABLE guardian_alerts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users" ON guardian_alerts;
CREATE POLICY "Allow authenticated users" ON guardian_alerts FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON guardian_alerts TO authenticated;

DO $$ BEGIN
    RAISE NOTICE '✅ Guardian Alerts table created successfully!';
END $$;
