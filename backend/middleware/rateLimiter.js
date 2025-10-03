const rateLimit = require('express-rate-limit');

// Rate limiter específico para tentativas de login
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // Limite de 5 tentativas por janela
  message: {
    error: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
    retryAfter: '15 minutos',
  },
  standardHeaders: true, // Retorna rate limit info nos headers `RateLimit-*`
  legacyHeaders: false, // Desabilita headers `X-RateLimit-*`
  skipSuccessfulRequests: true, // Não conta tentativas bem-sucedidas
  handler: (req, res) => {
    res.status(429).json({
      error:
        'Muitas tentativas de autenticação. Tente novamente em 15 minutos.',
      retryAfter: '15 minutos',
    });
  },
});

// Rate limiter geral para proteção contra ataques de força bruta
const generalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite de 100 requisições por janela
  message: {
    error: 'Muitas requisições. Tente novamente em 15 minutos.',
    retryAfter: '15 minutos',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter mais restritivo para registro
const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 3, // Limite de 3 registros por hora por IP
  message: {
    error: 'Muitas tentativas de registro. Tente novamente em 1 hora.',
    retryAfter: '1 hora',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  authRateLimit,
  generalRateLimit,
  registerRateLimit,
};
