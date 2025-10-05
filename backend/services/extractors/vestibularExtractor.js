// services/extractors/vestibularExtractor.js
import fs from 'fs';
import pdfParse from 'pdf-parse';

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
    const questaoPattern = /(?:Questão|QUESTÃO|Questao|QUESTAO)\s*(?:n[º°]?\s*)?(\d{1,3})[\.\s\n\r]*([A-Z\s\n\r][\s\S]*?)(?=(?:Questão|QUESTÃO|Questao|QUESTAO)\s*(?:n[º°]?\s*)?\d{1,3}|$)/gi;

    let match;
    while ((match = questaoPattern.exec(text)) !== null) {
      const [numero, conteudo] = match.slice(1);

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
        materia: this.determinarMateria(enunciado),
        ano: this.extractAno(text),
      });
    }

    return questoes;
  }

  extractGabarito(text) {
    // Padrão para extrair gabarito (pode variar dependendo do formato do gabarito)
    const gabarito = {};
    const pattern = /(\d+)\s*[:\-\s]*([A-E])/gi;
    let match;

    while ((match = pattern.exec(text)) !== null) {
      const numero = parseInt(match[1]);
      const resposta = match[2];
      gabarito[numero] = resposta;
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

  extractAno(text) {
    // Tentar extrair ano do vestibular do texto
    const anoPattern = /(\d{4})[^\d]/g;
    const anos = [];
    let match;

    while ((match = anoPattern.exec(text)) !== null) {
      anos.push(parseInt(match[1]));
    }

    // Retornar o ano mais provável (mais comum nos últimos 20 anos)
    const currentYear = new Date().getFullYear();
    const recentYears = anos.filter(ano => ano >= currentYear - 20 && ano <= currentYear);

    if (recentYears.length > 0) {
      // Retorna o ano mais comum nos recentes
      const counts = {};
      recentYears.forEach(ano => {
        counts[ano] = (counts[ano] || 0) + 1;
      });
      return parseInt(Object.keys(counts).reduce((a, b) => counts[a] > counts[b] ? a : b));
    }

    return currentYear;
  }

  determinarMateria(enunciado) {
    // Análise baseada em palavras-chave no enunciado
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
        'iluminismo',
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
      'Matemática': [
        'matemática',
        'equação',
        'função',
        'geometria',
        'álgebra',
        'número',
        'probabilidade',
        'estatística',
      ],
      'Sociologia': [
        'sociedade',
        'cultura',
        'classe',
        'social',
        'política',
        'instituição',
        'poder',
      ],
    };

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

export default new VestibularExtractor();