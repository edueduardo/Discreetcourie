# 🧪 TESTE MANUAL - NextAuth + RBAC

**Data**: 24/01/2026
**Branch**: `claude/solo-operator-system-11P1o`
**Objetivo**: Verificar que autenticação funciona DE VERDADE

---

## ✅ PASSO 1: EXECUTAR MIGRATION NO SUPABASE

### 1.1. Abra Supabase Dashboard
- Vá para: https://supabase.com/dashboard
- Entre no seu projeto
- Vá para **SQL Editor** (menu lateral esquerdo)

### 1.2. Execute a Migration
- Clique em **New Query**
- Cole TODO o conteúdo de: `supabase/migrations/20260124_nextauth_users.sql`
- Clique em **RUN** (ou Ctrl+Enter)

### 1.3. Verifique se criou tabelas
Execute este SQL para verificar:
```sql
-- Verificar tabela users
SELECT * FROM users;

-- Verificar tabela security_logs
SELECT * FROM security_logs;
```

**Resultado esperado:**
- ✅ Tabela `users` existe com 1 admin: `admin@discreetcourie.com`
- ✅ Tabela `security_logs` existe (vazia)

---

## ✅ PASSO 2: CONFIGURAR ENV NO VERCEL (Se ainda não fez)

### 2.1. Adicione variável necessária
- Vá para Vercel Dashboard → Seu projeto → Settings → Environment Variables
- Adicione:
  - **NEXTAUTH_SECRET**: `[qualquer string longa e aleatória]`
  - **NEXTAUTH_URL**: `https://seu-dominio.vercel.app`

Exemplo de NEXTAUTH_SECRET (gere um novo):
```
openssl rand -base64 32
```

### 2.2. Redeploy
- Depois de adicionar env vars, faça redeploy:
- Vercel Dashboard → Deployments → ... → Redeploy

---

## ✅ PASSO 3: FAZER MERGE E DEPLOY

### 3.1. Criar Pull Request
```bash
# Você já está no branch claude/solo-operator-system-11P1o
# Vá para GitHub e crie PR para master
```

Ou via GitHub CLI:
```bash
gh pr create --title "feat: NextAuth + RBAC + Pivô Ultra-Premium" --body "
- NextAuth authentication implementado
- RBAC completo (admin, vip_client, client, courier)
- Código fake deletado
- Auditoria brutal completa
- Build passando ✅
"
```

### 3.2. Fazer Merge
- No GitHub, aprove e faça merge do PR
- Vercel vai fazer deploy automático para production

### 3.3. OU Deploy Direto (sem PR)
```bash
# Push para master direto (se você for admin)
git checkout master
git merge claude/solo-operator-system-11P1o
git push origin master
```

---

## ✅ PASSO 4: TESTE MANUAL DE LOGIN

### 4.1. Abra o site em produção
```
https://seu-dominio.vercel.app/login
```

### 4.2. Tente fazer login com admin
**Credenciais:**
- Email: `admin@discreetcourie.com`
- Password: `Admin123!`

### 4.3. Verificações
- [ ] Página /login carrega sem erro
- [ ] Formulário aparece corretamente
- [ ] Ao clicar "Sign In", não dá erro 500
- [ ] Se credenciais corretas → redireciona para /admin
- [ ] Se credenciais erradas → mostra erro "Invalid credentials"

---

## ✅ PASSO 5: TESTAR RBAC (Proteção de Rotas)

### 5.1. Logout
- Se estiver logado, faça logout

### 5.2. Tente acessar rotas protegidas SEM login
```
https://seu-dominio.vercel.app/admin
https://seu-dominio.vercel.app/vault
https://seu-dominio.vercel.app/portal
```

**Resultado esperado:**
- ❌ Deve ser BLOQUEADO ou redirecionado para /login

### 5.3. Login como admin e tente acessar
```
https://seu-dominio.vercel.app/admin
```

**Resultado esperado:**
- ✅ Deve PERMITIR acesso (admin tem permissão)

---

## ✅ PASSO 6: TESTAR CRIAÇÃO DE USUÁRIO

### 6.1. Na página /login
- Preencha:
  - Email: `seu-email@teste.com`
  - Password: `TestUser123!`
- Clique em **Create Account**

### 6.2. Verificações
- [ ] Mensagem de sucesso aparece
- [ ] Usuário criado no Supabase (verifique na tabela `users`)
- [ ] Password está HASHEADO (não em plain text)
- [ ] Role padrão = `client`

### 6.3. Faça login com novo usuário
- Email: `seu-email@teste.com`
- Password: `TestUser123!`

**Resultado esperado:**
- ✅ Login funciona
- ✅ Redireciona para /portal (não /admin, porque role=client)

---

## ✅ PASSO 7: VERIFICAR LOGS DE SEGURANÇA (Futuro)

Quando implementarmos logging completo, verificar:
```sql
SELECT * FROM security_logs
ORDER BY timestamp DESC
LIMIT 10;
```

**Deve mostrar:**
- Tentativas de login (sucesso/falha)
- Acessos a rotas protegidas
- IPs e user agents

---

## 🎯 CHECKLIST FINAL

### Funcionalidades DEVEM estar funcionando:
- [ ] ✅ Página /login carrega
- [ ] ✅ Login com admin@discreetcourie.com / Admin123! funciona
- [ ] ✅ Login com credenciais erradas mostra erro
- [ ] ✅ Rotas protegidas bloqueiam acesso sem login
- [ ] ✅ Admin consegue acessar /admin
- [ ] ✅ Criar nova conta funciona
- [ ] ✅ Password é hasheado no banco (não plain text)
- [ ] ✅ RBAC: client NÃO consegue acessar /admin
- [ ] ✅ Session persiste (refresh da página mantém login)
- [ ] ✅ Logout funciona

### Se ALGUM item falhar:
1. ❌ Copie o erro EXATO (console browser + network tab)
2. ❌ Tire screenshot se necessário
3. ❌ Me mande para eu corrigir

---

## 🔥 PROBLEMAS COMUNS E SOLUÇÕES

### Erro: "NEXTAUTH_SECRET missing"
**Solução**: Adicione NEXTAUTH_SECRET nas env vars do Vercel

### Erro: "Supabase credentials not configured"
**Solução**: Verifique se NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão no Vercel

### Erro: "Invalid credentials" mesmo com senha correta
**Solução**:
1. Verifique se migration foi executada
2. Verifique se admin existe: `SELECT * FROM users WHERE email = 'admin@discreetcourie.com'`
3. Se não existir, execute INSERT manual do migration

### Login funciona mas redireciona para página em branco
**Solução**: Página /admin ou /portal pode não existir ainda (normal, vamos criar depois)

---

## 📊 RESULTADO ESPERADO

### ✅ SUCESSO =
- Login funciona
- RBAC funciona
- Passwords hasheados
- Session persiste
- Build + deploy funcionando

### ❌ FALHA =
- Erro 500 ao fazer login
- Credenciais corretas rejeitadas
- Rotas desprotegidas (qualquer um acessa /admin)
- Password em plain text no banco

---

**Última atualização**: 24/01/2026
**Status**: Pronto para teste
**Responsável**: Eduardo (usuário)
