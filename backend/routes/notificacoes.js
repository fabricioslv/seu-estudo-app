const express = require('express');
const router = express.Router();
const db = require('../db');

// Rota para buscar todas as notificações de um usuário
router.get('/:usuarioId', async (req, res) => {
  const { usuarioId } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM notificacoes WHERE usuario_id = $1 ORDER BY data_criacao DESC',
      [usuarioId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para criar uma nova notificação (para testes e uso interno do backend)
router.post('/', async (req, res) => {
  const { usuario_id, tipo, conteudo, link } = req.body;
  if (!usuario_id || !tipo || !conteudo) {
    return res
      .status(400)
      .json({ error: 'Campos obrigatórios: usuario_id, tipo, conteudo.' });
  }
  try {
    const result = await db.query(
      'INSERT INTO notificacoes (usuario_id, tipo, conteudo, link) VALUES ($1, $2, $3, $4) RETURNING *',
      [usuario_id, tipo, conteudo, link]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar notificação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para marcar uma notificação como lida
router.put('/:notificacaoId/lida', async (req, res) => {
  const { notificacaoId } = req.params;
  try {
    const result = await db.query(
      'UPDATE notificacoes SET lida = true WHERE id = $1 RETURNING *',
      [notificacaoId]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Notificação não encontrada.' });
    }
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Rota para marcar todas as notificações de um usuário como lidas
router.put('/usuario/:usuarioId/lidas', async (req, res) => {
  const { usuarioId } = req.params;
  try {
    const result = await db.query(
      'UPDATE notificacoes SET lida = true WHERE usuario_id = $1 AND lida = false RETURNING *',
      [usuarioId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
