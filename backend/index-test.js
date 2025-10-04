// Versão simplificada do servidor para testes de integração sem banco de dados
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();
const PORT = process.env.PORT || 6001;

// Configuração CORS simples para testes
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:6001',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(helmet());
app.use(cors(corsOptions));
app.use(express.json());

// Simulação de rota de health check sem banco de dados
app.get('/api/health', (req, res) => {
  console.log('🔍 Health check solicitado');
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'test',
    version: '1.0.0-test',
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      unit: 'MB',
    },
    message: 'Servidor de teste funcionando sem banco de dados',
  });
});

// Simulação de rota de autenticação sem banco de dados
app.post('/api/auth/login', (req, res) => {
  console.log('🔍 Tentativa de login:', req.body);

  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({
      msg: 'Por favor, preencha todos os campos.',
      timestamp: new Date().toISOString(),
    });
  }

  // Simulação de autenticação bem-sucedida para teste
  if (email === 'teste@exemplo.com' && senha === 'senha123') {
    return res.json({
      token: 'fake-jwt-token-for-testing',
      user: { id: 1, nome: 'Teste User', email: 'teste@exemplo.com' },
      timestamp: new Date().toISOString(),
    });
  }

  res.status(400).json({
    msg: 'Credenciais inválidas.',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/auth/register', (req, res) => {
  console.log('🔍 Tentativa de registro:', req.body);

  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({
      msg: 'Por favor, preencha todos os campos.',
      timestamp: new Date().toISOString(),
    });
  }

  // Simulação de registro bem-sucedido
  res.status(201).json({
    token: 'fake-jwt-token-for-testing',
    user: { id: Date.now(), nome, email },
    timestamp: new Date().toISOString(),
  });
});

// Rota raiz para verificação básica
app.get('/', (req, res) => {
  res.send('✅ Servidor de teste Seu-Estudo funcionando na porta ' + PORT);
});

// Middleware para tratamento de erros básico
app.use((err, req, res, next) => {
  console.error('Erro:', err.message);
  res.status(500).json({
    msg: 'Erro interno do servidor',
    error: err.message,
    timestamp: new Date().toISOString(),
  });
});

// Tratamento de rotas não encontradas
app.use((req, res) => {
  res.status(404).json({
    msg: 'Rota não encontrada',
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
});

app.listen(PORT, () => {
  console.log('🚀 Servidor de teste iniciado com sucesso!');
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 Auth: http://localhost:${PORT}/api/auth`);
  console.log(`🌐 Frontend esperado: http://localhost:3000`);
  console.log('');
  console.log('📋 Credenciais de teste:');
  console.log('   Email: teste@exemplo.com');
  console.log('   Senha: senha123');
  console.log('');
  console.log('✅ Servidor pronto para testes de integração!');
});

export default app;
