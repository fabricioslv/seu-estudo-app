#!/usr/bin/env node

// =============================================================================
// PONTO DE ENTRADA DO SERVIDOR BACKEND - SeuEstudo
// =============================================================================
// Arquivo principal do servidor backend da aplicação SeuEstudo
// Responsável por inicializar todos os serviços e configurações

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') });

// Carrega as variáveis de ambiente de forma explícita
const express = require('express');

// LOG DIAGNÓSTICO: Verificando início do servidor
console.log('🔬 DIAGNÓSTICO: Iniciando servidor SeuEstudo');
console.log('🔬 DIAGNÓSTICO: NODE_ENV =', process.env.NODE_ENV);
console.log('🔬 DIAGNÓSTICO: Porta =', process.env.PORT || 2000);
console.log('🔬 DIAGNÓSTICO: Database URL configurada =', !!process.env.DATABASE_URL);
console.log('🔬 DIAGNÓSTICO: JWT_SECRET configurado =', !!process.env.JWT_SECRET);
console.log('🔬 DIAGNÓSTICO: FRONTEND_URL =', process.env.FRONTEND_URL);
console.log('🔬 DIAGNÓSTICO: Todas as variáveis de ambiente carregadas');

const http = require('http');
const helmet = require('helmet');
const { Server } = require('socket.io');

// Importa sistemas de logs e tratamento de erros
import logger, { systemLogger, httpLoggerMiddleware, performanceMiddleware } from './services/logger.js';
import { errorHandler, notFoundHandler, asyncErrorHandler, securityMonitor } from './middleware/errorHandler.mjs';
import securityMonitoringMiddleware from './services/securityLogger.js';
import { performanceMonitoringMiddleware, SystemMetrics } from './services/performanceLogger.js';
import { businessActivityMiddleware, businessLogger } from './services/businessLogger.js';

import cors from 'cors';

const app = express();
const server = http.createServer(app);

// Configuração CORS segura baseada no ambiente
const corsOptions = {
  origin: function (origin, callback) {
    // Em produção, permita apenas domínios específicos
    const allowedOrigins = process.env.NODE_ENV === 'production'
      ? ['https://seu-estudo.vercel.app', 'https://www.seu-estudo.com', process.env.FRONTEND_URL].filter(Boolean)
      : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3001', 'http://127.0.0.1:3001'];

    // Permite requisições sem origin (como apps mobile)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Não permitido pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
  exposedHeaders: ['x-csrf-token']
};

// Configuração Socket.IO com CORS seguro
const io = new Server(server, {
  cors: corsOptions
});

const PORT = process.env.PORT || 2000;

// Inicializa sistemas de monitoramento
const systemMetrics = new SystemMetrics();
systemMetrics.startMonitoring();

// Inicializa serviço de health checks avançado
import HealthCheckService from './services/healthCheckService.js';

// Inicializa variáveis globais para rastreadores
global.businessActivityTracker = null;
global.businessEventTracker = null;

// Logs de inicialização do sistema
systemLogger.info('Inicializando servidor SeuEstudo', {
  nodeVersion: process.version,
  platform: process.platform,
  environment: process.env.NODE_ENV || 'development',
  port: PORT,
  timestamp: new Date().toISOString()
});

// Middlewares de segurança
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
      crossOriginEmbedderPolicy: false // Permite recursos externos se necessário
    }
  }
}));

// Middleware CORS seguro
app.use(cors(corsOptions));

// Middlewares de logging e monitoramento
app.use(httpLoggerMiddleware);
app.use(performanceMiddleware);
app.use(securityMonitoringMiddleware);
app.use(performanceMonitoringMiddleware);
app.use(businessActivityMiddleware);

// Rate limiting geral
import generalRateLimit from './middleware/rateLimiter.mjs';
app.use('/api/', generalRateLimit);

// Monitoramento de segurança adicional
app.use('/api/', securityMonitor);

// Middleware para parsing de dados
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rotas públicas
app.get('/', (req, res) => {
  systemLogger.info('Acesso à página inicial', {
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  res.send('Servidor do SeuEstudo está no ar!');
});

// Define as rotas da API com tratamento de erros automático
try {
  app.use('/api/auth', require('./routes/auth'));
  app.use('/api/questoes', asyncErrorHandler(require('./routes/questoes-temp')));
  app.use('/api/', asyncErrorHandler(require('./routes/health')));
  app.use('/api/professores', asyncErrorHandler(require('./routes/professores')));
  app.use('/api/professor-simulados', asyncErrorHandler(require('./routes/professorSimulados')));
  app.use('/api/gamificacao', asyncErrorHandler(require('./routes/gamificacao')));
  app.use('/api/simulados', asyncErrorHandler(require('./routes/simulados')));
  app.use('/api/mensagens', asyncErrorHandler(require('./routes/mensagens')));
  app.use('/api/notificacoes', asyncErrorHandler(require('./routes/notificacoes')));
  app.use('/api/notas', asyncErrorHandler(require('./routes/notas')));
  app.use('/api/tutoria', asyncErrorHandler(require('./routes/tutoria')));

  systemLogger.info('Rotas da API registradas com sucesso');
} catch (error) {
  systemLogger.error('Erro ao registrar rotas da API', { error: error.message });
  throw error;
}

// Middleware para tratamento de rotas não encontradas
app.use(notFoundHandler);

// Lógica do WebSocket para o chat com logs estruturados
io.on('connection', (socket) => {
  systemLogger.info('Nova conexão WebSocket estabelecida', {
    socketId: socket.id,
    ip: socket.handshake.address,
    userAgent: socket.handshake.headers['user-agent']
  });

  socket.on('join-room', (room) => {
    socket.join(room);
    businessLogger.info('Usuário entrou em sala de chat', {
      socketId: socket.id,
      room,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('send-message', (data) => {
    // Emite a mensagem para todos na sala, incluindo o remetente
    io.to(data.room).emit('receive-message', data);
    businessLogger.info('Mensagem enviada no chat', {
      socketId: socket.id,
      room: data.room,
      messageLength: data.message ? data.message.length : 0,
      timestamp: new Date().toISOString()
    });
  });

  socket.on('disconnect', () => {
    systemLogger.info('Conexão WebSocket desconectada', {
      socketId: socket.id,
      timestamp: new Date().toISOString()
    });
  });
});

// Tratamento de erros global
app.use(errorHandler);

// Inicialização do servidor com logs detalhados
const startServer = async () => {
  try {
    server.listen(PORT, () => {
      systemLogger.info('Servidor iniciado com sucesso', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      });
      logger.info(`Servidor SeuEstudo rodando na porta ${PORT}`);
    });

    // Tratamento de sinais de interrupção
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Tratamento de erros não capturados
    process.on('uncaughtException', (error) => {
      systemLogger.error('Erro não capturado detectado', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      systemLogger.error('Promessa rejeitada não tratada', {
        reason: reason.toString(),
        timestamp: new Date().toISOString()
      });
    });

  } catch (error) {
    systemLogger.error('Erro ao iniciar servidor', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
};

// Função para desligamento gracioso
const gracefulShutdown = () => {
  systemLogger.info('Iniciando desligamento gracioso do servidor', {
    timestamp: new Date().toISOString()
  });

  server.close(() => {
    systemLogger.info('Servidor HTTP fechado');

    // Para monitoramento de métricas
    systemMetrics.stopMonitoring();

    // Para serviço de health checks
    if (global.healthCheckService) {
      global.healthCheckService.stopMonitoring();
    }

    systemLogger.info('Desligamento gracioso concluído');
    process.exit(0);
  });

  // Força o fechamento após 10 segundos
  setTimeout(() => {
    systemLogger.error('Forçando fechamento do servidor (timeout)');
    process.exit(1);
  }, 10000);
};

// Inicia o servidor
startServer();
