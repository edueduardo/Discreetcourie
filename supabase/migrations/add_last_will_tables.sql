-- Migration: Last Will Deliveries and CRON Logs
-- Tabelas necessárias para o sistema automático de Last Will

-- Tabela de entregas de Last Will
CREATE TABLE IF NOT EXISTS last_will_deliveries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
    delivery_notes TEXT,
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lwd_vault_item ON last_will_deliveries(vault_item_id);
CREATE INDEX IF NOT EXISTS idx_lwd_client ON last_will_deliveries(client_id);
CREATE INDEX IF NOT EXISTS idx_lwd_status ON last_will_deliveries(delivery_status);

-- Tabela de logs de CRON jobs
CREATE TABLE IF NOT EXISTS cron_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    job_name VARCHAR(100) NOT NULL,
    executed_at TIMESTAMPTZ NOT NULL,
    results JSONB,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    duration_ms INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cron_job ON cron_logs(job_name);
CREATE INDEX IF NOT EXISTS idx_cron_executed ON cron_logs(executed_at DESC);

-- Adicionar campo de email ao destinatário (se não existir)
DO $$ BEGIN
    ALTER TABLE vault_items ADD COLUMN IF NOT EXISTS last_will_recipient_email VARCHAR(255);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Adicionar campo de mensagem (se não existir)
DO $$ BEGIN
    ALTER TABLE vault_items ADD COLUMN IF NOT EXISTS last_will_message TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- RLS Policies
ALTER TABLE last_will_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE cron_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users" ON last_will_deliveries;
CREATE POLICY "Allow authenticated users" ON last_will_deliveries FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users" ON cron_logs;
CREATE POLICY "Allow authenticated users" ON cron_logs FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON last_will_deliveries TO authenticated;
GRANT ALL ON cron_logs TO authenticated;

DO $$ BEGIN
    RAISE NOTICE '✅ Last Will tables created successfully!';
END $$;
