# 🔧 EXECUTAR MIGRATION - ADICIONAR ROLE

**Arquivo:** `supabase/migrations/003_add_role_to_users.sql`

---

## 📋 PASSOS PARA EXECUTAR:

### OPÇÃO 1: Via Supabase Dashboard (RECOMENDADO)

1. **Vá para:** https://supabase.com/dashboard/project/YOUR_PROJECT/editor
2. **Clique em:** SQL Editor (no menu lateral)
3. **Clique em:** New query
4. **Cole este SQL:**

```sql
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
```

5. **Clique em:** Run (ou Ctrl+Enter)
6. **Verifique:** Success! ✅

---

### OPÇÃO 2: Via psql (se você usa terminal)

```bash
psql $DATABASE_URL -f supabase/migrations/003_add_role_to_users.sql
```

---

## ✅ VERIFICAR SE FUNCIONOU:

Execute este SQL para verificar:

```sql
-- Ver estrutura da tabela users
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';

-- Ver role do admin
SELECT email, role FROM users WHERE email = 'admin@discreetcourie.com';
```

**Resultado esperado:**
- Coluna `role` existe
- Admin tem role = 'admin'

---

## 🎯 ROLES DISPONÍVEIS:

- **admin** → Acesso total ao sistema
- **vip_client** → Cliente premium (Human Vault, crypto payments)
- **courier** → Motorista (ver entregas atribuídas)
- **client** → Cliente padrão (fazer pedidos básicos)

---

**ME AVISE QUANDO EXECUTAR!** 🚀
