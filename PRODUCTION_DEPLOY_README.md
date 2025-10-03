# 🚀 Deploy para Produção - Seu-Estudo

Este documento descreve o processo completo de deploy para produção do projeto Seu-Estudo, incluindo configurações, scripts e procedimentos de segurança.

## 📋 Sumário

- [Pré-requisitos](#pré-requisitos)
- [Configurações de Produção](#configurações-de-produção)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Processo de Deploy](#processo-de-deploy)
- [Scripts Disponíveis](#scripts-disponíveis)
- [Monitoramento e Health Checks](#monitoramento-e-health-checks)
- [Segurança](#segurança)
- [Troubleshooting](#troubleshooting)
- [Rollback](#rollback)

## Pré-requisitos

### 1. Acesso ao Vercel
- Conta verificada no Vercel
- Token de produção configurado
- Projetos criados para frontend e backend

### 2. Variáveis de Ambiente
- Todas as variáveis críticas definidas
- Credenciais de produção configuradas
- Secrets seguros gerados

### 3. Ferramentas Necessárias
- Node.js 18+
- Vercel CLI instalado: `npm i -g vercel`
- Git configurado

## Configurações de Produção

### Arquivos de Configuração Otimizados

#### Backend (backend/vercel.json)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "index.js",
      "use": "@vercel/node",
      "config": {
        "maxLambdaSize": "50mb",
        "includeFiles": ["db/**", "services/**", "middleware/**"]
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "index.js",
      "headers": {
        "cache-control": "no-cache, no-store, must-revalidate",
        "x-frame-options": "DENY",
        "x-content-type-options": "nosniff",
        "x-xss-protection": "1; mode=block",
        "strict-transport-security": "max-age=31536000; includeSubDomains"
      }
    }
  ]
}
```

#### Frontend (frontend/vercel.json)
```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html",
      "headers": {
        "x-frame-options": "DENY",
        "x-content-type-options": "nosniff",
        "strict-transport-security": "max-age=31536000; includeSubDomains"
      }
    }
  ]
}
```

## Variáveis de Ambiente

### Backend (.env.production)
```bash
NODE_ENV=production
DATABASE_URL=postgresql://...
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Frontend (.env.production)
```bash
NODE_ENV=production
REACT_APP_API_URL=https://seu-estudo-backend.vercel.app
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your-anon-key
```

## Processo de Deploy

### Método 1: Deploy Automatizado (Recomendado)

#### Via Script PowerShell
```powershell
# Deploy completo com rollback automático
.\scripts\deploy-production.ps1 -Environment production -AutoRollback -SlackWebhook "https://hooks.slack.com/..."

# Deploy básico
.\scripts\deploy-production.ps1 -Environment production
```

#### Via GitHub Actions
1. Push para branch `main` com tag de versão
2. Pipeline automaticamente:
   - Executa testes completos
   - Build de produção otimizado
   - Deploy para Vercel
   - Testes pós-deploy
   - Notificações

### Método 2: Deploy Manual

#### Backend
```bash
cd backend
npm run build:production
vercel --prod --yes --token $VERCEL_TOKEN
```

#### Frontend
```bash
cd frontend
npm run build:production
vercel --prod --yes --token $VERCEL_TOKEN
```

## Scripts Disponíveis

### Scripts de Build
- `npm run build:production` - Build otimizado para produção
- `npm run build:staging` - Build para ambiente de staging
- `npm run security:audit` - Verificação de vulnerabilidades

### Scripts de Deploy
- `deploy-production.ps1` - Deploy completo para produção
- `deploy-staging-blue-green.ps1` - Deploy azul/verde para staging

### Scripts de Monitoramento
- `npm run health:check` - Verificação básica de saúde
- `npm run performance:test` - Testes de performance

## Monitoramento e Health Checks

### Health Checks Configurados
- **Principal**: `/api/health` - Status geral da aplicação
- **Database**: `/api/health/database` - Conectividade com banco
- **External**: `/api/health/external` - APIs externas
- **Performance**: `/api/health/performance` - Métricas de performance

### URLs de Produção
- **Frontend**: `https://seu-estudo.vercel.app`
- **Backend**: `https://seu-estudo-backend.vercel.app`
- **Health Check**: `https://seu-estudo-backend.vercel.app/api/health`

### Monitoramento Externo
- **Uptime Robot**: Monitora disponibilidade 24/7
- **Sentry**: Captura erros e performance
- **Google Analytics**: Métricas de uso

## Segurança

### Headers de Segurança Implementados
- `X-Frame-Options: DENY` - Proteção contra clickjacking
- `X-Content-Type-Options: nosniff` - Prevenção de MIME sniffing
- `X-XSS-Protection: 1; mode=block` - Proteção contra XSS
- `Strict-Transport-Security` - HSTS ativado
- `Content-Security-Policy` - Política de conteúdo restritiva

### Configurações de Segurança
- **Rate Limiting**: 100 requests por 15 minutos
- **CORS**: Configurado para domínios específicos
- **Helmet**: Headers de segurança aplicados
- **JWT**: Tokens com expiração segura

## Troubleshooting

### Problemas Comuns

#### 1. Deploy Falhando
```bash
# Verificar logs detalhados
vercel logs --follow

# Verificar variáveis de ambiente
vercel env ls

# Testar build localmente
npm run build:production
```

#### 2. Health Check Falhando
```bash
# Teste manual do health check
curl https://seu-estudo-backend.vercel.app/api/health

# Verificar conectividade com banco
npm run health:check
```

#### 3. Performance Lenta
```bash
# Analisar bundle do frontend
npm run analyze:bundle

# Verificar métricas de performance
curl https://seu-estudo-backend.vercel.app/api/health/performance
```

### Logs e Debugging
- **Vercel Logs**: `vercel logs --follow`
- **Application Logs**: Configurados via Winston
- **Error Tracking**: Integrado com Sentry

## Rollback

### Rollback Automático
- Ativado por padrão em caso de falha nos health checks
- Restaura versão anterior conhecida
- Notifica equipe automaticamente

### Rollback Manual
```bash
# Via Vercel CLI
vercel rollback --yes --token $VERCEL_TOKEN

# Via script
.\scripts\deploy-production.ps1 -Environment production -AutoRollback
```

### Procedimento de Rollback
1. Identificar versão estável anterior
2. Executar rollback via Vercel
3. Verificar saúde da aplicação
4. Notificar equipe sobre rollback
5. Investigar causa raiz do problema

## Configurações de Produção Específicas

### Otimizações de Performance
- **Bundle Splitting**: Código dividido em chunks
- **Code Minification**: JavaScript e CSS minificados
- **Image Optimization**: Imagens otimizadas automaticamente
- **Caching**: Estratégia de cache implementada

### Configurações de Banco de Dados
- **Connection Pooling**: Pool de conexões configurado
- **SSL**: Conexões criptografadas obrigatórias
- **Timeout**: Configurações de timeout adequadas
- **Backup**: Backup automático configurado

### Configurações de Rede
- **CDN**: Assets distribuídos globalmente
- **DNS**: Configurado para alta disponibilidade
- **SSL/TLS**: Certificados configurados
- **Firewall**: Regras de segurança aplicadas

## Checklist Pré-Deploy

- [ ] Todas as variáveis de ambiente configuradas
- [ ] Testes passando em ambiente de staging
- [ ] Health checks funcionando
- [ ] Backup realizado
- [ ] Equipe notificada sobre deploy
- [ ] Rollback automático habilitado
- [ ] Monitoramento ativo

## Pós-Deploy

### Verificações Imediatas
- [ ] Aplicação respondendo em URLs de produção
- [ ] Health checks passando
- [ ] Funcionalidades críticas testadas
- [ ] Performance dentro do esperado

### Monitoramento Contínuo
- [ ] Logs sendo capturados
- [ ] Métricas de erro monitoradas
- [ ] Alertas configurados
- [ ] Backup funcionando

## Suporte e Contato

Para problemas em produção, entre em contato:

- **Equipe de DevOps**: devops@seu-estudo.com
- **Slack**: #alerts-production
- **Telefone**: +55 11 9999-9999 (emergências apenas)

---

⚠️ **Importante**: Nunca commite credenciais reais no código. Sempre use variáveis de ambiente.