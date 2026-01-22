# 📱 TWILIO SMS SETUP - GUIA COMPLETO

Este guia ensina como configurar o Twilio para envio de SMS automáticos no sistema Discreet Courier.

---

## ✅ PASSO 1: CRIAR CONTA TWILIO

1. Acesse: **https://www.twilio.com/try-twilio**
2. Clique em **"Start for free"**
3. Preencha o formulário:
   - Email
   - Senha
   - Nome
   - Empresa (pode colocar "Discreet Courier Columbus")
4. Verifique seu email
5. Verifique seu telefone (enviam código SMS)

---

## ✅ PASSO 2: OBTER NÚMERO DE TELEFONE TWILIO

1. Faça login no Twilio Console: **https://console.twilio.com/**
2. No menu lateral, clique em **Phone Numbers** → **Manage** → **Buy a number**
3. Escolha:
   - Country: **United States**
   - Location: **Columbus, Ohio** (optional)
   - Capabilities: **SMS** (marque essa opção)
4. Clique em **Search**
5. Escolha um número e clique em **Buy**
6. Confirme a compra (conta trial tem $15 grátis)

**Seu número Twilio:** +1 (XXX) XXX-XXXX
- Anote esse número, você vai precisar dele

---

## ✅ PASSO 3: OBTER CREDENCIAIS

1. Volte para o **Twilio Console Dashboard**: https://console.twilio.com/
2. Você verá uma seção chamada **Account Info**
3. Copie os seguintes valores:

```
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

⚠️ **IMPORTANTE:** Clique em "Show" para revelar o Auth Token.

---

## ✅ PASSO 4: CONFIGURAR VARIÁVEIS DE AMBIENTE

1. Abra o arquivo `.env.local` na raiz do projeto
2. Adicione as seguintes linhas:

```bash
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
```

**Substitua pelos seus valores reais!**

Exemplo real:
```bash
TWILIO_ACCOUNT_SID=AC1234567890abcdef1234567890abcd
TWILIO_AUTH_TOKEN=abcd1234efgh5678ijkl9012mnop3456
TWILIO_PHONE_NUMBER=+16145550100
```

---

## ✅ PASSO 5: TESTAR INTEGRAÇÃO

1. Reinicie o servidor Next.js:
```bash
npm run dev
```

2. Acesse a API de teste:
```bash
curl -X POST http://localhost:3000/api/sms \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+16145551234",
    "message": "Test from Discreet Courier - System is working!"
  }'
```

**Ou faça um teste pelo navegador:**
- Acesse: http://localhost:3000/admin/notifications
- Envie um SMS de teste para seu próprio número

---

## ✅ PASSO 6: VERIFICAR SE FUNCIONOU

Se funcionou, você vai receber um SMS e a resposta da API será:
```json
{
  "success": true,
  "messageSid": "SMxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "configured": true
}
```

Se NÃO funcionou, você verá:
```json
{
  "configured": false,
  "success": true
}
```

Isso significa que as variáveis de ambiente não estão configuradas corretamente.

---

## 💰 CUSTOS

| Item | Custo |
|------|-------|
| **Trial Account** | $15 grátis |
| **Número de telefone** | $1/mês |
| **SMS enviado (USA)** | $0.0075 por SMS |
| **SMS recebido (USA)** | $0.0075 por SMS |

**Exemplo:** 1000 SMS/mês = $7.50 + $1 (número) = **$8.50/mês**

---

## 🔧 TROUBLESHOOTING

### "Auth Token inválido"
- Verifique se copiou o Auth Token completo (sem espaços)
- Clique em "Show" no Twilio Console para revelar o token

### "Number not verified"
- Em conta Trial, você só pode enviar para números verificados
- Vá em: **Verified Caller IDs** e adicione seu número de teste

### "SMS não chega"
- Verifique se o número tem formato correto: +1XXXXXXXXXX
- Verifique se o número está verificado (conta trial)
- Confira o log no Twilio Console: **Monitor** → **Logs** → **Messaging**

### "Variáveis de ambiente não carregam"
- Reinicie o servidor (`npm run dev`)
- Verifique se o arquivo é `.env.local` (não `.env`)
- Verifique se não tem espaços antes/depois do `=`

---

## 🎯 PRÓXIMOS PASSOS

Depois de configurar o Twilio:

1. ✅ **SMS automáticos funcionando** - Clientes recebem confirmação, status updates, etc
2. ✅ **Notificações para você** - Recebe SMS quando novo booking chega
3. ✅ **Comunicação direta** - Cliente pode mandar SMS e você recebe

---

## 📞 SUPORTE

- **Twilio Docs:** https://www.twilio.com/docs/sms
- **Twilio Console:** https://console.twilio.com/
- **Twilio Support:** https://support.twilio.com/

---

**Configurado com sucesso?** ✅ Marque a tarefa como completa!
