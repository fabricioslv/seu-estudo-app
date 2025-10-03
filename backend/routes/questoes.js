// routes/questoes.js - Rotas para gerenciar questões
const express = require('express');
const multer = require('multer');
const path = require('path');
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const unifiedExtractor = require('../services/extractors/unifiedExtractor');
const enhancedExtractor = require('../services/extractors/enhancedExtractor');
const aiService = require('../services/aiService');
const personalityTestsService = require('../services/personalityTestsService');
const BatchProcessor = require('../services/extractors/batchProcessor');
const questionStorage = require('../services/questionStorage');

const router = express.Router();

// --- ROTA PARA EXTRAÇÃO DE UM ÚNICO ARQUIVO ---
router.post('/extract-local-file', async (req, res) => {
  try {
    const { filename, gabaritoFilename } = req.body;

    if (!filename) {
      return res.status(400).json({ error: 'Nome do arquivo é obrigatório' });
    }

    const provasDir = path.join(__dirname, '../../', 'Provas e gabaritos');
    const gabaritosDir = path.join(provasDir, 'Gabaritos');

    const filePath = path.join(provasDir, filename);
    const gabaritoPath = gabaritoFilename
      ? path.join(gabaritosDir, gabaritoFilename)
      : null;

    // Verify that file exists
    if (!require('fs').existsSync(filePath)) {
      return res
        .status(404)
        .json({ error: `Arquivo não encontrado: ${filename}` });
    }

    // Extract questions using enhanced extractor
    const result = await enhancedExtractor.extract(filePath, gabaritoPath);

    res.json({
      success: true,
      ...result,
      msg: `Extração concluída com sucesso. Encontradas ${result.questoes.length} questões.`
    });
  } catch (err) {
    console.error('Erro ao extrair o arquivo:', err);
    res.status(500).json({ error: 'Erro ao ler ou processar o arquivo PDF.' });
  }
});

// --- ROTA PARA PROCESSAMENTO EM MASSA ---
router.post('/process-batch', async (req, res) => {
  try {
    const provasDir = path.join(__dirname, '../../', 'Provas e gabaritos');
    const gabaritosDir = path.join(provasDir, 'Gabaritos');

    const batchProcessor = new BatchProcessor(provasDir, gabaritosDir);

    console.log('Iniciando processamento em massa...');
    const results = await batchProcessor.processAllFiles();

    const stats = batchProcessor.getStats(results);

    console.log(`Processamento em massa concluído.`);
    console.log(`Arquivos processados: ${stats.totalArquivos}`);
    console.log(`Com sucesso: ${stats.arquivosComSucesso}`);
    console.log(`Com erro: ${stats.arquivosComErro}`);
    console.log(`Total de questões extraídas: ${stats.totalQuestoes}`);

    res.json({
      success: true,
      results,
      stats,
      msg: `Processamento em massa concluído. Processados ${stats.totalArquivos} arquivos, encontradas ${stats.totalQuestoes} questões.`
    });
  } catch (err) {
    console.error('Erro no processamento em massa:', err);
    res
      .status(500)
      .json({ error: 'Erro no processamento em massa dos arquivos PDF.' });
  }
});

// --- ROTA PARA PROCESSAMENTO EM MASSA COM ARMAZENAMENTO NO BANCO ---
router.post('/process-batch-and-store', async (req, res) => {
  try {
    const { overwrite } = req.body; // Option to overwrite existing questions

    const provasDir = path.join(__dirname, '../../', 'Provas e gabaritos');
    const gabaritosDir = path.join(provasDir, 'Gabaritos');

    const batchProcessor = new BatchProcessor(provasDir, gabaritosDir);

    console.log('Iniciando processamento e armazenamento em massa...');
    const results = await batchProcessor.processAllFiles();

    // Filter successful extractions
    const successfulResults = results.filter(
      (result) => result.status === 'success'
    );

    if (successfulResults.length === 0) {
      return res.json({
        success: false,
        msg: 'Nenhuma extração bem-sucedida para armazenar.',
        results,
        storageResult: null,
      });
    }

    // Calculate total questions
    const totalQuestoes = successfulResults.reduce((total, result) => {
      return total + (result.questoes ? result.questoes.length : 0);
    }, 0);

    console.log(
      `Iniciando armazenamento de ${totalQuestoes} questões no banco de dados...`
    );

    // Save to database
    const storageResult = await questionStorage.saveBatchResults(results, {
      overwrite,
    });

    const stats = batchProcessor.getStats(results);

    console.log(`Armazenamento concluído.`);
    console.log(`Questões inseridas: ${storageResult.totalInserted}`);
    console.log(`Questões puladas: ${storageResult.totalSkipped}`);
    console.log(`Erros encontrados: ${storageResult.totalErrors.length}`);

    res.json({
      success: true,
      results,
      stats,
      storageResult,
      msg: `Processamento e armazenamento concluídos. ${storageResult.totalInserted} questões inseridas, ${storageResult.totalSkipped} puladas.`
    });
  } catch (err) {
    console.error('Erro no processamento e armazenamento em massa:', err);
    res
      .status(500)
      .json({
        error: 'Erro no processamento e armazenamento dos arquivos PDF.',
      });
  }
});

// --- ROTA PARA LISTAR ARQUIVOS DISPONÍVEIS ---
router.get('/available-files', async (req, res) => {
  try {
    const provasDir = path.join(__dirname, '../../', 'Provas e gabaritos');
    const gabaritosDir = path.join(provasDir, 'Gabaritos');

    const fs = require('fs');

    // Get exam files
    const allFiles = fs.readdirSync(provasDir);
    const examFiles = allFiles.filter(
      (file) =>
        path.extname(file).toLowerCase() === '.pdf' &&
        !file.toLowerCase().includes('gabarito') &&
        !file.toLowerCase().includes('gb_') &&
        !file.toLowerCase().includes('resposta') &&
        !file.toLowerCase().includes('answer')
    );

    // Get answer key files
    const gabaritoFiles = fs
      .readdirSync(gabaritosDir)
      .filter((file) => path.extname(file).toLowerCase() === '.pdf');

    res.json({
      success: true,
      examFiles,
      gabaritoFiles,
      totalExams: examFiles.length,
      totalGabaritos: gabaritoFiles.length,
    });
  } catch (err) {
    console.error('Erro ao listar arquivos disponíveis:', err);
    res.status(500).json({ error: 'Erro ao listar arquivos disponíveis.' });
  }
});

// --- ROTA PARA LISTAR QUESTÕES POR DISCIPLINA ---
router.get('/by-subject/:subject', async (req, res) => {
  try {
    const { subject } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const questions = await questionStorage.getQuestionsBySubject(
      subject,
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      success: true,
      subject,
      questions,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    console.error('Erro ao buscar questões por disciplina:', err);
    res.status(500).json({ error: 'Erro ao buscar questões por disciplina.' });
  }
});

// --- ROTA PARA LISTAR QUESTÕES POR ANO ---
router.get('/by-year/:year', async (req, res) => {
  try {
    const { year } = req.params;
    const { limit = 10, offset = 0 } = req.query;

    const questions = await questionStorage.getQuestionsByYear(
      parseInt(year),
      parseInt(limit),
      parseInt(offset)
    );

    res.json({
      success: true,
      year: parseInt(year),
      questions,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    console.error('Erro ao buscar questões por ano:', err);
    res.status(500).json({ error: 'Erro ao buscar questões por ano.' });
  }
});

// --- ROTA PARA ESTATÍSTICAS DAS QUESTÕES NO BANCO ---
router.get('/stats', async (req, res) => {
  try {
    const stats = await questionStorage.getQuestionsStats();

    res.json({
      success: true,
      stats,
    });
  } catch (err) {
    console.error('Erro ao buscar estatísticas das questões:', err);
    res
      .status(500)
      .json({ error: 'Erro ao buscar estatísticas das questões.' });
  }
});

// --- ROTA PARA GERAR EXPLICAÇÕES DE QUESTÕES ---
router.post('/generate-explanations', async (req, res) => {
  try {
    const { questoes } = req.body;

    if (!questoes || !Array.isArray(questoes) || questoes.length === 0) {
      return res
        .status(400)
        .json({
          error: 'Nenhuma questão fornecida para geração de explicações.',
        });

    console.log(`Gerando explicações para ${questoes.length} questões...`);

    // Gerar explicações para as questões
    const explanations = await aiService.generateExplanations(questoes);

    res.json({
      success: true,
      explanations,
      msg: `Explicações geradas para ${questoes.length} questões.`
    });
  } catch (err) {
    console.error('Erro ao gerar explicações:', err);
    res
      .status(500)
      .json({ error: 'Erro ao gerar explicações para as questões.' });
  }
});

// --- ROTA PARA GERAR EXPLICAÇÃO DE UMA ÚNICA QUESTÃO ---
router.post('/generate-explanation', async (req, res) => {
  try {
    const { questao } = req.body;

    if (!questao) {
      return res
        .status(400)
        .json({
          error: 'Nenhuma questão fornecida para geração de explicação.',
        });

    console.log(`Gerando explicação para a questão ${questao.numero}...`);

    // Gerar explicação para a questão
    const explanation = await aiService.generateExplanation(questao);

    res.json({
      success: true,
      explanation,
      numero: questao.numero,
      msg: `Explicação gerada para a questão ${questao.numero}.`
    });
  } catch (err) {
    console.error('Erro ao gerar explicação:', err);
    res.status(500).json({ error: 'Erro ao gerar explicação para a questão.' });
  }
});

// --- ROTA PARA PROCESSAR LIVROS DIDÁTICOS ---
router.post('/processar-livros', async (req, res) => {
  try {
    console.log('Iniciando processamento de livros didáticos...');

    // Importar o processador de livros
    const ProcessadorLivros = require('../scripts/processarLivros');
    const processador = new ProcessadorLivros();

    // Executar o processamento em segundo plano
    processador
      .processarTodosLivros()
      .then(() => {
        console.log('Processamento de livros didáticos concluído.');
      })
      .catch((err) => {
        console.error('Erro no processamento de livros didáticos:', err);
      });

    res.json({
      success: true,
      msg: 'Iniciando processamento de livros didáticos. Processo em segundo plano.'
    });
  } catch (err) {
    console.error('Erro ao processar livros didáticos:', err);
    res.status(500).json({ error: 'Erro ao processar livros didáticos.' });
  }
});

// --- ROTA PARA PROCESSAR LIVROS DIDÁTICOS ---
router.post('/processar-livros', async (req, res) => {
  try {
    const { categorizarAutomaticamente = true } = req.body;

    console.log('Iniciando processamento de livros didáticos...');

    // Importar o processador de livros
    const ProcessadorLivros = require('../services/processadorLivrosDidaticos');

    // Executar o processamento em segundo plano
    ProcessadorLivros.processarTodosLivros(categorizarAutomaticamente)
      .then((resultado) => {
        console.log('Processamento de livros didáticos concluído:', resultado);
      })
      .catch((err) => {
        console.error('Erro no processamento de livros didáticos:', err);
      });

    res.json({
      success: true,
      msg: 'Iniciando processamento de livros didáticos. Processo em segundo plano.'
    });
  } catch (err) {
    console.error('Erro ao processar livros didáticos:', err);
    res.status(500).json({ error: 'Erro ao processar livros didáticos.' });
  }
});

// --- ROTA PARA CATEGORIZAR QUESTÕES DO ENEM ---
router.post('/categorizar-enem', async (req, res) => {
  try {
    const { questoesIds, todas = false } = req.body;

    console.log('Iniciando categorização de questões do ENEM...');

    // Importar o categorizador
    const categorizador = require('../services/categorizacaoEnem');
    const db = require('../db');

    let questoes;

    if (todas) {
      // Categorizar todas as questões do ENEM
      const result = await db.query(
        "SELECT * FROM questoes WHERE origem LIKE '%ENEM%' OR origem_tipo = 'enem'"
      );
      questoes = result.rows;
    } else if (questoesIds && questoesIds.length > 0) {
      // Categorizar questões específicas
      const placeholders = questoesIds
        .map((_, index) => `${index + 1}`)
        .join(', ');
      const result = await db.query(
        `SELECT * FROM questoes WHERE id IN (${placeholders})`,
        questoesIds
      );
      questoes = result.rows;
    } else {
      return res
        .status(400)
        .json({
          error:
            'É necessário fornecer IDs de questões ou definir "todas" como true.',
        });
    }

    if (questoes.length === 0) {
      return res
        .status(404)
        .json({ error: 'Nenhuma questão encontrada para categorização.' });
    }

    console.log(`Categorizando ${questoes.length} questões do ENEM...`);

    // Categorizar as questões
    const questoesCategorizadas = questoes.map((questao) => {
      try {
        const categorizacao = categorizador.categorizarQuestao(questao);
        return {
          ...questao,
          ...categorizacao,
        };
      } catch (error) {
        console.error(`Erro ao categorizar questão ${questao.id}:`, error);
        return questao; // Retornar a questão sem categorização em caso de erro
      }
    });

    // Atualizar as questões no banco de dados
    let atualizadas = 0;

    for (const questao of questoesCategorizadas) {
      try {
        await db.query(
          `
          UPDATE questoes 
          SET materia = $1, 
              competencia = $2, 
              habilidade = $3, 
              nivel_dificuldade = $4, 
              tipo = $5,
              area_conhecimento = $6
          WHERE id = $7
        `,
          [
            questao.materia,
            questao.competencia,
            questao.habilidade,
            questao.nivel_dificuldade,
            questao.tipo,
            questao.area_conhecimento,
            questao.id,
          ]
        );
        atualizadas++;
      } catch (error) {
        console.error(`Erro ao atualizar questão ${questao.id}:`, error);
        // Continuar com as próximas questões
      }
    }

    // Obter estatísticas
    const estatisticas = categorizador.obterEstatisticas(questoesCategorizadas);

    res.json({
      success: true,
      total_processadas: questoes.length,
      total_atualizadas: atualizadas,
      estatisticas: estatisticas,
      msg: `Categorização concluída: ${atualizadas} de ${questoes.length} questões atualizadas.`,
    });
  } catch (err) {
    console.error('Erro ao categorizar questões do ENEM:', err);
    res.status(500).json({ error: 'Erro ao categorizar questões do ENEM.' });
  }
});

// --- ROTA PARA OBTER ESTATÍSTICAS DOS LIVROS DIDÁTICOS ---
router.get('/estatisticas-livros', async (req, res) => {
  try {
    // Importar o processador de livros
    const ProcessadorLivros = require('../services/processadorLivrosDidaticos');

    const estatisticas = await ProcessadorLivros.obterEstatisticas();

    res.json({
      success: true,
      estatisticas: estatisticas,
      msg: 'Estatísticas dos livros didáticos obtidas com sucesso.',
    });
  } catch (err) {
    console.error('Erro ao obter estatísticas dos livros:', err);
    res
      .status(500)
      .json({ error: 'Erro ao obter estatísticas dos livros didáticos.' });
  }
});

// --- ROTA PARA IMPORTAR QUESTÕES DA API DO ENEM ---
router.post('/importar-enem', async (req, res) => {
  try {
    const { ano, materia } = req.body;

    if (!ano) {
      return res
        .status(400)
        .json({ error: 'Ano é obrigatório para importar questões do ENEM.' });
    }

    console.log(
      `Iniciando importação de questões do ENEM ${ano}${materia ? ` - Matéria: ${materia}` : ''}...`

    // Importar questões da API do ENEM para o banco de dados
    const ImportadorQuestoesEnem = require('../scripts/importarQuestoesEnem');
    const importador = new ImportadorQuestoesEnem();

    // Para evitar timeout, vamos executar a importação assíncrona e retornar imediatamente
    importador
      .importarQuestoesAno(ano, materia)
      .then(() => {
        console.log(`Importação do ENEM ${ano} concluída.`);
      })
      .catch((err) => {
        console.error(`Erro na importação do ENEM ${ano}:`, err);
      });

    res.json({
      success: true,
      msg: `Iniciando importação de questões do ENEM ${ano}${materia ? ` - Matéria: ${materia}` : ''}. Processo em segundo plano.`
    });
  } catch (err) {
    console.error('Erro ao importar questões do ENEM:', err);
    res.status(500).json({ error: 'Erro ao importar questões do ENEM.' });
  }
});

// --- ROTA PARA REGISTRAR RESPOSTA DE QUESTÃO ---
router.post('/responder', async (req, res) => {
  try {
    const { usuarioId, questaoId, resposta, tempoResposta = 0 } = req.body;

    if (!usuarioId || !questaoId || !resposta) {
      return res
        .status(400)
        .json({
          error: 'ID do usuário, ID da questão e resposta são obrigatórios.',
        });
    }

    // Importar o serviço de resolução de questões
    const questoesResolucaoService = require('../services/questoesResolucaoService');

    // Obter a questão para verificar a resposta
    const questaoQuery = 'SELECT resposta_correta FROM questoes WHERE id = $1';
    const questaoResult = await db.query(questaoQuery, [questaoId]);

    if (questaoResult.rows.length === 0) {
      return res.status(404).json({ error: 'Questão não encontrada.' });
    }

    const isCorreta = questaoResult.rows[0].resposta_correta === resposta;

    // Registrar a resposta
    const resultado = await questoesResolucaoService.registrarResposta(
      usuarioId,
      questaoId,
      resposta,
      isCorreta,
      tempoResposta

    res.json({
      success: true,
      ...resultado,
      msg: isCorreta
        ? 'Resposta correta! Parabéns!'
        : 'Resposta incorreta, mas continue tentando!',
    });
  } catch (err) {
    console.error('Erro ao registrar resposta à questão:', err);
    res.status(500).json({ error: 'Erro ao registrar resposta à questão.' });
  }
});

// --- ROTA PARA REGISTRAR MÚLTIPLAS RESPOSTAS (EX: SIMULADO) ---
router.post('/responder-multiplo', async (req, res) => {
  try {
    const { usuarioId, respostas, tipoAtividade = 'pratica' } = req.body;

    if (
      !usuarioId ||
      !respostas ||
      !Array.isArray(respostas) ||
      respostas.length === 0
    ) {
      return res
        .status(400)
        .json({
          error: 'ID do usuário e array de respostas são obrigatórios.',
        });

    // Importar o serviço de resolução de questões
    const questoesResolucaoService = require('../services/questoesResolucaoService');

    // Registrar todas as respostas
    const resultado =
      await questoesResolucaoService.registrarMultiplasRespostas(
        usuarioId,
        respostas,
        tipoAtividade

    res.json({
      success: true,
      ...resultado,
    });
  } catch (err) {
    console.error('Erro ao registrar múltiplas respostas:', err);
    res.status(500).json({ error: 'Erro ao registrar múltiplas respostas.' });
  }
});

// --- ROTA PARA OBTÉM HISTÓRICO DE RESOLUÇÕES DE UM USUÁRIO ---
router.get('/historico/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    // Importar o serviço de resolução de questões
    const questoesResolucaoService = require('../services/questoesResolucaoService');

    const historico = await questoesResolucaoService.getHistoricoResolucoes(
      usuarioId,
      parseInt(limit),
      parseInt(offset)

    res.json({
      success: true,
      ...historico,
    });
  } catch (err) {
    console.error('Erro ao obter histórico de resoluções:', err);
    res.status(500).json({ error: 'Erro ao obter histórico de resoluções.' });
  }
});

// --- ROTA PARA OBTÉM ESTATÍSTICAS DE RESOLUÇÕES DE UM USUÁRIO ---
router.get('/estatisticas/:usuarioId', async (req, res) => {
  try {
    const { usuarioId } = req.params;

    // Importar o serviço de resolução de questões
    const questoesResolucaoService = require('../services/questoesResolucaoService');

    const estatisticas =
      await questoesResolucaoService.getEstatisticasResolucoes(usuarioId);

    res.json({
      success: true,
      ...estatisticas,
    });
  } catch (err) {
    console.error('Erro ao obter estatísticas de resoluções:', err);
    res
      .status(500)
      .json({ error: 'Erro ao obter estatísticas de resoluções.' });
  }
});

// --- ROTA PARA GERAR PLANO DE ESTUDOS COM IA ---
router.post('/generate-study-plan', requireAuth, async (req, res) => {
  try {
    const { perfil, materias, objetivo = 'enem' } = req.body;

    if (!perfil) {
      return res
        .status(400)
        .json({
          error: 'Perfil do usuário é obrigatório para gerar plano de estudos.',
        });

    console.log('Gerando plano de estudos para o perfil:', perfil);

    // Obter questões relevantes do banco de dados
    let questoesRelevantes = [];

    if (materias && materias.length > 0) {
      // Buscar questões das matérias selecionadas
      const placeholders = materias
        .map((_, index) => `${index + 1}`)
        .join(', ');
      const query = `SELECT * FROM questoes WHERE materia IN (${placeholders}) LIMIT 50`;
      const result = await db.query(query, materias);
      questoesRelevantes = result.rows;
    } else {
      // Buscar questões gerais
      const result = await db.query('SELECT * FROM questoes LIMIT 50');
      questoesRelevantes = result.rows;
    }

    // Gerar plano de estudos com IA
    const plano = await aiService.generateStudyPlan(perfil, questoesRelevantes);

    // Salvar o plano de estudos no banco de dados
    const titulo = `Plano de Estudos - ${perfil.area || 'Geral'}`;
    const descricao = `Plano de estudos gerado com IA para ${perfil.area || 'área geral'} com foco em ${materias?.join(', ') || 'matérias diversas'}`;

    const insertPlanoQuery = `
      INSERT INTO planos_estudo (usuario_id, titulo, descricao, configuracao, plano_gerado, objetivo)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id
    `;

    const insertResult = await db.query(insertPlanoQuery, [
      req.user.id,
      titulo,
      descricao,
      JSON.stringify(perfil),
      JSON.stringify(plano),
      objetivo,
    ]);

    const planoId = insertResult.rows[0].id;

    // Registrar atividade de gamificação
    const gamificacaoService = require('../services/gamificacaoService');
    await gamificacaoService.registrarAtividade(
      req.user.id,
      'geracao_plano_estudos',
      10

    res.json({
      success: true,
      plano,
      planoId,
      msg: 'Plano de estudos gerado e salvo com sucesso.'
    });
  } catch (err) {
    console.error('Erro ao gerar plano de estudos:', err);
    res.status(500).json({ error: 'Erro ao gerar plano de estudos.' });
  }
});

// --- ROTA PARA OBTER PLANOS DE ESTUDO DO USUÁRIO ---
router.get('/study-plans', requireAuth, async (req, res) => {
  try {
    const { status, objetivo } = req.query;

    let query =
      'SELECT id, titulo, descricao, configuracao, plano_gerado, data_criacao, data_atualizacao, status, objetivo FROM planos_estudo WHERE usuario_id = $1';
    const queryParams = [req.user.id];
    let paramIndex = 2;

    if (status) {
      query += ` AND status = ${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (objetivo) {
      query += ` AND objetivo = ${paramIndex}`;
      queryParams.push(objetivo);
      paramIndex++;
    }

    query += ' ORDER BY data_criacao DESC';

    const result = await db.query(query, queryParams);

    res.json({
      success: true,
      planos: result.rows
    });
  } catch (err) {
    console.error('Erro ao buscar planos de estudos:', err);
    res.status(500).json({ error: 'Erro ao buscar planos de estudos.' });
  }
});

// --- ROTA PARA OBTER UM PLANO DE ESTUDOS ESPECÍFICO ---
router.get('/study-plans/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const query =
      'SELECT * FROM planos_estudo WHERE usuario_id = $1 AND id = $2';
    const result = await db.query(query, [req.user.id, id]);

    if (result.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'Plano de estudos não encontrado.' });
    }

    res.json({
      success: true,
      plano: result.rows[0]
    });
  } catch (err) {
    console.error('Erro ao buscar plano de estudos:', err);
    res.status(500).json({ error: 'Erro ao buscar plano de estudos.' });
  }
});

// --- ROTA PARA ATUALIZAR STATUS DE UM PLANO DE ESTUDOS ---
router.put('/study-plans/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    // Verificar se o plano pertence ao usuário
    const existingPlano = await db.query(
      'SELECT id FROM planos_estudo WHERE usuario_id = $1 AND id = $2',
      [req.user.id, id]
    );

    if (existingPlano.rows.length === 0) {
      return res
        .status(404)
        .json({ error: 'Plano de estudos não encontrado.' });
    }

    // Atualizar o status do plano
    await db.query(
      'UPDATE planos_estudo SET status = $1, data_atualizacao = CURRENT_TIMESTAMP WHERE id = $2',
      [status, id]
    );

    res.json({
      success: true,
      msg: 'Status do plano de estudos atualizado com sucesso.'
    });
  } catch (err) {
    console.error('Erro ao atualizar plano de estudos:', err);
    res.status(500).json({ error: 'Erro ao atualizar plano de estudos.' });
  }
});

// --- ROTAS PARA TESTES PSICOLÓGICOS ---

// ROTA: Obter tipos de testes disponíveis
router.get('/test-types', (req, res) => {
  try {
    const tiposTestes = personalityTestsService.getTiposTestes();
    res.json({
      success: true,
      tiposTestes,
    });
  } catch (err) {
    console.error('Erro ao obter tipos de testes:', err);
    res.status(500).json({ error: 'Erro ao obter tipos de testes.' });
  }
});

// ROTA: Obter um teste específico
router.get('/test/:tipo', (req, res) => {
  try {
    const { tipo } = req.params;
    const teste = personalityTestsService.getTeste(tipo);

    res.json({
      success: true,
      teste,
    });
  } catch (err) {
    console.error('Erro ao obter teste:', err);
    res.status(500).json({ error: err.message });
  }
});

// ROTA: Processar respostas de um teste
router.post('/test/:tipo/process', async (req, res) => {
  try {
    const { tipo } = req.params;
    const { respostas } = req.body;

    if (!respostas) {
      return res.status(400).json({ error: 'Respostas não fornecidas.' });
    }

    const resultado = personalityTestsService.processarRespostas(
      tipo,
      respostas
    );

    res.json({
      success: true,
      resultado,
    });
  } catch (err) {
    console.error('Erro ao processar teste:', err);
    res.status(500).json({ error: err.message });
  }
});

// --- ROTA PARA EXTRAÇÃO DE ARQUIVO ESPECÍFICO (V12 FINAL) ---
router.post('/extract-local-files', async (req, res) => {
  const targetFile = '2020_PV_impresso_D1_CD1.pdf'; // Alvo do teste
  const provasDir = path.join(__dirname, '../../', 'Provas e gabaritos');
  const filePath = path.join(provasDir, targetFile);

  try {
    console.log(`Analisando a estrutura do arquivo: ${targetFile}`);
    const fs = require('fs');
    const dataBuffer = await fs.promises.readFile(filePath);

    const rendered_pages = [];
    const options = {
      async pagerender(pageData) {
        const textContent = await pageData.getTextContent({
          normalizeWhitespace: true,
        });
        rendered_pages.push(textContent.items);
        return '';
      },
    };
    const pdf = require('pdf-parse');
    await pdf(dataBuffer, options);

    res.json({
      msg: `PDF ${targetFile} lido com ${rendered_pages.length} páginas.`,
    });
  } catch (err) {
    console.error('Erro ao analisar o arquivo:', err);
    res
      .status(500)
      .json({ msg: 'Erro ao ler ou processar o arquivo PDF específico.' });
  }
});

module.exports = router;
