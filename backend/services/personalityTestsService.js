// services/personalityTestsService.js
// Serviço para gerenciar testes psicológicos de personalidade e vocacionais

class PersonalityTestsService {
  constructor() {
    // Definindo os tipos de testes disponíveis
    this.tiposTestes = {
      personalidade: {
        nome: 'Teste de Personalidade',
        descricao: 'Teste baseado no modelo dos Cinco Grandes Fatores (OCEAN)',
        duracao: 15, // em minutos
      },
      vocacional: {
        nome: 'Teste Vocacional',
        descricao: 'Teste para identificar áreas de interesse profissional',
        duracao: 20, // em minutos
      },
      habilidades: {
        nome: 'Teste de Habilidades',
        descricao: 'Avaliação de habilidades cognitivas e técnicas',
        duracao: 25, // em minutos
      },
    };

    // Banco de perguntas para os testes de personalidade (modelo OCEAN)
    this.perguntasPersonalidade = [
      {
        id: 1,
        tipo: 'personalidade',
        fator: 'extroversao',
        enunciado: 'Eu me considero uma pessoa sociável e comunicativa.',
        alternativas: {
          a: 'Discordo fortemente',
          b: 'Discordo',
          c: 'Neutro',
          d: 'Concordo',
          e: 'Concordo fortemente',
        },
      },
      {
        id: 2,
        tipo: 'personalidade',
        fator: 'extroversao',
        enunciado:
          'Gosto de participar de eventos sociais e conhecer novas pessoas.',
        alternativas: {
          a: 'Discordo fortemente',
          b: 'Discordo',
          c: 'Neutro',
          d: 'Concordo',
          e: 'Concordo fortemente',
        },
      },
      {
        id: 3,
        tipo: 'personalidade',
        fator: 'amabilidade',
        enunciado:
          'Tento ajudar os outros mesmo quando isso me traz desvantagens.',
        alternativas: {
          a: 'Discordo fortemente',
          b: 'Discordo',
          c: 'Neutro',
          d: 'Concordo',
          e: 'Concordo fortemente',
        },
      },
      {
        id: 4,
        tipo: 'personalidade',
        fator: 'amabilidade',
        enunciado:
          'Desconfio das intenções das outras pessoas até que elas provem ser confiáveis.',
        alternativas: {
          a: 'Discordo fortemente',
          b: 'Discordo',
          c: 'Neutro',
          d: 'Concordo',
          e: 'Concordo fortemente',
        },
      },
      {
        id: 5,
        tipo: 'personalidade',
        fator: 'conscienciosidade',
        enunciado: 'Sou organizado e planejo minhas tarefas com antecedência.',
        alternativas: {
          a: 'Discordo fortemente',
          b: 'Discordo',
          c: 'Neutro',
          d: 'Concordo',
          e: 'Concordo fortemente',
        },
      },
      {
        id: 6,
        tipo: 'personalidade',
        fator: 'conscienciosidade',
        enunciado: 'Frequentemente deixo tarefas para a última hora.',
        alternativas: {
          a: 'Discordo fortemente',
          b: 'Discordo',
          c: 'Neutro',
          d: 'Concordo',
          e: 'Concordo fortemente',
        },
      },
      {
        id: 7,
        tipo: 'personalidade',
        fator: 'neuroticismo',
        enunciado: 'Mantenho a calma mesmo em situações estressantes.',
        alternativas: {
          a: 'Discordo fortemente',
          b: 'Discordo',
          c: 'Neutro',
          d: 'Concordo',
          e: 'Concordo fortemente',
        },
      },
      {
        id: 8,
        tipo: 'personalidade',
        fator: 'neuroticismo',
        enunciado: 'Preocupo-me com situações que ainda não aconteceram.',
        alternativas: {
          a: 'Discordo fortemente',
          b: 'Discordo',
          c: 'Neutro',
          d: 'Concordo',
          e: 'Concordo fortemente',
        },
      },
      {
        id: 9,
        tipo: 'personalidade',
        fator: 'abertura',
        enunciado: 'Gosto de experiências novas e desafiantes.',
        alternativas: {
          a: 'Discordo fortemente',
          b: 'Discordo',
          c: 'Neutro',
          d: 'Concordo',
          e: 'Concordo fortemente',
        },
      },
      {
        id: 10,
        tipo: 'personalidade',
        fator: 'abertura',
        enunciado: 'Prefiro rotinas e situações previsíveis.',
        alternativas: {
          a: 'Discordo fortemente',
          b: 'Discordo',
          c: 'Neutro',
          d: 'Concordo',
          e: 'Concordo fortemente',
        },
      },
    ];

    // Banco de perguntas para os testes vocacionais
    this.perguntasVocacionais = [
      {
        id: 1,
        tipo: 'vocacional',
        area: 'exatas',
        enunciado: 'Gosto de resolver problemas matemáticos e lógicos.',
        alternativas: {
          a: 'Nunca',
          b: 'Raramente',
          c: 'Às vezes',
          d: 'Frequentemente',
          e: 'Sempre',
        },
      },
      {
        id: 2,
        tipo: 'vocacional',
        area: 'humanas',
        enunciado:
          'Gosto de estudar a sociedade, a história e as relações humanas.',
        alternativas: {
          a: 'Nunca',
          b: 'Raramente',
          c: 'Às vezes',
          d: 'Frequentemente',
          e: 'Sempre',
        },
      },
      {
        id: 3,
        tipo: 'vocacional',
        area: 'biologicas',
        enunciado: 'Tenho interesse em ciências da vida e saúde.',
        alternativas: {
          a: 'Nunca',
          b: 'Raramente',
          c: 'Às vezes',
          d: 'Frequentemente',
          e: 'Sempre',
        },
      },
      {
        id: 4,
        tipo: 'vocacional',
        area: 'linguagens',
        enunciado: 'Gosto de ler, escrever e analisar textos literários.',
        alternativas: {
          a: 'Nunca',
          b: 'Raramente',
          c: 'Às vezes',
          d: 'Frequentemente',
          e: 'Sempre',
        },
      },
      {
        id: 5,
        tipo: 'vocacional',
        area: 'exatas',
        enunciado: 'Tenho facilidade com cálculos e raciocínio lógico.',
        alternativas: {
          a: 'Nunca',
          b: 'Raramente',
          c: 'Às vezes',
          d: 'Frequentemente',
          e: 'Sempre',
        },
      },
      {
        id: 6,
        tipo: 'vocacional',
        area: 'humanas',
        enunciado: 'Gosto de trabalhar em equipe e ajudar outras pessoas.',
        alternativas: {
          a: 'Nunca',
          b: 'Raramente',
          c: 'Às vezes',
          d: 'Frequentemente',
          e: 'Sempre',
        },
      },
      {
        id: 7,
        tipo: 'vocacional',
        area: 'biologicas',
        enunciado: 'Tenho interesse em trabalhar com pesquisa científica.',
        alternativas: {
          a: 'Nunca',
          b: 'Raramente',
          c: 'Às vezes',
          d: 'Frequentemente',
          e: 'Sempre',
        },
      },
      {
        id: 8,
        tipo: 'vocacional',
        area: 'linguagens',
        enunciado: 'Gosto de expressar minhas ideias por meio da linguagem.',
        alternativas: {
          a: 'Nunca',
          b: 'Raramente',
          c: 'Às vezes',
          d: 'Frequentemente',
          e: 'Sempre',
        },
      },
    ];

    // Banco de informações sobre carreiras
    this.carreiras = [
      {
        id: 1,
        nome: 'Engenharia',
        area: 'exatas',
        descricao:
          'Profissão voltada para a aplicação de conhecimentos científicos e matemáticos para resolver problemas práticos.',
        perfil: ['lógico', 'analítico', 'resolução de problemas'],
        fatores: {
          extroversao: 3,
          amabilidade: 4,
          conscienciosidade: 5,
          neuroticismo: 2,
          abertura: 4,
        },
      },
      {
        id: 2,
        nome: 'Medicina',
        area: 'biologicas',
        descricao:
          'Profissão dedicada à promoção, manutenção e recuperação da saúde.',
        perfil: ['empático', 'detalhista', 'comprometido'],
        fatores: {
          extroversao: 4,
          amabilidade: 5,
          conscienciosidade: 5,
          neuroticismo: 3,
          abertura: 3,
        },
      },
      {
        id: 3,
        nome: 'Direito',
        area: 'humanas',
        descricao:
          'Profissão que envolve a aplicação e interpretação das leis.',
        perfil: ['oratória', 'análise crítica', 'argumentação'],
        fatores: {
          extroversao: 4,
          amabilidade: 3,
          conscienciosidade: 4,
          neuroticismo: 3,
          abertura: 4,
        },
      },
      {
        id: 4,
        nome: 'Jornalismo',
        area: 'linguagens',
        descricao:
          'Profissão voltada para a coleta, produção e disseminação de informações.',
        perfil: ['comunicação', 'curiosidade', 'criatividade'],
        fatores: {
          extroversao: 4,
          amabilidade: 4,
          conscienciosidade: 3,
          neuroticismo: 3,
          abertura: 5,
        },
      },
    ];
  }

  /**
   * Obter um teste específico
   * @param {string} tipo - Tipo do teste
   * @returns {Object} - Informações do teste
   */
  getTeste(tipo) {
    if (!this.tiposTestes[tipo]) {
      throw new Error(`Tipo de teste não encontrado: ${tipo}`);
    }

    // Selecionar perguntas do tipo apropriado
    let perguntas = [];
    if (tipo === 'personalidade') {
      perguntas = [...this.perguntasPersonalidade];
    } else if (tipo === 'vocacional') {
      perguntas = [...this.perguntasVocacionais];
    } else {
      // Para testes de habilidades, teríamos um conjunto diferente
      perguntas = [
        ...this.perguntasPersonalidade,
        ...this.perguntasVocacionais,
      ];
    }

    return {
      tipo,
      info: this.tiposTestes[tipo],
      perguntas,
      totalPerguntas: perguntas.length,
    };
  }

  /**
   * Obter todos os tipos de testes disponíveis
   * @returns {Array} - Tipos de testes
   */
  getTiposTestes() {
    return Object.keys(this.tiposTestes).map((tipo) => ({
      tipo,
      nome: this.tiposTestes[tipo].nome,
      descricao: this.tiposTestes[tipo].descricao,
      duracao: this.tiposTestes[tipo].duracao,
    }));
  }

  /**
   * Calcular resultado do teste de personalidade com base nas respostas
   * @param {Object} respostas - Respostas do usuário
   * @returns {Object} - Resultado do teste
   */
  calcularResultadoPersonalidade(respostas) {
    // Mapeamento das alternativas para valores numéricos
    const valores = { a: 1, b: 2, c: 3, d: 4, e: 5 };

    // Inicializar contadores para cada fator
    const fatores = {
      extroversao: 0,
      amabilidade: 0,
      conscienciosidade: 0,
      neuroticismo: 0,
      abertura: 0,
    };

    let totalPerguntas = 0;

    // Processar cada resposta
    for (const [idPergunta, resposta] of Object.entries(respostas)) {
      const pergunta = this.perguntasPersonalidade.find(
        (p) => p.id == idPergunta
      );
      if (pergunta && valores[resposta]) {
        // Alguns itens precisam ser invertidos (itens negativos)
        let valor = valores[resposta];
        if (
          this.itensInvertidos &&
          this.itensInvertidos.includes(parseInt(idPergunta))
        ) {
          valor = 6 - valor; // Inverte a escala (1 vira 5, 2 vira 4, etc.)
        }

        fatores[pergunta.fator] += valor;
        totalPerguntas++;
      }
    }

    // Calcular média para cada fator
    const resultado = {};
    for (const [fator, valor] of Object.entries(fatores)) {
      resultado[fator] = totalPerguntas > 0 ? valor / totalPerguntas : 0;
    }

    // Adicionar interpretação
    resultado.interpretacao = this.interpretarFatores(resultado);

    return {
      tipo: 'personalidade',
      fatores: resultado,
      totalPerguntas,
    };
  }

  /**
   * Calcular resultado do teste vocacional com base nas respostas
   * @param {Object} respostas - Respostas do usuário
   * @returns {Object} - Resultado do teste
   */
  calcularResultadoVocacional(respostas) {
    // Mapeamento das alternativas para valores numéricos
    const valores = { a: 1, b: 2, c: 3, d: 4, e: 5 };

    // Inicializar contadores para cada área
    const areas = {
      exatas: 0,
      humanas: 0,
      biologicas: 0,
      linguagens: 0,
    };

    let totalPerguntas = 0;

    // Processar cada resposta
    for (const [idPergunta, resposta] of Object.entries(respostas)) {
      const pergunta = this.perguntasVocacionais.find(
        (p) => p.id == idPergunta
      );
      if (pergunta && valores[resposta]) {
        areas[pergunta.area] += valores[resposta];
        totalPerguntas++;
      }
    }

    // Calcular média para cada área
    const resultado = {};
    for (const [area, valor] of Object.entries(areas)) {
      resultado[area] = totalPerguntas > 0 ? valor / totalPerguntas : 0;
    }

    // Encontrar áreas com pontuação mais alta
    const areasOrdenadas = Object.entries(resultado)
      .sort((a, b) => b[1] - a[1])
      .map(([area, pontuacao]) => ({ area, pontuacao }));

    // Obter carreiras sugeridas com base nas áreas de interesse
    const carreirasSugeridas = this.obterCarreirasSugeridas(areasOrdenadas);

    return {
      tipo: 'vocacional',
      areas: resultado,
      areasInteresse: areasOrdenadas,
      carreirasSugeridas,
    };
  }

  /**
   * Interpretar os fatores de personalidade
   * @param {Object} fatores - Fatores de personalidade calculados
   * @returns {Object} - Interpretação
   */
  interpretarFatores(fatores) {
    const interpretacao = {};

    // Extroversão (1-5, onde 5 é muito extrovertido)
    if (fatores.extroversao >= 4) {
      interpretacao.extroversao =
        'Você é uma pessoa extrovertida, sociável e energizada por interações sociais.';
    } else if (fatores.extroversao >= 3) {
      interpretacao.extroversao =
        'Você tem um nível moderado de extroversão, sendo sociável em certos contextos.';
    } else {
      interpretacao.extroversao =
        'Você tende a ser mais introvertido, preferindo ambientes calmos e momentos de reflexão.';
    }

    // Amabilidade (1-5, onde 5 é muito afável)
    if (fatores.amabilidade >= 4) {
      interpretacao.amabilidade =
        'Você é uma pessoa cooperativa, empática e confiante em relação aos outros.';
    } else if (fatores.amabilidade >= 3) {
      interpretacao.amabilidade =
        'Você tem um nível moderado de amabilidade, sendo cordial e respeitoso.';
    } else {
      interpretacao.amabilidade =
        'Você tende a ser mais crítico e cético, priorizando objetividade em vez de agradar os outros.';
    }

    // Conscienciosidade (1-5, onde 5 é muito consciencioso)
    if (fatores.conscienciosidade >= 4) {
      interpretacao.conscienciosidade =
        'Você é organizado, disciplinado e confiável em cumprir obrigações.';
    } else if (fatores.conscienciosidade >= 3) {
      interpretacao.conscienciosidade =
        'Você tem um equilíbrio entre organização e flexibilidade.';
    } else {
      interpretacao.conscienciosidade =
        'Você tende a ser mais espontâneo e flexível, às vezes desorganizado.';
    }

    // Neuroticismo (1-5, onde 5 é muito emocionalmente reativo)
    if (fatores.neuroticismo >= 4) {
      interpretacao.neuroticismo =
        'Você pode ser mais emocionalmente reativo, sentindo-se ansioso ou estressado facilmente.';
    } else if (fatores.neuroticismo >= 3) {
      interpretacao.neuroticismo =
        'Você tem um nível moderado de estabilidade emocional.';
    } else {
      interpretacao.neuroticismo =
        'Você é emocionalmente estável, mantendo a calma sob pressão.';
    }

    // Abertura (1-5, onde 5 é muito aberto a novas experiências)
    if (fatores.abertura >= 4) {
      interpretacao.abertura =
        'Você é criativo, curioso e aberto a novas experiências e ideias.';
    } else if (fatores.abertura >= 3) {
      interpretacao.abertura =
        'Você tem um equilíbrio entre tradição e novidade.';
    } else {
      interpretacao.abertura =
        'Você tende a preferir a rotina e as abordagens tradicionais.';
    }

    return interpretacao;
  }

  /**
   * Obter carreiras sugeridas com base nas áreas de interesse
   * @param {Array} areasInteresse - Áreas ordenadas por interesse
   * @returns {Array} - Carreiras sugeridas
   */
  obterCarreirasSugeridas(areasInteresse) {
    // Pegar as duas áreas com maior pontuação
    const areasPrincipais = areasInteresse.slice(0, 2).map((item) => item.area);

    // Filtrar carreiras que correspondem às áreas principais
    const carreirasFiltradas = this.carreiras.filter((carreira) =>
      areasPrincipais.includes(carreira.area)
    );

    return carreirasFiltradas.slice(0, 4); // Retornar as 4 principais
  }

  /**
   * Processar respostas de um teste completo
   * @param {string} tipoTeste - Tipo do teste
   * @param {Object} respostas - Respostas do usuário
   * @returns {Object} - Resultado completo do teste
   */
  processarRespostas(tipoTeste, respostas) {
    if (tipoTeste === 'personalidade') {
      return this.calcularResultadoPersonalidade(respostas);
    } else if (tipoTeste === 'vocacional') {
      return this.calcularResultadoVocacional(respostas);
    } else if (tipoTeste === 'habilidades') {
      // Para testes de habilidades, teríamos uma lógica específica
      return {
        tipo: 'habilidades',
        areas: { raciocinio: 3.5, verbal: 4.0, quantitativo: 3.8 },
        nivel: 'Intermediário',
      };
    } else {
      throw new Error(`Tipo de teste não suportado: ${tipoTeste}`);
    }
  }
}

// Criar e exportar uma instância do serviço
module.exports = new PersonalityTestsService();

