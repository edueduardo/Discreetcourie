# 🔧 TROUBLESHOOTING DE MIGRATIONS

**Última Atualização**: 2026-01-27 12:15

---

## ❌ ERRO ATUAL

```
ERROR: 42703: column "user_id" does not exist
```

---

## 🔍 DIAGNÓSTICO

### O que está acontecendo:

O erro "column user_id does not exist" significa que uma **policy ou query** está tentando acessar a coluna `user_id` em uma tabela que **não tem essa coluna**.

### Onde NÃO está o problema:

✅ `00000001_complete_schema.sql` está **CORRETO**
- Todas as referências a `user_id` estão nas tabelas certas:
  - `clients.user_id` ✅ (existe)
  - Policies usam `WHERE user_id = auth.uid()` na tabela `clients` ✅ (correto)

### Onde ESTÁ o problema:

❌ **Alguma migration DEPOIS do complete_schema**

Possíveis culpados:
1. `20260123_ai_features.sql` - Pode ter policy incorreta
2. `20260124_human_vault.sql` - Pode ter policy incorreta
3. Alguma outra migration com policy mal escrita

---

## 🎯 SOLUÇÃO PASSO A PASSO

### PASSO 1: Limpar o Banco (Recomendado)

```sql
-- No Supabase SQL Editor
-- ⚠️ ISSO DELETA TUDO - só faça se não tiver dados importantes

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

### PASSO 2: Rodar APENAS complete_schema

```sql
-- Cole o conteúdo de:
-- 00000001_complete_schema.sql

-- Execute
-- ✅ Deve funcionar sem erros
```

### PASSO 3: Testar se complete_schema funcionou

```sql
-- Verificar tabelas
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Deve mostrar: users, clients, deliveries, invoices, security_logs

-- Verificar policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public';

-- Deve mostrar várias policies sem erros
```

### PASSO 4: Rodar próxima migration COM CUIDADO

```sql
-- Rode UMA migration por vez:
-- 1. 20260123_ai_features.sql

-- Se der erro, PARE e me avise qual linha
```

---

## 🔍 COMO IDENTIFICAR A MIGRATION PROBLEMÁTICA

### Método 1: Rodar uma por vez

```bash
# No Supabase SQL Editor:
# 1. Rode complete_schema ✅
# 2. Rode ai_features - DEU ERRO? ❌
#    → O problema está no ai_features
# 3. Se não deu erro, rode human_vault
# 4. Continue até encontrar qual migration quebra
```

### Método 2: Ver qual policy está falhando

O erro deve mostrar algo como:

```
ERROR: column "user_id" does not exist
LINE 5:   USING (user_id = auth.uid())
                 ^
```

Procure por essa linha em todas as migrations.

---

## 📋 CHECKLIST DE VERIFICAÇÃO

Antes de rodar qualquer migration, verifique:

### ✅ Policies em `users`:
```sql
-- ❌ ERRADO (users não tem user_id)
USING (user_id = auth.uid())

-- ✅ CORRETO
USING (id = auth.uid())
```

### ✅ Policies em `clients`:
```sql
-- ✅ CORRETO (clients tem user_id)
USING (user_id = auth.uid())
```

### ✅ Policies em `deliveries`:
```sql
-- ❌ ERRADO (deliveries não tem user_id)
USING (user_id = auth.uid())

-- ✅ CORRETO (via clients)
USING (
  client_id IN (
    SELECT id FROM clients WHERE user_id = auth.uid()
  )
)

-- ✅ CORRETO (via driver)
USING (driver_id = auth.uid())
```

### ✅ Policies em outras tabelas:
```sql
-- Se a tabela não tem user_id diretamente,
-- use JOIN ou subquery via clients ou users
```

---

## 🛠️ CORREÇÕES COMUNS

### Problema: Policy em tabela errada

```sql
-- ❌ ERRADO
CREATE POLICY "some_policy" ON deliveries
  USING (user_id = auth.uid());  -- deliveries não tem user_id!

-- ✅ CORRETO
CREATE POLICY "some_policy" ON deliveries
  USING (driver_id = auth.uid());  -- usa driver_id
```

### Problema: Referência a coluna inexistente

```sql
-- ❌ ERRADO
CREATE POLICY "some_policy" ON fraud_checks
  USING (user_id = auth.uid());  -- fraud_checks não tem user_id!

-- ✅ CORRETO (via customer_id → clients → user_id)
CREATE POLICY "some_policy" ON fraud_checks
  USING (
    customer_id IN (
      SELECT id FROM clients WHERE user_id = auth.uid()
    )
  );
```

---

## 📊 ESTRUTURA DE COLUNAS

### Tabelas e suas colunas de relacionamento:

| Tabela | Coluna de User | Referencia |
|--------|----------------|------------|
| `users` | `id` | - |
| `clients` | `user_id` | → `users.id` |
| `deliveries` | `driver_id` | → `users.id` |
| `deliveries` | `client_id` | → `clients.id` |
| `invoices` | `client_id` | → `clients.id` |
| `security_logs` | `user_id` | → `users.id` |
| `fraud_checks` | `customer_id` | → `clients.id` |
| `ai_chat_logs` | `user_id` | → `users.id` |
| `feedback` | `customer_id` | → `clients.id` |

---

## 🎯 AÇÃO RECOMENDADA AGORA

1. **Limpe o banco** (PASSO 1)
2. **Rode complete_schema** (PASSO 2)
3. **Teste** (PASSO 3)
4. **Me avise o resultado**

Se der erro no PASSO 2, me mande a mensagem de erro COMPLETA com o número da linha.

Se funcionar no PASSO 2, rode PASSO 4 e me avise qual migration dá erro.

---

## 📞 PRECISA DE AJUDA?

Me avise:
- ✅ "Rodei complete_schema e funcionou"
- ❌ "Rodei complete_schema e deu erro na linha X"
- ❌ "Rodei ai_features e deu erro na linha Y"

Com essa informação, posso corrigir exatamente o que está errado.

---

**Última Atualização**: 2026-01-27 12:15
