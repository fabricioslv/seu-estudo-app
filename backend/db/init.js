// db/init.js - Script para inicializar o banco de dados com as tabelas
require('dotenv').config({ path: './.env' }); // Carrega as variáveis de ambiente

const db = require('./index');
const { initAllContentDb } = require('./init-all-content-db.mjs');

const createTablesQuery = `
  DROP TABLE IF EXISTS questoes CASCADE;
  CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    google_id VARCHAR(255) UNIQUE,
    facebook_id VARCHAR(255) UNIQUE,
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    titulo VARCHAR(255),
    descricao TEXT,
    materia VARCHAR(100),
    dificuldade INTEGER DEFAULT 1,
    duracao INTEGER DEFAULT 60, -- em minutos
    criado_por INTEGER REFERENCES usuarios(id) ON DELETE CASCADE, -- professor que criou
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE, -- usuário que está fazendo o simulado
    data_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_fim TIMESTAMP,
    status VARCHAR(50),
    tipo VARCHAR(50) DEFAULT 'geral' -- 'geral', 'professor', 'enem', 'resolucao', etc.
  );

  CREATE TABLE IF NOT EXISTS simulado_questoes (
    id SERIAL PRIMARY KEY,
    simulado_id INTEGER REFERENCES simulados(id) ON DELETE CASCADE,
    questao_id INTEGER REFERENCES questoes(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS resultados_simulado (
    id SERIAL PRIMARY KEY,
    simulado_id INTEGER REFERENCES simulados(id) ON DELETE CASCADE,
    questao_id INTEGER REFERENCES questoes(id) ON DELETE CASCADE,
    resposta_usuario CHAR(1),
    foi_correta BOOLEAN
  );

  -- Tabela para registrar atividades de gamificação
  CREATE TABLE IF NOT EXISTS gamificacao_atividades (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    tipo_atividade VARCHAR(100) NOT NULL,
    pontos_ganhos INTEGER DEFAULT 0,
    descricao TEXT,
    data_atividade TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  -- Tabela para armazenar planos de estudo
  CREATE TABLE IF NOT EXISTS planos_estudo (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    titulo VARCHAR(255) NOT NULL,
    descricao TEXT,
    configuracao JSONB, -- Armazena a configuração do plano (área, matérias, frequência, etc.)
    plano_gerado JSONB, -- Armazena o plano detalhado gerado pela IA
    data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_atualizacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'ativo', -- 'ativo', 'completo', 'arquivado'
    objetivo VARCHAR(100) -- 'enem', 'vestibular', 'reforco', etc.
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

  -- Inserir conquistas padrão
  INSERT INTO conquistas (nome, descricao, icone, pontos_requeridos) VALUES
  ('Primeiros Passos', 'Complete sua primeira questão', 'step', 1),
  ('Aprendiz', 'Resolva 10 questões', 'student', 10),
  ('Estudioso', 'Resolva 50 questões', 'book', 50),
  ('Maratonista', 'Resolva 100 questões', 'marathon', 100),
  ('Simulador', 'Complete seu primeiro simulado', 'exam', 5),
  ('Perfeito', 'Obtenha 100% de acerto em um simulado', 'perfect', 20),
  ('Velocista', 'Resolva uma questão em menos de 30 segundos', 'fast', 5),
  ('Conquistador', 'Obtenha 5 conquistas diferentes', 'conqueror', 15),
  ('Mestre', 'Alcance o nível 10', 'master', 0),
  ('Dedicação', 'Estude por 10 horas', 'dedication', 25)
  ON CONFLICT DO NOTHING;
`;

async function initializeDB() {
  console.log('Iniciando a criação das tabelas...');
  try {
    await db.query(createTablesQuery);
    // Inicializa as tabelas de conteúdo do livro separadamente
    await initAllContentDb();
    console.log('Tabelas criadas com sucesso (ou já existentes).');
  } catch (err) {
    console.error('Erro ao criar as tabelas:', err);
  } finally {
    // Encerra a conexão do pool para que o script termine
    const pool = require('pg').Pool;
    const client = new pool();
    await client.end();
  }
}

initializeDB();
