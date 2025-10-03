const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const db = require('./index');

async function initNotas() {
  try {
    // Tabela para as avaliações criadas pelos professores
    await db.query(`
      CREATE TABLE IF NOT EXISTS avaliacoes (
        id SERIAL PRIMARY KEY,
        professor_id UUID REFERENCES auth.users(id) NOT NULL,
        titulo VARCHAR(255) NOT NULL,
        descricao TEXT,
        data_criacao TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log('Tabela "avaliacoes" criada ou já existente.');

    // Tabela para as notas dos alunos em cada avaliação
    await db.query(`
      CREATE TABLE IF NOT EXISTS notas (
        id SERIAL PRIMARY KEY,
        avaliacao_id INTEGER REFERENCES avaliacoes(id) ON DELETE CASCADE NOT NULL,
        aluno_id UUID REFERENCES auth.users(id) NOT NULL,
        nota NUMERIC(5, 2) NOT NULL CHECK (nota >= 0),
        comentario TEXT,
        data_lancamento TIMESTAMPTZ DEFAULT now(),
        UNIQUE(avaliacao_id, aluno_id) -- Garante que um aluno só tenha uma nota por avaliação
      );
    `);
    console.log('Tabela "notas" criada ou já existente.');
  } catch (error) {
    console.error('Erro ao criar tabelas do sistema de notas:', error);
    throw error;
  }
}

// Exporta a função para que possa ser chamada por outros scripts
module.exports = { initNotas };

// Se o script for executado diretamente, chama a função
if (require.main === module) {
  initNotas().catch((err) => {
    console.error('Erro ao inicializar o banco de dados de notas:', err);
    process.exit(1);
  });
}
