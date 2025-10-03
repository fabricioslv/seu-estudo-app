/**
 * Serviço especializado em logs de segurança
 * Monitora e registra eventos de segurança críticos
 */

const { securityLogger, logger } = require('./logger');
const fs = require('fs').promises;
const path = require('path');

// Configuração de ameaças e padrões suspeitos
const SECURITY_PATTERNS = {
  sqlInjection: [
    /(\bunion\b|\bselect\b|\binsert\b|\bupdate\b|\bdelete\b|\bdrop\b|\bcreate\b|\balter\b)/i,
    /('|(\\')|(;)|(\|\|)|(\bor\b|\band\b))/i,
    /(\d+)\s*=\s*\1/i, // Tautology patterns
  ],
  xss: [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<iframe[^>]*>.*?<\/iframe>/gi,
    /<object[^>]*>.*?<\/object>/gi,
    /<embed[^>]*>/gi,
  ],
  pathTraversal: [/\.\.[\/\\]/g, /\.\.%2f/gi, /\.\.%5c/gi, /%2e%2e/gi],
  commandInjection: [
    /(\||;|&|\$\(|\`)/g,
    /(rm\s|del\s|format\s|shutdown\s)/gi,
    /(\.\.(\/|\\))/g,
  ],
  authentication: {
    bruteForce: {
      maxAttempts: 5,
      timeWindow: 15 * 60 * 1000, // 15 minutos
      blockDuration: 30 * 60 * 1000, // 30 minutos
    },
    suspiciousPatterns: [/admin/i, /root/i, /test/i, /123/i, /password/i],
  },
};

// Classe para rastrear tentativas de login
class LoginTracker {
  constructor() {
    this.attempts = new Map();
    this.blockedIPs = new Map();
  }

  recordAttempt(ip, username, success) {
    const now = Date.now();
    const key = `${ip}:${username}`;

    if (!this.attempts.has(key)) {
      this.attempts.set(key, []);
    }

    const userAttempts = this.attempts.get(key);

    // Remove tentativas antigas fora da janela de tempo
    const timeWindow = SECURITY_PATTERNS.authentication.bruteForce.timeWindow;
    const recentAttempts = userAttempts.filter(
      (time) => now - time < timeWindow
    );

    if (success) {
      // Login bem-sucedido - limpa tentativas
      this.attempts.set(key, []);
      securityLogger('Login bem-sucedido', {
        ip,
        username,
        success: true,
        attempts: recentAttempts.length,
      });
    } else {
      // Login falhado - adiciona tentativa
      recentAttempts.push(now);
      this.attempts.set(key, recentAttempts);

      const attempts = recentAttempts.length;
      const maxAttempts =
        SECURITY_PATTERNS.authentication.bruteForce.maxAttempts;

      securityLogger('Tentativa de login falhada', {
        ip,
        username,
        success: false,
        attempts,
        blocked: attempts >= maxAttempts,
      });

      if (attempts >= maxAttempts) {
        this.blockIP(ip, 'brute_force');
      }
    }

    return recentAttempts.length;
  }

  isBlocked(ip) {
    const blocked = this.blockedIPs.get(ip);
    if (blocked && Date.now() - blocked.timestamp > blocked.duration) {
      this.blockedIPs.delete(ip);
      return false;
    }
    return !!blocked;
  }

  blockIP(ip, reason) {
    this.blockedIPs.set(ip, {
      reason,
      timestamp: Date.now(),
      duration: SECURITY_PATTERNS.authentication.bruteForce.blockDuration,
    });

    securityLogger('IP bloqueado por segurança', {
      ip,
      reason,
      duration: '30 minutos',
    });
  }

  getStats() {
    return {
      totalAttempts: this.attempts.size,
      blockedIPs: this.blockedIPs.size,
      attempts: Object.fromEntries(this.attempts),
      blocked: Object.fromEntries(this.blockedIPs),
    };
  }
}

// Classe para análise de padrões de segurança
class SecurityAnalyzer {
  constructor() {
    this.loginTracker = new LoginTracker();
    this.suspiciousActivities = new Map();
  }

  // Analisa uma requisição em busca de padrões suspeitos
  analyzeRequest(req) {
    const suspiciousFindings = {
      patterns: [],
      riskLevel: 'low',
      details: {},
    };

    const requestData = this.extractRequestData(req);

    // Verifica SQL Injection
    for (const pattern of SECURITY_PATTERNS.sqlInjection) {
      if (pattern.test(requestData)) {
        suspiciousFindings.patterns.push('sql_injection');
        suspiciousFindings.riskLevel = 'high';
        suspiciousFindings.details.sqlInjection = true;
        break;
      }
    }

    // Verifica XSS
    for (const pattern of SECURITY_PATTERNS.xss) {
      if (pattern.test(requestData)) {
        suspiciousFindings.patterns.push('xss');
        suspiciousFindings.riskLevel =
          suspiciousFindings.riskLevel === 'high' ? 'high' : 'medium';
        suspiciousFindings.details.xss = true;
        break;
      }
    }

    // Verifica Path Traversal
    for (const pattern of SECURITY_PATTERNS.pathTraversal) {
      if (pattern.test(requestData)) {
        suspiciousFindings.patterns.push('path_traversal');
        suspiciousFindings.riskLevel = 'high';
        suspiciousFindings.details.pathTraversal = true;
        break;
      }
    }

    // Verifica Command Injection
    for (const pattern of SECURITY_PATTERNS.commandInjection) {
      if (pattern.test(requestData)) {
        suspiciousFindings.patterns.push('command_injection');
        suspiciousFindings.riskLevel = 'high';
        suspiciousFindings.details.commandInjection = true;
        break;
      }
    }

    return suspiciousFindings;
  }

  // Extrai dados da requisição para análise
  extractRequestData(req) {
    return [
      req.url,
      req.originalUrl,
      req.body ? JSON.stringify(req.body) : '',
      req.query ? JSON.stringify(req.query) : '',
      req.headers ? JSON.stringify(req.headers) : '',
      req.params ? JSON.stringify(req.params) : '',
    ].join(' ');
  }

  // Registra atividade suspeita
  recordSuspiciousActivity(req, analysis) {
    const key = req.ip;
    const now = Date.now();

    if (!this.suspiciousActivities.has(key)) {
      this.suspiciousActivities.set(key, []);
    }

    const activities = this.suspiciousActivities.get(key);
    activities.push({
      timestamp: now,
      url: req.url,
      method: req.method,
      patterns: analysis.patterns,
      riskLevel: analysis.riskLevel,
    });

    // Mantém apenas atividades dos últimos 30 minutos
    const thirtyMinutesAgo = 30 * 60 * 1000;
    const recentActivities = activities.filter(
      (a) => now - a.timestamp < thirtyMinutesAgo
    );
    this.suspiciousActivities.set(key, recentActivities);

    return recentActivities.length;
  }

  // Verifica se IP tem muitas atividades suspeitas
  isHighlySuspicious(ip) {
    const activities = this.suspiciousActivities.get(ip) || [];
    const recentHighRisk = activities.filter(
      (a) => a.riskLevel === 'high'
    ).length;
    const recentActivities = activities.length;

    return recentHighRisk >= 3 || recentActivities >= 10;
  }

  // Registra tentativa de login
  recordLoginAttempt(req, username, success) {
    const attempts = this.loginTracker.recordAttempt(req.ip, username, success);
    const isBlocked = this.loginTracker.isBlocked(req.ip);

    if (isBlocked) {
      securityLogger('Tentativa de login de IP bloqueado', {
        ip: req.ip,
        username,
        success,
        blocked: true,
      });

      return { blocked: true, attempts };
    }

    return { blocked: false, attempts };
  }

  // Gera relatório de segurança
  generateSecurityReport() {
    const stats = this.loginTracker.getStats();
    const highlySuspiciousIPs = [];

    for (const [ip, activities] of this.suspiciousActivities.entries()) {
      if (this.isHighlySuspicious(ip)) {
        highlySuspiciousIPs.push({
          ip,
          activities: activities.length,
          highRiskActivities: activities.filter((a) => a.riskLevel === 'high')
            .length,
          recentActivities: activities.slice(-5), // Últimas 5 atividades
        });
      }
    }

    return {
      timestamp: new Date().toISOString(),
      loginAttempts: stats,
      highlySuspiciousIPs,
      totalSuspiciousActivities: this.suspiciousActivities.size,
      summary: {
        blockedIPs: stats.blockedIPs,
        suspiciousIPs: highlySuspiciousIPs.length,
        totalAttempts: stats.totalAttempts,
      },
    };
  }
}

// Middleware para monitoramento de segurança em tempo real
const securityMonitoringMiddleware = (req, res, next) => {
  const analyzer = req.app.locals.securityAnalyzer || new SecurityAnalyzer();

  // Inicializa o analyzer se não existir
  if (!req.app.locals.securityAnalyzer) {
    req.app.locals.securityAnalyzer = analyzer;
  }

  const analysis = analyzer.analyzeRequest(req);

  if (analysis.patterns.length > 0) {
    const activityCount = analyzer.recordSuspiciousActivity(req, analysis);

    securityLogger('Atividade suspeita detectada', {
      ip: req.ip,
      url: req.url,
      method: req.method,
      patterns: analysis.patterns,
      riskLevel: analysis.riskLevel,
      activityCount,
      userAgent: req.get('User-Agent'),
      referer: req.get('Referer'),
    });

    if (analyzer.isHighlySuspicious(req.ip)) {
      securityLogger('IP altamente suspeito detectado', {
        ip: req.ip,
        activityCount,
        analysis,
        action: 'potential_block',
      });

      // Pode implementar bloqueio automático aqui se necessário
    }
  }

  next();
};

// Função para registrar eventos de segurança específicos
const logSecurityEvent = (eventType, details, threatLevel = 'medium') => {
  securityLogger(`Evento de segurança: ${eventType}`, {
    eventType,
    threatLevel,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// Função para registrar ataques detectados
const logAttackDetected = (attackType, req, additionalDetails = {}) => {
  securityLogger(`Ataque detectado: ${attackType}`, {
    attackType,
    threatLevel: 'high',
    ip: req.ip,
    url: req.url,
    method: req.method,
    userAgent: req.get('User-Agent'),
    headers: req.headers,
    timestamp: new Date().toISOString(),
    ...additionalDetails,
  });
};

// Função para registrar violações de autenticação
const logAuthViolation = (violationType, req, details = {}) => {
  securityLogger(`Violação de autenticação: ${violationType}`, {
    violationType,
    threatLevel: 'medium',
    ip: req.ip,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// Função para registrar violações de autorização
const logAuthzViolation = (resource, action, req, details = {}) => {
  securityLogger('Violação de autorização', {
    violationType: 'authorization',
    threatLevel: 'medium',
    resource,
    action,
    ip: req.ip,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

// Função para registrar tentativas de acesso a dados sensíveis
const logSensitiveAccess = (dataType, req, success, details = {}) => {
  securityLogger(`Acesso a dados sensíveis: ${dataType}`, {
    dataType,
    threatLevel: success ? 'low' : 'medium',
    success,
    ip: req.ip,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    ...details,
  });
};

module.exports = {
  SecurityAnalyzer,
  LoginTracker,
  securityMonitoringMiddleware,
  logSecurityEvent,
  logAttackDetected,
  logAuthViolation,
  logAuthzViolation,
  logSensitiveAccess,
  SECURITY_PATTERNS,
};
