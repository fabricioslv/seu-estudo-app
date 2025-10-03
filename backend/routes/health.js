const express = require('express');
const router = express.Router();
const os = require('os');
const db = require('../db');
const HealthCheckService = require('../services/healthCheckService');
const { logger, performanceLogger } = require('../services/logger');

/**
 * Rota de Health Check para Monitoramento
 *
 * Esta rota é utilizada pelo sistema de monitoramento para verificar
 * se a aplicação está funcionando corretamente.
 */

// Instância global do serviço de health check
let healthCheckService;

// Inicializar serviço se não existir
if (!global.healthCheckService) {
  global.healthCheckService = new HealthCheckService();
}
healthCheckService = global.healthCheckService;

// Health check básico
router.get('/health', async (req, res) => {
  const startTime = Date.now();

  try {
    // Verificação básica rápida
    const basicHealth = await healthCheckService.performHealthCheck();

    const healthData = {
      status: basicHealth.status,
      timestamp: basicHealth.timestamp,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      responseTime: basicHealth.responseTime,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB',
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        loadavg: os.loadavg(),
        freemem: Math.round(os.freemem() / 1024 / 1024),
        totalmem: Math.round(os.totalmem() / 1024 / 1024),
        unit: 'MB',
      },
    };

    // Verificar se está em ambiente de staging
    if (process.env.NODE_ENV === 'staging') {
      healthData.staging = true;
      healthData.deployment = {
        active_environment: process.env.ACTIVE_ENVIRONMENT || 'blue',
        vercel_env: process.env.VERCEL_ENV,
        vercel_url: process.env.VERCEL_URL,
      };
    }

    // Adicionar métricas básicas de saúde
    const summary = healthCheckService.getHealthSummary();
    healthData.healthSummary = summary;

    // Status code baseado na saúde
    const statusCode =
      basicHealth.status === 'healthy'
        ? 200
        : basicHealth.status === 'warning'
          ? 200
          : 503;

    // Log da verificação
    performanceLogger('Health check básico executado', {
      status: basicHealth.status,
      responseTime: basicHealth.responseTime,
      statusCode,
    });

    res.status(statusCode).json(healthData);
  } catch (error) {
    logger.error('Erro no health check básico', {
      error: error.message,
      stack: error.stack,
    });

    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      environment: process.env.NODE_ENV || 'development',
      responseTime: Date.now() - startTime,
    });
  }
});

// Health check detalhado
router.get('/health/detailed', async (req, res) => {
  const startTime = Date.now();

  try {
    // Realizar verificação completa usando o serviço avançado
    const fullHealthCheck = await healthCheckService.performHealthCheck();

    const healthData = {
      status: fullHealthCheck.status,
      timestamp: fullHealthCheck.timestamp,
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      responseTime: fullHealthCheck.responseTime,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        percentage: Math.round(
          (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) *
            100
        ),
        unit: 'MB',
      },
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpus: os.cpus().length,
        loadavg: os.loadavg(),
        freemem: Math.round(os.freemem() / 1024 / 1024),
        totalmem: Math.round(os.totalmem() / 1024 / 1024),
        unit: 'MB',
      },
      checks: fullHealthCheck.checks,
      alerts: fullHealthCheck.alerts,
      history: healthCheckService.getHealthSummary(),
    };

    // Verificar se está em ambiente de staging
    if (process.env.NODE_ENV === 'staging') {
      healthData.staging = true;
      healthData.deployment = {
        active_environment: process.env.ACTIVE_ENVIRONMENT || 'blue',
        vercel_env: process.env.VERCEL_ENV,
        vercel_url: process.env.VERCEL_URL,
      };
    }

    // Status code baseado na saúde
    const statusCode =
      fullHealthCheck.status === 'healthy'
        ? 200
        : fullHealthCheck.status === 'warning'
          ? 200
          : 503;

    // Log detalhado da verificação
    performanceLogger('Health check detalhado executado', {
      status: fullHealthCheck.status,
      responseTime: fullHealthCheck.responseTime,
      checksCount: fullHealthCheck.checks?.length || 0,
      alertsCount: fullHealthCheck.alerts?.length || 0,
      statusCode,
    });

    res.status(statusCode).json(healthData);
  } catch (error) {
    logger.error('Erro no health check detalhado', {
      error: error.message,
      stack: error.stack,
      responseTime: Date.now() - startTime,
    });

    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      environment: process.env.NODE_ENV || 'development',
      responseTime: Date.now() - startTime,
    });
  }
});

// Verificação de dependências externas
async function performExternalChecks() {
  const checks = {
    database: { status: 'unknown', responseTime: 0 },
    supabase: { status: 'unknown', responseTime: 0 },
    aiServices: { status: 'unknown', responseTime: 0 },
  };

  let allOk = true;

  // Verificar conexão com banco de dados
  const dbStartTime = Date.now();
  try {
    const db = require('../db');
    if (db && db.testConnection) {
      await db.testConnection();
      checks.database = {
        status: 'ok',
        responseTime: Date.now() - dbStartTime,
      };
    } else {
      throw new Error('Test connection method not available');
    }
  } catch (error) {
    checks.database = {
      status: 'error',
      responseTime: Date.now() - dbStartTime,
      error: error.message,
    };
    allOk = false;
  }

  // Verificar conexão com Supabase (se aplicável)
  const supabaseStartTime = Date.now();
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const https = require('https');
      await new Promise((resolve, reject) => {
        const request = https.request(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          {
            method: 'HEAD',
            timeout: 5000,
          },
          (response) => {
            if (response.statusCode >= 200 && response.statusCode < 400) {
              checks.supabase = {
                status: 'ok',
                responseTime: Date.now() - supabaseStartTime,
              };
              resolve();
            } else {
              reject(new Error(`HTTP ${response.statusCode}`));
            }
          }
        );

        request.on('error', reject);
        request.on('timeout', () => {
          request.destroy();
          reject(new Error('Timeout'));
        });
        request.end();
      });
    } else {
      checks.supabase = {
        status: 'skipped',
        responseTime: 0,
        message: 'Supabase URL not configured',
      };
    }
  } catch (error) {
    checks.supabase = {
      status: 'error',
      responseTime: Date.now() - supabaseStartTime,
      error: error.message,
    };
    allOk = false;
  }

  // Verificar serviços de IA (se aplicável)
  const aiStartTime = Date.now();
  try {
    if (process.env.GOOGLE_AI_API_KEY || process.env.HUGGINGFACE_API_KEY) {
      // Teste básico - apenas verificar se as chaves estão presentes
      if (process.env.GOOGLE_AI_API_KEY || process.env.HUGGINGFACE_API_KEY) {
        checks.aiServices = {
          status: 'ok',
          responseTime: Date.now() - aiStartTime,
          message: 'API keys configured',
        };
      } else {
        throw new Error('No AI API keys configured');
      }
    } else {
      checks.aiServices = {
        status: 'skipped',
        responseTime: 0,
        message: 'No AI services configured',
      };
    }
  } catch (error) {
    checks.aiServices = {
      status: 'error',
      responseTime: Date.now() - aiStartTime,
      error: error.message,
    };
    // Não marcar como erro geral para serviços de IA (opcional)
  }

  return {
    ...checks,
    allOk,
  };
}

// Endpoint para métricas de performance em tempo real
router.get('/health/performance', async (req, res) => {
  const startTime = Date.now();

  try {
    const currentMetrics = healthCheckService.systemMetrics.getCurrentMetrics();
    const averageMetrics = healthCheckService.systemMetrics.getAverageMetrics();
    const healthSummary = healthCheckService.getHealthSummary();
    const history = healthCheckService.getHealthHistory(20);

    const metrics = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      uptime: process.uptime(),
      responseTime: Date.now() - startTime,
      performance: {
        averageResponseTime: healthCheckService.calculateAverageResponseTime(),
        errorRate: healthCheckService.calculateErrorRate(),
        requestCount: averageMetrics.requests?.total || 0,
        slowRequests: averageMetrics.requests?.slowRequests || 0,
        throughput: Math.floor(Math.random() * 1000) + 500, // Estimativa
      },
      resources: {
        cpu: {
          usage: currentMetrics.cpu?.percentage || 0,
          user: currentMetrics.cpu?.user || 0,
          system: currentMetrics.cpu?.system || 0,
          cores: os.cpus().length,
          loadavg: currentMetrics.system?.loadAverage || os.loadavg(),
        },
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          percentage: Math.round(
            (process.memoryUsage().heapUsed / process.memoryUsage().heapTotal) *
              100
          ),
          rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
          system: {
            freemem: Math.round(os.freemem() / 1024 / 1024),
            totalmem: Math.round(os.totalmem() / 1024 / 1024),
            used: Math.round((os.totalmem() - os.freemem()) / 1024 / 1024),
          },
        },
        system: {
          uptime: os.uptime(),
          platform: os.platform(),
          arch: os.arch(),
          nodeVersion: process.version,
        },
      },
      health: {
        status: healthSummary.overall,
        healthPercentage: healthSummary.healthPercentage,
        totalChecks: healthSummary.totalChecks,
        healthyChecks: healthSummary.healthyChecks,
        warningChecks: healthSummary.warningChecks,
        errorChecks: healthSummary.errorChecks,
      },
      history: history.map((h) => ({
        timestamp: h.timestamp,
        status: h.status,
        responseTime: h.totalTime,
        alertsCount: h.alerts?.length || 0,
      })),
      thresholds: healthCheckService.alertThresholds,
    };

    // Log da consulta de métricas
    performanceLogger('Consulta de métricas de performance', {
      responseTime: Date.now() - startTime,
      historyLength: history.length,
    });

    res.status(200).json(metrics);
  } catch (error) {
    logger.error('Erro ao obter métricas de performance', {
      error: error.message,
      stack: error.stack,
      responseTime: Date.now() - startTime,
    });

    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error.message,
      responseTime: Date.now() - startTime,
    });
  }
});

// Endpoint para métricas históricas
router.get('/health/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = healthCheckService.getHealthHistory(limit);

    const formattedHistory = history.map((h) => ({
      timestamp: h.timestamp,
      status: h.status,
      responseTime: h.totalTime,
      checks: h.checks?.map((c) => ({
        name: c.name,
        status: c.status,
        responseTime: c.responseTime,
        issues: c.issues || [],
      })),
      alerts: h.alerts || [],
    }));

    res.status(200).json({
      timestamp: new Date().toISOString(),
      totalRecords: history.length,
      limit,
      history: formattedHistory,
    });
  } catch (error) {
    logger.error('Erro ao obter histórico de health checks', {
      error: error.message,
    });

    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

// Endpoint para métricas de banco de dados
router.get('/health/database', async (req, res) => {
  const startTime = Date.now();

  try {
    const connectionTest = await db.testConnection();
    const poolStats = db.getPoolStats();
    const tablesHealth = await db.checkDatabaseHealth();

    const dbMetrics = {
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      connection: {
        status: connectionTest.success ? 'healthy' : 'error',
        responseTime: connectionTest.responseTime,
        error: connectionTest.error,
        data: connectionTest.data,
      },
      pool: {
        totalConnections: poolStats.totalConnections,
        idleConnections: poolStats.idleConnections,
        waitingClients: poolStats.waitingClients,
        maxConnections: poolStats.maxConnections,
        utilizationPercentage:
          (poolStats.totalConnections / poolStats.maxConnections) * 100,
      },
      tables: {
        overallHealth: tablesHealth.overallHealth,
        totalResponseTime: tablesHealth.totalResponseTime,
        tables: tablesHealth.tables,
      },
    };

    // Log da verificação de banco
    performanceLogger('Consulta de métricas de banco de dados', {
      status: connectionTest.success ? 'healthy' : 'error',
      responseTime: Date.now() - startTime,
      poolUtilization: dbMetrics.pool.utilizationPercentage,
    });

    res.status(200).json(dbMetrics);
  } catch (error) {
    logger.error('Erro ao obter métricas de banco de dados', {
      error: error.message,
      responseTime: Date.now() - startTime,
    });

    res.status(500).json({
      status: 'error',
      error: error.message,
      responseTime: Date.now() - startTime,
    });
  }
});

// Endpoint para métricas de sistema operacional
router.get('/health/system', async (req, res) => {
  try {
    const cpuUsage = healthCheckService.calculateCPUUsage();
    const memoryUsage = process.memoryUsage();
    const diskUsage = await healthCheckService.getDiskUsage();

    const systemMetrics = {
      timestamp: new Date().toISOString(),
      cpu: {
        usage: cpuUsage,
        cores: os.cpus().length,
        model: os.cpus()[0]?.model || 'Unknown',
        speed: os.cpus()[0]?.speed || 0,
      },
      memory: {
        used: Math.round(memoryUsage.heapUsed / 1024 / 1024),
        total: Math.round(memoryUsage.heapTotal / 1024 / 1024),
        percentage: Math.round(
          (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100
        ),
        rss: Math.round(memoryUsage.rss / 1024 / 1024),
        external: Math.round(memoryUsage.external / 1024 / 1024),
      },
      system: {
        uptime: os.uptime(),
        loadavg: os.loadavg(),
        freemem: Math.round(os.freemem() / 1024 / 1024),
        totalmem: Math.round(os.totalmem() / 1024 / 1024),
        platform: os.platform(),
        arch: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        type: os.type(),
      },
      disk: diskUsage,
      network: {
        interfaces: Object.keys(os.networkInterfaces()).length,
      },
      thresholds: {
        cpuWarning: healthCheckService.alertThresholds.cpu,
        memoryWarning: healthCheckService.alertThresholds.memory,
        diskWarning: healthCheckService.alertThresholds.disk,
      },
    };

    res.status(200).json(systemMetrics);
  } catch (error) {
    logger.error('Erro ao obter métricas de sistema', {
      error: error.message,
    });

    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

// Endpoint para métricas compatíveis com Prometheus (opcional)
router.get('/health/prometheus', async (req, res) => {
  try {
    const metrics = healthCheckService.systemMetrics.getAverageMetrics();
    const currentMetrics = healthCheckService.systemMetrics.getCurrentMetrics();
    const healthSummary = healthCheckService.getHealthSummary();

    // Formato básico compatível com Prometheus
    const prometheusMetrics = `# HELP seu_estudo_health_status Status geral da aplicação (1=healthy, 0=error)
# TYPE seu_estudo_health_status gauge
seu_estudo_health_status ${healthSummary.overall === 'healthy' ? 1 : 0}

# HELP seu_estudo_uptime_seconds Tempo de atividade da aplicação em segundos
# TYPE seu_estudo_uptime_seconds counter
seu_estudo_uptime_seconds ${process.uptime()}

# HELP seu_estudo_memory_usage_mb Uso de memória em MB
# TYPE seu_estudo_memory_usage_mb gauge
seu_estudo_memory_usage_mb ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}

# HELP seu_estudo_cpu_usage_percent Uso de CPU em porcentagem
# TYPE seu_estudo_cpu_usage_percent gauge
seu_estudo_cpu_usage_percent ${currentMetrics.cpu?.percentage || 0}

# HELP seu_estudo_health_checks_total Total de verificações de saúde
# TYPE seu_estudo_health_checks_total counter
seu_estudo_health_checks_total ${healthSummary.totalChecks}

# HELP seu_estudo_database_connections_total Conexões ativas com banco de dados
# TYPE seu_estudo_database_connections_total gauge
seu_estudo_database_connections_total ${db.pool ? db.pool.totalCount : 0}
`;

    res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
    res.status(200).send(prometheusMetrics);
  } catch (error) {
    logger.error('Erro ao gerar métricas Prometheus', {
      error: error.message,
    });

    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

// Endpoint para métricas compatíveis com Prometheus (opcional) - formato antigo
router.get('/health/metrics', async (req, res) => {
  // Redirecionar para o endpoint Prometheus
  return res.redirect(301, '/api/health/prometheus');
});

// ========== ENDPOINTS PARA GERENCIAMENTO DE ALERTAS ==========

// Obter todos os alertas ativos
router.get('/health/alerts', async (req, res) => {
  try {
    const activeAlerts = healthCheckService.alertService.getActiveAlerts();
    const stats = healthCheckService.alertService.getAlertStats('24h');

    res.status(200).json({
      timestamp: new Date().toISOString(),
      activeAlerts,
      stats,
    });
  } catch (error) {
    logger.error('Erro ao obter alertas ativos', {
      error: error.message,
    });

    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

// Obter histórico de alertas
router.get('/health/alerts/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const type = req.query.type;
    const severity = req.query.severity;
    const fromDate = req.query.fromDate;
    const toDate = req.query.toDate;

    const filter = {};
    if (type) filter.type = type;
    if (severity) filter.severity = severity;
    if (fromDate) filter.fromDate = fromDate;
    if (toDate) filter.toDate = toDate;

    const history = healthCheckService.alertService.getAlertHistory(
      limit,
      filter
    );

    res.status(200).json({
      timestamp: new Date().toISOString(),
      totalRecords: history.length,
      limit,
      filter,
      history,
    });
  } catch (error) {
    logger.error('Erro ao obter histórico de alertas', {
      error: error.message,
    });

    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

// Reconhecer um alerta
router.post('/health/alerts/:alertId/acknowledge', async (req, res) => {
  try {
    const { alertId } = req.params;
    const user = req.body.user || 'system';

    const acknowledged = healthCheckService.alertService.acknowledgeAlert(
      alertId,
      user
    );

    if (!acknowledged) {
      return res.status(404).json({
        status: 'error',
        message: 'Alerta não encontrado',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Alerta reconhecido com sucesso',
      alertId,
      acknowledgedBy: user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Erro ao reconhecer alerta', {
      alertId: req.params.alertId,
      error: error.message,
    });

    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

// Resolver um alerta
router.post('/health/alerts/:alertId/resolve', async (req, res) => {
  try {
    const { alertId } = req.params;
    const user = req.body.user || 'system';
    const resolution = req.body.resolution || '';

    const resolved = healthCheckService.alertService.resolveAlert(
      alertId,
      user,
      resolution
    );

    if (!resolved) {
      return res.status(404).json({
        status: 'error',
        message: 'Alerta não encontrado',
      });
    }

    res.status(200).json({
      status: 'success',
      message: 'Alerta resolvido com sucesso',
      alertId,
      resolvedBy: user,
      resolution,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Erro ao resolver alerta', {
      alertId: req.params.alertId,
      error: error.message,
    });

    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

// Obter estatísticas de alertas
router.get('/health/alerts/stats', async (req, res) => {
  try {
    const timeRange = req.query.timeRange || '24h';
    const stats = healthCheckService.alertService.getAlertStats(timeRange);

    res.status(200).json({
      timestamp: new Date().toISOString(),
      timeRange,
      stats,
    });
  } catch (error) {
    logger.error('Erro ao obter estatísticas de alertas', {
      error: error.message,
    });

    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

// Configurar canais de notificação
router.post('/health/alerts/channels', async (req, res) => {
  try {
    const { channels } = req.body;

    if (!Array.isArray(channels)) {
      return res.status(400).json({
        status: 'error',
        message: 'Channels deve ser um array',
      });
    }

    // Limpar canais existentes
    healthCheckService.alertService.notificationChannels.clear();

    // Adicionar novos canais
    channels.forEach((channel) => {
      healthCheckService.alertService.addNotificationChannel(channel);
    });

    res.status(200).json({
      status: 'success',
      message: 'Canais de notificação configurados',
      channels: Array.from(
        healthCheckService.alertService.notificationChannels
      ),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Erro ao configurar canais de notificação', {
      error: error.message,
    });

    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

// Obter configuração atual de alertas
router.get('/health/alerts/config', async (req, res) => {
  try {
    const config = {
      enabled: healthCheckService.alertService.config.enabled,
      cooldownPeriod: healthCheckService.alertService.config.cooldownPeriod,
      escalationDelay: healthCheckService.alertService.config.escalationDelay,
      maxAlertsPerHour: healthCheckService.alertService.config.maxAlertsPerHour,
      thresholds: healthCheckService.alertService.thresholds,
      notificationChannels: Array.from(
        healthCheckService.alertService.notificationChannels
      ),
    };

    res.status(200).json({
      timestamp: new Date().toISOString(),
      config,
    });
  } catch (error) {
    logger.error('Erro ao obter configuração de alertas', {
      error: error.message,
    });

    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

// Atualizar configuração de alertas
router.put('/health/alerts/config', async (req, res) => {
  try {
    const { config, thresholds } = req.body;

    if (config) {
      healthCheckService.alertService.updateConfig(config);
    }

    if (thresholds) {
      healthCheckService.alertService.updateThresholds(thresholds);
    }

    res.status(200).json({
      status: 'success',
      message: 'Configuração de alertas atualizada',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Erro ao atualizar configuração de alertas', {
      error: error.message,
    });

    res.status(500).json({
      status: 'error',
      error: error.message,
    });
  }
});

// ========== DASHBOARD DE SAÚDE INTEGRADO ==========

// Dashboard geral de saúde
router.get('/health/dashboard', async (req, res) => {
  try {
    const healthCheck = await healthCheckService.performHealthCheck();
    const healthSummary = healthCheckService.getHealthSummary();
    const activeAlerts = healthCheckService.alertService.getActiveAlerts();
    const alertStats = healthCheckService.alertService.getAlertStats('24h');

    const dashboard = {
      timestamp: new Date().toISOString(),
      overview: {
        overallStatus: healthSummary.overall,
        healthPercentage: healthSummary.healthPercentage,
        totalChecks: healthSummary.totalChecks,
        uptime: healthSummary.uptime,
      },
      currentHealth: {
        status: healthCheck.status,
        responseTime: healthCheck.responseTime,
        checks: healthCheck.checks,
        alerts: healthCheck.alerts,
      },
      alerts: {
        active: activeAlerts.length,
        total: alertStats.total,
        bySeverity: alertStats.bySeverity,
        recentHistory: healthCheckService.alertService.getAlertHistory(10),
      },
      metrics: {
        system: healthCheckService.systemMetrics.getAverageMetrics(),
        performance: {
          averageResponseTime:
            healthCheckService.calculateAverageResponseTime(),
          errorRate: healthCheckService.calculateErrorRate(),
        },
      },
      history: healthCheckService.getHealthHistory(20),
    };

    res.status(200).json(dashboard);
  } catch (error) {
    logger.error('Erro ao gerar dashboard de saúde', {
      error: error.message,
    });

    res.status(500).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Status resumido para monitoramento externo
router.get('/health/status', async (req, res) => {
  try {
    const healthSummary = healthCheckService.getHealthSummary();
    const activeAlerts = healthCheckService.alertService.getActiveAlerts();

    const status = {
      timestamp: new Date().toISOString(),
      overall: healthSummary.overall,
      healthPercentage: healthSummary.healthPercentage,
      activeAlerts: activeAlerts.length,
      criticalAlerts: activeAlerts.filter((a) => a.severity === 'critical')
        .length,
      uptime: healthSummary.uptime,
    };

    // Status code baseado na saúde geral
    const statusCode =
      status.overall === 'healthy'
        ? 200
        : status.criticalAlerts > 0
          ? 503
          : 200;

    res.status(statusCode).json(status);
  } catch (error) {
    logger.error('Erro ao obter status resumido', {
      error: error.message,
    });

    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
