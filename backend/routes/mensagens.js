const express = require('express');
const router = express.Router();
const db = require('../db');

// Rota para enviar uma nova mensagem
router.post('/', async (req, res) => {
  const { remetente_id, destinatario_id, conteudo } = req.body;

  if (!remetente_id || !destinatario_id || !conteudo) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO mensagens (remetente_id, destinatario_id, conteudo) VALUES ($1, $2, $3) RETURNING *',
      [remetente_id, destinatario_id, conteudo]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para buscar todas as mensagens de um usuário (caixa de entrada)
router.get('/:usuarioId', async (req, res) => {
  const { usuarioId } = req.params;

  try {
    const result = await db.query(
      'SELECT * FROM mensagens WHERE destinatario_id = $1 OR remetente_id = $1 ORDER BY data_envio DESC',
      [usuarioId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar mensagens:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para marcar uma mensagem como lida
router.put('/:mensagemId/lida', async (req, res) => {
  const { mensagemId } = req.params;

  try {
    const result = await db.query(
      'UPDATE mensagens SET lida = true WHERE id = $1 RETURNING *',
      [mensagemId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Mensagem não encontrada.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao marcar mensagem como lida:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
