const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth'); // Reutilizar o middleware de autentica????o

// Rota para um aluno se tornar um tutor
router.post('/tutores', requireAuth, async (req, res) => {
  const { bio, materias, disponibilidade } = req.body;
  const userId = req.user.id;

  if (!bio || !materias || !disponibilidade) {
    return re
      .status(400)
      .json({ error: 'Bio, mat??rias e disponibilidade s??o obrigat??rios.' });
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

// Rota para listar todos os tutores dispon??vei
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

// Rota para solicitar uma sess??o de tutoria
router.post('/sessoes', requireAuth, async (req, res) => {
  const { tutor_id, materia, horario_solicitado } = req.body;
  const aluno_id = req.user.id;

  if (!tutor_id || !materia || !horario_solicitado) {
    return re
      .status(400)
      .json({ error: 'Tutor, mat??ria e hor??rio s??o obrigat??rios.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO sessoes_tutoria (tutor_id, aluno_id, materia, horario_solicitado) VALUES ($1, $2, $3, $4) RETURNING *',
      [tutor_id, aluno_id, materia, horario_solicitado]
    );
    
    // Criar uma notifica????o para o tutor
    try {
      const notificationService = await import('../services/notificationService.js');
      await notificationService.default.scheduleSmartNotification(
        tutor_id,
        'tutoria',
        `Nova solicita????o de sess??o de tutoria`,
        `Voc?? tem uma nova solicita????o de sess??o de tutoria do aluno ${req.user.nome}. Mat??ria: ${materia}`,
        2 // prioridade normal
      );
    } catch (notificationError) {
      console.error('Erro ao enviar notifica????o ao tutor:', notificationError);
      // N??o interrompe o processo se a notifica????o falhar
    }
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao solicitar sess??o:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para ver as sess??es do usu??rio (como aluno ou tutor)
router.get('/sessoes', requireAuth, async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await db.query(
      'SELECT * FROM sessoes_tutoria WHERE tutor_id = $1 OR aluno_id = $1 ORDER BY data_criacao DESC',
      [userId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar sess??es:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para atualizar o status de uma sess??o (aceitar/recusar/cancelar)
router.put('/sessoes/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const userId = req.user.id;

  if (!status) {
    return res.status(400).json({ error: 'O novo status ?? obrigat??rio.' });
  }

  try {
    const result = await db.query(
      'UPDATE sessoes_tutoria SET status = $1 WHERE id = $2 AND (tutor_id = $3 OR aluno_id = $3) RETURNING *',
      [status, id, userId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({
        error:
          'Sess??o n??o encontrada ou voc?? n??o tem permiss??o para alter??-la.',
      });
    }
    
    // Notificar o outro usu??rio sobre a mudan??a de statu
    try {
      const notificationService = await import('../services/notificationService.js');
      const session = result.rows[0]; // Pegar a sess??o atualizada do resultado
      const otherUserId = userId === session.aluno_id ? session.tutor_id : session.aluno_id;
      const userType = userId === session.aluno_id ? 'aluno' : 'tutor';
      const currentUserType = userId === session.aluno_id ? 'tutor' : 'aluno';
      
      await notificationService.default.scheduleSmartNotification(
        otherUserId,
        'tutoria',
        `Status da sess??o de tutoria atualizado`,
        `O ${currentUserType} alterou o status da sess??o de tutoria para: ${status}.`,
        2 // prioridade normal
      );
    } catch (notificationError) {
      console.error('Erro ao enviar notifica????o sobre mudan??a de status:', notificationError);
      // N??o interrompe o processo se a notifica????o falhar
    }
    
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao atualizar status da sess??o:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
