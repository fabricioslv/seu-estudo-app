// Script para testar a API do backend e verificar o estado do banco de dados

const axios = require('axios');

// URL do backend em produção
const BACKEND_URL = 'https://backend-pahg8frz6-fabricioslvs-projects.vercel.app';

async function testAPI() {
  try {
    console.log('=== Testando API do Backend ===');
    console.log(`URL base: ${BACKEND_URL}\n`);

    // Testar rota de estatísticas de questões
    console.log('1. Testando estatísticas de questões...');
    try {
      const statsResponse = await axios.get(`${BACKEND_URL}/api/questoes/stats`);
      console.log('✓ Estatísticas de questões:', statsResponse.data);
    } catch (error) {
      console.log('✗ Erro nas estatísticas de questões:', error.message);
    }

    // Testar rota de estatísticas de livros didáticos
    console.log('\n2. Testando estatísticas de livros didáticos...');
    try {
      const livrosStatsResponse = await axios.get(`${BACKEND_URL}/api/questoes/estatisticas-livros`);
      console.log('✓ Estatísticas de livros didáticos:', livrosStatsResponse.data);
    } catch (error) {
      console.log('✗ Erro nas estatísticas de livros didáticos:', error.message);
    }

    // Testar rota de arquivos disponíveis para extração
    console.log('\n3. Testando arquivos disponíveis para extração...');
    try {
      const filesResponse = await axios.get(`${BACKEND_URL}/api/questoes/available-files`);
      console.log('✓ Arquivos disponíveis:', filesResponse.data);
    } catch (error) {
      console.log('✗ Erro nos arquivos disponíveis:', error.message);
    }

    // Testar rota para obter tipos de testes (para verificar funcionamento geral)
    console.log('\n4. Testando tipos de testes...');
    try {
      const testTypesResponse = await axios.get(`${BACKEND_URL}/api/questoes/test-types`);
      console.log('✓ Tipos de testes:', testTypesResponse.data);
    } catch (error) {
      console.log('✗ Erro nos tipos de testes:', error.message);
    }

    // Testar rota para buscar questões por matéria (ex: Matemática)
    console.log('\n5. Testando busca de questões por matéria...');
    try {
      const mathQuestionsResponse = await axios.get(`${BACKEND_URL}/api/questoes/by-subject/Matemática`);
      console.log('✓ Questões de Matemática:', mathQuestionsResponse.data);
    } catch (error) {
      console.log('✗ Erro na busca de questões de Matemática:', error.message);
    }

    // Testar rota para buscar questões por ano (ex: 2020)
    console.log('\n6. Testando busca de questões por ano...');
    try {
      const yearQuestionsResponse = await axios.get(`${BACKEND_URL}/api/questoes/by-year/2020`);
      console.log('✓ Questões do ano 2020:', yearQuestionsResponse.data);
    } catch (error) {
      console.log('✗ Erro na busca de questões do ano 2020:', error.message);
    }

    console.log('\n=== Teste da API concluído ===');
  } catch (error) {
    console.error('Erro geral no teste da API:', error.message);
  }
}

// Executar o teste
testAPI();