# 🧪 GUIA COMPLETO DE TESTES

Sistema de testes automatizados configurado para o Discreet Courier.

---

## 📋 O QUE FOI CONFIGURADO

### ✅ Testes Unitários (Jest)
- **Framework**: Jest + React Testing Library
- **Cobertura**: Configurada para todos os arquivos src/
- **Mocks**: Supabase, Next Router, fetch global

### ✅ Testes E2E (Playwright)
- **Framework**: Playwright
- **Browsers**: Chromium (pode adicionar Firefox, WebKit)
- **Reports**: HTML reports automáticos

### ✅ CI/CD (GitHub Actions)
- **Workflow**: `.github/workflows/tests.yml`
- **Jobs**: Lint, Type Check, Unit Tests, E2E Tests, Build
- **Triggers**: Push e Pull Requests

---

## 🚀 INSTALAÇÃO

### 1. Instalar Dependências

```bash
npm install
```

### 2. Instalar Playwright Browsers

```bash
npx playwright install
```

Pronto! Tudo configurado.

---

## 🧪 EXECUTAR TESTES

### Testes Unitários

```bash
# Executar todos os testes
npm test

# Modo watch (re-executa ao salvar)
npm run test:watch

# Com cobertura de código
npm run test:coverage

# Para CI (sem watch, com coverage)
npm run test:ci
```

### Testes E2E

```bash
# Executar todos os testes E2E
npm run test:e2e

# Modo UI (interface visual)
npm run test:e2e:ui

# Modo debug (passo a passo)
npm run test:e2e:debug
```

### Verificações de Código

```bash
# Type check (TypeScript)
npm run type-check

# Linting (ESLint)
npm run lint

# Build de produção
npm run build
```

---

## 📁 ESTRUTURA DE TESTES

```
discreet-courier/
├── src/
│   └── __tests__/              # Testes unitários
│       ├── api/                # Testes de APIs
│       │   └── tracking.test.ts
│       ├── auth/               # Testes de autenticação
│       │   ├── nextauth.test.ts
│       │   └── rbac.test.ts
│       ├── compliance/         # Testes de compliance
│       │   └── gdpr.test.ts
│       ├── currency/           # Testes de moeda
│       │   └── currency.test.ts
│       ├── i18n/               # Testes de tradução
│       │   └── translation.test.ts
│       ├── international-shipping/
│       │   └── shipping.test.ts
│       ├── lib/                # Testes de utilitários
│       │   ├── encryption.test.ts
│       │   ├── rate-limit.test.ts
│       │   └── validation.test.ts
│       └── pwa/                # Testes de PWA
│           └── pwa.test.ts
│
├── jest.config.js              # Configuração Jest
├── jest.setup.js               # Setup global dos testes
├── playwright.config.ts        # Configuração Playwright (se criado)
│
└── .github/
    └── workflows/
        └── tests.yml           # CI/CD GitHub Actions
```

---

## 🎯 TESTES EXISTENTES

### Testes de API
- ✅ `api/tracking.test.ts` - GPS tracking endpoints

### Testes de Autenticação
- ✅ `auth/nextauth.test.ts` - NextAuth integration
- ✅ `auth/rbac.test.ts` - Role-based access control

### Testes de Compliance
- ✅ `compliance/gdpr.test.ts` - GDPR compliance

### Testes de Utilitários
- ✅ `lib/encryption.test.ts` - Encryption functions
- ✅ `lib/rate-limit.test.ts` - Rate limiting
- ✅ `lib/validation.test.ts` - Input validation

### Testes de Features
- ✅ `currency/currency.test.ts` - Multi-currency
- ✅ `i18n/translation.test.ts` - Internationalization
- ✅ `international-shipping/shipping.test.ts` - Shipping
- ✅ `pwa/pwa.test.ts` - Progressive Web App

---

## 📊 COBERTURA DE CÓDIGO

Após executar `npm run test:coverage`, você verá:

```
--------------------------|---------|----------|---------|---------|
File                      | % Stmts | % Branch | % Funcs | % Lines |
--------------------------|---------|----------|---------|---------|
All files                 |   XX.XX |    XX.XX |   XX.XX |   XX.XX |
 src/                     |   XX.XX |    XX.XX |   XX.XX |   XX.XX |
  ...                     |   XX.XX |    XX.XX |   XX.XX |   XX.XX |
--------------------------|---------|----------|---------|---------|
```

Relatório HTML em: `coverage/lcov-report/index.html`

---

## 🤖 CI/CD (GitHub Actions)

### Workflow Automático

O arquivo `.github/workflows/tests.yml` executa automaticamente:

1. **Lint & Type Check** 🔍
   - Verifica tipos TypeScript
   - Executa ESLint

2. **Testes Unitários** 🧪
   - Executa todos os testes Jest
   - Gera cobertura de código
   - Upload para Codecov (opcional)

3. **Testes E2E** 🎭
   - Instala Playwright browsers
   - Build da aplicação
   - Executa testes E2E
   - Gera relatórios

4. **Build de Produção** 🏗️
   - Verifica se build passa
   - Upload de artifacts

### Configurar Secrets no GitHub

Para que os testes funcionem no GitHub Actions:

1. Vá em: **Settings** → **Secrets and variables** → **Actions**
2. Clique **"New repository secret"**
3. Adicione:

```
NEXT_PUBLIC_SUPABASE_URL = https://seu-projeto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Ver Resultados

- Vá em **Actions** no GitHub
- Clique no workflow mais recente
- Veja logs de cada job

---

## ✍️ ESCREVER NOVOS TESTES

### Teste Unitário (Jest)

Crie arquivo em `src/__tests__/`:

```typescript
// src/__tests__/lib/myFunction.test.ts
import { myFunction } from '@/lib/myFunction'

describe('myFunction', () => {
  it('should do something', () => {
    const result = myFunction('input')
    expect(result).toBe('expected output')
  })

  it('should handle errors', () => {
    expect(() => myFunction(null)).toThrow()
  })
})
```

### Teste de Componente React

```typescript
// src/__tests__/components/MyComponent.test.tsx
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MyComponent from '@/components/MyComponent'

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })

  it('handles click', async () => {
    const user = userEvent.setup()
    render(<MyComponent />)
    
    await user.click(screen.getByRole('button'))
    expect(screen.getByText('Clicked')).toBeInTheDocument()
  })
})
```

### Teste E2E (Playwright)

Crie arquivo `tests/e2e/`:

```typescript
// tests/e2e/login.spec.ts
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('http://localhost:3000/login')
  
  await page.fill('input[name="email"]', 'test@example.com')
  await page.fill('input[name="password"]', 'password123')
  await page.click('button[type="submit"]')
  
  await expect(page).toHaveURL('/portal')
})
```

---

## 🔧 TROUBLESHOOTING

### ❌ Erro: "Cannot find module '@testing-library/jest-dom'"

```bash
npm install --save-dev @testing-library/jest-dom
```

### ❌ Erro: "Playwright browsers not installed"

```bash
npx playwright install
```

### ❌ Testes falhando no CI

1. Verifique secrets no GitHub
2. Verifique se build passa localmente
3. Veja logs no GitHub Actions

### ❌ Erro: "Module not found: Can't resolve '@/...'"

Verifique `jest.config.js`:
```javascript
moduleNameMapper: {
  '^@/(.*)$': '<rootDir>/src/$1',
}
```

---

## 📈 METAS DE COBERTURA

```
Atual:     ~30% (testes existentes)
Meta Q1:   >60% (testes críticos)
Meta Q2:   >80% (testes completos)
Meta Q3:   >90% (testes abrangentes)
```

---

## 🎯 PRIORIDADES DE TESTE

### Alta Prioridade (Implementar primeiro)
- [ ] Testes de autenticação (login, register, reset)
- [ ] Testes de criação de delivery
- [ ] Testes de pagamento Stripe
- [ ] Testes de GPS tracking
- [ ] Testes de notificações

### Média Prioridade
- [ ] Testes de admin dashboard
- [ ] Testes de driver interface
- [ ] Testes de vault upload
- [ ] Testes de APIs

### Baixa Prioridade
- [ ] Testes de UI/UX
- [ ] Testes de performance
- [ ] Testes de acessibilidade

---

## 📚 RECURSOS

- **Jest**: https://jestjs.io/
- **React Testing Library**: https://testing-library.com/react
- **Playwright**: https://playwright.dev/
- **GitHub Actions**: https://docs.github.com/actions

---

## ✅ CHECKLIST

- [x] Jest configurado
- [x] React Testing Library instalado
- [x] Playwright configurado
- [x] GitHub Actions workflow criado
- [x] Scripts npm adicionados
- [x] Testes de exemplo criados
- [ ] Secrets configurados no GitHub
- [ ] Playwright browsers instalados localmente
- [ ] Primeiro teste executado com sucesso

---

**Status**: Configuração completa, pronto para escrever testes! 🚀  
**Última atualização**: 27 de Janeiro de 2026
