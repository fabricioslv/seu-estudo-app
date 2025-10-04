// Arquivo de diagnóstico para validação do banco de dados
// Este arquivo foi criado para validar sistematicamente a conexão com banco

console.log('=== DIAGNÓSTICO DE VALIDAÇÃO - BANCO DE DADOS ===');
console.log('1. Verificando configuração do projeto...');

try {
  const packageJson = require('./package.json');
  console.log('Type definido no package.json:', packageJson.type || 'commonjs');
  console.log('Node.js version:', process.version);
  console.log('Arquivo atual sendo executado:', __filename);

  console.log('2. Verificando variáveis de ambiente...');
  require('dotenv').config({ path: './.env' });

  console.log('DATABASE_URL configurada:', !!process.env.DATABASE_URL);
  console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
  console.log('Diretório atual:', process.cwd());

  if (!process.env.DATABASE_URL) {
    console.error('ERRO: DATABASE_URL não configurada!');
    process.exit(1);
  }

  console.log('3. Testando conexão com banco de dados...');

  // Teste básico de conexão
  const { Pool } = require('pg');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 2,
    idleTimeoutMillis: 5000,
    connectionTimeoutMillis: 5000,
  });

  console.log('Tentando conectar ao banco...');

  const startTime = Date.now();
  pool.query('SELECT NOW() as current_time, version() as version', (err, result) => {
    const responseTime = Date.now() - startTime;

    if (err) {
      console.error('ERRO na conexão:', err.message);
      console.error('Código do erro:', err.code);
      console.error('Detalhes:', err.detail);

      // Possíveis causas específicas
      if (err.code === 'ECONNREFUSED') {
        console.error('DIAGNÓSTICO: Banco de dados não está acessível na porta especificada');
      } else if (err.code === 'ENOTFOUND') {
        console.error('DIAGNÓSTICO: Host do banco não encontrado');
      } else if (err.code === '42P01') {
        console.error('DIAGNÓSTICO: Tabelas não existem no banco');
      }

      process.exit(1);
    } else {
      console.log('✅ Conexão estabelecida com sucesso!');
      console.log('Tempo de resposta:', responseTime, 'ms');
      console.log('Versão do PostgreSQL:', result.rows[0].version);
      console.log('Hora atual do servidor:', result.rows[0].current_time);

      // Teste adicional: verificar tabelas existentes
      console.log('4. Verificando tabelas existentes...');
      pool.query(`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
      `, (err, tables) => {
        if (err) {
          console.error('Erro ao listar tabelas:', err.message);
        } else {
          console.log('Tabelas encontradas:');
          tables.rows.forEach(table => {
            console.log('  -', table.table_name);
          });
        }

        pool.end(() => {
          console.log('✅ Teste de diagnóstico concluído com sucesso!');
          process.exit(0);
        });
      });
    }
  });

} catch (error) {
  console.error('ERRO GERAL no diagnóstico:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}
