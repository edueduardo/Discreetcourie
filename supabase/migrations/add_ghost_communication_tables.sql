-- Migration: Ghost Communication / Auto-Delete System
-- Tabelas para logs de destruição e campos adicionais

-- Tabela de logs de destruição
CREATE TABLE IF NOT EXISTS destruction_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_type VARCHAR(50) NOT NULL,
    item_id UUID,
    item_code VARCHAR(50),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    destruction_method VARCHAR(50) NOT NULL,
    destroyed_at TIMESTAMPTZ NOT NULL,
    destroyed_by UUID,
    notes TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dl_type ON destruction_logs(item_type);
CREATE INDEX IF NOT EXISTS idx_dl_client ON destruction_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_dl_destroyed ON destruction_logs(destroyed_at DESC);

-- Adicionar campos de auto-destruição aos vault_items
DO $$ BEGIN
    ALTER TABLE vault_items ADD COLUMN IF NOT EXISTS auto_destruct BOOLEAN DEFAULT FALSE;
    ALTER TABLE vault_items ADD COLUMN IF NOT EXISTS destruct_at TIMESTAMPTZ;
    ALTER TABLE vault_items ADD COLUMN IF NOT EXISTS destroyed_at TIMESTAMPTZ;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Adicionar campos às secure_messages
DO $$ BEGIN
    ALTER TABLE secure_messages ADD COLUMN IF NOT EXISTS self_destruct BOOLEAN DEFAULT FALSE;
    ALTER TABLE secure_messages ADD COLUMN IF NOT EXISTS destruct_at TIMESTAMPTZ;
    ALTER TABLE secure_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;
    ALTER TABLE secure_messages ADD COLUMN IF NOT EXISTS destruct_after_read BOOLEAN DEFAULT FALSE;
    ALTER TABLE secure_messages ADD COLUMN IF NOT EXISTS destruct_minutes_after_read INTEGER;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Adicionar campos de auto-delete aos arquivos
DO $$ BEGIN
    ALTER TABLE delivery_files ADD COLUMN IF NOT EXISTS auto_delete BOOLEAN DEFAULT FALSE;
    ALTER TABLE delivery_files ADD COLUMN IF NOT EXISTS delete_at TIMESTAMPTZ;
    ALTER TABLE delivery_files ADD COLUMN IF NOT EXISTS deleted BOOLEAN DEFAULT FALSE;
    ALTER TABLE delivery_files ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- RLS
ALTER TABLE destruction_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users" ON destruction_logs;
CREATE POLICY "Allow authenticated users" ON destruction_logs FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON destruction_logs TO authenticated;

DO $$ BEGIN
    RAISE NOTICE '✅ Ghost Communication tables created successfully!';
END $$;
