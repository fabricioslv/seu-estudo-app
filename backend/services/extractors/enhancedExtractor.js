// services/extractors/enhancedExtractor.js
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import enemApiService from '../enemApiService.js';

class EnhancedExtractor {
  constructor() {
    // Define patterns for different exam types with better regex
    this.examPatterns = {
      enem: {
        // QUESTÃO followed by question number then content
        questaoPattern:
          /(?:QUESTÃO|Questão|Questao|QUESTAO)\s*(?:n[º°]?\s*)?(\d{1,3})[\s\n\r]*([A-Z\s\n\r][\s\S]*?)(?=(?:QUESTÃO|Questão|Questao|QUESTAO)\s*(?:n[º°]?\s*)?\d{1,3}|$)/gi,
        // Alternatives format (A), (B), (C), etc.
        alternativasPattern:
          /[\(\s]([A-E])[\)\s]+([A-Z][^A-E\n\r\(]*?)(?=\s*[\(\s][A-E][\)\s]|$)/gi,
        // Answer key pattern
        gabaritoPattern: /(\d{1,3})[.\s]+([A-E])/gi,
      },
      vestibular: {
        // More flexible question pattern
        questaoPattern:
          /(?:Questão|QUESTÃO|Questao|QUESTAO)\s*(?:n[º°]?\s*)?(\d{1,3})[.\s\n\r]*([A-Z\s\n\r][\s\S]*?)(?=(?:Questão|QUESTÃO|Questao|QUESTAO)\s*(?:n[º°]?\s*)?\d{1,3}|$)/gi,
        // Alternatives with various formats
        alternativasPattern:
          /([A-E])[.\)]\s*([A-Z][^A-E\n\r\(]*?)(?=\s*([A-E])[.\)]|$)|[\(\s]([A-E])[\)\s]+([A-Z][^A-E\n\r\(]*?)(?=\s*[\(\s][A-E][\)\s]|$)/gi,
        // Answer key pattern
        gabaritoPattern: /(\d{1,3})[.\s]+([A-E])/gi,
      },
    };
  }

  /**
   * Enhanced method to extract questions from PDF files
   * @param {string} provaPath - Path to the exam PDF file
   * @param {string} gabaritoPath - Optional path to the answer key PDF file
   * @returns {Promise<Object>} - Extracted questions and metadata
   */
  async extract(provaPath, gabaritoPath = null) {
    try {
      // Validate input files exist
      if (!fs.existsSync(provaPath)) {
        throw new Error(`Arquivo de prova não encontrado: ${provaPath}`);
      }

      if (gabaritoPath && !fs.existsSync(gabaritoPath)) {
        console.warn(`Arquivo de gabarito não encontrado: ${gabaritoPath}`);
        gabaritoPath = null; // Reset if doesn't exist
      }

      // Store the provaPath for use in other methods
      this.currentProvaPath = provaPath;

      // Identify the type of exam based on the file
      const examType = this.identifyExamType(provaPath);
      console.log(`Tipo de exame identificado: ${examType}`);

      // Extract text from the exam
      const provaBuffer = fs.readFileSync(provaPath);
      const provaData = await pdfParse(provaBuffer);
      const provaText = provaData.text;

      // Clean up the text to remove extra spaces and normalize line breaks
      const cleanedText = this.cleanText(provaText);

      // Validate that we got text content
      if (!cleanedText || cleanedText.trim().length === 0) {
        throw new Error(`Nenhum texto extraído do PDF: ${provaPath}`);
      }

      console.log(`Texto extraído com ${cleanedText.length} caracteres`);

      // Extract text from the answer key if provided
      let gabarito = null;
      if (gabaritoPath) {
        try {
          const gabaritoBuffer = fs.readFileSync(gabaritoPath);
          const gabaritoData = await pdfParse(gabaritoBuffer);
          const cleanedGabaritoText = this.cleanText(gabaritoData.text);
          gabarito = this.extractGabarito(cleanedGabaritoText);
          console.log(
            `Gabarito extraído com ${Object.keys(gabarito).length} respostas`
          );
        } catch (gabaritoError) {
          console.warn(
            `Erro ao processar gabarito ${gabaritoPath}:`,
            gabaritoError.message
          );
          // Continue without gabarito instead of failing the whole extraction
        }
      }

      // Extract questions based on the exam type
      const questoes = this.extractQuestoes(cleanedText, examType);

      // Validate questions extraction
      if (!questoes || questoes.length === 0) {
        console.warn(
          `Nenhuma questão encontrada no arquivo: ${provaPath}. Tentando abordagem alternativa.`
        );
        // Try alternative extraction approach
        const alternativeQuestoes = this.extractQuestoesAlternative(
          cleanedText,
          examType
        );
        if (alternativeQuestoes && alternativeQuestoes.length > 0) {
          console.log(
            `Extração alternativa encontrou ${alternativeQuestoes.length} questões`
          );
          return {
            questoes: alternativeQuestoes,
            examType,
            filename: path.basename(provaPath),
            validation: this.validateExtraction(alternativeQuestoes),
          };
        }
        throw new Error(`Nenhuma questão encontrada no arquivo: ${provaPath}`);
      }

      console.log(`Extraídas ${questoes.length} questões`);

      // Check if we have questions with good alternativa detection, otherwise try layout extractor
      const questoesComAlternativas = questoes.filter(
        (q) => Object.keys(q.alternativas).length >= 4
      );
      if (
        questoes.length > 0 &&
        questoesComAlternativas.length < questoes.length * 0.5
      ) {
        // Less than 50% of questions have good alternativas, try layout extraction as alternative
        console.log(
          `Taxa baixa de alternativas detectadas (${questoesComAlternativas.length}/${questoes.length}), tentando extração com layout...`
        );

        try {
          const layoutResult = await layoutExtractor.extract(
            provaPath,
            gabaritoPath
          );
          if (layoutResult.questoes && layoutResult.questoes.length > 0) {
            // Compare which extraction has better alternativa detection
            const layoutQuestoesComAlternativas = layoutResult.questoes.filter(
              (q) => Object.keys(q.alternativas).length >= 4
            );

            if (
              layoutQuestoesComAlternativas.length >
              questoesComAlternativas.length
            ) {
              console.log(
                `Extração com layout teve melhor detecção de alternativas (${layoutQuestoesComAlternativas.length} vs ${questoesComAlternativas.length}), usando esse resultado`
              );
              return {
                ...layoutResult,
                extractionMethod: 'layout',
              };
            }
          }
        } catch (layoutError) {
          console.warn(
            'Falha na extração com layout, continuando com enhanced extractor:',
            layoutError.message
          );
        }

      // Associate answers from the answer key to the questions
      if (gabarito && Object.keys(gabarito).length > 0 && questoes.length > 0) {
        this.associateGabarito(questoes, gabarito);
      }

      // Validation summary
      const validation = this.validateExtraction(questoes);

      // Complementar as questões com dados da API do ENEM quando possível
      const questoesComplementadas = await this.complementarComAPI(questoes);

      return {
        questoes: questoesComplementadas,
        examType,
        filename: path.basename(provaPath),
        validation,
        extractionMethod: 'enhanced',
      };
    } catch (error) {
      console.error('Erro na extração:', error);
      throw error;
    }
  }

  /**
   * Improved text cleaning to normalize PDF extraction artifacts
   * @param {string} text - Raw text from PDF
   * @returns {string} - Cleaned text
   */
  cleanText(text) {
    if (!text) return '';

    return (
      text
        // Replace multiple consecutive spaces with single space
        .replace(/\s{2,}/g, ' ')
        // Normalize line breaks
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n')
        // Replace multiple consecutive line breaks with single break
        .replace(/\n{3,}/g, '\n\n')
        // Remove page numbers and headers/footers that might contain page indicators
        .replace(/\n\d+\n/g, '\n')
        // Clean up specific PDF artifacts
        .trim()
    );
  }

  /**
   * Improved method to identify exam type
   * @param {string} filePath - Path to the PDF file
   * @returns {string} - Exam type ('enem' or 'vestibular')
   */
  identifyExamType(filePath) {
    const filename = path.basename(filePath).toLowerCase();

    // Check if it's an ENEM exam based on filename patterns
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

    // Check for vestibular patterns
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

    // Default to vestibular if not clearly ENEM
    return 'vestibular';
  }

  /**
   * Main question extraction method
   * @param {string} text - Cleaned text from PDF
   * @param {string} examType - Type of exam ('enem' or 'vestibular')
   * @returns {Array} - Array of extracted questions
   */
  extractQuestoes(text, examType = 'vestibular') {
    const questoes = [];
    const patterns = this.examPatterns[examType];

    // First, let's try to find all possible question matches
    let match;
    const questaoPattern = new RegExp(
      patterns.questaoPattern.source,
      patterns.questaoPattern.flags

    while ((match = questaoPattern.exec(text)) !== null) {
      const numeroStr = match[1];
      const numero = parseInt(numeroStr);
      const conteudoQuestao = match[2].trim();

      // Validate question number
      if (isNaN(numero) || numero <= 0) {
        console.warn(`Número de questão inválido encontrado: ${numeroStr}`);
        continue;
      }

      // Separate question text from alternatives
      let enunciado = conteudoQuestao;
      const alternativasStartIndex = this.findAlternativesStart(conteudoQuestao, examType);

      if (alternativasStartIndex > 0) {
        enunciado = conteudoQuestao.substring(0, alternativasStartIndex).trim();
      }

      // Extract alternatives
      const alternativas = this.extractAlternativas(conteudoQuestao, examType);

      // Validate that we have meaningful alternatives
      if (Object.keys(alternativas).length < 2) {
        console.warn(
          `Questão ${numero} tem menos de 2 alternativas válidas (${Object.keys(alternativas).length}). Pode ser uma questão discursiva ou o padrão de alternativas não foi reconhecido.`
        );
        // Only log first 200 chars to avoid console spam
        if (conteudoQuestao.length > 0) {
          console.debug(
            `Questão ${numero} conteúdo (primeiros 200 chars):`,
            conteudoQuestao.substring(0, 200) + '...'
          );
        }
      }

      // Determine subject based on keywords
      const materia = this.determinarMateria(numero, enunciado, examType);

      // Extract year from filename passed from extract method
      const ano = this.extractAno(path.basename(this.currentProvaPath));

      // Calculate difficulty
      const dificuldade = this.extractDifficulty(enunciado, examType);

      questoes.push({
        numero,
        enunciado: enunciado || '', // Ensure enunciado is not null/undefined
        alternativas,
        resposta_correta: null, // Will be filled by the answer key
        materia,
        ano,
        dificuldade,
        examType, // Include the exam type for reference
      });
    }

    return questoes;
  }

  /**
   * Alternative approach to extract questions when primary method fails
   * @param {string} text - Cleaned text from PDF
   * @param {string} examType - Type of exam
   * @returns {Array} - Array of extracted questions
   */
  extractQuestoesAlternative(text, examType = 'vestibular') {
    const questoes = [];

    // Split text by lines and look for question patterns
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Look for question number patterns like "1." or "1)" or "Questão 1"
      const questaoMatch = line.match(
        /^(?:Questão|QUESTÃO|Questao|QUESTAO)?\s*(?:n[º°]?\s*)?(\d{1,3})[\.\)]?\s*(.*)/i
      );
      if (questaoMatch) {
        const numero = parseInt(questaoMatch[1]);
        const enunciado = questaoMatch[2] || '';

        // Look for alternatives in the following lines
        const alternativas = {};
        let j = i + 1;

        while (j < lines.length && j < i + 20) {
          // Look at most 20 lines ahead for alternatives
          const currentLine = lines[j].trim();

          // Check for alternative patterns
          const altMatch1 = currentLine.match(/^([A-E])[\.\)]\s+(.*)/i);
          const altMatch2 = currentLine.match(/\(([A-E])\)\s+(.*)/i);

          if (altMatch1 || altMatch2) {
            const letra = (
              altMatch1 ? altMatch1[1] : altMatch2[1]
            ).toUpperCase();
            const texto = altMatch1 ? altMatch1[2] : altMatch2[2];
            alternativas[letra] = texto;
          }

          // If we've seen several alternatives, assume this question is complete
          if (Object.keys(alternativas).length >= 5) break;

          // Look for end of question markers (next question or end of content)
          if (
            currentLine.match(
              /^(?:Questão|QUESTÃO|Questao|QUESTAO)?\s*(?:n[º°]?\s*)?\d{1,3}[\.\)]?/i
            )
          ) {

          j++;
        }

        if (Object.keys(alternativas).length >= 2) {
          questoes.push({
            numero,
            enunciado: enunciado,
            alternativas,
            resposta_correta: null,
            materia: this.determinarMateria(numero, enunciado, examType),
            ano: this.extractAno(path.basename(this.currentProvaPath)),
            dificuldade: this.extractDifficulty(enunciado, examType),
            examType,
          });

          i = j - 1; // Skip processed lines
        }
      }
    }

    return questoes;
  }

  /**
   * Find where alternatives start in the question text
   * @param {string} text - Question content
   * @param {string} examType - Type of exam
   * @returns {number} - Index where alternatives start
   */
  findAlternativesStart(text, examType) {
    if (!text) return -1;

    // Look for the first occurrence of alternatives pattern
    const alternativasPattern =
      examType === 'enem'
        ? /[\(\s]([A-E])[\)\s]/i
        : /(?:[A-E][.\)]|\([A-E]\))/i;

    const match = alternativasPattern.exec(text);
    return match ? match.index : -1;
  }

  /**
   * Extract alternatives from the question content
   * @param {string} content - Content that may contain alternatives
   * @param {string} examType - Type of exam
   * @returns {Object} - Alternatives object
   */
  extractAlternativas(content, examType) {
    const alternativas = {};

    // For ENEM, try to identify patterns where alternatives appear after question text
    // ENEM often has: question text followed by alternatives marked as A), B), C), D), E)

    // First, normalize the content by replacing common special characters and normalizing newlines
    const normalizedContent = content.replace(/\u000f/g, ' ').replace(/\u0011/g, ' ').replace(/[^\x00-\x7F]/g, ' ');

    // Split content into lines to handle alternatives that appear on separate lines
    const lines = normalizedContent.split(/\r?\n/);

    // First pass: Look for alternatives with various formatting patterns
    for (const line of lines) {
      const trimmedLine = line.trim();

      // Pattern 1: A) text, B) text, C) text, etc. (at the beginning of line)
      const pattern1 = trimmedLine.match(/^([A-E])[.\)]\s*(.+)$/i);
      if (pattern1) {
        const letra = pattern1[1].toUpperCase();
        const texto = pattern1[2].trim();
        if (texto) {
          alternativas[letra] = texto;
        }
        continue; // Move to next line after finding an alternative
      }

      // Pattern 2: (A) text, (B) text, etc. (at the beginning of line)
      const pattern2 = trimmedLine.match(/^\(([A-E])\)\s*(.+)$/i);
      if (pattern2) {
        const letra = pattern2[1].toUpperCase();
        const texto = pattern2[2].trim();
        if (texto) {
          alternativas[letra] = texto;
        }
        continue; // Move to next line after finding an alternative
      }
    }

    // If we didn't find alternatives in the line-by-line approach, try different strategies

    // ENEM specific pattern detection: look for complete alternative sets
    // Pattern: A) text... B) text... C) text... D) text... E) text...
    const fullPattern =
      /([A-E])[.\)]\s*([^A-E\n\r\(]*?)(?=(?:\s*[A-E][.\)]\s)|$)/gi;
    let match;

    while ((match = fullPattern.exec(normalizedContent)) !== null) {
      const letra = match[1].toUpperCase();
      const texto = match[2].trim();

      // Filter out very short texts that are likely not alternatives (like single letters/numbers)
      if (texto && texto.length > 3) {
        alternativas[letra] = texto;
      }
    }

    // If still not enough alternatives found, try a more permissive pattern
    if (Object.keys(alternativas).length < 2) {
      // Look for alternatives in the last part of the content (where ENEM alternatives typically appear)
      // Find the last occurrence of multiple alternative patterns
      const multiPattern =
        /([A-E])\s*[.\)]\s*([^A-E\n\r\(]*?)(?=\s*([A-E])\s*[.\)]|$)/gi;

      // Reset the regex
      multiPattern.lastIndex = 0;
      while ((match = multiPattern.exec(normalizedContent)) !== null) {
        const letra = match[1].toUpperCase();
        const texto = match[2].trim();

        if (texto && texto.length > 2) {
          alternativas[letra] = texto;
        }
      }
    }

    // Final attempt: if the content has "A) ... B) ... C) ... D) ... E)" format but in a single line
    if (Object.keys(alternativas).length < 2) {
      // Split content and look for the part after the question ends, where alternatives appear
      const parts = normalizedContent.split(/(\n\s*){2,}/); // Split by multiple newlines

      // Usually alternatives appear in the last section or in the last 500 characters
      const lastPart =
        parts.length > 1
          ? parts[parts.length - 1]
          : normalizedContent.slice(-1500);

      // Look for alternative pattern in the last part
      const altPattern = /([A-E])[.\)]\s*([^A-E.]*?)(?=\s*[A-E][.\)]|$)/gi;
      while ((match = altPattern.exec(lastPart)) !== null) {
        const letra = match[1].toUpperCase();
        const texto = match[2].trim();

        if (texto && texto.length > 1) {
          alternativas[letra] = texto;
        }
      }
    }

    // For ENEM and Vestibular, if we still don't have enough alternatives,
    // it might be because the PDF extraction wasn't clean enough
    // In such cases, we could also look for patterns in the full content
    if (Object.keys(alternativas).length < 2 && examType === 'enem') {
      // ENEM specific: alternatives are typically in a structured format
      // Look for the pattern where alternatives follow A), B), C), D), E)
      const enemPattern = /([A-E])[.)]\s*([^\n]*?)(?=\n[A-E][.)]|\n\n|$)/g;
      while ((match = enemPattern.exec(normalizedContent)) !== null) {
        const letra = match[1].toUpperCase();
        const texto = match[2].trim();

        if (texto && texto.length > 1) {
          alternativas[letra] = texto;
        }
      }
    }

    return alternativas;
  }

  /**
   * Extract answer key from text
   * @param {string} text - Text from answer key PDF
   * @returns {Object} - Answer key object
   */
  extractGabarito(text) {
    const gabarito = {};

    if (!text || text.trim().length === 0) {
      console.warn('Texto do gabarito está vazio');
      return gabarito;
    }

    // Try multiple patterns for answer key extraction

    // Pattern 1: "1. A 2. B 3. C ..." - Common format
    const pattern1 = /(\d{1,3})[.\s]+([A-E])/gi;
    let match;

    while ((match = pattern1.exec(text)) !== null) {
      const numero = parseInt(match[1]);
      const resposta = match[2];
      if (!isNaN(numero) && resposta) {
        gabarito[numero] = resposta;
      }
    }

    // Pattern 2: "Questão 1 A Questão 2 B ..." - Another common format
    const pattern2 = /Questão\s+(\d{1,3})[\.\s]*([A-E])/gi;
    while ((match = pattern2.exec(text)) !== null) {
      const numero = parseInt(match[1]);
      const resposta = match[2];
      if (!isNaN(numero) && resposta) {
        // Only add if not already present
        if (!gabarito[numero]) {
          gabarito[numero] = resposta;
        }
      }
    }

    // Pattern 3: For tables of answers that might be formatted differently
    const pattern3 = /\b(\d{1,3})\s+([A-E])\b/gi;
    while ((match = pattern3.exec(text)) !== null) {
      const numero = parseInt(match[1]);
      const resposta = match[2];
      if (!isNaN(numero) && resposta) {
        // Only add if not already present
        if (!gabarito[numero]) {
          gabarito[numero] = resposta;
        }
      }
    }

    // Pattern 4: Looking for structured answer tables
    const pattern4 = /(\d{1,3})\D*?([A-E])/gi;
    while ((match = pattern4.exec(text)) !== null) {
      const numero = parseInt(match[1]);
      const resposta = match[2];
      if (!isNaN(numero) && resposta) {
        // Only add if not already present
        if (!gabarito[numero]) {
          gabarito[numero] = resposta;
        }
      }
    }

    return gabarito;
  }

  /**
   * Associate answers from the answer key to the questions
   * @param {Array} questoes - Array of questions
   * @param {Object} gabarito - Answer key object
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
   * Determine subject based on question content and number
   * @param {number} numero - Question number
   * @param {string} enunciado - Question content
   * @param {string} examType - Type of exam
   * @returns {string} - Subject name
   */
  determinarMateria(numero, enunciado, examType = 'vestibular') {
    if (!enunciado || enunciado.trim().length === 0) {
      return 'Não classificada';
    }

    const enunciadoLower = enunciado.toLowerCase();

    // Specific logic for ENEM based on question number ranges
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

    // Keyword-based subject determination
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

    // Check each subject
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
   * Extract year from filename
   * @param {string} filename - Name of the file
   * @returns {number|null} - Year or null if not found
   */
  extractAno(filename) {
    // Extract year from filename patterns like 2020_PV_impresso_D1_CD1.pdf
    const yearMatch = filename.match(/(20[0-9]{2})/);
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }

    return null;
  }

  /**
   * Determine difficulty level of question
   * @param {string} enunciado - Question content
   * @param {string} examType - Type of exam
   * @returns {number} - Difficulty level (1-3)
   */
  extractDifficulty(enunciado, examType) {
    if (
      !enunciado ||
      typeof enunciado !== 'string' ||
      enunciado.trim().length === 0
    ) {
      return 1; // Fácil por padrão
    }

    // Simple difficulty determination based on exam type and question complexity
    // This is a basic implementation - can be enhanced with more sophisticated algorithms
    const words = enunciado.split(/\s+/);

    // Count complex words or technical terms as indicators of difficulty
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

    // Difficulty based on complex word density
    const density = complexWords / Math.max(1, words.length / 100);

    if (density > 5) return 3; // Hard
    if (density > 2) return 2; // Medium
    return 1; // Easy
  }

  /**
   * Validate the extraction results
   * @param {Array} questoes - Array of questions
   * @returns {Object} - Validation object
   */
  validateExtraction(questoes) {}

  /**
   * Complementar as questões extraídas com dados da API do ENEM
   * @param {Array} questoes - Array de questões extraídas
   * @returns {Array} - Array de questões complementadas
   */
  async complementarComAPI(questoes) {
    if (!questoes || questoes.length === 0) {
      return questoes;
    }

    // Determinar ano da prova a partir do nome do arquivo ou das questões
    const ano = this.inferirAnoProva(questoes);

    if (!ano) {
      console.log(
        'Não foi possível inferir o ano da prova para complementação com API do ENEM'
      );
      return questoes;
    }

    console.log(
      `Complementando ${questoes.length} questões do ENEM ${ano} com dados da API...`

    try {
      // Obter todas as questões do ano da API
      const questoesApi = await enemApiService.getTodasQuestoesAno(ano);

      if (!questoesApi || questoesApi.length === 0) {
        console.log(
          `Nenhuma questão encontrada na API do ENEM para o ano ${ano}`
        );
        return questoes;
      }

      // Criar um mapa de questões da API por número para busca rápida
      const mapaQuestoesApi = {};
      questoesApi.forEach((q) => {
        mapaQuestoesApi[q.numero] = q;
      });

      // Complementar cada questão extraída com dados da API
      const questoesComplementadas = questoes.map((questao) => {
        const questaoApi = mapaQuestoesApi[questao.numero];

        if (questaoApi) {
          // Complementar os campos ausentes da extração com dados da API
          const questaoComplementada = {
            ...questao,
            // Manter os dados extraídos, mas complementar com dados da API
            materia: questao.materia || questaoApi.materia,
            explicacao: questao.explicacao || questaoApi.explicacao,
            nivel_dificuldade:
              questao.nivel_dificuldade || questaoApi.nivel_dificuldade,
            competencia: questao.competencia || questaoApi.competencia,
            habilidade: questao.habilidade || questaoApi.habilidade,
            caderno: questao.caderno || questaoApi.caderno,
            cor: questao.cor || questaoApi.cor,
            // Campos específicos da API que podem complementar a extração
            ano_vestibular: questao.ano_vestibular || ano,
            origem: 'extraido_e_api', // Indicar que foi complementado
            // Preservar os dados extraídos que são mais confiáveis
            enunciado: questao.enunciado || questaoApi.enunciado,
            alternativas:
              Object.keys(questao.alternativas).length > 0
                ? questao.alternativas
                : questaoApi.alternativas,
            resposta_correta:
              questao.resposta_correta || questaoApi.resposta_correta,
          };

          return questaoComplementada;
        } else {
          // Se não encontrar correspondência na API, manter a questão original
          // mas marcar como apenas extraída
          questao.origem = 'apenas_extraido';
          return questao;
        }
      });

      console.log(
        `Complementação concluída: ${questoes.length} questões processadas`
      );
      return questoesComplementadas;
    } catch (error) {
      console.error('Erro ao complementar com API do ENEM:', error);
      // Em caso de erro, retornar as questões originais sem complementação
      return questoes;
    }
  }

  /**
   * Inferir o ano da prova a partir das questões
   * @param {Array} questoes - Array de questões
   * @returns {number|null} - Ano da prova ou null se não puder inferir
   */
  inferirAnoProva(questoes) {
    if (!questoes || questoes.length === 0) {
      return null;
    }

    // Tentar inferir do ano extraído de uma questão
    const questaoComAno = questoes.find(
      (q) => q.ano && q.ano >= 2009 && q.ano <= new Date().getFullYear()

    if (questaoComAno && questaoComAno.ano) {
      return questaoComAno.ano;
    }

    // Se não encontrar ano nas questões, retornar null
    return null;
  }

  /**
   * Validate the extraction results
   * @param {Array} questoes - Array of questions
   * @returns {Object} - Validation object
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
      // Count questions with/without answers
      if (questao.resposta_correta) {
        validation.questoesComResposta++;
      } else {
        validation.questoesSemResposta++;
      }

      // Track subjects and years
      if (questao.materia) {
        validation.materias.add(questao.materia);
      }

      if (questao.ano) {
        validation.anos.add(questao.ano);
      }

      // Validate question content
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

    // Convert Sets to arrays for easier handling
    validation.materias = Array.from(validation.materias);
    validation.anos = Array.from(validation.anos).sort();

    return validation;
  }
}

export default new EnhancedExtractor();

