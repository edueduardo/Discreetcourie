-- Migration: Destruction Videos and Certificates
-- Tabela para registrar vídeos e certificados de destruição

CREATE TABLE IF NOT EXISTS destruction_videos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    destruction_log_id UUID,
    client_id UUID,
    certificate_code VARCHAR(50) UNIQUE NOT NULL,
    video_type VARCHAR(50) NOT NULL DEFAULT 'generated',
    video_url TEXT,
    thumbnail_url TEXT,
    destruction_method VARCHAR(100),
    items_destroyed JSONB,
    certificate_data JSONB,
    generated_at TIMESTAMPTZ NOT NULL,
    sent_to_client BOOLEAN DEFAULT FALSE,
    sent_at TIMESTAMPTZ,
    client_viewed_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'generated',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dv_client ON destruction_videos(client_id);
CREATE INDEX IF NOT EXISTS idx_dv_cert ON destruction_videos(certificate_code);
CREATE INDEX IF NOT EXISTS idx_dv_status ON destruction_videos(status);
CREATE INDEX IF NOT EXISTS idx_dv_generated ON destruction_videos(generated_at DESC);

-- Adicionar campos aos destruction_logs existentes
DO $$ BEGIN
    ALTER TABLE destruction_logs ADD COLUMN IF NOT EXISTS video_url TEXT;
    ALTER TABLE destruction_logs ADD COLUMN IF NOT EXISTS certificate_code VARCHAR(50);
    ALTER TABLE destruction_logs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- RLS
ALTER TABLE destruction_videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users" ON destruction_videos;
CREATE POLICY "Allow authenticated users" ON destruction_videos FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON destruction_videos TO authenticated;

DO $$ BEGIN
    RAISE NOTICE '✅ Destruction Video tables created successfully!';
END $$;
