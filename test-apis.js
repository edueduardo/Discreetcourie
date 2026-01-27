/**
 * SCRIPT DE TESTE DE APIs - DiscreetCourie
 * 
 * Como usar:
 * 1. Certifique-se que o dev server está rodando (npm run dev)
 * 2. Configure as variáveis abaixo
 * 3. Execute: node test-apis.js
 */

const BASE_URL = 'http://localhost:3000';

// Cores para output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Função auxiliar para fazer requests
async function testAPI(name, method, endpoint, body = null, headers = {}) {
  try {
    logInfo(`Testando: ${name}`);
    
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, options);
    const data = await response.json();

    if (response.ok) {
      logSuccess(`${name} - Status ${response.status}`);
      console.log('   Resposta:', JSON.stringify(data, null, 2).substring(0, 200));
      return { success: true, data, status: response.status };
    } else {
      logWarning(`${name} - Status ${response.status}`);
      console.log('   Erro:', JSON.stringify(data, null, 2).substring(0, 200));
      return { success: false, data, status: response.status };
    }
  } catch (error) {
    logError(`${name} - Erro: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Testes
async function runTests() {
  log('\n🚀 INICIANDO TESTES DE APIs - DiscreetCourie\n', 'blue');
  
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0
  };

  // ============================================
  // 1. TESTE DE HEALTH CHECK
  // ============================================
  log('\n📊 1. HEALTH CHECK', 'yellow');
  
  let test = await testAPI(
    'Diagnostic API',
    'GET',
    '/api/diagnostic'
  );
  results.total++;
  if (test.success) results.passed++;
  else results.failed++;

  // ============================================
  // 2. TESTE DE AI FEATURES
  // ============================================
  log('\n🤖 2. AI FEATURES', 'yellow');
  
  // AI Chatbot
  test = await testAPI(
    'AI Chatbot',
    'POST',
    '/api/ai/chat',
    { message: 'Hello, test message' }
  );
  results.total++;
  if (test.success || test.status === 401) results.passed++;
  else results.failed++;

  // Smart Pricing
  test = await testAPI(
    'Smart Pricing',
    'POST',
    '/api/ai/smart-pricing',
    { 
      basePrice: 15,
      distance: 10,
      urgency: 'standard',
      timeOfDay: new Date().getHours()
    }
  );
  results.total++;
  if (test.success || test.status === 401) results.passed++;
  else results.failed++;

  // Route Optimization
  test = await testAPI(
    'Route Optimization',
    'POST',
    '/api/ai/route-optimization',
    {
      stops: [
        { address: '123 Main St', lat: 39.9612, lon: -82.9988 },
        { address: '456 Oak Ave', lat: 39.9700, lon: -83.0000 }
      ]
    }
  );
  results.total++;
  if (test.success || test.status === 401) results.passed++;
  else results.failed++;

  // ============================================
  // 3. TESTE DE VAULT APIs
  // ============================================
  log('\n🔐 3. HUMAN VAULT APIs', 'yellow');
  
  // Vault Secure (criar vault file metadata)
  test = await testAPI(
    'Vault Secure',
    'POST',
    '/api/vault/secure',
    {
      fileName: 'test-document.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      requiresNda: true,
      autoDestructDays: 7
    }
  );
  results.total++;
  if (test.success || test.status === 401) results.passed++;
  else results.failed++;

  // ============================================
  // 4. TESTE DE NDA APIs
  // ============================================
  log('\n📝 4. NDA ENFORCEMENT APIs', 'yellow');
  
  // NDA Enforce
  test = await testAPI(
    'NDA Enforce',
    'POST',
    '/api/nda/enforce',
    {
      vaultFileId: 'test-uuid',
      fullName: 'Test User',
      email: 'test@example.com',
      signature: 'Test Signature'
    }
  );
  results.total++;
  if (test.success || test.status === 401 || test.status === 400) results.passed++;
  else results.failed++;

  // ============================================
  // 5. TESTE DE ZERO-TRACE APIs
  // ============================================
  log('\n👻 5. ZERO-TRACE DELIVERY APIs', 'yellow');
  
  // Zero-Trace Create
  test = await testAPI(
    'Zero-Trace Create',
    'POST',
    '/api/zero-trace',
    {
      pickupAddress: '123 Main St',
      deliveryAddress: '456 Oak Ave',
      useVPN: true,
      useCrypto: true,
      autoDelete: true
    }
  );
  results.total++;
  if (test.success || test.status === 401) results.passed++;
  else results.failed++;

  // ============================================
  // 6. TESTE DE SUBSCRIPTIONS APIs
  // ============================================
  log('\n💳 6. SUBSCRIPTIONS APIs', 'yellow');
  
  // Get Plans
  test = await testAPI(
    'Get Subscription Plans',
    'GET',
    '/api/subscriptions/plans'
  );
  results.total++;
  if (test.success || test.status === 401) results.passed++;
  else results.failed++;

  // ============================================
  // 7. TESTE DE ORDERS APIs
  // ============================================
  log('\n📦 7. ORDERS APIs', 'yellow');
  
  // Get Orders
  test = await testAPI(
    'Get Orders',
    'GET',
    '/api/orders'
  );
  results.total++;
  if (test.success || test.status === 401) results.passed++;
  else results.failed++;

  // ============================================
  // 8. TESTE DE QUOTE API
  // ============================================
  log('\n💰 8. QUOTE API', 'yellow');
  
  // Get Quote
  test = await testAPI(
    'Get Quote',
    'POST',
    '/api/quote',
    {
      pickupAddress: '123 Main St, Columbus, OH',
      deliveryAddress: '456 Oak Ave, Columbus, OH',
      urgency: 'standard'
    }
  );
  results.total++;
  if (test.success || test.status === 401) results.passed++;
  else results.failed++;

  // ============================================
  // RESUMO DOS TESTES
  // ============================================
  log('\n' + '='.repeat(50), 'blue');
  log('📊 RESUMO DOS TESTES', 'blue');
  log('='.repeat(50), 'blue');
  
  log(`\nTotal de testes: ${results.total}`);
  logSuccess(`Passou: ${results.passed}`);
  logError(`Falhou: ${results.failed}`);
  
  if (results.failed === 0) {
    log('\n🎉 TODOS OS TESTES PASSARAM!', 'green');
  } else {
    log('\n⚠️  ALGUNS TESTES FALHARAM', 'yellow');
    log('\nNotas:', 'cyan');
    log('- Status 401 (Unauthorized) é esperado se você não estiver autenticado');
    log('- Status 400 (Bad Request) pode indicar dados de teste inválidos');
    log('- Configure .env.local com as chaves de API necessárias');
    log('- Certifique-se que as migrations foram rodadas no Supabase');
  }

  log('\n' + '='.repeat(50) + '\n', 'blue');
}

// Executar testes
runTests().catch(error => {
  logError(`Erro fatal: ${error.message}`);
  process.exit(1);
});
