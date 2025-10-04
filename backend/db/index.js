// db/index.js - Configuração da conexão com o PostgreSQL
import { Pool } from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
  // Configurações adicionais para melhor monitoramento
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000, // tempo limite de conexão ociosa
  connectionTimeoutMillis: 5000, // timeout para estabelecer conexão
  acquireTimeoutMillis: 10000, // timeout para adquirir conexão do pool
});

// Monitoramento de eventos do pool de conexão
pool.on('connect', (client) => {
  console.log('Nova conexão com o banco de dados estabelecida');
});

pool.on('error', (err, client) => {
  console.error('Erro inesperado no pool de conexão:', err);
});

pool.on('remove', (client) => {
  console.log('Conexão removida do pool');
});

// Função para testar conexão com o banco de dados
const testConnection = async () => {
  let client;
  const startTime = Date.now();

  console.log('🔍 DIAGNÓSTICO: Iniciando teste de conexão com banco...');

  try {
    client = await pool.connect();
    console.log('🔍 DIAGNÓSTICO: Cliente conectado ao pool com sucesso');

    // Teste básico de conectividade
    const result = await client.query(
      'SELECT NOW() as current_time, version() as version'
    );
    const responseTime = Date.now() - startTime;

    return {
      success: true,
      responseTime,
      data: {
        currentTime: result.rows[0].current_time,
        version: result.rows[0].version,
        connectionCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount,
      },
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      responseTime,
      error: error.message,
      code: error.code,
    };
  } finally {
    if (client) {
      client.release();
    }
  }
};

// Função para obter estatísticas do pool de conexão
const getPoolStats = () => {
  return {
    totalConnections: pool.totalCount,
    idleConnections: pool.idleCount,
    waitingClients: pool.waitingCount,
    maxConnections: pool.options.max,
  };
};

// Função para verificar saúde das tabelas principais
const checkDatabaseHealth = async () => {
  const healthResults = {};
  const startTime = Date.now();

  const tables = [
    'usuarios',
    'questoes',
    'livros',
    'simulados',
    'notas',
    'mensagens',
    'notificacoes',
    'tutoria',
  ];

  for (const table of tables) {
    try {
      const result = await pool.query(`
        SELECT
          COUNT(*) as record_count,
          pg_size_pretty(pg_total_relation_size('${table}')) as table_size
        FROM ${table}
      `);

      healthResults[table] = {
        status: 'healthy',
        recordCount: parseInt(result.rows[0].record_count),
        size: result.rows[0].table_size,
      };
    } catch (error) {
      healthResults[table] = {
        status: 'error',
        error: error.message,
      };
    }
  }

  return {
    overallHealth: Object.values(healthResults).every(
      (r) => r.status === 'healthy'
    )
      ? 'healthy'
      : 'warning',
    totalResponseTime: Date.now() - startTime,
    tables: healthResults,
  };
};

const query = (text, params) => pool.query(text, params);

export {
  query,
  pool,
  testConnection,
  getPoolStats,
  checkDatabaseHealth,
};
