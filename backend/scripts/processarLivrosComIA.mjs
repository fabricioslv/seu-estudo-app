// Script avançado para processamento de livros com IA e embeddings
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import ollamaService from '../services/ollamaService.js';
import embeddingService from '../services/embeddingService.js';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

const workerSrcPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'pdfjs-dist',
  'legacy',
  'build',
  'pdf.worker.mjs'
);
pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerSrcPath).href;

// Configurações avançadas
const CONFIG = {
  CHUNK_SIZE: 800, // Tamanho dos chunks para embeddings
  CHUNK_OVERLAP: 150, // Sobreposição entre chunks
  MAX_PAGES: 100, // Máximo de páginas por livro
  DELAY_BETWEEN_REQUESTS: 200, // Delay entre requisições à IA
  BATCH_SIZE: 3, // Processar 3 livros por vez
};

class LivroProcessorComIA {
  constructor() {
    this.db = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.livrosProcessados = 0;
    this.embeddingsGerados = 0;
    this.erros = [];
  }

  async inicializar() {
    console.log('🚀 Inicializando processador avançado de livros...');

    // Inicializar serviços
    await ollamaService.initializeModels();
    await embeddingService.initialize();

    console.log('✅ Serviços inicializados');
  }

  async processarLivroComIA(fileName) {
    const livrosDir = path.join(__dirname, '..', '..', 'Livros didáticos');
    const pdfPath = path.join(livrosDir, fileName);

    if (!fs.existsSync(pdfPath)) {
      console.error('❌ Arquivo PDF não encontrado:', pdfPath);
      return null;
    }

    console.log(`🧠 Processando livro com IA: ${fileName}`);

    try {
      // 1. Extração básica do PDF
      const bookData = await this.extrairTextoPDF(pdfPath, fileName);

      // 2. Inserir livro no banco
      const livroId = await this.inserirLivro(bookData, fileName);

      // 3. Estruturação do conteúdo
      const structuredContent = await this.estruturarConteudo(bookData);

      // 4. Processamento com IA (resumos, conceitos, questões)
      const aiResults = await this.processarComIA(structuredContent, livroId);

      // 5. Geração de embeddings para busca semântica
      const embeddingResults = await this.gerarEmbeddings(
        livroId,
        structuredContent
      );

      return {
        fileName,
        livroId,
        paginasProcessadas: bookData.totalPages,
        conteudoEstruturado: structuredContent.length,
        aiProcessing: aiResults,
        embeddings: embeddingResults,
        status: 'success',
      };
    } catch (error) {
      console.error(`❌ Erro ao processar ${fileName}:`, error);
      this.erros.push({ livro: fileName, erro: error.message });
      return {
        fileName,
        status: 'error',
        erro: error.message,
      };
    }
  }

  async extrairTextoPDF(pdfPath, fileName) {
    console.log(`📖 Extraindo texto de: ${fileName}`);

    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const doc = await pdfjsLib.getDocument(data).promise;
    const numPages = Math.min(doc.numPages, CONFIG.MAX_PAGES);

    let currentChapter = 'Introdução';
    let currentSection = null;
    const pages = [];

    for (let i = 1; i <= numPages; i++) {
      try {
        const page = await doc.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item) => item.str)
          .join(' ')
          .trim();

        if (pageText) {
          // Detectar capítulos e seções
          const { chapter, section } = this.detectarEstrutura(pageText, i);

          if (chapter) currentChapter = chapter;
          if (section) currentSection = section;

          pages.push({
            pageNumber: i,
            text: pageText,
            chapter: currentChapter,
            section: currentSection,
          });
        }

        // Progresso
        if (i % 10 === 0) {
          console.log(`📄 Processadas ${i}/${numPages} páginas`);
        }
      } catch (error) {
        console.warn(`⚠️ Erro na página ${i}:`, error.message);
      }
    }

    return {
      fileName,
      totalPages: numPages,
      pages,
      textContent: pages.map((p) => p.text).join('\n'),
    };
  }

  detectarEstrutura(text, pageNumber) {
    let chapter = null;
    let section = null;

    // Padrões para detectar capítulos
    const chapterPatterns = [
      /CAPÍTULO\s+([IVXLCDM]+|\d+)/i,
      /Capítulo\s+([IVXLCDM]+|\d+)/i,
      /UNIDADE\s+([IVXLCDM]+|\d+)/i,
      /Unidade\s+([IVXLCDM]+|\d+)/i,
    ];

    // Padrões para detectar seções
    const sectionPatterns = [
      /([IVXLCDM]+|\d+)\.\s*([^\n\r]+)/,
      /([IVXLCDM]+|\d+\.\d+)\s+([^\n\r]+)/,
    ];

    // Detectar capítulo
    for (const pattern of chapterPatterns) {
      const match = text.match(pattern);
      if (match) {
        chapter = `Capítulo ${match[1]}`;
        break;
      }
    }

    // Detectar seção
    for (const pattern of sectionPatterns) {
      const match = text.match(pattern);
      if (match) {
        section = match[0].trim();
        break;
      }
    }

    return { chapter, section };
  }

  async inserirLivro(bookData, fileName) {
    try {
      const { data, error } = await this.db
        .from('livros')
        .insert({
          titulo: fileName,
          arquivo_pdf: fileName,
          autor: 'Autor não identificado',
          ano: new Date().getFullYear(),
          area: this.detectarMateria(fileName),
        })
        .select()
        .single();

      if (error) throw error;

      console.log(`💾 Livro inserido com ID: ${data.id}`);
      return data.id;
    } catch (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        // Livro já existe, buscar ID
        const { data } = await this.db
          .from('livros')
          .select('id')
          .eq('titulo', fileName)
          .single();

        return data.id;
      }
      throw error;
    }
  }

  detectarMateria(fileName) {
    const materiaKeywords = {
      matematica: [
        'mat',
        'math',
        'álgebra',
        'geometria',
        'cálculo',
        'trigonometria',
      ],
      portugues: ['português', 'língua', 'gramática', 'literatura'],
      fisica: ['física', 'fisica', 'mecânica', 'termodinâmica', 'ótica'],
      quimica: ['química', 'quimica', 'orgânica', 'inorgânica'],
      biologia: ['biologia', 'genética', 'ecologia', 'anatomia'],
      historia: ['história', 'historia'],
      geografia: ['geografia'],
      filosofia: ['filosofia'],
      sociologia: ['sociologia'],
    };

    for (const [materia, keywords] of Object.entries(materiaKeywords)) {
      for (const keyword of keywords) {
        if (fileName.toLowerCase().includes(keyword)) {
          return materia;
        }
      }
    }

    return 'geral';
  }

  async estruturarConteudo(bookData) {
    console.log('🏗️ Estruturando conteúdo do livro...');

    const structuredContent = [];
    let currentChapter = null;

    for (const page of bookData.pages) {
      if (page.chapter !== currentChapter) {
        currentChapter = page.chapter;
        structuredContent.push({
          tipo: 'capitulo',
          titulo: currentChapter,
          conteudo: [],
          pagina: page.pageNumber,
        });
      }

      if (page.text.trim()) {
        structuredContent[structuredContent.length - 1].conteudo.push({
          texto: page.text,
          pagina: page.pageNumber,
          secao: page.section,
        });
      }
    }

    return structuredContent;
  }

  async processarComIA(structuredContent, livroId) {
    console.log(`🤖 Processando conteúdo com IA para livro ${livroId}...`);

    const results = {
      processedChapters: 0,
      summaries: 0,
      concepts: 0,
      questions: 0,
      errors: [],
    };

    for (const chapter of structuredContent) {
      try {
        const chapterText = chapter.conteudo.map((c) => c.texto).join('\n');

        if (chapterText.length < 100) continue;

        // Gerar resumo com IA
        const summary = await ollamaService.summarizeContent(chapterText);
        chapter.ai_summary = summary;
        results.summaries++;

        // Extrair conceitos-chave
        const concepts = await ollamaService.extractKeyConcepts(chapterText);
        chapter.ai_concepts = concepts;
        results.concepts++;

        // Gerar questões
        const questions = await ollamaService.generateQuestions(
          chapterText,
          'medio',
          2
        );
        chapter.ai_questions = questions.questoes || [];
        results.questions += chapter.ai_questions.length;

        // Salvar capítulo processado no banco
        await this.salvarCapituloProcessado(livroId, chapter);

        results.processedChapters++;

        console.log(`✅ Capítulo "${chapter.titulo}" processado com IA`);

        // Pausa entre requisições
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIG.DELAY_BETWEEN_REQUESTS)
        );
      } catch (error) {
        console.error(
          `❌ Erro ao processar capítulo "${chapter.titulo}":`,
          error.message
        );
        results.errors.push(`Capítulo ${chapter.titulo}: ${error.message}`);
      }
    }

    return results;
  }

  async salvarCapituloProcessado(livroId, chapter) {
    try {
      // Inserir capítulo
      const { data: capituloData, error: capituloError } = await this.db
        .from('capitulos')
        .insert({
          livro_id: livroId,
          titulo: chapter.titulo,
          pagina_inicial: chapter.pagina,
          pagina_final: chapter.pagina,
        })
        .select()
        .single();

      if (capitulouloError) throw capituloError;

      // Salvar conteúdo processado
      for (const conteudo of chapter.conteudo) {
        await this.db.from('conteudos').insert({
          livro_id: livroId,
          capitulo_id: capituloData.id,
          tipo: 'teoria',
          texto: conteudo.texto,
          pagina_inicial: conteudo.pagina,
          pagina_final: conteudo.pagina,
        });
      }

      // Salvar dados de IA se disponíveis
      if (chapter.ai_summary || chapter.ai_concepts) {
        await this.db.from('conteudos').insert({
          livro_id: livroId,
          capitulo_id: capituloData.id,
          tipo: 'ai_processed',
          texto: JSON.stringify({
            summary: chapter.ai_summary,
            concepts: chapter.ai_concepts,
            questions: chapter.ai_questions,
          }),
          pagina_inicial: chapter.pagina,
          pagina_final: chapter.pagina,
        });
      }
    } catch (error) {
      console.error('Erro ao salvar capítulo processado:', error);
      throw error;
    }
  }

  async gerarEmbeddings(livroId, structuredContent) {
    console.log(`🧠 Gerando embeddings para livro ${livroId}...`);

    try {
      // Criar chunks para embeddings
      const chunks = [];

      for (const chapter of structuredContent) {
        const chapterText = chapter.conteudo.map((c) => c.texto).join('\n');

        // Dividir texto em chunks
        const words = chapterText.split(' ');
        for (
          let i = 0;
          i < words.length;
          i += CONFIG.CHUNK_SIZE - CONFIG.CHUNK_OVERLAP
        ) {
          const chunkWords = words.slice(i, i + CONFIG.CHUNK_SIZE);
          const chunkText = chunkWords.join(' ');

          if (chunkText.trim()) {
            chunks.push({
              text: chunkText,
              chapter: chapter.titulo,
              page: chapter.pagina,
              wordCount: chunkWords.length,
            });
          }
        }
      }

      console.log(`📝 Criados ${chunks.length} chunks para embeddings`);

      // Processar com serviço de embeddings
      const results = await embeddingService.generateBookEmbeddings(
        livroId,
        chunks
      );

      this.embeddingsGerados += results.generatedEmbeddings;

      return results;
    } catch (error) {
      console.error('Erro ao gerar embeddings:', error);
      throw error;
    }
  }

  async processarTodosLivrosComIA() {
    console.log('🚀 Iniciando processamento avançado de livros com IA...');

    await this.inicializar();

    const livrosDir = path.join(__dirname, '..', '..', 'Livros didáticos');
    if (!fs.existsSync(livrosDir)) {
      console.error('❌ Diretório de livros não encontrado');
      return;
    }

    const livros = fs
      .readdirSync(livrosDir)
      .filter((file) => file.endsWith('.pdf'))
      .slice(0, 5); // Limitar a 5 livros para teste

    console.log(`📚 Encontrados ${livros.length} livros para processar`);

    // Processar em lotes
    for (let i = 0; i < livros.length; i += CONFIG.BATCH_SIZE) {
      const batch = livros.slice(i, i + CONFIG.BATCH_SIZE);
      console.log(
        `\n🔄 Processando lote ${Math.floor(i / CONFIG.BATCH_SIZE) + 1} com ${batch.length} livros`
      );

      const batchPromises = batch.map((livro) =>
        this.processarLivroComIA(livro)
      );
      const batchResults = await Promise.all(batchPromises);

      // Aguardar entre lotes para não sobrecarregar
      if (i + CONFIG.BATCH_SIZE < livros.length) {
        console.log('⏳ Aguardando antes do próximo lote...');
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }

    // Relatório final
    console.log('\n📊 RELATÓRIO FINAL DE PROCESSAMENTO COM IA:');
    console.log(`✅ Livros processados: ${this.livrosProcessados}`);
    console.log(`🧠 Embeddings gerados: ${this.embeddingsGerados}`);
    console.log(`❌ Erros: ${this.erros.length}`);

    if (this.erros.length > 0) {
      console.log('\n🚨 ERROS ENCONTRADOS:');
      this.erros.forEach((erro) => {
        console.log(`- ${erro.livro}: ${erro.erro}`);
      });
    }

    console.log('🎉 Processamento avançado concluído!');
  }
}

// Função principal
async function main() {
  const processor = new LivroProcessorComIA();
  await processor.processarTodosLivrosComIA();
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { LivroProcessorComIA };
