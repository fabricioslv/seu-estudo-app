// routes/simulados.js - Rotas para gerenciamento de simulados por estudantes
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const questoesResolucaoService = require('../services/questoesResolucaoService');

const router = express.Router();

// ROTA: GET /api/simulados/disponiveis
// DESC: Obtém todos os simulados disponíveis para o estudante
router.get('/disponiveis', requireAuth, async (req, res) => {
  try {
    // Obter simulados criados por professores e também simulados gerais do sistema
    const simulados = await db.query(`
      SELECT s.id, s.titulo, s.descricao, s.materia, s.dificuldade, s.duracao, s.data_criacao,
             u.nome as professor_nome,
             COUNT(sq.questao_id) as total_questoes
      FROM simulados s
      LEFT JOIN usuarios u ON s.criado_por = u.id
      LEFT JOIN simulado_questoes sq ON s.id = sq.simulado_id
      WHERE s.tipo IN ('professor', 'geral', 'enem')
      GROUP BY s.id, u.nome
      ORDER BY s.data_criacao DESC
    `);

    res.json({
      success: true,
      simulados: simulados.rows,
    });
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ msg: 'Erro no servidor ao buscar simulados disponíveis.' });
  }
});

// ROTA: GET /api/simulados/:id
// DESC: Obtém os detalhes de um simulado específico
router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    const simulado = await db.query('SELECT * FROM simulados WHERE id = $1', [
      id,
    ]);

    if (simulado.rows.length === 0) {
      return res.status(404).json({ msg: 'Simulado não encontrado.' });
    }

    res.json({
      success: true,
      simulado: simulado.rows[0],
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro no servidor ao buscar simulado.' });
  }
});

// ROTA: GET /api/simulados/:id/questoes
// DESC: Obtém as questões de um simulado específico para resolução
router.get('/:id/questoes', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar se o simulado existe
    const simulado = await db.query('SELECT * FROM simulados WHERE id = $1', [id]);

    if (simulado.rows.length === 0) {
      return res.status(404).json({ msg: 'Simulado não encontrado.' });
    }

    // Obter as questões do simulado
    const questoes = await db.query(
      `
      SELECT q.id, q.numero, q.enunciado, q.alternativas, q.resposta_correta, q.explicacao, q.materia, q.ano_vestibular as ano
      FROM questoes q
      JOIN simulado_questoes sq ON q.id = sq.questao_id
      WHERE sq.simulado_id = $1
      ORDER BY sq.id
    `,
      [id]

    // Iniciar uma sessão de simulado para o usuário (registrar início)
    await db.query(
      `
      INSERT INTO sessoes_simulado (usuario_id, simulado_id, data_inicio, status)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `,
      [
        req.user.id,
        id,
        new Date(),
        'ativo'
      ]

    res.json({
      success: true,
      simulado: simulado.rows[0],
      questoes: questoes.rows,
    });
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ msg: 'Erro no servidor ao buscar questões do simulado.' });
  }
});

// ROTA: POST /api/simulados/:id/responder
// DESC: Registra as respostas do estudante a um simulado
router.post('/:id/responder', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { respostas } = req.body; // Array de objetos {questao_id, resposta, tempoResposta}

  if (!respostas || !Array.isArray(respostas) || respostas.length === 0) {
    return res.status(400).json({ msg: 'Respostas são obrigatórias.' });
  }

  try {
    // Obter o ID da sessão mais recente de simulado ativo para este usuário
    const simuladoAtivo = await db.query(
      `
      SELECT id FROM sessoes_simulado
      WHERE usuario_id = $1 AND status = 'ativo'
      ORDER BY data_inicio DESC
      LIMIT 1
    `,
      [req.user.id]

    if (simuladoAtivo.rows.length === 0) {
      return res
        .status(400)
        .json({ msg: 'Nenhuma sessão de simulado ativa encontrada.' });
    }

    const simuladoId = simuladoAtivo.rows[0].id;

    // Registrar cada resposta e calcular acertos
    let acertos = 0;
    const respostasProcessadas = [];

    for (const resposta of respostas) {
      const { questao_id, resposta_usuario, tempoResposta = 0 } = resposta;

      // Obter a resposta correta da questão
      const questao = await db.query(
        'SELECT resposta_correta FROM questoes WHERE id = $1',
        [questao_id]

      if (questao.rows.length === 0) {
        continue; // Pular questão não encontrada
      }

      const esta_correta =
        questao.rows[0].resposta_correta === resposta_usuario;

      // Inserir a resposta na tabela de resultados
      await db.query(
        `
        INSERT INTO resultados_simulado (simulado_id, questao_id, resposta_usuario, foi_correta)
        VALUES ($1, $2, $3, $4)
      `,
        [simuladoId, questao_id, resposta_usuario, esta_correta]

      // Registrar a resposta individualmente também para gamificação
      await questoesResolucaoService.registrarResposta(
        req.user.id,
        questao_id,
        resposta_usuario,
        esta_correta,
        tempoResposta
      );

      if (esta_correta) acertos++;

      respostasProcessadas.push({
        questao_id,
        resposta_usuario,
        esta_correta,
        tempoResposta,
      });
    }

    // Atualizar o status da sessão para concluído
    await db.query(
      `
      UPDATE sessoes_simulado
      SET status = 'concluido', data_fim = $1
      WHERE id = $2
    `,
      [new Date(), simuladoId]

    // Calcular pontuação
    const simulado = await db.query(
      'SELECT titulo FROM simulados WHERE id = $1',
      [simuladoId]
    );
    const totalQuestoes = respostas.length;
    const porcentagemAcerto =
      totalQuestoes > 0 ? Math.round((acertos / totalQuestoes) * 100) : 0;

    // Registrar atividade de gamificação
    const gamificacaoService = require('../services/gamificacaoService');
    await gamificacaoService.registrarAtividade(
      req.user.id,
      'finalizacao_simulado',
      5

    res.json({
      success: true,
      msg: 'Respostas registradas com sucesso!',
      pontuacao: {
        acertos,
        total: totalQuestoes,
        porcentagem: porcentagemAcerto,
      },
      respostas: respostasProcessadas,
    });
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ msg: 'Erro no servidor ao registrar respostas do simulado.' });
  }
});

// ROTA: GET /api/simulados/historico
// DESC: Obtém o histórico de simulados resolvidos pelo estudante
router.get('/historico', requireAuth, async (req, res) => {
  try {
    const historico = await db.query(
      `
      SELECT ss.id, s.titulo, ss.data_inicio, ss.data_fim, ss.status,
             COUNT(rs.id) as total_questoes,
             SUM(CASE WHEN rs.foi_correta THEN 1 ELSE 0 END) as acertos
      FROM sessoes_simulado ss
      LEFT JOIN simulados s ON ss.simulado_id = s.id
      LEFT JOIN resultados_simulado rs ON ss.id = rs.simulado_id
      WHERE ss.usuario_id = $1
      GROUP BY ss.id, s.titulo
      ORDER BY ss.data_inicio DESC
    `,
      [req.user.id]

    // Calcular porcentagens
    const historicoComPorcentagem = historico.rows.map((item) => ({
      ...item,
      porcentagem_acerto:
        item.total_questoes > 0
          ? Math.round((item.acertos / item.total_questoes) * 100)
          : 0,
    }));

    res.json({
      success: true,
      historico: historicoComPorcentagem,
    });
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ msg: 'Erro no servidor ao buscar histórico de simulados.' });
  }
});

// ROTA: GET /api/simulados/estatisticas
// DESC: Obtém estatísticas de desempenho em simulados do estudante
router.get('/estatisticas', requireAuth, async (req, res) => {
  try {
    // Estatísticas gerais
    const statsGerais = await db.query(
      `
      SELECT
        COUNT(DISTINCT ss.id) as total_simulados,
        AVG(COUNT(rs.foi_correta)) FILTER (WHERE rs.foi_correta = true) * 100.0 /
        NULLIF(AVG(COUNT(rs.foi_correta)), 0) as porcentagem_media_acerto
      FROM sessoes_simulado ss
      LEFT JOIN resultados_simulado rs ON ss.id = rs.simulado_id
      WHERE ss.usuario_id = $1
      GROUP BY ss.id
    `,
      [req.user.id]

    // Estatísticas por matéria
    const statsPorMateria = await db.query(
      `
      SELECT
        q.materia,
        COUNT(rs.id) as total_questoes,
        SUM(CASE WHEN rs.foi_correta THEN 1 ELSE 0 END) as acertos,
        ROUND((SUM(CASE WHEN rs.foi_correta THEN 1 ELSE 0 END) * 100.0 / COUNT(rs.id)), 2) as porcentagem_acerto
      FROM resultados_simulado rs
      JOIN questoes q ON rs.questao_id = q.id
      JOIN sessoes_simulado ss ON rs.simulado_id = ss.id
      WHERE ss.usuario_id = $1
      GROUP BY q.materia
      ORDER BY porcentagem_acerto DESC
    `,
      [req.user.id]

    res.json({
      success: true,
      estatisticas: {
        gerais: statsGerais.rows[0] || {
          total_simulados: 0,
          porcentagem_media_acerto: 0,
        },
        porMateria: statsPorMateria.rows,
      },
    });
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ msg: 'Erro no servidor ao buscar estatísticas de simulados.' });
  }
});

module.exports = router;
