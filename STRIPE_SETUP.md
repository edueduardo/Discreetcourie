# 💳 STRIPE PAYMENTS SETUP - GUIA COMPLETO

Este guia ensina como configurar o Stripe para aceitar pagamentos online no sistema Discreet Courier.

---

## ✅ PASSO 1: CRIAR CONTA STRIPE

1. Acesse: **https://dashboard.stripe.com/register**
2. Clique em **"Start now"**
3. Preencha o formulário:
   - Email
   - Senha
   - Nome completo
   - País: **United States**
4. Verifique seu email

---

## ✅ PASSO 2: CONFIGURAR PERFIL COMERCIAL

1. Faça login no Stripe Dashboard: **https://dashboard.stripe.com/**
2. Complete o perfil comercial:
   - **Business name:** Discreet Courier Columbus
   - **Business type:** Individual / Sole proprietorship
   - **Industry:** Transportation & Logistics → Courier & Delivery Services
   - **Website:** https://discreet-courier.vercel.app/
3. Adicione informações bancárias (para receber os pagamentos)
4. Verifique sua identidade (pode pedir SSN ou EIN)

---

## ✅ PASSO 3: OBTER API KEYS

### 🔧 MODO TEST (para desenvolvimento)

1. No Stripe Dashboard, certifique-se que está em **Test mode** (toggle no topo direito)
2. Vá em: **Developers** → **API keys**
3. Copie as keys:

```
Publishable key: pk_test_COPY_FROM_STRIPE_DASHBOARD
Secret key: sk_test_COPY_FROM_STRIPE_DASHBOARD
```

### 🚀 MODO LIVE (para produção)

⚠️ **Só ative depois de testar tudo!**

1. Toggle para **Live mode** no topo direito
2. Vá em: **Developers** → **API keys**
3. Copie as keys:

```
Publishable key: pk_live_COPY_FROM_STRIPE_DASHBOARD
Secret key: sk_live_COPY_FROM_STRIPE_DASHBOARD
```

---

## ✅ PASSO 4: CONFIGURAR WEBHOOK

1. No Stripe Dashboard, vá em: **Developers** → **Webhooks**
2. Clique em **"Add endpoint"**
3. Preencha:
   - **Endpoint URL:** `https://discreet-courier.vercel.app/api/webhooks/stripe`
   - **Description:** Discreet Courier Webhooks
   - **Events to send:** Selecione:
     - `payment_intent.succeeded`
     - `payment_intent.payment_failed`
     - `charge.refunded`
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
4. Clique em **"Add endpoint"**

5. Após criar, clique no endpoint criado e copie o **Signing secret**:
```
Signing secret: whsec_COPY_FROM_WEBHOOK_SETTINGS
```

---

## ✅ PASSO 5: CONFIGURAR VARIÁVEIS DE AMBIENTE

1. Abra o arquivo `.env.local` na raiz do projeto
2. Adicione as seguintes linhas:

### Para DESENVOLVIMENTO (Test Mode):
```bash
# Stripe Configuration (TEST MODE)
# Replace with your actual keys from Stripe Dashboard
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE
```

### Para PRODUÇÃO (Live Mode):
```bash
# Stripe Configuration (LIVE MODE)
# Replace with your actual LIVE keys from Stripe Dashboard
STRIPE_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LIVE_WEBHOOK_SECRET_HERE
```

**Substitua pelos seus valores reais!**

---

## ✅ PASSO 6: ADICIONAR VARIÁVEIS NO VERCEL

⚠️ **IMPORTANTE:** Se usar Vercel para deploy, adicione as variáveis lá também!

1. Acesse: **https://vercel.com/[seu-usuario]/discreet-courier/settings/environment-variables**
2. Adicione as 3 variáveis:
   - `STRIPE_SECRET_KEY`
   - `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
   - `STRIPE_WEBHOOK_SECRET`
3. Marque para qual ambiente: **Production**, **Preview**, **Development**
4. Clique em **Save**
5. **Redeploy** o projeto para aplicar as mudanças

---

## ✅ PASSO 7: TESTAR PAGAMENTO

### Teste Local (Development):

1. Reinicie o servidor:
```bash
npm run dev
```

2. Acesse: http://localhost:3000/concierge/request

3. Preencha o formulário e use um **cartão de teste**:
```
Número: 4242 4242 4242 4242
Expiração: 12/34
CVC: 123
ZIP: 43201
```

4. Complete o pagamento

5. Verifique no Stripe Dashboard → **Payments** se o pagamento apareceu

### Teste Webhook:

1. Instale Stripe CLI:
```bash
brew install stripe/stripe-cli/stripe
# ou
scoop install stripe
```

2. Login:
```bash
stripe login
```

3. Redirecione webhooks para seu localhost:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

4. Faça um pagamento de teste

5. Verifique se o webhook foi recebido nos logs

---

## ✅ PASSO 8: CARTÕES DE TESTE

Use estes cartões para testar diferentes cenários:

| Cenário | Número do Cartão |
|---------|------------------|
| **Sucesso** | 4242 4242 4242 4242 |
| **Requer autenticação** | 4000 0025 0000 3155 |
| **Cartão recusado** | 4000 0000 0000 9995 |
| **Saldo insuficiente** | 4000 0000 0000 9995 |
| **Cartão expirado** | 4000 0000 0000 0069 |

**Todos com:**
- Expiração: Qualquer data futura (ex: 12/34)
- CVC: Qualquer 3 dígitos (ex: 123)
- ZIP: Qualquer (ex: 43201)

---

## 💰 CUSTOS

| Item | Custo |
|------|-------|
| **Conta Stripe** | GRÁTIS |
| **Transação (cartão USA)** | 2.9% + $0.30 |
| **Transação (cartão internacional)** | 3.9% + $0.30 |
| **Chargeback** | $15 |
| **Payout para banco** | GRÁTIS (standard) |

**Exemplo:** Delivery de $50 = $50 - ($1.45 + $0.30) = **$48.25 líquido**

---

## 🔧 TROUBLESHOOTING

### "Secret key inválida"
- Verifique se copiou a key completa (começa com `sk_test_` ou `sk_live_`)
- Verifique se não tem espaços antes/depois
- Certifique-se que está usando a key do ambiente correto (test vs live)

### "Webhook não recebe eventos"
- Verifique se a URL do webhook está correta
- Verifique se o `STRIPE_WEBHOOK_SECRET` está correto
- Use `stripe listen` para testar localmente
- Confira os logs em: **Developers** → **Webhooks** → [seu endpoint] → **Events**

### "Payment failed"
- Verifique se está usando cartão de teste correto
- Em produção, verifique se o cliente tem saldo
- Confira em **Payments** → **Failed** para ver o motivo

### "Variáveis de ambiente não carregam"
- Reinicie o servidor (`npm run dev`)
- Verifique se o arquivo é `.env.local` (não `.env`)
- No Vercel, redeploy após adicionar variáveis

---

## 🎯 PRÓXIMOS PASSOS

Depois de configurar o Stripe:

1. ✅ **Aceitar pagamentos online** - Clientes podem pagar com cartão
2. ✅ **Webhooks funcionando** - Sistema atualiza status automaticamente
3. ✅ **Receber dinheiro** - Payouts automáticos para sua conta bancária

---

## 🚀 IR PARA PRODUÇÃO (LIVE MODE)

Quando estiver pronto para aceitar pagamentos reais:

1. **Complete o perfil comercial** no Stripe (100%)
2. **Troque as keys** no `.env.local` e Vercel (test → live)
3. **Crie novo webhook** para produção (URL live)
4. **Teste com cartão real** (valor baixo tipo $1)
5. **Monitore os primeiros pagamentos** de perto

---

## 📞 SUPORTE

- **Stripe Docs:** https://stripe.com/docs
- **Stripe Dashboard:** https://dashboard.stripe.com/
- **Stripe Support:** https://support.stripe.com/

---

**Configurado com sucesso?** ✅ Marque a tarefa como completa!
