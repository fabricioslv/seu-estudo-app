// services/extractors/enemExtractor.js
import fs from 'fs';
import pdfParse from 'pdf-parse';

class EnemExtractor {
  async extract(provaPath, gabaritoPath = null) {
    try {
      // Extrair texto da prova
      const provaBuffer = fs.readFileSync(provaPath);
      const provaData = await pdfParse(provaBuffer);
      const provaText = provaData.text;

      // Extrair gabarito se disponÃ­vel
      let gabarito = null;
      if (gabaritoPath) {
        const gabaritoBuffer = fs.readFileSync(gabaritoPath);
        const gabaritoData = await pdfParse(gabaritoBuffer);
        gabarito = this.extractGabarito(gabaritoData.text);
      }

      // Extrair questÃµes
      const questoes = this.extractQuestoes(provaText);

      // Associar respostas do gabarito Ã s questÃµes
      if (gabarito && questoes.length > 0) {
        this.associateGabarito(questoes, gabarito);
      }

      return questoes;
    } catch (error) {
      console.error('Erro na extraÃ§Ã£o do ENEM:', error);
      throw error;
    }
  }

  extractQuestoes(text) {
    const questoes = [];

    // PadrÃµes de reconhecimento de questÃµes do ENEM
    // O ENEM tem um formato relativamente consistente
    const questaoPattern = /(\d+)\.\s*((?:.|\n)*?)(?=(?:\n\d+\. )|$)/g;
    let match;

    while ((match = questaoPattern.exec(text)) !== null) {
      const [_, numero, conteudo] = match;

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
        ano: this.extractAno(text)
      });
    }

    return questoes;
  }

  extractGabarito(text) {
    // PadrÃ£o para extrair gabarito (pode variar dependendo do formato do gabarito)
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

  associateGabarito(questoes, gabarito) {
    for (const questao of questoes) {
      if (gabarito[questao.numero]) {
        questao.resposta_correta = gabarito[questao.numero];
      }
    }
  }

  extractAno(text) {
    // Tentar extrair ano do ENEM do texto
    const anoPattern = /ENEM\s+(\d{4})|(\d{4})\s+â€”\s+Exame Nacional do Ensino MÃ©dio/i;
    const match = text.match(anoPattern);
    return match ? parseInt(match[1] || match[2]) : new Date().getFullYear();
  }

  determinarMateria(numero, enunciado) {
    // No ENEM, as questÃµes sÃ£o agrupadas por Ã¡rea de conhecimento
    // QuestÃµes 1-45: Linguagens e CÃ³digos (Dia 1)
    // QuestÃµes 46-90: CiÃªncias Humanas (Dia 1)
    // QuestÃµes 91-135: CiÃªncias da Natureza (Dia 2)
    // QuestÃµes 136-180: MatemÃ¡tica (Dia 2)

    if (numero >= 1 && numero <= 45) {
      return 'Linguagens e CÃ³digos';
    } else if (numero >= 46 && numero <= 90) {
      return 'CiÃªncias Humanas';
    } else if (numero >= 91 && numero <= 135) {
      return 'CiÃªncias da Natureza';
    } else if (numero >= 136 && numero <= 180) {
      return 'MatemÃ¡tica';
    }

    // AnÃ¡lise baseada em palavras-chave no enunciado
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
      return 'MatemÃ¡tica';
    }

    return 'NÃ£o classificada';
  }
}

export default new EnemExtractor();
