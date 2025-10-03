# Sistema de Health Checks - Seu-Estudo

Este documento descreve o sistema completo de health checks automatizados implementado para o projeto Seu-Estudo.

## 📋 Visão Geral

O sistema de health checks fornece monitoramento contínuo e abrangente da saúde da aplicação, incluindo:

- ✅ Health checks básicos (servidor, banco de dados, dependências externas)
- ✅ Health checks avançados (performance, recursos, conectividade)
- ✅ Sistema de monitoramento contínuo com métricas em tempo real
- ✅ Dashboard de saúde integrado ao sistema de logs
- ✅ Alertas automáticos baseados em thresholds
- ✅ Métricas compatíveis com Prometheus (opcional)

## 🚀 Endpoints Disponíveis

### Health Checks Básicos

#### `GET /api/health`
Health check básico e rápido para monitoramento simples.

**Resposta:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "production",
  "version": "1.0.0",
  "uptime": 3600,
  "responseTime": 45,
  "memory": {
    "used": 128,
    "total": 256,
    "unit": "MB"
  },
  "system": {
    "platform": "linux",
    "arch": "x64",
    "cpus": 4,
    "loadavg": [1.2, 0.8, 0.5],
    "freemem": 1024,
    "totalmem": 2048,
    "unit": "MB"
  },
  "healthSummary": {
    "overall": "healthy",
    "healthPercentage": 100,
    "totalChecks": 25,
    "healthyChecks": 25,
    "warningChecks": 0,
    "errorChecks": 0
  }
}
```

#### `GET /api/health/detailed`
Health check detalhado com verificações completas de todos os componentes.

**Resposta:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "production",
  "responseTime": 234,
  "checks": [
    {
      "name": "system",
      "status": "healthy",
      "responseTime": 45,
      "metrics": {
        "cpu": 25.5,
        "memory": 68.2,
        "disk": 45.1,
        "uptime": 3600,
        "loadAverage": [1.2, 0.8, 0.5]
      },
      "issues": [],
      "alerts": []
    },
    {
      "name": "database",
      "status": "healthy",
      "responseTime": 67,
      "connection": {
        "status": "healthy",
        "responseTime": 45,
        "data": {
          "connectionCount": 3,
          "idleCount": 2,
          "waitingCount": 0
        }
      },
      "pool": {
        "totalConnections": 3,
        "idleConnections": 2,
        "waitingClients": 0,
        "maxConnections": 20
      },
      "tables": {
        "overallHealth": "healthy",
        "totalResponseTime": 156,
        "tables": {
          "usuarios": {
            "status": "healthy",
            "recordCount": 1250,
            "size": "2 MB"
          }
        }
      }
    }
  ],
  "alerts": [],
  "history": {
    "overall": "healthy",
    "totalChecks": 25,
    "healthyChecks": 25,
    "warningChecks": 0,
    "errorChecks": 0
  }
}
```

### Métricas de Performance

#### `GET /api/health/performance`
Métricas de performance em tempo real com histórico.

**Resposta:**
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "environment": "production",
  "performance": {
    "averageResponseTime": 156.7,
    "errorRate": 0.02,
    "requestCount": 1250,
    "slowRequests": 12,
    "throughput": 850
  },
  "resources": {
    "cpu": {
      "usage": 25.5,
      "cores": 4,
      "loadavg": [1.2, 0.8, 0.5]
    },
    "memory": {
      "used": 128,
      "total": 256,
      "percentage": 50,
      "system": {
        "freemem": 1024,
        "totalmem": 2048
      }
    },
    "system": {
      "uptime": 3600,
      "platform": "linux",
      "arch": "x64"
    }
  },
  "health": {
    "status": "healthy",
    "healthPercentage": 100,
    "totalChecks": 25,
    "healthyChecks": 25,
    "warningChecks": 0,
    "errorChecks": 0
  },
  "history": [
    {
      "timestamp": "2024-01-01T11:59:30.000Z",
      "status": "healthy",
      "responseTime": 145,
      "alertsCount": 0
    }
  ]
}
```

#### `GET /api/health/system`
Métricas detalhadas do sistema operacional.

#### `GET /api/health/database`
Métricas específicas do banco de dados e pool de conexões.

### Gerenciamento de Alertas

#### `GET /api/health/alerts`
Lista todos os alertas ativos.

**Resposta:**
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "activeAlerts": [
    {
      "id": "cpu_high_1704110400000",
      "type": "cpu_high",
      "severity": "warning",
      "message": "Uso de CPU alto: 85.5%",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "status": "active",
      "acknowledged": false
    }
  ],
  "stats": {
    "timeRange": "24h",
    "total": 5,
    "bySeverity": {
      "critical": 0,
      "warning": 4,
      "info": 1
    },
    "active": 1,
    "acknowledged": 3,
    "resolved": 1
  }
}
```

#### `POST /api/health/alerts/:alertId/acknowledge`
Reconhece um alerta específico.

**Body:**
```json
{
  "user": "admin"
}
```

#### `POST /api/health/alerts/:alertId/resolve`
Resolve um alerta específico.

**Body:**
```json
{
  "user": "admin",
  "resolution": "Problema solucionado - servidor reiniciado"
}
```

#### `GET /api/health/alerts/history`
Histórico completo de alertas com filtros.

**Query Parameters:**
- `limit`: Número máximo de registros (padrão: 50)
- `type`: Filtrar por tipo de alerta
- `severity`: Filtrar por severidade
- `fromDate`: Data inicial (ISO 8601)
- `toDate`: Data final (ISO 8601)

### Dashboard e Status

#### `GET /api/health/dashboard`
Dashboard completo com todas as métricas e status.

#### `GET /api/health/status`
Status resumido para monitoramento externo (retorna status code apropriado).

### Métricas Prometheus

#### `GET /api/health/prometheus`
Métricas no formato Prometheus para integração com sistemas de monitoramento.

## ⚙️ Configuração

### Variáveis de Ambiente

```bash
# Configurações básicas
NODE_ENV=production
DATABASE_URL=postgresql://...

# Configurações de alertas (opcionais)
ALERT_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_EMAIL=admin@empresa.com

# APIs externas (se utilizadas)
GOOGLE_AI_API_KEY=your_key_here
HUGGINGFACE_API_KEY=your_key_here
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
```

### Arquivo de Configuração

O sistema utiliza o arquivo `backend/config/health-checks.json` para configurações detalhadas:

```json
{
  "healthChecks": {
    "enabled": true,
    "checkInterval": 30000,
    "alertThresholds": {
      "cpu": 80,
      "memory": 85,
      "responseTime": 2000
    }
  },
  "alerts": {
    "enabled": true,
    "cooldownPeriod": 300000,
    "notificationChannels": ["console"],
    "webhook": {
      "enabled": false,
      "url": ""
    }
  }
}
```

## 📊 Funcionalidades Implementadas

### ✅ Health Checks Básicos
- Verificação de status do servidor
- Teste de conectividade com banco de dados
- Verificação de dependências externas (Google AI, HuggingFace, Supabase)
- Monitoramento de recursos do sistema (CPU, memória, disco)

### ✅ Health Checks Avançados
- Métricas de performance em tempo real
- Análise de response time e throughput
- Monitoramento de taxa de erro
- Verificação de saúde de tabelas do banco
- Estatísticas do pool de conexões

### ✅ Sistema de Monitoramento Contínuo
- Verificações automáticas a cada 30 segundos
- Histórico de métricas com limite configurável
- Métricas de sistema operacional detalhadas
- Integração com sistema de logs estruturado

### ✅ Dashboard de Saúde
- Dashboard integrado com métricas em tempo real
- Status resumido para monitoramento externo
- Histórico de verificações de saúde
- Métricas de disponibilidade e performance

### ✅ Sistema de Alertas
- Alertas automáticos baseados em thresholds
- Sistema de cooldown para evitar spam
- Escalonamento automático de alertas críticos
- Múltiplos canais de notificação (console, webhook, email)
- Gerenciamento completo de alertas (acknowledge, resolve)

### ✅ Métricas Prometheus
- Formatação compatível com Prometheus
- Métricas básicas de sistema e aplicação
- Endpoint dedicado para scraping

## 🔧 Como Usar

### 1. Verificação Básica de Saúde

```bash
curl http://localhost:2000/api/health
```

### 2. Monitoramento Detalhado

```bash
curl http://localhost:2000/api/health/detailed
```

### 3. Métricas de Performance

```bash
curl http://localhost:2000/api/health/performance
```

### 4. Dashboard Completo

```bash
curl http://localhost:2000/api/health/dashboard
```

### 5. Configurar Canais de Notificação

```bash
curl -X POST http://localhost:2000/api/health/alerts/channels \
  -H "Content-Type: application/json" \
  -d '{
    "channels": ["console", "webhook"]
  }'
```

## 📈 Monitoramento Externo

### Integração com Slack/Discord

Configure a variável `ALERT_WEBHOOK_URL` com o webhook do seu serviço de mensagens.

### Integração com Prometheus

O endpoint `/api/health/prometheus` fornece métricas no formato correto para scraping.

### Monitoramento com cURL

```bash
# Health check básico (para load balancers)
curl -f http://localhost:2000/api/health/status || exit 1

# Verificação detalhada
curl http://localhost:2000/api/health/detailed
```

## 🛠️ Desenvolvimento e Debugging

### Logs de Debug

O sistema utiliza o sistema de logs estruturado existente:

- **Arquivo:** `backend/logs/app-YYYY-MM-DD.log`
- **Performance:** `backend/logs/performance-YYYY-MM-DD.log`
- **Erros:** `backend/logs/error-YYYY-MM-DD.log`

### Teste de Health Checks

```javascript
// Teste programático
const healthService = require('./backend/services/healthCheckService');

const health = await healthService.performHealthCheck();
console.log('Status:', health.status);
console.log('Response time:', health.responseTime);
```

## 🚨 Tratamento de Alertas

### Tipos de Alerta

- **cpu_high**: Uso de CPU acima do threshold
- **memory_high**: Uso de memória acima do threshold
- **disk_high**: Uso de disco acima do threshold
- **database_connection**: Problemas de conexão com banco
- **database_slow**: Banco de dados lento
- **external_service**: Problemas com serviços externos
- **high_error_rate**: Taxa de erro elevada

### Severidades

- **info**: Informativo
- **warning**: Atenção necessária
- **critical**: Ação imediata necessária

### Gerenciamento

1. **Reconhecer:** Marcar como visto
2. **Resolver:** Indicar que o problema foi solucionado
3. **Configurar:** Ajustar thresholds conforme necessário

## 📋 Critérios de Aceitação - ✅ ATENDIDOS

- ✅ Deve verificar saúde do servidor a cada 30 segundos
- ✅ Deve incluir métricas de performance (CPU, memória, response time)
- ✅ Deve validar conectividade com banco de dados e APIs externas
- ✅ Deve gerar métricas para integração com sistemas de monitoramento
- ✅ Deve estar integrado ao sistema de logs estruturado implementado

## 🔮 Próximos Passos Sugeridos

1. **Frontend Dashboard**: Interface web para visualização das métricas
2. **Relatórios**: Geração de relatórios periódicos de saúde
3. **Tendências**: Análise de tendências de performance
4. **Auto-healing**: Capacidades de auto-recuperação
5. **Integração CI/CD**: Health checks em pipelines de deployment

## 📞 Suporte

Para dúvidas ou problemas com o sistema de health checks:

1. Verifique os logs em `backend/logs/`
2. Consulte este documento
3. Abra uma issue no repositório

---

**Sistema desenvolvido para o projeto Seu-Estudo**
**Versão**: 1.0.0
**Última atualização**: Janeiro 2024