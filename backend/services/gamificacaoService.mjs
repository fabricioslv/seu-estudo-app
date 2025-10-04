// services/gamificacaoService.js - ServiÃƒÂ§o para lÃƒÂ³gica de gamificaÃƒÂ§ÃƒÂ£o
const db = require('../db');

class GamificacaoService {
  /**
   * Adiciona pontos ao usuÃƒÂ¡rio e atualiza seu nÃƒÂ­vel
   * @param {number} usuarioId - ID do usuÃƒÂ¡rio
   * @param {number} pontos - Quantidade de pontos a adicionar
   * @param {string} tipo - Tipo de ponto ('geral', 'estudo', 'simulado', etc.)
   */
  async adicionarPontos(usuarioId, pontos, tipo = 'geral') {
    if (!pontos || pontos <= 0) {
      throw new Error('Quantidade de pontos invÃƒÂ¡lida.');
    }

    try {
      // Verificar se jÃƒÂ¡ existe um registro para esse usuÃƒÂ¡rio e tipo de ponto
      const checkQuery = `
        SELECT pontos, nivel, experiencia FROM pontos_usuario 
        WHERE usuario_id = $1 AND tipo_ponto = $2
      `;

      const checkResult = await db.query(checkQuery, [usuarioId, tipo]);

      let novoTotal, novoNivel, novaExperiencia;

      if (checkResult.rows.length > 0) {
        // Atualizar os pontos existentes
        const currentPontos = checkResult.rows[0].pontos;
        novoTotal = currentPontos + pontos;

        // Calcular nÃƒÂ­vel (a cada 100 pontos de experiÃƒÂªncia, sobe 1 nÃƒÂ­vel)
        novoNivel = Math.floor(novoTotal / 100) + 1;
        novaExperiencia = novoTotal % 100;

        // Atualizar os dados
        const updateQuery = `
          UPDATE pontos_usuario 
          SET pontos = $1, nivel = $2, experiencia = $3, ultima_atualizacao = CURRENT_TIMESTAMP
          WHERE usuario_id = $4 AND tipo_ponto = $5
        `;

        await db.query(updateQuery, [
          novoTotal,
          novoNivel,
          novaExperiencia,
          usuarioId,
          tipo,
        ]);
      } else {
        // Criar novo registro
        novoTotal = pontos;
        novoNivel = Math.floor(pontos / 100) + 1;
        novaExperiencia = pontos % 100;

        const insertQuery = `
          INSERT INTO pontos_usuario (usuario_id, tipo_ponto, pontos, nivel, experiencia)
          VALUES ($1, $2, $3, $4, $5)
        `;

        await db.query(insertQuery, [
          usuarioId,
          tipo,
          novoTotal,
          novoNivel,
          novaExperiencia,
        ]);
      }

      // Verificar conquistas liberadas
      const conquistasLiberadas = await this.verificarConquistas(
        usuarioId,
        novoTotal
      );

      return {
        pontosAdicionados: pontos,
        totalPontos: novoTotal,
        nivel: novoNivel,
        experiencia: novaExperiencia,
        conquistasLiberadas,
      };
    } catch (error) {
      console.error('Erro ao adicionar pontos:', error);
      throw error;
    }
  }

  /**
   * Verifica se o usuÃƒÂ¡rio obteve novas conquistas com base nos pontos atuais
   * @param {number} usuarioId - ID do usuÃƒÂ¡rio
   * @param {number} pontosAtuais - Total de pontos atuais do usuÃƒÂ¡rio
   */
  async verificarConquistas(usuarioId, pontosAtuais) {
    try {
      // Buscar conquistas que requerem menos ou igual ao nÃƒÂºmero de pontos do usuÃƒÂ¡rio
      const conquistasQuery = `
        SELECT c.id, c.nome, c.descricao, c.icone
        FROM conquistas c
        LEFT JOIN conquistas_usuario cu ON c.id = cu.conquista_id AND cu.usuario_id = $1
        WHERE c.pontos_requeridos <= $2 AND cu.id IS NULL
      `;

      const conquistasResult = await db.query(conquistasQuery, [
        usuarioId,
        pontosAtuais,
      ]);

      if (conquistasResult.rows.length > 0) {
        // Registrar as conquistas obtidas
        for (const conquista of conquistasResult.rows) {
          const insertConquistaQuery = `
            INSERT INTO conquistas_usuario (usuario_id, conquista_id)
            VALUES ($1, $2)
            ON CONFLICT (usuario_id, conquista_id) DO NOTHING
          `;
          await db.query(insertConquistaQuery, [usuarioId, conquista.id]);
        }
      }

      return conquistasResult.rows;
    } catch (error) {
      console.error('Erro ao verificar conquistas:', error);
      throw error;
    }
  }

  /**
   * Atualiza o ranking dos usuÃƒÂ¡rios
   * @param {string} periodo - PerÃƒÂ­odo do ranking ('geral', 'mensal', 'semanal')
   */
  async atualizarRanking(periodo = 'geral') {
    try {
      // Primeiro, limpar o ranking existente para o perÃƒÂ­odo
      await db.query('DELETE FROM ranking WHERE periodo = $1', [periodo]);

      // Calcular o ranking com base nos pontos gerais
      const rankingQuery = `
        SELECT 
          usuario_id,
          pontos,
          RANK() OVER (ORDER BY pontos DESC) as posicao
        FROM pontos_usuario
        WHERE tipo_ponto = 'geral'
      `;

      const rankingResult = await db.query(rankingQuery);

      // Inserir os resultados no ranking
      for (const record of rankingResult.rows) {
        const insertRankingQuery = `
          INSERT INTO ranking (usuario_id, posicao, pontos_totais, periodo)
          VALUES ($1, $2, $3, $4)
        `;
        await db.query(insertRankingQuery, [
          record.usuario_id,
          record.posicao,
          record.pontos,
          periodo,
        ]);
      }

      return {
        totalUsuarios: rankingResult.rows.length,
        periodo,
      };
    } catch (error) {
      console.error('Erro ao atualizar ranking:', error);
      throw error;
    }
  }

  /**
   * Registra uma atividade do usuÃƒÂ¡rio que pode gerar pontos de gamificaÃƒÂ§ÃƒÂ£o
   * @param {number} usuarioId - ID do usuÃƒÂ¡rio
   * @param {string} tipoAtividade - Tipo de atividade ('resolucao_questao', 'finalizacao_simulado', etc.)
   * @param {number} pontosBase - Pontos base da atividade
   */
  async registrarAtividade(usuarioId, tipoAtividade, pontosBase = 1) {
    try {
      let pontosAdicionados = pontosBase;

      // Ajustar pontos baseado no tipo de atividade
      switch (tipoAtividade) {
        case 'resolucao_questao':
          pontosAdicionados = 1;
          break;
        case 'acerto_questao':
          pontosAdicionados = 2;
          break;
        case 'finalizacao_simulado':
          pontosAdicionados = 5;
          break;
        case 'acerto_total_simulado':
          pontosAdicionados = 10;
          break;
        case 'tempo_baixo_questao':
          pontosAdicionados = 3;
          break;
        default:
          pontosAdicionados = 1;
      }

      // Adicionar os pontos ao usuÃƒÂ¡rio
      const result = await this.adicionarPontos(usuarioId, pontosAdicionados);

      // Atualizar o ranking periodicamente
      if (Math.random() < 0.1) {
        // Apenas atualizar ranking em 10% das vezes para eficiÃƒÂªncia
        await this.atualizarRanking('geral');
      }

      return {
        ...result,
        tipoAtividade,
        pontosGanhos: pontosAdicionados,
      };
    } catch (error) {
      console.error('Erro ao registrar atividade:', error);
      throw error;
    }
  }

  /**
   * ObtÃƒÂ©m estatÃƒÂ­sticas de gamificaÃƒÂ§ÃƒÂ£o para um usuÃƒÂ¡rio
   * @param {number} usuarioId - ID do usuÃƒÂ¡rio
   */
  async getEstatisticasUsuario(usuarioId) {
    try {
      // Obter pontos do usuÃƒÂ¡rio
      const pontosQuery = `
        SELECT tipo_ponto, pontos, nivel, experiencia, ultima_atualizacao
        FROM pontos_usuario
        WHERE usuario_id = $1
      `;
      const pontosResult = await db.query(pontosQuery, [usuarioId]);

      // Obter conquistas do usuÃƒÂ¡rio
      const conquistasQuery = `
        SELECT c.nome, c.descricao, c.icone, cu.data_obtencao
        FROM conquistas_usuario cu
        JOIN conquistas c ON cu.conquista_id = c.id
        WHERE cu.usuario_id = $1
        ORDER BY cu.data_obtencao DESC
      `;
      const conquistasResult = await db.query(conquistasQuery, [usuarioId]);

      // Obter posiÃƒÂ§ÃƒÂ£o no ranking
      const rankingQuery = `
        SELECT posicao, pontos_totais
        FROM ranking
        WHERE usuario_id = $1 AND periodo = 'geral'
        LIMIT 1
      `;
      const rankingResult = await db.query(rankingQuery, [usuarioId]);

      return {
        pontos: pontosResult.rows,
        conquistas: conquistasResult.rows,
        ranking: rankingResult.rows[0] || null,
        totalConquistas: conquistasResult.rows.length,
      };
    } catch (error) {
      console.error('Erro ao obter estatÃƒÂ­sticas do usuÃƒÂ¡rio:', error);
      throw error;
    }
  }
}

module.exports = new GamificacaoService();
