// db/add-performance-indexes.cjs
// Script to add database indexes for improved query performance

import dotenv from 'dotenv';
import { query } from './index.js';

dotenv.config();

async function addPerformanceIndexes() {
  console.log('Adicionando índices de performance ao banco de dados...');

  const createIndexesQuery = `
    -- Índices para a tabela usuarios (frequentemente usada em WHERE)
    CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
    CREATE INDEX IF NOT EXISTS idx_usuarios_nome ON usuarios(nome);

    -- Índices para a tabela respostas_usuario (frequentemente usada em WHERE)
    CREATE INDEX IF NOT EXISTS idx_respostas_usuario_usuario_id ON respostas_usuario(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_respostas_usuario_questao_id ON respostas_usuario(questao_id);
    CREATE INDEX IF NOT EXISTS idx_respostas_usuario_data_resposta ON respostas_usuario(data_resposta);
    CREATE INDEX IF NOT EXISTS idx_respostas_usuario_usuario_data ON respostas_usuario(usuario_id, data_resposta);

    -- Índices para a tabela simulados (frequentemente usada em WHERE)
    CREATE INDEX IF NOT EXISTS idx_simulados_criado_por ON simulados(criado_por);
    CREATE INDEX IF NOT EXISTS idx_simulados_usuario_id ON simulados(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_simulados_status ON simulados(status);
    CREATE INDEX IF NOT EXISTS idx_simulados_tipo ON simulados(tipo);

    -- Índices para a tabela simulado_questoes (frequentemente usada em WHERE)
    CREATE INDEX IF NOT EXISTS idx_simulado_questoes_simulado_id ON simulado_questoes(simulado_id);
    CREATE INDEX IF NOT EXISTS idx_simulado_questoes_questao_id ON simulado_questoes(questao_id);

    -- Índices para a tabela resultados_simulado (frequentemente usada em WHERE)
    CREATE INDEX IF NOT EXISTS idx_resultados_simulado_simulado_id ON resultados_simulado(simulado_id);
    CREATE INDEX IF NOT EXISTS idx_resultados_simulado_questao_id ON resultados_simulado(questao_id);

    -- Índices para a tabela gamificacao_atividades (frequentemente usada em WHERE)
    CREATE INDEX IF NOT EXISTS idx_gamificacao_atividades_usuario_id ON gamificacao_atividades(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_gamificacao_atividades_tipo_atividade ON gamificacao_atividades(tipo_atividade);
    CREATE INDEX IF NOT EXISTS idx_gamificacao_atividades_data ON gamificacao_atividades(data_atividade);

    -- Índices para a tabela planos_estudo (frequentemente usada em WHERE)
    CREATE INDEX IF NOT EXISTS idx_planos_estudo_usuario_id ON planos_estudo(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_planos_estudo_status ON planos_estudo(status);
    CREATE INDEX IF NOT EXISTS idx_planos_estudo_objetivo ON planos_estudo(objetivo);

    -- Índices para a tabela conquistas_usuario (frequentemente usada em WHERE)
    CREATE INDEX IF NOT EXISTS idx_conquistas_usuario_usuario_id ON conquistas_usuario(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_conquistas_usuario_conquista_id ON conquistas_usuario(conquista_id);

    -- Índices para a tabela pontos_usuario (frequentemente usada em WHERE)
    CREATE INDEX IF NOT EXISTS idx_pontos_usuario_usuario_id ON pontos_usuario(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_pontos_usuario_tipo_ponto ON pontos_usuario(tipo_ponto);
    
    -- Índices para a tabela ranking (frequentemente usada em WHERE)
    CREATE INDEX IF NOT EXISTS idx_ranking_usuario_id ON ranking(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_ranking_periodo ON ranking(periodo);

    -- Índices para a tabela desafios (frequentemente usada em WHERE)
    CREATE INDEX IF NOT EXISTS idx_desafios_criador_id ON desafios(criador_id);
    CREATE INDEX IF NOT EXISTS idx_desafios_status ON desafios(status);

    -- Índices para a tabela participacoes_desafio (frequentemente usada em WHERE)
    CREATE INDEX IF NOT EXISTS idx_participacoes_desafio_desafio_id ON participacoes_desafio(desafio_id);
    CREATE INDEX IF NOT EXISTS idx_participacoes_desafio_usuario_id ON participacoes_desafio(usuario_id);

    -- Índices para outras tabelas identificadas
    -- Mensagens
    CREATE INDEX IF NOT EXISTS idx_mensagens_destinatario_id ON mensagens(destinatario_id);
    CREATE INDEX IF NOT EXISTS idx_mensagens_remetente_id ON mensagens(remetente_id);
    CREATE INDEX IF NOT EXISTS idx_mensagens_data_envio ON mensagens(data_envio);

    -- Notificações
    CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_id ON notificacoes(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_notificacoes_lida ON notificacoes(lida);
    CREATE INDEX IF NOT EXISTS idx_notificacoes_data_criacao ON notificacoes(data_criacao);

    -- Questões
    CREATE INDEX IF NOT EXISTS idx_questoes_materia ON questoes(materia);
    CREATE INDEX IF NOT EXISTS idx_questoes_ano ON questoes(ano);
    CREATE INDEX IF NOT EXISTS idx_questoes_tipo ON questoes(tipo);

    -- Tutoria
    CREATE INDEX IF NOT EXISTS idx_sessoes_tutoria_tutor_id ON sessoes_tutoria(tutor_id);
    CREATE INDEX IF NOT EXISTS idx_sessoes_tutoria_aluno_id ON sessoes_tutoria(aluno_id);
    CREATE INDEX IF NOT EXISTS idx_sessoes_tutoria_status ON sessoes_tutoria(status);

    -- Avaliações e Notas
    CREATE INDEX IF NOT EXISTS idx_avaliacoes_professor_id ON avaliacoes(professor_id);
    CREATE INDEX IF NOT EXISTS idx_notas_aluno_id ON notas(aluno_id);
    CREATE INDEX IF NOT EXISTS idx_notas_avaliacao_id ON notas(avaliacao_id);

    -- Adiciona índices compostos para consultas frequentes
    CREATE INDEX IF NOT EXISTS idx_respostas_usuario_usuario_correta ON respostas_usuario(usuario_id, esta_correta);
    CREATE INDEX IF NOT EXISTS idx_simulados_usuario_status ON simulados(usuario_id, status);
    CREATE INDEX IF NOT EXISTS idx_notas_aluno_avaliacao ON notas(aluno_id, avaliacao_id);
    CREATE INDEX IF NOT EXISTS idx_sessoes_tutoria_usuario_status ON sessoes_tutoria(aluno_id, status);
    CREATE INDEX IF NOT EXISTS idx_sessoes_tutoria_usuario_status_tutor ON sessoes_tutoria(tutor_id, status);
    
    -- Índice para buscas por status e tipo em notificações
    CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_lida ON notificacoes(usuario_id, lida);

    -- Índices para conteúdo de livros (adicionado baseado nas tabelas do init-all-content-db)
    CREATE INDEX IF NOT EXISTS idx_livros_titulo ON livros(titulo);
    CREATE INDEX IF NOT EXISTS idx_livros_ano ON livros(ano);
    CREATE INDEX IF NOT EXISTS idx_livros_area ON livros(area);
    
    CREATE INDEX IF NOT EXISTS idx_conteudo_livro_livro_id ON conteudo_livro(livro_id);
    CREATE INDEX IF NOT EXISTS idx_conteudo_livro_tipo ON conteudo_livro(tipo);
    CREATE INDEX IF NOT EXISTS idx_conteudo_livro_secao ON conteudo_livro(secao);
    
    CREATE INDEX IF NOT EXISTS idx_topicos_conteudo_id ON topicos(conteudo_id);
    CREATE INDEX IF NOT EXISTS idx_topicos_nome ON topicos(nome);
    
    CREATE INDEX IF NOT EXISTS idx_capitulos_livro_id ON capitulos(livro_id);
    CREATE INDEX IF NOT EXISTS idx_capitulos_numero ON capitulos(numero);
    
    -- Índices para questoes (tabela de conteúdo de questões)
    CREATE INDEX IF NOT EXISTS idx_questoes_usuario_id ON questoes(usuario_id);
    CREATE INDEX IF NOT EXISTS idx_questoes_assunto ON questoes(assunto);

    SELECT 'Índices criados com sucesso' as status;
  `;

  try {
    await query(createIndexesQuery);
    console.log('Índices de performance adicionados com sucesso.');
  } catch (err) {
    console.error('Erro ao adicionar índices de performance:', err);
  }
}

addPerformanceIndexes();