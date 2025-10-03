// Script para testar diretamente o funcionamento da API

const http = require('http');

async function testDirectHTTP() {
  console.log('=== Teste Direto de HTTP para API ===');
  
  // Testar a rota raiz
  const options = {
    hostname: 'backend-pahg8frz6-fabricioslvs-projects.vercel.app',
    port: 443, // HTTPS
    path: '/',
    method: 'GET',
    headers: {
      'User-Agent': 'API Test Client'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Código de status: ${res.statusCode}`);
    console.log(`Headers: ${JSON.stringify(res.headers)}`);
    
    res.on('data', (chunk) => {
      console.log(`Corpo da resposta: ${chunk}`);
    });
    
    res.on('end', () => {
      console.log('Requisição concluída');
    });
  });

  req.on('error', (e) => {
    console.error(`Erro na requisição: ${e.message}`);
  });

  req.end();
}

// Executar o teste
testDirectHTTP();

// Vamos também testar uma rota específica de autenticação
console.log('\n=== Teste de Registro de Usuário ===');

const https = require('https');
const postData = JSON.stringify({
  nome: 'Teste API',
  email: `teste_api_${Date.now()}@exemplo.com`,
  senha: 'senha123'
});

const postOptions = {
  hostname: 'backend-pahg8frz6-fabricioslvs-projects.vercel.app',
  port: 443,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'API Test Client'
  }
};

const postReq = https.request(postOptions, (res) => {
  console.log(`Código de status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  res.on('data', (chunk) => {
    console.log(`Corpo da resposta: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('Requisição POST concluída');
  });
});

postReq.on('error', (e) => {
  console.error(`Erro na requisição POST: ${e.message}`);
});

postReq.write(postData);
postReq.end();