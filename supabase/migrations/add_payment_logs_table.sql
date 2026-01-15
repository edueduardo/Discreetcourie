-- Migration: Payment Logs for Stripe Webhooks
-- Tabela para registrar todos os eventos de pagamento

CREATE TABLE IF NOT EXISTS payment_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    stripe_payment_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    amount DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'usd',
    customer_email VARCHAR(255),
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adicionar campos às invoices se não existirem
DO $$ BEGIN
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
    ALTER TABLE invoices ADD COLUMN IF NOT EXISTS stripe_payment_id VARCHAR(255);
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- Índices
CREATE INDEX IF NOT EXISTS idx_pl_event ON payment_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_pl_stripe_id ON payment_logs(stripe_payment_id);
CREATE INDEX IF NOT EXISTS idx_pl_created ON payment_logs(created_at DESC);

-- RLS
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated users" ON payment_logs;
CREATE POLICY "Allow authenticated users" ON payment_logs FOR ALL USING (auth.role() = 'authenticated');

GRANT ALL ON payment_logs TO authenticated;

DO $$ BEGIN
    RAISE NOTICE '✅ Payment logs table created successfully!';
END $$;
