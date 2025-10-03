# Guia de Deploy do Ambiente Staging

Este documento descreve o processo completo de configuração e deploy do ambiente de staging para o projeto Seu-Estudo no Vercel.

## 📋 Visão Geral

O ambiente de staging foi configurado com as seguintes funcionalidades:

- ✅ Arquivos de configuração específicos para staging (`vercel.staging.json`)
- ✅ Variáveis de ambiente isoladas
- ✅ Estratégia de deploy azul/verde
- ✅ Sistema de rollback automático
- ✅ Monitoramento básico de saúde
- ✅ Scripts automatizados para deploy

## 🏗️ Arquitetura do Ambiente

```
Produção: seu-estudo.vercel.app
Staging:  seu-estudo-staging.vercel.app

Backend:
├── Produção: seu-estudo-backend.vercel.app
└── Staging:  seu-estudo-backend-staging.vercel.app

Blue-Green Deployment:
├── Blue:  seu-estudo-blue.vercel.app
└── Green: seu-estudo-green.vercel.app
```

## 📁 Arquivos de Configuração Criados

### Arquivos de Configuração Vercel

- `backend/vercel.staging.json` - Configuração específica do backend para staging
- `frontend/vercel.staging.json` - Configuração específica do frontend para staging

### Variáveis de Ambiente

- `backend/.env.staging` - Variáveis específicas para backend em staging
- `frontend/.env.staging` - Variáveis específicas para frontend em staging

### Scripts de Deploy

- `scripts/deploy-blue-green-staging.js` - Deploy azul/verde (Node.js)
- `scripts/deploy-staging-blue-green.ps1` - Deploy azul/verde (PowerShell)
- `scripts/deploy-staging-simple.ps1` - Deploy simplificado para staging

### Sistema de Monitoramento

- `scripts/monitoring/rollback-monitor.js` - Monitor de rollback automático
- `scripts/monitoring/health-monitor.ps1` - Monitor básico de saúde
- `scripts/monitoring/monitoring-config.json` - Configuração de monitoramento

## 🚀 Como Usar

### Pré-requisitos

1. **Vercel CLI instalado:**
   ```bash
   npm i -g vercel
   ```

2. **Login no Vercel:**
   ```bash
   vercel login
   ```

3. **Projeto configurado no Vercel:**
   - Certifique-se de que o projeto está conectado ao seu account Vercel
   - Anote o `scope` do projeto para usar nos scripts

### Deploy Simples

Para fazer um deploy básico do ambiente de staging:

```powershell
# Usando o script simplificado
.\scripts\deploy-staging-simple.ps1

# Com verificação de saúde
.\scripts\deploy-staging-simple.ps1 -CheckHealth

# Apenas build (sem deploy)
.\scripts\deploy-staging-simple.ps1 -BuildOnly
```

### Deploy Azul/Verde

Para usar a estratégia de blue-green deployment:

```powershell
# Usando PowerShell (recomendado para Windows)
.\scripts\deploy-staging-blue-green.ps1 -Environment staging -AutoRollback

# Usando Node.js
node scripts/deploy-blue-green-staging.js
```

### Monitoramento

Para monitorar a saúde do ambiente de staging:

```powershell
# Monitoramento básico por 60 minutos
.\scripts\monitoring\health-monitor.ps1 -Duration 60

# Monitoramento com intervalo de 30 segundos por 2 horas
.\scripts\monitoring\health-monitor.ps1 -Interval 30 -Duration 120 -GenerateReport
```

Para monitoramento contínuo com rollback automático:

```bash
# Iniciar monitoramento (pressionar Ctrl+C para parar)
node scripts/monitoring/rollback-monitor.js
```

## 🔧 Configurações Implementadas

### Headers de Segurança

Ambos os ambientes (frontend e backend) incluem headers de segurança:

```json
{
  "cache-control": "no-cache, no-store, must-revalidate",
  "x-environment": "staging",
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin"
}
```

### Variáveis de Ambiente Específicas

**Backend (staging):**
- `NODE_ENV=staging`
- `VERCEL_ENV=staging`
- `STAGING=true`
- `LOG_LEVEL=debug`
- Configurações diferenciadas de cache e rate limiting

**Frontend (staging):**
- `REACT_APP_ENV=staging`
- `REACT_APP_STAGING=true`
- `REACT_APP_DEBUG=true`
- Configurações específicas para desenvolvimento

### Health Check Endpoints

O backend expõe endpoints para monitoramento:

- `GET /api/health` - Health check básico
- `GET /api/health/detailed` - Health check com verificações externas
- `GET /api/health/metrics` - Métricas de performance

## 🔄 Estratégia de Blue-Green Deployment

### Como Funciona

1. **Deploy Inicial:** Blue é ativado como ambiente principal
2. **Novo Deploy:** Green recebe a nova versão
3. **Testes de Saúde:** Green é testado antes da ativação
4. **Switch:** Tráfego é alternado para Green se testes passarem
5. **Rollback:** Blue permanece disponível para rollback rápido

### Vantagens

- ✅ **Zero Downtime:** Deploy sem interrupção de serviço
- ✅ **Rollback Rápido:** Ambiente anterior sempre disponível
- ✅ **Testes Automatizados:** Verificação antes da ativação
- ✅ **Isolamento:** Ambientes completamente separados

## 📊 Monitoramento e Alertas

### Métricas Monitoradas

- **Disponibilidade:** Health checks a cada 30 segundos
- **Performance:** Tempo de resposta e throughput
- **Erros:** Taxa de erro e tipos de falha
- **Recursos:** Uso de CPU e memória

### Thresholds Configurados

- **Falhas Consecutivas:** 3 falhas → Rollback automático
- **Tempo de Resposta:** > 5s → Alerta
- **Taxa de Sucesso:** < 80% → Ação necessária

## 🛠️ Solução de Problemas

### Problemas Comuns

#### 1. Deploy Falhando

```bash
# Verificar logs do Vercel
vercel logs --follow

# Verificar variáveis de ambiente
vercel env ls

# Testar build localmente
npm run build
```

#### 2. Health Check Falhando

```bash
# Testar endpoint manualmente
curl https://seu-estudo-backend-staging.vercel.app/api/health

# Verificar logs da aplicação
vercel logs seu-estudo-backend-staging
```

#### 3. Rollback Necessário

```powershell
# Rollback manual via script
.\scripts\deploy-staging-blue-green.ps1 -Environment staging

# Ou via Vercel CLI
vercel env add ACTIVE_ENVIRONMENT blue
```

### Logs e Debugging

```bash
# Logs em tempo real
vercel logs --follow

# Logs específicos do ambiente
vercel logs seu-estudo-backend-staging --follow

# Logs de deploy
vercel inspect seu-estudo-backend-staging
```

## 📈 Próximos Passos Sugeridos

### Melhorias Futuras

1. **Integração com CI/CD:**
   - Configurar GitHub Actions para deploy automático
   - Implementar testes automatizados antes do deploy

2. **Monitoramento Avançado:**
   - Integração com ferramentas como Datadog ou New Relic
   - Dashboards customizados no Grafana

3. **Alertas Inteligentes:**
   - Notificações via Slack/Teams
   - Sistema de escalação de alertas

4. **Testes Automatizados:**
   - Testes de integração no ambiente de staging
   - Testes de performance automatizados

### Manutenção

- Revisar logs regularmente
- Atualizar dependências de segurança
- Testar processo de rollback mensalmente
- Manter documentação atualizada

## 📞 Suporte

Para problemas ou dúvidas sobre o ambiente de staging:

1. **Verificar logs:** Use os comandos acima para diagnosticar
2. **Testar localmente:** Reproduza o problema em desenvolvimento
3. **Documentação Vercel:** Consulte [vercel.com/docs](https://vercel.com/docs)
4. **Comunidade:** Fórum do Vercel para dúvidas específicas

---

**Última atualização:** Outubro 2025
**Ambiente:** Staging
**Status:** ✅ Configurado e Operacional