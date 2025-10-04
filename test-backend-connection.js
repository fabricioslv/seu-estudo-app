// Arquivo de teste simples para validar conexão com backend
const http = require('http');

const testConnection = () => {
  const options = {
    hostname: 'localhost',
    port: 6001,
    path: '/api/health',
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Status: ${res.statusCode}`);
    console.log(`📊 Headers:`, res.headers);

    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log(`🔍 Resposta da API:`, JSON.stringify(response, null, 2));
      } catch (e) {
        console.log(`📄 Resposta não-JSON:`, data);
      }
    });
  });

  req.on('error', (err) => {
    console.error(`❌ Erro de conexão:`, err.message);
    console.error(`🔍 Possíveis causas:`);
    console.error(`   - Servidor não está rodando na porta 6001`);
    console.error(`   - Problemas de configuração do banco de dados`);
    console.error(`   - Middleware de segurança bloqueando a requisição`);
  });

  req.on('timeout', () => {
    console.error(`⏰ Timeout na conexão`);
    req.destroy();
  });

  req.end();
};

// Executar teste
console.log(`🔍 Testando conexão com backend na porta 6001...`);
testConnection();