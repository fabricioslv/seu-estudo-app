// services/extractors/layoutExtractor.js
const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf');
const path = require('path');

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
      const pdf = await pdfjsLib.getDocument({ data: dataBuffer }).promise;

      const extractedData = {
        text: '',
        pages: [],
        metadata: null
      };

      // Extrai metadados
      extractedData.metadata = await pdf.getMetadata().catch(() => null);

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
   * Método avançado para detectar alternativas em posição nos PDFs
   * @param {Array} positionedTexts - Textos com informações de posição
   * @param {string} examType - Tipo do exame
   * @returns {Object} - Alternativas detectadas com posição
   */
  detectAlternativesByPosition(positionedTexts, examType = 'enem') {
    const alternativas = {};

    // Para detectar alternativas em posição, procuramos padrões como "A)", "B)", "C)", etc.
    // com posições semelhantes (na mesma linha ou coluna)

    for (const item of positionedTexts) {
      // Verifica se o item começa com uma alternativa
      const match = item.str.trim().match(/^([A-E])[)\.]/i);

      if (match) {
        const letra = match[1].toUpperCase();
        // A alternativa provavelmente abrange este item e os próximos em proximidade
        const startIndex = positionedTexts.indexOf(item);

        // Procura o próximo item que começa com uma nova alternativa
        let alternativaTexto = '';
        let endIndex = startIndex;

        for (let i = startIndex; i < positionedTexts.length; i++) {
          const currentItem = positionedTexts[i];
          // Se encontrar próxima alternativa ou estiver distante demais, para
          const nextMatch = currentItem.str.trim().match(/^([A-E])[)\.]/i);

          if (i > startIndex && nextMatch) {
            break;
          }

          alternativaTexto += `${currentItem.str  } `;
          endIndex = i;

          // Verifica distância horizontal - se for muito grande, talvez seja outro parágrafo
          if (i > startIndex) {
            const prevItem = positionedTexts[i - 1];
            const currentX = currentItem.x;
            const prevX = prevItem.x;

            // Se a distância horizontal for muito grande e não estiver na mesma linha
            if (
              Math.abs(currentX - prevX) > 100 &&
              Math.abs(currentItem.y - prevItem.y) > 10
            ) {
              break;
            }
          }
        }

        alternativas[letra] = alternativaTexto.trim();
      }
    }

    return alternativas;
  }

  /**
   * Método principal de extração usando layout
   * @param {string} filePath - Caminho do arquivo PDF
   * @param {string} gabaritoPath - Caminho do arquivo de gabarito (opcional)
   * @returns {Promise<Object>} - Dados extraídos
   */
  async extract(filePath, gabaritoPath = null) {
    try {
      console.log(
        'Iniciando extração com layout para:',
        path.basename(filePath)

      // Extrai o conteúdo com informações de layout
      const layoutData = await this.extractWithLayout(filePath);

      // Identificar o tipo de exame
      const examType = this.identifyExamType(filePath);
      console.log(`Tipo de exame identificado: ${examType}`);

      // Processar o texto de cada página para extrair questões
      const questoes = [];

      for (const page of layoutData.pages) {
        const pageQuestoes = this.extractQuestoesFromPage(page, examType);
        questoes.push(...pageQuestoes);
      }

      console.log(`Extraídas ${questoes.length} questões`);

      // Se houver gabarito, associa as respostas
      if (gabaritoPath && fs.existsSync(gabaritoPath)) {
        const gabarito = await this.extractGabarito(gabaritoPath);
        this.associateGabarito(questoes, gabarito);
      }

      // Validação
      const validation = this.validateExtraction(questoes);

      return {
        questoes,
        examType,
        filename: path.basename(filePath),
        validation,
      };
    } catch (error) {
      console.error('Erro na extração com layout:', error);
      throw error;
    }
  }

  /**
   * Extrair questões de uma página específica com base no layout
   * @param {Object} page - Objeto de página com layout
   * @param {string} examType - Tipo do exame
   * @returns {Array} - Questões extraídas
   */
  extractQuestoesFromPage(page, examType) {
    const questoes = [];
    const positionedTexts = page.positionedTexts;

    // Procura por padrões de questões
    let questaoStartIndex = -1;
    let questaoNumero = null;

    for (let i = 0; i < positionedTexts.length; i++) {
      const item = positionedTexts[i];
      const text = item.str.trim();

      // Procura por "QUESTÃO" seguido de número
      const questaoMatch = text.match(/QUESTÃO\s*(?:n[º°]?\s*)?(\d{1,3})/i);

      if (questaoMatch) {
        // Se já estávamos processando uma questão anterior, finalize-a
        if (questaoStartIndex !== -1 && questaoNumero) {
          const questaoContent = this.extractQuestaoContent(
            positionedTexts.slice(questaoStartIndex, i),
            questaoNumero,
            examType
          );
          if (questaoContent) {
            questoes.push(questaoContent);
          }
        }

        questaoNumero = parseInt(questaoMatch[1]);
        questaoStartIndex = i;
      }
    }

    // Processar a última questão, se existir
    if (questaoStartIndex !== -1 && questaoNumero) {
      const questaoContent = this.extractQuestaoContent(
        positionedTexts.slice(questaoStartIndex),
        questaoNumero,
        examType
      );
      if (questaoContent) {
        questoes.push(questaoContent);
      }
    }

    return questoes;
  }

  /**
   * Extrair conteúdo de uma única questão com base nos textos posicionados
   * @param {Array} positionedTexts - Textos da questão com posições
   * @param {number} numero - Número da questão
   * @param {string} examType - Tipo do exame
   * @returns {Object|null} - Questão extraída ou null
   */
  extractQuestaoContent(positionedTexts, numero, examType) {
    if (positionedTexts.length === 0) return null;

    // Encontrar o enunciado e as alternativas
    let enunciado = '';
    let alternativas = {};
    let enunciadoEndIndex = -1;

    // Primeiro, encontrar onde termina o enunciado e começam as alternativas
    for (let i = 0; i < positionedTexts.length; i++) {
      const item = positionedTexts[i];
      const text = item.str.trim();

      // Procurar pelo primeiro indicativo de alternativa
      if (text.match(/^\s*([A-E])[)\.]/)) {
        enunciadoEndIndex = i;
        break;
      }

      // Adicionar texto ao enunciado
      enunciado += `${text  } `;
    }

    // Extrair enunciado
    if (enunciadoEndIndex > 0) {
      enunciado = positionedTexts
        .slice(0, enunciadoEndIndex)
        .map((item) => item.str)
        .join(' ')
        .trim();
    } else {
      enunciado = positionedTexts
        .map((item) => item.str)
        .join(' ')
        .trim();
    }

    // Extrair alternativas a partir do índice encontrado
    if (enunciadoEndIndex >= 0) {
      const alternativasFromPosition = this.detectAlternativesByPosition(
        positionedTexts.slice(enunciadoEndIndex),
        examType
      );
      alternativas = alternativasFromPosition;
    }

    // Determinar matéria e ano
    const materia = this.determinarMateria(numero, enunciado, examType);
    const ano = this.extractAno(path.basename(filePath || ''));

    return {
      numero,
      enunciado,
      alternativas,
      resposta_correta: null, // Será preenchida pelo gabarito
      materia,
      ano,
      dificuldade: this.extractDifficulty(enunciado, examType),
      examType,
    };
  }

  /**
   * Identificar o tipo de exame
   * @param {string} filePath - Caminho do arquivo
   * @returns {string} - Tipo do exame
   */
  identifyExamType(filePath) {
    const filename = path.basename(filePath).toLowerCase();

    // Verifica se é uma prova do ENEM
    if (
      filename.includes('enem') ||
      filename.includes('pv_impresso') ||
      (filename.startsWith('20') && filename.includes('_pv_')) ||
      (filename.includes('dia') && filename.includes('caderno')) ||
      ((filename.includes('1_dia') || filename.includes('2_dia')) &&
        (filename.includes('caderno_1') ||
          filename.includes('caderno_5') ||
          filename.includes('caderno_7')))
    ) {
      return 'enem';
    }

    // Verifica padrões de vestibular
    const vestibularKeywords = [
      'fuvest',
      'unicamp',
      'unesp',
      'ufrj',
      'ufmg',
      'puc',
      'vestibular',
      'itajubá',
      'mackenzie',
      'mack',
    ];

    for (const keyword of vestibularKeywords) {
      if (filename.includes(keyword)) {
        return 'vestibular';
      }
    }

    return 'vestibular';
  }

  /**
   * Extrair gabarito de um arquivo
   * @param {string} gabaritoPath - Caminho do arquivo de gabarito
   * @returns {Object} - Gabarito
   */
  async extractGabarito(gabaritoPath) {
    try {
      const layoutData = await this.extractWithLayout(gabaritoPath);
      const gabarito = {};

      // Procurar por padrões de gabarito no texto
      for (const page of layoutData.pages) {
        const text = page.text;

        // Padrões comuns para gabaritos
        const patterns = [
          /(\d{1,3})[.\s]+([A-E])/gi,
          /Questão\s+(\d{1,3})\s+([A-E])/gi,
          /\b(\d{1,3})\D*?([A-E])\b/gi,
        ];

        for (const pattern of patterns) {
          let match;
          while ((match = pattern.exec(text)) !== null) {
            const numero = parseInt(match[1]);
            const resposta = match[2];
            if (!isNaN(numero) && resposta) {
              gabarito[numero] = resposta;
            }
          }
        }
      }

      return gabarito;
    } catch (error) {
      console.error('Erro ao extrair gabarito:', error);
      return {};
    }
  }

  /**
   * Associar gabarito às questões
   * @param {Array} questoes - Questões
   * @param {Object} gabarito - Gabarito
   */
  associateGabarito(questoes, gabarito) {
    if (!gabarito || Object.keys(gabarito).length === 0) {
      console.warn('Nenhum gabarito fornecido para associação');
      return;
    }

    let associadas = 0;
    for (const questao of questoes) {
      if (gabarito[questao.numero]) {
        questao.resposta_correta = gabarito[questao.numero];
        associadas++;
      }
    }

    console.log(
      `Associadas ${associadas} respostas corretas para ${questoes.length} questões`
    );
  }

  /**
   * Determinar matéria da questão
   * @param {number} numero - Número da questão
   * @param {string} enunciado - Enunciado da questão
   * @param {string} examType - Tipo do exame
   * @returns {string} - Matéria
   */
  determinarMateria(numero, enunciado, examType = 'vestibular') {
    if (!enunciado || enunciado.trim().length === 0) {
      return 'Não classificada';
    }

    const enunciadoLower = enunciado.toLowerCase();

    // Lógica específica para ENEM baseada em número de questões
    if (examType === 'enem') {
      if (numero >= 1 && numero <= 45) {
        return 'Linguagens e Códigos';
      } else if (numero >= 46 && numero <= 90) {
        return 'Ciências Humanas';
      } else if (numero >= 91 && numero <= 135) {
        return 'Ciências da Natureza';
      } else if (numero >= 136 && numero <= 180) {
        return 'Matemática';
      }
    }

    // Palavras-chave para determinação de matéria
    const materiaKeywords = {
      Português: [
        'texto',
        'gramática',
        'literatura',
        'linguagem',
        'verbos',
        'substantivo',
        'adjetivo',
        'pronome',
        'acentuação',
        'crase',
        'pontuação',
      ],
      Literatura: [
        'romance',
        'poema',
        'autor',
        'obra',
        'personagem',
        'narrador',
        'machado de assis',
        'clarice lispector',
        'guimarães rosa',
        'mário de andrade',
      ],
      Matemática: [
        'equação',
        'função',
        'geometria',
        'trigonometria',
        'logaritmo',
        'derivada',
        'integral',
        'matriz',
        'logaritmo',
        'estatística',
        'probabilidade',
        'números',
        'álgebra',
      ],
      Física: [
        'velocidade',
        'aceleração',
        'força',
        'energia',
        'eletricidade',
        'magnetismo',
        'óptica',
        'mecânica',
        'ondas',
        'termologia',
        'cinemática',
      ],
      Química: [
        'elemento',
        'reação',
        'mol',
        'átomo',
        'molécula',
        'ácido',
        'base',
        'orgânica',
        'inorgânica',
        'equilíbrio',
        'eletroquímica',
        'tabela periódica',
      ],
      Biologia: [
        'célula',
        'organismo',
        'genética',
        'evolução',
        'ecologia',
        'sistema',
        'tecido',
        'órgão',
        'ciclo celular',
        'dna',
        'rna',
        'bioquímica',
        'reprodução',
      ],
      História: [
        'século',
        'guerra',
        'revolução',
        'império',
        'república',
        'período',
        'civilização',
        'sociedade',
        'brasil',
        'colônia',
        'república',
        'independência',
        'escravidão',
      ],
      Geografia: [
        'relevo',
        'clima',
        'população',
        'economia',
        'território',
        'região',
        'país',
        'continente',
        'urbanização',
        'globalização',
        'meio ambiente',
        'hidrografia',
      ],
      Filosofia: [
        'filósofo',
        'pensamento',
        'ética',
        'moral',
        'conhecimento',
        'existência',
        'metafísica',
        'sócrates',
        'platao',
        'aristóteles',
        'iluminismo',
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

  /**
   * Extrair ano do arquivo
   * @param {string} filename - Nome do arquivo
   * @returns {number|null} - Ano ou null
   */
  extractAno(filename) {
    const yearMatch = filename.match(/(20[0-9]{2})/);
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }
    return null;
  }

  /**
   * Extrair dificuldade da questão
   * @param {string} enunciado - Enunciado da questão
   * @param {string} examType - Tipo do exame
   * @returns {number} - Dificuldade (1-3)
   */
  extractDifficulty(enunciado, examType) {
    if (
      !enunciado ||
      typeof enunciado !== 'string' ||
      enunciado.trim().length === 0
    ) {
      return 1; // Fácil por padrão
    }

    const words = enunciado.split(/\s+/);

    // Contar palavras complexas como indicadores de dificuldade
    let complexWords = 0;
    const complexTerms = [
      'demonstrar',
      'determinar',
      'analisar',
      'comparar',
      'calcular',
      'resolver',
      'comprovar',
      'inferir',
      'interpretar',
      'sintetizar',
      'evidenciar',
      'relacionar',
      'justificar',
      'argumentar',

    for (const word of words) {
      if (complexTerms.some((term) => word.toLowerCase().includes(term))) {
        complexWords++;
      }
    }

    // Dificuldade baseada na densidade de palavras complexas
    const density = complexWords / Math.max(1, words.length / 100);

    if (density > 5) return 3; // Difícil
    if (density > 2) return 2; // Médio
    return 1; // Fácil
  }

  /**
   * Validar extração
   * @param {Array} questoes - Questões extraídas
   * @returns {Object} - Validação
   */
  validateExtraction(questoes) {
    const validation = {
      totalQuestoes: questoes.length,
      questoesComResposta: 0,
      questoesSemResposta: 0,
      materias: new Set(),
      anos: new Set(),
      validas: 0,
      invalidas: 0,
    };

    for (const questao of questoes) {
      // Contar questões com/sem respostas
      if (questao.resposta_correta) {
        validation.questoesComResposta++;
      } else {
        validation.questoesSemResposta++;
      }

      // Acompanhar matérias e anos
      if (questao.materia) {
        validation.materias.add(questao.materia);
      }

      if (questao.ano) {
        validation.anos.add(questao.ano);
      }

      // Validar conteúdo da questão
      if (
        questao.enunciado &&
        questao.enunciado.trim().length > 0 &&
        Object.keys(questao.alternativas).length >= 2
      ) {
        validation.validas++;
      } else {
        validation.invalidas++;
      }
    }

    // Converter Sets para arrays
    validation.materias = Array.from(validation.materias);
    validation.anos = Array.from(validation.anos).sort();

    return validation;
  }
}

module.exports = new LayoutExtractor();
