const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const db = require('./index');

async function initLivros() {
  try {
    await db.query(`
      DROP TABLE IF EXISTS livros CASCADE;
      CREATE TABLE livros (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(255) NOT NULL,
        autor VARCHAR(255),
        ano INTEGER,
        area VARCHAR(100),
        arquivo_pdf VARCHAR(255) UNIQUE NOT NULL,
        capa_url VARCHAR(255),
        data_cadastro TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log('Tabela "livros" criada ou já existente.');
  } catch (error) {
    console.error('Erro ao criar tabela "livros":', error);
    throw error;
  }
}

if (require.main === module) {
  initLivros().catch((err) => {
    console.error('Erro ao inicializar o banco de dados de livros:', err);
    process.exit(1);
  });
}

module.exports = { initLivros };
