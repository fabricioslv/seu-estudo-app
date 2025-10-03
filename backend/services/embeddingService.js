// Serviço de Embeddings para busca semântica em livros didáticos
import ollamaService from './ollamaService.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

class EmbeddingService {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.embeddingsCache = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    console.log('🚀 Inicializando serviço de embeddings...');

    // Verificar conexão com Ollama
    const ollamaConnected = await ollamaService.checkConnection();
    if (!ollamaConnected) {
      console.warn(
        '⚠️ Ollama não disponível. Funcionalidades de IA limitadas.'
      );
    }

    // Criar tabela de embeddings se não existir
    await this.createEmbeddingsTable();

    this.isInitialized = true;
    console.log('✅ Serviço de embeddings inicializado');
  }

  async createEmbeddingsTable() {
    try {
      const { error } = await this.supabase.rpc('create_embeddings_table', {
        sql: `
                    CREATE TABLE IF NOT EXISTS livro_embeddings (
                        id SERIAL PRIMARY KEY,
                        livro_id INTEGER REFERENCES livros(id) ON DELETE CASCADE,
                        conteudo_id INTEGER REFERENCES conteudos(id) ON DELETE CASCADE,
                        chunk_text TEXT NOT NULL,
                        embedding VECTOR(768), -- Tamanho do embedding do nomic-embed-text
                        metadata JSONB,
                        created_at TIMESTAMPTZ DEFAULT now()
                    );

                    CREATE INDEX IF NOT EXISTS idx_livro_embeddings_livro_id ON livro_embeddings(livro_id);
                    CREATE INDEX IF NOT EXISTS idx_livro_embeddings_conteudo_id ON livro_embeddings(conteudo_id);
                    CREATE INDEX IF NOT EXISTS idx_livro_embeddings_embedding ON livro_embeddings USING ivfflat (embedding vector_cosine_ops);
                `,
      });

      if (error) {
        console.warn('⚠️ Erro ao criar tabela de embeddings:', error);
      } else {
        console.log('✅ Tabela de embeddings criada/verificada');
      }
    } catch (error) {
      console.error('❌ Erro ao criar tabela de embeddings:', error);
    }
  }

  async generateBookEmbeddings(bookId, chunks) {
    console.log(
      `🧠 Gerando embeddings para livro ${bookId} (${chunks.length} chunks)...`
    );

    const results = {
      bookId,
      processedChunks: 0,
      generatedEmbeddings: 0,
      errors: [],
    };

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];

      try {
        // Verificar se embedding já existe
        const existing = await this.getEmbeddingByContent(chunk.text);
        if (existing) {
          console.log(
            `⏭️ Embedding já existe para chunk ${i + 1}/${chunks.length}`
          );
          results.processedChunks++;
          continue;
        }

        // Gerar embedding com Ollama
        const embedding = await ollamaService.generateEmbedding(chunk.text);

        // Salvar no banco
        await this.saveEmbedding(bookId, chunk, embedding);

        results.processedChunks++;
        results.generatedEmbeddings++;

        console.log(`✅ Embedding gerado para chunk ${i + 1}/${chunks.length}`);

        // Pausa para não sobrecarregar
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`❌ Erro no chunk ${i + 1}:`, error.message);
        results.errors.push(`Chunk ${i + 1}: ${error.message}`);
      }
    }

    console.log(`🎉 Embeddings gerados para livro ${bookId}:`, results);
    return results;
  }

  async saveEmbedding(bookId, chunk, embedding) {
    try {
      const { error } = await this.supabase.from('livro_embeddings').insert({
        livro_id: bookId,
        conteudo_id: chunk.conteudoId || null,
        chunk_text: chunk.text,
        embedding: embedding,
        metadata: {
          chunk_index: chunk.index,
          chapter: chunk.chapter,
          topic: chunk.topic,
          page: chunk.page,
          word_count: chunk.text.split(' ').length,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Erro ao salvar embedding:', error);
      throw error;
    }
  }

  async getEmbeddingByContent(text) {
    try {
      const { data, error } = await this.supabase
        .from('livro_embeddings')
        .select('*')
        .eq('chunk_text', text)
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 = no rows returned
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Erro ao buscar embedding:', error);
      return null;
    }
  }

  async semanticSearch(query, livroId = null, topK = 5) {
    try {
      console.log(
        `🔍 Busca semântica: "${query}" (livro: ${livroId || 'todos'})`
      );

      // Gerar embedding da consulta
      const queryEmbedding = await ollamaService.generateEmbedding(query);

      // Buscar embeddings similares
      let queryBuilder = this.supabase
        .from('livro_embeddings')
        .select('*')
        .limit(100); // Buscar mais para filtrar depois

      if (livroId) {
        queryBuilder = queryBuilder.eq('livro_id', livroId);
      }

      const { data: embeddings, error } = await queryBuilder;

      if (error) {
        throw error;
      }

      if (!embeddings || embeddings.length === 0) {
        return [];
      }

      // Calcular similaridade usando cosine similarity
      const results = embeddings.map((embedding) => {
        const similarity = this.cosineSimilarity(
          queryEmbedding,
          embedding.embedding
        );
        return {
          id: embedding.id,
          livro_id: embedding.livro_id,
          chunk_text: embedding.chunk_text,
          similarity,
          metadata: embedding.metadata,
          created_at: embedding.created_at,
        };
      });

      // Ordenar por similaridade e retornar top K
      results.sort((a, b) => b.similarity - a.similarity);

      const topResults = results.slice(0, topK);

      console.log(`✅ Encontrados ${topResults.length} resultados relevantes`);
      return topResults;
    } catch (error) {
      console.error('Erro na busca semântica:', error);
      throw error;
    }
  }

  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) {
      return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async createChunksFromBookContent(
    bookContent,
    chunkSize = 1000,
    overlap = 200
  ) {
    const chunks = [];
    let chunkIndex = 0;

    for (const chapter of bookContent) {
      if (!chapter.conteudo || chapter.conteudo.length === 0) continue;

      const words = chapter.conteudo.split(' ');
      let startIndex = 0;

      while (startIndex < words.length) {
        const endIndex = Math.min(startIndex + chunkSize, words.length);
        const chunkWords = words.slice(startIndex, endIndex);
        const chunkText = chunkWords.join(' ');

        chunks.push({
          index: chunkIndex++,
          text: chunkText,
          chapter: chapter.titulo || 'Capítulo sem título',
          topic: chapter.topico || null,
          page: chapter.pagina || null,
          wordCount: chunkWords.length,
          conteudoId: chapter.id || null,
        });

        // Avançar com overlap
        startIndex += chunkSize - overlap;
      }
    }

    console.log(`📝 Criados ${chunks.length} chunks para processamento`);
    return chunks;
  }

  async processBookWithEmbeddings(bookId, bookContent) {
    console.log(`🚀 Processando livro ${bookId} com embeddings...`);

    const results = {
      bookId,
      chunksCreated: 0,
      embeddingsGenerated: 0,
      errors: [],
    };

    try {
      // Criar chunks do conteúdo
      const chunks = await this.createChunksFromBookContent(bookContent);
      results.chunksCreated = chunks.length;

      if (chunks.length === 0) {
        console.log('⚠️ Nenhum chunk criado. Conteúdo vazio?');
        return results;
      }

      // Gerar embeddings para cada chunk
      const embeddingResults = await this.generateBookEmbeddings(
        bookId,
        chunks
      );
      results.embeddingsGenerated = embeddingResults.generatedEmbeddings;
      results.errors = embeddingResults.errors;

      console.log(`🎉 Livro ${bookId} processado com embeddings:`, results);
      return results;
    } catch (error) {
      console.error(`❌ Erro ao processar livro ${bookId}:`, error);
      results.errors.push(`Erro geral: ${error.message}`);
      return results;
    }
  }

  async getBookRecommendations(userId, livroId, topK = 3) {
    try {
      // Buscar padrões de estudo do usuário
      const { data: userHistory, error } = await this.supabase
        .from('resultados_simulado')
        .select('materia, pontuacao')
        .eq('usuario_id', userId)
        .order('data_realizacao', { ascending: false })
        .limit(10);

      if (error) throw error;

      if (!userHistory || userHistory.length === 0) {
        return [];
      }

      // Analisar matérias de interesse
      const materiasInteresse = {};
      userHistory.forEach((result) => {
        if (!materiasInteresse[result.materia]) {
          materiasInteresse[result.materia] = [];
        }
        materiasInteresse[result.materia].push(result.pontuacao);
      });

      // Calcular média por matéria
      const materiasComMedia = Object.entries(materiasInteresse)
        .map(([materia, pontuacoes]) => ({
          materia,
          media: pontuacoes.reduce((a, b) => a + b, 0) / pontuacoes.length,
          tentativas: pontuacoes.length,
        }))
        .sort((a, b) => b.media - a.media);

      // Buscar livros relacionados às matérias de interesse
      const recommendations = [];

      for (const materiaData of materiasComMedia.slice(0, 2)) {
        // Top 2 matérias
        const { data: livros, error } = await this.supabase
          .from('livros')
          .select('*')
          .eq('materia', materiaData.materia)
          .neq('id', livroId)
          .limit(topK);

        if (!error && livros) {
          recommendations.push(
            ...livros.map((livro) => ({
              ...livro,
              razao: `Relacionado à sua performance em ${materiaData.materia}`,
              score: materiaData.media,
            }))
          );
        }
      }

      return recommendations.slice(0, topK);
    } catch (error) {
      console.error('Erro ao gerar recomendações:', error);
      return [];
    }
  }

  async getSimilarContent(chunkText, livroId = null, topK = 3) {
    try {
      return await this.semanticSearch(chunkText, livroId, topK);
    } catch (error) {
      console.error('Erro ao buscar conteúdo similar:', error);
      return [];
    }
  }

  async cleanupOldEmbeddings(daysOld = 30) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);

      const { error } = await this.supabase
        .from('livro_embeddings')
        .delete()
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;

      console.log(`🧹 Embeddings antigos removidos (mais de ${daysOld} dias)`);
      return true;
    } catch (error) {
      console.error('Erro ao limpar embeddings antigos:', error);
      return false;
    }
  }

  getStats() {
    return {
      isInitialized: this.isInitialized,
      cacheSize: this.embeddingsCache.size,
      timestamp: new Date().toISOString(),
    };
  }
}

const embeddingService = new EmbeddingService();
export default embeddingService;
