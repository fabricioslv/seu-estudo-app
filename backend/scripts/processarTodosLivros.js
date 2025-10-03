// scripts/processarTodosLivros.js
// Script para processar todos os livros didáticos

require('dotenv').config({ path: './.env' });
const ProcessadorLivros = require('../services/processadorLivrosDidaticos');

async function main() {
  try {
    console.log('=== PROCESSADOR DE LIVROS DIDÁTICOS ===');
    console.log('Iniciando processamento de todos os livros...\n');

    // Processar todos os livros
    const resultado = await ProcessadorLivros.processarTodosLivros(true);

    console.log('\n=== RESULTADO FINAL ===');
    console.log(resultado.relatorio.resumo);
    console.log(resultado.relatorio.detalhes);

    console.log('\nProcessamento concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('\n=== ERRO FATAL ===');
    console.error('Erro durante o processamento:', error);
    process.exit(1);
  }
}

// Se este script for executado diretamente
if (require.main === module) {
  main();
}

module.exports = main;
