// scripts/init-gamification-db.js
// Script para inicializar o banco de dados com todas as tabelas, incluindo gamificação

require('dotenv').config({ path: './.env' });
const db = require('../db');

// Consulta SQL para criar todas as tabelas necessárias
const createTablesQuery = `
  -- Tabelas principais
  CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    facebook_id VARCHAR(255) UNIQUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS questoes (
    id SERIAL PRIMARY KEY,
    numero INTEGER NOT NULL,
    enunciado TEXT NOT NULL,
    alternativas JSONB NOT NULL,
    resposta_correta CHAR(1),
    explicacao TEXT,
    materia VARCHAR(100),
    ano_vestibular INTEGER,
    origem VARCHAR(100)
  );

  -- Tabela para armazenar respostas dos usuários às questões
  CREATE TABLE IF NOT EXISTS respostas_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    questao_id INTEGER REFERENCES questoes(id) ON DELETE CASCADE,
    resposta_usuario CHAR(1),
    esta_correta BOOLEAN,
    tempo_resposta INTEGER, -- Tempo em segundos
    data_resposta TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS simulados (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_fim TIMESTAMP,
    status VARCHAR(50)
  );

  CREATE TABLE IF NOT EXISTS resultados_simulado (
    id SERIAL PRIMARY KEY,
    simulado_id INTEGER REFERENCES simulados(id) ON DELETE CASCADE,
    questao_id INTEGER REFERENCES questoes(id) ON DELETE CASCADE,
    resposta_usuario CHAR(1),
    foi_correta BOOLEAN
  );

  -- Tabela para armazenar conquistas/troféus
  CREATE TABLE IF NOT EXISTS conquistas (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    icone VARCHAR(100), -- Caminho ou nome do ícone
    pontos_requeridos INTEGER DEFAULT 0,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela para armazenar pontos do usuário por tipo
  CREATE TABLE IF NOT EXISTS pontos_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_ponto VARCHAR(50) DEFAULT 'geral', -- 'geral', 'estudo', 'simulado', etc.
    pontos INTEGER DEFAULT 0,
    nivel INTEGER DEFAULT 1,
    experiencia INTEGER DEFAULT 0,
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela para rastrear conquistas obtidas pelos usuários
  CREATE TABLE IF NOT EXISTS conquistas_usuario (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    conquista_id INTEGER REFERENCES conquistas(id) ON DELETE CASCADE,
    data_obtencao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id, conquista_id) -- Evita duplicação
  );

  -- Tabela para armazenar ranking entre usuários
  CREATE TABLE IF NOT EXISTS ranking (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    posicao INTEGER,
    pontos_totais INTEGER DEFAULT 0,
    ultima_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    periodo VARCHAR(20) DEFAULT 'geral' -- 'geral', 'mensal', 'semanal'
  );

  -- Tabela para armazenar desafios entre usuários
  CREATE TABLE IF NOT EXISTS desafios (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    tipo VARCHAR(50) DEFAULT 'questoes', -- 'questoes', 'simulado', 'tempo', etc.
    criador_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    questoes_ids INTEGER[], -- Array de IDs das questões do desafio
    data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_fim TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ativo', -- 'ativo', 'concluido', 'expirado'
    pontos_recompensa INTEGER DEFAULT 10
  );

  -- Tabela para armazenar participações em desafios
  CREATE TABLE IF NOT EXISTS participacoes_desafio (
    id SERIAL PRIMARY KEY,
    desafio_id INTEGER REFERENCES desafios(id) ON DELETE CASCADE,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_fim TIMESTAMP,
    pontuacao_obtida INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'ativo', -- 'ativo', 'concluido', 'desistencia'
    UNIQUE(desafio_id, usuario_id) -- Um usuário só pode participar uma vez
  );

  -- Inserir conquistas padrão apenas se não existirem
  INSERT INTO conquistas (nome, descricao, icone, pontos_requeridos) 
  SELECT 'Primeiros Passos', 'Complete sua primeira questão', 'step', 1
  WHERE NOT EXISTS (SELECT 1 FROM conquistas WHERE nome = 'Primeiros Passos');
  
  INSERT INTO conquistas (nome, descricao, icone, pontos_requeridos) 
  SELECT 'Aprendiz', 'Resolva 10 questões', 'student', 10
  WHERE NOT EXISTS (SELECT 1 FROM conquistas WHERE nome = 'Aprendiz');
  
  INSERT INTO conquistas (nome, descricao, icone, pontos_requeridos) 
  SELECT 'Estudioso', 'Resolva 50 questões', 'book', 50
  WHERE NOT EXISTS (SELECT 1 FROM conquistas WHERE nome = 'Estudioso');
  
  INSERT INTO conquistas (nome, descricao, icone, pontos_requeridos) 
  SELECT 'Maratonista', 'Resolva 100 questões', 'marathon', 100
  WHERE NOT EXISTS (SELECT 1 FROM conquistas WHERE nome = 'Maratonista');
  
  INSERT INTO conquistas (nome, descricao, icone, pontos_requeridos) 
  SELECT 'Simulador', 'Complete seu primeiro simulado', 'exam', 5
  WHERE NOT EXISTS (SELECT 1 FROM conquistas WHERE nome = 'Simulador');
  
  INSERT INTO conquistas (nome, descricao, icone, pontos_requeridos) 
  SELECT 'Perfeito', 'Obtenha 100% de acerto em um simulado', 'perfect', 20
  WHERE NOT EXISTS (SELECT 1 FROM conquistas WHERE nome = 'Perfeito');
  
  INSERT INTO conquistas (nome, descricao, icone, pontos_requeridos) 
  SELECT 'Velocista', 'Resolva uma questão em menos de 30 segundos', 'fast', 5
  WHERE NOT EXISTS (SELECT 1 FROM conquistas WHERE nome = 'Velocista');
  
  INSERT INTO conquistas (nome, descricao, icone, pontos_requeridos) 
  SELECT 'Conquistador', 'Obtenha 5 conquistas diferentes', 'conqueror', 15
  WHERE NOT EXISTS (SELECT 1 FROM conquistas WHERE nome = 'Conquistador');
  
  INSERT INTO conquistas (nome, descricao, icone, pontos_requeridos) 
  SELECT 'Mestre', 'Alcance o nível 10', 'master', 0
  WHERE NOT EXISTS (SELECT 1 FROM conquistas WHERE nome = 'Mestre');
  
  INSERT INTO conquistas (nome, descricao, icone, pontos_requeridos) 
  SELECT 'Dedicação', 'Estude por 10 horas', 'dedication', 25
  WHERE NOT EXISTS (SELECT 1 FROM conquistas WHERE nome = 'Dedicação');
`;

async function initializeDB() {
  console.log('Iniciando a criação/atualização das tabelas...');

  try {
    // Executar as consultas para criar tabelas
    await db.query(createTablesQuery);
    console.log(
      '✅ Todas as tabelas criadas/atualizadas com sucesso (ou já existentes).'

    // Verificar se as tabelas foram criadas corretamente
    const tables = [
      'usuarios',
      'questoes',
      'respostas_usuario',
      'simulados',
      'resultados_simulado',
      'conquistas',
      'pontos_usuario',
      'conquistas_usuario',
      'ranking',
      'desafios',
      'participacoes_desafio',
    ];

    console.log('\n📊 Verificando tabelas criadas:');
    for (const table of tables) {
      const result = await db.query(
        "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1) as exists",
        [table]
      );
      console.log(`   ${result.rows[0].exists ? '✅' : '❌'} ${table}`);
    }

    // Contar conquistas
    const conquistasResult = await db.query(
      'SELECT COUNT(*) as count FROM conquistas'
    );
    console.log(
      `\n🎁 Total de conquistas padrão: ${conquistasResult.rows[0].count}`

    console.log('\n🎉 Banco de dados inicializado com sucesso!');
    console.log('\n📋 Próximos passos:');
    console.log('   - Iniciar o servidor backend: node index.js');
    console.log('   - Iniciar o frontend: cd frontend && npm start');
    console.log('   - Acesse a API em: http://localhost:6001/api');
    console.log(
      '   - Novas rotas de gamificação disponíveis em: http://localhost:6001/api/gamificacao'

  } catch (err) {
    console.error('❌ Erro ao criar as tabelas:', err);
    process.exit(1);
  } finally {
    // Fechar a conexão do pool
    const pool = db.pool || require('pg').Pool;
    if (pool && typeof pool.end === 'function') {
      await pool.end();
    }
  }
}

// Executar a função se este script for chamado diretamente
if (require.main === module) {
  initializeDB();
}

module.exports = initializeDB;
