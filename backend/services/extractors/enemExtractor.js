// services/extractors/enemExtractor.js
const fs = require('fs');
const pdfParse = require('pdf-parse');

class EnemExtractor {
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
      console.error('Erro na extração do ENEM:', error);
      throw error;
    }
  }

  extractQuestoes(text) {
    const questoes = [];

    // Padrões de reconhecimento de questões do ENEM
    // O ENEM tem um formato relativamente consistente
    const questaoPattern =
      /QUESTÃO (\d{1,3})\s+([\s\S]+?)(?=QUESTÃO \d{1,3}|$)/g;
    const alternativasPattern = /\(([A-E])\)\s+([^\(]+)/g;

    let match;
    while ((match = questaoPattern.exec(text)) !== null) {
      const numero = parseInt(match[1]);
      const conteudoQuestao = match[2].trim();

      // Separar enunciado das alternativas
      // No ENEM, as alternativas geralmente começam com (A), (B), etc.
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
        const letra = altMatch[1];
        const texto = altMatch[2].trim();
        alternativas[letra] = texto;
      }

      // Determinar matéria baseada em palavras-chave ou posição
      const materia = this.determinarMateria(numero, enunciado);

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

    // Padrões comuns de gabarito do ENEM
    // Formato típico: "1. A 2. B 3. C ..."
    const gabaritoPattern = /(\d{1,3})[.\s]+([A-E])/g;

    let match;
    while ((match = gabaritoPattern.exec(text)) !== null) {
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

  determinarMateria(numero, enunciado) {
    // No ENEM, as questões são agrupadas por área de conhecimento
    // Questões 1-45: Linguagens e Códigos (Dia 1)
    // Questões 46-90: Ciências Humanas (Dia 1)
    // Questões 91-135: Ciências da Natureza (Dia 2)
    // Questões 136-180: Matemática (Dia 2)

    if (numero >= 1 && numero <= 45) {
      return 'Linguagens e Códigos';
    } else if (numero >= 46 && numero <= 90) {
      return 'Ciências Humanas';
    } else if (numero >= 91 && numero <= 135) {
      return 'Ciências da Natureza';
    } else if (numero >= 136 && numero <= 180) {
      return 'Matemática';
    }

    // Análise baseada em palavras-chave no enunciado
    const enunciadoLower = enunciado.toLowerCase();


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


      enunciadoLower.includes('física') ||
      enunciadoLower.includes('química') ||
      enunciadoLower.includes('biologia')
    ) {
      return 'Ciências da Natureza';
    }


      enunciadoLower.includes('matemática') ||
      enunciadoLower.includes('equação') ||
      enunciadoLower.includes('geometria')
    ) {
      return 'Matemática';
    }

    return 'Não classificada';
  }
}

module.exports = new EnemExtractor();
