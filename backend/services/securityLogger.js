// services/securityLogger.js
const winston = require('winston');
const fs = require('fs');
const path = require('path');

// ConfiguraÃ§Ã£o do logger de seguranÃ§a
const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'security' },
  transports: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/security.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Adicionar logger para console em ambiente de desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  securityLogger.add(
    new winston.transports.Console({
      format: winston.format.simple(),
    })
  );
}

// PadrÃµes de detecÃ§Ã£o de ameaÃ§as
const threatPatterns = {
  xss: [
    /<script[^>]*>.*?<\/script>/gi,
    /<img[^>]*>/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
  ],
  pathTraversal: [/(\.\.[/\\]+)/g, /\.\.%2f/gi, /\.\.%5c/gi, /%2e%2e/gi],
  commandInjection: [
    /(\||;|&|\$\(|\`)/g,
    /(rm\s|del\s|format\s|shutdown\s)/gi,
    /(\.\.(\/|\\))/g,
  ],
};

/**
 * FunÃ§Ã£o para registrar atividades de seguranÃ§a
 * @param {string} level - NÃ­vel do log (info, warn, error)
 * @param {string} message - Mensagem do log
 * @param {Object} meta - Metadados adicionais
 */
function logSecurity(level, message, meta = {}) {
  securityLogger.log(level, message, meta);
}

/**
 * Detectar tentativas de XSS
 * @param {string} input - Entrada do usuÃ¡rio
 * @returns {boolean} - True se detectado XSS
 */
function detectXSS(input) {
  if (typeof input !== 'string') return false;
  
  return threatPatterns.xss.some(pattern => pattern.test(input));
}

/**
 * Detectar tentativas de Path Traversal
 * @param {string} input - Entrada do usuÃ¡rio
 * @returns {boolean} - True se detectado Path Traversal
 */
function detectPathTraversal(input) {
  if (typeof input !== 'string') return false;
  
  return threatPatterns.pathTraversal.some(pattern => pattern.test(input));
}

/**
 * Detectar tentativas de Command Injection
 * @param {string} input - Entrada do usuÃ¡rio
 * @returns {boolean} - True se detectado Command Injection
 */
function detectCommandInjection(input) {
  if (typeof input !== 'string') return false;
  
  return threatPatterns.commandInjection.some(pattern => pattern.test(input));
}

module.exports = {
  securityLogger,
  logSecurity,
  detectXSS,
  detectPathTraversal,
  detectCommandInjection,
};
