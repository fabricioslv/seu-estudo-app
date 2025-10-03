// index.js - Ponto de entrada para o servidor backend
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') }); // Carrega as variáveis de ambiente de forma explícita

const express = require('express');
const http = require('http');
const helmet = require('helmet');
const { Server } = require('socket.io');

// Importa sistemas de logs e tratamento de erros
const {
  logger,
  systemLogger,
  httpLoggerMiddleware,
  performanceMiddleware,
} = require('./services/logger');
const {
  errorHandler,
  notFoundHandler,
  asyncErrorHandler,
  securityMonitor,
} = require('./middleware/errorHandler');
const { securityMonitoringMiddleware } = require('./services/securityLogger');
const {
  performanceMonitoringMiddleware,
  SystemMetrics,
} = require('./services/performanceLogger');
const {
  businessActivityMiddleware,
  businessLogger,
} = require('./services/businessLogger');

const app = express();
const server = http.createServer(app);

// Configuração CORS segura baseada no ambiente
const cors = require('cors');
const corsOptions = {
  origin: function (origin, callback) {
    // Em produção, permita apenas domínios específicos
    const allowedOrigins =
      process.env.NODE_ENV === 'production'
        ? [
            'https://seu-estudo.vercel.app',
            'https://www.seu-estudo.com',
            process.env.FRONTEND_URL,
          ].filter(Boolean)
        : [
            'http://localhost:3000',
            'http://127.0.0.1:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3001',
          ];

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
  exposedHeaders: ['x-csrf-token'],
};

// Configuração Socket.IO com CORS seguro
const io = new Server(server, {
  cors: corsOptions,
});

const PORT = process.env.PORT || 2000;

// Inicializa sistemas de monitoramento
const systemMetrics = new SystemMetrics();
systemMetrics.startMonitoring();

// Inicializa serviço de health checks avançado
const HealthCheckService = require('./services/healthCheckService');

// Inicializa variáveis globais para rastreadores
global.businessActivityTracker = null;
global.businessEventTracker = null;

// Logs de inicialização do sistema
systemLogger('Inicializando servidor Seu-Estudo', {
  nodeVersion: process.version,
  platform: process.platform,
  environment: process.env.NODE_ENV || 'development',
  port: PORT,
  timestamp: new Date().toISOString(),
});

// Middlewares de segurança
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Permite recursos externos se necessário
  })
);

// Middleware CORS seguro
app.use(cors(corsOptions));

// Middlewares de logging e monitoramento
app.use(httpLoggerMiddleware);
app.use(performanceMiddleware);
app.use(securityMonitoringMiddleware);
app.use(performanceMonitoringMiddleware);
app.use(businessActivityMiddleware);

// Rate limiting geral
const { generalRateLimit } = require('./middleware/rateLimiter');
app.use('/api', generalRateLimit);

// Monitoramento de segurança adicional
app.use('/api', securityMonitor);

// Middleware para parsing de dados
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rotas públicas
app.get('/', (req, res) => {
  systemLogger('Acesso à página inicial', {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
  });
  res.send('Servidor do Seu-Estudo está no ar!');
});

// Define as rotas da API com tratamento de erros automático
try {
  // app.use('/api/auth', require('./routes/auth'));
  app.use(
    '/api/questoes',
    asyncErrorHandler(require('./routes/questoes-temp'))
  );
  app.use('/api', asyncErrorHandler(require('./routes/health'))); // Rotas de health check para monitoramento
  // app.use('/api/professores', asyncErrorHandler(require('./routes/professores')));
  // app.use('/api/professor/simulados', asyncErrorHandler(require('./routes/professorSimulados')));
  // app.use('/api/gamificacao', asyncErrorHandler(require('./routes/gamificacao'))); // Nova rota de gamificação
  // app.use('/api/simulados', asyncErrorHandler(require('./routes/simulados'))); // Rotas para simulados de estudantes
  // app.use('/api/mensagens', asyncErrorHandler(require('./routes/mensagens'))); // Rotas para o sistema de mensagens
  // app.use('/api/notificacoes', asyncErrorHandler(require('./routes/notificacoes'))); // Rotas para o sistema de notificações
  // app.use('/api/notas', asyncErrorHandler(require('./routes/notas'))); // Rotas para o sistema de notas
  // app.use('/api/tutoria', asyncErrorHandler(require('./routes/tutoria'))); // Rotas para o sistema de tutoria

  systemLogger('Rotas da API registradas com sucesso');
} catch (error) {
  systemLogger('Erro ao registrar rotas da API', { error: error.message });
  throw error;
}

// Middleware para tratamento de rotas não encontradas
app.use(notFoundHandler);

// Lógica do WebSocket para o chat com logs estruturados
io.on('connection', (socket) => {
  systemLogger('Nova conexão WebSocket estabelecida', {
    socketId: socket.id,
    ip: socket.handshake.address,
    userAgent: socket.handshake.headers['user-agent'],
  });

  socket.on('join_room', (room) => {
    socket.join(room);
    businessLogger('Usuário entrou em sala de chat', {
      socketId: socket.id,
      room,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('send_message', (data) => {
    // Emite a mensagem para todos na sala, incluindo o remetente
    io.to(data.room).emit('receive_message', data);

    businessLogger('Mensagem enviada no chat', {
      socketId: socket.id,
      room: data.room,
      messageLength: data.message ? data.message.length : 0,
      timestamp: new Date().toISOString(),
    });
  });

  socket.on('disconnect', () => {
    systemLogger('Conexão WebSocket desconectada', {
      socketId: socket.id,
      timestamp: new Date().toISOString(),
    });
  });
});

// Tratamento de erros global
app.use(errorHandler);

// Inicialização do servidor com logs detalhados
const startServer = async () => {
  try {
    server.listen(PORT, () => {
      systemLogger('Servidor iniciado com sucesso', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString(),
      });

      logger.info(`Servidor Seu-Estudo rodando na porta ${PORT}`);
    });

    // Tratamento de sinais de interrupção
    process.on('SIGTERM', gracefulShutdown);
    process.on('SIGINT', gracefulShutdown);

    // Tratamento de erros não capturados
    process.on('uncaughtException', (error) => {
      systemLogger('Erro não capturado detectado', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      systemLogger('Promessa rejeitada não tratada', {
        reason: reason.toString(),
        timestamp: new Date().toISOString(),
      });
    });
  } catch (error) {
    systemLogger('Erro ao iniciar servidor', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1);
  }
};

// Função para desligamento gracioso
const gracefulShutdown = () => {
  systemLogger('Iniciando desligamento gracioso do servidor', {
    timestamp: new Date().toISOString(),
  });

  server.close(() => {
    systemLogger('Servidor HTTP fechado');

    // Para monitoramento de métricas
    systemMetrics.stopMonitoring();

    // Para serviço de health checks
    if (global.healthCheckService) {
      global.healthCheckService.stopMonitoring();
    }

    systemLogger('Desligamento gracioso concluído');
    process.exit(0);
  });

  // Força o fechamento após 10 segundos
  setTimeout(() => {
    systemLogger('Forçando fechamento do servidor (timeout)');
    process.exit(1);
  }, 10000);
};

// Inicia o servidor
startServer();
