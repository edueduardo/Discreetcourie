-- Migration: Shadow Proxy Missions (Procurador de Sombras)
-- Sistema para agir, falar e representar clientes

CREATE TABLE IF NOT EXISTS shadow_proxy_missions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_code VARCHAR(50) UNIQUE NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    
    -- Tipo de missão
    proxy_type VARCHAR(50) NOT NULL, -- return_items, make_complaint, deliver_message, pick_up_items, confrontation, negotiation
    
    -- Alvo
    target_name VARCHAR(255),
    target_phone VARCHAR(50),
    target_address TEXT,
    target_relation VARCHAR(100), -- ex, family, business, neighbor, etc
    
    -- Detalhes da missão
    mission_description TEXT NOT NULL,
    talking_points JSONB,
    items_involved JSONB,
    desired_outcome TEXT,
    boundaries TEXT, -- What NOT to do/say
    client_script TEXT, -- What client wants us to say
    backup_plan TEXT,
    
    -- Preço
    price_quoted DECIMAL(10, 2),
    actual_price DECIMAL(10, 2),
    
    -- Execução
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, in_progress, completed, failed, cancelled
    execution_notes TEXT,
    outcome_achieved BOOLEAN,
    items_returned BOOLEAN,
    target_response TEXT,
    evidence_photos JSONB,
    final_report TEXT,
    
    -- Notas
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS shadow_proxy_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    mission_id UUID REFERENCES shadow_proxy_missions(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_shadow_client ON shadow_proxy_missions(client_id);
CREATE INDEX IF NOT EXISTS idx_shadow_code ON shadow_proxy_missions(mission_code);
CREATE INDEX IF NOT EXISTS idx_shadow_status ON shadow_proxy_missions(status);
CREATE INDEX IF NOT EXISTS idx_shadow_type ON shadow_proxy_missions(proxy_type);
CREATE INDEX IF NOT EXISTS idx_shadow_logs_mission ON shadow_proxy_logs(mission_id);

-- RLS
ALTER TABLE shadow_proxy_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE shadow_proxy_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users" ON shadow_proxy_missions;
CREATE POLICY "Allow authenticated users" ON shadow_proxy_missions FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated users" ON shadow_proxy_logs;
CREATE POLICY "Allow authenticated users" ON shadow_proxy_logs FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON shadow_proxy_missions TO authenticated;
GRANT ALL ON shadow_proxy_logs TO authenticated;

DO $$ BEGIN
    RAISE NOTICE '✅ Shadow Proxy tables created successfully!';
END $$;
