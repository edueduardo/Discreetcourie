# 🚀 DEPLOY PARA PRODUÇÃO - GUIA PASSO-A-PASSO

**Tempo estimado**: 2-3 horas  
**Pré-requisitos**: Twilio, SMTP e Stripe configurados

---

## PARTE 1: SUPABASE PRODUCTION (30 min)

### Passo 1: Criar Projeto Production (5 min)

1. Acesse: https://supabase.com/dashboard
2. Clique **"New project"**
3. Configure:
   - **Organization**: Sua organização (ou crie nova)
   - **Name**: `discreet-courier-prod`
   - **Database Password**: [gere senha forte e SALVE!]
   - **Region**: `East US (North Virginia)` (mais próximo de Columbus, OH)
   - **Pricing Plan**: Free (até 500MB)
4. Clique **"Create new project"**
5. ⏳ Aguarde ~2 minutos para provisionar
6. ✅ Projeto criado!

---

### Passo 2: Executar Migrations (15 min)

#### Opção A: Via Dashboard (Recomendado)

1. No projeto Supabase, vá em **SQL Editor**
2. Clique **"New query"**
3. Abra cada arquivo de migration e execute em ordem:

**Migration 1**: `supabase/migrations/00000001_complete_schema.sql`
```sql
-- Copie TODO o conteúdo do arquivo
-- Cole no SQL Editor
-- Clique "Run" (ou Ctrl+Enter)
-- ✅ Aguarde completar
```

**Migration 2**: `supabase/migrations/20260123_ai_features.sql`
```sql
-- Repita o processo
```

**Migration 3**: `supabase/migrations/20260124_human_vault.sql`
```sql
-- Repita o processo
```

**Migrations Restantes**: Execute todas as outras em ordem alfabética
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

4. ✅ Todas migrations executadas!

#### Opção B: Via CLI (Alternativa)

```bash
# 1. Instale Supabase CLI
npm install -g supabase

# 2. Login
npx supabase login

# 3. Link ao projeto
npx supabase link --project-ref [seu-project-ref]
# Project ref está na URL: https://supabase.com/dashboard/project/[project-ref]

# 4. Push migrations
npx supabase db push

# ✅ Migrations aplicadas!
```

---

### Passo 3: Configurar Storage (5 min)

1. No dashboard Supabase, vá em **Storage**
2. Clique **"Create a new bucket"**
3. Configure:
   - **Name**: `vault-files`
   - **Public bucket**: OFF (privado)
   - **File size limit**: 52428800 (50MB)
   - **Allowed MIME types**: `*` (todos)
4. Clique **"Create bucket"**
5. ✅ Bucket criado!

#### Configurar RLS Policies

1. Clique no bucket `vault-files`
2. Vá em **Policies**
3. Clique **"New policy"**
4. **INSERT Policy**:
   ```sql
   CREATE POLICY "Authenticated users can upload"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'vault-files');
   ```
5. **SELECT Policy**:
   ```sql
   CREATE POLICY "Users can view own files"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'vault-files');
   ```
6. **DELETE Policy**:
   ```sql
   CREATE POLICY "Users can delete own files"
   ON storage.objects FOR DELETE
   TO authenticated
   USING (bucket_id = 'vault-files');
   ```
7. ✅ Policies configuradas!

---

### Passo 4: Obter API Keys (5 min)

1. Vá em **Settings** → **API**
2. Copie as seguintes informações:

```
Project URL:        https://xxxxxxxxxx.supabase.co
anon public key:    eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
service_role key:   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. ⚠️ **IMPORTANTE**: Guarde o `service_role key` em local seguro!
4. ✅ Keys copiadas!

---

## PARTE 2: VERCEL DEPLOYMENT (45 min)

### Passo 1: Preparar Repositório (5 min)

1. Certifique-se que tudo está commitado:
```bash
cd c:\Users\teste\Desktop\Discreetcourie\discreet-courier
git status
# Se houver mudanças:
git add .
git commit -m "chore: prepare for production deployment"
git push origin master
```

2. ✅ Repositório atualizado!

---

### Passo 2: Criar Conta Vercel (5 min)

1. Acesse: https://vercel.com/signup
2. Clique **"Continue with GitHub"**
3. Autorize Vercel a acessar seus repositórios
4. ✅ Conta criada!

---

### Passo 3: Importar Projeto (10 min)

1. No dashboard Vercel, clique **"Add New..."** → **"Project"**
2. Encontre o repositório: `edueduardo/Discreetcourie`
3. Clique **"Import"**
4. Configure:
   - **Project Name**: `discreet-courier`
   - **Framework Preset**: Next.js (detectado automaticamente)
   - **Root Directory**: `./discreet-courier` (se necessário)
   - **Build Command**: `npm run build` (padrão)
   - **Output Directory**: `.next` (padrão)
5. **NÃO clique em Deploy ainda!** Primeiro vamos adicionar variáveis.
6. ✅ Projeto configurado!

---

### Passo 4: Adicionar Variáveis de Ambiente (20 min)

Na seção **Environment Variables**, adicione TODAS as seguintes variáveis:

#### Supabase (Obrigatório)
```
NEXT_PUBLIC_SUPABASE_URL = https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### NextAuth (Obrigatório)
```
NEXTAUTH_URL = https://discreet-courier.vercel.app
NEXTAUTH_SECRET = [gere com: openssl rand -base64 32]
```

**Gerar NEXTAUTH_SECRET**:
```bash
# No terminal:
openssl rand -base64 32
# Copie o resultado
```

#### Twilio SMS (Recomendado)
```
TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN = xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER = +16145551234
OPERATOR_PHONE_NUMBER = +16145551234
```

#### SMTP Email (Recomendado)
```
SMTP_HOST = smtp.gmail.com
SMTP_PORT = 587
SMTP_USER = seu-email@gmail.com
SMTP_PASSWORD = xxxx xxxx xxxx xxxx
OPERATOR_EMAIL = seu-email@gmail.com
```

#### Stripe (Recomendado)
```
STRIPE_SECRET_KEY = sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET = whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **IMPORTANTE**: 
- Use valores de **PRODUÇÃO** do Supabase
- Use valores de **TEST** do Stripe (por enquanto)
- Certifique-se que `NEXTAUTH_URL` aponta para seu domínio Vercel

5. ✅ Variáveis adicionadas!

---

### Passo 5: Deploy! (5 min)

1. Clique **"Deploy"**
2. ⏳ Aguarde build (~3-5 minutos)
3. Você verá logs em tempo real
4. ✅ Deploy completo!

**Sua URL**: `https://discreet-courier.vercel.app`

---

## PARTE 3: CONFIGURAR WEBHOOK STRIPE (15 min)

### Passo 1: Atualizar Webhook URL

1. Acesse: https://dashboard.stripe.com
2. Vá em **Developers** → **Webhooks**
3. Clique **"Add endpoint"**
4. Configure:
   - **Endpoint URL**: `https://discreet-courier.vercel.app/api/webhooks/stripe`
   - **Description**: Production webhook
   - **Events**: Selecione os mesmos de antes
5. Clique **"Add endpoint"**
6. Copie o novo **Signing secret**: `whsec_...`
7. ✅ Webhook criado!

---

### Passo 2: Atualizar Variável no Vercel

1. No dashboard Vercel, vá em **Settings** → **Environment Variables**
2. Encontre `STRIPE_WEBHOOK_SECRET`
3. Clique **"Edit"**
4. Cole o novo signing secret
5. Clique **"Save"**
6. ✅ Variável atualizada!

---

### Passo 3: Redeploy

1. Vá em **Deployments**
2. Clique nos 3 pontinhos do último deploy
3. Clique **"Redeploy"**
4. ✅ Redeployado com novo webhook secret!

---

## PARTE 4: VERIFICAÇÃO (30 min)

### Checklist de Testes

Abra: `https://discreet-courier.vercel.app`

#### 1. Homepage
- [ ] Site carrega sem erros
- [ ] Design aparece corretamente
- [ ] Links funcionam

#### 2. Autenticação
- [ ] `/register` - Criar conta funciona
- [ ] Usuário salva no Supabase
- [ ] `/login` - Login funciona
- [ ] Redirecionamento correto após login

#### 3. Criar Entrega
- [ ] `/quote` - Formulário funciona
- [ ] Cálculo de preço funciona
- [ ] "Book Now" cria entrega
- [ ] Entrega salva no Supabase
- [ ] SMS recebido (se configurou)
- [ ] Email recebido (se configurou)

#### 4. Pagamento
- [ ] `/checkout` - Página carrega
- [ ] Stripe Elements aparece
- [ ] Pagamento com cartão teste funciona
- [ ] Webhook processa evento
- [ ] Status atualiza no Supabase

#### 5. Tracking
- [ ] `/track` - Página funciona
- [ ] Busca por tracking code funciona
- [ ] Mostra dados corretos

#### 6. Driver
- [ ] `/driver/active` - Página carrega
- [ ] Mostra entregas ativas
- [ ] GPS funciona
- [ ] Atualizar status funciona

#### 7. Admin
- [ ] `/admin` - Dashboard carrega
- [ ] Stats aparecem (mesmo que zeros)
- [ ] Lista de entregas funciona

---

### Verificar Logs

#### Vercel Logs
```bash
# Instale CLI se ainda não tem:
npm i -g vercel

# Login:
vercel login

# Ver logs:
vercel logs discreet-courier --follow
```

#### Supabase Logs
1. Dashboard → **Logs** → **API Logs**
2. Verifique se há erros

#### Stripe Logs
1. Dashboard → **Developers** → **Events**
2. Verifique se webhooks estão chegando

---

## PARTE 5: DOMÍNIO CUSTOMIZADO (Opcional - 30 min)

### Passo 1: Comprar Domínio

Opções:
- **Namecheap**: https://www.namecheap.com (~$10/ano)
- **Google Domains**: https://domains.google (~$12/ano)
- **GoDaddy**: https://www.godaddy.com (~$15/ano)

Sugestões:
- `discreetcourier.com`
- `discreet-delivery.com`
- `columbus-courier.com`

---

### Passo 2: Adicionar no Vercel

1. No dashboard Vercel, vá em **Settings** → **Domains**
2. Clique **"Add"**
3. Digite seu domínio: `discreetcourier.com`
4. Clique **"Add"**
5. Vercel mostrará instruções de DNS

---

### Passo 3: Configurar DNS

No seu provedor de domínio (Namecheap, etc):

1. Vá em **DNS Settings**
2. Adicione registro **A**:
   ```
   Type: A
   Host: @
   Value: 76.76.21.21
   TTL: Automatic
   ```
3. Adicione registro **CNAME**:
   ```
   Type: CNAME
   Host: www
   Value: cname.vercel-dns.com
   TTL: Automatic
   ```
4. Salve mudanças
5. ⏳ Aguarde propagação (até 24h, geralmente 1-2h)

---

### Passo 4: Atualizar Variáveis

1. No Vercel, **Settings** → **Environment Variables**
2. Atualize `NEXTAUTH_URL`:
   ```
   NEXTAUTH_URL = https://discreetcourier.com
   ```
3. Redeploy

---

### Passo 5: Configurar SSL

Vercel configura SSL automaticamente:
- ✅ Certificado Let's Encrypt grátis
- ✅ Renovação automática
- ✅ HTTPS forçado

---

## TROUBLESHOOTING

### ❌ Build falhou
- Verifique logs do Vercel
- Certifique-se que `npm run build` funciona localmente
- Verifique se todas dependências estão no `package.json`

### ❌ Erro 500 no site
- Verifique variáveis de ambiente
- Verifique logs: `vercel logs`
- Certifique-se que Supabase está acessível

### ❌ Autenticação não funciona
- Verifique `NEXTAUTH_URL` (deve ser URL de produção)
- Verifique `NEXTAUTH_SECRET` (deve estar definido)
- Limpe cookies do navegador

### ❌ Webhook Stripe não funciona
- Verifique URL do webhook no Stripe
- Verifique `STRIPE_WEBHOOK_SECRET`
- Veja eventos no Stripe Dashboard → Developers → Events

### ❌ Notificações não enviam
- Verifique variáveis Twilio/SMTP
- Veja logs do Vercel
- Teste localmente primeiro

---

## CUSTOS MENSAIS

```
Vercel:             $0 (hobby plan, até 100GB bandwidth)
Supabase:           $0 (free tier, até 500MB)
Twilio:             $1 + $0.0075/SMS
Email:              $0 (Gmail grátis)
Stripe:             2.9% + $0.30/transação
Domínio:            ~$1/mês ($12/ano)

TOTAL FIXO:         ~$2-3/mês
VARIÁVEL:           ~3% das vendas
```

---

## PRÓXIMOS PASSOS

### Imediato:
- [ ] Testar todos os fluxos em produção
- [ ] Fazer primeira entrega real
- [ ] Monitorar logs por 24h

### Curto Prazo (1 semana):
- [ ] Migrar Stripe de TEST para LIVE mode
- [ ] Configurar monitoramento (UptimeRobot)
- [ ] Adicionar Google Analytics

### Médio Prazo (1 mês):
- [ ] Coletar feedback de clientes
- [ ] Otimizar performance
- [ ] Adicionar features faltantes (15%)

---

## ✅ CHECKLIST FINAL

- [ ] Supabase production criado
- [ ] Migrations executadas
- [ ] Storage bucket configurado
- [ ] Vercel projeto criado
- [ ] Todas variáveis adicionadas
- [ ] Deploy completo
- [ ] Webhook Stripe configurado
- [ ] Site acessível
- [ ] Registro funciona
- [ ] Login funciona
- [ ] Criar entrega funciona
- [ ] Pagamento funciona
- [ ] Tracking funciona
- [ ] Notificações funcionam
- [ ] Domínio configurado (opcional)
- [ ] SSL ativo

---

**Parabéns! Sistema em produção! 🎉**

**URL**: https://discreet-courier.vercel.app  
**Status**: ✅ Operacional  
**Pronto para**: Columbus, Ohio

---

**Última atualização**: 27 de Janeiro de 2026  
**Suporte**: Veja documentação completa em SISTEMA_COMPLETO.md
