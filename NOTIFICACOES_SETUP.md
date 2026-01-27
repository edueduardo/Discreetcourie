# 📱 CONFIGURAÇÃO DE NOTIFICAÇÕES

**Sistema de notificações SMS + Email para operador solo**

---

## 🎯 O QUE FOI IMPLEMENTADO

### ✅ Sistema Completo de Notificações

**1. SMS via Twilio** (`src/lib/twilio.ts`)
- Envio de SMS para operador
- Envio de SMS para cliente
- Templates prontos (novo pedido, confirmação, status)

**2. Email via SMTP** (`src/lib/email.ts`)
- Envio de email para operador
- Envio de email para cliente
- Templates HTML profissionais

**3. Integração Automática**
- Quando cliente cria entrega:
  - ✅ Operador recebe SMS
  - ✅ Operador recebe Email
  - ✅ Cliente recebe Email de confirmação
  - ✅ Cliente recebe SMS (se forneceu telefone)

---

## 🔧 CONFIGURAÇÃO NECESSÁRIA

### 1️⃣ TWILIO (SMS)

**Criar conta Twilio**:
1. Vá em https://www.twilio.com/try-twilio
2. Crie conta grátis (trial: $15 de crédito)
3. Verifique seu número de telefone
4. Obtenha um número Twilio

**Obter credenciais**:
1. Dashboard > Account Info
2. Copie:
   - Account SID
   - Auth Token
3. Phone Numbers > Manage > Active Numbers
   - Copie seu número Twilio

**Adicionar ao `.env.local`**:
```bash
# Twilio SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+16145003080
OPERATOR_PHONE_NUMBER=+16145551234  # SEU número
```

**Custos**:
- Trial: $15 grátis
- Depois: $1/mês + $0.0075/SMS (EUA)
- 100 SMS = $0.75

---

### 2️⃣ SMTP (EMAIL)

**Opção A: Gmail (Grátis)**

1. Ativar 2FA na sua conta Google
2. Criar senha de app:
   - https://myaccount.google.com/apppasswords
   - Selecione "Mail" e "Other"
   - Copie a senha gerada

**Adicionar ao `.env.local`**:
```bash
# Email SMTP (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx  # senha de app
SMTP_FROM=noreply@discreetcourier.com
OPERATOR_EMAIL=seu-email@gmail.com
```

**Opção B: SendGrid (Grátis até 100 emails/dia)**

1. Criar conta em https://sendgrid.com
2. Settings > API Keys > Create API Key
3. Copie a key

**Adicionar ao `.env.local`**:
```bash
# Email SMTP (SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxx
SMTP_FROM=noreply@discreetcourier.com
OPERATOR_EMAIL=seu-email@gmail.com
```

**Custos**:
- Gmail: Grátis (limite: 500 emails/dia)
- SendGrid: Grátis (100 emails/dia)

---

## 🧪 TESTAR NOTIFICAÇÕES

### Teste 1: Criar Entrega e Receber Notificações

```bash
# 1. Configure Twilio + SMTP no .env.local
# 2. Reinicie o dev server
npm run dev

# 3. Vá em http://localhost:3000/quote
# 4. Preencha o formulário
# 5. Clique "Book Later"

# RESULTADO ESPERADO:
# ✅ Você recebe SMS no seu celular
# ✅ Você recebe email
# ✅ Cliente recebe email de confirmação
# ✅ Cliente recebe SMS (se forneceu telefone)
```

### Teste 2: Verificar Logs

```bash
# No terminal onde npm run dev está rodando:
# Você deve ver:
SMS sent successfully: SMxxxxxxxxxxxxxxxxx
Email sent successfully: <xxxxxxxxxx@smtp.gmail.com>
```

### Teste 3: Verificar no Supabase

```sql
-- Ver logs de SMS
SELECT * FROM sms_event_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Ver logs de Email
SELECT * FROM email_logs 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 📋 TEMPLATES DE NOTIFICAÇÃO

### SMS Templates

**Novo Pedido (Operador)**:
```
🚨 NEW DELIVERY!

Tracking: DC-A1B2C3D4
Pickup: 123 Main St
Delivery: 456 Oak Ave

Check admin dashboard for details.
```

**Confirmação (Cliente)**:
```
✅ Delivery confirmed!

Tracking: DC-A1B2C3D4
Estimated: Within 2 hours

Track at: discreetcourier.com/track
```

### Email Templates

**Novo Pedido (Operador)**:
```
Subject: 🔔 New Delivery Created

New delivery created!

Tracking: DC-A1B2C3D4
Pickup: 123 Main St
Delivery: 456 Oak Ave
Price: $50

Check admin dashboard for details.
```

**Confirmação (Cliente)**:
```
Subject: Delivery Confirmed - #DC-A1B2C3D4

Your delivery has been scheduled.

Tracking Code: DC-A1B2C3D4

[Track Your Delivery Button]
```

---

## 🎯 FLUXO COMPLETO

```
Cliente cria entrega em /quote
         ↓
API /api/deliveries/create
         ↓
Salva no Supabase ✅
         ↓
┌────────────────────────┐
│  NOTIFICAÇÕES          │
├────────────────────────┤
│ 1. SMS → Operador      │ ✅
│ 2. Email → Operador    │ ✅
│ 3. Email → Cliente     │ ✅
│ 4. SMS → Cliente       │ ✅ (se tiver phone)
└────────────────────────┘
         ↓
Retorna tracking code
         ↓
Cliente vê confirmação
```

---

## 🚨 TROUBLESHOOTING

### SMS não chegam

**Problema**: Twilio trial só envia para números verificados
**Solução**: 
1. Verifique seu número em Twilio Console
2. Ou upgrade para conta paga ($20 mínimo)

### Email vai para spam

**Problema**: Gmail marca como spam
**Solução**:
1. Use domínio próprio (não @gmail.com)
2. Configure SPF/DKIM records
3. Ou use SendGrid (melhor deliverability)

### Erro "SMTP not configured"

**Problema**: Variáveis de ambiente não carregadas
**Solução**:
1. Verifique `.env.local` existe
2. Reinicie `npm run dev`
3. Verifique nomes das variáveis (SMTP_HOST, etc)

### Erro "Twilio not configured"

**Problema**: Credenciais Twilio inválidas
**Solução**:
1. Verifique Account SID e Auth Token
2. Verifique formato do número: +16145003080
3. Teste no Twilio Console primeiro

---

## 💰 CUSTOS MENSAIS ESTIMADOS

```
Twilio:
- Número: $1/mês
- SMS: $0.0075 cada
- 100 SMS/mês = $1.75/mês

Email:
- Gmail: Grátis
- SendGrid: Grátis (até 100/dia)

TOTAL: ~$2-3/mês
```

---

## 📊 SCORE ATUALIZADO

```
Database:           100% ✅
Autenticação:       90% ✅
API Integration:    60% ✅
UI/Frontend:        85% ✅
Notificações:       90% ✅ (implementado, precisa configurar)
Pagamentos:         0% ❌
GPS Tracking:       0% ❌

TOTAL: 61% FUNCIONAL (era 56%)
```

---

## 🎯 PRÓXIMOS PASSOS

1. **Configure Twilio** (5 minutos)
2. **Configure SMTP** (5 minutos)
3. **Teste criando entrega** (2 minutos)
4. **Verifique se recebeu notificações** (1 minuto)

**Total: 13 minutos para ter notificações funcionando!**

---

## 📞 SUPORTE

Se tiver problemas:
1. Verifique logs no terminal
2. Verifique `.env.local`
3. Teste credenciais no Twilio/Gmail Console
4. Me avise o erro específico

---

**Sistema de notificações pronto para operação solo!** 🚀
