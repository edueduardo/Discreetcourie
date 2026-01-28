# 📱 SETUP TWILIO SMS - GUIA RÁPIDO (5 MINUTOS)

## Passo 1: Criar Conta (2 min)

1. Acesse: https://www.twilio.com/try-twilio
2. Clique **"Sign up"**
3. Preencha:
   - Email: seu-email@gmail.com
   - Password: [senha forte]
   - First name: [seu nome]
   - Last name: [sobrenome]
4. Clique **"Start your free trial"**
5. Verifique seu email (clique no link)
6. Verifique seu telefone:
   - Digite seu número: +1 614 555 1234
   - Digite código recebido via SMS
7. ✅ Você recebe **$15 de crédito grátis**!

---

## Passo 2: Comprar Número (2 min)

1. No dashboard Twilio, clique **"Get a Trial Number"**
2. OU vá em: **Phone Numbers** → **Buy a number**
3. Configure:
   - **Country**: United States
   - **Capabilities**: ✅ SMS
   - **Area code**: 614 (Columbus, OH)
4. Clique **"Search"**
5. Escolha um número disponível
6. Clique **"Buy"** (~$1/mês)
7. ✅ Número comprado!

**Seu número**: +1 614 XXX XXXX (copie para usar depois)

---

## Passo 3: Obter Credentials (1 min)

1. No dashboard, vá em: **Account** → **API keys & tokens**
2. Copie as seguintes informações:

```
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Auth Token: [clique "Show" para revelar]
Phone Number: +16145551234 (o que você comprou)
```

3. ✅ Credentials copiadas!

---

## Passo 4: Adicionar ao .env.local

Abra `c:\Users\teste\Desktop\Discreetcourie\discreet-courier\.env.local` e adicione:

```bash
# Twilio SMS
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+16145551234
OPERATOR_PHONE_NUMBER=+16145551234  # Seu número pessoal
```

**⚠️ IMPORTANTE**: 
- Substitua os valores pelos seus reais
- `OPERATOR_PHONE_NUMBER` é o número que receberá notificações (seu celular)

---

## Passo 5: Testar SMS

1. Reinicie o servidor dev:
```bash
# Ctrl+C para parar
npm run dev
```

2. Abra: http://localhost:3000/quote

3. Preencha o formulário e clique **"Book Now"**

4. ✅ Você deve receber um SMS no seu celular!

**Mensagem esperada**:
```
🚚 Nova entrega criada!
Código: DC-XXXXXXXX
De: [endereço pickup]
Para: [endereço entrega]
```

---

## Troubleshooting

### ❌ Erro: "Account not authorized"
- Você está em trial mode
- Só pode enviar SMS para números verificados
- Solução: Verifique seu número em **Phone Numbers** → **Verified Caller IDs**

### ❌ Erro: "Invalid phone number"
- Formato deve ser: +1XXXXXXXXXX (com +1)
- Sem espaços, traços ou parênteses
- Exemplo correto: +16145551234

### ❌ SMS não chega
- Verifique se o número está correto
- Verifique se tem crédito ($15 grátis)
- Veja logs em: **Monitor** → **Logs** → **Messaging**

---

## Custos

```
Número de telefone: $1/mês
SMS enviado:        $0.0075 cada
SMS recebido:       $0.0075 cada

Crédito grátis:     $15 (suficiente para ~2000 SMS)

Exemplo (100 entregas/mês):
- 100 SMS para operador = $0.75
- 100 SMS para clientes = $0.75
TOTAL: ~$2.50/mês
```

---

## Upgrade para Produção

Quando estiver pronto para produção:

1. Vá em: **Account** → **Upgrade**
2. Adicione cartão de crédito
3. Remova limitações de trial
4. Agora pode enviar SMS para qualquer número!

---

## ✅ CHECKLIST

- [ ] Conta Twilio criada
- [ ] Email verificado
- [ ] Telefone verificado
- [ ] Número comprado (+1 614 XXX XXXX)
- [ ] Account SID copiado
- [ ] Auth Token copiado
- [ ] Variáveis adicionadas ao .env.local
- [ ] Servidor reiniciado
- [ ] SMS de teste enviado e recebido

---

**Tempo total**: ~5 minutos  
**Custo**: $1/mês + $0.0075/SMS  
**Status**: ✅ Pronto para usar!

---

**Próximo**: Configurar SMTP Email
