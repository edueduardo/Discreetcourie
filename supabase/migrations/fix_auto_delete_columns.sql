-- Migration: Adicionar colunas para auto-delete funcionarl

-- 1. Adicionar colunas na tabela secure_messages (se existir)
DO $$ 
BEGIN
  -- Adicionar client_id se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'secure_messages' AND column_name = 'client_id') THEN
    ALTER TABLE secure_messages ADD COLUMN client_id UUID REFERENCES clients(id);
  END IF;
  
  -- Adicionar self_destruct se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'secure_messages' AND column_name = 'self_destruct') THEN
    ALTER TABLE secure_messages ADD COLUMN self_destruct BOOLEAN DEFAULT false;
  END IF;
  
  -- Adicionar destruct_at se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'secure_messages' AND column_name = 'destruct_at') THEN
    ALTER TABLE secure_messages ADD COLUMN destruct_at TIMESTAMPTZ;
  END IF;
EXCEPTION WHEN undefined_table THEN
  -- Tabela não existe, criar
  CREATE TABLE IF NOT EXISTS secure_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID REFERENCES clients(id),
    sender_id UUID,
    recipient_email TEXT,
    recipient_phone TEXT,
    subject TEXT,
    content TEXT,
    content_encrypted TEXT,
    self_destruct BOOLEAN DEFAULT false,
    destruct_at TIMESTAMPTZ,
    status TEXT DEFAULT 'draft',
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
END $$;

-- 2. Adicionar colunas na tabela vault_items
DO $$ 
BEGIN
  -- Adicionar auto_destruct se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vault_items' AND column_name = 'auto_destruct') THEN
    ALTER TABLE vault_items ADD COLUMN auto_destruct BOOLEAN DEFAULT false;
  END IF;
  
  -- Adicionar destruct_at se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vault_items' AND column_name = 'destruct_at') THEN
    ALTER TABLE vault_items ADD COLUMN destruct_at TIMESTAMPTZ;
  END IF;
  
  -- Adicionar destroyed_at se não existir
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vault_items' AND column_name = 'destroyed_at') THEN
    ALTER TABLE vault_items ADD COLUMN destroyed_at TIMESTAMPTZ;
  END IF;
END $$;

-- 3. Criar tabela delivery_files se não existir
CREATE TABLE IF NOT EXISTS delivery_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES deliveries(id),
  file_path TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  auto_delete BOOLEAN DEFAULT false,
  delete_at TIMESTAMPTZ,
  deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Criar tabela tracking_points para GPS real-time
CREATE TABLE IF NOT EXISTS tracking_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id UUID REFERENCES deliveries(id),
  driver_id UUID,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  accuracy DECIMAL(10, 2),
  speed DECIMAL(10, 2),
  heading DECIMAL(5, 2),
  altitude DECIMAL(10, 2),
  battery_level INTEGER,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Adicionar colunas de localização na tabela deliveries
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'last_known_lat') THEN
    ALTER TABLE deliveries ADD COLUMN last_known_lat DECIMAL(10, 8);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'last_known_lng') THEN
    ALTER TABLE deliveries ADD COLUMN last_known_lng DECIMAL(11, 8);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'last_location_update') THEN
    ALTER TABLE deliveries ADD COLUMN last_location_update TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'delivery_lat') THEN
    ALTER TABLE deliveries ADD COLUMN delivery_lat DECIMAL(10, 8);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deliveries' AND column_name = 'delivery_lng') THEN
    ALTER TABLE deliveries ADD COLUMN delivery_lng DECIMAL(11, 8);
  END IF;
END $$;

-- 6. Criar tabela leads se não existir (para CRON follow-up)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT,
  status TEXT DEFAULT 'new',
  notes TEXT,
  last_contact_at TIMESTAMPTZ,
  follow_up_count INTEGER DEFAULT 0,
  assigned_to UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Índices para performance
CREATE INDEX IF NOT EXISTS idx_secure_messages_destruct ON secure_messages(self_destruct, destruct_at) WHERE self_destruct = true;
CREATE INDEX IF NOT EXISTS idx_vault_items_destruct ON vault_items(auto_destruct, destruct_at) WHERE auto_destruct = true;
CREATE INDEX IF NOT EXISTS idx_tracking_points_delivery ON tracking_points(delivery_id, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status, created_at);

-- 8. RLS para novas tabelas
ALTER TABLE delivery_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracking_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Políticas permissivas para admin
CREATE POLICY IF NOT EXISTS "Admin full access delivery_files" ON delivery_files FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Admin full access tracking_points" ON tracking_points FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Admin full access leads" ON leads FOR ALL USING (true);
