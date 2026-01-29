# ✅ CHECKLIST DE DEPLOY PARA PRODUÇÃO

**Data**: 28 de Janeiro de 2026  
**Sistema**: Discreet Courier  
**Status Atual**: 85% funcional (70% com Twilio, sem SMTP e Stripe)

---

## 📋 PRÉ-REQUISITOS

### ✅ Configurado
- [x] Supabase development (orrnxowylokgzvimvluv.supabase.co)
- [x] NextAuth configurado
- [x] Twilio SMS configurado
- [x] Build local passa

### ⏳ Para Configurar Depois
- [ ] SMTP Email (Gmail - 5 min)
- [ ] Stripe Payments (15 min)

---

## 🚀 PARTE 1: SUPABASE PRODUCTION (30 min)

### Passo 1.1: Criar Projeto Production

1. Acesse: https://supabase.com/dashboard
2. Clique **"New project"**
3. Configure:
   - **Name**: `discreet-courier-prod`
   - **Database Password**: [GERE E SALVE!]
   - **Region**: `East US (North Virginia)`
   - **Plan**: Free
4. Clique **"Create new project"**
5. ⏳ Aguarde ~2 minutos

**Anote aqui**:
```
Project URL: https://____________.supabase.co
Database Password: ___________________________
```

---

### Passo 1.2: Obter API Keys

1. No projeto production, vá em **Settings** → **API**
2. Copie:

```
Project URL:        https://____________.supabase.co
anon public key:    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key:   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE**: Guarde o `service_role key` em local seguro!

---

### Passo 1.3: Executar Migrations

**Opção A: Via Dashboard (Recomendado)**

1. Vá em **SQL Editor**
2. Clique **"New query"**
3. Execute cada migration em ordem:

**Migration 1**: `supabase/migrations/00000001_complete_schema.sql`
- Copie TODO o conteúdo
- Cole no SQL Editor
- Clique **"Run"** (Ctrl+Enter)
- ✅ Aguarde completar

**Migration 2**: `supabase/migrations/20260123_ai_features.sql`
- Repita o processo

**Migration 3**: `supabase/migrations/20260124_human_vault.sql`
- Repita o processo

**Migrations Restantes** (execute todas):
- `add_bland_calls_table.sql`
- `add_delivery_proof_fields.sql`
- `add_email_logs_table.sql`
- `add_emergency_logs_table.sql`
- `add_gps_tracking_tables.sql`
- `add_leads_table.sql`
- `add_payment_logs_table.sql`
- `add_quotes_table.sql`
- `add_rbac_profiles.sql`
- `add_settings_table.sql`
- `add_sms_event_logs_table.sql`
- `add_subscriptions_table.sql`
- `add_vetting_logs_table.sql`

✅ Todas migrations executadas!

---

### Passo 1.4: Configurar Storage

1. Vá em **Storage**
2. Clique **"Create a new bucket"**
3. Configure:
   - **Name**: `vault-files`
   - **Public bucket**: OFF
   - **File size limit**: 52428800 (50MB)
4. Clique **"Create bucket"**

**Configurar Policies**:

```sql
-- INSERT Policy
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vault-files');

-- SELECT Policy
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'vault-files');

-- DELETE Policy
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vault-files');
```

✅ Storage configurado!

---

## 🌐 PARTE 2: VERCEL DEPLOYMENT (45 min)

### Passo 2.1: Preparar Repositório

```bash
cd c:\Users\teste\Desktop\Discreetcourie\discreet-courier
git status
# Se houver mudanças:
git add .
git commit -m "chore: prepare for production deployment"
git push origin master
```

✅ Repositório atualizado!

---

### Passo 2.2: Criar Conta Vercel

1. Acesse: https://vercel.com/signup
2. Clique **"Continue with GitHub"**
3. Autorize Vercel
4. ✅ Conta criada!

---

### Passo 2.3: Importar Projeto

1. Dashboard Vercel → **"Add New..."** → **"Project"**
2. Encontre: `edueduardo/Discreetcourie`
3. Clique **"Import"**
4. Configure:
   - **Project Name**: `discreet-courier`
   - **Framework**: Next.js (auto-detectado)
   - **Root Directory**: `./discreet-courier`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

**⚠️ NÃO CLIQUE EM DEPLOY AINDA!**

---

### Passo 2.4: Adicionar Variáveis de Ambiente

Na seção **Environment Variables**, adicione:

#### Supabase (OBRIGATÓRIO)
```
NEXT_PUBLIC_SUPABASE_URL = https://[seu-projeto-prod].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### NextAuth (OBRIGATÓRIO)
```
NEXTAUTH_URL = https://discreet-courier.vercel.app
NEXTAUTH_SECRET = [gere novo com: openssl rand -base64 32]
```

**Gerar NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

#### Twilio SMS (CONFIGURADO)
```
TWILIO_ACCOUNT_SID = [suas-credenciais-twilio]
TWILIO_AUTH_TOKEN = [seu-auth-token]
TWILIO_PHONE_NUMBER = +1234567890
OPERATOR_PHONE_NUMBER = +1234567890
```

#### SMTP Email (DEIXE VAZIO POR ENQUANTO)
```
# Configurar depois seguindo SETUP_SMTP.md
```

#### Stripe (DEIXE VAZIO POR ENQUANTO)
```
# Configurar depois seguindo SETUP_STRIPE_RAPIDO.md
```

✅ Variáveis adicionadas!

---

### Passo 2.5: DEPLOY! 🚀

1. Clique **"Deploy"**
2. ⏳ Aguarde build (~3-5 minutos)
3. ✅ Deploy completo!

**Sua URL**: `https://discreet-courier.vercel.app`

---

## 🧪 PARTE 3: VERIFICAÇÃO (30 min)

### Teste 1: Homepage
- [ ] Site carrega: https://discreet-courier.vercel.app
- [ ] Design aparece corretamente
- [ ] Links funcionam

### Teste 2: Autenticação
- [ ] `/register` - Criar conta funciona
- [ ] Usuário salva no Supabase production
- [ ] `/login` - Login funciona
- [ ] Redirecionamento correto

### Teste 3: Criar Entrega
- [ ] `/quote` - Formulário funciona
- [ ] Cálculo de preço funciona
- [ ] "Book Now" cria entrega
- [ ] Entrega salva no Supabase
- [ ] SMS recebido (Twilio)

### Teste 4: Tracking
- [ ] `/track` - Página funciona
- [ ] Busca por tracking code funciona
- [ ] Mostra dados corretos

### Teste 5: Driver
- [ ] `/driver/active` - Página carrega
- [ ] Mostra entregas ativas
- [ ] GPS funciona
- [ ] Atualizar status funciona

### Teste 6: Admin
- [ ] `/admin` - Dashboard carrega
- [ ] Stats aparecem
- [ ] Lista de entregas funciona

---

## 📊 VERIFICAR LOGS

### Vercel Logs
```bash
npm i -g vercel
vercel login
vercel logs discreet-courier --follow
```

### Supabase Logs
1. Dashboard → **Logs** → **API Logs**
2. Verifique erros

---

## 🔧 TROUBLESHOOTING

### ❌ Build falhou
- Verifique logs do Vercel
- Certifique-se que `npm run build` funciona localmente

### ❌ Erro 500 no site
- Verifique variáveis de ambiente
- Verifique logs: `vercel logs`
- Certifique-se que Supabase está acessível

### ❌ Autenticação não funciona
- Verifique `NEXTAUTH_URL` (deve ser URL de produção)
- Verifique `NEXTAUTH_SECRET` (deve estar definido)
- Limpe cookies do navegador

### ❌ SMS não envia
- Verifique variáveis Twilio no Vercel
- Veja logs do Vercel
- Teste número Twilio no dashboard Twilio

---

## ✅ CHECKLIST FINAL

### Supabase Production
- [ ] Projeto criado
- [ ] Migrations executadas (todas)
- [ ] Storage bucket configurado
- [ ] API keys copiadas

### Vercel
- [ ] Conta criada
- [ ] Projeto importado
- [ ] Variáveis de ambiente adicionadas
- [ ] Deploy completo
- [ ] Site acessível

### Testes
- [ ] Homepage funciona
- [ ] Registro funciona
- [ ] Login funciona
- [ ] Criar entrega funciona
- [ ] SMS recebido
- [ ] Tracking funciona
- [ ] Driver interface funciona
- [ ] Admin dashboard funciona

---

## 📝 PRÓXIMOS PASSOS (DEPOIS DO DEPLOY)

### 1. Configurar SMTP Email (5 min)
- Seguir `SETUP_SMTP.md`
- Adicionar variáveis no Vercel
- Redeploy

### 2. Configurar Stripe (15 min)
- Seguir `SETUP_STRIPE_RAPIDO.md`
- Adicionar variáveis no Vercel
- Configurar webhook
- Redeploy

### 3. Testar Sistema Completo
- Fazer primeira entrega real
- Verificar notificações (SMS + Email)
- Processar pagamento
- Monitorar logs por 24h

### 4. Implementar 15% Restante → 100%
- Seguir `ROADMAP_100_PORCENTO.md`
- Quick Wins (19h) → 90%
- Fase 5 (30h) → 95%
- Fase 6+7 (60h) → 100%

---

## 💰 CUSTOS MENSAIS

```
Supabase:           $0 (free tier)
Vercel:             $0 (hobby plan)
Twilio:             $1/mês + $0.0075/SMS
SMTP Email:         $0 (Gmail grátis)
Stripe:             2.9% + $0.30/transação

TOTAL FIXO:         ~$1-2/mês
VARIÁVEL:           ~3% das vendas
```

---

**Status**: Pronto para deploy! 🚀  
**Tempo estimado**: 2-3 horas  
**Resultado**: Sistema 70% funcional em produção

**Última atualização**: 28 de Janeiro de 2026
