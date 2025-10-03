const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const db = require('./index');

async function initCapitulos() {
  try {
    await db.query(`
      DROP TABLE IF EXISTS capitulos CASCADE;
      CREATE TABLE capitulos (
        id SERIAL PRIMARY KEY,
        livro_id INTEGER REFERENCES livros(id) ON DELETE CASCADE NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        numero VARCHAR(50), -- Pode ser I, II, 1, 2, etc.
        resumo TEXT,
        pagina_inicial INTEGER,
        pagina_final INTEGER,
        data_cadastro TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log('Tabela "capitulos" criada ou já existente.');
  } catch (error) {
    console.error('Erro ao criar tabela "capitulos":', error);
    throw error;
  }
}

if (require.main === module) {
  initCapitulos().catch((err) => {
    console.error('Erro ao inicializar o banco de dados de capítulos:', err);
    process.exit(1);
  });
}

module.exports = { initCapitulos };
