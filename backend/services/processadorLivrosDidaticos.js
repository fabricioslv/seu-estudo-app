// services/processadorLivrosDidaticos.js
// Serviço para processar livros didáticos e integrar todo o conteúdo ao sistema

const fs = require('fs');
const path = require('path');
const db = require('../db');
const livroDidaticoExtractor = require('./extractors/livroDidaticoExtractor');
const categorizadorEnem = require('./categorizacaoEnem');

class ProcessadorLivrosDidaticos {
  constructor() {
    this.livrosDir = path.join(__dirname, '../../Livros didáticos');
    this.processadosDir = path.join(__dirname, '../../Livros processados');
    this.logFile = path.join(__dirname, '../../logs/processamento_livros.log');

    // Garantir que os diretórios existam
    this.criarDiretoriosNecessarios();
  }

  /**
   * Criar diretórios necessários para o processamento
   */
  criarDiretoriosNecessarios() {
    const dirs = [this.processadosDir, path.dirname(this.logFile)];

    dirs.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Processar todos os livros didáticos no diretório
   * @param {boolean} categorizarAutomaticamente - Se deve categorizar automaticamente
   * @returns {Promise<Object>} - Resultado do processamento
   */
  async processarTodosLivros(categorizarAutomaticamente = true) {
    try {
      console.log('Iniciando processamento de todos os livros didáticos...');
      this.logProcessamento(
        '=== INICIANDO PROCESSAMENTO DE TODOS OS LIVROS DIDÁTICOS ==='

      if (!fs.existsSync(this.livrosDir)) {
        throw new Error(
          `Diretório de livros não encontrado: ${this.livrosDir}`
        );
      }

      const arquivos = fs.readdirSync(this.livrosDir);
      const pdfFiles = arquivos.filter(
        (file) =>
          path.extname(file).toLowerCase() === '.pdf' &&
          !file.toLowerCase().includes('gabarito') &&
          !file.toLowerCase().includes('solucionario')
      );

      console.log(
        `Encontrados ${pdfFiles.length} livros didáticos para processar`
      );
      this.logProcessamento(
        `Encontrados ${pdfFiles.length} livros didáticos para processar`
      );

      const resultados = {
        total: pdfFiles.length,
        processados: 0,
        erros: 0,
        conteudoExtraido: 0,
        questoesGeradas: 0,
        detalhes: [],
      };

      // Processar cada livro
      for (const [index, fileName] of pdfFiles.entries()) {
        console.log(
          `\n[${index + 1}/${pdfFiles.length}] Processando: ${fileName}`
        );
        this.logProcessamento(`Processando: ${fileName}`);

        try {
          const resultado = await this.processarLivroIndividual(
            fileName,
            categorizarAutomaticamente

          resultados.processados++;
          resultados.conteudoExtraido += resultado.conteudoExtraido || 0;
          resultados.questoesGeradas += resultado.questoesGeradas || 0;

          resultados.detalhes.push({
            filename: fileName,
            success: true,
            ...resultado,
          });

          console.log(`✓ Processamento concluído: ${fileName}`);
          this.logProcessamento(`✓ Processamento concluído: ${fileName}`);

        } catch (error) {
          resultados.erros++;

          resultados.detalhes.push({
            filename: fileName,
            success: false,
            error: error.message,
          });

          console.error(`✗ Erro ao processar ${fileName}:`, error.message);
          this.logProcessamento(
            `✗ Erro ao processar ${fileName}: ${error.message}`
          );
        }
      }

      // Gerar relatório final
      const relatorio = this.gerarRelatorioFinal(resultados);

      console.log('\n=== PROCESSAMENTO CONCLUÍDO ===');
      console.log(relatorio.resumo);
      this.logProcessamento(relatorio.resumo);

      return {
        success: true,
        ...resultados,
        relatorio: relatorio,
      };

    } catch (error) {
      console.error('Erro fatal no processamento de livros:', error);
      this.logProcessamento(`ERRO FATAL: ${error.message}`);

      throw error;
    }
  }

  /**
   * Processar um livro individualmente
   * @param {string} fileName - Nome do arquivo
   * @param {boolean} categorizarAutomaticamente - Se deve categorizar automaticamente
   * @returns {Promise<Object>} - Resultado do processamento
   */
  async processarLivroIndividual(fileName, categorizarAutomaticamente = true) {
    const filePath = path.join(this.livrosDir, fileName);

    try {
      // Extrair metadados do nome do arquivo
      const metadata = this.extrairMetadadosDoNome(fileName);

      // Extrair conteúdo completo do livro
      console.log(`  Extraindo conteúdo de ${fileName}...`);
      const conteudoExtraido = await livroDidaticoExtractor.extrairConteudo(
        filePath,
        metadata

      // Salvar conteúdo extraído em arquivo JSON para referência
      const jsonFileName = fileName.replace('.pdf', '.json');
      const jsonFilePath = path.join(this.processadosDir, jsonFileName);
      fs.writeFileSync(jsonFilePath, JSON.stringify(conteudoExtraido, null, 2));

      // Converter conteúdo em questões
      console.log(`  Convertendo conteúdo em questões...`);
      const questoes = livroDidaticoExtractor.converterParaQuestoes(
        conteudoExtraido.conteudo,
        conteudoExtraido.metadata
      );

      // Salvar questões no banco de dados
      console.log(
        `  Salvando ${questoes.length} questões no banco de dados...`
      );
      const questoesSalvas = await this.salvarQuestoes(questoes);

      // Categorizar questões automaticamente se solicitado
      if (categorizarAutomaticamente && questoesSalvas.length > 0) {
        console.log(`  Categorizando ${questoesSalvas.length} questões...`);
        await this.categorizarQuestoesAutomaticamente(questoesSalvas);
      }

      // Mover arquivo processado para diretório de processados
      const destinoPath = path.join(this.processadosDir, fileName);
      fs.renameSync(filePath, destinoPath);

      return {
        conteudoExtraido: conteudoExtraido.conteudo.length,
        questoesGeradas: questoes.length,
        questoesSalvas: questoesSalvas.length,
        arquivoJson: jsonFileName,
        metadata: conteudoExtraido.metadata,
      };

    } catch (error) {
      console.error(`Erro ao processar livro ${fileName}:`, error);
      throw error;
    }
  }

  /**
   * Extrair metadados do nome do arquivo
   * @param {string} fileName - Nome do arquivo
   * @returns {Object} - Metadados extraídos
   */
  extrairMetadadosDoNome(fileName) {
    const metadata = {
      filename: fileName,
      titulo: path.basename(fileName, '.pdf'),
      processadoEm: new Date().toISOString(),
    };

    // Tentar extrair ano
    const anoMatch = fileName.match(/(\d)[º°]?\s*ano/i);
    if (anoMatch) {
      metadata.ano = parseInt(anoMatch[1]);
    }

    // Tentar inferir disciplina
    const disciplinas = {
      matematica: [
        'matemática',
        'matematica',
        'álgebra',
        'geometria',
        'calculo',
      ],
      portugues: [
        'português',
        'portugues',
        'língua',
        'literatura',
        'gramática',
        'gramatica',
      ],
      ciencias_natureza: [
        'ciências',
        'ciencia',
        'física',
        'química',
        'biologia',
        'fisica',
        'quimica',
      ],
      ciencias_humanas: [
        'história',
        'geografia',
        'filosofia',
        'sociologia',
        'historia',
      ],
      ingles: ['inglês', 'ingles', 'english'],
    };

    const fileNameLower = fileName.toLowerCase();

    for (const [disciplina, keywords] of Object.entries(disciplinas)) {
      for (const keyword of keywords) {
        if (fileNameLower.includes(keyword)) {
          metadata.disciplina = disciplina;
          break;
        }
      }
      if (metadata.disciplina) break;
    }

    return metadata;
  }

  /**
   * Salvar questões no banco de dados
   * @param {Array} questoes - Questões para salvar
   * @returns {Promise<Array>} - Questões salvas
   */
  async salvarQuestoes(questoes) {
    const questoesSalvas = [];

    for (const questao of questoes) {
      try {
        // Verificar se a questão já existe
        const existing = await db.query(
          'SELECT id FROM questoes WHERE numero = $1 AND origem = $2',
          [questao.numero, questao.origem]
        );

        if (existing.rows.length > 0) {
          console.log(`  Questão ${questao.numero} já existe, ignorando...`);
          continue;
        }

        // Inserir nova questão
        const result = await db.query(
          `
          INSERT INTO questoes (
            numero, enunciado, alternativas, resposta_correta, 
            materia, ano_vestibular, origem, origem_tipo,
            nivel_dificuldade, tipo, competencia, habilidade,
            topico, area_conhecimento, explicacao
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
          RETURNING id
        `,
          [
            questao.numero,
            questao.enunciado,
            JSON.stringify(questao.alternativas),
            questao.resposta_correta,
            questao.materia,
            questao.ano_vestibular,
            questao.origem,
            questao.origem_tipo,
            questao.nivel_dificuldade,
            questao.tipo,
            questao.competencia,
            questao.habilidade,
            questao.topico,
            questao.area_conhecimento,
            questao.explicacao || '',
          ]

        questoesSalvas.push({
          ...questao,
          id: result.rows[0].id,
        });
      } catch (error) {
        console.error(
          `  Erro ao salvar questão ${questao.numero}:`,
          error.message
        );
        // Continuar com as próximas questões
      }
    }

    return questoesSalvas;
  }

  /**
   * Categorizar questões automaticamente usando o categorizador do ENEM
   * @param {Array} questoes - Questões para categorizar
   */
  async categorizarQuestoesAutomaticamente(questoes) {
    try {
      for (const questao of questoes) {
        try {
          // Categorizar a questão
          const categorizacao = categorizadorEnem.categorizarQuestao(questao);

          // Atualizar a questão no banco de dados
          await db.query(
            `
            UPDATE questoes 
            SET materia = COALESCE($1, materia),
                competencia = COALESCE($2, competencia),
                habilidade = COALESCE($3, habilidade),
                nivel_dificuldade = COALESCE($4, nivel_dificuldade),
                tipo = COALESCE($5, tipo),
                area_conhecimento = COALESCE($6, area_conhecimento),
                topico = COALESCE($7, topico)
            WHERE id = $8
          `,
            [
              categorizacao.materia,
              categorizacao.competencia,
              categorizacao.habilidade,
              categorizacao.nivel_dificuldade,
              categorizacao.tipo,
              categorizacao.area_conhecimento,
              categorizacao.topico,
              questao.id,
            ]

        } catch (error) {
          console.error(
            `  Erro ao categorizar questão ${questao.id}:`,
            error.message
          );
          // Continuar com as próximas questões
        }
      }
    } catch (error) {
      console.error('Erro na categorização automática de questões:', error);
      throw error;
    }
  }

  /**
   * Gerar relatório final do processamento
   * @param {Object} resultados - Resultados do processamento
   * @returns {Object} - Relatório formatado
   */
  gerarRelatorioFinal(resultados) {
    const agora = new Date();
    const timestamp = agora.toLocaleString('pt-BR');

    const resumo = `
RELATÓRIO DE PROCESSAMENTO DE LIVROS DIDÁTICOS
============================================
Data/Hora: ${timestamp}

Total de livros encontrados: ${resultados.total}
Livros processados com sucesso: ${resultados.processados}
Livros com erro: ${resultados.erros}
Conteúdo extraído: ${resultados.conteudoExtraido} seções
Questões geradas: ${resultados.questoesGeradas}

Taxa de sucesso: ${((resultados.processados / resultados.total) * 100).toFixed(2)}%
`;

    // Detalhes por livro
    let detalhes = '\nDETALHES POR LIVRO:\n==================\n';

    resultados.detalhes.forEach((detalhe, index) => {
      detalhes += `\n${index + 1}. ${detalhe.filename}\n`;
      detalhes += `   Status: ${detalhe.success ? '✓ Sucesso' : '✗ Erro'}\n`;

      if (detalhe.success) {
        detalhes += `   Conteúdo extraído: ${detalhe.conteudoExtraido} seções\n`;
        detalhes += `   Questões geradas: ${detalhe.questoesGeradas}\n`;
        detalhes += `   Questões salvas: ${detalhe.questoesSalvas}\n`;
        if (detalhe.metadata.disciplina) {
          detalhes += `   Disciplina: ${detalhe.metadata.disciplina}\n`;
        }
        if (detalhe.metadata.ano) {
          detalhes += `   Ano: ${detalhe.metadata.ano}º\n`;
        }
      } else {
        detalhes += `   Erro: ${detalhe.error}\n`;
      }
    });

    return {
      resumo: resumo,
      detalhes: detalhes,
      timestamp: agora.toISOString(),
      estatisticas: {
        total: resultados.total,
        sucesso: resultados.processados,
        erros: resultados.erros,
        taxaSucesso: (resultados.processados / resultados.total) * 100,
        conteudoExtraido: resultados.conteudoExtraido,
        questoesGeradas: resultados.questoesGeradas,
      },
    };
  }

  /**
   * Logar mensagens de processamento
   * @param {string} mensagem - Mensagem para logar
   */
  logProcessamento(mensagem) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${mensagem}\n`;

    // Adicionar ao arquivo de log
    fs.appendFileSync(this.logFile, logEntry);

    // Também imprimir no console para monitoramento em tempo real
    console.log(logEntry.trim());
  }

  /**
   * Obter estatísticas do processamento
   * @returns {Promise<Object>} - Estatísticas
   */
  async obterEstatisticas() {
    try {
      const stats = {};

      // Total de questões de livros didáticos
      const totalResult = await db.query(
        'SELECT COUNT(*) as total FROM questoes WHERE origem_tipo = $1',
        ['livro_didatico']
      );
      stats.totalQuestoesLivros = parseInt(totalResult.rows[0].total);

      // Distribuição por matéria
      const materiasResult = await db.query(
        `
        SELECT materia, COUNT(*) as quantidade 
        FROM questoes 
        WHERE origem_tipo = $1 
        GROUP BY materia 
        ORDER BY quantidade DESC
      `,
        ['livro_didatico']
      );
      stats.porMateria = materiasResult.rows;

      // Distribuição por tipo
      const tiposResult = await db.query(
        `
        SELECT tipo, COUNT(*) as quantidade 
        FROM questoes 
        WHERE origem_tipo = $1 
        GROUP BY tipo 
        ORDER BY quantidade DESC
      `,
        ['livro_didatico']
      );
      stats.porTipo = tiposResult.rows;

      // Distribuição por dificuldade
      const dificuldadeResult = await db.query(
        `
        SELECT nivel_dificuldade, COUNT(*) as quantidade 
        FROM questoes 
        WHERE origem_tipo = $1 AND nivel_dificuldade IS NOT NULL
        GROUP BY nivel_dificuldade 
        ORDER BY nivel_dificuldade
      `,
        ['livro_didatico']
      );
      stats.porDificuldade = dificuldadeResult.rows;

      // Questões categorizadas
      const categorizadasResult = await db.query(
        'SELECT COUNT(*) as total FROM questoes WHERE origem_tipo = $1 AND materia IS NOT NULL',
        ['livro_didatico']
      );
      stats.questoesCategorizadas = parseInt(categorizadasResult.rows[0].total);

      return stats;
    } catch (error) {
      console.error('Erro ao obter estatísticas:', error);
      throw error;
    }
  }

  /**
   * Reindexar todos os livros (reprocessar)
   * @returns {Promise<Object>} - Resultado da reindexação
   */
  async reindexarTodosLivros() {
    try {
      console.log('Iniciando reindexação de todos os livros...');
      this.logProcessamento('=== INICIANDO REINDEXAÇÃO DE TODOS OS LIVROS ===');

      // Mover livros processados de volta para o diretório principal
      const livrosProcessados = fs.readdirSync(this.processadosDir);
      const pdfFiles = livrosProcessados.filter(
        (file) => path.extname(file).toLowerCase() === '.pdf'
      );

      console.log(
        `Movendo ${pdfFiles.length} livros de volta para processamento...`
      );
      this.logProcessamento(
        `Movendo ${pdfFiles.length} livros de volta para processamento`

      for (const fileName of pdfFiles) {
        const origemPath = path.join(this.processadosDir, fileName);
        const destinoPath = path.join(this.livrosDir, fileName);

        fs.renameSync(origemPath, destinoPath);
        console.log(`Movido: ${fileName}`);
        this.logProcessamento(`Movido: ${fileName}`);
      }

      // Processar novamente
      const resultado = await this.processarTodosLivros();

      return {
        success: true,
        message: 'Reindexação concluída com sucesso',
        ...resultado,
      };

    } catch (error) {
      console.error('Erro na reindexação:', error);
      this.logProcessamento(`ERRO NA REINDEXAÇÃO: ${error.message}`);

      throw error;
    }
  }
}

// Criar e exportar uma instância do processador
module.exports = new ProcessadorLivrosDidaticos();
