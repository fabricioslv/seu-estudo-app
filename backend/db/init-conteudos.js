const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const db = require('./index');

async function initConteudos() {
  try {
    await db.query(`
      DROP TABLE IF EXISTS conteudos CASCADE;
      CREATE TABLE conteudos (
        id SERIAL PRIMARY KEY,
        topico_id INTEGER REFERENCES topicos(id) ON DELETE CASCADE,
        capitulo_id INTEGER REFERENCES capitulos(id) ON DELETE CASCADE,
        livro_id INTEGER REFERENCES livros(id) ON DELETE CASCADE NOT NULL,
        tipo VARCHAR(50) NOT NULL, -- teoria, exemplo, resumo, exercicio, mapa_mental, etc.
        texto TEXT,
        imagens_url TEXT[], -- Array de URLs para imagens
        pagina_inicial INTEGER,
        pagina_final INTEGER,
        data_cadastro TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log('Tabela "conteudos" criada ou já existente.');
  } catch (error) {
    console.error('Erro ao criar tabela "conteudos":', error);
    throw error;
  }
}

if (require.main === module) {
  initConteudos().catch((err) => {
    console.error('Erro ao inicializar o banco de dados de conteúdos:', err);
    process.exit(1);
  });
}

module.exports = { initConteudos };
