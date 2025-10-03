// Serviço avançado de notificações com IA para engajamento contínuo
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

class NotificationService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.notificationQueue = [];
    this.isProcessing = false;
  }

  async initialize() {
    console.log('🔔 Inicializando serviço avançado de notificações...');

    // Criar tabela de configurações de notificação se não existir
    await this.createNotificationTables();

    // Iniciar processamento em background
    this.startNotificationProcessor();

    console.log('✅ Serviço de notificações inicializado');
  }

  async createNotificationTables() {
    try {
      await this.supabase.rpc('create_notification_tables', {
        sql: `
                    -- Tabela principal de notificações
                    CREATE TABLE IF NOT EXISTS notificacoes (
                        id SERIAL PRIMARY KEY,
                        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                        tipo VARCHAR(50) NOT NULL, -- conquista, lembrete, sistema, personalizado
                        titulo VARCHAR(255) NOT NULL,
                        mensagem TEXT NOT NULL,
                        dados JSONB, -- Dados adicionais da notificação
                        prioridade INTEGER DEFAULT 1, -- 1=baixa, 2=normal, 3=alta, 4=urgente
                        lida BOOLEAN DEFAULT false,
                        data_agendada TIMESTAMPTZ,
                        data_criacao TIMESTAMPTZ DEFAULT now(),
                        data_lida TIMESTAMPTZ
                    );

                    -- Tabela de configurações de notificação por usuário
                    CREATE TABLE IF NOT EXISTS configuracoes_notificacao (
                        id SERIAL PRIMARY KEY,
                        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                        tipo_notificacao VARCHAR(50) NOT NULL,
                        habilitada BOOLEAN DEFAULT true,
                        frequencia VARCHAR(20) DEFAULT 'imediata', -- imediata, diaria, semanal
                        horario_preferido TIME,
                        UNIQUE(usuario_id, tipo_notificacao)
                    );

                    -- Tabela de métricas de engajamento
                    CREATE TABLE IF NOT EXISTS metricas_engajamento (
                        id SERIAL PRIMARY KEY,
                        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                        tipo_interacao VARCHAR(50) NOT NULL,
                        dados JSONB,
                        data_interacao TIMESTAMPTZ DEFAULT now()
                    );

                    -- Índices para performance
                    CREATE INDEX IF NOT EXISTS idx_notificacoes_usuario_lida ON notificacoes(usuario_id, lida);
                    CREATE INDEX IF NOT EXISTS idx_notificacoes_tipo_prioridade ON notificacoes(tipo, prioridade);
                    CREATE INDEX IF NOT EXISTS idx_notificacoes_agendada ON notificacoes(data_agendada) WHERE data_agendada IS NOT NULL;
                    CREATE INDEX IF NOT EXISTS idx_metricas_usuario_data ON metricas_engajamento(usuario_id, data_interacao);
                `,
      });

      console.log('✅ Tabelas de notificações criadas/verficadas');
    } catch (error) {
      console.error('❌ Erro ao criar tabelas de notificações:', error);
    }
  }

  // Sistema inteligente de agendamento de notificações
  async scheduleSmartNotification(
    userId,
    tipo,
    titulo,
    mensagem,
    dados = {},
    prioridade = 2
  ) {
    try {
      // Verificar configurações do usuário
      const userConfig = await this.getUserNotificationConfig(userId, tipo);

      if (!userConfig.habilitada) {
        console.log(
          `🔔 Notificação ${tipo} desabilitada para usuário ${userId}`
        );
        return null;
      }

      // Calcular quando enviar baseado na frequência
      const scheduledTime = this.calculateNotificationTime(userConfig);

      const { data, error } = await this.supabase
        .from('notificacoes')
        .insert({
          usuario_id: userId,
          tipo,
          titulo,
          mensagem,
          dados,
          prioridade,
          data_agendada: scheduledTime,
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ Notificação agendada para usuário ${userId}: ${titulo}`);
      return data;
    } catch (error) {
      console.error('Erro ao agendar notificação:', error);
      return null;
    }
  }

  async getUserNotificationConfig(userId, tipo) {
    try {
      const { data, error } = await this.supabase
        .from('configuracoes_notificacao')
        .select('*')
        .eq('usuario_id', userId)
        .eq('tipo_notificacao', tipo)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Configuração padrão se não existir
      if (!data) {
        return {
          usuario_id: userId,
          tipo_notificacao: tipo,
          habilitada: true,
          frequencia: 'imediata',
          horario_preferido: '09:00:00',
        };
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
      return {
        usuario_id: userId,
        tipo_notificacao: tipo,
        habilitada: true,
        frequencia: 'imediata',
      };
    }
  }

  calculateNotificationTime(config) {
    const now = new Date();

    switch (config.frequencia) {
      case 'imediata':
        return now;

      case 'diaria':
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (config.horario_preferido) {
          const [hours, minutes] = config.horario_preferido.split(':');
          tomorrow.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
          tomorrow.setHours(9, 0, 0, 0);
        }

        return tomorrow;

      case 'semanal':
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);

        if (config.horario_preferido) {
          const [hours, minutes] = config.horario_preferido.split(':');
          nextWeek.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        } else {
          nextWeek.setHours(9, 0, 0, 0);
        }

        return nextWeek;

      default:
        return now;
    }
  }

  // Sistema inteligente baseado em comportamento do usuário
  async analyzeAndNotify(userId) {
    try {
      // Buscar dados recentes do usuário
      const userStats = await this.getUserStats(userId);

      // Análise de padrões de estudo
      const insights = await this.generateStudyInsights(userStats);

      // Gerar notificações baseadas nos insights
      const notifications = [];

      for (const insight of insights) {
        const notification = await this.scheduleSmartNotification(
          userId,
          insight.tipo,
          insight.titulo,
          insight.mensagem,
          insight.dados,
          insight.prioridade
        );

        if (notification) {
          notifications.push(notification);
        }
      }

      return notifications;
    } catch (error) {
      console.error('Erro na análise e notificação:', error);
      return [];
    }
  }

  async getUserStats(userId) {
    try {
      // Buscar últimos 30 dias de atividade
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: simulados, error: simuladosError } = await this.supabase
        .from('resultados_simulado')
        .select('*')
        .eq('usuario_id', userId)
        .gte('data_realizacao', thirtyDaysAgo.toISOString())
        .order('data_realizacao', { ascending: false });

      if (simuladosError) throw simuladosError;

      const { data: engajamento, error: engajamentoError } = await this.supabase
        .from('metricas_engajamento')
        .select('*')
        .eq('usuario_id', userId)
        .gte('data_interacao', thirtyDaysAgo.toISOString())
        .order('data_interacao', { ascending: false });

      if (engajamentoError) throw engajamentoError;

      return {
        simulados: simulados || [],
        engajamento: engajamento || [],
        periodo: 30,
      };
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return { simulados: [], engajamento: [], periodo: 30 };
    }
  }

  async generateStudyInsights(userStats) {
    const insights = [];

    // Análise de frequência de estudo
    if (userStats.simulados.length < 3) {
      insights.push({
        tipo: 'lembrete',
        titulo: '🎯 Hora de estudar!',
        mensagem:
          'Você não fez simulados esta semana. Que tal praticar um pouco?',
        dados: { razao: 'pouca_atividade' },
        prioridade: 2,
      });
    }

    // Análise de matérias com dificuldade
    const materiasStats = {};
    userStats.simulados.forEach((simulado) => {
      if (!materiasStats[simulado.materia]) {
        materiasStats[simulado.materia] = { total: 0, acertos: 0 };
      }
      materiasStats[simulado.materia].total++;
      materiasStats[simulado.materia].acertos += simulado.pontuacao || 0;
    });

    for (const [materia, stats] of Object.entries(materiasStats)) {
      const media = stats.acertos / stats.total;
      if (media < 60) {
        insights.push({
          tipo: 'recomendacao',
          titulo: `📚 Atenção em ${materia}`,
          mensagem: `Sua média em ${materia} está em ${Math.round(media)}%. Que tal focar nesta matéria?`,
          dados: { materia, media, recomendacao: true },
          prioridade: 3,
        });
      }
    }

    // Análise de streaks
    const today = new Date().toDateString();
    const lastStudyDate =
      userStats.simulados.length > 0
        ? new Date(userStats.simulados[0].data_realizacao).toDateString()
        : null;

    if (lastStudyDate && lastStudyDate !== today) {
      insights.push({
        tipo: 'motivacao',
        titulo: '🔥 Mantenha o ritmo!',
        mensagem:
          'Você estudou ontem! Continue hoje para manter sua sequência de estudos.',
        dados: { tipo: 'streak_motivation' },
        prioridade: 2,
      });
    }

    // Análise de conquistas recentes
    const recentAchievements = userStats.engajamento.filter(
      (e) => e.tipo_interacao === 'conquista'
    );

    if (recentAchievements.length === 0) {
      insights.push({
        tipo: 'conquista',
        titulo: '🏆 Desbloqueie conquistas!',
        mensagem:
          'Complete simulados para desbloquear suas primeiras conquistas!',
        dados: { tipo: 'primeiras_conquistas' },
        prioridade: 1,
      });
    }

    return insights;
  }

  // Processador em background para notificações agendadas
  startNotificationProcessor() {
    setInterval(async () => {
      if (this.isProcessing) return;

      this.isProcessing = true;

      try {
        await this.processScheduledNotifications();
      } catch (error) {
        console.error('Erro no processamento de notificações:', error);
      } finally {
        this.isProcessing = false;
      }
    }, 60000); // Verificar a cada minuto
  }

  async processScheduledNotifications() {
    try {
      const now = new Date();

      const { data: notifications, error } = await this.supabase
        .from('notificacoes')
        .select('*')
        .lte('data_agendada', now.toISOString())
        .eq('lida', false)
        .order('prioridade', { ascending: false })
        .limit(50);

      if (error) throw error;

      for (const notification of notifications) {
        try {
          // Marcar como processada
          await this.supabase
            .from('notificacoes')
            .update({ data_agendada: null })
            .eq('id', notification.id);

          // Enviar notificação (simulado)
          await this.sendNotification(notification);

          console.log(`📤 Notificação enviada: ${notification.titulo}`);
        } catch (error) {
          console.error(
            `Erro ao processar notificação ${notification.id}:`,
            error
          );
        }
      }
    } catch (error) {
      console.error('Erro ao processar notificações agendadas:', error);
    }
  }

  async sendNotification(notification) {
    // Simulação de envio de notificação
    // Em produção, integrar com serviço como Firebase Cloud Messaging

    console.log(
      `🔔 Enviando notificação para usuário ${notification.usuario_id}:`
    );
    console.log(`   Título: ${notification.titulo}`);
    console.log(`   Mensagem: ${notification.mensagem}`);
    console.log(`   Prioridade: ${notification.prioridade}`);

    // Registrar métrica de engajamento
    await this.recordEngagementMetric(
      notification.usuario_id,
      'notificacao_enviada',
      {
        notificacao_id: notification.id,
        tipo: notification.tipo,
        titulo: notification.titulo,
      }
    );
  }

  async recordEngagementMetric(userId, interactionType, dados = {}) {
    try {
      await this.supabase.from('metricas_engajamento').insert({
        usuario_id: userId,
        tipo_interacao: interactionType,
        dados,
      });
    } catch (error) {
      console.error('Erro ao registrar métrica:', error);
    }
  }

  // API para gerenciar configurações de notificação
  async updateNotificationConfig(userId, tipo, config) {
    try {
      const { data, error } = await this.supabase
        .from('configuracoes_notificacao')
        .upsert({
          usuario_id: userId,
          tipo_notificacao: tipo,
          habilitada: config.habilitada,
          frequencia: config.frequencia,
          horario_preferido: config.horario_preferido,
        })
        .select()
        .single();

      if (error) throw error;

      console.log(
        `✅ Configurações de notificação atualizadas para usuário ${userId}`
      );
      return data;
    } catch (error) {
      console.error('Erro ao atualizar configurações:', error);
      throw error;
    }
  }

  // Análise de engajamento para melhorar notificações
  async analyzeEngagement(userId) {
    try {
      const { data: metrics, error } = await this.supabase
        .from('metricas_engajamento')
        .select('*')
        .eq('usuario_id', userId)
        .order('data_interacao', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Análise simples de padrões
      const interactionTypes = {};
      const hourlyPatterns = {};

      metrics.forEach((metric) => {
        // Contar tipos de interação
        const tipo = metric.tipo_interacao;
        interactionTypes[tipo] = (interactionTypes[tipo] || 0) + 1;

        // Analisar padrões horários
        const hour = new Date(metric.data_interacao).getHours();
        hourlyPatterns[hour] = (hourlyPatterns[hour] || 0) + 1;
      });

      return {
        total_interacoes: metrics.length,
        tipos_interacao: interactionTypes,
        melhores_horarios: this.getBestHours(hourlyPatterns),
        ultimo_engajamento:
          metrics.length > 0 ? new Date(metrics[0].data_interacao) : null,
      };
    } catch (error) {
      console.error('Erro na análise de engajamento:', error);
      return {
        total_interacoes: 0,
        tipos_interacao: {},
        melhores_horarios: [],
        ultimo_engajamento: null,
      };
    }
  }

  getBestHours(hourlyPatterns) {
    // Ordenar horas por número de interações
    return Object.entries(hourlyPatterns)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));
  }

  // Sistema de notificações personalizadas baseado em IA
  async generatePersonalizedNotification(userId, contexto) {
    try {
      // Buscar dados do usuário para personalização
      const userProfile = await this.getUserProfile(userId);
      const engagement = await this.analyzeEngagement(userId);

      // Gerar notificação personalizada baseada no contexto
      let titulo = '';
      let mensagem = '';
      let prioridade = 2;

      switch (contexto.tipo) {
        case 'motivacao':
          titulo = `🎯 Vamos continuar, ${userProfile.nome.split(' ')[0]}!`;
          mensagem = `Você está indo bem! Já completou ${contexto.progresso || 0} questões hoje.`;
          prioridade = 2;
          break;

        case 'recomendacao':
          titulo = `💡 Dica personalizada para você`;
          mensagem =
            contexto.recomendacao ||
            'Continue praticando para melhorar seu desempenho.';
          prioridade = 3;
          break;

        case 'conquista':
          titulo = `🏆 Parabéns, ${userProfile.nome.split(' ')[0]}!`;
          mensagem =
            contexto.conquista || 'Você desbloqueou uma nova conquista!';
          prioridade = 4;
          break;

        default:
          titulo = '📚 Seu Estudo';
          mensagem = 'Continue sua jornada de aprendizado!';
          prioridade = 1;
      }

      return await this.scheduleSmartNotification(
        userId,
        contexto.tipo || 'personalizado',
        titulo,
        mensagem,
        contexto,
        prioridade
      );
    } catch (error) {
      console.error('Erro ao gerar notificação personalizada:', error);
      return null;
    }
  }

  async getUserProfile(userId) {
    try {
      const { data, error } = await this.supabase
        .from('usuarios')
        .select('nome, email, tipo')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      return { nome: 'Usuário', email: '', tipo: 'aluno' };
    }
  }

  // API para obter notificações do usuário
  async getUserNotifications(userId, limit = 20) {
    try {
      const { data, error } = await this.supabase
        .from('notificacoes')
        .select('*')
        .eq('usuario_id', userId)
        .order('data_criacao', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar notificações:', error);
      return [];
    }
  }

  async markNotificationAsRead(userId, notificationId) {
    try {
      const { data, error } = await this.supabase
        .from('notificacoes')
        .update({
          lida: true,
          data_lida: new Date().toISOString(),
        })
        .eq('id', notificationId)
        .eq('usuario_id', userId)
        .select()
        .single();

      if (error) throw error;

      // Registrar interação
      await this.recordEngagementMetric(userId, 'notificacao_lida', {
        notificacao_id: notificationId,
      });

      return data;
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      throw error;
    }
  }

  getStats() {
    return {
      notificacoes_na_fila: this.notificationQueue.length,
      processando: this.isProcessing,
      timestamp: new Date().toISOString(),
    };
  }
}

const notificationService = new NotificationService();
export default notificationService;
