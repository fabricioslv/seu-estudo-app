// services/extractors/bookExtractor.js
const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const pdfjsLib = require('pdfjs-dist');

// Configuração para usar a versão de Node.js do pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

class BookExtractor {
  constructor() {
    // Padrões para identificar diferentes tipos de conteúdo em livros didáticos
    this.contentPatterns = {
      // Padrões para identificar títulos e subtítulos
      titlePattern:
        /^(#{1,6}\s+|\d+[\.\s]\d*\.?\s*|[IVX]+[\.\s]|Cap[íi]tulo\s+\d+[:\s]|Se[cç][ãa]o\s+\d+[:\s])/i,

      // Padrões para identificar definições
      definitionPattern:
        /(defini[çc][ãa]o|significado|o que [ée]|conceito de):?\s*([^.!?]+)[.!?]/i,

      // Padrões para identificar exemplos
      examplePattern:
        /(exemplo|exemplificando|por exemplo|caso|casos):\s*([^.!?]+)[.!?]/i,

      // Padrões para identificar exercícios
      exercisePattern:
        /(exerc[ií]cio|atividade|pr[áa]tica|teste|quest[ãa]o)\s*(\d+)?[.:]?\s*/i,

      // Padrões para identificar boxes de informação
      boxPattern: /(box|destaque|importante|saiba mais|curiosidade)[:\s]/i,

      // Padrões para identificar tabelas de conteúdo
      contentTablePattern: /(conte[úu]do|sum[áa]rio|t[óo]pico|tema)[:\s]/i,

      // Padrões para identificar resumos
      summaryPattern:
        /(resumo|s[ií]ntese|conclus[ãa]o|pontos principais)[:\s]/i,
    };

    // Tipos de conteúdo identificados
    this.contentTypes = {
      title: 'Título',
      subtitle: 'Subtítulo',
      definition: 'Definição',
      example: 'Exemplo',
      exercise: 'Exercício',
      information_box: 'Box de Informação',
      content_table: 'Tabela de Conteúdo',
      summary: 'Resumo',
      paragraph: 'Parágrafo',
      image_description: 'Descrição de Imagem',
      table: 'Tabela',
    };
  }

  /**
   * Extrair conteúdo de um livro didático em PDF
   * @param {string} filePath - Caminho do arquivo PDF
   * @param {string} bookInfo - Informações sobre o livro (título, ano, disciplina, etc.)
   * @returns {Promise<Object>} - Conteúdo extraído
   */
  async extract(filePath, bookInfo = {}) {
    try {
      console.log(`Iniciando extração do livro: ${path.basename(filePath)}`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
      }

      // Extrair texto e informações de layout do PDF
      const layoutData = await this.extractWithLayout(filePath);

      // Processar o conteúdo e identificar diferentes tipos de elementos
      const processedContent = await this.processBookContent(
        layoutData,
        bookInfo

      // Converter o conteúdo processado em questões e resumos
      const convertedQuestions = this.convertToQuestions(
        processedContent,
        bookInfo

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
   * @returns {Promise<Object>} - Conteúdo com informações de layout
   */
  async extractWithLayout(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);

      // Carrega o PDF
      const pdf = await pdfjsLib.getDocument({ data: dataBuffer }).promise;

      const extractedData = {
        text: '',
        pages: [],
        metadata: null,
        outlines: [] // Sumário do livro
      };

      // Extrai metadados
      extractedData.metadata = await pdf.getMetadata().catch(() => null);

      // Extrai o sumário (outlines) se disponível
      try {
        extractedData.outlines = await pdf.getOutline();
      } catch (outlineError) {
        console.warn(
          'Não foi possível extrair o sumário:',
          outlineError.message
        );
      }

      // Processa cada página
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);

        // Obtém o conteúdo da página com informações de posição
        const content = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });

        // Extrai o texto e as informações de posição
        let pageText = '';
        const positionedTexts = [];

        for (const item of content.items) {
          if ('str' in item) {
            positionedTexts.push({
              str: item.str,
              x: item.transform[4],
              y: item.transform[5],
              width: item.width,
              height: item.height,
              fontSize: item.height, // Aproximação do tamanho da fonte
            });
            pageText += `${item.str  } `;
          }
        }

        // Ordena os textos por posição (esquerda para direita, cima para baixo)
        positionedTexts.sort((a, b) => {
          // Se estiver na mesma linha (com pequena tolerância), ordena por x
          if (Math.abs(a.y - b.y) < 10) {
            return a.x - b.x;
          }
          // Caso contrário, ordena por y (linha superior primeiro)
          return a.y - b.y;
        });

        extractedData.pages.push({
          pageNumber: i,
          text: pageText,
          positionedTexts: positionedTexts,
          viewport: viewport,
        });

        extractedData.text += `${pageText  } \n`;
      }

      return extractedData;
    } catch (error) {
      console.error('Erro na extração com layout:', error);
      throw error;
    }
  }

  /**
   * Processar o conteúdo do livro identificando diferentes tipos de elementos
   * @param {Object} layoutData - Dados com layout
   * @param {Object} bookInfo - Informações do livro
   * @returns {Array} - Conteúdo processado
   */
  processBookContent(layoutData, bookInfo) {
    const processedContent = [];
    let currentSection = null;

    // Processar cada página
    for (const page of layoutData.pages) {
      // Identificar seções, títulos e subtítulos
      const pageContent = this.analyzePageContent(page, bookInfo);

      // Adicionar o conteúdo processado
      processedContent.push(...pageContent);

      // Atualizar a seção atual se encontrar um novo título
      const titleContent = pageContent.find(
        (c) => c.type === 'title' || c.type === 'subtitle'
      );
      if (titleContent) {
        currentSection = titleContent.text;
      }
    }

    return processedContent;
  }

  /**
   * Analisar o conteúdo de uma página específica
   * @param {Object} page - Dados da página
   * @param {Object} bookInfo - Informações do livro
   * @returns {Array} - Conteúdo da página analisado
   */
  analyzePageContent(page, bookInfo) {
    const content = [];
    const fullText = page.text;

    // Identificar títulos e subtítulos
    const titles = this.identifyTitles(fullText, page.positionedTexts);
    content.push(...titles);

    // Identificar definições
    const definitions = this.identifyDefinitions(fullText);
    content.push(...definitions);

    // Identificar exemplos
    const examples = this.identifyExamples(fullText);
    content.push(...examples);

    // Identificar exercícios
    const exercises = this.identifyExercises(fullText);
    content.push(...exercises);

    // Identificar boxes de informação
    const infoBoxes = this.identifyInformationBoxes(fullText);
    content.push(...infoBoxes);

    // Processar o restante do texto como parágrafos normais
    const paragraphs = this.extractParagraphs(fullText, [
      ...titles,
      ...definitions,
      ...examples,
      ...exercises,
      ...infoBoxes,
    ]);
    content.push(...paragraphs);

    // Adicionar informação sobre a página
    return content.map((item) => ({
      ...item,
      pageNumber: page.pageNumber,
      bookInfo: bookInfo,
    }));
  }

  /**
   * Identificar títulos e subtítulos no texto
   * @param {string} text - Texto da página
   * @param {Array} positionedTexts - Textos com informações de posição
   * @returns {Array} - Títulos identificados
   */
  identifyTitles(text, positionedTexts) {
    const titles = [];
    const titleMatches = text.match(
      /\b(\d+[\.\s]\d*\.?\s*[A-Z][^.!?]*|[IVX]+[\.\s][A-Z][^.!?]*|Cap[íi]tulo\s+\d+\s*[:\-\s][^.!?\n]*|Se[cç][ãa]o\s+\d+\s*[:\-\s][^.!?\n]*)/gi

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
    // Procurar o texto nos positionedTexts e obter o tamanho da fonte mais comum
    const relevantItems = positionedTexts.filter(
      (item) =>
        text.toLowerCase().includes(item.str.toLowerCase()) ||
        item.str.toLowerCase().includes(text.toLowerCase().substring(0, 10))
    );

    if (relevantItems.length > 0) {
      const avgSize =
        relevantItems.reduce((sum, item) => sum + item.fontSize, 0) /
        relevantItems.length;
      return avgSize;
    }

    return 12; // Tamanho padrão
  }

  /**
   * Identificar definições no texto
   * @param {string} text - Texto para analisar
   * @returns {Array} - Definições identificadas
   */
  identifyDefinitions(text) {
    const definitions = [];
    const definitionRegex =
      /(defini[çc][ãa]o|significado|o que [ée]|\s[ée]\s|conceito de)[:\s]?\s*([^.!?]+)[.!?]/gi;
    let match;

    while ((match = definitionRegex.exec(text)) !== null) {
      definitions.push({
        type: 'definition',
        text: match[0].trim(),
        definition: match[2].trim(),
        term: match[1].trim(),
        confidence: 0.8,
      });
    }

    return definitions;
  }

  /**
   * Identificar exemplos no texto
   * @param {string} text - Texto para analisar
   * @returns {Array} - Exemplos identificados
   */
  identifyExamples(text) {
    const examples = [];
    const exampleRegex =
      /(exemplo|exemplificando|por exemplo|caso|casos)[:\s]?\s*([^.!?]+)[.!?]/gi;
    let match;

    while ((match = exampleRegex.exec(text)) !== null) {
      examples.push({
        type: 'example',
        text: match[0].trim(),
        example: match[2].trim(),
        confidence: 0.8,
      });
    }

    return examples;
  }

  /**
   * Identificar exercícios no texto
   * @param {string} text - Texto para analisar
   * @returns {Array} - Exercícios identificados
   */
  identifyExercises(text) {
    const exercises = [];
    const exerciseRegex =
      /(exerc[ií]cio|atividade|pr[áa]tica|teste|quest[ãa]o)\s*(\d+)?[.:]?\s*([^.!?]*?)(?=(exerc[ií]cio|atividade|pr[áa]tica|teste|quest[ãa]o)|$)/gi;
    let match;

    while ((match = exerciseRegex.exec(text)) !== null) {
      exercises.push({
        type: 'exercise',
        text: match[0].trim(),
        exerciseNumber: match[2] || null,
        content: match[3].trim(),
        confidence: 0.8,
      });
    }

    return exercises;
  }

  /**
   * Identificar boxes de informação no texto
   * @param {string} text - Texto para analisar
   * @returns {Array} - Boxes identificados
   */
  identifyInformationBoxes(text) {
    const boxes = [];
    const boxRegex =
      /(box|destaque|importante|saiba mais|curiosidade)[:\s]?\s*([^.!?]*?)(?=(?:\n\s*\n|box|destaque|importante|saiba mais|curiosidade|$))/gi;
    let match;

    while ((match = boxRegex.exec(text)) !== null) {
      boxes.push({
        type: 'information_box',
        text: match[0].trim(),
        content: match[2].trim(),
        boxType: match[1].trim(),
        confidence: 0.7,
      });
    }

    return boxes;
  }

  /**
   * Extrair parágrafos normais do texto
   * @param {string} fullText - Texto completo
   * @param {Array} identifiedContent - Conteúdo já identificado
   * @returns {Array} - Parágrafos extraídos
   */
  extractParagraphs(fullText, identifiedContent) {
    let textToProcess = fullText;

    // Remover o conteúdo já identificado do texto para extrair apenas parágrafos restantes
    identifiedContent.forEach((item) => {
      textToProcess = textToProcess.replace(item.text, '');
    });

    // Dividir o texto restante em parágrafos (separados por quebras de linha)
    const paragraphs = textToProcess
      .split(/\n\s*\n/)
      .filter((p) => p.trim().length > 20) // Filtrar parágrafos muito curtos
      .map((p) => ({
        type: 'paragraph',
        text: p.trim(),
        confidence: 0.6,
      }));

    return paragraphs;
  }

  /**
   * Converter conteúdo do livro em questões formatadas
   * @param {Array} content - Conteúdo do livro
   * @param {Object} bookInfo - Informações do livro
   * @returns {Array} - Questões convertidas
   */
  convertToQuestions(content, bookInfo) {
    const questions = [];

    // Converter exercícios identificados em questões
    const exerciseContent = content.filter((c) => c.type === 'exercise');

    exerciseContent.forEach((exercise, index) => {
      const question = this.convertExerciseToQuestion(exercise, bookInfo);
      if (question) {
        questions.push(question);
      }
    });

    // Também tentar converter exemplos em questões de fixação
    const exampleContent = content.filter((c) => c.type === 'example');

    exampleContent.forEach((example, index) => {
      const question = this.convertExampleToQuestion(example, bookInfo);
      if (question) {
        questions.push(question);
      }
    });

    return questions;
  }

  /**
   * Converter um exercício em uma questão formatada
   * @param {Object} exercise - Exercício identificado
   * @param {Object} bookInfo - Informações do livro
   * @returns {Object|null} - Questão formatada ou null
   */
  convertExerciseToQuestion(exercise, bookInfo) {
    // Extrair alternativas se existirem (padrão A), B), C), etc.)
    const alternativas = this.extractAlternatives(exercise.content);
    const enunciado = this.extractQuestionStatement(
      exercise.content,
      alternativas

    if (!enunciado || Object.keys(alternativas).length === 0) {
      // Se não tiver alternativas, pode ser uma questão dissertativa
      return {
        numero: exercise.exerciseNumber || Math.floor(Math.random() * 10000),
        enunciado: enunciado || exercise.content,
        alternativas: {},
        resposta_correta: null,
        materia: bookInfo.disciplina || 'Não classificada',
        ano_vestibular: bookInfo.ano || null,
        origem: `Livro: ${bookInfo.titulo || 'Desconhecido'}`,
        tipo: 'dissertativa',
        nivel_dificuldade: this.estimateDifficulty(exercise.content),
        origem_tipo: 'livro_didatico',
      };
    }

    // Para questões de múltipla escolha
    return {
      numero: exercise.exerciseNumber || Math.floor(Math.random() * 10000),
      enunciado: enunciado,
      alternativas: alternativas,
      resposta_correta: null, // Sem resposta correta definida no livro
      materia: bookInfo.disciplina || 'Não classificada',
      ano_vestibular: bookInfo.ano || null,
      origem: `Livro: ${bookInfo.titulo || 'Desconhecido'}`,
      tipo: 'multipla_escolha',
      nivel_dificuldade: this.estimateDifficulty(exercise.content),
      origem_tipo: 'livro_didatico',
    };
  }

  /**
   * Converter um exemplo em uma questão de fixação
   * @param {Object} example - Exemplo identificado
   * @param {Object} bookInfo - Informações do livro
   * @returns {Object|null} - Questão formatada ou null
   */
  convertExampleToQuestion(example, bookInfo) {
    // Criar uma questão baseada no exemplo para fixação de conteúdo
    const enunciado = `Com base no exemplo apresentado: "${example.example}", qual é a melhor aplicação deste conceito?`;

    return {
      numero: Math.floor(Math.random() * 10000),
      enunciado: enunciado,
      alternativas: {
        A: 'Aplicação direta do exemplo',
        B: 'Variação contextual do exemplo',
        C: 'Generalização do princípio',
        D: 'Análise crítica do exemplo',
        E: 'Outra aplicação prática',
      },
      resposta_correta: null, // Ficará para validação humana
      materia: bookInfo.disciplina || 'Não classificada',
      ano_vestibular: bookInfo.ano || null,
      origem: `Exemplo do livro: ${bookInfo.titulo || 'Desconhecido'}`,
      tipo: 'fixacao_conceito',
      nivel_dificuldade: 1, // Geralmente mais fácil
      origem_tipo: 'livro_didatico',
    };
  }

  /**
   * Extrair alternativas de um conteúdo
   * @param {string} content - Conteúdo para extrair alternativas
   * @returns {Object} - Alternativas extraídas
   */
  extractAlternatives(content) {
    const alternativas = {};
    const altRegex =
      /([A-E])\s*[)\.]?\s*([^A-E\n\r]*?)(?=\n|^\s*[A-E]\s*[)\.]?|$)/gi;
    let match;

    while ((match = altRegex.exec(content)) !== null) {
      alternativas[match[1]] = match[2].trim();
    }

    return alternativas;
  }

  /**
   * Extrair o enunciado da questão (parte antes das alternativas)
   * @param {string} content - Conteúdo completo
   * @param {Object} alternativas - Alternativas identificadas
   * @returns {string} - Enunciado da questão
   */
  extractQuestionStatement(content, alternativas) {
    if (Object.keys(alternativas).length === 0) {
      return content;
    }

    // Encontrar a posição da primeira alternativa
    const firstAltPos = content.search(/[A-E]\s*[)\.]/);

    if (firstAltPos !== -1) {
      return content.substring(0, firstAltPos).trim();
    }

    return content;
  }

  /**
   * Estimar dificuldade de uma questão com base no conteúdo
   * @param {string} content - Conteúdo da questão
   * @returns {number} - Nível de dificuldade (1-3)
   */
  estimateDifficulty(content) {
    // Análise simples baseada em palavras-chave de dificuldade
    const difficultTerms = [
      'demonstrar',
      'provar',
      'elaborar',
      'analisar criticamente',
      'comparar e contrastar',
    ];
    const complexTerms = [
      'relacionar',
      'inferir',
      'interpretar',
      'aplicar',
      'resolver',

    const textLower = content.toLowerCase();
    const difficultCount = difficultTerms.filter((term) =>
      textLower.includes(term.toLowerCase())
    ).length;
    const complexCount = complexTerms.filter((term) =>
      textLower.includes(term.toLowerCase())
    ).length;

    if (difficultCount > 0) return 3; // Difícil
    if (complexCount > 0) return 2; // Médio
    return 1; // Fácil
  }

  /**
   * Processar uma pasta inteira de livros didáticos
   * @param {string} booksDir - Diretório com os livros
   * @returns {Promise<Array>} - Resultados de todas as extrações
   */
  async processBooksDirectory(booksDir) {
    try {
      if (!fs.existsSync(booksDir)) {
        throw new Error(`Diretório não encontrado: ${booksDir}`);
      }

      const files = fs.readdirSync(booksDir);
      const pdfFiles = files.filter(
        (file) =>
          path.extname(file).toLowerCase() === '.pdf' &&
          !file.toLowerCase().includes('gabarito') &&
          !file.toLowerCase().includes('solucionario')
      );

      const results = [];

      for (const fileName of pdfFiles) {
        const filePath = path.join(booksDir, fileName);

        try {
          // Extrair informações do nome do arquivo
          const bookInfo = this.extractBookInfoFromFilename(fileName);

          console.log(`Processando livro: ${fileName}`);
          const result = await this.extract(filePath, bookInfo);
          results.push(result);

          console.log(
            `Livro processado com sucesso: ${fileName} (${result.questions.length} questões extraídas)`
          );
        } catch (error) {
          console.error(`Erro ao processar livro ${fileName}:`, error.message);
          results.push({
            filename: fileName,
            error: error.message,
            success: false,
          });
        }
      }

      return results;
    } catch (error) {
      console.error('Erro ao processar diretório de livros:', error);
      throw error;
    }
  }

  /**
   * Extrair informações do livro a partir do nome do arquivo
   * @param {string} filename - Nome do arquivo
   * @returns {Object} - Informações extraídas
   */
  extractBookInfoFromFilename(filename) {
    const info = {};
    const cleanName = path.basename(filename, '.pdf');

    // Tentar extrair ano
    const yearMatch = cleanName.match(/(20\d{2})|(\d{4})/);
    if (yearMatch) {
      info.ano = parseInt(yearMatch[0]);
    }

    // Tentar inferir disciplina
    const subjectKeywords = {
      matematica: ['matemática', 'matematica', 'math', 'algebra', 'geometria'],
      portugues: [
        'português',
        'portugues',
        'gramática',
        'gramatica',
        'lingua',
        'literatura',
      ],
      historia: ['história', 'historia', 'historico'],
      geografia: ['geografia', 'geo'],
      fisica: ['física', 'fisica', 'physics'],
      quimica: ['química', 'quimica', 'chemistry'],
      biologia: ['biologia', 'bio'],
      ingles: ['inglês', 'ingles', 'english'],
    };

    for (const [subject, keywords] of Object.entries(subjectKeywords)) {
      for (const keyword of keywords) {
        if (cleanName.toLowerCase().includes(keyword.toLowerCase())) {
          info.disciplina = subject;
          break;
        }
      }
      if (info.disciplina) break;
    }

    info.titulo = cleanName;
    info.origem = 'livro_didatico';

    return info;
  }
}

module.exports = new BookExtractor();
