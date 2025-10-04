// scripts/categorizarQuestoesEnem.mjs
// Script para categorizar automaticamente questões do ENEM

import 'dotenv/config';
import db from '../db/index.mjs';
import { categorizador } from '../services/categorizacaoEnem.mjs';

class CategorizadorAutomatico {
  constructor() {
    this.batchSize = 50; // Processar em lotes para evitar sobrecarga de memória
  }

  /**
   * Categorizar todas as questões do ENEM no banco de dados
   */
  async categorizarTodasQuestoes() {
    try {
      console.log(
        'Iniciando categorização automática de todas as questões do ENEM...'
      );

      // Obter todas as questões do ENEM
      const result = await db.query(
        "SELECT * FROM questoes WHERE origem LIKE '%ENEM%' OR origem_tipo = 'enem' ORDER BY id"
      );

      const questoes = result.rows;
      console.log(
        `Encontradas ${questoes.length} questões do ENEM para categorizar.`
      );

      if (questoes.length === 0) {
        console.log('Nenhuma questão do ENEM encontrada para categorizar.');
        return;
      }

      // Processar em lotes
      for (let i = 0; i < questoes.length; i += this.batchSize) {
        const batch = questoes.slice(i, i + this.batchSize);
        console.log(
          `Processando lote ${Math.floor(i / this.batchSize) + 1} de ${Math.ceil(questoes.length / this.batchSize)}...`
        );

        await this.processarLote(batch);

        // Pequena pausa entre lotes
        await this.aguardar(1000);
      }

      console.log('Categorização automática concluída com sucesso!');

      // Mostrar estatísticas finais
      await this.mostrarEstatisticas();
    } catch (error) {
      console.error('Erro na categorização automática:', error);
      throw error;
    }
  }

  /**
   * Processar um lote de questões
   * @param {Array} questoesBatch - Lote de questões
   */
  async processarLote(questoesBatch) {
    try {
      // Categorizar as questões do lote
      const questoesCategorizadas = questoesBatch.map((questao) => {
        try {
          // Converter alternativas de string para objeto se necessário
          if (typeof questao.alternativas === 'string') {
            questao.alternativas = JSON.parse(questao.alternativas);
          }

          const categorizacao = categorizador.categorizarQuestao(questao);
          return {
            ...questao,
            ...categorizacao,
          };
        } catch (error) {
          console.error(
            `Erro ao categorizar questão ${questao.id}:`,
            error.message
          );
          return questao;
        }
      });

      // Atualizar as questões no banco de dados
      for (const questao of questoesCategorizadas) {
        try {
          await db.query(
            `
            UPDATE questoes 
            SET materia = COALESCE($1, materia),
                competencia = COALESCE($2, competencia),
                habilidade = COALESCE($3, habilidade),
                nivel_dificuldade = COALESCE($4, nivel_dificuldade),
                tipo = COALESCE($5, tipo),
                area_conhecimento = COALESCE($6, area_conhecimento)
            WHERE id = $7
          `,
            [
              questao.materia || null,
              questao.competencia || null,
              questao.habilidade || null,
              questao.nivel_dificuldade || null,
              questao.tipo || null,
              questao.area_conhecimento || null,
              questao.id,
            ]
          );
        } catch (error) {
          console.error(
            `Erro ao atualizar questão ${questao.id}:`,
            error.message
          );
          // Continuar com as próximas questões
        }
      }

      console.log(
        `Lote processado: ${questoesBatch.length} questões categorizadas e atualizadas.`
      );

    } catch (error) {
      console.error('Erro ao processar lote:', error);
      throw error;
    }
  }

  /**
   * Mostrar estatísticas das questões categorizadas
   */
  async mostrarEstatisticas() {
    try {
      console.log('\n=== ESTATÍSTICAS DAS QUESTÕES CATEGORIZADAS ===');

      // Total de questões categorizadas
      const totalResult = await db.query(
        "SELECT COUNT(*) as total FROM questoes WHERE materia IS NOT NULL AND origem LIKE '%ENEM%'"
      );
      console.log(
        `Total de questões categorizadas: ${totalResult.rows[0].total}`
      );

      // Distribuição por matéria
      const materiasResult = await db.query(`
        SELECT materia, COUNT(*) as quantidade 
        FROM questoes 
        WHERE materia IS NOT NULL AND origem LIKE '%ENEM%' 
        GROUP BY materia 
        ORDER BY quantidade DESC
      `);

      console.log('\nDistribuição por matéria:');
      materiasResult.rows.forEach((row) => {
        console.log(`  ${row.materia}: ${row.quantidade} questões`);
      });

      // Distribuição por área de conhecimento
      const areasResult = await db.query(`
        SELECT area_conhecimento, COUNT(*) as quantidade 
        FROM questoes 
        WHERE area_conhecimento IS NOT NULL AND origem LIKE '%ENEM%' 
        GROUP BY area_conhecimento 
        ORDER BY quantidade DESC
      `);

      console.log('\nDistribuição por área de conhecimento:');
      areasResult.rows.forEach((row) => {
        console.log(`  ${row.area_conhecimento}: ${row.quantidade} questões`);
      });

      // Distribuição por nível de dificuldade
      const niveisResult = await db.query(`
        SELECT nivel_dificuldade, COUNT(*) as quantidade 
        FROM questoes 
        WHERE nivel_dificuldade IS NOT NULL AND origem LIKE '%ENEM%' 
        GROUP BY nivel_dificuldade 
        ORDER BY nivel_dificuldade
      `);

      console.log('\nDistribuição por nível de dificuldade:');
      niveisResult.rows.forEach((row) => {
        const nivelDescricao = this.obterDescricaoNivel(row.nivel_dificuldade);
        console.log(
          `  Nível ${row.nivel_dificuldade} (${nivelDescricao}): ${row.quantidade} questões`
        );
      });

      // Distribuição por tipo
      const tiposResult = await db.query(`
        SELECT tipo, COUNT(*) as quantidade 
        FROM questoes 
        WHERE tipo IS NOT NULL AND origem LIKE '%ENEM%' 
        GROUP BY tipo 
        ORDER BY quantidade DESC
      `);

      console.log('\nDistribuição por tipo de questão:');
      tiposResult.rows.forEach((row) => {
        console.log(`  ${row.tipo}: ${row.quantidade} questões`);
      });

    } catch (error) {
      console.error('Erro ao gerar estatísticas:', error);
    }
  }

  /**
   * Obter descrição do nível de dificuldade
   * @param {number} nivel - Nível de dificuldade
   * @returns {string} - Descrição do nível
   */
  obterDescricaoNivel(nivel) {
    const descricoes = {
      1: 'Recordar e reconhecer informações',
      2: 'Compreender e interpretar informações',
      3: 'Aplicar conhecimentos em situações novas',
      4: 'Analisar elementos e relações',
      5: 'Avaliar e julgar informações',
      6: 'Criar e produzir novas soluções',
    };

    return descricoes[nivel] || 'Não classificado';
  }

  /**
   * Aguardar por um determinado tempo
   * @param {number} ms - Milissegundos
   * @returns {Promise} - Promise que resolve após o tempo
   */
  aguardar(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Categorizar questões específicas por ID
   * @param {Array} ids - IDs das questões
   */
  async categorizarQuestoesPorIds(ids) {
    try {
      if (!ids || ids.length === 0) {
        throw new Error('Lista de IDs vazia');
      }

      console.log(
        `Iniciando categorização de ${ids.length} questões específicas...`
      );

      // Obter as questões específicas
      const placeholders = ids.map((_, index) => `${index + 1}`).join(', ');
      const result = await db.query(
        `SELECT * FROM questoes WHERE id IN (${placeholders})`,
        ids
      );

      const questoes = result.rows;
      console.log(`Encontradas ${questoes.length} questões para categorizar.`);

      if (questoes.length === 0) {
        console.log('Nenhuma questão encontrada para os IDs fornecidos.');
        return;
      }

      // Processar em lotes menores para questões específicas
      const batchSize = Math.min(10, this.batchSize);

      for (let i = 0; i < questoes.length; i += batchSize) {
        const batch = questoes.slice(i, i + batchSize);
        console.log(
          `Processando lote ${Math.floor(i / batchSize) + 1} de ${Math.ceil(questoes.length / batchSize)}...`
        );

        await this.processarLote(batch);
      }

      console.log('Categorização das questões específicas concluída!');
    } catch (error) {
      console.error('Erro ao categorizar questões específicas:', error);
      throw error;
    }
  }
}

// Se este script for executado diretamente
if (require.main === module) {
  const categorizadorAuto = new CategorizadorAutomatico();

  // Processar argumentos da linha de comando
  const args = process.argv.slice(2);

  async function executar() {
    try {
      if (args.length === 0) {
        // Categorizar todas as questões
        await categorizadorAuto.categorizarTodasQuestoes();
      } else if (args[0] === '--ids' && args.length > 1) {
        // Categorizar questões específicas
        const ids = args
          .slice(1)
          .map((id) => parseInt(id))
          .filter((id) => !isNaN(id));
        if (ids.length > 0) {
          await categorizadorAuto.categorizarQuestoesPorIds(ids);
        } else {
          console.error('IDs inválidos fornecidos.');
          process.exit(1);
        }
      } else {
        console.log('Uso:');
        console.log(
          '  node categorizarQuestoesEnem.js              # Categorizar todas as questões do ENEM'
        );
        console.log(
          '  node categorizarQuestoesEnem.js --ids 1 2 3   # Categorizar questões específicas'
        );
        process.exit(1);
      }

      console.log('Processo concluído com sucesso!');
      process.exit(0);
    } catch (error) {
      console.error('Erro durante a execução:', error);
      process.exit(1);
    }
  }

  executar();
}

module.exports = CategorizadorAutomatico;
