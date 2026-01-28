# 📧 SETUP SMTP EMAIL - GUIA RÁPIDO (5 MINUTOS)

## Opção 1: Gmail (Recomendado - GRÁTIS)

### Passo 1: Ativar 2FA no Gmail (2 min)

1. Acesse: https://myaccount.google.com/security
2. Role até **"2-Step Verification"**
3. Clique **"Get started"**
4. Siga os passos:
   - Digite sua senha
   - Digite seu número de telefone
   - Digite código recebido via SMS
   - Clique **"Turn on"**
5. ✅ 2FA ativado!

---

### Passo 2: Gerar Senha de App (2 min)

1. Ainda em: https://myaccount.google.com/security
2. Role até **"App passwords"** (ou "Senhas de app")
3. Clique **"App passwords"**
4. Digite sua senha novamente
5. Configure:
   - **Select app**: Mail
   - **Select device**: Other (Custom name)
   - **Name**: Discreet Courier
6. Clique **"Generate"**
7. ✅ Senha gerada! (16 caracteres)

**COPIE A SENHA**: `xxxx xxxx xxxx xxxx`

⚠️ **IMPORTANTE**: Guarde esta senha! Não será mostrada novamente.

---

### Passo 3: Adicionar ao .env.local (1 min)

Abra `c:\Users\teste\Desktop\Discreetcourie\discreet-courier\.env.local` e adicione:

```bash
# SMTP Email (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=seu-email@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
OPERATOR_EMAIL=seu-email@gmail.com
```

**Substitua**:
- `seu-email@gmail.com` → Seu email real
- `xxxx xxxx xxxx xxxx` → Senha de app gerada

---

### Passo 4: Testar Email

1. Reinicie o servidor:
```bash
# Ctrl+C para parar
npm run dev
```

2. Abra: http://localhost:3000/quote

3. Preencha e clique **"Book Now"**

4. ✅ Verifique sua caixa de entrada!

**Email esperado**:
```
De: seu-email@gmail.com
Para: seu-email@gmail.com
Assunto: 🚚 Nova Entrega Criada - DC-XXXXXXXX

Nova entrega foi criada no sistema!

Código de Rastreamento: DC-XXXXXXXX
De: [endereço pickup]
Para: [endereço entrega]
Preço: $XX.XX

Ver detalhes: http://localhost:3000/admin
```

---

## Opção 2: SendGrid (Alternativa)

### Passo 1: Criar Conta (2 min)

1. Acesse: https://signup.sendgrid.com
2. Preencha formulário
3. Verifique email
4. Complete onboarding
5. ✅ Conta criada! (100 emails/dia grátis)

---

### Passo 2: Criar API Key (2 min)

1. No dashboard, vá em: **Settings** → **API Keys**
2. Clique **"Create API Key"**
3. Configure:
   - **Name**: Discreet Courier
   - **Permissions**: Full Access
4. Clique **"Create & View"**
5. ✅ API Key gerada!

**COPIE A KEY**: `SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

---

### Passo 3: Adicionar ao .env.local

```bash
# SMTP Email (SendGrid)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
OPERATOR_EMAIL=seu-email@sendgrid.com
```

---

## Troubleshooting

### ❌ Erro: "Invalid login"
- Verifique se copiou a senha de app corretamente
- Senha deve ter 16 caracteres (com espaços)
- Tente gerar nova senha de app

### ❌ Erro: "Less secure app access"
- Gmail bloqueou acesso
- Solução: Use senha de app (não senha normal)
- 2FA deve estar ativo

### ❌ Email não chega
- Verifique spam/lixo eletrônico
- Verifique se SMTP_USER e OPERATOR_EMAIL estão corretos
- Teste com outro email

### ❌ Erro: "Connection timeout"
- Verifique SMTP_HOST e SMTP_PORT
- Gmail: smtp.gmail.com:587
- SendGrid: smtp.sendgrid.net:587

---

## Custos

### Gmail:
```
Custo: GRÁTIS
Limite: ~500 emails/dia
Ideal para: Solo operator
```

### SendGrid:
```
Custo: GRÁTIS (até 100/dia)
Custo Pro: $15/mês (até 40,000/mês)
Ideal para: Escala maior
```

---

## Verificar Configuração

Teste se está funcionando:

```bash
# No terminal, dentro da pasta do projeto:
node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'seu-email@gmail.com',
    pass: 'xxxx xxxx xxxx xxxx'
  }
});
transporter.verify((error, success) => {
  if (error) console.log('❌ Erro:', error);
  else console.log('✅ SMTP configurado corretamente!');
});
"
```

---

## Templates de Email Disponíveis

O sistema já tem templates prontos para:

1. **Novo Pedido** (operador)
   - Notifica quando cliente cria entrega
   - Inclui todos os detalhes

2. **Confirmação** (cliente)
   - Confirma entrega criada
   - Inclui tracking code

3. **Atualização de Status** (cliente)
   - Notifica mudanças de status
   - Ex: picked_up, in_transit, delivered

4. **Pagamento Recebido** (cliente)
   - Confirma pagamento processado
   - Inclui recibo

5. **Entrega Completa** (cliente)
   - Notifica entrega finalizada
   - Pede feedback (opcional)

---

## ✅ CHECKLIST

- [ ] 2FA ativado no Gmail
- [ ] Senha de app gerada
- [ ] SMTP_HOST configurado
- [ ] SMTP_PORT configurado (587)
- [ ] SMTP_USER configurado (seu email)
- [ ] SMTP_PASSWORD configurado (senha de app)
- [ ] OPERATOR_EMAIL configurado
- [ ] Variáveis adicionadas ao .env.local
- [ ] Servidor reiniciado
- [ ] Email de teste enviado e recebido

---

**Tempo total**: ~5 minutos  
**Custo**: GRÁTIS (Gmail ou SendGrid free tier)  
**Status**: ✅ Pronto para usar!

---

**Próximo**: Configurar Stripe Pagamentos
