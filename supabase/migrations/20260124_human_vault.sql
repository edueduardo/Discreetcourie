-- ============================================
-- FASE 2: HUMAN VAULT - DATABASE SCHEMA
-- Created: 2026-01-24
-- Description: Ultra-secure file storage with E2E encryption
-- ============================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. NDA TEMPLATES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS nda_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Template info
  name TEXT NOT NULL,
  description TEXT,

  -- Content (Markdown/HTML)
  content TEXT NOT NULL,

  -- Legal
  legal_binding BOOLEAN DEFAULT TRUE,
  jurisdiction TEXT DEFAULT 'Ohio, USA',

  -- Settings
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default NDA template
INSERT INTO nda_templates (name, description, content, is_default) VALUES (
  'Standard Confidentiality Agreement',
  'Default NDA for vault file access',
  '# NON-DISCLOSURE AGREEMENT

This Non-Disclosure Agreement (the "Agreement") is entered into as of {{DATE}} by and between:

**DISCLOSING PARTY**: DiscreetCourie LLC
**RECEIVING PARTY**: {{RECIPIENT_NAME}}

## 1. CONFIDENTIAL INFORMATION

The Receiving Party acknowledges that they will have access to confidential and proprietary information belonging to the Disclosing Party through the DiscreetCourie Human Vault system.

## 2. OBLIGATIONS

The Receiving Party agrees to:
- Maintain strict confidentiality of all information accessed
- Not disclose, copy, reproduce, or distribute any information without prior written consent
- Use the information solely for the intended and authorized purpose
- Delete all copies of the information after the intended use
- Not reverse engineer, decompile, or attempt to extract source materials
- Implement reasonable security measures to protect the information

## 3. PROHIBITED ACTIONS

The Receiving Party shall NOT:
- Share login credentials or access methods with any third party
- Screenshot, photograph, or record the confidential information
- Store the information on unsecured devices or cloud services
- Discuss the contents with unauthorized individuals

## 4. PENALTIES FOR VIOLATION

Violation of this agreement may result in:
- Immediate legal action for injunctive relief
- Criminal prosecution under applicable state and federal laws
- Financial penalties up to $100,000 USD per violation
- Recovery of all legal fees and costs
- Reporting to relevant professional licensing boards

## 5. TERM AND SURVIVAL

This agreement:
- Takes effect immediately upon electronic signature
- Remains in effect indefinitely
- Survives termination of any business relationship
- Is binding upon heirs, successors, and assigns

## 6. GOVERNING LAW

This agreement shall be governed by the laws of the State of Ohio, United States, without regard to conflict of law principles.

## 7. ACKNOWLEDGMENT

By signing below, the Receiving Party acknowledges that they have read, understood, and agree to be bound by all terms of this Non-Disclosure Agreement.

---

**Electronic Signature**: {{SIGNATURE}}
**Signed By**: {{RECIPIENT_NAME}}
**Email**: {{RECIPIENT_EMAIL}}
**Date**: {{SIGNATURE_DATE}}
**IP Address**: {{IP_ADDRESS}}
**Digital Fingerprint**: {{FINGERPRINT}}
**Verification Hash**: {{VERIFICATION_HASH}}

---

*This is a legally binding electronic agreement. Your digital signature has the same legal effect as a handwritten signature.*',
  TRUE
) ON CONFLICT DO NOTHING;

-- ============================================
-- 2. VAULT FILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS vault_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id) NOT NULL,

  -- File metadata
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  encrypted_file_key TEXT NOT NULL, -- Encrypted encryption key

  -- Storage
  storage_path TEXT NOT NULL UNIQUE, -- Path in Supabase Storage
  storage_bucket TEXT DEFAULT 'vault-files',

  -- Security settings
  requires_nda BOOLEAN DEFAULT TRUE,
  nda_template_id UUID REFERENCES nda_templates(id),
  single_download BOOLEAN DEFAULT TRUE, -- Allow only 1 download
  download_count INT DEFAULT 0,
  max_downloads INT DEFAULT 1,

  -- Auto-destruct
  auto_destruct_enabled BOOLEAN DEFAULT TRUE,
  auto_destruct_after_days INT DEFAULT 7,
  auto_destruct_after_delivery BOOLEAN DEFAULT TRUE,
  destruct_at TIMESTAMPTZ,
  is_destructed BOOLEAN DEFAULT FALSE,

  -- Watermark
  watermark_enabled BOOLEAN DEFAULT TRUE,
  watermark_text TEXT,

  -- Access control
  password_protected BOOLEAN DEFAULT TRUE,
  access_token TEXT UNIQUE, -- Unique token for public access

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  first_accessed_at TIMESTAMPTZ,
  last_accessed_at TIMESTAMPTZ,
  destructed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vault_files_delivery ON vault_files(delivery_id);
CREATE INDEX IF NOT EXISTS idx_vault_files_uploaded_by ON vault_files(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_vault_files_destruct_at ON vault_files(destruct_at) WHERE NOT is_destructed;
CREATE INDEX IF NOT EXISTS idx_vault_files_access_token ON vault_files(access_token) WHERE NOT is_destructed;
CREATE INDEX IF NOT EXISTS idx_vault_files_created_at ON vault_files(created_at DESC);

-- RLS Policies
ALTER TABLE vault_files ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view vault file metadata" ON vault_files;
DROP POLICY IF EXISTS "Users can view own vault files" ON vault_files;
DROP POLICY IF EXISTS "Users can upload vault files" ON vault_files;
DROP POLICY IF EXISTS "Users can update own vault files" ON vault_files;
DROP POLICY IF EXISTS "Users can delete own vault files" ON vault_files;

-- Admins can view all metadata (without decryption keys)
CREATE POLICY "Admins can view vault file metadata"
  ON vault_files FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Users can view their own files
CREATE POLICY "Users can view own vault files"
  ON vault_files FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Users can upload files
CREATE POLICY "Users can upload vault files"
  ON vault_files FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Users can update their own files
CREATE POLICY "Users can update own vault files"
  ON vault_files FOR UPDATE
  TO authenticated
  USING (uploaded_by = auth.uid())
  WITH CHECK (uploaded_by = auth.uid());

-- Users can delete their own files
CREATE POLICY "Users can delete own vault files"
  ON vault_files FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());

-- ============================================
-- 3. NDA SIGNATURES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS nda_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  nda_template_id UUID REFERENCES nda_templates(id) NOT NULL,
  vault_file_id UUID REFERENCES vault_files(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id),

  -- Signature data
  signature_data TEXT NOT NULL, -- Digital signature/name
  ip_address INET NOT NULL,
  user_agent TEXT,
  geolocation JSONB, -- {lat, lon, city, country}

  -- Signer information
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,

  -- Legal metadata
  accepted_terms BOOLEAN DEFAULT TRUE,
  acceptance_timestamp TIMESTAMPTZ DEFAULT NOW(),

  -- Verification
  verification_hash TEXT NOT NULL UNIQUE, -- Hash of (nda_content + signature + timestamp)
  is_verified BOOLEAN DEFAULT TRUE,
  verification_method TEXT DEFAULT 'electronic_signature',

  -- Timestamps
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- Optional expiration
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_nda_signatures_file ON nda_signatures(vault_file_id);
CREATE INDEX IF NOT EXISTS idx_nda_signatures_user ON nda_signatures(user_id);
CREATE INDEX IF NOT EXISTS idx_nda_signatures_email ON nda_signatures(email);
CREATE INDEX IF NOT EXISTS idx_nda_signatures_hash ON nda_signatures(verification_hash);
CREATE INDEX IF NOT EXISTS idx_nda_signatures_signed_at ON nda_signatures(signed_at DESC);

-- RLS
ALTER TABLE nda_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all signatures" ON nda_signatures;
DROP POLICY IF EXISTS "Users can view own signatures" ON nda_signatures;
DROP POLICY IF EXISTS "Anyone can create signatures" ON nda_signatures;

-- Admins can view all
CREATE POLICY "Admins can view all signatures"
  ON nda_signatures FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Users can view their own signatures
CREATE POLICY "Users can view own signatures"
  ON nda_signatures FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR email = (SELECT email FROM users WHERE id = auth.uid()));

-- Anyone can create signatures (needed for public access)
CREATE POLICY "Anyone can create signatures"
  ON nda_signatures FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- ============================================
-- 4. VAULT ACCESS LOGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS vault_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- File reference
  vault_file_id UUID REFERENCES vault_files(id) ON DELETE CASCADE NOT NULL,

  -- Access details
  accessed_by UUID REFERENCES users(id), -- NULL for anonymous access
  access_type TEXT NOT NULL CHECK (access_type IN ('view', 'download', 'preview', 'nda_view')),

  -- Security context
  ip_address INET NOT NULL,
  user_agent TEXT,
  geolocation JSONB, -- {lat, lon, city, country}
  referrer TEXT,

  -- NDA
  nda_signed BOOLEAN DEFAULT FALSE,
  nda_signature_id UUID REFERENCES nda_signatures(id),

  -- Request details
  access_token_used TEXT, -- Token used for access
  password_attempted BOOLEAN DEFAULT FALSE,
  password_correct BOOLEAN DEFAULT FALSE,

  -- Result
  access_granted BOOLEAN DEFAULT FALSE,
  denial_reason TEXT,
  http_status_code INT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vault_access_logs_file ON vault_access_logs(vault_file_id);
CREATE INDEX IF NOT EXISTS idx_vault_access_logs_user ON vault_access_logs(accessed_by);
CREATE INDEX IF NOT EXISTS idx_vault_access_logs_created ON vault_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vault_access_logs_granted ON vault_access_logs(access_granted);
CREATE INDEX IF NOT EXISTS idx_vault_access_logs_ip ON vault_access_logs(ip_address);

-- RLS
ALTER TABLE vault_access_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all access logs" ON vault_access_logs;
DROP POLICY IF EXISTS "Users can view logs of their files" ON vault_access_logs;
DROP POLICY IF EXISTS "System can insert logs" ON vault_access_logs;

-- Admins can view all
CREATE POLICY "Admins can view all access logs"
  ON vault_access_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- File owners can view logs of their files
CREATE POLICY "Users can view logs of their files"
  ON vault_access_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM vault_files
      WHERE vault_files.id = vault_access_logs.vault_file_id
      AND vault_files.uploaded_by = auth.uid()
    )
  );

-- System can insert logs (both authenticated and anon)
CREATE POLICY "System can insert logs"
  ON vault_access_logs FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- ============================================
-- 5. FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for vault_files
DROP TRIGGER IF EXISTS update_vault_files_updated_at ON vault_files;
CREATE TRIGGER update_vault_files_updated_at
  BEFORE UPDATE ON vault_files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for nda_templates
DROP TRIGGER IF EXISTS update_nda_templates_updated_at ON nda_templates;
CREATE TRIGGER update_nda_templates_updated_at
  BEFORE UPDATE ON nda_templates
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to set destruct_at timestamp on insert
CREATE OR REPLACE FUNCTION set_vault_file_destruct_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.auto_destruct_enabled AND NEW.auto_destruct_after_days IS NOT NULL THEN
    NEW.destruct_at = NOW() + (NEW.auto_destruct_after_days || ' days')::INTERVAL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set destruct_at
DROP TRIGGER IF EXISTS set_vault_file_destruct_at_trigger ON vault_files;
CREATE TRIGGER set_vault_file_destruct_at_trigger
  BEFORE INSERT ON vault_files
  FOR EACH ROW
  EXECUTE FUNCTION set_vault_file_destruct_at();

-- ============================================
-- 6. STORAGE BUCKET (Supabase)
-- ============================================

-- Note: This needs to be run via Supabase Dashboard or SQL Editor
-- with proper permissions. The bucket configuration:
--
-- Bucket name: vault-files
-- Public: false
-- File size limit: 100MB
-- Allowed MIME types: all
-- RLS: enabled
--
-- Create via Supabase Dashboard:
-- Storage → Create Bucket → vault-files (Private)

-- ============================================
-- 7. COMMENTS & DOCUMENTATION
-- ============================================

COMMENT ON TABLE vault_files IS 'Encrypted file storage with auto-destruct and NDA enforcement';
COMMENT ON TABLE vault_access_logs IS 'Audit trail of all access attempts to vault files';
COMMENT ON TABLE nda_templates IS 'Legal NDA templates for file access';
COMMENT ON TABLE nda_signatures IS 'Digital signatures for NDA acceptance';

COMMENT ON COLUMN vault_files.encrypted_file_key IS 'The file encryption key, itself encrypted with user password (PBKDF2)';
COMMENT ON COLUMN vault_files.access_token IS 'Unique token for anonymous/public access to the file';
COMMENT ON COLUMN vault_files.single_download IS 'If true, file is deleted after first successful download';
COMMENT ON COLUMN vault_access_logs.access_granted IS 'Whether access was granted (true) or denied (false)';
COMMENT ON COLUMN nda_signatures.verification_hash IS 'SHA-256 hash of NDA content + signature + timestamp for tamper detection';

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
