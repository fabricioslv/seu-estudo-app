const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const db = require('./index');

async function initNotificacoes() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS notificacoes (
        id SERIAL PRIMARY KEY,
        usuario_id UUID REFERENCES auth.users(id) NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        conteudo TEXT NOT NULL,
        link VARCHAR(255),
        lida BOOLEAN DEFAULT false,
        data_criacao TIMESTAMPTZ DEFAULT now()
      );
    `);
    console.log('Tabela "notificacoes" criada ou já existente.');
  } catch (error) {
    console.error('Erro ao criar tabela "notificacoes":', error);
    throw error;
  }
}

// Exporta a função para que possa ser chamada por outros scripts
module.exports = { initNotificacoes };

// Se o script for executado diretamente, chama a função
if (require.main === module) {
  initNotificacoes().catch((err) => {
    console.error('Erro ao inicializar o banco de dados de notificações:', err);
    process.exit(1);
  });
}
