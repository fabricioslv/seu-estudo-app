// services/extractors/layoutExtractor.js
import fs from 'fs';
import pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import path from 'path';

// Configuração para usar a versão de Node.js do pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

class LayoutExtractor {
  constructor() {
    // Define patterns para diferentes tipos de exames
    this.examPatterns = {
      enem: {
        // Padrões para identificar questões no ENEM
        questaoPattern:
          /(?:QUESTÃO|Questão|Questao|QUESTAO)\s*(?:n[º°]?\s*)?(\d{1,3})[.\s\n\r]*([A-Z\s\n\r][\s\S]*?)(?=(?:QUESTÃO|Questão|Questao|QUESTAO)\s*(?:n[º°]?\s*)?\d{1,3}|$)/gi,
        alternativasPattern:
          /[.\s]([A-E])[).\s]+([A-Z][^A-E\n\r.(]*?)(?=\s*[.\s]([A-E])[).\s]|$)/gi,
        gabaritoPattern: /(\d{1,3})[.\s]+([A-E])/gi,
      },
      vestibular: {
        questaoPattern:
          /(?:Questão|QUESTÃO|Questao|QUESTAO)\s*(?:n[º°]?\s*)?(\d{1,3})[.\s\n\r]*([A-Z\s\n\r][\s\S]*?)(?=(?:Questão|QUESTÃO|Questao|QUESTAO)\s*(?:n[º°]?\s*)?\d{1,3}|$)/gi,
        alternativasPattern:
          /([A-E])[.).]\s*([A-Z][^A-E\n\r(]*?)(?=\s*([A-E])[.).]|$)|[.\s(]([A-E])[)\s]+([A-Z][^A-E\n\r(]*?)(?=\s*[.\s(][A-E][)\s]|$)/gi,
        gabaritoPattern: /(\d{1,3})[.\s]+([A-E])/gi,
      },
    };
  }

  /**
   * Método para extrair texto mantendo a informação de layout dos PDFs
   * @param {string} filePath - Caminho para o arquivo PDF
   * @returns {Promise<Object>} - Objeto com o texto e informações de layout
   */
  async extractWithLayout(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);

      // Carrega o PDF
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

        // Obter informações de posicionamento para cada item de texto
        const positionedTexts = content.items.map((item) => {
          return {
            str: item.str,
            transform: item.transform,
            width: item.width,
            height: item.height,
          };
        });

        pages.push({
          number: pageNum,
          content,
          positionedTexts,
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
   * Método principal para extrair questões com base no layout
   * @param {string} provaPath - Caminho para o arquivo PDF da prova
   * @param {string} gabaritoPath - Caminho opcional para o arquivo PDF do gabarito
   * @returns {Promise<Object>} - Questões extraídas
   */
  async extract(provaPath, gabaritoPath = null) {
    try {
      console.log(
        'Iniciando extração com layout para:',
        path.basename(provaPath)
      );

      // Extrai o conteúdo com informações de layout
      const layoutData = await this.extractWithLayout(provaPath);

      // Identificar o tipo de exame
      const examType = this.identifyExamType(provaPath);
      console.log(`Tipo de exame identificado: ${examType}`);

      // Processar o texto de cada página para extrair questões
      const questoes = [];

      for (const page of layoutData.pages) {
        const pageQuestoes = this.extractQuestoesFromPage(page, examType);
        questoes.push(...pageQuestoes);
      }

      console.log(`Extraídas ${questoes.length} questões`);

      // Extrair gabarito se disponível
      let gabarito = null;
      if (gabaritoPath) {
        const gabaritoBuffer = fs.readFileSync(gabaritoPath);
        const gabaritoData = await pdfjsLib.getDocument({
          data: gabaritoBuffer,
        }).promise;
        const gabaritoText = await this.extractTextFromPDF(gabaritoData);
        gabarito = this.extractGabarito(gabaritoText);
      }

      // Associar gabarito às questões se disponível
      if (gabarito) {
        this.associateGabarito(questoes, gabarito);
      }

      return {
        questoes,
        examType,
        filename: path.basename(provaPath),
        extractionMethod: 'layout',
        totalPages: layoutData.totalPages,
      };
    } catch (error) {
      console.error('Erro na extração com layout:', error);
      throw error;
    }
  }

  /**
   * Identificar o tipo de exame com base no caminho do arquivo
   * @param {string} filePath - Caminho do arquivo
   * @returns {string} - Tipo de exame ('enem', 'vestibular', 'outro')
   */
  identifyExamType(filePath) {
    const fileName = path.basename(filePath).toLowerCase();

    if (fileName.includes('enem') || fileName.includes('exame_nacional')) {
      return 'enem';
    }

    if (
      fileName.includes('vestibular') ||
      fileName.includes('fuvest') ||
      fileName.includes('unicamp') ||
      fileName.includes('puc') ||
      fileName.includes('ita')
    ) {
      return 'vestibular';
    }

    return 'outro';
  }

  /**
   * Extrair questões de uma página específica
   * @param {Object} page - Objeto de página com layout
   * @param {string} examType - Tipo de exame
   * @returns {Array} - Questões extraídas da página
   */
  extractQuestoesFromPage(page, examType) {
    const questoes = [];
    const pattern = this.examPatterns[examType] || this.examPatterns.vestibular;
    const text = page.content.items.map((item) => item.str).join(' ');

    let match;
    const questaoRegex = new RegExp(pattern.questaoPattern.source, 'gi');

    while ((match = questaoRegex.exec(text)) !== null) {
      const [, numero, conteudo] = match;

      // Extrair enunciado (antes das alternativas)
      const enunciadoMatch = conteudo.match(/^(.*?)(?=(?:\n\s*[A-E]\s*:?\s*)|$)/s);
      const enunciado = enunciadoMatch ? enunciadoMatch[1].trim() : conteudo.trim();

      // Extrair alternativas
      const alternativas = {};
      const alternativasPattern = /\n\s*([A-E])\s*:?\s*([^\n]*?(?=\n[A-E]|$))/g;
      let altMatch;

      while ((altMatch = alternativasPattern.exec(conteudo)) !== null) {
        alternativas[altMatch[1]] = altMatch[2].trim();
      }

      questoes.push({
        numero: parseInt(numero),
        enunciado,
        alternativas,
        materia: this.determinarMateria(parseInt(numero), enunciado),
        pagina: page.number,
        ano: this.extractAno(text),
      });
    }

    return questoes;
  }

  /**
   * Extrair gabarito de um texto
   * @param {string} text - Texto do gabarito
   * @returns {Object} - Gabarito como objeto
   */
  extractGabarito(text) {
    const gabarito = {};
    const pattern = /(\d+)\s*[–\-:\s]+([A-E])/gi;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const numero = parseInt(match[1]);
      const resposta = match[2];
      gabarito[numero] = resposta;
    }

    return gabarito;
  }

  /**
   * Associar gabarito às questões
   * @param {Array} questoes - Array de questões
   * @param {Object} gabarito - Objeto com gabarito
   */
  associateGabarito(questoes, gabarito) {
    for (const questao of questoes) {
      if (gabarito[questao.numero]) {
        questao.resposta_correta = gabarito[questao.numero];
      }
    }
  }

  /**
   * Extrair ano do exame do texto
   * @param {string} text - Texto do exame
   * @returns {number} - Ano do exame
   */
  extractAno(text) {
    const anoPattern = /ENEM\s+(\d{4})|(\d{4})\s+—\s+Exame Nacional do Ensino Médio/i;
    const match = text.match(anoPattern);
    return match ? parseInt(match[1] || match[2]) : new Date().getFullYear();
  }

  /**
   * Extrair texto de um PDF
   * @param {Object} pdf - Objeto PDF
   * @returns {Promise<string>} - Texto extraído
   */
  async extractTextFromPDF(pdf) {
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items.map((item) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  }

  /**
   * Determinar matéria de uma questão com base no número e enunciado
   * @param {number} numero - Número da questão
   * @param {string} enunciado - Enunciado da questão
   * @returns {string} - Matéria determinada
   */
  determinarMateria(numero, enunciado) {
    // Primeiro tentar identificar pela posição (no caso do ENEM)
    if (numero >= 1 && numero <= 45) {
      return 'Linguagens e Códigos';
    } else if (numero >= 46 && numero <= 90) {
      return 'Ciências Humanas';
    } else if (numero >= 91 && numero <= 135) {
      return 'Ciências da Natureza';
    } else if (numero >= 136 && numero <= 180) {
      return 'Matemática';
    }

    // Se não for ENEM, tentar identificar pelo enunciado
    const enunciadoLower = enunciado.toLowerCase();

    if (
      enunciadoLower.includes('texto') ||
      enunciadoLower.includes('linguagem') ||
      enunciadoLower.includes('literatura')
    ) {
      return 'Linguagens e Códigos';
    }

    if (
      enunciadoLower.includes('história') ||
      enunciadoLower.includes('geografia') ||
      enunciadoLower.includes('sociologia') ||
      enunciadoLower.includes('filosofia')
    ) {
      return 'Ciências Humanas';
    }

    if (
      enunciadoLower.includes('física') ||
      enunciadoLower.includes('química') ||
      enunciadoLower.includes('biologia')
    ) {
      return 'Ciências da Natureza';
    }

    if (
      enunciadoLower.includes('matemática') ||
      enunciadoLower.includes('equação') ||
      enunciadoLower.includes('geometria')
    ) {
      return 'Matemática';
    }

    return 'Não classificada';
  }

  /**
   * Classificar conteúdo por matéria com base em palavras-chave
   * @param {string} enunciado - Enunciado da questão
   * @returns {string} - Matéria identificada
   */
  classifyByContent(enunciado) {
    const enunciadoLower = enunciado.toLowerCase();

    const materiaKeywords = {
      'Linguagens e Códigos': [
        'literatura',
        'linguagem',
        'gramática',
        'português',
        'texto',
        'autor',
        'obra',
        'figura de linguagem',
        'função da linguagem',
      ],
      'Ciências Humanas': [
        'história',
        'geografia',
        'sociologia',
        'filosofia',
        'política',
        'sociedade',
        'cultura',
        'economia',
        'revolução',
        'colonização',
        'brasil',
        'imperialismo',
        'globalização',
      ],
      'Ciências da Natureza': [
        'física',
        'química',
        'biologia',
        'átomo',
        'reação',
        'célula',
        'força',
        'energia',
        'carbono',
        'dna',
        'ecossistema',
      ],
      Matemática: [
        'matemática',
        'equação',
        'função',
        'geometria',
        'álgebra',
        'número',
        'probabilidade',
        'estatística',
      ],
      Sociologia: [
        'sociedade',
        'cultura',
        'classe',
        'social',
        'política',
        'instituição',
        'poder',
        'marx',
        'durban',
        'weber',
        'movimento social',
        'trabalho',
      ],
    };

    // Verificar cada matéria
    for (const [materia, keywords] of Object.entries(materiaKeywords)) {
      for (const keyword of keywords) {
        if (enunciadoLower.includes(keyword.toLowerCase())) {
          return materia;
        }
      }
    }

    return 'Não classificada';
  }
}

export default new LayoutExtractor();