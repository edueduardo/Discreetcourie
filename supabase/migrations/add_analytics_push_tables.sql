-- Migration: Add Analytics and Push Notifications Tables
-- Date: 2025-01-16

-- Push Subscriptions table for Web Push notifications
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_client_id ON push_subscriptions(client_id);

-- Notification logs table
CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL, -- 'push', 'email', 'sms'
  title TEXT,
  body TEXT,
  user_id UUID REFERENCES auth.users(id),
  client_id UUID REFERENCES clients(id),
  sent_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_created ON notification_logs(created_at);

-- Leads table for marketing automation
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT,
  email TEXT,
  phone TEXT,
  source TEXT, -- 'website', 'referral', 'ad', etc.
  status TEXT DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'converted', 'lost'
  notes TEXT,
  last_contact_at TIMESTAMPTZ,
  follow_up_count INTEGER DEFAULT 0,
  converted_client_id UUID REFERENCES clients(id),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at);

-- Analytics snapshots table (for historical data)
CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  metrics JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_period ON analytics_snapshots(period_start, period_end);

-- Add subscriptions table if not exists
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  plan_type TEXT NOT NULL,
  status TEXT DEFAULT 'active', -- 'active', 'cancelled', 'past_due', 'paused'
  amount DECIMAL(10,2) DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  interval TEXT DEFAULT 'month', -- 'month', 'year'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_client ON subscriptions(client_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);

-- Payment logs table
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  stripe_payment_id TEXT,
  stripe_subscription_id TEXT,
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'usd',
  customer_email TEXT,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payment_logs_event ON payment_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_logs_stripe ON payment_logs(stripe_payment_id);

-- RLS Policies
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Service role can do everything
CREATE POLICY "Service role full access on push_subscriptions" ON push_subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on notification_logs" ON notification_logs
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on leads" ON leads
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on analytics_snapshots" ON analytics_snapshots
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role full access on payment_logs" ON payment_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Users can manage their own push subscriptions
CREATE POLICY "Users can manage own push subscriptions" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (client_id IN (SELECT id FROM clients WHERE user_id = auth.uid()));

COMMENT ON TABLE push_subscriptions IS 'Web Push notification subscriptions for PWA';
COMMENT ON TABLE notification_logs IS 'Log of all notifications sent (push, email, SMS)';
COMMENT ON TABLE leads IS 'Marketing leads for follow-up automation';
COMMENT ON TABLE analytics_snapshots IS 'Historical analytics data snapshots';
COMMENT ON TABLE subscriptions IS 'Stripe subscription records';
COMMENT ON TABLE payment_logs IS 'Stripe payment event logs';
