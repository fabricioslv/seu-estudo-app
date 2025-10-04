/**
 * Serviço especializado em logs de negócio
 * Registra ações importantes dos usuários e eventos significativos
 */

import { businessLogger, logger } from './logger.js';

// Classe para rastreamento de ações de usuários
class UserActivityTracker {
  constructor() {
    this.activities = new Map();
    this.dailyStats = new Map();
    this.retentionPeriod = 30 * 24 * 60 * 60 * 1000; // 30 dias
  }

  // Registra uma atividade do usuário
  recordActivity(userId, activityType, details = {}) {
    const activity = {
      userId,
      activityType,
      timestamp: new Date().toISOString(),
      details,
    };

    // Adiciona à lista de atividades do usuário
    if (!this.activities.has(userId)) {
      this.activities.set(userId, []);
    }

    const userActivities = this.activities.get(userId);
    userActivities.push(activity);

    // Mantém apenas atividades recentes
    const cutoff = Date.now() - this.retentionPeriod;
    const recentActivities = userActivities.filter(
      (a) => new Date(a.timestamp).getTime() > cutoff
    );
    this.activities.set(userId, recentActivities);

    // Atualiza estatísticas diárias
    this.updateDailyStats(userId, activityType);

    // Log estruturado da atividade
    businessLogger(`Atividade de usuário: ${activityType}`, {
      userId,
      activityType,
      details,
      timestamp: activity.timestamp,
    });

    return activity;
  }

  // Atualiza estatísticas diárias
  updateDailyStats(userId, activityType) {
    const today = new Date().toISOString().split('T')[0];

    if (!this.dailyStats.has(today)) {
      this.dailyStats.set(today, {
        users: new Set(),
        activities: new Map(),
        totalActivities: 0,
      });
    }

    const dayStats = this.dailyStats.get(today);
    dayStats.users.add(userId);

    const currentCount = dayStats.activities.get(activityType) || 0;
    dayStats.activities.set(activityType, currentCount + 1);
    dayStats.totalActivities++;

    return dayStats;
  }

  // Obtém atividades de um usuário específico
  getUserActivities(userId, limit = 50) {
    const activities = this.activities.get(userId) || [];
    return activities.slice(-limit);
  }

  // Obtém estatísticas de atividades
  getActivityStats(days = 7) {
    const stats = {
      totalUsers: 0,
      totalActivities: 0,
      activitiesByType: new Map(),
      dailyBreakdown: [],
      topUsers: [],
    };

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    for (const [date, dayStats] of this.dailyStats.entries()) {
      if (new Date(date) < cutoffDate) continue;

      stats.totalUsers += dayStats.users.size;
      stats.totalActivities += dayStats.totalActivities;

      stats.dailyBreakdown.push({
        date,
        uniqueUsers: dayStats.users.size,
        totalActivities: dayStats.totalActivities,
        activitiesByType: Object.fromEntries(dayStats.activities),
      });

      // Agrega atividades por tipo
      for (const [type, count] of dayStats.activities.entries()) {
        const current = stats.activitiesByType.get(type) || 0;
        stats.activitiesByType.set(type, current + count);
      }
    }

    // Calcula usuários mais ativos
    const userActivityCount = new Map();
    for (const activities of this.activities.values()) {
      for (const activity of activities) {
        if (new Date(activity.timestamp) >= cutoffDate) {
          const count = userActivityCount.get(activity.userId) || 0;
          userActivityCount.set(activity.userId, count + 1);
        }
      }
    }

    stats.topUsers = Array.from(userActivityCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId, count]) => ({ userId, activityCount: count }));

    return stats;
  }
}

// Classe para rastreamento de eventos de negócio
class BusinessEventTracker {
  constructor() {
    this.events = [];
    this.eventTypes = new Set();
    this.maxEvents = 10000;
  }

  // Registra um evento de negócio
  recordEvent(eventType, eventData, severity = 'info') {
    const event = {
      id: this.generateEventId(),
      type: eventType,
      data: eventData,
      severity,
      timestamp: new Date().toISOString(),
    };

    this.events.push(event);
    this.eventTypes.add(eventType);

    // Mantém limite de eventos
    if (this.events.length > this.maxEvents) {
      this.events.shift();
    }

    // Log estruturado do evento
    businessLogger(`Evento de negócio: ${eventType}`, {
      eventId: event.id,
      eventType,
      severity,
      data: eventData,
      timestamp: event.timestamp,
    });

    return event;
  }

  // Gera ID único para evento
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Obtém eventos por tipo
  getEventsByType(eventType, limit = 100) {
    return this.events
      .filter((event) => event.type === eventType)
      .slice(-limit);
  }

  // Obtém eventos recentes
  getRecentEvents(limit = 100) {
    return this.events.slice(-limit);
  }

  // Obtém estatísticas de eventos
  getEventStats(days = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentEvents = this.events.filter(
      (event) => new Date(event.timestamp) >= cutoffDate
    );

    const stats = {
      totalEvents: recentEvents.length,
      eventsByType: new Map(),
      eventsBySeverity: new Map(),
      eventsByDay: new Map(),
    };

    for (const event of recentEvents) {
      // Conta por tipo
      const typeCount = stats.eventsByType.get(event.type) || 0;
      stats.eventsByType.set(event.type, typeCount + 1);

      // Conta por severidade
      const severityCount = stats.eventsBySeverity.get(event.severity) || 0;
      stats.eventsBySeverity.set(event.severity, severityCount + 1);

      // Conta por dia
      const day = event.timestamp.split('T')[0];
      const dayCount = stats.eventsByDay.get(day) || 0;
      stats.eventsByDay.set(day, dayCount + 1);
    }

    return {
      ...stats,
      eventsByType: Object.fromEntries(stats.eventsByType),
      eventsBySeverity: Object.fromEntries(stats.eventsBySeverity),
      eventsByDay: Object.fromEntries(stats.eventsByDay),
    };
  }
}

// Funções específicas para diferentes tipos de eventos de negócio

// Eventos de autenticação
const logAuthenticationEvent = (eventType, userId, details = {}) => {
  const activityTracker =
    global.businessActivityTracker || new UserActivityTracker();
  if (!global.businessActivityTracker) {
    global.businessActivityTracker = activityTracker;
  }

  activityTracker.recordActivity(userId, `auth_${eventType}`, details);

  businessLogger(`Evento de autenticação: ${eventType}`, {
    userId,
    eventType: `auth_${eventType}`,
    details,
  });
};

// Eventos de estudo/aprendizado
const logStudyEvent = (eventType, userId, studyData) => {
  const activityTracker =
    global.businessActivityTracker || new UserActivityTracker();
  if (!global.businessActivityTracker) {
    global.businessActivityTracker = activityTracker;
  }

  activityTracker.recordActivity(userId, `study_${eventType}`, studyData);

  businessLogger(`Evento de estudo: ${eventType}`, {
    userId,
    eventType: `study_${eventType}`,
    studyData,
  });
};

// Eventos de gamificação
const logGamificationEvent = (eventType, userId, gameData) => {
  const activityTracker =
    global.businessActivityTracker || new UserActivityTracker();
  if (!global.businessActivityTracker) {
    global.businessActivityTracker = activityTracker;
  }

  activityTracker.recordActivity(userId, `gamification_${eventType}`, gameData);

  businessLogger(`Evento de gamificação: ${eventType}`, {
    userId,
    eventType: `gamification_${eventType}`,
    gameData,
  });
};

// Eventos de tutoria
const logTutoringEvent = (eventType, userId, tutoringData) => {
  const activityTracker =
    global.businessActivityTracker || new UserActivityTracker();
  if (!global.businessActivityTracker) {
    global.businessActivityTracker = activityTracker;
  }

  activityTracker.recordActivity(userId, `tutoring_${eventType}`, tutoringData);

  businessLogger(`Evento de tutoria: ${eventType}`, {
    userId,
    eventType: `tutoring_${eventType}`,
    tutoringData,
  });
};

// Eventos de avaliação
const logAssessmentEvent = (eventType, userId, assessmentData) => {
  const activityTracker =
    global.businessActivityTracker || new UserActivityTracker();
  if (!global.businessActivityTracker) {
    global.businessActivityTracker = activityTracker;
  }

  activityTracker.recordActivity(
    userId,
    `assessment_${eventType}`,
    assessmentData
  );

  businessLogger(`Evento de avaliação: ${eventType}`, {
    userId,
    eventType: `assessment_${eventType}`,
    assessmentData,
  });
};

// Eventos administrativos
const logAdminEvent = (eventType, adminId, adminData) => {
  businessLogger(`Evento administrativo: ${eventType}`, {
    adminId,
    eventType: `admin_${eventType}`,
    adminData,
  });
};

// Eventos de sistema/negócio importantes
const logSystemEvent = (eventType, systemData) => {
  const eventTracker =
    global.businessEventTracker || new BusinessEventTracker();
  if (!global.businessEventTracker) {
    global.businessEventTracker = eventTracker;
  }

  eventTracker.recordEvent(`system_${eventType}`, systemData, 'info');

  businessLogger(`Evento de sistema: ${eventType}`, {
    eventType: `system_${eventType}`,
    systemData,
  });
};

// Eventos de integração
const logIntegrationEvent = (integrationType, eventType, integrationData) => {
  businessLogger(`Evento de integração: ${integrationType}_${eventType}`, {
    integrationType,
    eventType,
    integrationData,
  });
};

// Função para gerar relatórios de negócio
const generateBusinessReport = () => {
  const activityTracker = global.businessActivityTracker;
  const eventTracker = global.businessEventTracker;

  const report = {
    timestamp: new Date().toISOString(),
    userActivities: activityTracker ? activityTracker.getActivityStats() : null,
    businessEvents: eventTracker ? eventTracker.getEventStats() : null,
    summary: {
      totalActiveUsers: activityTracker
        ? new Set([...activityTracker.activities.keys()]).size
        : 0,
      totalEventTypes: eventTracker ? eventTracker.eventTypes.size : 0,
    },
  };

  return report;
};

// Middleware para logging automático de atividades baseadas em rotas
const businessActivityMiddleware = (req, res, next) => {
  // Define atividades baseadas na rota e método HTTP
  const routeActivities = {
    'POST:/api/auth/login': 'user_login',
    'POST:/api/auth/register': 'user_register',
    'POST:/api/auth/logout': 'user_logout',
    'GET:/api/questoes': 'view_questions',
    'POST:/api/questoes': 'submit_question',
    'GET:/api/simulados': 'view_simulados',
    'POST:/api/simulados': 'start_simulado',
    'GET:/api/livros': 'view_books',
    'GET:/api/tutoria': 'view_tutoring',
    'POST:/api/mensagens': 'send_message',
    'GET:/api/notas': 'view_grades',
    'GET:/api/gamificacao': 'view_gamification',
  };

  const activityKey = `${req.method}:${req.url}`;
  const activityType = routeActivities[activityKey];

  if (activityType && req.user && req.user.id) {
    const activityTracker =
      global.businessActivityTracker || new UserActivityTracker();
    if (!global.businessActivityTracker) {
      global.businessActivityTracker = activityTracker;
    }

    activityTracker.recordActivity(req.user.id, activityType, {
      route: req.url,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
  }

  next();
};

export {
  UserActivityTracker,
  BusinessEventTracker,
  businessActivityMiddleware,
  businessLogger,
  logAuthenticationEvent,
  logStudyEvent,
  logGamificationEvent,
  logTutoringEvent,
  logAssessmentEvent,
  logAdminEvent,
  logSystemEvent,
  logIntegrationEvent,
  generateBusinessReport,
};

