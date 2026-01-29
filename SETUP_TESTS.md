# 🧪 Configuração de Testes Automatizados - Discreet Courier

Este guia explica como adicionar os testes automatizados ao seu projeto.

---

## 📦 Passo 1: Instalar Dependências

Execute no terminal, na raiz do projeto:

```bash
# Dependências de teste
npm install --save-dev \
  jest \
  jest-environment-jsdom \
  @swc/jest \
  @testing-library/jest-dom \
  @testing-library/react \
  @testing-library/user-event \
  @types/jest \
  @playwright/test
```

---

## 📁 Passo 2: Copiar Arquivos

Copie os seguintes arquivos para seu projeto:

```
seu-projeto/
├── .github/
│   └── workflows/
│       └── tests.yml          ← Workflow do GitHub Actions
├── __tests__/
│   ├── unit/
│   │   └── example.test.tsx   ← Testes unitários
│   └── e2e/
│       └── app.spec.ts        ← Testes E2E
├── jest.config.js             ← Configuração do Jest
├── jest.setup.ts              ← Setup do Jest
└── playwright.config.ts       ← Configuração do Playwright
```

---

## 📝 Passo 3: Atualizar package.json

Adicione estes scripts ao seu `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage --watchAll=false",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui",
    "test:e2e:headed": "playwright test --headed",
    "test:e2e:debug": "playwright test --debug",
    "test:all": "npm run test:ci && npm run test:e2e",
    "type-check": "tsc --noEmit"
  }
}
```

---

## 🎭 Passo 4: Instalar Browsers do Playwright

```bash
npx playwright install
```

---

## 🔐 Passo 5: Configurar Secrets no GitHub

Vá em: **Settings → Secrets and variables → Actions → New repository secret**

Adicione:

| Nome | Descrição |
|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do seu projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima do Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | (Opcional) Chave de serviço |

---

## 🚀 Passo 6: Executar Testes

### Localmente:

```bash
# Testes unitários
npm run test

# Testes unitários com watch mode
npm run test:watch

# Testes unitários com cobertura
npm run test:coverage

# Testes E2E
npm run test:e2e

# Testes E2E com interface visual
npm run test:e2e:ui

# Todos os testes
npm run test:all
```

### No GitHub:

Os testes rodam automaticamente em cada:
- Push para `master`, `main` ou `develop`
- Pull Request para `master` ou `main`

---

## 📊 Estrutura dos Testes

### Testes Unitários (Jest + Testing Library)

```typescript
// __tests__/unit/minha-funcao.test.ts
describe('MinhaFuncao', () => {
  test('deve fazer algo', () => {
    expect(minhaFuncao(input)).toBe(output)
  })
})
```

### Testes E2E (Playwright)

```typescript
// __tests__/e2e/meu-fluxo.spec.ts
import { test, expect } from '@playwright/test'

test('deve completar o fluxo', async ({ page }) => {
  await page.goto('/pagina')
  await page.click('button')
  await expect(page).toHaveURL('/resultado')
})
```

---

## 🎯 O que Testar

### Testes Unitários (Prioridade Alta)
- [x] Cálculo de preços
- [x] Validação de códigos de rastreio
- [x] Validação de códigos VIP
- [x] Formatação de moeda/data
- [x] Lógica de status de entrega
- [ ] Funções de criptografia
- [ ] Componentes isolados

### Testes E2E (Prioridade Alta)
- [x] Landing page carrega
- [x] Página de tracking funciona
- [x] Formulário de concierge
- [x] Login com erro
- [x] Proteção de rotas admin
- [x] Responsividade mobile
- [ ] Fluxo completo de pedido
- [ ] Fluxo de pagamento

---

## 📈 Verificar Cobertura

```bash
npm run test:coverage
```

Abre `coverage/lcov-report/index.html` no browser.

---

## 🔍 Debugging

### Jest:
```bash
# Executar teste específico
npm test -- --testNamePattern="calcula preço"

# Verbose
npm test -- --verbose
```

### Playwright:
```bash
# Modo debug (pausa em cada passo)
npm run test:e2e:debug

# Executar teste específico
npx playwright test app.spec.ts --grep "Landing"

# Gerar relatório
npx playwright show-report
```

---

## ⚠️ Problemas Comuns

### 1. Erro "Cannot find module '@/lib/...'"
Verifique se o `moduleNameMapper` no `jest.config.js` corresponde aos paths do `tsconfig.json`.

### 2. Erro de timeout no Playwright
Aumente o timeout em `playwright.config.ts`:
```typescript
timeout: 60 * 1000, // 60 segundos
```

### 3. Testes falham no CI mas passam localmente
Verifique:
- Variáveis de ambiente estão configuradas
- Build da aplicação está funcionando
- Não há dependência de dados locais

---

## 📞 Suporte

Qualquer dúvida, consulte:
- [Jest Docs](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)
- [Playwright Docs](https://playwright.dev/docs/intro)

---

Feito com ❤️ para Discreet Courier Columbus
