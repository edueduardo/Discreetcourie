# 🔐 FASE 2: HUMAN VAULT - ESPECIFICAÇÃO TÉCNICA

## Data: 24/01/2026
## Status: EM IMPLEMENTAÇÃO
## Prazo: Semanas 3-4 (2 semanas)

---

## 🎯 OBJETIVO

Implementar um sistema de **armazenamento ultra-seguro** para documentos sensíveis com:
- Criptografia E2E (AES-256-GCM)
- Auto-destruição programada
- NDA obrigatório antes de acesso
- Audit trail completo
- Notificações de acesso

---

## 📊 MVP SCOPE (Versão 1.0)

### ✅ INCLUI (MVP):
1. ✅ Upload de arquivos com criptografia E2E
2. ✅ Armazenamento seguro (Supabase Storage)
3. ✅ Auto-destruição programada (após N dias ou após entrega)
4. ✅ NDA digital obrigatório antes de download
5. ✅ Audit trail completo (quem, quando, de onde)
6. ✅ Notificações push quando arquivo acessado
7. ✅ Watermark em visualização de documentos
8. ✅ Download único (file shredding após)

### 🔜 PRÓXIMAS VERSÕES (v2.0+):
- 🔜 Blockchain proof of custody
- 🔜 Biometric vault access
- 🔜 Dead man's switch
- 🔜 Multi-party encryption

---

## 🗄️ DATABASE SCHEMA

### 1. Tabela: `vault_files`

```sql
CREATE TABLE vault_files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Ownership
  delivery_id UUID REFERENCES deliveries(id) ON DELETE CASCADE,
  uploaded_by UUID REFERENCES users(id),

  -- File metadata
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  encrypted_file_key TEXT NOT NULL, -- Chave criptografada do arquivo

  -- Storage
  storage_path TEXT NOT NULL, -- Path no Supabase Storage

  -- Security settings
  requires_nda BOOLEAN DEFAULT TRUE,
  nda_template_id UUID REFERENCES nda_templates(id),
  single_download BOOLEAN DEFAULT TRUE, -- Permite apenas 1 download
  download_count INT DEFAULT 0,

  -- Auto-destruct
  auto_destruct_enabled BOOLEAN DEFAULT TRUE,
  auto_destruct_after_days INT DEFAULT 7,
  auto_destruct_after_delivery BOOLEAN DEFAULT TRUE,
  destruct_at TIMESTAMPTZ,
  is_destructed BOOLEAN DEFAULT FALSE,

  -- Watermark
  watermark_enabled BOOLEAN DEFAULT TRUE,
  watermark_text TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  accessed_at TIMESTAMPTZ,
  destructed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_vault_files_delivery ON vault_files(delivery_id);
CREATE INDEX idx_vault_files_uploaded_by ON vault_files(uploaded_by);
CREATE INDEX idx_vault_files_destruct_at ON vault_files(destruct_at) WHERE NOT is_destructed;

-- RLS Policies
ALTER TABLE vault_files ENABLE ROW LEVEL SECURITY;

-- Admins podem ver tudo (sem conteúdo)
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

-- Owners podem ver seus próprios arquivos
CREATE POLICY "Users can view own vault files"
  ON vault_files FOR SELECT
  TO authenticated
  USING (uploaded_by = auth.uid());

-- Somente owners podem fazer upload
CREATE POLICY "Users can upload vault files"
  ON vault_files FOR INSERT
  TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

-- Somente owners podem deletar
CREATE POLICY "Users can delete own vault files"
  ON vault_files FOR DELETE
  TO authenticated
  USING (uploaded_by = auth.uid());
```

### 2. Tabela: `vault_access_logs`

```sql
CREATE TABLE vault_access_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- File reference
  vault_file_id UUID REFERENCES vault_files(id) ON DELETE CASCADE,

  -- Access details
  accessed_by UUID REFERENCES users(id),
  access_type TEXT NOT NULL, -- 'view', 'download', 'preview'

  -- Security context
  ip_address INET,
  user_agent TEXT,
  geolocation JSONB, -- {lat, lon, city, country}

  -- NDA
  nda_signed BOOLEAN DEFAULT FALSE,
  nda_signature_id UUID REFERENCES nda_signatures(id),

  -- Result
  access_granted BOOLEAN DEFAULT FALSE,
  denial_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_vault_access_logs_file ON vault_access_logs(vault_file_id);
CREATE INDEX idx_vault_access_logs_user ON vault_access_logs(accessed_by);
CREATE INDEX idx_vault_access_logs_created ON vault_access_logs(created_at DESC);

-- RLS
ALTER TABLE vault_access_logs ENABLE ROW LEVEL SECURITY;

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
```

### 3. Tabela: `nda_templates`

```sql
CREATE TABLE nda_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Template info
  name TEXT NOT NULL,
  description TEXT,

  -- Content
  content TEXT NOT NULL, -- Markdown/HTML do NDA

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

The Receiving Party acknowledges that they will have access to confidential and proprietary information belonging to the Disclosing Party.

## 2. OBLIGATIONS

The Receiving Party agrees to:
- Maintain strict confidentiality of all information accessed
- Not disclose, copy, or distribute any information without written consent
- Use the information solely for the intended purpose
- Delete all copies after intended use

## 3. PENALTIES

Violation of this agreement may result in:
- Legal action for damages
- Criminal prosecution under applicable laws
- Financial penalties up to $100,000

## 4. TERM

This agreement remains in effect indefinitely.

---

**Electronic Signature**: {{SIGNATURE}}
**Date**: {{SIGNATURE_DATE}}
**IP Address**: {{IP_ADDRESS}}
**Digital Fingerprint**: {{FINGERPRINT}}',
  TRUE
);
```

### 4. Tabela: `nda_signatures`

```sql
CREATE TABLE nda_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  nda_template_id UUID REFERENCES nda_templates(id),
  vault_file_id UUID REFERENCES vault_files(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),

  -- Signature data
  signature_data TEXT NOT NULL, -- Digital signature hash
  ip_address INET NOT NULL,
  user_agent TEXT,
  geolocation JSONB,

  -- Legal metadata
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  accepted_terms BOOLEAN DEFAULT TRUE,

  -- Verification
  verification_hash TEXT NOT NULL UNIQUE, -- Hash do documento + assinatura
  is_verified BOOLEAN DEFAULT TRUE,

  -- Timestamps
  signed_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- Opcional
);

-- Indexes
CREATE INDEX idx_nda_signatures_file ON nda_signatures(vault_file_id);
CREATE INDEX idx_nda_signatures_user ON nda_signatures(user_id);
CREATE INDEX idx_nda_signatures_verified ON nda_signatures(verification_hash);

-- RLS
ALTER TABLE nda_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own signatures"
  ON nda_signatures FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create signatures"
  ON nda_signatures FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
```

---

## 🔐 CRIPTOGRAFIA

### Encryption Flow:

```typescript
// 1. UPLOAD (Client-side)
async function uploadSecureFile(file: File, password: string) {
  // Generate random encryption key
  const encryptionKey = crypto.getRandomValues(new Uint8Array(32))

  // Encrypt file content with AES-256-GCM
  const encryptedContent = await encryptFileAES256(file, encryptionKey)

  // Encrypt encryption key with user password (PBKDF2)
  const userKey = await deriveKeyFromPassword(password)
  const encryptedKey = await encryptKey(encryptionKey, userKey)

  // Upload to Supabase Storage
  const { path } = await uploadToStorage(encryptedContent)

  // Save metadata to DB
  await saveVaultFile({
    file_name: file.name,
    encrypted_file_key: encryptedKey,
    storage_path: path,
    // ...
  })
}

// 2. DOWNLOAD (Client-side)
async function downloadSecureFile(fileId: string, password: string) {
  // Get file metadata
  const metadata = await getVaultFile(fileId)

  // Check NDA
  if (metadata.requires_nda && !hasSignedNDA(fileId)) {
    throw new Error('NDA signature required')
  }

  // Decrypt encryption key with user password
  const userKey = await deriveKeyFromPassword(password)
  const encryptionKey = await decryptKey(metadata.encrypted_file_key, userKey)

  // Download encrypted file
  const encryptedContent = await downloadFromStorage(metadata.storage_path)

  // Decrypt file content
  const decryptedFile = await decryptFileAES256(encryptedContent, encryptionKey)

  // Log access
  await logAccess(fileId, 'download')

  // If single_download, mark file for deletion
  if (metadata.single_download) {
    await scheduleFileDeletion(fileId)
  }

  return decryptedFile
}
```

### Key Derivation (PBKDF2):

```typescript
async function deriveKeyFromPassword(password: string, salt?: Uint8Array) {
  const enc = new TextEncoder()
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  )

  const derivedKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt || crypto.getRandomValues(new Uint8Array(16)),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  )

  return derivedKey
}
```

---

## 🎨 UI/UX FLOW

### 1. Upload Flow (Admin/VIP Client):

```
/admin/vault/upload
├── [Drag & Drop or Browse]
├── File selected
│   ├── File name: contract.pdf
│   ├── File size: 2.4 MB
│   └── File type: application/pdf
├── [Security Settings]
│   ├── ☑ Require NDA before access
│   ├── ☑ Single download only
│   ├── ☑ Auto-destruct after delivery
│   └── Auto-destruct after: [7] days
├── [Set Password]
│   ├── Password: ****************
│   └── Confirm: ****************
└── [Upload Secure File] → Encrypts & uploads
```

### 2. Access Flow (Recipient):

```
/vault/access/[fileId]
├── [File Information]
│   ├── File name: contract.pdf (2.4 MB)
│   ├── Uploaded: 2 hours ago
│   └── Expires: in 6 days
├── [NDA Required]
│   ├── [Read NDA] → Modal com NDA
│   ├── Full Name: ____________
│   ├── Email: ____________
│   ├── ☑ I accept the terms
│   └── [Sign NDA] → Creates signature
├── [Enter Password]
│   ├── Password: ****************
│   └── [Unlock & Download]
└── [Success]
    ├── ✅ File decrypted successfully
    ├── [Download] or [Preview (with watermark)]
    └── ⚠️ This file will self-destruct after download
```

### 3. Audit Trail View (Admin):

```
/admin/vault/files/[fileId]/audit
├── File: contract.pdf
├── Uploaded: Jan 24, 2026 3:45 PM
├── Status: Active (expires in 6 days)
├── Access Log:
│   ├── Jan 24, 3:50 PM - John Doe (john@example.com)
│   │   ├── IP: 192.168.1.1 (Columbus, OH)
│   │   ├── NDA signed: ✅
│   │   ├── Action: Preview
│   │   └── Status: Granted
│   └── Jan 24, 4:02 PM - Jane Smith (jane@example.com)
│       ├── IP: 10.0.0.5 (New York, NY)
│       ├── NDA signed: ❌
│       ├── Action: Download attempt
│       └── Status: Denied - NDA not signed
└── [Download Full Audit Report (PDF)]
```

---

## 📁 FILE STRUCTURE

```
src/
├── app/
│   ├── admin/
│   │   └── vault/
│   │       ├── page.tsx              # Vault dashboard
│   │       ├── upload/
│   │       │   └── page.tsx          # Upload interface
│   │       └── files/
│   │           └── [id]/
│   │               ├── page.tsx      # File details
│   │               └── audit/
│   │                   └── page.tsx  # Audit trail
│   ├── vault/
│   │   └── access/
│   │       └── [id]/
│   │           └── page.tsx          # Public access page
│   └── api/
│       └── vault/
│           ├── upload/
│           │   └── route.ts          # Upload handler
│           ├── download/
│           │   └── route.ts          # Download handler
│           ├── nda/
│           │   ├── sign/
│           │   │   └── route.ts      # NDA signature
│           │   └── verify/
│           │       └── route.ts      # Verify signature
│           └── cron/
│               └── auto-destruct/
│                   └── route.ts      # Scheduled deletion
├── lib/
│   ├── vault/
│   │   ├── encryption.ts             # E2E encryption utils
│   │   ├── storage.ts                # Supabase storage wrapper
│   │   ├── watermark.ts              # PDF watermarking
│   │   └── audit.ts                  # Audit trail utils
│   └── nda/
│       ├── templates.ts              # NDA template utils
│       └── signature.ts              # Digital signature utils
└── components/
    └── vault/
        ├── upload-zone.tsx           # Drag & drop uploader
        ├── nda-modal.tsx             # NDA acceptance modal
        ├── password-input.tsx        # Secure password input
        ├── audit-log.tsx             # Access log display
        └── file-preview.tsx          # Watermarked preview
```

---

## ✅ DEFINITION OF DONE

### Para MVP (v1.0):

- [ ] ✅ Database schema criado e testado
- [ ] ✅ Encryption/decryption funcionando (AES-256-GCM)
- [ ] ✅ Upload de arquivos com criptografia E2E
- [ ] ✅ Download com verificação de NDA
- [ ] ✅ Auto-destruct funcionando (cronjob)
- [ ] ✅ Audit trail completo
- [ ] ✅ Watermark em PDFs
- [ ] ✅ Notificações de acesso
- [ ] ✅ UI/UX completa e responsiva
- [ ] ✅ Testes manuais passando
- [ ] ✅ Documentação completa

### Testing:

- [ ] Upload arquivo de 10MB - OK
- [ ] Download com NDA assinado - OK
- [ ] Download sem NDA - BLOCKED
- [ ] Download com senha errada - BLOCKED
- [ ] Auto-destruct após 7 dias - OK
- [ ] Single download deletion - OK
- [ ] Audit trail registrando tudo - OK

---

## 🚀 IMPLEMENTAÇÃO (Próximos Passos)

1. ✅ Criar migration do banco
2. ✅ Implementar lib de criptografia
3. ✅ Criar API endpoints (upload, download, NDA)
4. ✅ Criar UI de upload
5. ✅ Criar UI de acesso/download
6. ✅ Implementar audit trail
7. ✅ Implementar auto-destruct cronjob
8. ✅ Testes completos
9. ✅ Deploy e validação

**ESTIMATIVA**: 2 semanas (10 dias úteis)
**PRIORIDADE**: ALTA (feature chave para ultra-premium)

---

**Última atualização**: 24/01/2026
**Status**: Aguardando aprovação do PR para começar implementação
