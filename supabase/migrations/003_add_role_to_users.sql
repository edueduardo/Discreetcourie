-- Migration: Add role column to users table
-- Created: 2026-01-25
-- Purpose: Implement RBAC (Role-Based Access Control)

-- Add role column with default 'client'
ALTER TABLE users
ADD COLUMN role VARCHAR(50) DEFAULT 'client' NOT NULL;

-- Add check constraint for valid roles
ALTER TABLE users
ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'vip_client', 'courier', 'client'));

-- Update existing admin user to have admin role
UPDATE users
SET role = 'admin'
WHERE email = 'admin@discreetcourie.com';

-- Create index for faster role queries
CREATE INDEX idx_users_role ON users(role);

-- Add comment
COMMENT ON COLUMN users.role IS 'User role for RBAC: admin, vip_client, courier, client';
