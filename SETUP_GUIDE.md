# 🚀 GUIA DE SETUP RÁPIDO - DiscreetCourie

**Tempo estimado**: 15-20 minutos

---

## ✅ PRÉ-REQUISITOS

- [x] Node.js 18+ instalado
- [x] Conta no Supabase (https://supabase.com)
- [ ] Conta no Stripe (opcional - para pagamentos)
- [ ] Conta no OpenAI (opcional - para AI features)
- [ ] Conta no Twilio (opcional - para SMS)

---

## 📋 PASSO 1: CONFIGURAR SUPABASE (10 min)

### 1.1 Criar Projeto
1. Acesse: https://app.supabase.com
2. Clique em "New Project"
3. Nome: `discreetcourie`
4. Database Password: (anote em local seguro)
5. Region: `East US (North Virginia)` (mais próximo de Columbus, OH)
6. Aguarde ~2 minutos para provisionar

### 1.2 Obter Chaves de API
1. No projeto, vá em: **Settings → API**
2. Copie:
   - `Project URL` (ex: https://abc123.supabase.co)
   - `anon public` key (começa com eyJhbGc...)
   - `service_role` key (começa com eyJhbGc...)

### 1.3 Rodar Migrations
1. No projeto, vá em: **SQL Editor**
2. Clique em "New Query"
3. Abra cada arquivo de migration na pasta `supabase/migrations/`
4. Cole o conteúdo e execute na seguinte ordem:

**ORDEM DE EXECUÇÃO** (IMPORTANTE - Siga esta ordem exata):
```
⚠️ CRÍTICO: Rode PRIMEIRO (cria tabelas base):
1. 00000000_base_schema.sql  ← COMECE POR AQUI!

Depois rode na ordem:
2. 20260124_nextauth_users.sql
3. 20260123_ai_features.sql
4. 20260124_human_vault.sql
5. add_subscriptions_table.sql
6. add_ghost_communication_tables.sql
7. add_gps_tracking_tables.sql
8. add_delivery_proof_fields.sql
9. add_analytics_push_tables.sql
10. add_rbac_profiles.sql
11. add_leads_table.sql
12. add_quotes_table.sql
13. add_settings_table.sql
14. add_sms_event_logs_table.sql
15. add_email_logs_table.sql
16. add_payment_logs_table.sql
17. add_bland_calls_table.sql
18. add_emergency_logs_table.sql
19. add_vetting_logs_table.sql
20. add_new_tables_2025.sql
21. fix_auto_delete_columns.sql
```

**Dicas**: 
- Se houver erro "table already exists", ignore e continue
- Se houver erro "column does not exist", você pulou o base_schema
- Se houver erro "relation does not exist", verifique a ordem

### 1.4 Criar Storage Bucket
1. Vá em: **Storage**
2. Clique em "Create Bucket"
3. Nome: `vault-files`
4. Public: **❌ NÃO** (deve ser privado)
5. File size limit: `100 MB`
6. Clique em "Create Bucket"

### 1.5 Criar Usuário Admin (Opcional)
1. Vá em: **Authentication → Users**
2. Clique em "Add User"
3. Email: seu-email@example.com
4. Password: (senha segura)
5. Após criar, vá em **SQL Editor** e execute:
```sql
UPDATE users 
SET role = 'admin' 
WHERE email = 'seu-email@example.com';
```

---

## 📋 PASSO 2: CONFIGURAR VARIÁVEIS DE AMBIENTE (3 min)

### 2.1 Criar arquivo .env.local
```bash
# Na raiz do projeto
cp .env.local.example .env.local
```

### 2.2 Preencher variáveis OBRIGATÓRIAS
Abra `.env.local` e preencha:

```env
# SUPABASE (OBRIGATÓRIO)
NEXT_PUBLIC_SUPABASE_URL=https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...

# NEXTAUTH (OBRIGATÓRIO)
NEXTAUTH_SECRET=gere-com-comando-abaixo
NEXTAUTH_URL=http://localhost:3000
```

**Gerar NEXTAUTH_SECRET**:
```bash
# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))

# Mac/Linux
openssl rand -base64 32
```

### 2.3 Preencher variáveis OPCIONAIS (se tiver)

**Stripe** (para pagamentos):
```env
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

**OpenAI** (para AI features):
```env
OPENAI_API_KEY=sk-...
```

**Twilio** (para SMS):
```env
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+1...
```

---

## 📋 PASSO 3: INSTALAR E RODAR (2 min)

### 3.1 Instalar dependências
```bash
npm install
```

### 3.2 Iniciar dev server
```bash
npm run dev
```

### 3.3 Abrir no browser
```
http://localhost:3000
```

---

## 📋 PASSO 4: TESTAR (5 min)

### 4.1 Teste Manual (Recomendado)
1. Abra: http://localhost:3000
2. Clique em "Login"
3. Faça login com o usuário criado
4. Navegue pelas páginas:
   - ✅ Admin Dashboard: http://localhost:3000/admin
   - ✅ Portal Dashboard: http://localhost:3000/portal
   - ✅ Driver Dashboard: http://localhost:3000/driver
   - ✅ Human Vault: http://localhost:3000/portal/vault
   - ✅ Zero-Trace: http://localhost:3000/zero-trace

### 4.2 Teste Automatizado (Opcional)
```bash
# Em outro terminal (com dev server rodando)
node test-apis.js
```

---

## 🎯 VERIFICAÇÃO FINAL

### Checklist de Funcionalidades:

#### ✅ Básico
- [ ] Landing page carrega
- [ ] Login funciona
- [ ] Admin dashboard carrega
- [ ] Portal dashboard carrega
- [ ] Driver dashboard carrega

#### ✅ Features Premium
- [ ] Human Vault - Upload de arquivo
- [ ] NDA Enforcement - Assinar NDA
- [ ] Zero-Trace - Criar delivery
- [ ] AI Chatbot - Enviar mensagem
- [ ] Smart Pricing - Ver cálculo no checkout

#### ✅ Navegação
- [ ] Todos os links do sidebar funcionam
- [ ] Footer links funcionam
- [ ] Quick actions no portal funcionam

---

## 🐛 TROUBLESHOOTING

### Erro: "Supabase client error"
**Solução**: Verifique se as chaves do Supabase estão corretas no `.env.local`

### Erro: "NextAuth configuration error"
**Solução**: Gere um novo `NEXTAUTH_SECRET` e reinicie o server

### Erro: "Table does not exist"
**Solução**: Rode as migrations no Supabase SQL Editor

### Erro: "Storage bucket not found"
**Solução**: Crie o bucket "vault-files" no Supabase Storage

### Build falha
**Solução**: 
```bash
rm -rf .next
npm run build
```

### Port 3000 já em uso
**Solução**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

---

## 📚 PRÓXIMOS PASSOS

### Desenvolvimento
1. [ ] Testar todas as features manualmente
2. [ ] Configurar Stripe webhook (se usar pagamentos)
3. [ ] Testar SMS (se usar Twilio)
4. [ ] Testar AI features (se usar OpenAI)

### Produção
1. [ ] Criar projeto no Vercel/Netlify
2. [ ] Configurar variáveis de ambiente de produção
3. [ ] Usar chaves de PRODUCTION (não TEST)
4. [ ] Configurar domínio customizado
5. [ ] Testar em produção

---

## 🆘 PRECISA DE AJUDA?

### Recursos:
- **Documentação Supabase**: https://supabase.com/docs
- **Documentação Next.js**: https://nextjs.org/docs
- **Documentação Stripe**: https://stripe.com/docs

### Arquivos Importantes:
- `VERIFICATION_CHECKLIST.md` - Checklist detalhado
- `STATUS_FINAL_JAN27.md` - Status completo do projeto
- `TODO_IMPLEMENTATION.md` - Roadmap de features
- `.env.local.example` - Template de variáveis

---

## ✅ CONCLUSÃO

Se você completou todos os passos acima, seu DiscreetCourie está pronto para uso em desenvolvimento! 🎉

**Próxima ação**: Testar manualmente todas as features principais.

---

**Última Atualização**: 2026-01-27 10:20
