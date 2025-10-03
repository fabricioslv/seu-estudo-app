// Script para testar a API usando fetch do Node.js

async function testFetchAPI() {
  console.log('=== Teste de API com Fetch ===');
  
  // Testar a rota raiz
  try {
    console.log('Testando rota raiz...');
    const response = await fetch('https://backend-pahg8frz6-fabricioslvs-projects.vercel.app/');
    console.log(`Status: ${response.status}`);
    const data = await response.text();
    console.log(`Resposta: ${data}`);
  } catch (error) {
    console.error('Erro ao testar rota raiz:', error.message);
  }
  
  console.log('\\nTestando rota de registro...');
  try {
    const response = await fetch('https://backend-pahg8frz6-fabricioslvs-projects.vercel.app/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nome: 'Teste API',
        email: `teste_api_${Date.now()}@exemplo.com`,
        senha: 'senha123'
      })
    });
    
    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log(`Resposta:`, data);
  } catch (error) {
    console.error('Erro ao testar rota de registro:', error.message);
  }
}

// Executar o teste
testFetchAPI().catch(console.error);