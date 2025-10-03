/**
 * Serviço avançado de Health Checks e Monitoramento
 * Implementa verificações automáticas de saúde do sistema
 */

const os = require('os');
const { performanceLogger, logger } = require('./logger');
const { SystemMetrics, getCurrentMetrics } = require('./performanceLogger');
const db = require('../db');
const AlertService = require('./alertService');

class HealthCheckService {
  constructor() {
    this.systemMetrics = new SystemMetrics();
    this.alertService = new AlertService();
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.checkInterval = 30000; // 30 segundos
    this.alertThresholds = {
      cpu: 80,
      memory: 85,
      disk: 90,
      responseTime: 2000, // ms
      errorRate: 0.1, // 10%
    };

    this.healthHistory = [];
    this.maxHistorySize = 100;

    // Iniciar monitoramento
    this.startMonitoring();
  }

  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.systemMetrics.startMonitoring();

    // Verificações regulares de saúde
    this.monitoringInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.checkInterval);

    logger.info('Sistema de monitoramento de saúde iniciado', {
      checkInterval: this.checkInterval,
      thresholds: this.alertThresholds,
    });
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    this.systemMetrics.stopMonitoring();

    logger.info('Sistema de monitoramento de saúde interrompido');
  }

  async performHealthCheck() {
    const timestamp = new Date().toISOString();
    const startTime = Date.now();

    try {
      // Executar todas as verificações
      const checks = await Promise.all([
        this.checkSystemHealth(),
        this.checkDatabaseHealth(),
        this.checkExternalDependencies(),
        this.checkPerformanceMetrics(),
        this.checkApplicationHealth(),
      ]);

      const totalTime = Date.now() - startTime;
      const healthStatus = this.aggregateHealthResults(checks);

      // Armazenar histórico
      this.storeHealthResult({
        timestamp,
        totalTime,
        status: healthStatus.overall,
        checks,
        alerts: healthStatus.alerts,
      });

      // Log de saúde geral
      if (healthStatus.overall === 'healthy') {
        logger.info('Health check concluído - Sistema saudável', {
          totalTime: `${totalTime}ms`,
          timestamp,
        });
      } else if (healthStatus.alerts.length > 0) {
        logger.warn('Health check com alertas', {
          status: healthStatus.overall,
          alerts: healthStatus.alerts,
          totalTime: `${totalTime}ms`,
          timestamp,
        });
      }

      return {
        timestamp,
        status: healthStatus.overall,
        responseTime: totalTime,
        checks,
        alerts: healthStatus.alerts,
      };
    } catch (error) {
      logger.error('Erro durante health check', {
        error: error.message,
        stack: error.stack,
        timestamp,
      });

      return {
        timestamp,
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error.message,
      };
    }
  }

  async checkSystemHealth() {
    const startTime = Date.now();
    const metrics = getCurrentMetrics();

    // Calcular uso de recursos
    const cpuUsage = this.calculateCPUUsage();
    const memoryUsage =
      (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100;
    const diskUsage = await this.getDiskUsage();

    const issues = [];
    const alerts = [];

    if (cpuUsage > this.alertThresholds.cpu) {
      issues.push(`CPU: ${cpuUsage.toFixed(1)}%`);
      alerts.push({
        type: 'cpu_high',
        value: cpuUsage,
        threshold: this.alertThresholds.cpu,
      });
    }

    if (memoryUsage > this.alertThresholds.memory) {
      issues.push(`Memória: ${memoryUsage.toFixed(1)}%`);
      alerts.push({
        type: 'memory_high',
        value: memoryUsage,
        threshold: this.alertThresholds.memory,
      });
    }

    if (diskUsage && diskUsage.percentage > this.alertThresholds.disk) {
      issues.push(`Disco: ${diskUsage.percentage.toFixed(1)}%`);
      alerts.push({
        type: 'disk_high',
        value: diskUsage.percentage,
        threshold: this.alertThresholds.disk,
      });
    }

    return {
      name: 'system',
      status: issues.length === 0 ? 'healthy' : 'warning',
      responseTime: Date.now() - startTime,
      metrics: {
        cpu: cpuUsage,
        memory: memoryUsage,
        disk: diskUsage,
        uptime: metrics.uptime,
        loadAverage: metrics.loadAverage,
      },
      issues,
      alerts,
    };
  }

  async checkDatabaseHealth() {
    const startTime = Date.now();

    try {
      // Teste de conexão
      const connectionTest = await db.testConnection();

      // Estatísticas do pool
      const poolStats = db.getPoolStats();

      // Verificação de tabelas
      const tablesHealth = await db.checkDatabaseHealth();

      const issues = [];
      const alerts = [];

      if (!connectionTest.success) {
        issues.push(`Conexão DB: ${connectionTest.error}`);
        alerts.push({
          type: 'database_connection',
          error: connectionTest.error,
        });
      }

      if (connectionTest.responseTime > 1000) {
        issues.push(`DB lenta: ${connectionTest.responseTime}ms`);
        alerts.push({
          type: 'database_slow',
          value: connectionTest.responseTime,
          threshold: 1000,
        });
      }

      if (poolStats.waitingClients > 5) {
        issues.push(`DB pool: ${poolStats.waitingClients} esperando`);
        alerts.push({
          type: 'database_pool',
          value: poolStats.waitingClients,
          threshold: 5,
        });
      }

      return {
        name: 'database',
        status: issues.length === 0 ? 'healthy' : 'warning',
        responseTime: Date.now() - startTime,
        connection: connectionTest,
        pool: poolStats,
        tables: tablesHealth,
        issues,
        alerts,
      };
    } catch (error) {
      return {
        name: 'database',
        status: 'error',
        responseTime: Date.now() - startTime,
        error: error.message,
        issues: [`Erro crítico: ${error.message}`],
        alerts: [
          {
            type: 'database_error',
            error: error.message,
          },
        ],
      };
    }
  }

  async checkExternalDependencies() {
    const startTime = Date.now();
    const dependencies = [];

    // Verificar dependências externas configuradas
    if (process.env.GOOGLE_AI_API_KEY) {
      dependencies.push(await this.checkGoogleAI());
    }

    if (process.env.HUGGINGFACE_API_KEY) {
      dependencies.push(await this.checkHuggingFace());
    }

    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      dependencies.push(await this.checkSupabase());
    }

    const issues = dependencies
      .filter((d) => d.status !== 'healthy')
      .map((d) => d.issue);
    const alerts = dependencies
      .filter((d) => d.alerts?.length > 0)
      .flatMap((d) => d.alerts);

    return {
      name: 'external',
      status: issues.length === 0 ? 'healthy' : 'warning',
      responseTime: Date.now() - startTime,
      dependencies,
      issues,
      alerts,
    };
  }

  async checkGoogleAI() {
    const startTime = Date.now();

    try {
      // Verificação básica - apenas confirmar chave está presente
      return {
        name: 'google_ai',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        message: 'Chave API configurada',
      };
    } catch (error) {
      return {
        name: 'google_ai',
        status: 'error',
        responseTime: Date.now() - startTime,
        issue: `Google AI: ${error.message}`,
        alerts: [
          {
            type: 'external_service',
            service: 'google_ai',
            error: error.message,
          },
        ],
      };
    }
  }

  async checkHuggingFace() {
    const startTime = Date.now();

    try {
      return {
        name: 'huggingface',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        message: 'Chave API configurada',
      };
    } catch (error) {
      return {
        name: 'huggingface',
        status: 'error',
        responseTime: Date.now() - startTime,
        issue: `HuggingFace: ${error.message}`,
        alerts: [
          {
            type: 'external_service',
            service: 'huggingface',
            error: error.message,
          },
        ],
      };
    }
  }

  async checkSupabase() {
    const startTime = Date.now();

    try {
      const https = require('https');
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

      await new Promise((resolve, reject) => {
        const request = https.request(
          url,
          {
            method: 'HEAD',
            timeout: 5000,
          },
          (response) => {
            if (response.statusCode >= 200 && response.statusCode < 400) {
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

      return {
        name: 'supabase',
        status: 'healthy',
        responseTime: Date.now() - startTime,
        message: 'Conexão OK',
      };
    } catch (error) {
      return {
        name: 'supabase',
        status: 'error',
        responseTime: Date.now() - startTime,
        issue: `Supabase: ${error.message}`,
        alerts: [
          {
            type: 'external_service',
            service: 'supabase',
            error: error.message,
          },
        ],
      };
    }
  }

  async checkPerformanceMetrics() {
    const startTime = Date.now();
    const metrics = this.systemMetrics.getAverageMetrics();

    // Calcular métricas de performance
    const avgResponseTime = this.calculateAverageResponseTime();
    const errorRate = this.calculateErrorRate();

    const issues = [];
    const alerts = [];

    if (avgResponseTime > this.alertThresholds.responseTime) {
      issues.push(`Response time: ${avgResponseTime.toFixed(0)}ms`);
      alerts.push({
        type: 'slow_response',
        value: avgResponseTime,
        threshold: this.alertThresholds.responseTime,
      });
    }

    if (errorRate > this.alertThresholds.errorRate) {
      issues.push(`Error rate: ${(errorRate * 100).toFixed(1)}%`);
      alerts.push({
        type: 'high_error_rate',
        value: errorRate,
        threshold: this.alertThresholds.errorRate,
      });
    }

    return {
      name: 'performance',
      status: issues.length === 0 ? 'healthy' : 'warning',
      responseTime: Date.now() - startTime,
      metrics: {
        averageResponseTime: avgResponseTime,
        errorRate: errorRate,
        requestCount: metrics.requests?.total || 0,
      },
      issues,
      alerts,
    };
  }

  async checkApplicationHealth() {
    const startTime = Date.now();

    // Verificar estado da aplicação
    const uptime = process.uptime();
    const memoryUsage = process.memoryUsage();

    const issues = [];
    const alerts = [];

    // Verificar se aplicação está rodando há muito tempo (possível memory leak)
    if (uptime > 24 * 60 * 60) {
      // 24 horas
      issues.push(`Uptime longo: ${Math.round(uptime / 3600)}h`);
      alerts.push({
        type: 'long_uptime',
        value: uptime,
        threshold: 24 * 60 * 60,
      });
    }

    // Verificar uso excessivo de memória
    const memoryPercentage =
      (memoryUsage.heapUsed / memoryUsage.heapTotal) * 100;
    if (memoryPercentage > 90) {
      issues.push(`Memory usage: ${memoryPercentage.toFixed(1)}%`);
      alerts.push({
        type: 'memory_usage',
        value: memoryPercentage,
        threshold: 90,
      });
    }

    return {
      name: 'application',
      status: issues.length === 0 ? 'healthy' : 'warning',
      responseTime: Date.now() - startTime,
      metrics: {
        uptime: uptime,
        memoryUsage: memoryUsage,
        nodeVersion: process.version,
        environment: process.env.NODE_ENV,
      },
      issues,
      alerts,
    };
  }

  calculateCPUUsage() {
    const cpuUsage = process.cpuUsage();
    return ((cpuUsage.user + cpuUsage.system) / 1000000) * 100; // Convert to percentage
  }

  async getDiskUsage() {
    try {
      // Em Windows, podemos usar wmic ou powershell
      if (os.platform() === 'win32') {
        return await this.getWindowsDiskUsage();
      } else {
        // Para sistemas Unix-like
        return await this.getUnixDiskUsage();
      }
    } catch (error) {
      return null;
    }
  }

  async getWindowsDiskUsage() {
    return new Promise((resolve) => {
      const { exec } = require('child_process');
      exec('wmic logicaldisk get size,freespace,caption', (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }

        const lines = stdout.trim().split('\n').slice(1);
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length >= 3) {
            const total = parseInt(parts[parts.length - 1]);
            const free = parseInt(parts[parts.length - 2]);
            const used = total - free;
            const percentage = (used / total) * 100;

            resolve({
              total: total,
              free: free,
              used: used,
              percentage: percentage,
            });
            return;
          }
        }
        resolve(null);
      });
    });
  }

  async getUnixDiskUsage() {
    return new Promise((resolve) => {
      const { exec } = require('child_process');
      exec("df / | tail -1 | awk '{print $2,$4,$3,$5}'", (error, stdout) => {
        if (error) {
          resolve(null);
          return;
        }

        const parts = stdout.trim().split(/\s+/);
        if (parts.length >= 4) {
          const total = parseInt(parts[0]) * 1024;
          const free = parseInt(parts[1]) * 1024;
          const used = total - free;
          const percentage = parseFloat(parts[3]);

          resolve({
            total: total,
            free: free,
            used: used,
            percentage: percentage,
          });
        } else {
          resolve(null);
        }
      });
    });
  }

  calculateAverageResponseTime() {
    const history = this.healthHistory.slice(-10); // Últimas 10 verificações
    if (history.length === 0) return 0;

    const totalTime = history.reduce((sum, h) => sum + h.totalTime, 0);
    return totalTime / history.length;
  }

  calculateErrorRate() {
    const history = this.healthHistory.slice(-20); // Últimas 20 verificações
    if (history.length === 0) return 0;

    const errorCount = history.filter((h) => h.status === 'error').length;
    return errorCount / history.length;
  }

  aggregateHealthResults(checks) {
    const overall = checks.every((c) => c.status === 'healthy')
      ? 'healthy'
      : checks.some((c) => c.status === 'error')
        ? 'error'
        : 'warning';

    const allAlerts = checks.flatMap((c) => c.alerts || []);

    return {
      overall,
      alerts: allAlerts,
    };
  }

  storeHealthResult(result) {
    this.healthHistory.push(result);

    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory.shift();
    }
  }

  getHealthHistory(limit = 50) {
    return this.healthHistory.slice(-limit);
  }

  getHealthSummary() {
    const recent = this.healthHistory.slice(-20);

    if (recent.length === 0) {
      return {
        overall: 'unknown',
        uptime: 0,
        totalChecks: 0,
        healthyChecks: 0,
        warningChecks: 0,
        errorChecks: 0,
      };
    }

    const healthyChecks = recent.filter((h) => h.status === 'healthy').length;
    const warningChecks = recent.filter((h) => h.status === 'warning').length;
    const errorChecks = recent.filter((h) => h.status === 'error').length;

    const overall =
      errorChecks > 0 ? 'error' : warningChecks > 0 ? 'warning' : 'healthy';

    return {
      overall,
      uptime: recent.length > 0 ? recent[recent.length - 1].timestamp : null,
      totalChecks: recent.length,
      healthyChecks,
      warningChecks,
      errorChecks,
      healthPercentage: (healthyChecks / recent.length) * 100,
    };
  }
}

module.exports = HealthCheckService;
