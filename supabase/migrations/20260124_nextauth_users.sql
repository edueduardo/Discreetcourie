-- NextAuth Users Table Migration
-- Date: 2026-01-24
-- Purpose: Add users table for NextAuth authentication with RBAC

-- Create role enum
CREATE TYPE user_role AS ENUM ('admin', 'vip_client', 'client', 'courier');

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role DEFAULT 'client',
  name VARCHAR(255),

  -- Email verification
  email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token TEXT,

  -- Password reset
  password_reset_token TEXT,
  password_reset_expires TIMESTAMPTZ,

  -- 2FA
  two_factor_enabled BOOLEAN DEFAULT FALSE,
  two_factor_secret TEXT,
  backup_codes TEXT[], -- Array of one-time backup codes

  -- Account status
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_password_reset_token ON users(password_reset_token);
CREATE INDEX idx_users_email_verification_token ON users(email_verification_token);

-- Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Admins can see all users
CREATE POLICY users_admin_all ON users
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- Users can see their own data
CREATE POLICY users_self_select ON users
  FOR SELECT
  USING (id = auth.uid());

-- Users can update their own data (except role)
CREATE POLICY users_self_update ON users
  FOR UPDATE
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND role = (SELECT role FROM users WHERE id = auth.uid()));

-- Security logs table
CREATE TABLE IF NOT EXISTS security_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  route VARCHAR(255),
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying logs
CREATE INDEX idx_security_logs_user_id ON security_logs(user_id);
CREATE INDEX idx_security_logs_timestamp ON security_logs(timestamp);
CREATE INDEX idx_security_logs_action ON security_logs(action);

-- RLS for security logs
ALTER TABLE security_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view security logs
CREATE POLICY security_logs_admin_only ON security_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Insert default admin user (password: Admin123!)
-- Password hash generated with bcrypt for 'Admin123!'
INSERT INTO users (email, password_hash, role, name, email_verified, is_active)
VALUES (
  'admin@discreetcourie.com',
  '$2b$10$qch8g688qhhiXJqqdmzyj.uX4uKEiHgh7tTEbqlq15GcURes.02xO', -- Admin123!
  'admin',
  'System Administrator',
  TRUE,
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'Authentication users with NextAuth';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password';
COMMENT ON COLUMN users.role IS 'RBAC role: admin, vip_client, client, courier';
COMMENT ON COLUMN users.two_factor_secret IS 'TOTP secret for 2FA';
COMMENT ON COLUMN users.backup_codes IS 'One-time use backup codes for 2FA';
COMMENT ON TABLE security_logs IS 'Security event logging for unauthorized access attempts';
