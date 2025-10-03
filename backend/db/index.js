// db/index.js - Configuração da conexão com o PostgreSQL
const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error(
    '!!! A variável de ambiente DATABASE_URL não está definida no arquivo .env'
  );
  console.error(
    '!!! Exemplo: DATABASE_URL="postgresql://usuario:senha@localhost:5432/seu_estudo_db"'
  );
  process.exit(1);
}

const pool = new Pool({
  connectionString,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};
