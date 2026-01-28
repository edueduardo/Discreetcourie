# 🚀 DEPLOYMENT GUIDE - DISCREET COURIER

Guia completo para colocar o sistema em produção.

---

## 📋 PRÉ-REQUISITOS

- [ ] Conta GitHub (já tem)
- [ ] Conta Vercel (grátis)
- [ ] Conta Supabase (grátis)
- [ ] Domínio (opcional, Vercel fornece)
- [ ] Twilio account (opcional, $1/mês)
- [ ] Stripe account (opcional, sem mensalidade)
- [ ] Email SMTP (Gmail grátis)

---

## 1️⃣ SUPABASE PRODUCTION

### Criar Projeto Production

```bash
# 1. Acesse https://supabase.com
# 2. Clique "New Project"
# 3. Escolha:
#    - Name: discreet-courier-prod
#    - Database Password: [senha forte]
#    - Region: East US (mais próximo de Columbus, OH)
#    - Plan: Free (até 500MB)

# 4. Aguarde ~2 minutos para provisionar
```

### Configurar Database

```bash
# 1. No dashboard Supabase, vá em "SQL Editor"
# 2. Copie e cole o conteúdo de cada migration:
#    - supabase/migrations/00000001_complete_schema.sql
#    - supabase/migrations/20260123_ai_features.sql
#    - supabase/migrations/20260124_human_vault.sql
#    - E todas as outras migrations em ordem

# 3. Execute cada uma clicando "Run"

# OU use CLI:
npx supabase link --project-ref [seu-project-ref]
npx supabase db push
```

### Configurar Storage

```bash
# 1. No dashboard Supabase, vá em "Storage"
# 2. Clique "Create bucket"
# 3. Nome: vault-files
# 4. Public: OFF (privado)
# 5. File size limit: 50MB
# 6. Allowed MIME types: * (todos)

# 7. Configure RLS policies:
# - INSERT: authenticated users only
# - SELECT: authenticated users only
# - DELETE: authenticated users only
```

### Obter API Keys

```bash
# 1. Vá em "Settings" → "API"
# 2. Copie:
#    - Project URL (NEXT_PUBLIC_SUPABASE_URL)
#    - anon public key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
#    - service_role key (SUPABASE_SERVICE_ROLE_KEY)

# ⚠️ NUNCA compartilhe service_role key!
```

---

## 2️⃣ VERCEL DEPLOYMENT

### Deploy Inicial

```bash
# 1. Instale Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy (primeira vez)
cd discreet-courier
vercel

# Responda:
# - Set up and deploy? Yes
# - Which scope? [sua conta]
# - Link to existing project? No
# - Project name? discreet-courier
# - Directory? ./
# - Override settings? No

# 4. Deploy para produção
vercel --prod
```

### Configurar Variáveis de Ambiente

```bash
# Opção 1: Via CLI
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Cole o valor e pressione Enter

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add NEXTAUTH_URL production
vercel env add NEXTAUTH_SECRET production

# Opção 2: Via Dashboard
# 1. Acesse https://vercel.com/[seu-usuario]/discreet-courier
# 2. Settings → Environment Variables
# 3. Adicione todas as variáveis
```

### Variáveis Obrigatórias

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# NextAuth
NEXTAUTH_URL=https://seu-dominio.vercel.app
NEXTAUTH_SECRET=[gere com: openssl rand -base64 32]
```

### Variáveis Opcionais (Recomendadas)

```bash
# Twilio SMS
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+16145003080
OPERATOR_PHONE_NUMBER=+16145551234

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
OPERATOR_EMAIL=seu-email@gmail.com

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### Redeploy Após Adicionar Variáveis

```bash
vercel --prod
```

---

## 3️⃣ TWILIO SETUP (SMS)

### Criar Conta

```bash
# 1. Acesse https://www.twilio.com/try-twilio
# 2. Crie conta grátis
# 3. Verifique email e telefone
# 4. Recebe $15 de crédito grátis
```

### Comprar Número

```bash
# 1. No dashboard, vá em "Phone Numbers" → "Buy a number"
# 2. Escolha:
#    - Country: United States
#    - Capabilities: SMS
#    - Area code: 614 (Columbus, OH)
# 3. Compre número (~$1/mês)
```

### Obter Credentials

```bash
# 1. Vá em "Account" → "API keys & tokens"
# 2. Copie:
#    - Account SID (TWILIO_ACCOUNT_SID)
#    - Auth Token (TWILIO_AUTH_TOKEN)
# 3. Copie seu número comprado (TWILIO_PHONE_NUMBER)
```

### Testar

```bash
# Use o script de teste:
curl -X POST https://seu-dominio.vercel.app/api/test-sms \
  -H "Content-Type: application/json" \
  -d '{"to": "+16145551234", "message": "Test SMS"}'
```

---

## 4️⃣ SMTP EMAIL SETUP

### Gmail (Recomendado)

```bash
# 1. Acesse https://myaccount.google.com/security
# 2. Ative "2-Step Verification"
# 3. Vá em "App passwords"
# 4. Gere senha para "Mail"
# 5. Copie a senha de 16 caracteres

# Variáveis:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
OPERATOR_EMAIL=seu-email@gmail.com
```

### SendGrid (Alternativa)

```bash
# 1. Acesse https://sendgrid.com
# 2. Crie conta grátis (100 emails/dia)
# 3. Crie API key
# 4. Configure:

SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=[sua-api-key]
OPERATOR_EMAIL=seu-email@sendgrid.com
```

---

## 5️⃣ STRIPE SETUP (PAGAMENTOS)

### Criar Conta

```bash
# 1. Acesse https://dashboard.stripe.com/register
# 2. Preencha informações da empresa
# 3. Verifique email
# 4. Complete onboarding
```

### Obter API Keys

```bash
# 1. No dashboard, vá em "Developers" → "API keys"
# 2. Copie:
#    - Publishable key (NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
#    - Secret key (STRIPE_SECRET_KEY)

# ⚠️ Use TEST keys primeiro!
# Depois mude para LIVE keys quando estiver pronto
```

### Configurar Webhook

```bash
# 1. Vá em "Developers" → "Webhooks"
# 2. Clique "Add endpoint"
# 3. Endpoint URL: https://seu-dominio.vercel.app/api/webhooks/stripe
# 4. Selecione eventos:
#    - payment_intent.succeeded
#    - payment_intent.payment_failed
#    - charge.refunded
#    - customer.subscription.created
#    - customer.subscription.updated
#    - customer.subscription.deleted
# 5. Clique "Add endpoint"
# 6. Copie "Signing secret" (STRIPE_WEBHOOK_SECRET)
```

### Testar Pagamento

```bash
# Use cartão de teste:
# Número: 4242 4242 4242 4242
# Data: qualquer futura
# CVC: qualquer 3 dígitos
# ZIP: qualquer
```

---

## 6️⃣ DOMÍNIO CUSTOMIZADO (OPCIONAL)

### Comprar Domínio

```bash
# Opções:
# - Namecheap: ~$10/ano
# - Google Domains: ~$12/ano
# - GoDaddy: ~$15/ano

# Sugestões:
# - discreetcourier.com
# - discreet-delivery.com
# - columbus-courier.com
```

### Configurar no Vercel

```bash
# 1. No dashboard Vercel, vá em "Settings" → "Domains"
# 2. Clique "Add"
# 3. Digite seu domínio
# 4. Siga instruções para configurar DNS
# 5. Aguarde propagação (~24h)

# 6. Atualize variáveis:
NEXTAUTH_URL=https://seu-dominio.com
```

### Configurar SSL

```bash
# Vercel configura SSL automaticamente
# Certificado Let's Encrypt grátis
# Renovação automática
```

---

## 7️⃣ VERIFICAÇÃO PÓS-DEPLOY

### Checklist de Testes

```bash
✅ Site carrega: https://seu-dominio.vercel.app
✅ /register funciona
✅ /login funciona
✅ /quote calcula preço
✅ /quote cria entrega
✅ SMS recebido (se configurou)
✅ Email recebido (se configurou)
✅ /checkout processa pagamento
✅ Webhook Stripe funciona
✅ /track mostra entrega
✅ /driver/active funciona
✅ /admin mostra stats
✅ /reset-password envia email
```

### Verificar Logs

```bash
# Vercel logs
vercel logs --follow

# Supabase logs
# Dashboard → Logs → API Logs

# Stripe logs
# Dashboard → Developers → Events

# Twilio logs
# Console → Monitor → Logs → Messaging
```

---

## 8️⃣ MONITORAMENTO

### Uptime Monitoring

```bash
# Use UptimeRobot (grátis)
# 1. Acesse https://uptimerobot.com
# 2. Adicione monitor:
#    - Type: HTTP(s)
#    - URL: https://seu-dominio.vercel.app
#    - Interval: 5 minutes
# 3. Configure alertas por email
```

### Error Tracking

```bash
# Sentry (opcional)
# 1. Acesse https://sentry.io
# 2. Crie projeto Next.js
# 3. Instale:
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs

# 4. Configure DSN no .env
NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
```

### Analytics

```bash
# Vercel Analytics (grátis)
# 1. No dashboard Vercel, vá em "Analytics"
# 2. Clique "Enable"

# Google Analytics (opcional)
# 1. Crie propriedade GA4
# 2. Adicione tracking ID
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## 9️⃣ SEGURANÇA

### Checklist de Segurança

```bash
✅ HTTPS habilitado (Vercel automático)
✅ Environment variables não commitadas
✅ Service role key não exposta
✅ CORS configurado
✅ RLS policies ativas no Supabase
✅ Webhook signatures verificadas
✅ Senhas com hash bcrypt
✅ JWT sessions
✅ Rate limiting (Vercel automático)
```

### Backup Database

```bash
# Supabase backup automático (plano grátis)
# Backups diários por 7 dias

# Backup manual:
# 1. Dashboard → Database → Backups
# 2. Clique "Create backup"

# Ou via CLI:
npx supabase db dump -f backup.sql
```

---

## 🔟 MANUTENÇÃO

### Updates Regulares

```bash
# Atualizar dependências (mensal)
npm update
npm audit fix

# Redeploy
git add .
git commit -m "chore: update dependencies"
git push origin master
vercel --prod
```

### Monitorar Custos

```bash
# Supabase: Dashboard → Settings → Billing
# Vercel: Dashboard → Settings → Billing
# Twilio: Console → Billing
# Stripe: Dashboard → Billing
```

### Limpar Dados Antigos

```bash
# Criar cron job para limpar:
# - Entregas > 90 dias
# - Vault files expirados
# - Logs antigos

# Vercel Cron (adicionar em vercel.json):
{
  "crons": [{
    "path": "/api/cron/cleanup",
    "schedule": "0 0 * * *"
  }]
}
```

---

## 📊 CUSTOS ESTIMADOS

### Plano Grátis (Início)
```
Supabase:           $0 (até 500MB)
Vercel:             $0 (hobby plan)
Gmail SMTP:         $0
Twilio:             $1/mês (número)
Stripe:             $0 (sem mensalidade)
TOTAL:              ~$1/mês
```

### Plano Crescimento (100 entregas/mês)
```
Supabase:           $0 (ainda no free tier)
Vercel:             $0 (ainda no hobby)
Twilio:             $1 + $2 SMS = $3
Stripe:             3% de $5,000 = $150
TOTAL:              ~$153/mês
RECEITA:            $5,000
LUCRO:              $4,847 (97%)
```

### Plano Pro (1000 entregas/mês)
```
Supabase:           $25 (Pro plan)
Vercel:             $20 (Pro plan)
Twilio:             $1 + $15 SMS = $16
Stripe:             3% de $50,000 = $1,500
TOTAL:              ~$1,561/mês
RECEITA:            $50,000
LUCRO:              $48,439 (97%)
```

---

## ✅ CONCLUSÃO

Após seguir este guia, você terá:

- ✅ Sistema em produção na Vercel
- ✅ Database Supabase configurado
- ✅ Notificações SMS funcionando
- ✅ Emails automáticos
- ✅ Pagamentos Stripe ativos
- ✅ Domínio customizado (opcional)
- ✅ SSL/HTTPS habilitado
- ✅ Monitoramento ativo
- ✅ Backups automáticos

**Tempo estimado**: 2-3 horas  
**Custo inicial**: ~$1-2/mês  
**Escalabilidade**: Até 1000s de entregas/mês

---

**Última atualização**: 27 de Janeiro de 2026  
**Próxima revisão**: Após primeiro mês em produção

---

🚀 **Sistema pronto para operar em Columbus, Ohio!**
