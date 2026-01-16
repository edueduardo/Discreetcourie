-- Migration: Subscriptions table for Stripe recurring payments
-- Execute in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    stripe_subscription_id VARCHAR(255) UNIQUE NOT NULL,
    stripe_customer_id VARCHAR(255) NOT NULL,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    plan_key VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    amount DECIMAL(10, 2),
    currency VARCHAR(10) DEFAULT 'usd',
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMPTZ,
    trial_start TIMESTAMPTZ,
    trial_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sub_stripe_id ON subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_sub_customer ON subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_sub_client ON subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_sub_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_sub_plan ON subscriptions(plan_key);

-- RLS
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "subscriptions_policy" ON subscriptions;
CREATE POLICY "subscriptions_policy" ON subscriptions FOR ALL USING (true);

-- Add guardian_subscription_id to clients if not exists
ALTER TABLE clients ADD COLUMN IF NOT EXISTS guardian_subscription_id VARCHAR(255);

-- Subscription events log
CREATE TABLE IF NOT EXISTS subscription_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255),
    event_type VARCHAR(100) NOT NULL,
    previous_status VARCHAR(50),
    new_status VARCHAR(50),
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sub_events_sub ON subscription_events(subscription_id);
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "sub_events_policy" ON subscription_events;
CREATE POLICY "sub_events_policy" ON subscription_events FOR ALL USING (true);

SELECT 'SUCCESS: Subscriptions tables created!' as result;
