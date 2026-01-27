-- ============================================
-- AI Features Tables Migration - FIXED VERSION
-- Created: 2026-01-27 (Fixed)
-- Purpose: Support all AI-powered features
-- FIXES: 
--   - Changed REFERENCES customers(id) -> REFERENCES clients(id)
--   - Changed REFERENCES drivers(id) -> REFERENCES users(id)
--   - Fixed ai_chat_logs.user_id to reference users(id)
-- ============================================

-- ============================================
-- 1. Fraud Detection
-- ============================================
CREATE TABLE IF NOT EXISTS fraud_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES clients(id) ON DELETE CASCADE,  -- FIXED: clients not customers
  risk_score INTEGER NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
  flags TEXT[] DEFAULT '{}',
  recommendation TEXT NOT NULL CHECK (recommendation IN ('approve', 'review', 'reject')),
  explanation TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fraud_checks_customer ON fraud_checks(customer_id);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_risk ON fraud_checks(risk_level, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_fraud_checks_date ON fraud_checks(checked_at DESC);

-- ============================================
-- 2. Smart Pricing Calculations
-- ============================================
CREATE TABLE IF NOT EXISTS pricing_calculations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  factors JSONB NOT NULL,
  suggested_price DECIMAL(10, 2) NOT NULL,
  breakdown JSONB NOT NULL,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_calculations_date ON pricing_calculations(calculated_at DESC);

-- ============================================
-- 3. Demand Forecasts
-- ============================================
CREATE TABLE IF NOT EXISTS demand_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forecast_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ai_analysis TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demand_forecasts_date ON demand_forecasts(generated_at DESC);

-- ============================================
-- 4. Route Optimizations
-- ============================================
CREATE TABLE IF NOT EXISTS route_optimizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES users(id) ON DELETE CASCADE,  -- FIXED: users not drivers
  delivery_ids UUID[] NOT NULL,
  optimized_route JSONB NOT NULL,
  optimization_score INTEGER CHECK (optimization_score >= 0 AND optimization_score <= 100),
  distance_saved DECIMAL(10, 2),
  time_saved DECIMAL(10, 2),
  ai_insights TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_route_optimizations_driver ON route_optimizations(driver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_route_optimizations_date ON route_optimizations(created_at DESC);

-- ============================================
-- 5. Sentiment Analyses
-- ============================================
CREATE TABLE IF NOT EXISTS sentiment_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reference_id TEXT,
  source TEXT NOT NULL,
  text TEXT NOT NULL,
  sentiment TEXT NOT NULL CHECK (sentiment IN ('very_positive', 'positive', 'neutral', 'negative', 'very_negative')),
  score DECIMAL(3, 2) CHECK (score >= -1 AND score <= 1),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  emotions JSONB DEFAULT '[]',
  topics TEXT[] DEFAULT '{}',
  urgency TEXT CHECK (urgency IN ('low', 'medium', 'high', 'critical')),
  action_required BOOLEAN DEFAULT false,
  keywords TEXT[] DEFAULT '{}',
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_sentiment ON sentiment_analyses(sentiment, analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_urgency ON sentiment_analyses(urgency, action_required);
CREATE INDEX IF NOT EXISTS idx_sentiment_analyses_date ON sentiment_analyses(analyzed_at DESC);

-- ============================================
-- 6. Churn Predictions
-- ============================================
CREATE TABLE IF NOT EXISTS churn_predictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES clients(id) ON DELETE CASCADE,  -- FIXED: clients not customers
  churn_risk TEXT NOT NULL CHECK (churn_risk IN ('very_low', 'low', 'medium', 'high', 'very_high')),
  churn_score INTEGER NOT NULL CHECK (churn_score >= 0 AND churn_score <= 100),
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  risk_factors JSONB DEFAULT '[]',
  retention_strategy JSONB,
  customer_segment TEXT,
  lifetime_value DECIMAL(10, 2),
  predicted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_churn_predictions_customer ON churn_predictions(customer_id, predicted_at DESC);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_risk ON churn_predictions(churn_risk, predicted_at DESC);
CREATE INDEX IF NOT EXISTS idx_churn_predictions_date ON churn_predictions(predicted_at DESC);

-- ============================================
-- 7. Image Analyses
-- ============================================
CREATE TABLE IF NOT EXISTS image_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
  analysis_type TEXT NOT NULL CHECK (analysis_type IN ('package', 'signature', 'damage', 'location', 'general')),
  image_url TEXT,
  confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
  findings JSONB DEFAULT '[]',
  labels TEXT[] DEFAULT '{}',
  text_extracted TEXT,
  action_required BOOLEAN DEFAULT false,
  analyzed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_analyses_delivery ON image_analyses(delivery_id, analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_analyses_type ON image_analyses(analysis_type, analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_analyses_action ON image_analyses(action_required, analyzed_at DESC);
CREATE INDEX IF NOT EXISTS idx_image_analyses_date ON image_analyses(analyzed_at DESC);

-- ============================================
-- 8. AI Chat Logs (for auditing and improvements)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_chat_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,  -- FIXED: users not customers
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  model TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_session ON ai_chat_logs(session_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_user ON ai_chat_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_logs_date ON ai_chat_logs(created_at DESC);

-- ============================================
-- 9. Feedback table
-- ============================================
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID REFERENCES clients(id) ON DELETE CASCADE,  -- FIXED: clients not customers
  delivery_id UUID REFERENCES deliveries(id) ON DELETE SET NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_customer ON feedback(customer_id);
CREATE INDEX IF NOT EXISTS idx_feedback_delivery ON feedback(delivery_id);
CREATE INDEX IF NOT EXISTS idx_feedback_rating ON feedback(rating, created_at DESC);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE fraud_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_calculations ENABLE ROW LEVEL SECURITY;
ALTER TABLE demand_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE route_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sentiment_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE churn_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "fraud_checks_admin_all" ON fraud_checks;
DROP POLICY IF EXISTS "pricing_calculations_admin_all" ON pricing_calculations;
DROP POLICY IF EXISTS "demand_forecasts_admin_all" ON demand_forecasts;
DROP POLICY IF EXISTS "route_optimizations_admin_all" ON route_optimizations;
DROP POLICY IF EXISTS "route_optimizations_driver_own" ON route_optimizations;
DROP POLICY IF EXISTS "sentiment_analyses_admin_all" ON sentiment_analyses;
DROP POLICY IF EXISTS "churn_predictions_admin_all" ON churn_predictions;
DROP POLICY IF EXISTS "image_analyses_admin_all" ON image_analyses;
DROP POLICY IF EXISTS "ai_chat_logs_admin_all" ON ai_chat_logs;
DROP POLICY IF EXISTS "ai_chat_logs_user_own" ON ai_chat_logs;
DROP POLICY IF EXISTS "feedback_user_insert" ON feedback;
DROP POLICY IF EXISTS "feedback_user_select" ON feedback;
DROP POLICY IF EXISTS "feedback_admin_all" ON feedback;

-- Fraud Checks: Admin only
CREATE POLICY "fraud_checks_admin_all" ON fraud_checks
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Pricing: Admin only
CREATE POLICY "pricing_calculations_admin_all" ON pricing_calculations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Demand Forecasts: Admin only
CREATE POLICY "demand_forecasts_admin_all" ON demand_forecasts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Route Optimizations: Admin and driver (own routes)
CREATE POLICY "route_optimizations_admin_all" ON route_optimizations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "route_optimizations_driver_own" ON route_optimizations
  FOR SELECT
  TO authenticated
  USING (driver_id = auth.uid());

-- Sentiment: Admin only
CREATE POLICY "sentiment_analyses_admin_all" ON sentiment_analyses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Churn: Admin only
CREATE POLICY "churn_predictions_admin_all" ON churn_predictions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Image Analyses: Admin and related driver
CREATE POLICY "image_analyses_admin_all" ON image_analyses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- Chat Logs: Admin can see all, users can see their own
CREATE POLICY "ai_chat_logs_admin_all" ON ai_chat_logs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

CREATE POLICY "ai_chat_logs_user_own" ON ai_chat_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Feedback: Users can create and see their own (via clients table)
CREATE POLICY "feedback_user_insert" ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (
    customer_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "feedback_user_select" ON feedback
  FOR SELECT
  TO authenticated
  USING (
    customer_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "feedback_admin_all" ON feedback
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'admin'
    )
  );

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON TABLE fraud_checks IS 'AI-powered fraud detection for orders';
COMMENT ON TABLE pricing_calculations IS 'Smart dynamic pricing calculations';
COMMENT ON TABLE demand_forecasts IS 'ML-based demand forecasting';
COMMENT ON TABLE route_optimizations IS 'AI route optimization results';
COMMENT ON TABLE sentiment_analyses IS 'Customer sentiment analysis from feedback';
COMMENT ON TABLE churn_predictions IS 'Customer churn prediction and retention';
COMMENT ON TABLE image_analyses IS 'Computer vision analysis of delivery photos';
COMMENT ON TABLE ai_chat_logs IS 'AI chatbot conversation logs';
COMMENT ON TABLE feedback IS 'Customer feedback and ratings';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
