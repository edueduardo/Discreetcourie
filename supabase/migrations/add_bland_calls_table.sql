-- Migration: Bland.AI Calls Table
-- Tabela para registrar chamadas de voz via Bland.AI

CREATE TABLE IF NOT EXISTS bland_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    call_id VARCHAR(100) UNIQUE NOT NULL,
    phone_number VARCHAR(50) NOT NULL,
    direction VARCHAR(20) NOT NULL DEFAULT 'inbound',
    status VARCHAR(50) DEFAULT 'initiated',
    duration INTEGER,
    transcript TEXT,
    summary TEXT,
    extracted_data JSONB,
    
    -- References
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    delivery_id UUID,
    task_id UUID,
    
    -- Service info
    service_type VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bc_call_id ON bland_calls(call_id);
CREATE INDEX IF NOT EXISTS idx_bc_client ON bland_calls(client_id);
CREATE INDEX IF NOT EXISTS idx_bc_phone ON bland_calls(phone_number);
CREATE INDEX IF NOT EXISTS idx_bc_status ON bland_calls(status);
CREATE INDEX IF NOT EXISTS idx_bc_created ON bland_calls(created_at DESC);

-- RLS
ALTER TABLE bland_calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users" ON bland_calls;
CREATE POLICY "Allow authenticated users" ON bland_calls FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON bland_calls TO authenticated;

DO $$ BEGIN
    RAISE NOTICE '✅ Bland.AI calls table created successfully!';
END $$;
