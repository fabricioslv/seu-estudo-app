// services/extractors/unifiedExtractor.js
import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';

class UnifiedExtractor {
  constructor() {
    // Define patterns for different exam types
    this.examPatterns = {
      enem: {
        questaoPattern: /QUESTÃO (\d{1,3})\s+([\s\S]+?)(?=QUESTÃO \d{1,3}|$)/g,
        alternativasPattern: /\(([A-E])\)\s+([^\(]+)/g,
        gabaritoPattern: /(\d{1,3})[.\s]+([A-E])/g,
      },
      vestibular: {
        questaoPattern:
          /(?:Questão|QUESTÃO|Questao|QUESTAO)\s*(?:n[º°]?)?\s*(\d{1,3})[.\s]+([\s\S]+?)(?=(?:Questão|QUESTÃO|Questao|QUESTAO)\s*(?:n[º°]?)?\s*\d{1,3}|$)/gi,
        alternativasPattern: /(?:[a-e][\s.)-]|[\(]([A-E])[\)])\s*([^\(a-e]+)/g,
        gabaritoPattern: /(\d{1,3})[.\s]+([A-E])/g,
      },
    };
  }

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

      // Identify the type of exam based on the file
      const examType = this.identifyExamType(provaPath);

      // Extract text from the exam
      const provaBuffer = fs.readFileSync(provaPath);
      const provaData = await pdfParse(provaBuffer);
      const provaText = provaData.text;

      // Validate that we got text content
      if (!provaText || provaText.trim().length === 0) {
        throw new Error(`Nenhum texto extraído do PDF: ${provaPath}`);
      }

      // Extract text from the answer key if provided
      let gabarito = null;
      if (gabaritoPath) {
        try {
          const gabaritoBuffer = fs.readFileSync(gabaritoPath);
          const gabaritoData = await pdfParse(gabaritoBuffer);
          gabarito = this.extractGabarito(gabaritoData.text);
        } catch (gabaritoError) {
          console.warn(
            `Erro ao processar gabarito ${gabaritoPath}:`,
            gabaritoError.message
          );
          // Continue without gabarito instead of failing the whole extraction
        }
      }

      // Extract questions based on the exam type
      const questoes = this.extractQuestoes(provaText, examType);

      // Validate questions extraction
      if (!questoes || questoes.length === 0) {
        throw new Error(`Nenhuma questão encontrada no arquivo: ${provaPath}`);
      }

      // Associate answers from the answer key to the questions
      if (gabarito && Object.keys(gabarito).length > 0 && questoes.length > 0) {
        this.associateGabarito(questoes, gabarito);
      }

      // Validation summary
      const validation = this.validateExtraction(questoes);

      return {
        questoes,
        examType,
        filename: path.basename(provaPath),
        validation,
      };
    } catch (error) {
      console.error('Erro na extração:', error);
      throw error;
    }
  }

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

    // Default to vestibular if not clearly ENEM
    return 'vestibular';
  }

  extractQuestoes(text, examType = 'vestibular') {
    const questoes = [];
    const patterns = this.examPatterns[examType];

    let match;
    const questaoPattern = patterns.questaoPattern;

    // Reset regex lastIndex to avoid issues with global regex
    questaoPattern.lastIndex = 0;

    while ((match = questaoPattern.exec(text)) !== null) {
      const numero = parseInt(match[1]);
      const conteudoQuestao = match[2].trim();

      // Validate question number
      if (isNaN(numero) || numero <= 0) {
        console.warn(`Número de questão inválido encontrado: ${match[1]}`);
        continue;
      }

      // Separate question text from alternatives
      let enunciado = conteudoQuestao;
      let alternativasStartIndex = -1;

      // Find where the alternatives start
      if (examType === 'enem') {
        alternativasStartIndex = conteudoQuestao.search(/\\([A-E]\\)/);
      } else {
        alternativasStartIndex = conteudoQuestao.search(
          /(?:[a-e][\\s.)-]|[\\(][A-E][\\)])/
        );
      }

      if (alternativasStartIndex > 0) {
        enunciado = conteudoQuestao.substring(0, alternativasStartIndex).trim();
      }

      // Extract alternatives
      const alternativas = {};
      let altMatch;
      const alternativasPattern = patterns.alternativasPattern;
      alternativasPattern.lastIndex = 0; // Reset index

      while ((altMatch = alternativasPattern.exec(conteudoQuestao)) !== null) {
        const letra =
          altMatch[1] ||
          (examType === 'vestibular' &&
            conteudoQuestao
              .substring(altMatch.index, altMatch.index + 1)
              .toUpperCase());
        const texto = altMatch[2] ? altMatch[2].trim() : '';

        if (letra && letra.match(/[A-E]/) && texto) {
          alternativas[letra] = texto;
        }
      }

      // Validate that we have alternatives
      if (Object.keys(alternativas).length < 2) {
        console.warn(
          `Questão ${numero} tem menos de 2 alternativas válidas. Pode ser uma questão discursiva.`
        );
      }

      // Determine subject based on keywords
      const materia = this.determinarMateria(numero, enunciado, examType);

      // Extract year from filename if possible
      const ano = this.extractAno(path.basename(provaPath));

      // Calculate difficulty
      const dificuldade = this.extractDifficulty(enunciado, examType);

      questoes.push({
        numero,
        enunciado: enunciado || '', // Ensure enunciado is not null/undefined
        alternativas: alternativas,
        resposta_correta: null, // Will be filled by the answer key
        materia,
        ano,
        dificuldade,
        examType, // Include the exam type for reference
      });
    }

    return questoes;
  }

  extractGabarito(text) {
    const gabarito = {};

    if (!text || text.trim().length === 0) {
      console.warn('Texto do gabarito está vazio');
      return gabarito;
    }

    // Try multiple patterns for answer key extraction

    // Pattern 1: "1. A 2. B 3. C ..."
    const pattern1 = /(\d{1,3})[.\s]+([A-E])/gi;
    let match;

    while ((match = pattern1.exec(text)) !== null) {
      const numero = parseInt(match[1]);
      const resposta = match[2];
      if (!isNaN(numero) && resposta) {
        gabarito[numero] = resposta;
      }
    }

    // Pattern 2: "Questão 1 A Questão 2 B ..."
    const pattern2 = /Questão\s+(\d{1,3})[.\s]*([A-E])/gi;
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

    return gabarito;
  }

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
    };

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

  extractAno(filename) {
    // Extract year from filename patterns like 2020_PV_impresso_D1_CD1.pdf
    const yearMatch = filename.match(/(20[0-9]{2})/);
    if (yearMatch) {
      return parseInt(yearMatch[1]);
    }

    return null;
  }

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
    ];

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

export default new UnifiedExtractor();
