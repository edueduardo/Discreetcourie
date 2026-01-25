# 🧪 TESTAR RBAC EM PRODUÇÃO

**Como validar o sistema RBAC sem mocks**

---

## ✅ PRÉ-REQUISITOS:

1. ✅ Migration executada (`003_add_role_to_users.sql`)
2. ✅ Código commitado e merged para master
3. ✅ Deploy completo no Vercel

---

## 🔧 PASSO 1: EXECUTAR MIGRATION NO SUPABASE

### Via Supabase Dashboard:

1. Vá para: https://supabase.com/dashboard/project/YOUR_PROJECT/editor
2. Clique em: **SQL Editor**
3. Cole o SQL de `/EXECUTAR_MIGRATION_ROLE.md`
4. Execute (Run)
5. Verifique sucesso

### Verificar se funcionou:

```sql
-- Ver estrutura da tabela
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'role';

-- Ver role do admin
SELECT email, role FROM users;
```

---

## 🧪 PASSO 2: TESTAR ROLES NO DASHBOARD

### Teste 1: Login como Admin

1. Acesse: https://discreet-courier.vercel.app/login
2. Login: `admin@discreetcourie.com` / `Admin123!`
3. **Verificar:**
   - ✅ Dashboard carrega
   - ✅ Todas features visíveis
   - ✅ Pode acessar tudo

### Teste 2: Criar usuário VIP (via Supabase)

```sql
-- Criar usuário VIP de teste
INSERT INTO users (email, password_hash, role, name)
VALUES (
  'vip@test.com',
  '$2b$10$...',  -- Use hash gerado pelo bcrypt
  'vip_client',
  'VIP Test User'
);
```

**Gerar hash da senha:**
```bash
node -e "const bcrypt = require('bcrypt'); bcrypt.hash('TestVIP123!', 10).then(console.log)"
```

### Teste 3: Criar usuário Courier

```sql
-- Criar courier de teste
INSERT INTO users (email, password_hash, role, name)
VALUES (
  'courier@test.com',
  '$2b$10$...',  -- Use hash gerado pelo bcrypt
  'courier',
  'Courier Test User'
);
```

### Teste 4: Criar usuário Client padrão

```sql
-- Criar client de teste
INSERT INTO users (email, password_hash, role, name)
VALUES (
  'client@test.com',
  '$2b$10$...',  -- Use hash gerado pelo bcrypt
  'client',
  'Client Test User'
);
```

---

## 🎯 PASSO 3: TESTAR PERMISSÕES

### Como Admin:

1. Login como `admin@discreetcourie.com`
2. Testar acesso a: **GET** `/api/admin/users`

```bash
curl https://discreet-courier.vercel.app/api/admin/users \
  -H "Cookie: next-auth.session-token=YOUR_SESSION_TOKEN"
```

**Esperado:** ✅ Status 200, lista de usuários

### Como VIP Client:

1. Login como `vip@test.com`
2. Testar acesso a: **GET** `/api/admin/users`

**Esperado:** ❌ Status 403 Forbidden

3. Testar acesso features VIP (quando implementadas):
   - ✅ Human Vault
   - ✅ Crypto Payments

### Como Courier:

1. Login como `courier@test.com`
2. Verificar no dashboard:
   - ✅ Vê apenas entregas atribuídas
   - ✅ Pode atualizar status de entregas
   - ✅ Tem acesso ao GPS
   - ❌ Não vê Human Vault
   - ❌ Não vê gerenciamento de usuários

### Como Client:

1. Login como `client@test.com`
2. Verificar no dashboard:
   - ✅ Vê apenas suas entregas
   - ❌ Não pode atualizar status
   - ❌ Não vê Human Vault
   - ❌ Não vê GPS de entregas
   - ❌ Não vê crypto payments

---

## 📊 MATRIZ DE TESTE:

| Teste | Admin | VIP | Courier | Client |
|-------|-------|-----|---------|--------|
| Login | ✅ | ✅ | ✅ | ✅ |
| Ver dashboard | ✅ | ✅ | ✅ | ✅ |
| /api/admin/users | ✅ | ❌ 403 | ❌ 403 | ❌ 403 |
| Human Vault | ✅ | ✅ | ❌ | ❌ |
| Crypto Payments | ✅ | ✅ | ❌ | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| Update Delivery Status | ✅ | ❌ | ✅ | ❌ |
| GPS Tracking | ✅ | ❌ | ✅ | ❌ |

---

## ✅ CRITÉRIOS DE SUCESSO:

1. **Migration executada** sem erros
2. **Admin pode acessar** `/api/admin/users`
3. **Não-admins recebem 403** ao acessar `/api/admin/users`
4. **Role aparece na sessão** (pode ver no console do navegador)
5. **UI condicional funciona** (features só aparecem para roles corretos)

---

## 🐛 SE DER ERRO:

### "role is not defined"
→ Migration não foi executada. Execute `003_add_role_to_users.sql`

### "403 Forbidden" para admin
→ Usuário admin não tem role='admin'. Execute:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@discreetcourie.com';
```

### Session não tem role
→ Logout e login novamente. O role só é adicionado na sessão no login.

### Página não carrega
→ Veja logs no Vercel Dashboard → Functions → Logs

---

**ME AVISE DOS RESULTADOS DOS TESTES!** 🚀
