// services/extractors/vestibularExtractor.js
const fs = require('fs');
const pdfParse = require('pdf-parse');

class VestibularExtractor {
  async extract(provaPath, gabaritoPath = null) {
    try {
      // Extrair texto da prova
      const provaBuffer = fs.readFileSync(provaPath);
      const provaData = await pdfParse(provaBuffer);
      const provaText = provaData.text;

      // Extrair gabarito se disponível
      let gabarito = null;
      if (gabaritoPath) {
        const gabaritoBuffer = fs.readFileSync(gabaritoPath);
        const gabaritoData = await pdfParse(gabaritoBuffer);
        gabarito = this.extractGabarito(gabaritoData.text);
      }

      // Extrair questões
      const questoes = this.extractQuestoes(provaText);

      // Associar respostas do gabarito às questões
      if (gabarito && questoes.length > 0) {
        this.associateGabarito(questoes, gabarito);
      }

      return questoes;
    } catch (error) {
      console.error('Erro na extração do Vestibular:', error);
      throw error;
    }
  }

  extractQuestoes(text) {
    const questoes = [];

    // Padrões de reconhecimento de questões de vestibulares
    // Vestibulares podem ter formatos variados, este é um padrão comum
    const questaoPattern =
      /(?:Questão|QUESTÃO|Questao|QUESTAO)\s*(?:n[º°]?)?\s*(\d{1,3})[.\s]+([\s\S]+?)(?=(?:Questão|QUESTÃO|Questao|QUESTAO)\s*(?:n[º°]?)?\s*\d{1,3}|$)/gi;
    const alternativasPattern =
      /(?:[a-e][\s.)-]|[\(]([A-E])[\)])\s*([^\(\na-e]+)/g;

    let match;
    while ((match = questaoPattern.exec(text)) !== null) {
      const numero = parseInt(match[1]);
      const conteudoQuestao = match[2].trim();

      // Separar enunciado das alternativas
      const partes =
        typeof conteudoQuestao === 'string'
          ? conteudoQuestao.split(/\([A-E]\)/)
          : [''];
      const enunciado = partes[0].trim();

      // Extrair alternativas
      const alternativas = {};
      let altMatch;
      alternativasPattern.lastIndex = 0; // Resetar o índice

      while ((altMatch = alternativasPattern.exec(conteudoQuestao)) !== null) {
        // Se o grupo de captura da letra estiver vazio, use o primeiro caractere
        const letra =
          altMatch[1] ||
          conteudoQuestao
            .substring(altMatch.index, altMatch.index + 1)
            .toUpperCase();
        const texto = altMatch[2].trim();

        if (letra && letra.match(/[A-E]/) && texto) {
          alternativas[letra] = texto;
        }
      }

      // Determinar matéria baseada em palavras-chave
      const materia = this.determinarMateria(enunciado);

      questoes.push({
        numero,
        enunciado,
        alternativas,
        resposta_correta: null, // Será preenchido pelo gabarito
        materia,
      });
    }

    return questoes;
  }

  extractGabarito(text) {
    const gabarito = {};

    // Padrões comuns de gabarito de vestibulares
    const gabaritoPatterns = [
      /(\d{1,3})[.\s]+([A-E])/g, // Formato: "1. A 2. B 3. C ..."
      /([A-E])[.\s]+(\d{1,3})/g, // Formato: "A. 1 B. 2 C. 3 ..."
      /Questão\s+(\d{1,3})[.\s]*([A-E])/gi, // Formato: "Questão 1 A Questão 2 B ..."
    ];

    for (const pattern of gabaritoPatterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        // Verificar qual grupo contém o número e qual contém a letra
        let numero, resposta;

        if (match[1].match(/\d+/)) {
          numero = parseInt(match[1]);
          resposta = match[2];
        } else {
          numero = parseInt(match[2]);
          resposta = match[1];
        }

        if (numero && resposta) {
          gabarito[numero] = resposta;
        }
      }
    }

    return gabarito;
  }

  associateGabarito(questoes, gabarito) {
    for (const questao of questoes) {
      if (gabarito[questao.numero]) {
        questao.resposta_correta = gabarito[questao.numero];
      }
    }
  }

  determinarMateria(enunciado) {
    const enunciadoLower = enunciado.toLowerCase();

    // Mapeamento de palavras-chave para matérias
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
      ],
      Filosofia: [
        'filósofo',
        'pensamento',
        'ética',
        'moral',
        'conhecimento',
        'existência',
        'metafísica',
      ],
      Sociologia: [
        'sociedade',
        'cultura',
        'classe',
        'social',
        'política',
        'instituição',
        'poder',
      ],

    // Verificar cada matéria
    for (const [materia, keywords] of Object.entries(materiaKeywords)) {
      for (const keyword of keywords) {
        if (enunciadoLower.includes(keyword)) {
          return materia;
        }
      }
    }

    return 'Não classificada';
  }
}

module.exports = new VestibularExtractor();
