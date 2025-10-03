// Serviço de Análise Preditiva de Desempenho
import { createClient } from '@supabase/supabase-js';
import ollamaService from './ollamaService.js';
import dotenv from 'dotenv';

dotenv.config();

class PredictiveAnalysisService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    console.log('🧠 Inicializando serviço de análise preditiva...');

    // Criar tabelas para análise preditiva
    await this.createPredictiveTables();

    this.isInitialized = true;
    console.log('✅ Serviço de análise preditiva inicializado');
  }

  async createPredictiveTables() {
    try {
      await this.supabase.rpc('create_predictive_tables', {
        sql: `
                    -- Tabela de padrões de estudo
                    CREATE TABLE IF NOT EXISTS padroes_estudo (
                        id SERIAL PRIMARY KEY,
                        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                        materia VARCHAR(100),
                        dia_semana INTEGER, -- 0=domingo, 1=segunda, etc.
                        hora_estudo INTEGER, -- Hora do dia (0-23)
                        duracao_media INTEGER, -- em minutos
                        acertos_medio DECIMAL(5,2),
                        tentativas INTEGER,
                        data_analise DATE DEFAULT CURRENT_DATE,
                        UNIQUE(usuario_id, materia, dia_semana, hora_estudo)
                    );

                    -- Tabela de previsões de desempenho
                    CREATE TABLE IF NOT EXISTS previsoes_desempenho (
                        id SERIAL PRIMARY KEY,
                        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                        materia VARCHAR(100),
                        periodo VARCHAR(20), -- semana, mes, semestre
                        previsao_acertos DECIMAL(5,2),
                        confianca DECIMAL(3,2), -- 0.00 a 1.00
                        fatores_influencia JSONB,
                        data_previsao TIMESTAMPTZ DEFAULT now(),
                        data_validade TIMESTAMPTZ
                    );

                    -- Tabela de recomendações personalizadas
                    CREATE TABLE IF NOT EXISTS recomendacoes_personalizadas (
                        id SERIAL PRIMARY KEY,
                        usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                        tipo VARCHAR(50), -- estudo, revisao, pratica
                        materia VARCHAR(100),
                        titulo VARCHAR(255),
                        descricao TEXT,
                        prioridade INTEGER DEFAULT 1,
                        eficacia_prevista DECIMAL(3,2),
                        aplicada BOOLEAN DEFAULT false,
                        resultado JSONB,
                        data_criacao TIMESTAMPTZ DEFAULT now(),
                        data_aplicacao TIMESTAMPTZ
                    );

                    -- Índices para performance
                    CREATE INDEX IF NOT EXISTS idx_padroes_usuario_materia ON padroes_estudo(usuario_id, materia);
                    CREATE INDEX IF NOT EXISTS idx_previsoes_usuario_materia ON previsoes_desempenho(usuario_id, materia);
                    CREATE INDEX IF NOT EXISTS idx_recomendacoes_usuario ON recomendacoes_personalizadas(usuario_id, aplicada);
                `,
      });

      console.log('✅ Tabelas de análise preditiva criadas');
    } catch (error) {
      console.error('❌ Erro ao criar tabelas de análise preditiva:', error);
    }
  }

  // Análise de padrões de estudo
  async analyzeStudyPatterns(userId, periodo = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - periodo);

      // Buscar dados de simulados
      const { data: simulados, error: simuladosError } = await this.supabase
        .from('resultados_simulado')
        .select('*')
        .eq('usuario_id', userId)
        .gte('data_realizacao', startDate.toISOString())
        .order('data_realizacao');

      if (simuladosError) throw simuladosError;

      // Buscar métricas de engajamento
      const { data: engajamento, error: engajamentoError } = await this.supabase
        .from('metricas_engajamento')
        .select('*')
        .eq('usuario_id', userId)
        .gte('data_interacao', startDate.toISOString())
        .order('data_interacao');

      if (engajamentoError) throw engajamentoError;

      return {
        simulados: simulados || [],
        engajamento: engajamento || [],
        periodo,
        total_simulados: simulados?.length || 0,
        total_interacoes: engajamento?.length || 0,
      };
    } catch (error) {
      console.error('Erro ao analisar padrões de estudo:', error);
      return {
        simulados: [],
        engajamento: [],
        periodo,
        total_simulados: 0,
        total_interacoes: 0,
      };
    }
  }

  // Geração de previsões baseadas em padrões históricos
  async generatePerformancePrediction(userId, materia, periodo = 'semana') {
    try {
      const userPatterns = await this.analyzeStudyPatterns(userId, 90); // 90 dias de histórico

      // Análise estatística básica
      const materiaStats = userPatterns.simulados.filter(
        (s) => s.materia === materia
      );

      if (materiaStats.length < 5) {
        return {
          materia,
          periodo,
          previsao: null,
          confianca: 0,
          razao: 'dados_insuficientes',
          recomendacao: 'Complete mais simulados para gerar previsões precisas',
        };
      }

      // Calcular tendências
      const recentStats = materiaStats.slice(0, 5); // Últimos 5 simulados
      const olderStats = materiaStats.slice(5, 10); // Simulados anteriores

      const recentAverage =
        recentStats.reduce((acc, s) => acc + (s.pontuacao || 0), 0) /
        recentStats.length;
      const olderAverage =
        olderStats.length > 0
          ? olderStats.reduce((acc, s) => acc + (s.pontuacao || 0), 0) /
            olderStats.length
          : recentAverage;

      // Calcular tendência
      const tendencia = recentAverage - olderAverage;

      // Fatores de influência
      const fatores = {
        tendencia_atual: tendencia,
        consistencia: this.calculateConsistency(materiaStats),
        frequencia_estudo: this.calculateStudyFrequency(
          userPatterns.simulados,
          materia
        ),
        tempo_medio: this.calculateAverageTime(materiaStats),
      };

      // Previsão baseada em IA (se disponível)
      let previsao = recentAverage + tendencia;
      let confianca = 0.7;

      if (ollamaService.isConnected) {
        try {
          const aiPrediction = await this.getAIPrediction(
            userId,
            materia,
            fatores
          );
          previsao = (previsao + aiPrediction.previsao) / 2;
          confianca = Math.min(aiPrediction.confianca + 0.2, 1.0);
        } catch (error) {
          console.warn('Erro na previsão com IA:', error);
        }
      }

      // Garantir limites realistas
      previsao = Math.max(0, Math.min(100, previsao));

      // Calcular data de validade da previsão
      const validadeDate = new Date();
      switch (periodo) {
        case 'semana':
          validadeDate.setDate(validadeDate.getDate() + 7);
          break;
        case 'mes':
          validadeDate.setMonth(validadeDate.getMonth() + 1);
          break;
        case 'semestre':
          validadeDate.setMonth(validadeDate.getMonth() + 6);
          break;
      }

      // Salvar previsão no banco
      await this.savePrediction(
        userId,
        materia,
        periodo,
        previsao,
        confianca,
        fatores,
        validadeDate
      );

      return {
        materia,
        periodo,
        previsao: Math.round(previsao * 100) / 100,
        confianca: Math.round(confianca * 100) / 100,
        tendencia,
        fatores,
        recomendacoes: this.generateRecommendations(fatores, tendencia),
      };
    } catch (error) {
      console.error('Erro ao gerar previsão de desempenho:', error);
      return {
        materia,
        periodo,
        previsao: null,
        confianca: 0,
        razao: 'erro_analise',
      };
    }
  }

  calculateConsistency(simulados) {
    if (simulados.length < 2) return 0;

    const pontuacoes = simulados.map((s) => s.pontuacao || 0);
    const media = pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length;
    const variancia =
      pontuacoes.reduce((acc, p) => acc + Math.pow(p - media, 2), 0) /
      pontuacoes.length;

    // Converter variância para consistência (0-1)
    return Math.max(0, 1 - Math.sqrt(variancia) / 100);
  }

  calculateStudyFrequency(simulados, materia) {
    const materiaSimulados = simulados.filter((s) => s.materia === materia);

    if (materiaSimulados.length < 2) return 0;

    const dates = materiaSimulados.map((s) =>
      new Date(s.data_realizacao).getTime()
    );
    const intervals = [];

    for (let i = 1; i < dates.length; i++) {
      intervals.push((dates[i] - dates[i - 1]) / (1000 * 60 * 60 * 24)); // Dias
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;

    // Converter intervalo para frequência (0-1)
    return Math.max(0, 1 - avgInterval / 14); // Ideal: estudo a cada 7 dias
  }

  calculateAverageTime(simulados) {
    const tempos = simulados
      .filter((s) => s.tempo_gasto)
      .map((s) => s.tempo_gasto);

    return tempos.length > 0
      ? tempos.reduce((a, b) => a + b, 0) / tempos.length
      : 0;
  }

  async getAIPrediction(userId, materia, fatores) {
    if (!ollamaService.isConnected) {
      throw new Error('Ollama não disponível');
    }

    try {
      const prompt = `
Analise os seguintes dados de desempenho do estudante e faça uma previsão:

Matéria: ${materia}
Tendência atual: ${fatores.tendencia_atual.toFixed(2)}
Consistência: ${(fatores.consistencia * 100).toFixed(1)}%
Frequência de estudo: ${(fatores.frequencia_estudo * 100).toFixed(1)}%
Tempo médio por simulado: ${fatores.tempo_medio.toFixed(0)} minutos

Baseado nesses dados, qual a previsão de acertos em porcentagem para a próxima semana?
Considere também o histórico geral do estudante.

Responda apenas com um JSON válido:
{
  "previsao": 75.5,
  "confianca": 0.8,
  "explicacao": "Explicação breve da previsão"
}`;

      const response = await ollamaService.chatWithBook('', prompt);

      try {
        const aiResult = JSON.parse(response);
        return {
          previsao: aiResult.previsao || 0,
          confianca: aiResult.confianca || 0,
          explicacao: aiResult.explicacao || '',
        };
      } catch (parseError) {
        console.warn('Erro ao parsear resposta da IA:', parseError);
        return {
          previsao: 0,
          confianca: 0,
          explicacao: 'Erro no processamento da IA',
        };
      }
    } catch (error) {
      console.error('Erro na previsão com IA:', error);
      throw error;
    }
  }

  async savePrediction(
    userId,
    materia,
    periodo,
    previsao,
    confianca,
    fatores,
    validadeDate
  ) {
    try {
      await this.supabase.from('previsoes_desempenho').insert({
        usuario_id: userId,
        materia,
        periodo,
        previsao_acertos: previsao,
        confianca,
        fatores_influencia: fatores,
        data_validade: validadeDate,
      });
    } catch (error) {
      console.error('Erro ao salvar previsão:', error);
    }
  }

  generateRecommendations(fatores, tendencia) {
    const recomendacoes = [];

    if (tendencia < -5) {
      recomendacoes.push({
        tipo: 'revisao',
        titulo: '📚 Focar em revisão',
        descricao:
          'Sua tendência está negativa. Recomendamos revisar conceitos básicos.',
        prioridade: 3,
      });
    }

    if (fatores.consistencia < 0.6) {
      recomendacoes.push({
        tipo: 'consistencia',
        titulo: '🎯 Melhorar consistência',
        descricao:
          'Tente manter horários regulares de estudo para melhorar resultados.',
        prioridade: 2,
      });
    }

    if (fatores.frequencia_estudo < 0.5) {
      recomendacoes.push({
        tipo: 'frequencia',
        titulo: '⏰ Aumentar frequência',
        descricao:
          'Estude com mais regularidade para melhor retenção do conteúdo.',
        prioridade: 2,
      });
    }

    if (fatores.tempo_medio < 20) {
      recomendacoes.push({
        tipo: 'tempo',
        titulo: '⏱️ Dedicar mais tempo',
        descricao: 'Considere aumentar o tempo dedicado aos estudos.',
        prioridade: 1,
      });
    }

    return recomendacoes.sort((a, b) => b.prioridade - a.prioridade);
  }

  // Geração de plano de estudos personalizado baseado em análise preditiva
  async generatePersonalizedStudyPlan(userId, objetivo) {
    try {
      console.log(`📋 Gerando plano personalizado para usuário ${userId}...`);

      // Buscar previsões existentes
      const { data: previsoes, error } = await this.supabase
        .from('previsoes_desempenho')
        .select('*')
        .eq('usuario_id', userId)
        .gte('data_validade', new Date().toISOString())
        .order('data_previsao', { ascending: false });

      if (error) throw error;

      // Buscar padrões de estudo
      const patterns = await this.analyzeStudyPatterns(userId, 30);

      // Identificar matérias críticas
      const materiasCriticas = this.identifyCriticalSubjects(previsoes);

      // Gerar plano baseado em IA
      if (ollamaService.isConnected) {
        return await this.generateAIStudyPlan(
          userId,
          objetivo,
          materiasCriticas,
          patterns
        );
      } else {
        return this.generateBasicStudyPlan(materiasCriticas, objetivo);
      }
    } catch (error) {
      console.error('Erro ao gerar plano personalizado:', error);
      return this.generateBasicStudyPlan([], objetivo);
    }
  }

  identifyCriticalSubjects(previsoes) {
    const materias = {};

    previsoes.forEach((previsao) => {
      if (!materias[previsao.materia]) {
        materias[previsao.materia] = {
          total_previsoes: 0,
          soma_previsoes: 0,
          soma_confianca: 0,
        };
      }

      materias[previsao.materia].total_previsoes++;
      materias[previsao.materia].soma_previsoes += previsao.previsao_acertos;
      materias[previsao.materia].soma_confianca += previsao.confianca;
    });

    // Calcular médias e identificar críticas
    const materiasAnalisadas = Object.entries(materias).map(
      ([materia, stats]) => ({
        materia,
        media_previsao: stats.soma_previsoes / stats.total_previsoes,
        media_confianca: stats.soma_confianca / stats.total_previsoes,
        prioridade:
          (100 - stats.soma_previsoes / stats.total_previsoes) *
          (stats.soma_confianca / stats.total_previsoes),
      })
    );

    return materiasAnalisadas
      .sort((a, b) => b.prioridade - a.prioridade)
      .slice(0, 3); // Top 3 matérias críticas
  }

  async generateAIStudyPlan(userId, objetivo, materiasCriticas, patterns) {
    if (!ollamaService.isConnected) {
      throw new Error('Ollama não disponível');
    }

    try {
      const contexto = `
Dados do estudante:
- Objetivo: ${objetivo}
- Matérias críticas: ${materiasCriticas.map((m) => `${m.materia} (${m.media_previsao.toFixed(1)}%)`).join(', ')}
- Total de simulados (30 dias): ${patterns.total_simulados}
- Frequência média: ${this.calculateStudyFrequency(patterns.simulados)}

Gere um plano de estudos personalizado para 30 dias.
Considere o objetivo e foque nas matérias críticas.
Inclua atividades diárias, metas semanais e métricas de sucesso.

Responda apenas com JSON válido:
{
  "objetivo": "Descrição clara do objetivo",
  "duracao_total": 30,
  "atividades_diarias": [
    {
      "dia": 1,
      "materia": "matematica",
      "atividade": "Revisar funções lineares",
      "tempo_estimado": 45,
      "objetivo": "Dominar conceitos básicos"
    }
  ],
  "metas_semanais": [
    {
      "semana": 1,
      "objetivo": "Estabelecer base sólida",
      "simulados_recomendados": 3,
      "materias_foco": ["matematica"]
    }
  ],
  "metricas_sucesso": [
    "Atingir 80% de acertos em matemática",
    "Completar pelo menos 15 simulados",
    "Melhorar consistência de estudo"
  ]
}`;

      const response = await ollamaService.chatWithBook('', contexto);

      try {
        const plano = JSON.parse(response);

        // Salvar plano no banco
        await this.savePersonalizedPlan(userId, plano);

        return plano;
      } catch (parseError) {
        console.warn('Erro ao parsear plano da IA:', parseError);
        return this.generateBasicStudyPlan(materiasCriticas, objetivo);
      }
    } catch (error) {
      console.error('Erro ao gerar plano com IA:', error);
      return this.generateBasicStudyPlan(materiasCriticas, objetivo);
    }
  }

  generateBasicStudyPlan(materiasCriticas, objetivo) {
    const plano = {
      objetivo,
      duracao_total: 30,
      atividades_diarias: [],
      metas_semanais: [],
      metricas_sucesso: [
        'Melhorar desempenho nas matérias identificadas',
        'Manter regularidade nos estudos',
        'Atingir metas de acertos propostas',
      ],
    };

    // Gerar atividades básicas para matérias críticas
    materiasCriticas.forEach((materia, index) => {
      for (let dia = 1; dia <= 30; dia += 7) {
        // Uma vez por semana
        plano.atividades_diarias.push({
          dia,
          materia: materia.materia,
          atividade: `Estudar ${materia.materia} - Foco em conceitos fundamentais`,
          tempo_estimado: 60,
          objetivo: `Melhorar média de ${materia.media_previsao.toFixed(1)}% para 80%+`,
        });
      }
    });

    // Metas semanais
    for (let semana = 1; semana <= 4; semana++) {
      plano.metas_semanais.push({
        semana,
        objetivo: `Semana ${semana}: Consolidar conhecimentos`,
        simulados_recomendados: 3,
        materias_foco: materiasCriticas.slice(0, 2).map((m) => m.materia),
      });
    }

    return plano;
  }

  async savePersonalizedPlan(userId, plano) {
    try {
      // Salvar recomendações baseadas no plano
      for (const atividade of plano.atividades_diarias.slice(0, 10)) {
        // Limitar primeiras 10
        await this.supabase.from('recomendacoes_personalizadas').insert({
          usuario_id: userId,
          tipo: 'estudo',
          materia: atividade.materia,
          titulo: atividade.atividade,
          descricao: atividade.objetivo,
          prioridade: 2,
          eficacia_prevista: 0.8,
        });
      }
    } catch (error) {
      console.error('Erro ao salvar plano personalizado:', error);
    }
  }

  // Dashboard de análise preditiva
  async getPredictiveDashboard(userId) {
    try {
      // Buscar previsões atuais
      const { data: previsoes, error: previsoesError } = await this.supabase
        .from('previsoes_desempenho')
        .select('*')
        .eq('usuario_id', userId)
        .gte('data_validade', new Date().toISOString())
        .order('data_previsao', { ascending: false });

      if (previsoesError) throw previsoesError;

      // Buscar recomendações pendentes
      const { data: recomendacoes, error: recomendacoesError } =
        await this.supabase
          .from('recomendacoes_personalizadas')
          .select('*')
          .eq('usuario_id', userId)
          .eq('aplicada', false)
          .order('prioridade', { ascending: false })
          .limit(5);

      if (recomendacoesError) throw recomendacoesError;

      // Análise de progresso
      const progresso = await this.calculateProgress(userId);

      return {
        previsoes: previsoes || [],
        recomendacoes: recomendacoes || [],
        progresso,
        insights: await this.generateInsights(userId, previsoes || []),
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erro ao gerar dashboard preditivo:', error);
      return {
        previsoes: [],
        recomendacoes: [],
        progresso: {},
        insights: [],
        erro: error.message,
      };
    }
  }

  async calculateProgress(userId) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: simulados, error } = await this.supabase
        .from('resultados_simulado')
        .select('materia, pontuacao, data_realizacao')
        .eq('usuario_id', userId)
        .gte('data_realizacao', thirtyDaysAgo.toISOString());

      if (error) throw error;

      const materias = {};
      simulados.forEach((simulado) => {
        if (!materias[simulado.materia]) {
          materias[simulado.materia] = {
            simulados: [],
            media: 0,
            tendencia: 0,
          };
        }
        materias[simulado.materia].simulados.push(simulado);
      });

      // Calcular métricas por matéria
      Object.keys(materias).forEach((materia) => {
        const stats = materias[materia];
        const pontuacoes = stats.simulados.map((s) => s.pontuacao || 0);

        if (pontuacoes.length > 0) {
          stats.media =
            pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length;

          // Calcular tendência (últimos 3 vs anteriores)
          if (pontuacoes.length >= 3) {
            const recentes = pontuacoes.slice(0, 3);
            const anteriores = pontuacoes.slice(3);
            const mediaRecentes =
              recentes.reduce((a, b) => a + b, 0) / recentes.length;
            const mediaAnteriores =
              anteriores.length > 0
                ? anteriores.reduce((a, b) => a + b, 0) / anteriores.length
                : mediaRecentes;

            stats.tendencia = mediaRecentes - mediaAnteriores;
          }
        }
      });

      return materias;
    } catch (error) {
      console.error('Erro ao calcular progresso:', error);
      return {};
    }
  }

  async generateInsights(userId, previsoes) {
    const insights = [];

    if (previsoes.length === 0) {
      insights.push({
        tipo: 'info',
        titulo: '📊 Análise Preditiva Disponível',
        descricao:
          'Complete alguns simulados para gerar previsões personalizadas de desempenho.',
        prioridade: 1,
      });
    }

    // Insights baseados nas previsões
    previsoes.forEach((previsao) => {
      if (previsao.previsao_acertos < 60) {
        insights.push({
          tipo: 'alerta',
          titulo: `📉 Atenção em ${previsao.materia}`,
          descricao: `Previsão de ${previsao.previsao_acertos}% em ${previsao.materia}. Considere focar nesta matéria.`,
          prioridade: 3,
          materia: previsao.materia,
        });
      }

      if (previsao.confianca > 0.8) {
        insights.push({
          tipo: 'confianca',
          titulo: `✅ Previsão Confiável para ${previsao.materia}`,
          descricao: `Alta confiança na previsão de ${previsao.previsao_acertos}% em ${previsao.materia}.`,
          prioridade: 2,
          materia: previsao.materia,
        });
      }
    });

    return insights.sort((a, b) => b.prioridade - a.prioridade);
  }

  // Identificação de gaps de conhecimento
  async identifyKnowledgeGaps(userId) {
    try {
      const { data: simulados, error } = await this.supabase
        .from('resultados_simulado')
        .select('*')
        .eq('usuario_id', userId)
        .order('data_realizacao', { ascending: false })
        .limit(20);

      if (error) throw error;

      const gaps = {};

      simulados.forEach((simulado) => {
        // Analisar questões específicas (se disponível)
        // Por agora, análise baseada em padrões gerais
        if (!gaps[simulado.materia]) {
          gaps[simulado.materia] = {
            total_simulados: 0,
            media_acertos: 0,
            questoes_erradas: 0,
            topicos_criticos: [],
          };
        }

        gaps[simulado.materia].total_simulados++;
        gaps[simulado.materia].media_acertos += simulado.pontuacao || 0;

        // Simular análise de questões (em implementação futura)
        if (simulado.pontuacao < 60) {
          gaps[simulado.materia].questoes_erradas += Math.floor(
            (100 - simulado.pontuacao) / 10
          );
        }
      });

      // Calcular médias finais
      Object.keys(gaps).forEach((materia) => {
        const gap = gaps[materia];
        gap.media_acertos = gap.media_acertos / gap.total_simulados;
      });

      return gaps;
    } catch (error) {
      console.error('Erro ao identificar gaps:', error);
      return {};
    }
  }

  // Sistema de alertas inteligentes
  async generateSmartAlerts(userId) {
    try {
      const patterns = await this.analyzeStudyPatterns(userId, 7); // Última semana
      const gaps = await this.identifyKnowledgeGaps(userId);

      const alerts = [];

      // Alerta de inatividade
      if (patterns.simulados.length === 0) {
        alerts.push({
          tipo: 'inatividade',
          titulo: '📚 Você não estudou esta semana',
          mensagem: 'Que tal fazer um simulado rápido para manter o ritmo?',
          prioridade: 3,
          acao_recomendada: 'fazer_simulado',
        });
      }

      // Alertas de matérias críticas
      Object.entries(gaps).forEach(([materia, gap]) => {
        if (gap.media_acertos < 50 && gap.total_simulados >= 3) {
          alerts.push({
            tipo: 'materia_critica',
            titulo: `📉 ${materia} precisa de atenção`,
            mensagem: `Sua média em ${materia} está em ${Math.round(gap.media_acertos)}%. Considere revisar conceitos básicos.`,
            prioridade: 4,
            acao_recomendada: 'revisar_materia',
            materia,
          });
        }
      });

      return alerts.sort((a, b) => b.prioridade - a.prioridade);
    } catch (error) {
      console.error('Erro ao gerar alertas inteligentes:', error);
      return [];
    }
  }

  getStats() {
    return {
      isInitialized: this.isInitialized,
      timestamp: new Date().toISOString(),
    };
  }
}

const predictiveAnalysisService = new PredictiveAnalysisService();
export default predictiveAnalysisService;
