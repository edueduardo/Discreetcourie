# 💳 SETUP STRIPE PAGAMENTOS - GUIA RÁPIDO (15 MINUTOS)

## Passo 1: Criar Conta Stripe (3 min)

1. Acesse: https://dashboard.stripe.com/register
2. Preencha:
   - Email: seu-email@gmail.com
   - Nome completo: [seu nome]
   - País: United States
   - Password: [senha forte]
3. Clique **"Create account"**
4. Verifique seu email (clique no link)
5. ✅ Conta criada!

---

## Passo 2: Ativar Conta (5 min)

1. No dashboard Stripe, clique **"Activate your account"**
2. Preencha informações do negócio:
   - **Business type**: Individual / Sole proprietorship
   - **Industry**: Transportation & Logistics
   - **Business description**: "Discreet courier delivery service in Columbus, OH"
   - **Website**: (opcional, pode pular)
3. Preencha informações pessoais:
   - Nome completo
   - Data de nascimento
   - Endereço (Columbus, OH)
   - SSN (últimos 4 dígitos)
4. Adicione conta bancária:
   - Routing number
   - Account number
   - OU conecte via Plaid
5. Clique **"Submit"**
6. ✅ Conta ativada! (pode levar alguns minutos)

**⚠️ IMPORTANTE**: Por enquanto, use **TEST MODE** para testar o sistema.

---

## Passo 3: Obter API Keys (2 min)

1. No dashboard, certifique-se que está em **TEST MODE** (toggle no canto superior direito)
2. Vá em: **Developers** → **API keys**
3. Copie as seguintes keys:

```
Publishable key (pk_test_...): pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Secret key (sk_test_...):      sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

4. ✅ Keys copiadas!

---

## Passo 4: Configurar Webhook (5 min)

### 4.1 Criar Endpoint

1. Vá em: **Developers** → **Webhooks**
2. Clique **"Add endpoint"**
3. Configure:
   - **Endpoint URL**: `http://localhost:3000/api/webhooks/stripe`
   - **Description**: Local development webhook
   - **Events to send**: Selecione:
     - ✅ `payment_intent.succeeded`
     - ✅ `payment_intent.payment_failed`
     - ✅ `charge.refunded`
     - ✅ `customer.subscription.created`
     - ✅ `customer.subscription.updated`
     - ✅ `customer.subscription.deleted`
4. Clique **"Add endpoint"**
5. ✅ Webhook criado!

### 4.2 Obter Signing Secret

1. Clique no webhook que você criou
2. Role até **"Signing secret"**
3. Clique **"Reveal"**
4. Copie: `whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
5. ✅ Signing secret copiado!

**⚠️ NOTA**: Para desenvolvimento local, você precisará usar Stripe CLI (veja abaixo).

---

## Passo 5: Adicionar ao .env.local

Abra `c:\Users\teste\Desktop\Discreetcourie\discreet-courier\.env.local` e adicione:

```bash
# Stripe (TEST MODE)
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Substitua** pelos seus valores reais.

---

## Passo 6: Testar Pagamento (5 min)

### 6.1 Reiniciar Servidor

```bash
# Ctrl+C para parar
npm run dev
```

### 6.2 Fazer Pagamento de Teste

1. Abra: http://localhost:3000/quote
2. Preencha formulário
3. Clique **"Pay Now"**
4. Você será redirecionado para `/checkout`
5. Preencha com cartão de teste:

```
Número do cartão:  4242 4242 4242 4242
Data de validade:  12/34 (qualquer futura)
CVC:               123 (qualquer 3 dígitos)
Nome:              Test User
CEP:               43215 (Columbus, OH)
```

6. Clique **"Pay"**
7. ✅ Pagamento processado!

### 6.3 Verificar no Dashboard

1. Vá em: **Payments** → **All payments**
2. Você deve ver o pagamento de teste
3. Status: **Succeeded**
4. ✅ Funcionando!

---

## Passo 7: Configurar Webhook Local (Opcional)

Para testar webhooks localmente, use Stripe CLI:

### 7.1 Instalar Stripe CLI

**Windows**:
```bash
# Baixe de: https://github.com/stripe/stripe-cli/releases/latest
# Ou use Scoop:
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Mac**:
```bash
brew install stripe/stripe-cli/stripe
```

### 7.2 Login

```bash
stripe login
# Abrirá navegador para autorizar
```

### 7.3 Forward Webhooks

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copie o webhook signing secret que aparece:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

Atualize `.env.local` com este novo secret.

### 7.4 Testar Webhook

Em outro terminal:
```bash
stripe trigger payment_intent.succeeded
```

Verifique os logs do servidor. Deve aparecer:
```
✅ Webhook received: payment_intent.succeeded
```

---

## Cartões de Teste

### Sucesso:
```
4242 4242 4242 4242  → Sucesso
5555 5555 5555 4444  → Mastercard
3782 822463 10005    → Amex
```

### Falha:
```
4000 0000 0000 0002  → Card declined
4000 0000 0000 9995  → Insufficient funds
4000 0000 0000 0069  → Expired card
```

### 3D Secure:
```
4000 0025 0000 3155  → Requer autenticação
```

---

## Troubleshooting

### ❌ Erro: "Invalid API key"
- Verifique se copiou a key completa
- Certifique-se que está usando `sk_test_` (não `sk_live_`)
- Reinicie o servidor após adicionar ao .env.local

### ❌ Webhook não funciona
- Use Stripe CLI para desenvolvimento local
- Em produção, use URL pública (Vercel)
- Verifique se signing secret está correto

### ❌ Pagamento não processa
- Verifique console do navegador (F12)
- Verifique logs do servidor
- Teste com cartão 4242 4242 4242 4242

### ❌ Erro: "No such payment_intent"
- Verifique se API está criando payment intent
- Abra Network tab (F12) e veja resposta de `/api/payments/create-intent`

---

## Migrar para Produção

Quando estiver pronto para aceitar pagamentos reais:

### 1. Ativar Live Mode

1. No dashboard, mude toggle para **LIVE MODE**
2. Vá em: **Developers** → **API keys**
3. Copie as LIVE keys:
   - `pk_live_...`
   - `sk_live_...`

### 2. Atualizar .env (Produção)

```bash
# Stripe (LIVE MODE)
STRIPE_SECRET_KEY=sk_live_[sua-chave-aqui]
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_[sua-chave-aqui]
```

### 3. Configurar Webhook Produção

1. **Developers** → **Webhooks** → **Add endpoint**
2. URL: `https://seu-dominio.vercel.app/api/webhooks/stripe`
3. Selecione mesmos eventos
4. Copie novo signing secret
5. Atualize `STRIPE_WEBHOOK_SECRET` na Vercel

---

## Custos

```
Setup fee:          $0 (grátis)
Mensalidade:        $0 (sem mensalidade)
Por transação:      2.9% + $0.30

Exemplos:
$10 entrega  = $0.59 fee  = $9.41 líquido
$50 entrega  = $1.75 fee  = $48.25 líquido
$100 entrega = $3.20 fee  = $96.80 líquido

Transferência para banco: Grátis (1-2 dias úteis)
```

---

## Recursos Stripe Disponíveis

O sistema já está integrado com:

✅ **Payment Intents** - Pagamentos únicos  
✅ **Webhooks** - Atualização automática de status  
✅ **Metadata** - Tracking de delivery_id  
✅ **Logs** - Salvos em payment_logs table  
✅ **Notificações** - Email/SMS após pagamento  
✅ **Refunds** - Suportado via webhook  

---

## ✅ CHECKLIST

- [ ] Conta Stripe criada
- [ ] Email verificado
- [ ] Conta ativada (informações preenchidas)
- [ ] TEST MODE ativo
- [ ] Publishable key copiada (pk_test_...)
- [ ] Secret key copiada (sk_test_...)
- [ ] Webhook endpoint criado
- [ ] Webhook signing secret copiado
- [ ] Variáveis adicionadas ao .env.local
- [ ] Servidor reiniciado
- [ ] Pagamento de teste processado com sucesso
- [ ] Pagamento aparece no dashboard Stripe
- [ ] Stripe CLI instalado (opcional)
- [ ] Webhook testado localmente (opcional)

---

**Tempo total**: ~15 minutos  
**Custo**: 2.9% + $0.30 por transação  
**Status**: ✅ Pronto para aceitar pagamentos!

---

**Próximo**: Deploy para Produção (Vercel + Supabase)
