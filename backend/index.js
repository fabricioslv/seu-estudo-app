// index.js - Ponto de entrada para o servidor backend
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '.env') }); // Carrega as variáveis de ambiente de forma explícita

const express = require('express');
const http = require('http');
const helmet = require('helmet');
const { Server } = require('socket.io');

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

// Rate limiting geral
const { generalRateLimit } = require('./middleware/rateLimiter');
app.use('/api', generalRateLimit);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rota de teste inicial
app.get('/', (req, res) => {
  res.send('Servidor do Seu-Estudo está no ar!');
});

// Define as rotas da API
// app.use('/api/auth', require('./routes/auth'));
app.use('/api/questoes', require('./routes/questoes-temp'));
// app.use('/api/professores', require('./routes/professores'));
// app.use('/api/professor/simulados', require('./routes/professorSimulados'));
// app.use('/api/gamificacao', require('./routes/gamificacao')); // Nova rota de gamificação
// app.use('/api/simulados', require('./routes/simulados')); // Rotas para simulados de estudantes
// app.use('/api/mensagens', require('./routes/mensagens')); // Rotas para o sistema de mensagens
// app.use('/api/notificacoes', require('./routes/notificacoes')); // Rotas para o sistema de notificações
// app.use('/api/notas', require('./routes/notas')); // Rotas para o sistema de notas
// app.use('/api/tutoria', require('./routes/tutoria')); // Rotas para o sistema de tutoria

// Lógica do WebSocket para o chat
io.on('connection', (socket) => {
  console.log('Um usuário conectou via WebSocket:', socket.id);

  socket.on('join_room', (room) => {
    socket.join(room);
    console.log(`Usuário ${socket.id} entrou na sala: ${room}`);
  });

  socket.on('send_message', (data) => {
    // Emite a mensagem para todos na sala, incluindo o remetente
    io.to(data.room).emit('receive_message', data);
  });

  socket.on('disconnect', () => {
    console.log('Usuário desconectou:', socket.id);
  });
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
