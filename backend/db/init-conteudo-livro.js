const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const db = require('./index');

async function initConteudoLivro() {
  try {
    await db.query(`
      DROP TABLE IF EXISTS conteudo_livro CASCADE;
    `);
    console.log(
      'Tabela "conteudo_livro" removida (substituída por esquema granular).'
    );
  } catch (error) {
    console.error('Erro ao remover tabela "conteudo_livro":', error);
    throw error;
  }
}

if (require.main === module) {
  initConteudoLivro().catch((err) => {
    console.error(
      'Erro ao inicializar o banco de dados de conteúdo de livros:',
      err
    );
    process.exit(1);
  });
}

module.exports = { initConteudoLivro };
