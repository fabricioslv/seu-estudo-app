/**
 * Serviço especializado em logs de performance
 * Monitora métricas de sistema, tempo de resposta e uso de recursos
 */

import { performanceLogger, logger } from './logger.js';
import os from 'os';
import performance from 'performance-now';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Classe para monitoramento de métricas de sistema
class SystemMetrics {
  constructor() {
    this.metrics = {
      cpu: [],
      memory: [],
      disk: [],
      network: [],
    };
    this.maxSamples = 100;
    this.interval = 30000; // 30 segundos
    this.isMonitoring = false;
    this.monitoringInterval = null;
  }

  startMonitoring() {
    if (this.isMonitoring) return;

    this.isMonitoring = true;
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics();
    }, this.interval);

    performanceLogger('Monitoramento de métricas de sistema iniciado', {
      interval: this.interval,
      maxSamples: this.maxSamples,
    });
  }

  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;

    performanceLogger('Monitoramento de métricas de sistema interrompido');
  }

  collectMetrics() {
    const timestamp = new Date().toISOString();

    // Métricas de CPU
    const cpuUsage = process.cpuUsage();
    const cpuPercent = this.calculateCPUPercentage(cpuUsage);

    // Métricas de memória
    const memUsage = process.memoryUsage();
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();

    // Métricas de sistema
    const loadAverage = os.loadavg();

    const metrics = {
      timestamp,
      cpu: {
        user: cpuUsage.user / 1000, // Convert to milliseconds
        system: cpuUsage.system / 1000,
        percentage: cpuPercent,
      },
      memory: {
        rss: memUsage.rss, // Resident Set Size
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        systemTotal: totalMemory,
        systemFree: freeMemory,
        systemUsed: totalMemory - freeMemory,
      },
      system: {
        loadAverage: {
          '1min': loadAverage[0],
          '5min': loadAverage[1],
          '15min': loadAverage[2],
        },
        uptime: os.uptime(),
        platform: os.platform(),
        arch: os.arch(),
        nodeVersion: process.version,
      },
    };

    this.storeMetrics(metrics);

    // Verifica se há problemas de performance
    this.checkPerformanceThresholds(metrics);

    return metrics;
  }

  calculateCPUPercentage(cpuUsage) {
    const totalCPU = cpuUsage.user + cpuUsage.system;
    const percentage = (totalCPU / 1000000) * 100; // Convert microseconds to percentage
    return Math.min(percentage, 100); // Cap at 100%
  }

  storeMetrics(metrics) {
    Object.keys(this.metrics).forEach((key) => {
      this.metrics[key].push(metrics);

      if (this.metrics[key].length > this.maxSamples) {
        this.metrics[key].shift(); // Remove oldest sample
      }
    });
  }

  checkPerformanceThresholds(metrics) {
    const thresholds = {
      cpuThreshold: 80, // 80%
      memoryThreshold: 85, // 85%
      loadThreshold: 2, // Load average
    };

    const alerts = [];

    if (metrics.cpu.percentage > thresholds.cpuThreshold) {
      alerts.push({
        type: 'cpu_high',
        value: metrics.cpu.percentage,
        threshold: thresholds.cpuThreshold,
        message: `Uso de CPU alto: ${metrics.cpu.percentage.toFixed(2)}%`,
      });
    }

    const memoryPercent =
      (metrics.memory.heapUsed / metrics.memory.heapTotal) * 100;
    if (memoryPercent > thresholds.memoryThreshold) {
      alerts.push({
        type: 'memory_high',
        value: memoryPercent,
        threshold: thresholds.memoryThreshold,
        message: `Uso de memória alto: ${memoryPercent.toFixed(2)}%`,
      });
    }

    if (metrics.system.loadAverage['1min'] > thresholds.loadThreshold) {
      alerts.push({
        type: 'load_high',
        value: metrics.system.loadAverage['1min'],
        threshold: thresholds.loadThreshold,
        message: `Load average alto: ${metrics.system.loadAverage['1min'].toFixed(2)}`,
      });
    }

    if (alerts.length > 0) {
      performanceLogger('Alertas de performance detectados', {
        alerts,
        metrics,
        level: 'warning',
      });

      // Disparar alertas usando o serviço de alertas se disponível
      if (global.healthCheckService) {
        for (const alert of alerts) {
          const severity =
            alert.value > alert.threshold * 1.2 ? 'critical' : 'warning';
          global.healthCheckService.alertService.triggerAlert(
            alert.type,
            severity,
            alert.message,
            {
              metric: alert.type,
              value: alert.value,
              threshold: alert.threshold,
              systemMetrics: metrics,
            }
          );
        }
      }
    }
  }

  getMetrics() {
    return this.metrics;
  }

  getAverageMetrics() {
    const averages = {};

    Object.keys(this.metrics).forEach((key) => {
      if (this.metrics[key].length === 0) return;

      const latest = this.metrics[key][this.metrics[key].length - 1];
      averages[key] = latest;
    });

    return averages;
  }
}

// Classe para monitoramento de performance de requisições
class RequestPerformanceMonitor {
  constructor() {
    this.requestStats = new Map();
    this.responseTimeStats = {
      count: 0,
      totalTime: 0,
      averageTime: 0,
      minTime: Infinity,
      maxTime: 0,
      slowRequests: 0,
    };
  }

  startRequest(req) {
    const requestId = `${req.method}:${req.url}:${Date.now()}`;
    const startTime = performance();

    this.requestStats.set(requestId, {
      method: req.method,
      url: req.url,
      startTime,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });

    return requestId;
  }

  endRequest(requestId, statusCode, res) {
    const requestData = this.requestStats.get(requestId);
    if (!requestData) return;

    const endTime = performance();
    const responseTime = endTime - requestData.startTime;

    // Atualiza estatísticas gerais
    this.responseTimeStats.count++;
    this.responseTimeStats.totalTime += responseTime;
    this.responseTimeStats.averageTime =
      this.responseTimeStats.totalTime / this.responseTimeStats.count;
    this.responseTimeStats.minTime = Math.min(
      this.responseTimeStats.minTime,
      responseTime
    );
    this.responseTimeStats.maxTime = Math.max(
      this.responseTimeStats.maxTime,
      responseTime
    );

    if (responseTime > 1000) {
      // Requests mais lentos que 1 segundo
      this.responseTimeStats.slowRequests++;
    }

    // Remove request das estatísticas ativas
    this.requestStats.delete(requestId);

    // Log detalhado para requests lentos
    if (responseTime > 5000) {
      // 5 segundos threshold
      performanceLogger('Request muito lento detectado', {
        requestId,
        method: requestData.method,
        url: requestData.url,
        responseTime: `${responseTime.toFixed(2)}ms`,
        statusCode,
        ip: requestData.ip,
        level: 'warning',
      });
    }

    return {
      responseTime,
      statusCode,
      requestData,
    };
  }

  getStats() {
    return {
      activeRequests: this.requestStats.size,
      ...this.responseTimeStats,
      slowRequestPercentage:
        this.responseTimeStats.count > 0
          ? (this.responseTimeStats.slowRequests /
              this.responseTimeStats.count) *
            100
          : 0,
    };
  }
}

// Função para medir tempo de execução de operações assíncronas
const measureAsyncExecution = async (operationName, operation) => {
  const startTime = performance();
  const startMemory = process.memoryUsage();

  try {
    const result = await operation();
    const endTime = performance();
    const endMemory = process.memoryUsage();

    const executionTime = endTime - startTime;
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      external: endMemory.external - startMemory.external,
    };

    performanceLogger(`Execução assíncrona: ${operationName}`, {
      operation: operationName,
      executionTime: `${executionTime.toFixed(2)}ms`,
      memoryDelta,
      success: true,
    });

    return { result, executionTime, memoryDelta };
  } catch (error) {
    const endTime = performance();
    const endMemory = process.memoryUsage();

    const executionTime = endTime - startTime;
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      external: endMemory.external - startMemory.external,
    };

    performanceLogger(`Erro na execução assíncrona: ${operationName}`, {
      operation: operationName,
      executionTime: `${executionTime.toFixed(2)}ms`,
      memoryDelta,
      error: error.message,
      success: false,
    });

    throw error;
  }
};

// Função para medir tempo de execução de operações síncronas
const measureSyncExecution = (operationName, operation) => {
  const startTime = performance();
  const startMemory = process.memoryUsage();

  try {
    const result = operation();
    const endTime = performance();
    const endMemory = process.memoryUsage();

    const executionTime = endTime - startTime;
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      external: endMemory.external - startMemory.external,
    };

    performanceLogger(`Execução síncrona: ${operationName}`, {
      operation: operationName,
      executionTime: `${executionTime.toFixed(2)}ms`,
      memoryDelta,
      success: true,
    });

    return { result, executionTime, memoryDelta };
  } catch (error) {
    const endTime = performance();
    const endMemory = process.memoryUsage();

    const executionTime = endTime - startTime;
    const memoryDelta = {
      rss: endMemory.rss - startMemory.rss,
      heapUsed: endMemory.heapUsed - startMemory.heapUsed,
      external: endMemory.external - startMemory.external,
    };

    performanceLogger(`Erro na execução síncrona: ${operationName}`, {
      operation: operationName,
      executionTime: `${executionTime.toFixed(2)}ms`,
      memoryDelta,
      error: error.message,
      success: false,
    });

    throw error;
  }
};

// Middleware para monitoramento de performance de API
const performanceMonitoringMiddleware = (req, res, next) => {
  const monitor =
    req.app.locals.requestMonitor || new RequestPerformanceMonitor();

  if (!req.app.locals.requestMonitor) {
    req.app.locals.requestMonitor = monitor;
  }

  const requestId = monitor.startRequest(req);

  // Armazena o ID da requisição no objeto da requisição para acesso posterior
  req.requestId = requestId;

  const originalEnd = res.end;
  res.end = function (...args) {
    monitor.endRequest(requestId, res.statusCode, res);
    originalEnd.apply(this, args);
  };

  next();
};

// Função para obter métricas atuais do sistema
const getCurrentMetrics = () => {
  return {
    timestamp: new Date().toISOString(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    uptime: process.uptime(),
    platform: os.platform(),
    arch: os.arch(),
    loadAverage: os.loadavg(),
    totalMemory: os.totalmem(),
    freeMemory: os.freemem(),
  };
};

// Função para gerar relatório de performance
const generatePerformanceReport = (systemMetrics, requestMonitor) => {
  const systemAvg = systemMetrics.getAverageMetrics();
  const requestStats = requestMonitor.getStats();

  return {
    timestamp: new Date().toISOString(),
    system: {
      cpu: systemAvg.cpu
        ? {
            percentage: systemAvg.cpu.percentage,
            user: systemAvg.cpu.user,
            system: systemAvg.cpu.system,
          }
        : null,
      memory: systemAvg.memory
        ? {
            heapUsed: systemAvg.memory.heapUsed,
            heapTotal: systemAvg.memory.heapTotal,
            percentage:
              (systemAvg.memory.heapUsed / systemAvg.memory.heapTotal) * 100,
            systemTotal: systemAvg.memory.systemTotal,
            systemUsed: systemAvg.memory.systemUsed,
          }
        : null,
      loadAverage: systemAvg.system ? systemAvg.system.loadAverage : null,
    },
    requests: {
      total: requestStats.count,
      averageTime: requestStats.averageTime,
      minTime: requestStats.minTime === Infinity ? 0 : requestStats.minTime,
      maxTime: requestStats.maxTime,
      slowRequests: requestStats.slowRequests,
      slowRequestPercentage: requestStats.slowRequestPercentage,
      activeRequests: requestStats.activeRequests,
    },
    summary: {
      overallHealth:
        requestStats.averageTime < 1000 &&
        systemAvg.cpu &&
        systemAvg.cpu.percentage < 80
          ? 'good'
          : 'warning',
      bottlenecks: [],
    },
  };
};

export { SystemMetrics, getCurrentMetrics, performanceMonitoringMiddleware };

