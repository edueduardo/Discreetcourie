# 🚀 COMO FAZER DEPLOY - PASSO A PASSO

## ❌ PROBLEMA: Push direto para master bloqueado (403)

**Motivo**: O branch `master` está protegido no GitHub (segurança)

**Solução**: Criar Pull Request via GitHub UI

---

## ✅ OPÇÃO 1: VIA GITHUB (MAIS FÁCIL)

### 1. Abra GitHub
```
https://github.com/edueduardo/Discreetcourie
```

### 2. Você verá banner amarelo:
```
claude/solo-operator-system-11P1o had recent pushes 5 minutes ago
[Compare & pull request]  ← CLIQUE AQUI
```

### 3. Criar Pull Request:
- **Title**: `feat: NextAuth + RBAC + Pivô Ultra-Premium`
- **Description**: (deixe como está ou adicione detalhes)
- Clique: **Create pull request**

### 4. Merge Pull Request:
- Clique: **Merge pull request**
- Clique: **Confirm merge**
- ✅ Deploy automático para Vercel vai começar!

---

## ✅ OPÇÃO 2: VIA GITHUB CLI (Se tiver gh instalado)

```bash
gh pr create \
  --title "feat: NextAuth + RBAC + Pivô Ultra-Premium" \
  --body "
- NextAuth authentication completa
- RBAC (admin, vip_client, client, courier)
- Código fake deletado
- Auditoria brutal completa
- Build passando ✅
- Migration executada no Supabase ✅
- Pronto para testar login
"

# Depois fazer merge:
gh pr merge --merge
```

---

## ✅ OPÇÃO 3: PROMOVER DEPLOYMENT DO VERCEL

Se você já tem deployment no Vercel da branch `claude/solo-operator-system-11P1o`:

1. Vá para: https://vercel.com/dashboard
2. Encontre o deployment da branch
3. Clique: **... (três pontos)** → **Promote to Production**

---

## 🎯 DEPOIS DO DEPLOY:

### 1. Configure ENV no Vercel (IMPORTANTE!)

Vá para: Vercel → Seu projeto → Settings → Environment Variables

**Adicione estas variáveis** (se ainda não tem):

```bash
# NextAuth (OBRIGATÓRIO)
NEXTAUTH_SECRET=abc123xyz789randomstring  # Qualquer string longa
NEXTAUTH_URL=https://seu-dominio.vercel.app

# Supabase (já deve ter)
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...  # Service role key

# OpenAI (já deve ter)
OPENAI_API_KEY=sk-...

# Mailchimp (já deve ter)
MAILCHIMP_API_KEY=...
MAILCHIMP_SERVER_PREFIX=us1
```

**Gere NEXTAUTH_SECRET:**
```bash
# No terminal:
openssl rand -base64 32
# Copie o resultado
```

### 2. Redeploy (se adicionou env vars)
- Vercel → Deployments → ... → Redeploy

### 3. Teste Login NextAuth
```
1. Vá para: https://seu-dominio.vercel.app/login
2. Email: admin@discreetcourie.com
3. Password: Admin123!
4. Clique: Sign In
5. Deve redirecionar para /admin ✅
```

---

## 📊 CHECKLIST PÓS-DEPLOY:

- [ ] PR criado no GitHub
- [ ] PR merged para master
- [ ] Vercel fez deploy automático
- [ ] ENV vars configuradas (NEXTAUTH_SECRET!)
- [ ] Testei login: admin@discreetcourie.com / Admin123!
- [ ] Login funcionou ✅
- [ ] RBAC testado (admin acessa /admin)

---

## ❓ SE LOGIN AINDA NÃO FUNCIONAR:

### Verifique:

1. **ENV vars no Vercel:**
   - NEXTAUTH_SECRET está configurado?
   - NEXTAUTH_URL está correto?
   - NEXT_PUBLIC_SUPABASE_URL está correto?
   - SUPABASE_SERVICE_ROLE_KEY está correto?

2. **Migration executada:**
   ```sql
   -- No Supabase SQL Editor:
   SELECT * FROM users WHERE email = 'admin@discreetcourie.com';
   ```
   - Deve retornar 1 usuário ✅

3. **Deploy completo:**
   - Vercel mostra "READY" (não "Building...")
   - Último deploy foi DEPOIS de adicionar ENV vars

4. **Console do Browser:**
   - Abra DevTools (F12)
   - Aba Console
   - Tente login
   - Copie QUALQUER erro e me mande

---

## 🔥 PROBLEMAS COMUNS:

### "Invalid credentials" (mesmo com senha correta)
**Causa**: ENV vars não configuradas ou deploy antigo
**Solução**: Adicione NEXTAUTH_SECRET e faça redeploy

### Página /login não muda
**Causa**: Ainda está na versão antiga (Supabase Auth)
**Solução**: Limpe cache do browser (Ctrl+Shift+R) ou abra aba anônima

### Erro 500 ao fazer login
**Causa**: Erro no servidor (falta env var ou migration)
**Solução**: Verifique logs no Vercel → Functions → Logs

### Login funciona mas vai para página branca
**Causa**: Página /admin pode não existir ou erro de render
**Solução**: Normal por enquanto, vamos criar depois

---

**Última atualização**: 24/01/2026
**Status**: Aguardando deploy via GitHub PR
