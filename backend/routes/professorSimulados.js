// routes/professorSimulados.js
const express = require('express');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ROTA: POST /api/professor/simulados
// DESC: Cria um novo simulado personalizado por um professor
router.post('/', requireAuth, async (req, res) => {
  const { titulo, descricao, materia, dificuldade, duracao, questoes } =
    req.body;

  // Verifica se o usuário é um professor
  if (req.user.tipo !== 'professor') {
    return res.status(403).json({
      msg: 'Acesso negado. Apenas professores podem criar simulados.',
    });
  }

  // Validação
  if (!titulo || !materia || !questoes || questoes.length === 0) {
    return res.status(400).json({
      msg: 'Título, matéria e pelo menos uma questão são obrigatórios.',
    });
  }

  try {
    // Inicia uma transação para garantir consistência
    const client = await db.connect();

    try {
      await client.query('BEGIN');

      // Insere o simulado
      const simulado = await client.query(
        'INSERT INTO simulados (titulo, descricao, materia, dificuldade, duracao, criado_por, tipo) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
        [
          titulo,
          descricao || '',
          materia,
          dificuldade || 1,
          duracao || 60,
          req.user.id,
          'professor',
        ]
      );

      const simuladoId = simulado.rows[0].id;

      // Insere as questões do simulado
      for (const questao of questoes) {
        await client.query(
          'INSERT INTO simulado_questoes (simulado_id, questao_id) VALUES ($1, $2)',
          [simuladoId, questao.id]
        );
      }

      await client.query('COMMIT');
      client.release();

      res.status(201).json({
        msg: 'Simulado criado com sucesso!',
        simuladoId,
      });
    } catch (err) {
      await client.query('ROLLBACK');
      client.release();
      throw err;
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro no servidor ao criar simulado.' });
  }
});

// ROTA: GET /api/professor/simulados
// DESC: Obtém todos os simulados criados pelo professor autenticado
router.get('/', requireAuth, async (req, res) => {
  try {
    // Verifica se o usuário é um professor
    if (req.user.tipo !== 'professor') {
      return res.status(403).json({
        msg: 'Acesso negado. Apenas professores podem acessar esta funcionalidade.',
      });
    }

    const simulados = await db.query(
      'SELECT s.id, s.titulo, s.descricao, s.materia, s.dificuldade, s.duracao, s.data_criacao, ' +
        'COUNT(sq.questao_id) as total_questoes ' +
        'FROM simulados s ' +
        'LEFT JOIN simulado_questoes sq ON s.id = sq.simulado_id ' +
        'WHERE s.criado_por = $1 ' +
        'GROUP BY s.id ' +
        'ORDER BY s.data_criacao DESC',
      [req.user.id]
    );

    res.json({
      success: true,
      simulados: simulados.rows,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro no servidor ao buscar simulados.' });
  }
});

// ROTA: PUT /api/professor/simulados/:id
// DESC: Atualiza um simulado existente
router.put('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { titulo, descricao, materia, dificuldade, duracao, questoes } =
    req.body;

  try {
    // Verifica se o usuário é um professor
    if (req.user.tipo !== 'professor') {
      return res.status(403).json({
        msg: 'Acesso negado. Apenas professores podem atualizar simulados.',
      });
    }

    // Verifica se o professor é o criador do simulado
    const simuladoExistente = await db.query(
      'SELECT criado_por FROM simulados WHERE id = $1',
      [id]
    );

    if (simuladoExistente.rows.length === 0) {
      return res.status(404).json({ msg: 'Simulado não encontrado.' });
    }

    if (simuladoExistente.rows[0].criado_por !== req.user.id) {
      return res.status(403).json({
        msg: 'Acesso negado. Você não tem permissão para atualizar este simulado.',
      });
    }

    // Atualiza o simulado
    await db.query(
      'UPDATE simulados SET titulo = $1, descricao = $2, materia = $3, dificuldade = $4, duracao = $5 WHERE id = $6',
      [titulo, descricao || '', materia, dificuldade || 1, duracao || 60, id]
    );

    // Atualiza as questões (remove as antigas e adiciona as novas)
    await db.query('DELETE FROM simulado_questoes WHERE simulado_id = $1', [
      id,
    ]);

    if (questoes && questoes.length > 0) {
      for (const questao of questoes) {
        await db.query(
          'INSERT INTO simulado_questoes (simulado_id, questao_id) VALUES ($1, $2)',
          [id, questao.id]
        );
      }
    }

    res.json({ msg: 'Simulado atualizado com sucesso!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro no servidor ao atualizar simulado.' });
  }
});

// ROTA: DELETE /api/professor/simulados/:id
// DESC: Remove um simulado
router.delete('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    // Verifica se o usuário é um professor
    if (req.user.tipo !== 'professor') {
      return res.status(403).json({
        msg: 'Acesso negado. Apenas professores podem remover simulados.',
      });
    }

    // Verifica se o professor é o criador do simulado
    const simuladoExistente = await db.query(
      'SELECT criado_por FROM simulados WHERE id = $1',
      [id]
    );

    if (simuladoExistente.rows.length === 0) {
      return res.status(404).json({ msg: 'Simulado não encontrado.' });
    }

    if (simuladoExistente.rows[0].criado_por !== req.user.id) {
      return res.status(403).json({
        msg: 'Acesso negado. Você não tem permissão para remover este simulado.',
      });
    }

    // Remove o simulado e suas questões associadas
    await db.query('DELETE FROM simulado_questoes WHERE simulado_id = $1', [
      id,
    ]);
    await db.query('DELETE FROM simulados WHERE id = $1', [id]);

    res.json({ msg: 'Simulado removido com sucesso!' });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro no servidor ao remover simulado.' });
  }
});

// ROTA: GET /api/professor/simulados/:id/questoes
// DESC: Obtém as questões de um simulado específico
router.get('/:id/questoes', requireAuth, async (req, res) => {
  const { id } = req.params;

  try {
    // Verifica se o usuário é um professor
    if (req.user.tipo !== 'professor') {
      return res.status(403).json({
        msg: 'Acesso negado. Apenas professores podem acessar esta funcionalidade.',
      });
    }

    // Verifica se o professor é o criador do simulado
    const simuladoExistente = await db.query(
      'SELECT criado_por FROM simulados WHERE id = $1',
      [id]
    );

    if (simuladoExistente.rows.length === 0) {
      return res.status(404).json({ msg: 'Simulado não encontrado.' });
    }

    if (simuladoExistente.rows[0].criado_por !== req.user.id) {
      return res.status(403).json({
        msg: 'Acesso negado. Você não tem permissão para acessar este simulado.',
      });
    }

    // Obtém as questões do simulado
    const questoes = await db.query(
      `SELECT q.id, q.enunciado as conteudo, q.alternativas, q.resposta_correta, q.materia, q.ano_vestibular as ano, q.origem
       FROM questoes q
       JOIN simulado_questoes sq ON q.id = sq.questao_id
       WHERE sq.simulado_id = $1
       ORDER BY sq.id`,
      [id]
    );

    res.json({
      success: true,
      questoes: questoes.rows,
    });
  } catch (err) {
    console.error(err.message);
    res
      .status(500)
      .json({ msg: 'Erro no servidor ao buscar questões do simulado.' });
  }
});

module.exports = router;
