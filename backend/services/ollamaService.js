// Serviço de integração com Ollama para processamento avançado de livros
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

class OllamaService {
  constructor() {
    this.baseURL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
    this.models = {
      embedding: 'nomic-embed-text', // Modelo de embeddings
      chat: 'llama3.1:8b', // Modelo para chat e análise
      summarization: 'llama3.1:8b', // Modelo para resumos
    };
    this.isConnected = false;
  }

  async checkConnection() {
    try {
      const response = await fetch(`${this.baseURL}/api/tags`);
      if (response.ok) {
        this.isConnected = true;
        console.log('✅ Ollama conectado com sucesso');
        return true;
      }
    } catch (error) {
      console.warn('⚠️ Ollama não disponível:', error.message);
      this.isConnected = false;
      return false;
    }
    return false;
  }

  async listModels() {
    try {
      const response = await fetch(`${this.baseURL}/api/tags`);
      const data = await response.json();
      return data.models || [];
    } catch (error) {
      console.error('Erro ao listar modelos:', error);
      return [];
    }
  }

  async generateEmbedding(text) {
    if (!this.isConnected) {
      await this.checkConnection();
      if (!this.isConnected) {
        throw new Error('Ollama não disponível');
      }
    }

    try {
      const response = await fetch(`${this.baseURL}/api/embeddings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.models.embedding,
          prompt: text,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data = await response.json();
      return data.embedding;
    } catch (error) {
      console.error('Erro ao gerar embedding:', error);
      throw error;
    }
  }

  async chatWithBook(content, question) {
    if (!this.isConnected) {
      await this.checkConnection();
      if (!this.isConnected) {
        throw new Error('Ollama não disponível');
      }
    }

    try {
      const prompt = `
Você é um assistente especializado em livros didáticos. Baseado no seguinte conteúdo do livro:

${content}

Responda à seguinte pergunta do estudante de forma clara e educativa:
${question}

Resposta:`;

      const response = await fetch(`${this.baseURL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.models.chat,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.3,
            top_p: 0.9,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Erro no chat com livro:', error);
      throw error;
    }
  }

  async summarizeContent(content, maxLength = 500) {
    if (!this.isConnected) {
      await this.checkConnection();
      if (!this.isConnected) {
        throw new Error('Ollama não disponível');
      }
    }

    try {
      const prompt = `
Resuma o seguinte conteúdo de livro didático de forma clara e estruturada.
Mantenha os conceitos principais e exemplos importantes.
Limite o resumo a aproximadamente ${maxLength} caracteres.

Conteúdo:
${content}

Resumo estruturado:`;

      const response = await fetch(`${this.baseURL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.models.summarization,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.2,
            top_p: 0.8,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Erro ao resumir conteúdo:', error);
      throw error;
    }
  }

  async extractKeyConcepts(content) {
    if (!this.isConnected) {
      await this.checkConnection();
      if (!this.isConnected) {
        throw new Error('Ollama não disponível');
      }
    }

    try {
      const prompt = `
Analise o seguinte conteúdo de livro didático e extraia os conceitos-chave,
fórmulas importantes e definições principais. Retorne em formato JSON estruturado.

Conteúdo:
${content}

Retorne apenas JSON válido com a seguinte estrutura:
{
  "conceitos": ["conceito1", "conceito2"],
  "formulas": ["fórmula1", "fórmula2"],
  "definicoes": ["definição1", "definição2"],
  "exemplos": ["exemplo1", "exemplo2"]
}`;

      const response = await fetch(`${this.baseURL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.models.chat,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.1,
            top_p: 0.9,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data = await response.json();
      try {
        return JSON.parse(data.response);
      } catch (parseError) {
        console.warn('Erro ao parsear JSON da resposta:', parseError);
        return {
          conceitos: [],
          formulas: [],
          definicoes: [],
          exemplos: [],
        };
      }
    } catch (error) {
      console.error('Erro ao extrair conceitos-chave:', error);
      throw error;
    }
  }

  async generateQuestions(content, difficulty = 'medio', numQuestions = 5) {
    if (!this.isConnected) {
      await this.checkConnection();
      if (!this.isConnected) {
        throw new Error('Ollama não disponível');
      }
    }

    try {
      const prompt = `
Baseado no seguinte conteúdo de livro didático, gere ${numQuestions} questões de múltipla escolha.
Nível de dificuldade: ${difficulty}
Cada questão deve ter 4 alternativas (A, B, C, D) e apenas uma correta.

Conteúdo:
${content}

Retorne apenas JSON válido com a seguinte estrutura:
{
  "questoes": [
    {
      "enunciado": "Texto da questão?",
      "alternativas": {
        "A": "Alternativa A",
        "B": "Alternativa B",
        "C": "Alternativa C",
        "D": "Alternativa D"
      },
      "resposta_correta": "B",
      "explicacao": "Explicação da resposta correta"
    }
  ]
}`;

      const response = await fetch(`${this.baseURL}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.models.chat,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.4,
            top_p: 0.9,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }

      const data = await response.json();
      try {
        return JSON.parse(data.response);
      } catch (parseError) {
        console.warn('Erro ao parsear JSON das questões:', parseError);
        return { questoes: [] };
      }
    } catch (error) {
      console.error('Erro ao gerar questões:', error);
      throw error;
    }
  }

  async semanticSearch(query, embeddings, topK = 5) {
    if (!this.isConnected) {
      await this.checkConnection();
      if (!this.isConnected) {
        throw new Error('Ollama não disponível');
      }
    }

    try {
      // Gerar embedding da consulta
      const queryEmbedding = await this.generateEmbedding(query);

      // Calcular similaridade com embeddings existentes
      const results = embeddings.map((item, index) => {
        const similarity = this.cosineSimilarity(
          queryEmbedding,
          item.embedding
        );
        return {
          index,
          content: item.content,
          similarity,
          metadata: item.metadata,
        };
      });

      // Ordenar por similaridade e retornar top K
      results.sort((a, b) => b.similarity - a.similarity);
      return results.slice(0, topK);
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

  async processBookWithAI(bookContent, bookId) {
    console.log(`🧠 Processando livro ${bookId} com IA local...`);

    const results = {
      bookId,
      processedChapters: 0,
      generatedEmbeddings: 0,
      extractedConcepts: 0,
      generatedQuestions: 0,
      summaries: 0,
      errors: [],
    };

    try {
      // Processar cada capítulo/capítulo
      for (const chapter of bookContent) {
        console.log(`📖 Processando capítulo: ${chapter.titulo}`);

        // Gerar resumo do capítulo
        if (chapter.conteudo && chapter.conteudo.length > 100) {
          try {
            const summary = await this.summarizeContent(chapter.conteudo);
            chapter.ai_summary = summary;
            results.summaries++;
            console.log(`✅ Resumo gerado para capítulo ${chapter.titulo}`);
          } catch (error) {
            console.warn(
              `⚠️ Erro ao resumir capítulo ${chapter.titulo}:`,
              error.message
            );
            results.errors.push(
              `Erro no resumo do capítulo ${chapter.titulo}: ${error.message}`
            );
          }
        }

        // Extrair conceitos-chave
        if (chapter.conteudo && chapter.conteudo.length > 50) {
          try {
            const concepts = await this.extractKeyConcepts(chapter.conteudo);
            chapter.ai_concepts = concepts;
            results.extractedConcepts++;
            console.log(
              `✅ Conceitos extraídos para capítulo ${chapter.titulo}`
            );
          } catch (error) {
            console.warn(
              `⚠️ Erro ao extrair conceitos do capítulo ${chapter.titulo}:`,
              error.message
            );
            results.errors.push(
              `Erro na extração de conceitos do capítulo ${chapter.titulo}: ${error.message}`
            );
          }
        }

        // Gerar questões para o capítulo
        if (chapter.conteudo && chapter.conteudo.length > 200) {
          try {
            const questions = await this.generateQuestions(
              chapter.conteudo,
              'medio',
              3
            );
            chapter.ai_questions = questions.questoes || [];
            results.generatedQuestions += chapter.ai_questions.length;
            console.log(
              `✅ ${chapter.ai_questions.length} questões geradas para capítulo ${chapter.titulo}`
            );
          } catch (error) {
            console.warn(
              `⚠️ Erro ao gerar questões para capítulo ${chapter.titulo}:`,
              error.message
            );
            results.errors.push(
              `Erro na geração de questões do capítulo ${chapter.titulo}: ${error.message}`
            );
          }
        }

        results.processedChapters++;
      }

      console.log(`🎉 Livro ${bookId} processado com IA. Resumo:`, results);
      return results;
    } catch (error) {
      console.error(`❌ Erro ao processar livro ${bookId} com IA:`, error);
      results.errors.push(`Erro geral no processamento: ${error.message}`);
      return results;
    }
  }

  async initializeModels() {
    console.log('🚀 Inicializando modelos Ollama...');

    const requiredModels = [this.models.embedding, this.models.chat];

    for (const model of requiredModels) {
      try {
        console.log(`📥 Verificando modelo: ${model}`);

        // Tentar puxar o modelo se não existir
        const response = await fetch(`${this.baseURL}/api/pull`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: model,
          }),
        });

        if (response.ok) {
          console.log(`✅ Modelo ${model} inicializado com sucesso`);
        } else {
          console.warn(`⚠️ Problema ao inicializar modelo ${model}`);
        }
      } catch (error) {
        console.warn(`⚠️ Erro ao inicializar modelo ${model}:`, error.message);
      }
    }
  }

  getStatus() {
    return {
      connected: this.isConnected,
      baseURL: this.baseURL,
      models: this.models,
      timestamp: new Date().toISOString(),
    };
  }
}

// Exportar singleton
const ollamaService = new OllamaService();
export default ollamaService;
