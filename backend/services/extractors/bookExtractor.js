// services/extractors/bookExtractor.js
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import pdfjsLib from 'pdfjs-dist';

// Configuração para usar a versão de Node.js do pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

class BookExtractor {
  constructor() {
    // Padrões para identificar diferentes tipos de conteúdo em livros didáticos
    this.contentPatterns = {
      // Padrões para identificar títulos e subtítulos
      titlePattern:
        /^(#{1,6}\\s+|\\d+[\\.\\s]\\d*\\.?\\s*|[IVX]+[\\.\\s]|Cap[íi]tulo\\s+\\d+[:\\s]|Se[cç][ãa]o\\s+\\d+[:\\s])/i,

      // Padrões para identificar definições
      definitionPattern:
        /(defini[çc][ãa]o|significado|o que [ée]|conceito de):?\\s*([^.!?]+)[.!?]/i,

      // Padrões para identificar exemplos
      examplePattern:
        /(exemplo|exemplificando|por exemplo|caso|casos):\\s*([^.!?]+)[.!?]/i,

      // Padrões para identificar exercícios
      exercisePattern:
        /(exerc[ií]cio|atividade|pr[áa]tica|teste|quest[ãa]o)\\s*(\\d+)?[.:]?\\s*/i,

      // Padrões para identificar boxes de informação
      boxPattern: /(box|destaque|importante|saiba mais|curiosidade)[:\\s]/i,

      // Padrões para identificar tabelas de conteúdo
      contentTablePattern: /(conte[úu]do|sum[áa]rio|t[óo]pico|tema)[:\\s]/i,

      // Padrões para identificar resumos
      summaryPattern:
        /(resumo|s[ií]ntese|conclus[ãa]o|pontos principais)[:\\s]/i,
    };
  }

  /**
   * Extrair conteúdo de um livro didático PDF
   * @param {string} filePath - Caminho do arquivo PDF
   * @returns {Promise<Object>} - Conteúdo extraído
   */
  async extract(filePath) {
    try {
      console.log(`Iniciando extração do livro: ${filePath}`);

      // Extrair texto e informações de layout do PDF
      const layoutData = await this.extractWithLayout(filePath);

      // Extrair informações básicas do livro (título, autor, etc.)
      const bookInfo = await this.extractBookInfo(layoutData);

      // Processar o conteúdo e identificar diferentes tipos de elementos
      const processedContent = await this.processBookContent(
        layoutData,
        bookInfo
      );

      // Converter o conteúdo processado em questões e resumos
      const convertedQuestions = this.convertToQuestions(
        processedContent,
        bookInfo
      );

      return {
        bookInfo,
        content: processedContent,
        questions: convertedQuestions,
        filename: path.basename(filePath),
        pages: layoutData.pages.length,
        extractedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error('Erro na extração do livro:', error);
      throw error;
    }
  }

  /**
   * Extrair conteúdo mantendo informações de layout
   * @param {string} filePath - Caminho do arquivo PDF
   * @returns {Promise<Object>} - Dados com informações de layout
   */
  async extractWithLayout(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);

      // Carregar o PDF
      const pdf = await pdfjsLib.getDocument({
        data: dataBuffer,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
        cMapPacked: true,
      }).promise;

      const pages = [];
      const metadata = await pdf.getMetadata();

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.5 });

        pages.push({
          number: pageNum,
          content,
          viewport,
          width: viewport.width,
          height: viewport.height,
        });
      }

      return {
        pages,
        metadata,
        totalPages: pdf.numPages,
        title: metadata.Title || path.basename(filePath, '.pdf'),
      };
    } catch (error) {
      console.error('Erro ao extrair com layout:', error);
      throw error;
    }
  }

  /**
   * Extrair informações básicas do livro (título, autor, etc.)
   * @param {Object} layoutData - Dados com informações de layout
   * @returns {Object} - Informações básicas do livro
   */
  async extractBookInfo(layoutData) {
    const firstPageText = layoutData.pages[0]?.content?.items
      .map((item) => item.str)
      .join(' ') || '';

    // Extrair título e subtítulo da primeira página
    const titleMatch = firstPageText.match(
      /(?:^|\n)\s*(.{0,100}?)(?:\n|$)/
    );
    const title = titleMatch ? titleMatch[1].trim() : 'Título não identificado';

    return {
      title,
      author: layoutData.metadata.Author || 'Autor não identificado',
      subject: layoutData.metadata.Subject || '',
      keywords: layoutData.metadata.Keywords || '',
      totalPages: layoutData.totalPages,
      publisher: layoutData.metadata.Producer || '',
      language: layoutData.metadata.Language || 'Português',
    };
  }

  /**
   * Processar conteúdo do livro e identificar diferentes tipos de elementos
   * @param {Object} layoutData - Dados com informações de layout
   * @param {Object} bookInfo - Informações básicas do livro
   * @returns {Array} - Conteúdo processado com diferentes tipos de elementos
   */
  async processBookContent(layoutData, bookInfo) {
    const processedContent = [];

    for (const page of layoutData.pages) {
      const pageText = page.content.items.map((item) => item.str).join(' ');

      // Identificar diferentes tipos de elementos na página
      const elements = this.identifyElements(pageText, page.content.items);

      processedContent.push({
        page: page.number,
        elements,
        text: pageText,
        wordCount: pageText.split(/\s+/).length,
      });
    }

    return processedContent;
  }

  /**
   * Identificar diferentes tipos de elementos em um texto
   * @param {string} text - Texto para análise
   * @param {Array} positionedTexts - Textos com informações de posição
   * @returns {Array} - Elementos identificados
   */
  identifyElements(text, positionedTexts) {
    const elements = [];

    // Identificar títulos e subtítulos
    const titles = this.identifyTitles(text, positionedTexts);
    elements.push(...titles);

    // Identificar definições
    const definitions = this.identifyDefinitions(text);
    elements.push(...definitions);

    // Identificar exemplos
    const examples = this.identifyExamples(text);
    elements.push(...examples);

    // Identificar exercícios
    const exercises = this.identifyExercises(text);
    elements.push(...exercises);

    // Identificar boxes de informação
    const boxes = this.identifyBoxes(text);
    elements.push(...boxes);

    // Identificar resumos
    const summaries = this.identifySummaries(text);
    elements.push(...summaries);

    return elements;
  }

  /**
   * Identificar títulos em um texto
   * @param {string} text - Texto para análise
   * @param {Array} positionedTexts - Textos com informações de posição
   * @returns {Array} - Títulos identificados
   */
  identifyTitles(text, positionedTexts) {
    const titles = [];
    const titleMatches = text.match(
      /\b(\d+[\.\\s]\d*\.?\s*[A-Z][^.!?]*|[IVX]+[\.\\s][A-Z][^.!?]*|Cap[íi]tulo\s+\d+\s*[:\-\\s][^.!?\n]*|Se[cç][ãa]o\s+\d+\s*[:\-\\s][^.!?\n]*)/gi
    );

    if (titleMatches) {
      titleMatches.forEach((match) => {
        // Determinar se é título ou subtítulo com base no tamanho e posição
        const textSize = this.estimateTextSize(match, positionedTexts);
        const type = textSize > 15 ? 'title' : 'subtitle';

        titles.push({
          type: type,
          text: match.trim(),
          confidence: 0.9,
        });
      });
    }

    return titles;
  }

  /**
   * Estimar tamanho do texto com base nas informações de layout
   * @param {string} text - Texto para analisar
   * @param {Array} positionedTexts - Textos com informações de posição
   * @returns {number} - Tamanho estimado
   */
  estimateTextSize(text, positionedTexts) {
    // Este é um exemplo simplificado - em uma implementação real, você usaria
    // as informações de fonte do positionedTexts para estimar o tamanho
    if (text.length < 20) return 18;
    if (text.length < 50) return 15;
    return 12;
  }

  /**
   * Identificar definições em um texto
   * @param {string} text - Texto para análise
   * @returns {Array} - Definições identificadas
   */
  identifyDefinitions(text) {
    const definitions = [];
    const definitionPattern = this.contentPatterns.definitionPattern;
    let match;

    while ((match = definitionPattern.exec(text)) !== null) {
      definitions.push({
        type: 'definition',
        text: match[0],
        term: match[2],
        confidence: 0.8,
      });
    }

    return definitions;
  }

  /**
   * Identificar exemplos em um texto
   * @param {string} text - Texto para análise
   * @returns {Array} - Exemplos identificados
   */
  identifyExamples(text) {
    const examples = [];
    const examplePattern = this.contentPatterns.examplePattern;
    let match;

    while ((match = examplePattern.exec(text)) !== null) {
      examples.push({
        type: 'example',
        text: match[0],
        content: match[2],
        confidence: 0.7,
      });
    }

    return examples;
  }

  /**
   * Identificar exercícios em um texto
   * @param {string} text - Texto para análise
   * @returns {Array} - Exercícios identificados
   */
  identifyExercises(text) {
    const exercises = [];
    const exercisePattern = this.contentPatterns.exercisePattern;
    let match;

    const lines = text.split('\n');
    for (const line of lines) {
      if ((match = exercisePattern.exec(line)) !== null) {
        exercises.push({
          type: 'exercise',
          text: line.trim(),
          number: match[2] || null,
          confidence: 0.8,
        });
      }
    }

    return exercises;
  }

  /**
   * Identificar boxes de informação em um texto
   * @param {string} text - Texto para análise
   * @returns {Array} - Boxes identificados
   */
  identifyBoxes(text) {
    const boxes = [];
    const boxPattern = this.contentPatterns.boxPattern;
    let match;

    while ((match = boxPattern.exec(text)) !== null) {
      boxes.push({
        type: 'box',
        text: match[0],
        confidence: 0.6,
      });
    }

    return boxes;
  }

  /**
   * Identificar resumos em um texto
   * @param {string} text - Texto para análise
   * @returns {Array} - Resumos identificados
   */
  identifySummaries(text) {
    const summaries = [];
    const summaryPattern = this.contentPatterns.summaryPattern;
    let match;

    while ((match = summaryPattern.exec(text)) !== null) {
      summaries.push({
        type: 'summary',
        text: match[0],
        confidence: 0.7,
      });
    }

    return summaries;
  }

  /**
   * Converter conteúdo processado em questões
   * @param {Array} processedContent - Conteúdo processado
   * @param {Object} bookInfo - Informações básicas do livro
   * @returns {Array} - Questões convertidas
   */
  convertToQuestions(processedContent, bookInfo) {
    const questions = [];

    for (const pageContent of processedContent) {
      // Converter exercícios em questões
      const exercises = pageContent.elements.filter(
        (el) => el.type === 'exercise'
      );

      for (const exercise of exercises) {
        questions.push({
          type: 'exercise',
          content: exercise.text,
          materia: this.classifyContent(exercise.text, bookInfo.title),
          pageNumber: pageContent.page,
          confidence: exercise.confidence,
        });
      }

      // Converter definições em questões de compreensão
      const definitions = pageContent.elements.filter(
        (el) => el.type === 'definition'
      );

      for (const definition of definitions) {
        questions.push({
          type: 'comprehension',
          content: `Explique o conceito de: ${definition.term}`,
          answer: definition.text,
          materia: this.classifyContent(definition.text, bookInfo.title),
          pageNumber: pageContent.page,
          confidence: definition.confidence,
        });
      }

      // Converter exemplos em questões de aplicação
      const examples = pageContent.elements.filter(
        (el) => el.type === 'example'
      );

      for (const example of examples) {
        questions.push({
          type: 'application',
          content: `Como o conceito no exemplo "${example.content}" pode ser aplicado em uma situação real?`,
          materia: this.classifyContent(example.content, bookInfo.title),
          pageNumber: pageContent.page,
          confidence: example.confidence,
        });
      }
    }

    return questions;
  }

  /**
   * Classificar conteúdo por matéria
   * @param {string} content - Conteúdo para classificar
   * @param {string} bookTitle - Título do livro
   * @returns {string} - Matéria identificada
   */
  classifyContent(content, bookTitle) {
    const contentLower = content.toLowerCase();
    const titleLower = bookTitle.toLowerCase();

    if (titleLower.includes('matemática') || contentLower.includes('matemática') || contentLower.includes('equação') || contentLower.includes('função')) {
      return 'Matemática';
    }

    if (titleLower.includes('física') || contentLower.includes('física') || contentLower.includes('força') || contentLower.includes('energia')) {
      return 'Física';
    }

    if (titleLower.includes('química') || contentLower.includes('química') || contentLower.includes('átomo') || contentLower.includes('reação')) {
      return 'Química';
    }

    if (titleLower.includes('biologia') || contentLower.includes('biologia') || contentLower.includes('célula') || contentLower.includes('dna')) {
      return 'Biologia';
    }

    if (titleLower.includes('história') || contentLower.includes('história') || contentLower.includes('brasil') || contentLower.includes('revolução')) {
      return 'História';
    }

    if (titleLower.includes('geografia') || contentLower.includes('geografia') || contentLower.includes('clima') || contentLower.includes('população')) {
      return 'Geografia';
    }

    if (titleLower.includes('português') || titleLower.includes('linguagem') || contentLower.includes('literatura') || contentLower.includes('gramática')) {
      return 'Linguagens e Códigos';
    }

    if (contentLower.includes('filosofia') || contentLower.includes('ético') || contentLower.includes('moral')) {
      return 'Filosofia';
    }

    if (contentLower.includes('sociologia') || contentLower.includes('sociedade') || contentLower.includes('cultura')) {
      return 'Sociologia';
    }

    return 'Não classificada';
  }
}

export default new BookExtractor();
