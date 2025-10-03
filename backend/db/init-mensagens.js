const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const db = require('./index');

async function initMensagens() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS mensagens (
        id SERIAL PRIMARY KEY,
        remetente_id UUID REFERENCES auth.users(id) NOT NULL,
        destinatario_id UUID REFERENCES auth.users(id) NOT NULL,
        conteudo TEXT NOT NULL,
        data_envio TIMESTAMPTZ DEFAULT now(),
        lida BOOLEAN DEFAULT false
      );
    `);
    console.log('Tabela "mensagens" criada ou já existente.');
  } catch (error) {
    console.error('Erro ao criar tabela "mensagens":', error);
    throw error;
  }
}

// Exporta a função para que possa ser chamada por outros scripts
module.exports = { initMensagens };

// Se o script for executado diretamente, chama a função
if (require.main === module) {
  initMensagens().catch((err) => {
    console.error('Erro ao inicializar o banco de dados de mensagens:', err);
    process.exit(1);
  });
}
