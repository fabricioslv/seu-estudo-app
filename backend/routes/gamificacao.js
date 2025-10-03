// routes/gamificacao.js - Rotas para o sistema de gamificação
const express = require('express');
const db = require('../db');

const router = express.Router();

// --- ROTA PARA OBTÉM PONTOS DO USUÁRIO ---
router.get('/pontos/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const query = `
      SELECT tipo_ponto, pontos, nivel, experiencia, ultima_atualizacao
      FROM pontos_usuario
      WHERE usuario_id = $1
    `;

    const result = await db.query(query, [usuarioId]);

    res.json({
      success: true,
      pontos: result.rows,
    });
  } catch (err) {
    console.error('Erro ao obter pontos do usuário:', err);
    res.status(500).json({ error: 'Erro ao obter pontos do usuário.' });
  }
});

// --- ROTA PARA ADICIONAR PONTOS AO USUÁRIO ---
router.post('/pontos/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { pontos, tipo_ponto = 'geral' } = req.body;

    if (!pontos || pontos <= 0) {
      return res.status(400).json({ error: 'Quantidade de pontos inválida.' });
    }

    // Verificar se já existe um registro para esse usuário e tipo de ponto
    const checkQuery = `
      SELECT pontos, nivel, experiencia FROM pontos_usuario 
      WHERE usuario_id = $1 AND tipo_ponto = $2
    `;

    const checkResult = await db.query(checkQuery, [usuarioId, tipo_ponto]);

    if (checkResult.rows.length > 0) {
      // Atualizar os pontos existentes
      const currentPontos = checkResult.rows[0].pontos;
      const novoTotal = currentPontos + pontos;

      // Calcular nível (cada 100 pontos = 1 nível)
      const novoNivel = Math.floor(novoTotal / 100) + 1;
      const novaExperiencia = novoTotal % 100;

      // Atualizar os dados
      const updateQuery = `
        UPDATE pontos_usuario 
        SET pontos = $1, nivel = $2, experiencia = $3, ultima_atualizacao = CURRENT_TIMESTAMP
        WHERE usuario_id = $4 AND tipo_ponto = $5
      `;

      await db.query(updateQuery, [
        novoTotal,
        novoNivel,
        novaExperiencia,
        usuarioId,
        tipo_ponto,
      ]);
    } else {
      // Criar novo registro
      const novoNivel = Math.floor(pontos / 100) + 1;
      const novaExperiencia = pontos % 100;

      const insertQuery = `
        INSERT INTO pontos_usuario (usuario_id, tipo_ponto, pontos, nivel, experiencia)
        VALUES ($1, $2, $3, $4, $5)
      `;

      await db.query(insertQuery, [
        usuarioId,
        tipo_ponto,
        pontos,
        novoNivel,
        novaExperiencia,
      ]);
    }

    res.json({
      success: true,
      msg: `Adicionados ${pontos} pontos ao usuário ${usuarioId}`,
      pontosAtualizados: {
        tipo_ponto,
        pontos: pontos,
        nivel:
          Math.floor(
            (checkResult.rows.length > 0 ? checkResult.rows[0].pontos : 0) +
              pontos / 100
          ) + 1,
      },
    });
  } catch (err) {
    console.error('Erro ao adicionar pontos ao usuário:', err);
    res.status(500).json({ error: 'Erro ao adicionar pontos ao usuário.' });
  }
});

// --- ROTA PARA OBTÉM CONQUISTAS DO USUÁRIO ---
router.get('/conquistas/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;

    const query = `
      SELECT c.id, c.nome, c.descricao, c.icone, c.pontos_requeridos, cu.data_obtencao
      FROM conquistas c
      LEFT JOIN conquistas_usuario cu ON c.id = cu.conquista_id AND cu.usuario_id = $1
      ORDER BY c.id
    `;

    const result = await db.query(query, [usuarioId]);

    res.json({
      success: true,
      conquistas: result.rows,
    });
  } catch (err) {
    console.error('Erro ao obter conquistas do usuário:', err);
    res.status(500).json({ error: 'Erro ao obter conquistas do usuário.' });
  }
});

// --- ROTA PARA OBTÉM RANKING DOS USUÁRIOS ---
router.get('/ranking/:periodo', async (req, res) => {
  try {
    const { periodo = 'geral' } = req.params; // 'geral', 'mensal', 'semanal'

    const query = `
      SELECT 
        r.posicao,
        r.pontos_totais,
        u.nome,
        u.email
      FROM ranking r
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.periodo = $1
      ORDER BY r.posicao
      LIMIT 100
    `;

    const result = await db.query(query, [periodo]);

    res.json({
      success: true,
      periodo,
      ranking: result.rows,
    });
  } catch (err) {
    console.error('Erro ao obter ranking:', err);
    res.status(500).json({ error: 'Erro ao obter ranking.' });
  }
});

// --- ROTA PARA OBTÉM RANKING GERAL (padrão 'geral') ---
router.get('/ranking', async (req, res) => {
  try {
    const periodo = 'geral';

    const query = `
      SELECT 
        r.posicao,
        r.pontos_totais,
        u.nome,
        u.email
      FROM ranking r
      JOIN usuarios u ON r.usuario_id = u.id
      WHERE r.periodo = $1
      ORDER BY r.posicao
      LIMIT 100
    `;

    const result = await db.query(query, [periodo]);

    res.json({
      success: true,
      periodo,
      ranking: result.rows,
    });
  } catch (err) {
    console.error('Erro ao obter ranking geral:', err);
    res.status(500).json({ error: 'Erro ao obter ranking geral.' });
  }
});

// --- ROTA PARA OBTÉM RANKING DO USUÁRIO ESPECÍFICO ---
router.get('/ranking-usuario/:usuarioId/:periodo', async (req, res) => {
  try {
    const { usuarioId, periodo = 'geral' } = req.params;

    const query = `
      SELECT 
        r.posicao,
        r.pontos_totais,
        (SELECT COUNT(*) FROM ranking WHERE periodo = $2) AS total_usuarios
      FROM ranking r
      WHERE r.usuario_id = $1 AND r.periodo = $2
    `;

    const result = await db.query(query, [usuarioId, periodo]);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        posicao: null,
        pontos_totais: 0,
        total_usuarios: 0,
        msg: 'Usuário não encontrado no ranking',
      });
    }

    const { posicao, pontos_totais } = result.rows[0];

    // Obter o total de usuários no ranking
    const totalUsuariosQuery = `SELECT COUNT(*) as total FROM ranking WHERE periodo = $1`;
    const totalResult = await db.query(totalUsuariosQuery, [periodo]);
    const total_usuarios = parseInt(totalResult.rows[0].total);

    res.json({
      success: true,
      posicao,
      pontos_totais,
      total_usuarios,
      porcentagem:
        total_usuarios > 0 ? Math.round((posicao / total_usuarios) * 100) : 0,
    });
  } catch (err) {
    console.error('Erro ao obter ranking do usuário:', err);
    res.status(500).json({ error: 'Erro ao obter ranking do usuário.' });
  }
});

// --- ROTA PARA OBTÉM RANKING GERAL DO USUÁRIO (padrão 'geral') ---
router.get('/ranking-usuario/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const periodo = 'geral';

    const query = `
      SELECT 
        r.posicao,
        r.pontos_totais,
        (SELECT COUNT(*) FROM ranking WHERE periodo = $2) AS total_usuarios
      FROM ranking r
      WHERE r.usuario_id = $1 AND r.periodo = $2
    `;

    const result = await db.query(query, [usuarioId, periodo]);

    if (result.rows.length === 0) {
      return res.json({
        success: true,
        posicao: null,
        pontos_totais: 0,
        total_usuarios: 0,
        msg: 'Usuário não encontrado no ranking',
      });
    }

    const { posicao, pontos_totais } = result.rows[0];

    // Obter o total de usuários no ranking
    const totalUsuariosQuery = `SELECT COUNT(*) as total FROM ranking WHERE periodo = $1`;
    const totalResult = await db.query(totalUsuariosQuery, [periodo]);
    const total_usuarios = parseInt(totalResult.rows[0].total);

    res.json({
      success: true,
      posicao,
      pontos_totais,
      total_usuarios,
      porcentagem:
        total_usuarios > 0 ? Math.round((posicao / total_usuarios) * 100) : 0,
    });
  } catch (err) {
    console.error('Erro ao obter ranking geral do usuário:', err);
    res.status(500).json({ error: 'Erro ao obter ranking geral do usuário.' });
  }
});

// --- ROTA PARA CRIAR UM NOVO DESAFIO ---
router.post('/desafios', async (req, res) => {
  try {
    const {
      titulo,
      descricao,
      tipo,
      criador_id,
      questoes_ids,
      data_fim,
      pontos_recompensa = 10,
    } = req.body;

    if (!titulo || !criador_id) {
      return res
        .status(400)
        .json({ error: 'Título e criador são obrigatórios.' });
    }

    const query = `
      INSERT INTO desafios (titulo, descricao, tipo, criador_id, questoes_ids, data_fim, pontos_recompensa)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
    `;

    const result = await db.query(query, [
      titulo,
      descricao,
      tipo,
      criador_id,
      questoes_ids || [],
      data_fim,
      pontos_recompensa,
    ]);

    res.json({
      success: true,
      id: result.rows[0].id,
      msg: 'Desafio criado com sucesso.',
    });
  } catch (err) {
    console.error('Erro ao criar desafio:', err);
    res.status(500).json({ error: 'Erro ao criar desafio.' });
  }
});

// --- ROTA PARA OBTÉM LISTA DE DESAFIOS ---
router.get('/desafios', async (req, res) => {
  try {
    const { status = 'ativo' } = req.query; // 'ativo', 'concluido', 'expirado'

    const query = `
      SELECT 
        d.id,
        d.titulo,
        d.descricao,
        d.tipo,
        d.criador_id,
        u.nome as criador_nome,
        d.data_inicio,
        d.data_fim,
        d.status,
        d.pontos_recompensa,
        COUNT(pd.id) as participantes
      FROM desafios d
      LEFT JOIN usuarios u ON d.criador_id = u.id
      LEFT JOIN participacoes_desafio pd ON d.id = pd.desafio_id
      WHERE d.status = $1
      GROUP BY d.id, u.nome
      ORDER BY d.data_inicio DESC
    `;

    const result = await db.query(query, [status]);

    res.json({
      success: true,
      desafios: result.rows,
    });
  } catch (err) {
    console.error('Erro ao obter desafios:', err);
    res.status(500).json({ error: 'Erro ao obter desafios.' });
  }
});

// --- ROTA PARA INSCREVER USUÁRIO EM DESAFIO ---
router.post('/desafios/:desafioId/participar', async (req, res) => {
  try {
    const { desafioId } = req.params;
    const { usuario_id } = req.body;

    if (!usuario_id) {
      return res.status(400).json({ error: 'ID do usuário é obrigatório.' });
    }

    // Verificar se o desafio existe e está ativo
    const desafioQuery = `SELECT * FROM desafios WHERE id = $1 AND status = 'ativo'`;
    const desafioResult = await db.query(desafioQuery, [desafioId]);

    if (desafioResult.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'Desafio não encontrado ou não está ativo.' });
    }

    // Verificar se o usuário já está participando
    const participacaoQuery = `SELECT * FROM participacoes_desafio WHERE desafio_id = $1 AND usuario_id = $2`;
    const participacaoResult = await db.query(participacaoQuery, [
      desafioId,
      usuario_id,
    ]);

    if (participacaoResult.rows.length > 0) {
      return res
        .status(400)
        .json({ error: 'Usuário já está participando deste desafio.' });
    }

    // Inserir nova participação
    const insertQuery = `
      INSERT INTO participacoes_desafio (desafio_id, usuario_id, data_inicio)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
    `;

    await db.query(insertQuery, [desafioId, usuario_id]);

    res.json({
      success: true,
      msg: 'Usuário inscrito no desafio com sucesso.',
    });
  } catch (err) {
    console.error('Erro ao inscrever usuário em desafio:', err);
    res.status(500).json({ error: 'Erro ao inscrever usuário em desafio.' });
  }
});

// --- ROTA PARA ATUALIZAR PONTUAÇÃO DE PARTICIPAÇÃO EM DESAFIO ---
router.put(
  '/desafios/:desafioId/participacoes/:participacaoId',
  async (req, res) => {
    try {
      const { desafioId, participacaoId } = req.params;
      const { pontuacao_obtida, status } = req.body;

      const updateQuery = `
      UPDATE participacoes_desafio 
      SET pontuacao_obtida = $1, status = $2, data_fim = CURRENT_TIMESTAMP
      WHERE id = $3 AND desafio_id = $4
    `;

      await db.query(updateQuery, [
        pontuacao_obtida,
        status,
        participacaoId,
        desafioId,
      ]);

      res.json({
        success: true,
        msg: 'Participação atualizada com sucesso.',
      });
    } catch (err) {
      console.error('Erro ao atualizar participação em desafio:', err);
      res
        .status(500)
        .json({ error: 'Erro ao atualizar participação em desafio.' });
    }
  }
);

module.exports = router;
