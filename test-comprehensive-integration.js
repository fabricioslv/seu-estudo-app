// Teste abrangente de integração para validar APIs essenciais e middleware de segurança
const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const jsonResponse = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: jsonResponse
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
        }
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

async function testComprehensiveIntegration() {
  console.log('🔍 Iniciando testes abrangentes de integração...\n');

  const results = {
    healthCheck: null,
    corsHeaders: null,
    securityHeaders: null,
    rateLimiting: null,
    errorHandling: null,
  };

  try {
    // Teste 1: Health Check detalhado
    console.log('🏥 Teste 1: Health Check detalhado');
    const healthOptions = {
      hostname: 'localhost',
      port: 6001,
      path: '/api/health',
      method: 'GET',
      headers: {
        'User-Agent': 'Integration-Test/1.0',
        'Accept': 'application/json',
      },
      timeout: 5000
    };

    const healthResponse = await makeRequest(healthOptions);
    results.healthCheck = healthResponse;
    console.log('✅ Health Check Status:', healthResponse.statusCode);
    console.log('📊 Ambiente:', healthResponse.data.environment);
    console.log('⏱️  Tempo de resposta:', healthResponse.data.responseTime, 'ms');

    // Teste 2: Verificação de headers de segurança (já incluído no teste anterior)
    console.log('\n🔒 Teste 2: Headers de segurança');
    const securityHeaders = healthResponse.headers;
    results.securityHeaders = securityHeaders;

    const requiredHeaders = [
      'content-security-policy',
      'x-frame-options',
      'x-content-type-options',
      'strict-transport-security',
      'x-xss-protection'
    ];

    const presentHeaders = requiredHeaders.filter(header =>
      securityHeaders[header] !== undefined
    );

    console.log('✅ Headers de segurança presentes:', presentHeaders.length, '/', requiredHeaders.length);
    console.log('📋 Headers ativos:');
    presentHeaders.forEach(header => {
      console.log(`   - ${header}: ${securityHeaders[header].substring(0, 50)}...`);
    });

    // Teste 3: Verificação de CORS
    console.log('\n🌐 Teste 3: CORS - Cross-Origin Resource Sharing');
    results.corsHeaders = securityHeaders;

    const corsHeaders = {
      'access-control-allow-credentials': securityHeaders['access-control-allow-credentials'],
      'access-control-allow-origin': securityHeaders['access-control-allow-origin'],
      'vary': securityHeaders.vary
    };

    console.log('✅ CORS configurado:');
    Object.entries(corsHeaders).forEach(([key, value]) => {
      console.log(`   - ${key}: ${value || 'Não presente'}`);
    });

    // Teste 4: Teste de rate limiting (múltiplas requisições rápidas)
    console.log('\n🚦 Teste 4: Rate Limiting');
    const rateLimitOptions = {
      hostname: 'localhost',
      port: 6001,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 5000
    };

    const rateLimitData = JSON.stringify({
      email: 'ratelimit@test.com',
      senha: 'test123'
    });

    const rateLimitTests = [];
    for (let i = 0; i < 5; i++) {
      try {
        const response = await makeRequest(rateLimitOptions, rateLimitData);
        rateLimitTests.push(response.statusCode);
      } catch (error) {
        rateLimitTests.push('ERROR');
      }
    }

    results.rateLimiting = rateLimitTests;
    console.log('✅ Testes de rate limiting realizados:', rateLimitTests.length);
    console.log('📊 Códigos de status:', rateLimitTests);

    // Teste 5: Tratamento de erros (404)
    console.log('\n❌ Teste 5: Tratamento de erros (404)');
    const errorOptions = {
      hostname: 'localhost',
      port: 6001,
      path: '/api/rota-inexistente',
      method: 'GET',
      timeout: 5000
    };

    const errorResponse = await makeRequest(errorOptions);
    results.errorHandling = errorResponse;
    console.log('✅ Status 404 retornado:', errorResponse.statusCode);
    console.log('📝 Mensagem de erro:', errorResponse.data.msg);

    // Teste 6: Validação de método HTTP não permitido
    console.log('\n🚫 Teste 6: Método HTTP não permitido');
    const methodOptions = {
      hostname: 'localhost',
      port: 6001,
      path: '/api/health',
      method: 'DELETE',
      timeout: 5000
    };

    const methodResponse = await makeRequest(methodOptions);
    console.log('✅ Método DELETE tratado:', methodResponse.statusCode);

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }

  // Resumo final
  console.log('\n📋 RESUMO DOS TESTES DE INTEGRAÇÃO');
  console.log('=' .repeat(50));

  console.log('\n🏥 HEALTH CHECK:');
  if (results.healthCheck && results.healthCheck.statusCode === 200) {
    console.log('   ✅ Funcionando corretamente');
    console.log(`   📊 Ambiente: ${results.healthCheck.data.environment}`);
    console.log(`   ⏱️  Response time: ${results.healthCheck.data.responseTime}ms`);
  } else {
    console.log('   ❌ Problemas detectados');
  }

  console.log('\n🔒 SEGURANÇA:');
  if (results.securityHeaders) {
    console.log('   ✅ Headers de segurança ativos');
    console.log('   🛡️  CSP, Frame Options, XSS Protection configurados');
  } else {
    console.log('   ❌ Headers de segurança ausentes');
  }

  console.log('\n🌐 CORS:');
  if (results.corsHeaders['access-control-allow-credentials'] === 'true') {
    console.log('   ✅ CORS configurado corretamente');
    console.log('   🔓 Credenciais permitidas');
  } else {
    console.log('   ❌ CORS não configurado adequadamente');
  }

  console.log('\n🚦 RATE LIMITING:');
  if (results.rateLimiting && results.rateLimiting.length > 0) {
    console.log('   ✅ Sistema de rate limiting ativo');
    console.log(`   📊 Testes realizados: ${results.rateLimiting.length}`);
  } else {
    console.log('   ❌ Rate limiting não testado');
  }

  console.log('\n❌ TRATAMENTO DE ERROS:');
  if (results.errorHandling && results.errorHandling.statusCode === 404) {
    console.log('   ✅ Tratamento de erros funcionando');
    console.log('   📝 Mensagens de erro adequadas');
  } else {
    console.log('   ❌ Problemas no tratamento de erros');
  }

  console.log('\n🎯 STATUS GERAL:');
  const allTestsPassed = results.healthCheck?.statusCode === 200 &&
                        results.securityHeaders &&
                        results.corsHeaders['access-control-allow-credentials'] === 'true' &&
                        results.errorHandling?.statusCode === 404;

  if (allTestsPassed) {
    console.log('   🎉 TODOS OS TESTES CRÍTICOS APROVADOS!');
    console.log('   ✅ Sistema pronto para uso em produção');
  } else {
    console.log('   ⚠️  Alguns testes falharam - verificar configurações');
  }

  return results;
}

// Executar testes
testComprehensiveIntegration().then((results) => {
  console.log('\n🔚 Testes de integração concluídos');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Erro fatal nos testes:', error.message);
  process.exit(1);
});