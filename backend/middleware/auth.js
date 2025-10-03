// middleware/auth.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const requireAuth = (req, res, next) => {
  // Obter o token do cabeçalho
  const token = req.header('x-auth-token');

  // Checar se não tem token
  if (!token) {
    return res.status(401).json({ msg: 'Nenhum token, acesso negado.' });
  }

  try {
    // Verificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Adicionar o ID do usuário à requisição
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token inválido.' });
  }
};

module.exports = { requireAuth };
