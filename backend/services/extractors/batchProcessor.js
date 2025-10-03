// services/extractors/batchProcessor.js
const fs = require('fs');
const path = require('path');
const enhancedExtractor = require('./enhancedExtractor');

class BatchProcessor {
  constructor(examDirectory, gabaritoDirectory) {
    this.examDirectory = examDirectory;
    this.gabaritoDirectory = gabaritoDirectory;
  }

  async processAllFiles() {
    try {
      console.log(`Iniciando processamento em massa de arquivos...`);

      // Validate directories exist
      if (!fs.existsSync(this.examDirectory)) {
        throw new Error(
          `Diretório de provas não encontrado: ${this.examDirectory}`
        );

      if (!fs.existsSync(this.gabaritoDirectory)) {
        console.warn(
          `Diretório de gabaritos não encontrado: ${this.gabaritoDirectory}. Continuando sem gabaritos.`
        );

      // Get all exam files
      const examFiles = this.getExamFiles();
      console.log(
        `Encontrados ${examFiles.length} arquivos de prova para processar.`

      if (examFiles.length === 0) {
        console.warn('Nenhum arquivo de prova encontrado para processar.');
        return [];
      }

      // Process each exam file
      const results = [];
      for (const examFile of examFiles) {
        try {
          console.log(`Processando: ${examFile}`);

          // Try to find corresponding answer key file
          const gabaritoFile = this.findCorrespondingGabarito(examFile);

          const examPath = path.join(this.examDirectory, examFile);
          const gabaritoPath = gabaritoFile
            ? path.join(this.gabaritoDirectory, gabaritoFile)

          // Extract questions
          const extractionResult = await enhancedExtractor.extract(
            examPath,
            gabaritoPath

          // Add additional metadata to result
          results.push({
            fileName: examFile,
            gabaritoFile: gabaritoFile,
            ...extractionResult,
            status: 'success',
            processingTime: new Date().toISOString(),
          });

          console.log(
            `Extração concluída para: ${examFile}. Encontradas ${extractionResult.questoes.length} questões.`
          );
        } catch (error) {
          console.error(`Erro ao processar ${examFile}:`, error.message);
          results.push({
            fileName: examFile,
            error: error.message,
            status: 'error',
            processingTime: new Date().toISOString(),
          });
        }
      }

      console.log(
        `Processamento em massa concluído. Processados ${results.length} arquivos.`
      );
      return results;
    } catch (error) {
      console.error('Erro no processamento em massa:', error);
      throw error;
    }
  }

  getExamFiles() {
    if (!fs.existsSync(this.examDirectory)) {
      return [];
    }

    const files = fs.readdirSync(this.examDirectory);

    // Filter for PDF files that are exam files (not answer keys)
    const examFiles = files.filter((file) => {
      const isPdf = path.extname(file).toLowerCase() === '.pdf';
      const isNotGabarito =
        !file.toLowerCase().includes('gabarito') &&
        !file.toLowerCase().includes('gb_') &&
        !file.toLowerCase().includes('resposta') &&
        !file.toLowerCase().includes('answer') &&
        !file.toLowerCase().includes('gabarito');

      return isPdf && isNotGabarito;
    });

    console.log(`${examFiles.length} arquivos de prova identificados.`);
    return examFiles;
  }

  findCorrespondingGabarito(examFile) {
    if (!fs.existsSync(this.gabaritoDirectory)) {
      return null;
    }

    const examFileName = path.parse(examFile).name;
    const examBaseName = examFileName.replace(
      /_pv_impresso_|_dia_|_caderno_|_dia\d_|_cad\d_/gi,
      '_'

    const gabaritoFiles = fs.readdirSync(this.gabaritoDirectory);

    // Look for possible answer key patterns
    const possibleGabaritoNames = [
      examFileName.replace(/_pv_impresso/i, '_gb_impresso'), // ENEM pattern
      examFileName.replace(/_dia_/i, '_gb_dia_'),
      examFileName.replace(/_dia/i, '_gb_'),
      examFileName.replace(/_caderno/i, '_gabarito_'),
      examFileName.replace(/dia(\d)/i, 'gb_dia$1'),
      `${path.parse(examFile).name}_Gabarito`,
      `${path.parse(examFile).name}_gabarito`,
      `${path.parse(examFile).name}_RESPOSTAS`,
      `${path.parse(examFile).name}_respostas`,
      `${path.parse(examFile).name}_Answer`,
      `${path.parse(examFile).name}_answer`,
    ];

    // Try to find a matching answer key file
    for (const possibleName of possibleGabaritoNames) {
      const matchingFile = gabaritoFiles.find((gabaritoFile) =>
        gabaritoFile.toLowerCase().includes(possibleName.toLowerCase())
      );

      if (matchingFile) {
        console.log(
          `Gabarito correspondente encontrado para ${examFile}: ${matchingFile}`
        );
        return matchingFile;
      }
    }

    // If no direct match, look for similar name patterns based on year and type
    for (const gabaritoFile of gabaritoFiles) {
      const gabaritoName = path.parse(gabaritoFile).name;

      // Check if the year part matches
      const examYearMatch = examFileName.match(/20\d{2}/);
      const gabaritoYearMatch = gabaritoName.match(/20\d{2}/);

        examYearMatch &&
        gabaritoYearMatch &&
        examYearMatch[0] === gabaritoYearMatch[0]
      ) {
        // Also check if the type (D1/D2, CD1/CD5) matches
        const examTypeMatch = examFileName.match(/(d[12]|cd\d+)/i);
        const gabaritoTypeMatch = gabaritoName.match(
          /(d[12]|cd\d+|azul|amarelo|cinza|rosa)/i

        if (examTypeMatch && gabaritoTypeMatch) {
          if (
            examTypeMatch[0].toLowerCase() ===
            gabaritoTypeMatch[0].toLowerCase()
          ) {
            console.log(
              `Gabarito correspondente encontrado para ${examFile} (por padrão ano/tipo): ${gabaritoFile}`
            );
            return gabaritoFile;
          }
        } else {
          // If type doesn't match but year does, return it as a possibility
          console.log(
            `Gabarito correspondente encontrado para ${examFile} (por ano): ${gabaritoFile}`
          );
          return gabaritoFile;
        }
      }
    }

    console.log(`Nenhum gabarito correspondente encontrado para ${examFile}`);
    return null; // No matching answer key found
  }

  groupResultsBySubject(results) {
    const grouped = {};

    results.forEach((result) => {
      if (result.status === 'success' && result.questoes) {
        result.questoes.forEach((questao) => {
          const materia = questao.materia || 'Não classificada';
          if (!grouped[materia]) {
            grouped[materia] = [];
          }
          grouped[materia].push({
            ...questao,
            proveniencia: result.fileName,
          });
        });
      }
    });

    return grouped;
  }

  getStats(results) {
    const stats = {
      totalArquivos: results.length,
      arquivosComSucesso: 0,
      arquivosComErro: 0,
      arquivosComGabarito: 0,
      totalQuestoes: 0,
      questoesPorMateria: {},
      questoesPorAno: {},
      questoesComResposta: 0,
      questoesSemResposta: 0,
      taxaAcertoGeral: 0,
      erros: [],
    };

    results.forEach((result) => {
      if (result.status === 'success') {
        stats.arquivosComSucesso++;

        if (result.gabaritoFile) {
          stats.arquivosComGabarito++;
        }

        stats.totalQuestoes += result.questoes.length;

        // Group by subject
        result.questoes.forEach((questao) => {
          const materia = questao.materia || 'Não classificada';
          stats.questoesPorMateria[materia] =
            (stats.questoesPorMateria[materia] || 0) + 1;

          // Group by year
          if (questao.ano) {
            stats.questoesPorAno[questao.ano] =
              (stats.questoesPorAno[questao.ano] || 0) + 1;
          }

          // Count questions with/without answers
          if (questao.resposta_correta) {
            stats.questoesComResposta++;
          } else {
            stats.questoesSemResposta++;
          }
        });
      } else {
        stats.arquivosComErro++;
        stats.erros.push({
          fileName: result.fileName,
          error: result.error,
        });
      }
    });

    // Calculate overall success rate
    if (stats.totalQuestoes > 0) {
      stats.taxaAcertoGeral = (
        (stats.questoesComResposta / stats.totalQuestoes) *
        100
      ).toFixed(2);
    }

    return stats;
  }

  // Method to validate extraction quality
  validateExtractionQuality(results) {
    const qualityReport = {
      validExtractions: 0,
      invalidExtractions: 0,
      avgQuestionsPerFile: 0,
      minQuestions: Infinity,
      maxQuestions: 0,
      qualityIssues: [],
    };

    const validResults = results.filter((r) => r.status === 'success');
    qualityReport.validExtractions = validResults.length;
    qualityReport.invalidExtractions = results.length - validResults.length;

    if (validResults.length > 0) {
      const allQuestionCounts = validResults.map((r) => r.questoes.length);
      qualityReport.avgQuestionsPerFile = (
        allQuestionCounts.reduce((sum, count) => sum + count, 0) /
        validResults.length
      ).toFixed(2);

      qualityReport.minQuestions = Math.min(...allQuestionCounts);
      qualityReport.maxQuestions = Math.max(...allQuestionCounts);

      // Check for quality issues
      validResults.forEach((result) => {
        if (result.questoes.length === 0) {
          qualityReport.qualityIssues.push({
            fileName: result.fileName,
            issue: 'Nenhuma questão extraída',
          });
        } else if (result.questoes.length < 10) {
          qualityReport.qualityIssues.push({
            fileName: result.fileName,
            issue: `Poucas questões extraídas (${result.questoes.length})`,
          });
        }

        // Check for questions with empty content
        const emptyQuestions = result.questoes.filter(
          (q) =>
            !q.enunciado ||
            q.enunciado.trim().length === 0 ||
            Object.keys(q.alternativas).length < 2
        );

        if (emptyQuestions.length > 0) {
          qualityReport.qualityIssues.push({
            fileName: result.fileName,
            issue: `${emptyQuestions.length} questões com conteúdo incompleto`,
          });
        }
      });
    }

    return qualityReport;
  }
}

module.exports = BatchProcessor;
