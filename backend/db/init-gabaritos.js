const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const db = require('./index');

async function initGabaritos() {
  try {
    await db.query(`
      DROP TABLE IF EXISTS gabaritos CASCADE;
      CREATE TABLE gabaritos (
        id SERIAL PRIMARY KEY,
        questao_id INTEGER REFERENCES questoes(id) ON DELETE CASCADE NOT NULL,
        alternativa_correta VARCHAR(10) NOT NULL,
        explicacao TEXT,
        data_cadastro TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log('Tabela "gabaritos" criada ou já existente.');
  } catch (error) {
    console.error('Erro ao criar tabela "gabaritos":', error);
    throw error;
  }
}

if (require.main === module) {
  initGabaritos().catch((err) => {
    console.error('Erro ao inicializar o banco de dados de gabaritos:', err);
    process.exit(1);
  });
}

module.exports = { initGabaritos };
