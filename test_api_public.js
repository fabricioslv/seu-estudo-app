// Script para testar as rotas públicas da API do backend

const axios = require('axios');

// URL do backend em produção
const BACKEND_URL = 'https://backend-pahg8frz6-fabricioslvs-projects.vercel.app';

async function testPublicAPI() {
  try {
    console.log('=== Testando Rotas Públicas da API do Backend ===');
    console.log(`URL base: ${BACKEND_URL}\n`);

    // Testar rota raiz
    console.log('1. Testando rota raiz...');
    try {
      const rootResponse = await axios.get(`${BACKEND_URL}/`);
      console.log('✓ Resposta da rota raiz:', rootResponse.data);
    } catch (error) {
      console.log('✗ Erro na rota raiz:', error.message);
    }

    // Testar rota de autenticação (registro)
    console.log('\n2. Testando rota de registro de usuário...');
    try {
      const registerResponse = await axios.post(`${BACKEND_URL}/api/auth/register`, {
        nome: 'Teste API',
        email: `teste_api_${Date.now()}@exemplo.com`,
        senha: 'senha123'
      });
      console.log('✓ Registro de usuário:', registerResponse.data);
      // Armazenar o token para uso em rotas protegidas
      const token = registerResponse.data.token;
      console.log('Token obtido para testes futuros');
      
      // Testar login com o usuário criado
      console.log('\n3. Testando rota de login...');
      const loginResponse = await axios.post(`${BACKEND_URL}/api/auth/login`, {
        email: `teste_api_${Date.now() - 1000}@exemplo.com`, // Usar um email diferente para login
        senha: 'senha123'
      });
      console.log('✓ Login:', loginResponse.data);
      
    } catch (error) {
      console.log('✗ Erro no registro/login:', error.message);
    }

    // Testar rota para obter tipos de testes (possivelmente pública)
    console.log('\n4. Testando tipos de testes...');
    try {
      const testTypesResponse = await axios.get(`${BACKEND_URL}/api/questoes/test-types`);
      console.log('✓ Tipos de testes:', testTypesResponse.data);
    } catch (error) {
      console.log('✗ Erro nos tipos de testes:', error.message);
    }

    // Testar rota para obter um teste específico (possivelmente pública)
    console.log('\n5. Testando obtenção de teste específico...');
    try {
      const testeResponse = await axios.get(`${BACKEND_URL}/api/questoes/test/personalidade`);
      console.log('✓ Obtenção de teste:', testeResponse.data);
    } catch (error) {
      console.log('✗ Erro na obtenção de teste:', error.message);
    }

    console.log('\n=== Teste de Rotas Públicas concluído ===');
  } catch (error) {
    console.error('Erro geral no teste de rotas públicas:', error.message);
  }
}

// Executar o teste
testPublicAPI();