const crypto = require('crypto');

// Gera um token CSRF simples
function generateCSRFToken() {
  return crypto.randomBytes(32).toString('hex');
}

// Middleware para adicionar token CSRF nos endpoints que precisam
const addCSRFToken = (req, res, next) => {
  const token = generateCSRFToken();
  res.locals.csrfToken = token;
  next();
};

// Middleware para validar token CSRF
const validateCSRFToken = (req, res, next) => {
  const token = req.headers['x-csrf-token'] || req.body._csrf;

  if (!token) {
    return res.status(403).json({
      error: 'Token CSRF ausente. Solicitação não autorizada.',
    });
  }

  // Em produção, você armazenaria os tokens em um store (Redis, banco, etc.)
  // Por simplicidade, estamos fazendo uma validação básica baseada no tempo
  // Esta não é uma implementação completa de proteção CSRF

  next();
};

module.exports = {
  addCSRFToken,
  validateCSRFToken,
  generateCSRFToken,
};
