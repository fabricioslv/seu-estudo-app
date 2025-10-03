/**
 * Middleware de tratamento de erros global
 * Captura e categoriza todos os tipos de erro no sistema
 */

const { logger, securityLogger, systemLogger } = require('../services/logger');

// Classe base para erros customizados
class AppError extends Error {
  constructor(message, statusCode, isOperational = true, errorCode = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Erros específicos de validação
class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, true, 'VALIDATION_ERROR');
    this.details = details;
  }
}

// Erros de autenticação/autorização
class AuthenticationError extends AppError {
  constructor(message = 'Não autenticado') {
    super(message, 401, true, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Não autorizado') {
    super(message, 403, true, 'AUTHORIZATION_ERROR');
  }
}

// Erros de recursos não encontrados
class NotFoundError extends AppError {
  constructor(resource = 'Recurso') {
    super(`${resource} não encontrado`, 404, true, 'NOT_FOUND_ERROR');
  }
}

// Erros de conflito
class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, true, 'CONFLICT_ERROR');
  }
}

// Erros internos do servidor
class InternalServerError extends AppError {
  constructor(message = 'Erro interno do servidor') {
    super(message, 500, true, 'INTERNAL_SERVER_ERROR');
  }
}

// Erros de banco de dados
class DatabaseError extends AppError {
  constructor(message = 'Erro de banco de dados', originalError = null) {
    super(message, 500, true, 'DATABASE_ERROR');
    this.originalError = originalError;
  }
}

// Erros de segurança
class SecurityError extends AppError {
  constructor(message, threatLevel = 'medium') {
    super(message, 403, true, 'SECURITY_ERROR');
    this.threatLevel = threatLevel;
  }
}

// Função para determinar o tipo de erro baseado no código de erro do PostgreSQL
const mapDatabaseError = (error) => {
  const errorCode = error.code;

  switch (errorCode) {
    case '23505': // unique_violation
      return new ConflictError('Registro já existe');
    case '23503': // foreign_key_violation
      return new ValidationError('Referência inválida a registro relacionado');
    case '23502': // not_null_violation
      return new ValidationError('Campo obrigatório não informado');
    case '42P01': // undefined_table
      return new DatabaseError('Tabela não existe');
    case '08006': // connection_failure
      return new DatabaseError('Falha na conexão com banco de dados');
    case '08000': // connection_exception
      return new DatabaseError('Erro de conexão com banco de dados');
    default:
      return new DatabaseError('Erro inesperado no banco de dados');
  }
};

// Middleware principal de tratamento de erros
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log do erro
  const errorContext = {
    url: req.url,
    method: req.method,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString(),
    stack: err.stack,
  };

  // Se for erro de sintaxe JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    error = new ValidationError('JSON inválido');
    logger.warn('Erro de sintaxe JSON', { ...errorContext, body: err.body });
  }

  // Se for erro de validação do Joi ou similar
  if (err.isJoi) {
    error = new ValidationError('Dados de entrada inválidos', err.details);
    logger.warn('Erro de validação', { ...errorContext, details: err.details });
  }

  // Se for erro de autenticação JWT
  if (err.name === 'JsonWebTokenError') {
    error = new AuthenticationError('Token inválido');
    securityLogger(
      'Tentativa de autenticação com token inválido',
      errorContext
    );
  }

  // Se for erro de expiração de JWT
  if (err.name === 'TokenExpiredError') {
    error = new AuthenticationError('Token expirado');
    securityLogger(
      'Tentativa de autenticação com token expirado',
      errorContext
    );
  }

  // Se for erro do banco de dados PostgreSQL
  if (
    (err.code && err.code.startsWith('23')) ||
    err.code.startsWith('42') ||
    err.code.startsWith('08')
  ) {
    error = mapDatabaseError(err);
    logger.error('Erro de banco de dados', {
      ...errorContext,
      dbErrorCode: err.code,
    });
  }

  // Se for erro de multer (upload de arquivos)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new ValidationError('Arquivo muito grande');
    logger.warn('Tentativa de upload de arquivo muito grande', errorContext);
  }

  // Se for erro de CSRF
  if (err.code === 'EBADCSRFTOKEN') {
    error = new SecurityError('Token CSRF inválido', 'high');
    securityLogger('Tentativa de ataque CSRF detectada', errorContext);
  }

  // Se for erro personalizado da aplicação
  if (!error.isOperational) {
    error = new InternalServerError();
    logger.error('Erro não operacional detectado', {
      ...errorContext,
      originalError: err.message,
    });
  }

  // Registra logs de segurança para erros críticos
  if (error.statusCode >= 500 || error.threatLevel === 'high') {
    securityLogger(`Erro crítico detectado: ${error.message}`, {
      ...errorContext,
      statusCode: error.statusCode,
      threatLevel: error.threatLevel || 'low',
    });
  }

  // Determina o nível de log baseado no status code
  const logLevel =
    error.statusCode >= 500
      ? 'error'
      : error.statusCode >= 400
        ? 'warn'
        : 'info';

  // Log geral do erro
  logger[logLevel](error.message, {
    ...errorContext,
    statusCode: error.statusCode,
    errorCode: error.errorCode,
    details: error.details,
  });

  // Em desenvolvimento, inclui stack trace
  const response = {
    success: false,
    error: {
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      ...(error.errorCode && { code: error.errorCode }),
      ...(error.details && { details: error.details }),
    },
  };

  // Remove informações sensíveis em produção
  if (process.env.NODE_ENV === 'production' && error.statusCode >= 500) {
    response.error.message = 'Erro interno do servidor';
    delete response.error.stack;
    delete response.error.details;
  }

  res.status(error.statusCode || 500).json(response);
};

// Middleware para tratamento de rotas não encontradas
const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Rota ${req.originalUrl} não encontrada`);

  logger.warn('Rota não encontrada', {
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  next(error);
};

// Middleware para capturar erros assíncronos
const asyncErrorHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Middleware para logging de tentativas suspeitas
const securityMonitor = (req, res, next) => {
  const suspiciousPatterns = [
    /\.\.\//, // Path traversal
    /<script/i, // XSS attempts
    /union.*select/i, // SQL injection
    /eval\(/i, // Code injection
    /javascript:/i, // JavaScript protocol
  ];

  const requestData = `${req.url} ${req.body ? JSON.stringify(req.body) : ''} ${req.query ? JSON.stringify(req.query) : ''}`;

  const isSuspicious = suspiciousPatterns.some((pattern) =>
    pattern.test(requestData)
  );

  if (isSuspicious) {
    securityLogger('Tentativa suspeita detectada', {
      url: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      body: req.body,
      query: req.query,
      threatLevel: 'high',
      pattern: 'injection_attempt',
    });

    return next(new SecurityError('Atividade suspeita detectada', 'high'));
  }

  next();
};

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncErrorHandler,
  securityMonitor,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  DatabaseError,
  SecurityError,
};
