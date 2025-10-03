const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth'); // Reutilizar o middleware de autenticação

// Rota para um aluno se tornar um tutor
router.post('/tutores', requireAuth, async (req, res) => {
  const { bio, materias, disponibilidade } = req.body;
  const userId = req.user.id;

  if (!bio || !materias || !disponibilidade) {
    return res
      .status(400)
      .json({ error: 'Bio, matérias e disponibilidade são obrigatórios.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO tutores (user_id, bio, materias, disponibilidade) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id) DO UPDATE SET bio = EXCLUDED.bio, materias = EXCLUDED.materias, disponibilidade = EXCLUDED.disponibilidade RETURNING *',
      [userId, bio, materias, disponibilidade]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao se tornar tutor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para listar todos os tutores disponíveis
router.get('/tutores', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT t.*, u.raw_user_meta_data->>'nome' as nome
             FROM tutores t
             JOIN auth.users u ON t.user_id = u.id`
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao listar tutores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para solicitar uma sessão de tutoria
router.post('/sessoes', requireAuth, async (req, res) => {
  const { tutor_id, materia, horario_solicitado } = req.body;
  const aluno_id = req.user.id;

  if (!tutor_id || !materia || !horario_solicitado) {
    return res
      .status(400)
      .json({ error: 'Tutor, matéria e horário são obrigatórios.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO sessoes_tutoria (tutor_id, aluno_id, materia, horario_solicitado) VALUES ($1, $2, $3, $4) RETURNING *',
      [tutor_id, aluno_id, materia, horario_solicitado]
    );
    // TODO: Criar uma notificação para o tutor
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao solicitar sessão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para ver as sessões do usuário (como aluno ou tutor)
router.get('/sessoes', requireAuth, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(
      'SELECT * FROM sessoes_tutoria WHERE tutor_id = $1 OR aluno_id = $1 ORDER BY data_criacao DESC',
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar sessões:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar o status de uma sessão (aceitar/recusar/cancelar)
router.put('/sessoes/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  if (!status) {
    return res.status(400).json({ error: 'O novo status é obrigatório.' });
  }

  try {
    const result = await db.query(
      'UPDATE sessoes_tutoria SET status = $1 WHERE id = $2 AND (tutor_id = $3 OR aluno_id = $3) RETURNING *',
      [status, id, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({
        error:
          'Sessão não encontrada ou você não tem permissão para alterá-la.',
      });
    }
    // TODO: Notificar o outro usuário sobre a mudança de status
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar status da sessão:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
