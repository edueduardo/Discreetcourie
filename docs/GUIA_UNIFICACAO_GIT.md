# ══════════════════════════════════════════════════════════════════════════════
# GUIA DE UNIFICAÇÃO - GIT, VERCEL, DESENVOLVIMENTO
# Para: Eduardo
# ══════════════════════════════════════════════════════════════════════════════

## 📍 LINKS OFICIAIS UNIFICADOS

```
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║  REPOSITÓRIO ÚNICO                                                 ║
║  GitHub: https://github.com/edueduardo/Discreetcourie             ║
║  Branch: master                                                    ║
║                                                                    ║
║  DEPLOY ÚNICO                                                      ║
║  Vercel: https://discreetcourie.vercel.app                        ║
║  Auto-deploy: Ativado (push = deploy)                             ║
║                                                                    ║
║  BANCO DE DADOS                                                    ║
║  Supabase: https://orrnxowylokgzvimvluv.supabase.co               ║
║  Dashboard: https://supabase.com/dashboard                         ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## 🔄 COMO UNIFICAR OS BRANCHES (FAZER AGORA)

O Claude Code criou um branch separado. Precisamos unificar.

### PASSO 1: Verificar branches existentes

```bash
# No terminal, vá para a pasta do projeto
cd Discreetcourie

# Veja todos os branches
git branch -a
```

Você vai ver algo como:
```
* master
  remotes/origin/master
  remotes/origin/claude/discreetcourier-phase-1-o0xQe
```

### PASSO 2: Fazer merge do branch do Claude

```bash
# Certifique que está no master
git checkout master

# Atualize
git pull origin master

# Faça merge do branch do Claude
git merge origin/claude/discreetcourier-phase-1-o0xQe

# Se der conflito, aceite as mudanças do Claude:
# git checkout --theirs .
# git add .

# Push para master
git push origin master
```

### PASSO 3: Verificar no Vercel

1. Acesse https://vercel.com
2. Vá no projeto discreetcourie
3. Verifique se o último deploy é do branch `master`
4. Se não, vá em Settings > Git > Production Branch > Mude para `master`

---

## 🛠️ REGRA PARA TODOS OS DESENVOLVEDORES

```
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║  REGRA DE OURO:                                                    ║
║                                                                    ║
║  ✅ SEMPRE trabalhar no branch MASTER                              ║
║  ✅ SEMPRE fazer git pull antes de começar                         ║
║  ✅ SEMPRE fazer git push após terminar                            ║
║                                                                    ║
║  ❌ NUNCA criar branches novos (exceto features grandes)           ║
║  ❌ NUNCA fazer push para outro branch                             ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

### Fluxo de trabalho:

```bash
# ANTES DE COMEÇAR:
git checkout master
git pull origin master

# TRABALHAR...

# DEPOIS DE TERMINAR:
git add .
git commit -m "feat: descrição do que foi feito"
git push origin master

# Vercel faz deploy automático em ~1 minuto
```

---

## 📋 QUEM FAZ O QUÊ

| Ferramenta | Função | Como usar |
|------------|--------|-----------|
| **Claude Chat** (eu) | Análise, orientação, documentos | Pergunte aqui |
| **Claude Code** | Desenvolvimento de código | `claude "comando"` no terminal |
| **Windsurf Cascade** | Desenvolvimento de código | Interface do Windsurf |
| **GitHub** | Armazenar código | Push/Pull no master |
| **Vercel** | Hospedar o site | Automático após push |
| **Supabase** | Banco de dados | Dashboard web |

---

## 🚨 COMANDOS IMPORTANTES

### Ver status do Git:
```bash
git status
```

### Ver histórico:
```bash
git log --oneline -10
```

### Desfazer última alteração (antes de commit):
```bash
git checkout .
```

### Desfazer último commit:
```bash
git reset --soft HEAD~1
```

### Forçar atualização do master:
```bash
git fetch origin
git reset --hard origin/master
```

---

## ✅ CHECKLIST DE UNIFICAÇÃO

Faça estes passos AGORA:

- [ ] Verificar branches (`git branch -a`)
- [ ] Fazer merge do branch do Claude (`git merge origin/claude/...`)
- [ ] Push para master (`git push origin master`)
- [ ] Verificar deploy no Vercel
- [ ] Acessar https://discreetcourie.vercel.app e testar
- [ ] Confirmar que tudo funciona

---

## 📞 SE ALGO DER ERRADO

1. **Erro de merge/conflito:**
   - Cole o erro aqui no chat
   - Eu ajudo a resolver

2. **Site não atualiza no Vercel:**
   - Vá em Vercel > Deployments
   - Clique em "Redeploy" no último

3. **Banco não funciona:**
   - Verifique as variáveis de ambiente no Vercel
   - NEXT_PUBLIC_SUPABASE_URL deve estar configurada

---

## 📄 ARQUIVOS PARA WINDSURF CASCADE

Após unificar os branches, passe este arquivo para o Windsurf:

**Arquivo:** WINDSURF_CASCADE_MASTER_PRD.md

**Comando:**
```
Implemente as tarefas do arquivo WINDSURF_CASCADE_MASTER_PRD.md
Comece pela Tarefa 1 (APIs) e depois Tarefa 2 (Landing Page AIDA)
Repositório: https://github.com/edueduardo/Discreetcourie
Branch: master
```

---

# FIM DO GUIA
