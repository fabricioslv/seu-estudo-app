# 🚀 Deploy Empresarial - Seu Estudo

## Visão Geral

Este documento descreve o processo completo de deploy empresarial da aplicação **Seu Estudo**, incluindo configurações de produção, monitoramento, segurança e escalabilidade.

## 📋 Pré-requisitos

### Infraestrutura Necessária
- **Conta Vercel** (Frontend e Backend)
- **Conta Supabase** (Banco de dados PostgreSQL)
- **Domínio personalizado** (opcional)
- **Certificado SSL** (automático no Vercel)

### Variáveis de Ambiente
```bash
# Frontend (.env)
REACT_APP_API_URL=https://backend-production.vercel.app
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key

# Backend (.env)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-key
GOOGLE_AI_API_KEY=your-google-ai-key
JWT_SECRET=your-jwt-secret
NODE_ENV=production
PORT=3001
```

## 🏗️ Processo de Deploy

### Passo 1: Configuração do Supabase (Banco de Produção)

#### 1.1 Criar Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com)
2. Clique em "New Project"
3. Escolha organização ou crie uma nova
4. Configure:
   - **Name**: seu-estudo-production
   - **Database Password**: senha-forte-aqui
   - **Region**: Escolha a região mais próxima dos usuários (us-east-1 recomendado)

#### 1.2 Configurar Banco de Dados
```sql
-- Executar scripts de inicialização em ordem
\i backend/db/init.js
\i backend/db/init-gamification.js
\i backend/db/init-all-content-db.mjs
```

#### 1.3 Configurar Autenticação
1. Vá para Authentication > Settings
2. Configure:
   - **Site URL**: https://frontend-production.vercel.app
   - **Redirect URLs**: https://frontend-production.vercel.app/auth/callback
   - Habilite provedores necessários (Email, Google, etc.)

#### 1.4 Configurar Storage (para PDFs)
1. Vá para Storage > Policies
2. Crie bucket "livros-didaticos" com políticas adequadas

### Passo 2: Deploy do Backend

#### 2.1 Preparar Código para Produção
1. **Atualizar package.json:**
```json
{
  "scripts": {
    "start": "node index.js",
    "build": "echo 'No build step required'"
  },
  "engines": {
    "node": "18.x"
  }
}
```

2. **Criar vercel.json:**
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/index.js"
    }
  ],
  "env": {
    "NODE_ENV": "production"
  }
}
```

#### 2.2 Deploy no Vercel
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod

# Ou conectar repositório Git para deploy automático
vercel --prod
```

### Passo 3: Deploy do Frontend

#### 3.1 Preparar Build de Produção
1. **Atualizar package.json:**
```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "homepage": "https://frontend-production.vercel.app"
}
```

2. **Otimizar build:**
```bash
# Build otimizado
GENERATE_SOURCEMAP=false npm run build
```

#### 3.2 Deploy no Vercel
```bash
# Deploy do frontend
vercel --prod
```

### Passo 4: Configurações de Domínio

#### 4.1 Configurar Domínio Personalizado
1. Comprar domínio (recomendado: seuestudo.com.br)
2. No Vercel Dashboard:
   - Ir para Project Settings > Domains
   - Adicionar domínio personalizado
   - Configurar DNS conforme instruções

#### 4.2 Configurar SSL
- Certificado automático fornecido pelo Vercel
- Suporte HTTP/2 e HTTP/3
- Renovação automática

## 📊 Monitoramento e Observabilidade

### 4.1 Logs e Monitoramento

#### Vercel Analytics
```javascript
// No index.html do frontend
<script>
  window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };
</script>
<script defer src="/_vercel/insights/script.js"></script>
```

#### Winston Logger (Backend)
```javascript
// backend/services/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'seu-estudo-backend' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});
```

### 4.2 Métricas de Performance

#### Web Vitals (Frontend)
```javascript
// src/reportWebVitals.js
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

function sendToAnalytics({ name, delta, id }) {
  // Send to analytics service
  console.log('Web Vital:', name, delta);
}

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

#### Prometheus (Backend)
```javascript
// Middleware para métricas
const promClient = require('prom-client');

// Coletor padrão
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

// Métricas customizadas
const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total de requests HTTP',
  labelNames: ['method', 'route', 'status_code']
});

// Endpoint para métricas
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  const metrics = await promClient.register.metrics();
  res.end(metrics);
});
```

## 🔒 Segurança Empresarial

### 5.1 Configurações de Segurança

#### Headers de Segurança
```javascript
// backend/middleware/security.js
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

#### Rate Limiting
```javascript
// backend/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 1000, // limite de 1000 requests por janela
  message: {
    error: true,
    msg: 'Muitas tentativas. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);
```

#### Validação de Dados
```javascript
// backend/middleware/validation.js
const Joi = require('joi');

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  senha: Joi.string().min(6).required()
});

app.post('/api/auth/login', (req, res, next) => {
  const { error } = loginSchema.validate(req.body);
  if (error) {
    return res.status(400).json({
      error: true,
      msg: 'Dados inválidos',
      detalhes: error.details
    });
  }
  next();
});
```

### 5.2 Backup e Recuperação

#### Backup Automático (Supabase)
1. Ir para Settings > Database
2. Configurar Point-in-Time Recovery (PITR)
3. Configurar backups automáticos

#### Script de Backup Manual
```javascript
// scripts/backup-database.js
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `backup-${timestamp}.sql`;

  // Gerar backup usando pg_dump (se necessário)
  console.log(`Backup criado: ${filename}`);
}
```

## 🚀 Escalabilidade

### 6.1 Configurações de Performance

#### Database Optimization
```sql
-- Índices para performance
CREATE INDEX CONCURRENTLY idx_questoes_materia ON questoes(materia);
CREATE INDEX CONCURRENTLY idx_questoes_dificuldade ON questoes(dificuldade);
CREATE INDEX CONCURRENTLY idx_simulados_usuario ON resultados_simulado(usuario_id);
CREATE INDEX CONCURRENTLY idx_gamificacao_usuario ON pontuacao(usuario_id);

-- Views materializadas para relatórios
CREATE MATERIALIZED VIEW relatorio_desempenho AS
SELECT
  usuario_id,
  COUNT(*) as total_simulados,
  AVG(pontuacao) as media_pontuacao,
  MAX(data_realizacao) as ultimo_simulado
FROM resultados_simulado
GROUP BY usuario_id;
```

#### Cache Redis (Opcional)
```javascript
// services/cacheService.js
const redis = require('redis');

const client = redis.createClient({
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD
});

async function getCached(key) {
  const data = await client.get(key);
  return data ? JSON.parse(data) : null;
}

async function setCached(key, data, ttl = 3600) {
  await client.setEx(key, ttl, JSON.stringify(data));
}
```

### 6.2 CDN e Otimização de Assets

#### Configuração Cloudflare
1. Criar conta no Cloudflare
2. Adicionar domínio
3. Configurar Page Rules para cache agressivo
4. Habilitar HTTP/2 e HTTP/3

#### Otimização de Imagens
```javascript
// Middleware para otimização automática
app.use('/api/images', express.static('uploads', {
  maxAge: '1y',
  etag: false,
  setHeaders: (res, path) => {
    if (path.endsWith('.jpg') || path.endsWith('.png')) {
      res.set('Cache-Control', 'public, max-age=31536000');
    }
  }
}));
```

## 📋 Manutenção e Operações

### 7.1 Scripts de Manutenção

#### Script de Health Check
```javascript
// scripts/health-check.js
const axios = require('axios');

async function checkHealth() {
  const services = [
    { name: 'Frontend', url: 'https://frontend-production.vercel.app' },
    { name: 'Backend', url: 'https://backend-production.vercel.app/api/health' },
    { name: 'Database', url: 'https://your-project.supabase.co/rest/v1/' }
  ];

  for (const service of services) {
    try {
      const response = await axios.get(service.url, { timeout: 5000 });
      console.log(`✅ ${service.name}: OK (${response.status})`);
    } catch (error) {
      console.error(`❌ ${service.name}: ERRO - ${error.message}`);
    }
  }
}
```

#### Script de Migração de Dados
```javascript
// scripts/migrate-data.js
const { createClient } = require('@supabase/supabase-js');

async function migrateData() {
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Exemplo: migrar dados de desenvolvimento para produção
  console.log('Iniciando migração de dados...');
  // Implementar lógica de migração
}
```

### 7.2 Monitoramento Contínuo

#### Uptime Monitoring (UptimeRobot)
1. Criar conta no UptimeRobot
2. Adicionar monitores para:
   - Frontend (https://frontend-production.vercel.app)
   - Backend API (https://backend-production.vercel.app/api/health)
   - Banco de dados (ping ao Supabase)

#### Error Tracking (Sentry)
```javascript
// Configuração Sentry
const Sentry = require('@sentry/node');

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Middleware para capturar erros
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

## 💰 Custos e Otimização

### 8.1 Estimativa de Custos Mensais (2025)

#### Vercel
- **Pro Plan**: R$ 200/mês (para recursos empresariais)
- **Incluso**: 100GB bandwidth, funções serverless ilimitadas

#### Supabase
- **Pro Plan**: R$ 150/mês
- **Incluso**: 8GB database, 50GB storage, 50GB bandwidth

#### Domínio
- **Registro**: R$ 50/ano (seu-estudo.com.br)

#### Total Estimado: R$ 400/mês

### 8.2 Otimizações de Custo

#### Database Optimization
- Usar índices adequados para reduzir tempo de consulta
- Implementar paginação para grandes conjuntos de dados
- Arquivar dados antigos automaticamente

#### Cache Strategy
- Cache de 24h para conteúdo estático
- Cache de 1h para dados dinâmicos
- Invalidate cache quando dados mudarem

## 🚨 Plano de Contingência

### 9.1 Estratégias de Failover

#### Multi-Region Deploy
```javascript
// Configuração para múltiplas regiões Vercel
{
  "regions": ["iad1", "gru1"], // Washington DC e São Paulo
  "functions": {
    "backend/index.js": {
      "runtime": "nodejs18.x"
    }
  }
}
```

#### Backup Database
- Configurar replica de leitura no Supabase
- Script automático de backup para S3
- Point-in-time recovery habilitado

### 9.2 Procedimentos de Emergência

#### Rollback Procedure
```bash
# Reverter para versão anterior
vercel rollback

# Ou promover versão específica
vercel promote <deployment-url>
```

#### Communication Plan
1. **Notificar usuários** via email/notificações push
2. **Atualizar status page** (status.seu-estudo.com.br)
3. **Comunicar equipe técnica** via Slack/Discord
4. **Monitorar métricas** durante incidente

## 📚 Documentação Técnica

### 10.1 Guias de Operação

#### Para Desenvolvedores
- [Guia de Desenvolvimento](./DESENVOLVIMENTO_PILOTO.md)
- [Documentação da API](./DOCUMENTACAO_API.md)
- [Guia de Estilos](./frontend/src/styles/design-system.css)

#### Para DevOps
- [Guia de Deploy](./DEPLOY_GUIDE.md)
- [Configurações de Monitoramento](./scripts/monitoring/)
- [Procedimentos de Segurança](./SECURITY_GUIDE.md)

### 10.2 Runbooks

#### Incident Response
1. **Identificar incidente** (alertas de monitoramento)
2. **Avaliar impacto** (número de usuários afetados)
3. **Comunicar stakeholders** (equipe e usuários)
4. **Implementar correção** (rollback se necessário)
5. **Documentar lições aprendidas**

## 🎯 Próximos Passos

### Semana 1: Estabilização
- [ ] Configurar monitoramento completo
- [ ] Implementar testes automatizados
- [ ] Documentar procedimentos operacionais

### Semana 2: Otimização
- [ ] Implementar estratégias de cache
- [ ] Otimizar consultas de banco de dados
- [ ] Configurar CDN para assets

### Semana 3: Escalabilidade
- [ ] Preparar infraestrutura para crescimento
- [ ] Implementar load balancing se necessário
- [ ] Configurar auto-scaling

### Semana 4: Monitoramento Avançado
- [ ] Implementar analytics detalhado
- [ ] Configurar alertas inteligentes
- [ ] Preparar relatórios executivos

## 📞 Suporte Empresarial

### Contato Principal
- **Email**: admin@seu-estudo.com.br
- **Telefone**: +55 11 99999-9999
- **Slack**: workspace Seu Estudo

### Escalation Matrix
1. **Tier 1**: Suporte técnico básico (24/7)
2. **Tier 2**: Desenvolvedores seniores (8h-18h)
3. **Tier 3**: Arquitetos de sistema (crítico)

---

**🚀 Seu Estudo - Plataforma preparada para escala empresarial!**

*Última atualização: 30 de Setembro de 2025*