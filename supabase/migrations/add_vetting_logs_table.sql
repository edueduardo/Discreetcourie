-- Migration: Vetting Logs
-- Tabela para registrar todas as ações do workflow de vetting/santuário

CREATE TABLE IF NOT EXISTS vetting_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vetting_id UUID REFERENCES vetting_records(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    performed_by VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar campo vetting_status aos clientes se não existir
DO $$ BEGIN
    ALTER TABLE clients ADD COLUMN IF NOT EXISTS vetting_status VARCHAR(50) DEFAULT 'pending';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_vl_vetting ON vetting_logs(vetting_id);
CREATE INDEX IF NOT EXISTS idx_vl_client ON vetting_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_vl_action ON vetting_logs(action);
CREATE INDEX IF NOT EXISTS idx_vl_created ON vetting_logs(created_at DESC);

-- RLS
ALTER TABLE vetting_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users" ON vetting_logs;
CREATE POLICY "Allow authenticated users" ON vetting_logs FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON vetting_logs TO authenticated;

DO $$ BEGIN
    RAISE NOTICE '✅ Vetting Logs table created successfully!';
END $$;
