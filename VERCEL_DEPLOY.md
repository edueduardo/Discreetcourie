# Deploy no Vercel - Discreet Courier Columbus

## Passo a Passo Completo

---

## 1. PRE-REQUISITOS

### Contas Necessarias:
- [x] Vercel: https://vercel.com (gratis)
- [x] Supabase: https://supabase.com (gratis ate 500MB)
- [ ] GitHub: Repositorio deve estar no GitHub

### Opcionais (para funcionalidades completas):
- [ ] Stripe: https://stripe.com (pagamentos)
- [ ] Twilio: https://twilio.com (SMS)
- [ ] Resend: https://resend.com (emails)

---

## 2. PREPARAR SUPABASE PRODUCAO

### 2.1 Criar Projeto no Supabase
1. Acesse https://supabase.com/dashboard
2. Clique "New Project"
3. Selecione regiao: **US East (Ohio)** - mais proximo de Columbus
4. Anote as credenciais:
   - Project URL: `https://xxxxx.supabase.co`
   - Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Service Role Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### 2.2 Executar Migrations
No Supabase Dashboard > SQL Editor, execute na ordem:

```sql
-- 1. Execute o schema principal
-- Cole o conteudo de: supabase/schema.sql

-- 2. Execute as migrations na ordem:
-- supabase/migrations/20260124_nextauth_users.sql
-- supabase/migrations/20260124_rbac_permissions.sql
-- supabase/migrations/20260126_vault_storage_bucket.sql
```

### 2.3 Criar Admin Usuario
```sql
INSERT INTO users (email, name, role, password_hash)
VALUES (
  'seu-email@gmail.com',
  'Seu Nome',
  'admin',
  '$2b$10$xxxxx' -- Use bcrypt para gerar hash
);
```

---

## 3. DEPLOY NO VERCEL

### 3.1 Conectar Repositorio
1. Acesse https://vercel.com/new
2. Import seu repositorio GitHub
3. Framework: **Next.js** (detectado automaticamente)
4. Root Directory: **/** (raiz)

### 3.2 Configurar Environment Variables
No Vercel, va em Settings > Environment Variables e adicione:

#### OBRIGATORIOS:
```
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key_aqui
NEXTAUTH_SECRET=gere-com-openssl-rand-base64-32
NEXTAUTH_URL=https://seu-dominio.vercel.app
ENCRYPTION_KEY=gere-string-32-caracteres
NEXT_PUBLIC_APP_URL=https://seu-dominio.vercel.app
NEXT_PUBLIC_APP_NAME=Discreet Courier Columbus
NEXT_PUBLIC_COMPANY_PHONE=(614) 500-3080
DRIVER_AUTH_SECRET=gere-string-secreta
```

#### OPCIONAIS (adicione conforme necessario):
```
# Stripe (pagamentos)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Twilio (SMS)
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+16145003080

# Resend (emails)
RESEND_API_KEY=re_...

# OpenAI (IA)
OPENAI_API_KEY=sk-...
```

### 3.3 Deploy
1. Clique **Deploy**
2. Aguarde build (2-5 minutos)
3. Acesse a URL gerada

---

## 4. POS-DEPLOY

### 4.1 Configurar Dominio Customizado
1. Vercel Dashboard > Settings > Domains
2. Adicione: `discreetcourier.com` (exemplo)
3. Configure DNS no seu registrador:
   - CNAME: `cname.vercel-dns.com`

### 4.2 Configurar Webhooks

#### Stripe Webhook:
1. Stripe Dashboard > Developers > Webhooks
2. Add endpoint: `https://seu-dominio.vercel.app/api/webhooks/stripe`
3. Eventos: `payment_intent.succeeded`, `checkout.session.completed`

### 4.3 Testar Sistema
1. Acesse `/login` - fazer login como admin
2. Acesse `/admin` - dashboard administrativo
3. Teste criar uma order
4. Teste enviar notificacao

---

## 5. VARIAVEIS DE AMBIENTE - COPIAR E COLAR

### Template para Vercel:

```env
# ===== OBRIGATORIOS =====
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
ENCRYPTION_KEY=
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_APP_NAME=Discreet Courier Columbus
NEXT_PUBLIC_COMPANY_PHONE=(614) 500-3080
DRIVER_AUTH_SECRET=

# ===== PAGAMENTOS (Stripe) =====
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# ===== NOTIFICACOES =====
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
RESEND_API_KEY=

# ===== IA =====
OPENAI_API_KEY=
```

---

## 6. GERAR CHAVES SECRETAS

### NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### ENCRYPTION_KEY (32 caracteres):
```bash
openssl rand -hex 16
```

### DRIVER_AUTH_SECRET:
```bash
openssl rand -base64 24
```

---

## 7. TROUBLESHOOTING

### Erro: "Module not found"
- Verifique se `npm install` rodou corretamente
- Limpe cache: Vercel > Settings > Functions > Redeploy

### Erro: "Unauthorized"
- Verifique NEXTAUTH_SECRET esta configurado
- Verifique NEXTAUTH_URL aponta para URL correta

### Erro: "Supabase connection failed"
- Verifique NEXT_PUBLIC_SUPABASE_URL
- Verifique SUPABASE_SERVICE_ROLE_KEY

### Build timeout:
- Aumente timeout em vercel.json (ja configurado para 60s)

---

## 8. CHECKLIST FINAL

- [ ] Supabase projeto criado
- [ ] Migrations executadas
- [ ] Admin usuario criado
- [ ] Repositorio no GitHub
- [ ] Vercel conectado ao repo
- [ ] Environment variables configuradas
- [ ] Deploy realizado com sucesso
- [ ] Login testado
- [ ] Admin dashboard acessivel
- [ ] Dominio customizado (opcional)
- [ ] Webhook Stripe configurado (se usar pagamentos)

---

## SUPORTE

Problemas? Verifique:
1. Vercel Logs: Dashboard > Deployments > Functions
2. Supabase Logs: Dashboard > Logs
3. Browser Console: F12 > Console

**Regiao otimizada**: Ohio (cle1) - mais proximo de Columbus
**Timeout APIs**: 30s padrao, 60s para vault/AI
