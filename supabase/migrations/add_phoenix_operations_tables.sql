-- Migration: Phoenix Operations (Operação Fênix)
-- Sistema para ajudar clientes a sair de situações difíceis

CREATE TABLE IF NOT EXISTS phoenix_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_code VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    -- Tipo de operação
    operation_type VARCHAR(50) NOT NULL, -- escape_abuse, start_fresh, temporary_disappear, crisis_exit
    situation_description TEXT,
    
    -- Urgência e timeline
    urgency_level VARCHAR(20) DEFAULT 'normal', -- low, normal, high, critical
    timeline TEXT,
    
    -- Contato seguro
    safe_contact_method VARCHAR(50),
    safe_contact_info TEXT,
    
    -- Detalhes da operação
    items_to_retrieve JSONB,
    destination_info JSONB,
    special_requirements TEXT,
    budget_estimate DECIMAL(10, 2),
    
    -- Progresso
    status VARCHAR(50) DEFAULT 'initiated', -- initiated, planning, in_progress, executing, completed, cancelled
    phase VARCHAR(50) DEFAULT 'planning', -- planning, preparation, retrieval, transport, settlement, completed
    checklist_completed JSONB,
    items_retrieved BOOLEAN DEFAULT FALSE,
    destination_confirmed BOOLEAN DEFAULT FALSE,
    
    -- Notas
    notes TEXT,
    final_notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS phoenix_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID REFERENCES phoenix_operations(id) ON DELETE CASCADE,
    phase VARCHAR(50),
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_phoenix_client ON phoenix_operations(client_id);
CREATE INDEX IF NOT EXISTS idx_phoenix_code ON phoenix_operations(operation_code);
CREATE INDEX IF NOT EXISTS idx_phoenix_status ON phoenix_operations(status);
CREATE INDEX IF NOT EXISTS idx_phoenix_urgency ON phoenix_operations(urgency_level);
CREATE INDEX IF NOT EXISTS idx_phoenix_logs_op ON phoenix_logs(operation_id);

-- RLS
ALTER TABLE phoenix_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE phoenix_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users" ON phoenix_operations;
CREATE POLICY "Allow authenticated users" ON phoenix_operations FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users" ON phoenix_logs;
CREATE POLICY "Allow authenticated users" ON phoenix_logs FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON phoenix_operations TO authenticated;
GRANT ALL ON phoenix_logs TO authenticated;

DO $$ BEGIN
    RAISE NOTICE '✅ Phoenix Operations tables created successfully!';
END $$;
