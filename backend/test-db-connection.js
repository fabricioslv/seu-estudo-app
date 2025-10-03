// Teste de conexão com banco Supabase
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function testConnection() {
  try {
    console.log('🔍 Testando conexão com Supabase...');

    const client = await pool.connect();
    console.log('✅ Conexão estabelecida com sucesso!');

    // Testar uma query simples
    const result = await client.query('SELECT NOW() as current_time');
    console.log('📅 Hora atual do servidor:', result.rows[0].current_time);

    // Verificar se as tabelas existem
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    console.log('📋 Tabelas encontradas:');
    tablesResult.rows.forEach((row) => {
      console.log(`  - ${row.table_name}`);
    });

    client.release();
    console.log('✅ Teste de conexão concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
    console.error('🔧 Verifique as configurações do banco de dados');
  } finally {
    await pool.end();
  }
}

testConnection();
