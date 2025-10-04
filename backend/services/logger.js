/**
 * Módulo de logs estruturado usando Winston
 * Implementa diferentes níveis de log, rotação de arquivos e formatos estruturados
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define os níveis de log personalizados
const customLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
  security: 5,
  performance: 6,
  business: 7,
  system: 8,
};

const customColors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
  security: 'cyan',
  performance: 'gray',
  business: 'white',
  system: 'gray',
};

// Adiciona cores ao Winston
winston.addColors(customColors);

// Formato personalizado para logs estruturados
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? `\n${JSON.stringify(meta, null, 2)}`
      : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${metaStr}`;
  })
);

// Formato para console (desenvolvimento)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? ` | ${JSON.stringify(meta)}`
      : '';
    return `${timestamp} ${level}: ${message}${metaStr}`;
  })
);

// Configuração de transporte para arquivos rotativos
const fileTransport = new DailyRotateFile({
  filename: path.join(__dirname, '../logs', 'app-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  level: process.env.LOG_LEVEL || 'info',
  format: structuredFormat,
});

// Transporte para erros críticos
const errorFileTransport = new DailyRotateFile({
  filename: path.join(__dirname, '../logs', 'error-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '60d',
  level: 'error',
  format: structuredFormat,
});

// Transporte para logs de segurança
const securityFileTransport = new DailyRotateFile({
  filename: path.join(__dirname, '../logs', 'security-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '90d',
  level: 'security',
  format: structuredFormat,
});

// Transporte para logs de performance
const performanceFileTransport = new DailyRotateFile({
  filename: path.join(__dirname, '../logs', 'performance-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  level: 'performance',
  format: structuredFormat,
});

// Transporte para logs de negócio
const businessFileTransport = new DailyRotateFile({
  filename: path.join(__dirname, '../logs', 'business-%DATE%.log'),
  datePattern: 'YYYY-MM-DD',
  maxSize: '20m',
  maxFiles: '30d',
  level: 'business',
  format: structuredFormat,
});

// Criação do logger principal
const logger = winston.createLogger({
  levels: customLevels,
  level: process.env.LOG_LEVEL || 'info',
  format: structuredFormat,
  defaultMeta: {
    service: 'seu-estudo-backend',
    hostname: os.hostname(),
    pid: process.pid,
    version: process.env.npm_package_version || '1.0.0',
  },
  transports: [
    // Transporte para console (apenas em desenvolvimento)
    new winston.transports.Console({
      level: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
      format: consoleFormat,
      handleExceptions: true,
      handleRejections: true,
    }),

    // Arquivos rotativos
    fileTransport,
    errorFileTransport,
    securityFileTransport,
    performanceFileTransport,
    businessFileTransport,
  ],

  // Tratamento de exceções não capturadas
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs', 'exceptions.log'),
    }),
  ],

  // Tratamento de promessas rejeitadas
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(__dirname, '../logs', 'rejections.log'),
    }),
  ],
});

// Função utilitária para adicionar contexto aos logs
const addContext = (context) => {
  return (message, meta = {}) => {
    logger.info(message, { ...context, ...meta });
  };
};

// Funções específicas para diferentes tipos de log
const securityLogger = (message, meta = {}) => {
  logger.security(message, {
    category: 'security',
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

const performanceLogger = (message, meta = {}) => {
  logger.performance(message, {
    category: 'performance',
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

const businessLogger = (message, meta = {}) => {
  logger.business(message, {
    category: 'business',
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

const systemLogger = (message, meta = {}) => {
  logger.system(message, {
    category: 'system',
    timestamp: new Date().toISOString(),
    ...meta,
  });
};

// Middleware para logging de requests HTTP
const httpLoggerMiddleware = (req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const level = res.statusCode >= 400 ? 'warn' : 'http';

    logger.http('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
    });
  });

  next();
};

// Middleware para logging de performance
const performanceMiddleware = (req, res, next) => {
  const startTime = process.hrtime.bigint();

  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const durationMs = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    performanceLogger('API Request Performance', {
      method: req.method,
      url: req.url,
      duration: durationMs,
      statusCode: res.statusCode,
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString(),
    });
  });

  next();
};

export {
  logger,
  addContext,
  securityLogger,
  performanceLogger,
  businessLogger,
  systemLogger,
  httpLoggerMiddleware,
  performanceMiddleware,
};

