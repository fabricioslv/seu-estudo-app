// Rotas para busca avançada em livros com IA e embeddings
const express = require('express');
const ollamaService = require('../services/ollamaService.js');
const embeddingService = require('../services/embeddingService.js');

const router = express.Router();

// Middleware de autenticação
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: true, msg: 'Token não fornecido' });
  }
  // Validar token (simplificado)
  req.userId = 1; // Mock para desenvolvimento
  next();
};

// Busca semântica em livros
router.post('/search', authMiddleware, async (req, res) => {
  try {
    const { query, livroId, topK = 5 } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: true,
        msg: 'Consulta não fornecida',
      });
    }

    console.log(`🔍 Busca semântica: "${query}"`);

    // Realizar busca semântica
    const results = await embeddingService.semanticSearch(query, livroId, topK);

    // Formatar resultados para resposta
    const formattedResults = results.map((result) => ({
      id: result.id,
      livro_id: result.livro_id,
      texto: result.chunk_text,
      similaridade: Math.round(result.similarity * 100) / 100,
      metadados: result.metadata,
    }));

    res.json({
      query,
      results: formattedResults,
      total: formattedResults.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro na busca semântica:', error);
    res.status(500).json({
      error: true,
      msg: 'Erro interno do servidor',
      detalhes: error.message,
    });
  }
});

// Chat com livro específico
router.post('/:livroId/chat', authMiddleware, async (req, res) => {
  try {
    const { livroId } = req.params;
    const { question, contexto } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        error: true,
        msg: 'Pergunta não fornecida',
      });
    }

    console.log(`💬 Chat com livro ${livroId}: "${question}"`);

    // Buscar conteúdo relevante do livro
    const relevantContent = await embeddingService.getSimilarContent(
      question,
      livroId,
      3
    );

    if (relevantContent.length === 0) {
      return res.status(404).json({
        error: true,
        msg: 'Conteúdo relevante não encontrado no livro',
      });
    }

    // Combinar conteúdo relevante
    const contextText = relevantContent
      .map((item) => item.chunk_text)
      .join('\n\n');

    // Gerar resposta com IA
    const resposta = await ollamaService.chatWithBook(contextText, question);

    res.json({
      livro_id: livroId,
      pergunta: question,
      resposta,
      contexto_usado: relevantContent.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro no chat com livro:', error);
    res.status(500).json({
      error: true,
      msg: 'Erro interno do servidor',
      detalhes: error.message,
    });
  }
});

// Obter recomendações de livros baseadas no desempenho
router.get('/recommendations', authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Buscar livros já lidos/estudados pelo usuário
    const { data: livrosEstudados, error } = await req.db
      .from('resultados_simulado')
      .select('livro_id')
      .eq('usuario_id', userId)
      .not('livro_id', 'is', null);

    if (error) throw error;

    const livroIds = livrosEstudados
      .map((item) => item.livro_id)
      .filter(Boolean);

    if (livroIds.length === 0) {
      return res.json({
        recomendacoes: [],
        msg: 'Estude alguns livros para receber recomendações personalizadas',
      });
    }

    // Gerar recomendações
    const recomendacoes = [];
    for (const livroId of livroIds.slice(0, 3)) {
      // Limitar a 3 livros
      const recs = await embeddingService.getBookRecommendations(
        userId,
        livroId,
        2
      );
      recomendacoes.push(...recs);
    }

    // Remover duplicatas
    const uniqueRecomendacoes = recomendacoes.filter(
      (rec, index, self) => index === self.findIndex((r) => r.id === rec.id)
    );

    res.json({
      recomendacoes: uniqueRecomendacoes.slice(0, 5),
      baseado_em: livroIds.length,
      total_encontrado: uniqueRecomendacoes.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao gerar recomendações:', error);
    res.status(500).json({
      error: true,
      msg: 'Erro interno do servidor',
      detalhes: error.message,
    });
  }
});

// Obter estatísticas de processamento com IA
router.get('/ai/stats', authMiddleware, async (req, res) => {
  try {
    const ollamaStatus = ollamaService.getStatus();
    const embeddingStats = embeddingService.getStats();

    res.json({
      ollama: ollamaStatus,
      embeddings: embeddingStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({
      error: true,
      msg: 'Erro interno do servidor',
      detalhes: error.message,
    });
  }
});

// Processar livro com IA (endpoint administrativo)
router.post('/:livroId/process-ai', authMiddleware, async (req, res) => {
  try {
    const { livroId } = req.params;

    // Verificar se usuário é admin/professor
    if (req.userTipo !== 'professor' && req.userTipo !== 'admin') {
      return res.status(403).json({
        error: true,
        msg: 'Acesso negado',
      });
    }

    console.log(`🚀 Processando livro ${livroId} com IA...`);

    // Buscar conteúdo do livro
    const { data: livro, error: livroError } = await req.db
      .from('livros')
      .select('*')
      .eq('id', livroId)
      .single();

    if (livroError) throw livroError;

    // Buscar capítulos e conteúdo
    const { data: capitulos, error: capitulosError } = await req.db
      .from('capitulos')
      .select(
        `
                *,
                conteudos (*)
            `
      )
      .eq('livro_id', livroId);

    if (capitulosError) throw capitulosError;

    // Processar com IA
    const aiResults = await ollamaService.processBookWithAI(capitulos, livroId);

    res.json({
      livro_id: livroId,
      livro_titulo: livro.titulo,
      processamento_ia: aiResults,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao processar livro com IA:', error);
    res.status(500).json({
      error: true,
      msg: 'Erro interno do servidor',
      detalhes: error.message,
    });
  }
});

// Busca avançada com filtros
router.post('/advanced-search', authMiddleware, async (req, res) => {
  try {
    const {
      query,
      livroId,
      materia,
      dificuldade,
      topK = 10,
      includeAI = true,
    } = req.body;

    if (!query || query.trim().length === 0) {
      return res.status(400).json({
        error: true,
        msg: 'Consulta não fornecida',
      });
    }

    console.log(`🔍 Busca avançada: "${query}"`);

    // Busca semântica básica
    const semanticResults = await embeddingService.semanticSearch(
      query,
      livroId,
      topK * 2
    );

    // Aplicar filtros adicionais se necessário
    let filteredResults = semanticResults;

    if (materia) {
      // Buscar IDs de livros da matéria específica
      const { data: livrosMateria, error } = await req.db
        .from('livros')
        .select('id')
        .eq('materia', materia);

      if (!error && livrosMateria) {
        const livroIds = livrosMateria.map((l) => l.id);
        filteredResults = filteredResults.filter((result) =>
          livroIds.includes(result.livro_id)
        );
      }
    }

    // Limitar resultados finais
    const finalResults = filteredResults.slice(0, topK);

    // Buscar dados adicionais se solicitado
    if (includeAI && finalResults.length > 0) {
      for (const result of finalResults) {
        try {
          // Buscar informações do livro
          const { data: livro, error } = await req.db
            .from('livros')
            .select('titulo, materia, autor')
            .eq('id', result.livro_id)
            .single();

          if (!error && livro) {
            result.livro_info = livro;
          }
        } catch (error) {
          console.warn('Erro ao buscar info do livro:', error);
        }
      }
    }

    res.json({
      query,
      filtros: { materia, dificuldade },
      results: finalResults,
      total: finalResults.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro na busca avançada:', error);
    res.status(500).json({
      error: true,
      msg: 'Erro interno do servidor',
      detalhes: error.message,
    });
  }
});

// Obter modelos disponíveis do Ollama
router.get('/ai/models', authMiddleware, async (req, res) => {
  try {
    const models = await ollamaService.listModels();

    res.json({
      models,
      total: models.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Erro ao listar modelos:', error);
    res.status(500).json({
      error: true,
      msg: 'Erro interno do servidor',
      detalhes: error.message,
    });
  }
});

// --- ROTA PARA ATUALIZAÇÕES DE LIVROS ---
// Endpoint para buscar atualizações de livros para sincronização offline
router.post('/atualizacoes', authMiddleware, async (req, res) => {
  try {
    const { lastSync } = req.body;
    
    // Validar entrada
    if (!lastSync) {
      return res.status(400).json({ 
        error: 'Parâmetro lastSync é obrigatório' 
      });
    }
    
    // Converter lastSync para data
    const lastSyncDate = new Date(lastSync);
    
    // Buscar livros modificados desde a última sincronização
    const { data: livros, error } = await req.db
      .from('livros')
      .select('*')
      .gt('updated_at', lastSyncDate.toISOString())
      .order('updated_at', { ascending: false })
      .limit(100);
    
    if (error) {
      throw new Error(error.message);
    }
    
    res.json({
      livros,
      total: livros.length,
      timestamp: new Date().toISOString(),
      lastSync: lastSyncDate.toISOString()
    });
    
  } catch (error) {
    console.error('Erro ao buscar atualizações de livros:', error);
    res.status(500).json({ 
      error: 'Erro ao buscar atualizações de livros' 
    });
  }
});

module.exports = router;
