// routes/auth.js - Rotas de Autenticação (Registro e Login)
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db'); // Nosso módulo de conexão com o DB

const router = express.Router();

// Importa middlewares de segurança
const {
  authRateLimit,
  registerRateLimit,
} = require('../middleware/rateLimiter');
const { generateCSRFToken } = require('../middleware/csrfProtection');

// ROTA: GET /api/auth/csrf-token
// DESC: Gera e retorna um token CSRF para proteção contra ataques CSRF
router.get('/csrf-token', (req, res) => {
  const token = generateCSRFToken();
  res.json({ csrfToken: token });
});

// ROTA: POST /api/auth/register
// DESC: Registra um novo usuário
router.post('/register', registerRateLimit, async (req, res) => {
  const { nome, email, senha } = req.body;

  // 1. Validação simples
  if (!nome || !email || !senha) {
    return res
      .status(400)
      .json({ msg: 'Por favor, preencha todos os campos.' });
  }

  try {
    // 2. Verifica se o usuário já existe
    const userExists = await db.query(
      'SELECT * FROM usuarios WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res
        .status(400)
        .json({ msg: 'Usuário com este e-mail já existe.' });
    }

    // 3. Criptografa a senha
    const salt = await bcrypt.genSalt(10);
    const senha_hash = await bcrypt.hash(senha, salt);

    // 4. Salva o novo usuário no banco
    const newUser = await db.query(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3) RETURNING id, nome, email',
      [nome, email, senha_hash]
    );

    // 5. Cria e retorna o token JWT (para que o usuário já entre logado)
    const payload = { user: { id: newUser.rows[0].id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '5h',
    });

    res.status(201).json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

// ROTA: POST /api/auth/login
// DESC: Autentica um usuário e retorna o token
router.post('/login', authRateLimit, async (req, res) => {
  const { email, senha } = req.body;

  // 1. Validação simples
  if (!email || !senha) {
    return res
      .status(400)
      .json({ msg: 'Por favor, preencha todos os campos.' });
  }

  try {
    // 2. Verifica se o usuário existe
    const user = await db.query('SELECT * FROM usuarios WHERE email = $1', [
      email,
    ]);
    if (user.rows.length === 0) {
      return res.status(400).json({ msg: 'Credenciais inválidas.' }); // Mensagem genérica por segurança
    }

    // 3. Compara a senha enviada com a senha no banco
    const isMatch = await bcrypt.compare(senha, user.rows[0].senha_hash);
    if (!isMatch) {
      return res.status(400).json({ msg: 'Credenciais inválidas.' });
    }

    // 4. Cria e retorna o token JWT
    const payload = { user: { id: user.rows[0].id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '5h',
    });

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Erro no servidor' });
  }
});

module.exports = router;
