const express = require('express');
const router = express.Router();
const db = require('../db');

// --- Rotas para Professores (Gerenciar Avaliações) ---

// Criar uma nova avaliação
router.post('/avaliacoes', async (req, res) => {
  const { professor_id, titulo, descricao } = req.body;
  if (!professor_id || !titulo) {
    return res
      .status(400)
      .json({ error: 'Campos obrigatórios: professor_id, titulo.' });
  }
  try {
    const result = await db.query(
      'INSERT INTO avaliacoes (professor_id, titulo, descricao) VALUES ($1, $2, $3) RETURNING *',
      [professor_id, titulo, descricao]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao criar avaliação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter todas as avaliações de um professor
router.get('/avaliacoes/professor/:professorId', async (req, res) => {
  const { professorId } = req.params;
  try {
    const result = await db.query(
      'SELECT * FROM avaliacoes WHERE professor_id = $1 ORDER BY data_criacao DESC',
      [professorId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar avaliações:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// --- Rotas para Professores (Gerenciar Notas) ---

// Adicionar ou atualizar a nota de um aluno
router.post('/notas', async (req, res) => {
  const { avaliacao_id, aluno_id, nota, comentario } = req.body;
  if (!avaliacao_id || !aluno_id || nota === undefined) {
    return res
      .status(400)
      .json({ error: 'Campos obrigatórios: avaliacao_id, aluno_id, nota.' });
  }
  try {
    // Utiliza INSERT ... ON CONFLICT para fazer um "upsert"
    const result = await db.query(
      `INSERT INTO notas (avaliacao_id, aluno_id, nota, comentario)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (avaliacao_id, aluno_id) DO UPDATE
       SET nota = EXCLUDED.nota, comentario = EXCLUDED.comentario, data_lancamento = now()
       RETURNING *`,
      [avaliacao_id, aluno_id, nota, comentario]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Erro ao lançar nota:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Obter todas as notas de uma avaliação específica
router.get('/notas/avaliacao/:avaliacaoId', async (req, res) => {
  const { avaliacaoId } = req.params;
  try {
    const result = await db.query(
      `SELECT n.*, u.email as aluno_email, u.user_metadata->>'nome' as aluno_nome
         FROM notas n
         JOIN auth.users u ON n.aluno_id = u.id
         WHERE n.avaliacao_id = $1
         ORDER BY u.user_metadata->>'nome' ASC`,
      [avaliacaoId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar notas da avaliação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// --- Rotas para Alunos (Visualizar Notas) ---

// Obter todas as notas de um aluno específico
router.get('/notas/aluno/:alunoId', async (req, res) => {
  const { alunoId } = req.params;
  try {
    const result = await db.query(
      `SELECT n.*, a.titulo as avaliacao_titulo, a.descricao as avaliacao_descricao
         FROM notas n
         JOIN avaliacoes a ON n.avaliacao_id = a.id
         WHERE n.aluno_id = $1
         ORDER BY a.data_criacao DESC`,
      [alunoId]
    );
    res.status(200).json(result.rows);
  } catch (error) {
    console.error('Erro ao buscar notas do aluno:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;
