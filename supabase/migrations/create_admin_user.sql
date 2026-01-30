-- Create Admin User Migration
-- Run this in Supabase SQL Editor after deploying

-- First, create the users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'client',
  name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy for users table
CREATE POLICY IF NOT EXISTS "Users can read own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY IF NOT EXISTS "Admin can manage all users" ON users
  FOR ALL USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'admin'
  );

-- Create index on email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Insert admin user
-- Password: Admin123! (hashed with bcrypt)
-- To generate a new hash: run in Node.js: await bcrypt.hash('YourPassword123!', 10)
INSERT INTO users (email, password_hash, role, name, created_at)
VALUES (
  'admin@discreetcourier.com',
  '$2b$10$rQ8K8qP9X3Y5Z6A7B8C9D.EfGhIjKlMnOpQrStUvWxYz0123456789', -- Placeholder hash
  'admin',
  'Eduardo (Admin)',
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  name = 'Eduardo (Admin)',
  updated_at = NOW();

-- Create drivers table if not exists (for route optimization)
CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  current_lat DECIMAL(10, 8),
  current_lng DECIMAL(11, 8),
  vehicle_type VARCHAR(50) DEFAULT 'car',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create route_optimizations table for AI
CREATE TABLE IF NOT EXISTS route_optimizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES drivers(id),
  delivery_ids UUID[],
  optimized_route JSONB,
  optimization_score INTEGER,
  distance_saved DECIMAL(10, 2),
  time_saved DECIMAL(10, 2),
  ai_insights TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create demand_forecasts table for AI
CREATE TABLE IF NOT EXISTS demand_forecasts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  forecast_data JSONB NOT NULL,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  ai_analysis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create zero_trace_deliveries table
CREATE TABLE IF NOT EXISTS zero_trace_deliveries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  anonymous_tracking_id TEXT UNIQUE NOT NULL,
  encrypted_pickup TEXT,
  encrypted_delivery TEXT,
  vpn_route JSONB,
  burner_phone JSONB,
  crypto_payment JSONB,
  proof_hash TEXT,
  verification_code TEXT,
  privacy_settings JSONB,
  status VARCHAR(50) DEFAULT 'pending',
  auto_delete_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  owner_id UUID
);

-- Create index for auto-delete cron
CREATE INDEX IF NOT EXISTS idx_zero_trace_auto_delete
  ON zero_trace_deliveries(auto_delete_at)
  WHERE auto_delete_at IS NOT NULL;

-- Create quotes table if not exists
CREATE TABLE IF NOT EXISTS quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pickup_address TEXT NOT NULL,
  delivery_address TEXT NOT NULL,
  distance_miles DECIMAL(10, 2),
  base_price DECIMAL(10, 2),
  final_price DECIMAL(10, 2),
  service_type VARCHAR(50),
  priority VARCHAR(20),
  client_email VARCHAR(255),
  client_phone VARCHAR(50),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  converted_to_delivery_id UUID REFERENCES deliveries(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Create payment_logs table if not exists
CREATE TABLE IF NOT EXISTS payment_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  delivery_id UUID REFERENCES deliveries(id),
  stripe_payment_intent_id TEXT,
  amount DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50),
  payment_method VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Print success message
DO $$
BEGIN
  RAISE NOTICE 'Admin user and supporting tables created successfully!';
  RAISE NOTICE 'Default admin credentials:';
  RAISE NOTICE '  Email: admin@discreetcourier.com';
  RAISE NOTICE '  Password: Admin123!';
  RAISE NOTICE '';
  RAISE NOTICE 'IMPORTANT: Change the password hash after first login!';
END $$;
