const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const db = require('./index');

async function initQuestoes() {
  try {
    await db.query(`
      DROP TABLE IF EXISTS questoes CASCADE;
      CREATE TABLE questoes (
        id SERIAL PRIMARY KEY,
        conteudo_id INTEGER REFERENCES conteudos(id) ON DELETE CASCADE,
        topico_id INTEGER REFERENCES topicos(id) ON DELETE CASCADE,
        capitulo_id INTEGER REFERENCES capitulos(id) ON DELETE CASCADE,
        livro_id INTEGER REFERENCES livros(id) ON DELETE CASCADE NOT NULL,
        enunciado TEXT NOT NULL,
        alternativas JSONB, -- Armazena alternativas como JSON (ex: {a: "Opcao A", b: "Opcao B"})
        resposta_correta VARCHAR(10),
        explicacao TEXT,
        tipo VARCHAR(50), -- objetiva, discursiva
        ano INTEGER,
        fonte VARCHAR(255),
        data_cadastro TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log('Tabela "questoes" criada ou já existente.');
  } catch (error) {
    console.error('Erro ao criar tabela "questoes":', error);
    throw error;
  }
}

if (require.main === module) {
  initQuestoes().catch((err) => {
    console.error('Erro ao inicializar o banco de dados de questões:', err);
    process.exit(1);
  });
}

module.exports = { initQuestoes };
