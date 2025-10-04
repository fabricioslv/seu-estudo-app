// scripts/importarQuestoesEnem.js
// Script para importar questões da API do ENEM para o banco de dados

require('dotenv').config({ path: './.env' });
const db = require('../db');
const enemApiService = require('../services/enemApiService');

class ImportadorQuestoesEnem {
  constructor() {
    this.anoInicial = 2010; // Primeiro ano do ENEM novo formato
    this.anoFinal = new Date().getFullYear(); // Ano atual
  }

  /**
   * Importar todas as questões de um ano específico
   * @param {number} ano - Ano para importar questões
   * @param {string} materia - Matéria específica (opcional)
   */
  async importarQuestoesAno(ano, materia = null) {
    try {
      console.log(
        `Iniciando importação de questões do ENEM ${ano}${materia ? ` - Matéria: ${materia}` : ''}...`
      );

      // Obter questões da API
      const questoes = await enemApiService.getQuestoesPorAnoEMateria(
        ano,
        materia
      );

      if (!questoes || questoes.length === 0) {
        console.log(
          `Nenhuma questão encontrada para ENEM ${ano}${materia ? ` - ${materia}` : ''}`
        );
        return;
      }

      console.log(`Encontradas ${questoes.length} questões para importar...`);

      // Importar cada questão para o banco de dados
      let importadas = 0;
      let jaExistentes = 0;

      for (const questao of questoes) {
        try {
          // Verificar se a questão já existe no banco
          const existing = await db.query(
            'SELECT id FROM questoes WHERE numero = $1 AND ano_vestibular = $2 AND origem = $3',
            [questao.numero, questao.ano_vestibular, questao.origem]
          );

          if (existing.rows.length > 0) {
            jaExistentes++;
            continue;
          }

          // Inserir questão no banco de dados
          await db.query(
            `
            INSERT INTO questoes (
              numero, enunciado, alternativas, resposta_correta, 
              explicacao, materia, ano_vestibular, origem,
              nivel_dificuldade, competencia, habilidade, caderno, cor
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `,
            [
              questao.numero,
              questao.enunciado,
              JSON.stringify(questao.alternativas),
              questao.resposta_correta,
              questao.explicacao,
              questao.materia,
              questao.ano_vestibular,
              questao.origem,
              questao.nivel_dificuldade,
              questao.competencia,
              questao.habilidade,
              questao.caderno,
              questao.cor,
            ]
          );

          importadas++;
        } catch (err) {
          console.error(
            `Erro ao importar questão ${questao.numero} do ano ${ano}:`,
            err.message
          );
          // Continuar com as próximas questões
        }
      }

      console.log(
        `Importação concluída para ENEM ${ano}: ${importadas} novas, ${jaExistentes} já existentes`
      );

    } catch (error) {
      console.error(`Erro ao importar questões do ENEM ${ano}:`, error);
    }
  }

  /**
   * Importar todas as questões de todos os anos disponíveis
   * @param {string} materia - Matéria específica (opcional)
   */
  async importarTodasQuestoes(materia = null) {
    console.log('Iniciando importação de todas as questões do ENEM...');

    for (let ano = this.anoFinal; ano >= this.anoInicial; ano--) {
      await this.importarQuestoesAno(ano, materia);

      // Pausa para evitar sobrecarga na API
      await this.esperar(1000);
    }

    console.log('Importação de todas as questões concluída!');
  }

  /**
   * Importar questões de um ano específico para todas as matérias
   * @param {number} ano - Ano para importar
   */
  async importarQuestoesAnoCompleto(ano) {
    try {
      console.log(`Importando todas as questões do ENEM ${ano}...`);

      // Obter todas as questões de um ano
      const questoes = await enemApiService.getTodasQuestoesAno(ano);

      if (!questoes || questoes.length === 0) {
        console.log(`Nenhuma questão encontrada para ENEM ${ano}`);
        return;
      }

      console.log(`Encontradas ${questoes.length} questões para importar...`);

      // Importar cada questão para o banco de dados
      let importadas = 0;
      let jaExistentes = 0;

      for (const questao of questoes) {
        try {
          // Verificar se a questão já existe no banco
          const existing = await db.query(
            'SELECT id FROM questoes WHERE numero = $1 AND ano_vestibular = $2 AND origem = $3',
            [questao.numero, questao.ano_vestibular, questao.origem]
          );

          if (existing.rows.length > 0) {
            jaExistentes++;
            continue;
          }

          // Inserir questão no banco de dados
          await db.query(
            `
            INSERT INTO questoes (
              numero, enunciado, alternativas, resposta_correta, 
              explicacao, materia, ano_vestibular, origem,
              nivel_dificuldade, competencia, habilidade, caderno, cor
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
          `,
            [
              questao.numero,
              questao.enunciado,
              JSON.stringify(questao.alternativas),
              questao.resposta_correta,
              questao.explicacao,
              questao.materia,
              questao.ano_vestibular,
              questao.origem,
              questao.nivel_dificuldade,
              questao.competencia,
              questao.habilidade,
              questao.caderno,
              questao.cor,
            ]
          );

          importadas++;
        } catch (err) {
          console.error(
            `Erro ao importar questão ${questao.numero} do ano ${ano}:`,
            err.message
          );
          // Continuar com as próximas questões
        }
      }

      console.log(
        `Importação completa para ENEM ${ano}: ${importadas} novas, ${jaExistentes} já existentes`
      );

    } catch (error) {
      console.error(
        `Erro ao importar todas as questões do ENEM ${ano}:`,
        error
      );
    }
  }

  /**
   * Esperar por um determinado tempo (em milissegundos)
   * @param {number} ms - Milissegundos para esperar
   */
  async esperar(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Importar questões de anos específicos
   * @param {Array<number>} anos - Lista de anos para importar
   */
  async importarAnosEspecificos(anos) {
    for (const ano of anos) {
      await this.importarQuestoesAnoCompleto(ano);

      // Pausa para evitar sobrecarga na API
      await this.esperar(1000);
    }
  }
}

// Se este script for executado diretamente
if (require.main === module) {
  const importador = new ImportadorQuestoesEnem();

  // Processar argumentos da linha de comando
  const args = process.argv.slice(2);

  async function executarImportacao() {
    try {
      if (args.length === 0) {
        // Importar todos os anos
        await importador.importarTodasQuestoes();
      } else if (args.length === 1) {
        const arg = args[0];

        if (arg === 'ultimo') {
          // Importar o último ano
          const anoAtual = new Date().getFullYear();
          await importador.importarQuestoesAnoCompleto(anoAtual);
        } else if (arg === 'ultimo5') {
          // Importar os últimos 5 anos
          const anoAtual = new Date().getFullYear();
          const anos = Array.from({ length: 5 }, (_, i) => anoAtual - i);
          await importador.importarAnosEspecificos(anos);
        } else {
          // Assumir que é um ano específico
          const ano = parseInt(arg);
          if (!isNaN(ano)) {
            await importador.importarQuestoesAnoCompleto(ano);
          } else {
            console.error(
              'Argumento inválido. Use: node importarQuestoesEnem.js [ano|ultimo|ultimo5]'
            );
          }
        }
      } else if (args.length === 2) {
        // Importar de um ano a outro ano
        const anoInicio = parseInt(args[0]);
        const anoFim = parseInt(args[1]);

        if (!isNaN(anoInicio) && !isNaN(anoFim) && anoInicio <= anoFim) {
          const anos = Array.from(
            { length: anoFim - anoInicio + 1 },
            (_, i) => anoInicio + i
          );
          await importador.importarAnosEspecificos(anos);
        } else {
          console.error(
            'Argumentos inválidos. Use: node importarQuestoesEnem.js ano_inicio ano_fim'
          );
        }
      }
    } catch (error) {
      console.error('Erro durante a importação:', error);
    }
  }

  executarImportacao();
}

module.exports = ImportadorQuestoesEnem;
