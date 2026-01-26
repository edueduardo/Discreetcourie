-- Migration: Create vault-files storage bucket
-- Created: 2026-01-26
-- Purpose: Secure file storage for Human Vault

-- Create vault-files bucket (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'vault-files',
  'vault-files',
  false, -- Private bucket
  104857600, -- 100MB limit
  ARRAY['application/octet-stream', 'application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/zip', 'text/plain']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 104857600;

-- Storage policies for vault-files bucket

-- Policy: Authenticated users can upload files
CREATE POLICY "Users can upload vault files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vault-files');

-- Policy: Users can read their own files (based on path pattern)
CREATE POLICY "Users can read their vault files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'vault-files');

-- Policy: Users can delete their own files
CREATE POLICY "Users can delete their vault files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vault-files');

-- Create vault_files metadata table
CREATE TABLE IF NOT EXISTS vault_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL UNIQUE,
  content_type VARCHAR(100),
  file_size BIGINT,
  is_encrypted BOOLEAN DEFAULT true,
  encryption_metadata JSONB,
  nda_required BOOLEAN DEFAULT false,
  nda_signed_at TIMESTAMPTZ,
  auto_delete_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_vault_files_user ON vault_files(user_id);
CREATE INDEX idx_vault_files_client ON vault_files(client_id);
CREATE INDEX idx_vault_files_auto_delete ON vault_files(auto_delete_at) WHERE auto_delete_at IS NOT NULL;

-- Enable RLS
ALTER TABLE vault_files ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own vault files"
ON vault_files FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR client_id IN (
  SELECT id FROM clients WHERE id = vault_files.client_id
));

CREATE POLICY "Users can insert their own vault files"
ON vault_files FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own vault files"
ON vault_files FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own vault files"
ON vault_files FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Create access log table
CREATE TABLE IF NOT EXISTS vault_access_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_id UUID REFERENCES vault_files(id) ON DELETE CASCADE,
  accessed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(20) NOT NULL, -- 'view', 'download', 'delete'
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vault_access_log_file ON vault_access_log(file_id);
CREATE INDEX idx_vault_access_log_user ON vault_access_log(accessed_by);

-- Enable RLS on access log
ALTER TABLE vault_access_log ENABLE ROW LEVEL SECURITY;

-- Admins can view all access logs
CREATE POLICY "Admins can view access logs"
ON vault_access_log FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
));

-- Function to auto-delete expired vault files
CREATE OR REPLACE FUNCTION delete_expired_vault_files()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Delete storage objects and metadata for expired files
  WITH expired AS (
    DELETE FROM vault_files
    WHERE auto_delete_at IS NOT NULL AND auto_delete_at <= NOW()
    RETURNING id, storage_path
  )
  SELECT COUNT(*) INTO deleted_count FROM expired;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on objects
COMMENT ON TABLE vault_files IS 'Metadata for encrypted files stored in Human Vault';
COMMENT ON TABLE vault_access_log IS 'Audit log for all vault file access';
COMMENT ON FUNCTION delete_expired_vault_files() IS 'Deletes expired vault files based on auto_delete_at';
