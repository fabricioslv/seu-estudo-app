// services/questoesResolucaoService.js - Serviço para resolução de questões com integração de gamificação
const db = require('../db');
const gamificacaoService = require('./gamificacaoService');

class QuestoesResolucaoService {
  /**
   * Registra a resposta de um usuário a uma questão
   * @param {number} usuarioId - ID do usuário
   * @param {number} questaoId - ID da questão
   * @param {string} resposta - Resposta do usuário (A, B, C, D, E)
   * @param {boolean} isCorreta - Se a resposta está correta
   * @param {number} tempoResposta - Tempo em segundos que levou para responder
   */
  async registrarResposta(
    usuarioId,
    questaoId,
    resposta,
    isCorreta,
    tempoResposta = 0
  ) {
    try {
      // Primeiro, obter a questão para verificar se é válida
      const questaoQuery = 'SELECT * FROM questoes WHERE id = $1';
      const questaoResult = await db.query(questaoQuery, [questaoId]);

      if (questaoResult.rows.length === 0) {
        throw new Error('Questão não encontrada');
      }

      const questao = questaoResult.rows[0];

      // Inserir o registro da resposta
      const respostaQuery = `
        INSERT INTO respostas_usuario (usuario_id, questao_id, resposta_usuario, esta_correta, tempo_resposta, data_resposta)
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
        RETURNING id
      `;

      const respostaResult = await db.query(respostaQuery, [
        usuarioId,
        questaoId,
        resposta,
        isCorreta,
        tempoResposta
      );

      // Atualizar estatísticas do usuário
      const atividade = isCorreta ? 'acerto_questao' : 'resolucao_questao';
      const pontosBase = isCorreta ? 2 : 1;

      // Registrar atividade no sistema de gamificação
      const gamificacaoResult = await gamificacaoService.registrarAtividade(
        usuarioId,
        atividade,
        pontosBase
      );

      // Dar bônus por tempo rápido
      if (tempoResposta < 30) {
        // Resposta em menos de 30 segundos
        const bonusRapidez = await gamificacaoService.registrarAtividade(
          usuarioId,
          'tempo_baixo_questao',
          3
        );
        gamificacaoResult.bonusRapidez = bonusRapidez;
      }

      return {
        success: true,
        respostaId: respostaResult.rows[0].id,
        isCorreta,
        pontosGanhos: gamificacaoResult.pontosGanhos,
        gamificacao: gamificacaoResult,
        msg: isCorreta ? 'Resposta correta! Parabéns!' : 'Resposta registrada.',
      };
    } catch (error) {
      console.error('Erro ao registrar resposta:', error);
      throw error;
    }
  }

  /**
   * Registra a resolução de várias questões (por exemplo, em um simulado)
   * @param {number} usuarioId - ID do usuário
   * @param {Array} respostas - Array de objetos {questaoId, resposta, esta_correta, tempoResposta}
   * @param {string} tipoAtividade - Tipo da atividade ('simulado', 'lista', 'pratica')
   */
  async registrarMultiplasRespostas(
    usuarioId,
    respostas,
    tipoAtividade = 'pratica'
  ) {
    try {
      let totalPontos = 0;
      let acertos = 0;
      let erros = 0;
      const resultados = [];

      // Processar cada resposta individualmente
      for (const respostaData of respostas) {
        const {
          questaoId,
          resposta,
          esta_correta,
          tempoResposta = 0,
        } = respostaData;

        const resultado = await this.registrarResposta(
          usuarioId,
          questaoId,
          resposta,
          esta_correta,
          tempoResposta
        );
        resultados.push(resultado);

        if (esta_correta) acertos++;
        else erros++;

        totalPontos += resultado.pontosGanhos || 0;
      }

      // Dar bônus se todas as respostas estiverem corretas
      if (
        tipoAtividade === 'simulado' &&
        acertos === respostas.length &&
        respostas.length > 0
      ) {
        const bonusSimulado = await gamificacaoService.registrarAtividade(
          usuarioId,
          'acerto_total_simulado',
          10
        );
        totalPontos += bonusSimulado.pontosGanhos;
      }

      // Registrar a atividade de finalização como um bloco
      if (tipoAtividade === 'simulado' && respostas.length > 0) {
        await gamificacaoService.registrarAtividade(
          usuarioId,
          'finalizacao_simulado',
          5
        );
      }

      return {
        success: true,
        totalPontos,
        acertos,
        erros,
        totalRespostas: respostas.length,
        resultados,
        msg: `Resolução de ${tipoAtividade} registrada com sucesso`,
      };
    } catch (error) {
      console.error('Erro ao registrar múltiplas respostas:', error);
      throw error;
    }
  }

  /**
   * Obtém histórico de resoluções de um usuário
   * @param {number} usuarioId - ID do usuário
   * @param {number} limit - Limite de registros
   * @param {number} offset - Deslocamento
   */
  async getHistoricoResolucoes(usuarioId, limit = 50, offset = 0) {
    try {
      const query = `
        SELECT 
          ru.id,
          ru.questao_id,
          q.enunciado,
          q.materia,
          ru.resposta_usuario,
          ru.esta_correta,
          ru.tempo_resposta,
          ru.data_resposta,
          q.resposta_correta
        FROM respostas_usuario ru
        JOIN questoes q ON ru.questao_id = q.id
        WHERE ru.usuario_id = $1
        ORDER BY ru.data_resposta DESC
        LIMIT $2 OFFSET $3
      `;

      const result = await db.query(query, [usuarioId, limit, offset]);

      return {
        success: true,
        respostas: result.rows,
        total: result.rows.length,
      };
    } catch (error) {
      console.error('Erro ao obter histórico de resoluções:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de resoluções de um usuário
   * @param {number} usuarioId - ID do usuário
   */
  async getEstatisticasResolucoes(usuarioId) {
    try {
      const estatisticasQuery = `
        SELECT 
          COUNT(*) as total_respostas,
          SUM(CASE WHEN esta_correta = true THEN 1 ELSE 0 END) as acertos,
          SUM(CASE WHEN esta_correta = false THEN 1 ELSE 0 END) as erros,
          AVG(tempo_resposta) as tempo_medio_resposta,
          COUNT(DISTINCT questao_id) as questoes_unicas_respondidas
        FROM respostas_usuario
        WHERE usuario_id = $1
      `;

      const materiasQuery = `
        SELECT 
          q.materia,
          COUNT(*) as total_respostas,
          SUM(CASE WHEN ru.esta_correta = true THEN 1 ELSE 0 END) as acertos,
          SUM(CASE WHEN ru.esta_correta = false THEN 1 ELSE 0 END) as erros,
          ROUND(
            (SUM(CASE WHEN ru.esta_correta = true THEN 1 ELSE 0 END)::decimal / COUNT(*)) * 100, 
            2
          ) as porcentagem_acerto
        FROM respostas_usuario ru
        JOIN questoes q ON ru.questao_id = q.id
        WHERE ru.usuario_id = $1
        GROUP BY q.materia
        ORDER BY porcentagem_acerto DESC
      `;

      const estatisticasResult = await db.query(estatisticasQuery, [usuarioId]);
      const materiasResult = await db.query(materiasQuery, [usuarioId]);

      const estatisticas = estatisticasResult.rows[0];

      // Calcular porcentagem de acerto geral
      const porcentagemGeral =
        estatisticas.total_respostas > 0
          ? parseFloat(
              (
                (estatisticas.acertos / estatisticas.total_respostas) *
                100
              ).toFixed(2)
            )

      return {
        success: true,
        geral: {
          totalRespostas: parseInt(estatisticas.total_respostas),
          acertos: parseInt(estatisticas.acertos),
          erros: parseInt(estatisticas.erros),
          porcentagemAcerto: porcentagemGeral,
          tempoMedioResposta: estatisticas.tempo_medio_resposta,
          questoesUnicasRespondidas: parseInt(
            estatisticas.questoes_unicas_respondidas
          ),
        },
        porMateria: materiasResult.rows,
      };
    } catch (error) {
      console.error('Erro ao obter estatísticas de resoluções:', error);
      throw error;
    }
  }
}

module.exports = new QuestoesResolucaoService();


