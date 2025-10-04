/**
 * Serviço de Alertas Automáticos
 * Monitora métricas e envia alertas quando thresholds são excedidos
 */

import { logger, securityLogger } from './logger.js';
import notificationService from './notificationService.js';

class AlertService {
  constructor() {
    this.alerts = new Map();
    this.alertHistory = [];
    this.maxHistorySize = 1000;
    this.notificationChannels = new Set();

    // Configurações padrão de alertas
    this.config = {
      enabled: true,
      cooldownPeriod: 5 * 60 * 1000, // 5 minutos entre alertas similares
      escalationDelay: 15 * 60 * 1000, // 15 minutos antes de escalar
      maxAlertsPerHour: 10,
    };

    // Thresholds padrão
    this.thresholds = {
      cpu: { warning: 70, critical: 90 },
      memory: { warning: 80, critical: 95 },
      disk: { warning: 85, critical: 95 },
      responseTime: { warning: 2000, critical: 5000 }, // ms
      errorRate: { warning: 0.05, critical: 0.1 }, // 5% e 10%
      database: {
        connectionTime: { warning: 1000, critical: 3000 },
        poolUsage: { warning: 80, critical: 95 },
      },
    };

    // Estado dos alertas ativos
    this.activeAlerts = new Map();

    this.startAlertProcessor();
  }

  startAlertProcessor() {
    // Processa alertas a cada 30 segundos
    setInterval(() => {
      this.processPendingAlerts();
    }, 30000);

    // Limpa alertas antigos a cada hora
    setInterval(
      () => {
        this.cleanupOldAlerts();
      },
      60 * 60 * 1000
    );

    logger.info('Sistema de alertas iniciado', {
      cooldownPeriod: this.config.cooldownPeriod,
      escalationDelay: this.config.escalationDelay,
    });
  }

  processPendingAlerts() {
    // Esta função seria chamada pelo HealthCheckService
    // quando detectar problemas que precisam de alerta
  }

  /**
   * Registra um alerta baseado em métricas do sistema
   */
  async triggerAlert(type, severity, message, metadata = {}) {
    if (!this.config.enabled) return;

    const alertId = `${type}_${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Verificar se já existe alerta similar recente
    if (this.isAlertOnCooldown(type)) {
      logger.info('Alerta ignorado devido ao cooldown', { type, message });
      return null;
    }

    // Verificar limite de alertas por hora
    if (this.exceedsHourlyLimit()) {
      logger.warn('Limite de alertas por hora excedido', {
        type,
        message,
        limit: this.config.maxAlertsPerHour,
      });
      return null;
    }

    const alert = {
      id: alertId,
      type,
      severity, // 'warning', 'critical', 'info'
      message,
      timestamp,
      metadata,
      status: 'active',
      acknowledged: false,
      escalated: false,
      escalationTime: null,
    };

    // Armazenar alerta
    this.alerts.set(alertId, alert);
    this.alertHistory.push(alert);

    // Manter tamanho do histórico
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory.shift();
    }

    // Log do alerta
    logger.warn(`Alerta disparado: ${type}`, {
      alertId,
      severity,
      message,
      metadata,
    });

    // Registrar alerta ativo
    this.activeAlerts.set(type, {
      alertId,
      timestamp,
      count: (this.activeAlerts.get(type)?.count || 0) + 1,
    });

    // Enviar notificação
    await this.sendNotification(alert);

    // Programar escalação se necessário
    if (severity === 'critical') {
      this.scheduleEscalation(alertId);
    }

    return alert;
  }

  isAlertOnCooldown(type) {
    const lastAlert = this.activeAlerts.get(type);
    if (!lastAlert) return false;

    const timeSinceLastAlert =
      Date.now() - new Date(lastAlert.timestamp).getTime();
    return timeSinceLastAlert < this.config.cooldownPeriod;
  }

  exceedsHourlyLimit() {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentAlerts = this.alertHistory.filter(
      (alert) => new Date(alert.timestamp).getTime() > oneHourAgo
    );

    return recentAlerts.length >= this.config.maxAlertsPerHour;
  }

  async sendNotification(alert) {
    try {
      // Preparar mensagem de notificação
      const notificationData = {
        type: 'system_alert',
        title: `Alerta do Sistema: ${alert.severity.toUpperCase()}`,
        message: alert.message,
        severity: alert.severity,
        alertId: alert.id,
        timestamp: alert.timestamp,
        metadata: alert.metadata,
      };

      // Enviar para todos os canais configurados
      const notifications = [];

      if (this.notificationChannels.has('console')) {
        notifications.push(this.sendConsoleNotification(notificationData));
      }

      if (
        this.notificationChannels.has('webhook') &&
        process.env.ALERT_WEBHOOK_URL
      ) {
        notifications.push(this.sendWebhookNotification(notificationData));
      }

      if (this.notificationChannels.has('email') && process.env.ALERT_EMAIL) {
        notifications.push(this.sendEmailNotification(notificationData));
      }

      // Aguardar todas as notificações
      await Promise.allSettled(notifications);

      logger.info('Notificações de alerta enviadas', {
        alertId: alert.id,
        channels: Array.from(this.notificationChannels),
        count: notifications.length,
      });
    } catch (error) {
      logger.error('Erro ao enviar notificações de alerta', {
        alertId: alert.id,
        error: error.message,
      });
    }
  }

  async sendConsoleNotification(notificationData) {
    const consoleMessage = `
🚨 ALERTA DO SISTEMA 🚨
Tipo: ${notificationData.type}
Severidade: ${notificationData.severity}
Mensagem: ${notificationData.message}
ID: ${notificationData.alertId}
Timestamp: ${notificationData.timestamp}
Metadados: ${JSON.stringify(notificationData.metadata, null, 2)}
    `.trim();

    console.log(consoleMessage);

    // Log estruturado também
    if (notificationData.severity === 'critical') {
      logger.error('Alerta crítico enviado para console', notificationData);
    } else {
      logger.warn('Alerta enviado para console', notificationData);
    }
  }

  async sendWebhookNotification(notificationData) {
    try {
      const https = require('https');
      const webhookUrl = process.env.ALERT_WEBHOOK_URL;

      const payload = {
        text: `🚨 *${notificationData.title}*\n${notificationData.message}`,
        attachments: [
          {
            color: this.getSeverityColor(notificationData.severity),
            fields: [
              { title: 'Tipo', value: notificationData.type, short: true },
              {
                title: 'Severidade',
                value: notificationData.severity,
                short: true,
              },
              {
                title: 'Timestamp',
                value: notificationData.timestamp,
                short: true,
              },
              {
                title: 'ID do Alerta',
                value: notificationData.alertId,
                short: true,
              },
            ],
            footer: 'Sistema de Monitoramento Seu-Estudo',
            ts: Math.floor(
              new Date(notificationData.timestamp).getTime() / 1000
            ),
          },
        ],
      };

      return new Promise((resolve, reject) => {
        const request = https.request(
          webhookUrl,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          },
          (response) => {
            if (response.statusCode >= 200 && response.statusCode < 300) {
              resolve();
            } else {
              reject(
                new Error(`Webhook failed with status ${response.statusCode}`)
              );
            }
          }
        );

        request.on('error', reject);
        request.on('timeout', () => {
          request.destroy();
          reject(new Error('Webhook timeout'));
        });

        request.write(JSON.stringify(payload));
        request.end();
      });
    } catch (error) {
      logger.error('Erro ao enviar webhook de alerta', {
        error: error.message,
        webhookUrl: process.env.ALERT_WEBHOOK_URL
          ? '[CONFIGURED]'
          : '[NOT_CONFIGURED]',
      });
      throw error;
    }
  }

  async sendEmailNotification(notificationData) {
    try {
      if (
        !notificationService ||
        typeof notificationService.sendSystemAlert !== 'function'
      ) {
        throw new Error('Notification service not available');
      }

      await notificationService.sendSystemAlert({
        to: process.env.ALERT_EMAIL,
        subject: notificationData.title,
        message: notificationData.message,
        severity: notificationData.severity,
        metadata: notificationData.metadata,
      });
    } catch (error) {
      logger.error('Erro ao enviar email de alerta', {
        error: error.message,
        email: process.env.ALERT_EMAIL ? '[CONFIGURED]' : '[NOT_CONFIGURED]',
      });
      throw error;
    }
  }

  getSeverityColor(severity) {
    switch (severity) {
      case 'critical':
        return 'danger';
      case 'warning':
        return 'warning';
      case 'info':
        return '#439FE0';
      default:
        return 'good';
    }
  }

  scheduleEscalation(alertId) {
    const alert = this.alerts.get(alertId);
    if (!alert) return;

    alert.escalationTime = new Date(Date.now() + this.config.escalationDelay);

    setTimeout(async () => {
      const currentAlert = this.alerts.get(alertId);
      if (currentAlert && !currentAlert.acknowledged) {
        await this.escalateAlert(alertId);
      }
    }, this.config.escalationDelay);
  }

  async escalateAlert(alertId) {
    const alert = this.alerts.get(alertId);
    if (!alert) return;

    alert.escalated = true;
    alert.escalationCount = (alert.escalationCount || 0) + 1;

    logger.error('Alerta escalado para nível crítico', {
      alertId,
      originalSeverity: alert.severity,
      escalationCount: alert.escalationCount,
    });

    // Enviar notificação de escalação
    await this.triggerAlert(
      `${alert.type}_escalated`,
      'critical',
      `Alerta escalado: ${alert.message}`,
      {
        originalAlertId: alertId,
        escalationCount: alert.escalationCount,
        originalTimestamp: alert.timestamp,
      }
    );
  }

  /**
   * Reconhece um alerta (marca como visto)
   */
  acknowledgeAlert(alertId, user = 'system') {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.acknowledged = true;
    alert.acknowledgedBy = user;
    alert.acknowledgedAt = new Date().toISOString();

    // Remover dos alertas ativos
    this.activeAlerts.delete(alert.type);

    logger.info('Alerta reconhecido', {
      alertId,
      user,
      type: alert.type,
      severity: alert.severity,
    });

    return true;
  }

  /**
   * Resolve um alerta (problema solucionado)
   */
  resolveAlert(alertId, user = 'system', resolution = '') {
    const alert = this.alerts.get(alertId);
    if (!alert) return false;

    alert.status = 'resolved';
    alert.resolved = true;
    alert.resolvedBy = user;
    alert.resolvedAt = new Date().toISOString();
    alert.resolution = resolution;

    // Remover dos alertas ativos
    this.activeAlerts.delete(alert.type);

    logger.info('Alerta resolvido', {
      alertId,
      user,
      type: alert.type,
      severity: alert.severity,
      resolution,
    });

    return true;
  }

  /**
   * Obtém todos os alertas ativos
   */
  getActiveAlerts() {
    return Array.from(this.alerts.values()).filter(
      (alert) => alert.status === 'active'
    );
  }

  /**
   * Obtém histórico de alertas
   */
  getAlertHistory(limit = 100, filter = {}) {
    let history = [...this.alertHistory];

    // Aplicar filtros
    if (filter.type) {
      history = history.filter((alert) => alert.type === filter.type);
    }

    if (filter.severity) {
      history = history.filter((alert) => alert.severity === filter.severity);
    }

    if (filter.status) {
      history = history.filter((alert) => alert.status === filter.status);
    }

    if (filter.fromDate) {
      const fromDate = new Date(filter.fromDate).getTime();
      history = history.filter(
        (alert) => new Date(alert.timestamp).getTime() >= fromDate
      );
    }

    if (filter.toDate) {
      const toDate = new Date(filter.toDate).getTime();
      history = history.filter(
        (alert) => new Date(alert.timestamp).getTime() <= toDate
      );
    }

    // Ordenar por timestamp (mais recente primeiro)
    history.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return history.slice(0, limit);
  }

  /**
   * Obtém estatísticas de alertas
   */
  getAlertStats(timeRange = '24h') {
    const now = Date.now();
    const timeRanges = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
    };

    const rangeMs = timeRanges[timeRange] || timeRanges['24h'];
    const cutoffTime = now - rangeMs;

    const recentAlerts = this.alertHistory.filter(
      (alert) => new Date(alert.timestamp).getTime() > cutoffTime
    );

    const stats = {
      timeRange,
      total: recentAlerts.length,
      bySeverity: {
        critical: recentAlerts.filter((a) => a.severity === 'critical').length,
        warning: recentAlerts.filter((a) => a.severity === 'warning').length,
        info: recentAlerts.filter((a) => a.severity === 'info').length,
      },
      byType: {},
      active: this.getActiveAlerts().length,
      acknowledged: recentAlerts.filter((a) => a.acknowledged).length,
      resolved: recentAlerts.filter((a) => a.resolved).length,
      escalated: recentAlerts.filter((a) => a.escalated).length,
    };

    // Contagem por tipo
    recentAlerts.forEach((alert) => {
      stats.byType[alert.type] = (stats.byType[alert.type] || 0) + 1;
    });

    return stats;
  }

  cleanupOldAlerts() {
    const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000; // 7 dias

    // Limpar alertas antigos do histórico
    this.alertHistory = this.alertHistory.filter(
      (alert) => new Date(alert.timestamp).getTime() > cutoffTime
    );

    // Limpar alertas resolvidos/acknowledged do mapa ativo
    for (const [alertId, alert] of this.alerts.entries()) {
      if (alert.status === 'resolved' || alert.acknowledged) {
        this.alerts.delete(alertId);
      }
    }

    logger.info('Limpeza de alertas antigos concluída', {
      remainingHistory: this.alertHistory.length,
      remainingActive: this.alerts.size,
    });
  }

  /**
   * Adiciona canal de notificação
   */
  addNotificationChannel(channel) {
    this.notificationChannels.add(channel);
    logger.info('Canal de notificação adicionado', { channel });
  }

  /**
   * Remove canal de notificação
   */
  removeNotificationChannel(channel) {
    this.notificationChannels.delete(channel);
    logger.info('Canal de notificação removido', { channel });
  }

  /**
   * Atualiza configurações de alerta
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    logger.info('Configurações de alerta atualizadas', this.config);
  }

  /**
   * Atualiza thresholds de alerta
   */
  updateThresholds(newThresholds) {
    this.thresholds = { ...this.thresholds, ...newThresholds };
    logger.info('Thresholds de alerta atualizados', this.thresholds);
  }
}

export default AlertService;

