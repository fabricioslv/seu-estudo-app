/**
 * Script de teste para validar proteção de rotas críticas
 * Testa se rotas protegidas bloqueiam acesso sem token JWT
 */

const http = require('http');

// Configuração do servidor
const SERVER_URL = 'http://localhost:6001';

// Lista de rotas críticas que DEVEM estar protegidas
const PROTECTED_ROUTES = [
  // Rotas de questões que manipulam dados sensíveis
  '/api/questoes/generate-study-plan',
  '/api/questoes/study-plans',
  '/api/questoes/study-plans/123',
  '/api/questoes/responder',
  '/api/questoes/responder-multiplo',
  '/api/questoes/historico/123',
  '/api/questoes/estatisticas/123',
  // Rotas que salvam dados no banco
  '/api/questoes/process-batch-and-store',
  '/api/questoes/categorizar-enem',
  '/api/questoes/generate-explanations',
];

// Lista de rotas públicas que NÃO devem estar protegidas
const PUBLIC_ROUTES = [
  '/api/questoes/available-files',
  '/api/questoes/by-subject/matematica',
  '/api/questoes/by-year/2023',
  '/api/questoes/stats',
  '/api/questoes/test-types',
  '/api/questoes/test/inteligencia',
];

// Função para fazer requisição HTTP
function makeRequest(url, method = 'GET', headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);

    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const responseBody = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: responseBody,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            body: data,
          });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (method === 'POST' && headers['Content-Type']?.includes('application/json')) {
      req.write(JSON.stringify({}));
    }

    req.end();
  });
}

// Função para testar rota sem autenticação
async function testRouteWithoutAuth(route, method = 'GET') {
  console.log(`🔍 Testando rota ${method} ${route} SEM autenticação...`);

  try {
    const response = await makeRequest(`${SERVER_URL}${route}`, method);

    if (response.status === 401) {
      console.log(`✅ PASSOU - Rota ${route} bloqueou acesso sem token (401)`);
      return { route, protected: true, status: response.status };
    } else if (response.status === 403) {
      console.log(`✅ PASSOU - Rota ${route} bloqueou acesso sem token (403)`);
      return { route, protected: true, status: response.status };
    } else {
      console.log(`❌ FALHOU - Rota ${route} permitiu acesso sem token (Status: ${response.status})`);
      console.log(`   Resposta:`, response.body);
      return { route, protected: false, status: response.status, body: response.body };
    }
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log(`❌ ERRO - Não foi possível conectar ao servidor em ${SERVER_URL}`);
      console.log(`   Certifique-se de que o servidor está rodando na porta 6001`);
      return { route, error: 'Connection refused', protected: null };
    } else {
      console.log(`❌ ERRO - Erro ao testar rota ${route}:`, error.message);
      return { route, error: error.message, protected: null };
    }
  }
}

// Função para testar rota pública
async function testPublicRoute(route, method = 'GET') {
  console.log(`🔍 Testando rota pública ${method} ${route}...`);

  try {
    const response = await makeRequest(`${SERVER_URL}${route}`, method);

    if (response.status >= 200 && response.status < 400) {
      console.log(`✅ PASSOU - Rota pública ${route} está acessível (Status: ${response.status})`);
      return { route, accessible: true, status: response.status };
    } else {
      console.log(`❌ FALHOU - Rota pública ${route} retornou erro (Status: ${response.status})`);
      return { route, accessible: false, status: response.status };
    }
  } catch (error) {
    console.log(`❌ ERRO - Erro ao testar rota pública ${route}:`, error.message);
    return { route, error: error.message, accessible: null };
  }
}

// Função principal de teste
async function runSecurityTests() {
  console.log('🛡️  INICIANDO VALIDAÇÃO DE SEGURANÇA DAS ROTAS');
  console.log('=' .repeat(60));

  const results = {
    protected: [],
    public: [],
    errors: [],
  };

  // Testar rotas que DEVEM estar protegidas
  console.log('\n🔒 TESTANDO ROTAS PROTEGIDAS (devem bloquear acesso sem token):');
  console.log('-'.repeat(60));

  for (const route of PROTECTED_ROUTES) {
    const method = route.includes('/responder') ? 'POST' : 'GET';
    const result = await testRouteWithoutAuth(route, method);
    results.protected.push(result);

    if (result.protected === false) {
      results.errors.push(`Rota crítica ${route} permite acesso sem autenticação!`);
    }
  }

  // Testar rotas que DEVEM ser públicas
  console.log('\n🌐 TESTANDO ROTAS PÚBLICAS (devem permitir acesso sem token):');
  console.log('-'.repeat(60));

  for (const route of PUBLIC_ROUTES) {
    const result = await testPublicRoute(route);
    results.public.push(result);

    if (result.accessible === false) {
      results.errors.push(`Rota pública ${route} está bloqueada indevidamente`);
    }
  }

  // Relatório final
  console.log('\n📊 RELATÓRIO DE VALIDAÇÃO DE SEGURANÇA');
  console.log('=' .repeat(60));

  const protectedCount = results.protected.filter(r => r.protected === true).length;
  const protectedTotal = results.protected.length;
  const publicCount = results.public.filter(r => r.accessible === true).length;
  const publicTotal = results.public.length;

  console.log(`🔒 Rotas protegidas funcionando: ${protectedCount}/${protectedTotal}`);
  console.log(`🌐 Rotas públicas acessíveis: ${publicCount}/${publicTotal}`);

  if (results.errors.length > 0) {
    console.log(`\n❌ VULNERABILIDADES DETECTADAS (${results.errors.length}):`);
    results.errors.forEach(error => console.log(`   - ${error}`));
  } else {
    console.log('\n✅ NENHUMA VULNERABILIDADE DETECTADA!');
    console.log('🎉 Todas as rotas críticas estão protegidas corretamente!');
  }

  return results;
}

// Executar testes se chamado diretamente
if (require.main === module) {
  runSecurityTests()
    .then((results) => {
      console.log('\n🏁 Testes de segurança concluídos.');

      // Sair com código de erro se houver vulnerabilidades
      if (results.errors.length > 0) {
        console.log('\n💥 VALIDAÇÃO FALHOU - Vulnerabilidades críticas encontradas!');
        process.exit(1);
      } else {
        console.log('\n🎉 VALIDAÇÃO PASSOU - Sistema seguro!');
        process.exit(0);
      }
    })
    .catch((error) => {
      console.error('\n💥 Erro crítico durante os testes:', error);
      process.exit(1);
    });
}

module.exports = { runSecurityTests, testRouteWithoutAuth, testPublicRoute };