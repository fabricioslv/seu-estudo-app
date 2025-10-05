// services/extractors/layoutExtractor.js
import fs from 'fs';
import pdfjsLib from 'pdfjs-dist/legacy/build/pdf.js';
import path from 'path';

// ConfiguraÃ§Ã£o para usar a versÃ£o de Node.js do pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

class LayoutExtractor {
  constructor() {
    // Define patterns para diferentes tipos de exames
    this.examPatterns = {
      enem: {
        // PadrÃµes para identificar questÃµes no ENEM
        questaoPattern:
          /(?:QUESTO|QuestÃ£o|Questao|QUESTAO)\s*(?:n[ÂºÂ°]?\s*)?(\d{1,3})[.\s\n\r]*([A-Z\s\n\r][\s\S]*?)(?=(?:QUESTO|QuestÃ£o|Questao|QUESTAO)\s*(?:n[ÂºÂ°]?\s*)?\d{1,3}|$)/gi,
        alternativasPattern:
          /[.\s]([A-E])[).\s]+([A-Z][^A-E\n\r.(]*?)(?=\s*[.\s]([A-E])[).\s]|$)/gi,
        gabaritoPattern: /(\d{1,3})[.\s]+([A-E])/gi,
      },
      vestibular: {
        questaoPattern:
          /(?:QuestÃ£o|QUESTO|Questao|QUESTAO)\s*(?:n[ÂºÂ°]?\s*)?(\d{1,3})[.\s\n\r]*([A-Z\s\n\r][\s\S]*?)(?=(?:QuestÃ£o|QUESTO|Questao|QUESTAO)\s*(?:n[ÂºÂ°]?\s*)?\d{1,3}|$)/gi,
        alternativasPattern:
          /([A-E])[.).]\s*([A-Z][^A-E\n\r(]*?)(?=\s*([A-E])[.).]|$)|[.\s(]([A-E])[)\s]+([A-Z][^A-E\n\r(]*?)(?=\s*[.\s(][A-E][)\s]|$)/gi,
        gabaritoPattern: /(\d{1,3})[.\s]+([A-E])/gi,
      },
    };
  }

  /**
   * MÃ©todo para extrair texto mantendo a informaÃ§Ã£o de layout dos PDFs
   * @param {string} filePath - Caminho para o arquivo PDF
   * @returns {Promise<Object>} - Objeto com o texto e informaÃ§Ãµes de layout
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

        // Obter informaÃ§Ãµes de posicionamento para cada item de texto
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
   * MÃ©todo principal para extrair questÃµes com base no layout
   * @param {string} provaPath - Caminho para o arquivo PDF da prova
   * @param {string} gabaritoPath - Caminho opcional para o arquivo PDF do gabarito
   * @returns {Promise<Object>} - QuestÃµes extraÃ­das
   */
  async extract(provaPath, gabaritoPath = null) {
    try {
      console.log(
        'Iniciando extraÃ§Ã£o com layout para:',
        path.basename(provaPath)
      );

      // Extrai o conteÃºdo com informaÃ§Ãµes de layout
      const layoutData = await this.extractWithLayout(provaPath);

      // Identificar o tipo de exame
      const examType = this.identifyExamType(provaPath);
      console.log(`Tipo de exame identificado: ${examType}`);

      // Processar o texto de cada pÃ¡gina para extrair questÃµes
      const questoes = [];

      for (const page of layoutData.pages) {
        const pageQuestoes = this.extractQuestoesFromPage(page, examType);
        questoes.push(...pageQuestoes);
      }

      console.log(`ExtraÃ­das ${questoes.length} questÃµes`);

      // Extrair gabarito se disponÃ­vel
      let gabarito = null;
      if (gabaritoPath) {
        const gabaritoBuffer = fs.readFileSync(gabaritoPath);
        const gabaritoData = await pdfjsLib.getDocument({
          data: gabaritoBuffer,
        }).promise;
        const gabaritoText = await this.extractTextFromPDF(gabaritoData);
        gabarito = this.extractGabarito(gabaritoText);
      }

      // Associar gabarito Ã s questÃµes se disponÃ­vel
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
      console.error('Erro na extraÃ§Ã£o com layout:', error);
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
   * Extrair questÃµes de uma pÃ¡gina especÃ­fica
   * @param {Object} page - Objeto de pÃ¡gina com layout
   * @param {string} examType - Tipo de exame
   * @returns {Array} - QuestÃµes extraÃ­das da pÃ¡gina
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
    const pattern = /(\d+)\s*[â€“\-:\s]+([A-E])/gi;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const numero = parseInt(match[1]);
      const resposta = match[2];
      gabarito[numero] = resposta;
    }

    return gabarito;
  }

  /**
   * Associar gabarito Ã s questÃµes
   * @param {Array} questoes - Array de questÃµes
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
    const anoPattern = /ENEM\s+(\d{4})|(\d{4})\s+â€”\s+Exame Nacional do Ensino MÃ©dio/i;
    const match = text.match(anoPattern);
    return match ? parseInt(match[1] || match[2]) : new Date().getFullYear();
  }

  /**
   * Extrair texto de um PDF
   * @param {Object} pdf - Objeto PDF
   * @returns {Promise<string>} - Texto extraÃ­do
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
   * Determinar matÃ©ria de uma questÃ£o com base no nÃºmero e enunciado
   * @param {number} numero - NÃºmero da questÃ£o
   * @param {string} enunciado - Enunciado da questÃ£o
   * @returns {string} - MatÃ©ria determinada
   */
  determinarMateria(numero, enunciado) {
    // Primeiro tentar identificar pela posiÃ§Ã£o (no caso do ENEM)
    if (numero >= 1 && numero <= 45) {
      return 'Linguagens e CÃ³digos';
    } else if (numero >= 46 && numero <= 90) {
      return 'CiÃªncias Humanas';
    } else if (numero >= 91 && numero <= 135) {
      return 'CiÃªncias da Natureza';
    } else if (numero >= 136 && numero <= 180) {
      return 'MatemáticaÃ¡tica';
    }

    // Se nÃ£o for ENEM, tentar identificar pelo enunciado
    const enunciadoLower = enunciado.toLowerCase();

    if (
      enunciadoLower.includes('texto') ||
      enunciadoLower.includes('linguagem') ||
      enunciadoLower.includes('literatura')
    ) {
      return 'Linguagens e CÃ³digos';
    }

    if (
      enunciadoLower.includes('histÃ³ria') ||
      enunciadoLower.includes('geografia') ||
      enunciadoLower.includes('sociologia') ||
      enunciadoLower.includes('filosofia')
    ) {
      return 'CiÃªncias Humanas';
    }

    if (
      enunciadoLower.includes('fÃ­sica') ||
      enunciadoLower.includes('quÃ­mica') ||
      enunciadoLower.includes('biologia')
    ) {
      return 'CiÃªncias da Natureza';
    }

    if (
      enunciadoLower.includes('matemÃ¡tica') ||
      enunciadoLower.includes('equaÃ§Ã£o') ||
      enunciadoLower.includes('geometria')
    ) {
      return 'MatemáticaÃ¡tica';
    }

    return 'NÃ£o classificada';
  }

  /**
   * Classificar conteÃºdo por matÃ©ria com base em palavras-chave
   * @param {string} enunciado - Enunciado da questÃ£o
   * @returns {string} - MatÃ©ria identificada
   */
  classifyByContent(enunciado) {
    const enunciadoLower = enunciado.toLowerCase();

    const materiaKeywords = {
      'Linguagens e CÃ³digos': [
        'literatura',
        'linguagem',
        'gramÃ¡tica',
        'portuguÃªs',
        'texto',
        'autor',
        'obra',
        'figura de linguagem',
        'funÃ§Ã£o da linguagem',
      ],
      'CiÃªncias Humanas': [
        'histÃ³ria',
        'geografia',
        'sociologia',
        'filosofia',
        'polÃ­tica',
        'sociedade',
        'cultura',
        'economia',
        'revoluÃ§Ã£o',
        'colonizaÃ§Ã£o',
        'brasil',
        'imperialismo',
        'globalizaÃ§Ã£o',
      ],
      'CiÃªncias da Natureza': [
        'fÃ­sica',
        'quÃ­mica',
        'biologia',
        'Ã¡tomo',
        'reaÃ§Ã£o',
        'cÃ©lula',
        'forÃ§a',
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
        'polÃ­tica',
        'instituiÃ§Ã£o',
        'poder',
        'marx',
        'durban',
        'weber',
        'movimento social',
        'trabalho',
      ],
    };

    // Verificar cada matÃ©ria
    for (const [materia, keywords] of Object.entries(materiaKeywords)) {
      for (const keyword of keywords) {
        if (enunciadoLower.includes(keyword.toLowerCase())) {
          return materia;
        }
      }
    }

    return 'NÃ£o classificada';
  }
}

export default new LayoutExtractor();
