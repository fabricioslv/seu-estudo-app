const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const db = require('./index');

async function initTutoria() {
  try {
    // Tabela para perfis de tutores
    await db.query(`
      CREATE TABLE IF NOT EXISTS tutores (
        id SERIAL PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
        bio TEXT,
        materias TEXT[],
        disponibilidade JSONB,
        avg_rating NUMERIC(3, 2) DEFAULT 0
      );
    `);
    console.log('Tabela "tutores" criada ou já existente.');

    // Tabela para as sessões de tutoria
    await db.query(`
      CREATE TABLE IF NOT EXISTS sessoes_tutoria (
        id SERIAL PRIMARY KEY,
        tutor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        aluno_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        materia VARCHAR(100) NOT NULL,
        horario_solicitado TIMESTAMPTZ NOT NULL,
        status VARCHAR(50) DEFAULT 'pendente', -- pendente, aceita, recusada, concluida, cancelada
        rating_aluno INTEGER CHECK (rating_aluno >= 1 AND rating_aluno <= 5),
        comentario_aluno TEXT,
        rating_tutor INTEGER CHECK (rating_tutor >= 1 AND rating_tutor <= 5),
        comentario_tutor TEXT,
        data_criacao TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log('Tabela "sessoes_tutoria" criada ou já existente.');
  } catch (error) {
    console.error('Erro ao criar tabelas do sistema de tutoria:', error);
    throw error;
  }
}

if (require.main === module) {
  initTutoria().catch((err) => {
    console.error('Erro ao inicializar o banco de dados de tutoria:', err);
    process.exit(1);
  });
}

module.exports = { initTutoria };
