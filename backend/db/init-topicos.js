const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const db = require('./index');

async function initTopicos() {
  try {
    await db.query(`
      DROP TABLE IF EXISTS topicos CASCADE;
      CREATE TABLE topicos (
        id SERIAL PRIMARY KEY,
        capitulo_id INTEGER REFERENCES capitulos(id) ON DELETE CASCADE NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT,
        pagina_inicial INTEGER,
        pagina_final INTEGER,
        data_cadastro TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log('Tabela "topicos" criada ou já existente.');
  } catch (error) {
    console.error('Erro ao criar tabela "topicos":', error);
    throw error;
  }
}

if (require.main === module) {
  initTopicos().catch((err) => {
    console.error('Erro ao inicializar o banco de dados de tópicos:', err);
    process.exit(1);
  });
}

module.exports = { initTopicos };
