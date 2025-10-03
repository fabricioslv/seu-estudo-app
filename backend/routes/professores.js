// routes/professores.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// ROTA: POST /api/professores/register
// DESC: Registra um novo professor
router.post('/register', async (req, res) => {
  const { nome, email, senha, formacao, instituicao, areas_atuacao } = req.body;

  // Validação
  if (!nome || !email || !senha || !formacao) {
    return res
      .status(400)
      .json({ msg: 'Por favor, preencha todos os campos obrigatórios.' });
  }

  try {
    // Verifica se o professor já existe
    const professorExists = await db.query(
      'SELECT * FROM usuarios WHERE email = $1 AND tipo = $2',
      [email, 'professor']
    );

    if (professorExists.rows.length > 0) {
      return res
        .status(400)
        .json({ msg: 'Professor com este e-mail já existe.' });
    }

    // Criptografa a senha
    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(senha, salt);

    // Salva o novo professor no banco
    const newProfessor = await db.query(
      'INSERT INTO usuarios (nome, email, senha_hash, tipo, formacao, instituicao, areas_atuacao) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, nome, email, tipo',
      [
        nome,
        email,
        senha_hash,
        'professor',
        formacao,
        instituicao || null,
        areas_atuacao || null,
      ]
    );

    // Cria e retorna o token JWT
    const payload = {
      user: { id: newProfessor.rows[0].id, tipo: newProfessor.rows[0].tipo },
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '5h',
    });

    res.status(201).json({ token, professor: newProfessor.rows[0] });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

// ROTA: GET /api/professores/perfil
// DESC: Obtém o perfil do professor autenticado
router.get('/perfil', requireAuth, async (req, res) => {
  try {
    // Verifica se o usuário é um professor
    if (req.user.tipo !== 'professor') {
      return res.status(403).json({
        msg: 'Acesso negado. Apenas professores podem acessar este recurso.',
      });
    }

    const professor = await db.query(
      'SELECT id, nome, email, formacao, instituicao, areas_atuacao FROM usuarios WHERE id = $1',
      [req.user.id]
    );

    if (professor.rows.length === 0) {
      return res.status(404).json({ msg: 'Professor não encontrado.' });
    }

    res.json(professor.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

// ROTA: PUT /api/professores/perfil
// DESC: Atualiza o perfil do professor autenticado
router.put('/perfil', requireAuth, async (req, res) => {
  const { nome, email, formacao, instituicao, areas_atuacao } = req.body;

  try {
    // Verifica se o usuário é um professor
    if (req.user.tipo !== 'professor') {
      return res.status(403).json({
        msg: 'Acesso negado. Apenas professores podem acessar este recurso.',
      });
    }

    // Atualiza os dados do professor
    const updatedProfessor = await db.query(
      'UPDATE usuarios SET nome = $1, email = $2, formacao = $3, instituicao = $4, areas_atuacao = $5 WHERE id = $6 RETURNING id, nome, email, formacao, instituicao, areas_atuacao',
      [nome, email, formacao, instituicao, areas_atuacao, req.user.id]
    );

    res.json(updatedProfessor.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

// ROTA: GET /api/professores/alunos
// DESC: Obtém todos os usuários (alunos) para o professor poder lançar notas.
// NOTA: Este endpoint consulta auth.users (Supabase) e não a tabela legada 'usuarios'.
router.get('/alunos', requireAuth, async (req, res) => {
  try {
    // Idealmente, verificaríamos se o req.user é um professor aqui.

    const { data, error } = await db.query(
      'SELECT id, email, raw_user_meta_data as metadata FROM auth.users'
    );

    if (error) {
      throw error;
    }

    // Mapeia os dados para um formato mais amigável
    const alunos = data.rows.map((aluno) => ({
      id: aluno.id,
      email: aluno.email,
      nome: aluno.metadata?.nome || 'Nome não definido',
    }));

    res.json(alunos);
  } catch (err) {
    console.error('Erro ao buscar alunos:', err.message);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

module.exports = router;
