// services/categorizacaoEnem.js
// Serviço para categorização de questões do ENEM usando técnicas de NLP

class CategorizadorEnem {
  constructor() {
    // Competências e habilidades do ENEM por área de conhecimento
    this.competenciasEnem = {
      linguagens: {
        competencia_1: 'Demonstrar domínio da norma culta da língua escrita',
        competencia_2:
          'Compreender a proposta de redação e aplicar conceitos das várias áreas do conhecimento para desenvolver o tema, dentro dos limites estruturais do texto dissertativo-argumentativo',
        competencia_3:
          'Selecionar, relacionar, organizar e interpretar informações, fatos, opiniões e argumentos em defesa de um ponto de vista',
        competencia_4:
          'Demonstrar conhecimento dos mecanismos linguísticos necessários para a construção da argumentação',
        competencia_5:
          'Elaborar proposta de intervenção para o problema abordado, respeitando os direitos humanos',
      },
      ciencias_humanas: {
        competencia_1:
          'Compreender fenômenos históricos, geográficos, sociológicos e antropológicos',
        competencia_2:
          'Analisar criticamente os processos socioculturais e a construção da identidade',
        competencia_3:
          'Relacionar os saberes históricos, geográficos, sociológicos e antropológicos com os contextos da realidade contemporânea',
        competencia_4:
          'Utilizar as diferentes linguagens e fontes para a produção de argumentos',
        competencia_5: 'Elaborar propostas de intervenção social e ambiental',
      },
      ciencias_natureza: {
        competencia_1:
          'Dominar linguagens, representações, cálculos e procedimentos científicos e tecnológicos',
        competencia_2:
          'Compreender fenômenos e regularidades naturais e tecnológicos',
        competencia_3:
          'Relacionar grandezas físicas, químicas e biológicas com fenômenos naturais e tecnológicos',
        competencia_4:
          'Compreender e utilizar as linguagens próprias das ciências naturais',
        competencia_5:
          'Elaborar argumentos e propostas de intervenção fundamentados',
      },
      matematica: {
        competencia_1:
          'Construir significados para os números naturais, inteiros, racionais e reais',
        competencia_2:
          'Utilizar o conhecimento geométrico para realizar a leitura e a representação da realidade',
        competencia_3:
          'Construir noções de grandezas e medidas para a compreensão da realidade',
        competencia_4:
          'Construir noções de variação de grandezas para a compreensão da realidade',
        competencia_5:
          'Modelar e resolver problemas que envolvem variáveis socioeconômicas ou tecnológicas',
      },
    };

    // Habilidades específicas por matéria do ENEM
    this.habilidadesEnem = {
      linguagens: [
        'Interpretar textos diversos',
        'Identificar ideias principais e secundárias',
        'Reconhecer recursos linguísticos',
        'Analisar coesão e coerência textual',
        'Produzir textos argumentativos',
        'Empregar mecanismos de coerência textual',
        'Utilizar a norma culta da língua',
      ],
      literatura: [
        'Analisar textos literários',
        'Identificar características de movimentos literários',
        'Reconhecer funções da linguagem',
        'Interpretar figuras de linguagem',
        'Relacionar obra e contexto histórico-cultural',
      ],
      artes: [
        'Analisar manifestações artísticas',
        'Reconhecer elementos estéticos',
        'Relacionar arte e contexto cultural',
        'Identificar linguagens artísticas',
      ],
      ingles: [
        'Compreender textos em língua inglesa',
        'Identificar ideias principais',
        'Reconhecer vocabulário específico',
        'Interpretar contextos comunicativos',
      ],
      historia: [
        'Analisar processos históricos',
        'Identificar causas e consequências',
        'Relacionar fatos históricos',
        'Interpretar fontes históricas',
        'Compreender temporalidade histórica',
      ],
      geografia: [
        'Analisar fenômenos geográficos',
        'Interpretar mapas e gráficos',
        'Relacionar espaço e sociedade',
        'Compreender dinâmicas territoriais',
        'Analisar questões ambientais',
      ],
      filosofia: [
        'Compreender problemas filosóficos',
        'Analisar conceitos filosóficos',
        'Relacionar pensadores e correntes',
        'Interpretar textos filosóficos',
      ],
      sociologia: [
        'Analisar fenômenos sociais',
        'Compreender teorias sociológicas',
        'Relacionar indivíduo e sociedade',
        'Interpretar processos sociais',
      ],
      fisica: [
        'Compreender leis da física',
        'Resolver problemas físicos',
        'Interpretar fenômenos naturais',
        'Utilizar unidades de medida',
        'Analisar gráficos e tabelas',
      ],
      quimica: [
        'Compreender reações químicas',
        'Identificar substâncias e misturas',
        'Resolver problemas químicos',
        'Interpretar tabelas periódicas',
        'Analisar propriedades químicas',
      ],
      biologia: [
        'Compreender processos biológicos',
        'Identificar estruturas celulares',
        'Analisar ecossistemas',
        'Interpretar fenômenos biológicos',
        'Relacionar biologia e saúde',
      ],
      matematica: [
        'Resolver problemas numéricos',
        'Compreender funções matemáticas',
        'Interpretar gráficos e tabelas',
        'Utilizar geometria',
        'Aplicar estatística',
        'Resolver equações',
      ],
    };

    // Níveis de Bloom para classificação de dificuldade
    this.niveisBloom = {
      1: 'Recordar e reconhecer informações',
      2: 'Compreender e interpretar informações',
      3: 'Aplicar conhecimentos em situações novas',
      4: 'Analisar elementos e relações',
      5: 'Avaliar e julgar informações',
      6: 'Criar e produzir novas soluções',
    };

    // Palavras-chave para identificação de competências
    this.palavrasChaveCompetencias = {
      linguagens: {
        competencia_1: [
          'norma culta',
          'ortografia',
          'gramática',
          'pontuação',
          'sintaxe',
          'concordância',
        ],
        competencia_2: [
          'proposta',
          'tema',
          'argumentação',
          'dissertação',
          'estrutura',
          'organização',
        ],
        competencia_3: [
          'informação',
          'fato',
          'opinião',
          'argumento',
          'ponto de vista',
          'relacionar',
        ],
        competencia_4: [
          'linguagem',
          'discurso',
          'coerência',
          'coesão',
          'mecanismo',
          'recurso',
        ],
        competencia_5: [
          'intervenção',
          'proposta',
          'direito humano',
          'solução',
          'problema',
          'sociedade',
        ],
      },
      ciencias_humanas: {
        competencia_1: [
          'fenômeno',
          'histórico',
          'geográfico',
          'sociológico',
          'antropológico',
          'processo',
        ],
        competencia_2: [
          'análise crítica',
          'sociedade',
          'identidade',
          'cultura',
          'processo sociocultural',
        ],
        competencia_3: [
          'contexto',
          'realidade contemporânea',
          'relacionar',
          'saber',
          'conhecimento',
        ],
        competencia_4: [
          'linguagem',
          'fonte',
          'representação',
          'produção',
          'argumento',
          'discurso',
        ],
        competencia_5: [
          'intervenção social',
          'meio ambiente',
          'proposta',
          'solução',
          'problema',
        ],
      },
      ciencias_natureza: {
        competencia_1: [
          'dominar',
          'linguagem',
          'representação',
          'cálculo',
          'procedimento',
          'científico',
        ],
        competencia_2: [
          'fenômeno',
          'regularidade',
          'natural',
          'tecnológico',
          'compreensão',
          'processo',
        ],
        competencia_3: [
          'relacionar',
          'grandeza',
          'física',
          'química',
          'biológica',
          'fenômeno',
        ],
        competencia_4: [
          'linguagem',
          'científica',
          'própria',
          'representação',
          'símbolo',
          'notação',
        ],
        competencia_5: [
          'elaborar',
          'argumento',
          'proposta',
          'intervenção',
          'fundamentado',
          'evidência',
        ],
      },
      matematica: {
        competencia_1: [
          'número',
          'natural',
          'inteiro',
          'racional',
          'real',
          'significado',
          'construção',
        ],
        competencia_2: [
          'geometria',
          'figura',
          'forma',
          'espacial',
          'plana',
          'leitura',
          'representação',
        ],
        competencia_3: [
          'grandeza',
          'medida',
          'compreensão',
          'realidade',
          'unidade',
          'padrão',
        ],
        competencia_4: [
          'variação',
          'grandeza',
          'compreensão',
          'realidade',
          'função',
          'relação',
        ],
        competencia_5: [
          'modelo',
          'problema',
          'variável',
          'socioeconômico',
          'tecnológico',
          'situação',
        ],
      },
    };
  }

  /**
   * Categorizar uma questão do ENEM
   * @param {Object} questao - Objeto da questão
   * @returns {Object} - Categorização da questão
   */
  categorizarQuestao(questao) {
    const materia = this.identificarMateria(questao);
    const competencia = this.identificarCompetencia(questao, materia);
    const habilidade = this.identificarHabilidade(questao, materia);
    const nivelDificuldade = this.estimarNivelDificuldade(questao);
    const tipoQuestao = this.identificarTipoQuestao(questao);

    return {
      materia: materia,
      competencia: competencia,
      habilidade: habilidade,
      nivel_dificuldade: nivelDificuldade,
      tipo: tipoQuestao,
      area_conhecimento: this.mapearAreaConhecimento(materia),
    };
  }

  /**
   * Identificar a matéria de uma questão
   * @param {Object} questao - Objeto da questão
   * @returns {string} - Matéria identificada
   */
  identificarMateria(questao) {
    if (questao.materia && questao.materia !== 'Não classificada') {
      return questao.materia;
    }

    const textoCompleto =
      `${questao.enunciado} ${JSON.stringify(questao.alternativas)}`.toLowerCase();

    // Palavras-chave por matéria
    const palavrasChave = {
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
      Inglês: [
        'inglês',
        'vocabulário',
        'grammar',
        'reading',
        'listening',
        'speaking',
        'writing',
        'compreensão textual',
      ],
    };

    // Verificar cada matéria
    for (const [materia, keywords] of Object.entries(palavrasChave)) {
      for (const keyword of keywords) {
        if (textoCompleto.includes(keyword.toLowerCase())) {
          return materia;
        }
      }
    }

    // Se não identificar por palavras-chave, usar número da questão (ENEM)
    if (questao.numero) {
      const numero = questao.numero;
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

    return 'Não classificada';
  }

  /**
   * Identificar competência de uma questão
   * @param {Object} questao - Objeto da questão
   * @param {string} materia - Matéria da questão
   * @returns {string} - Competência identificada
   */
  identificarCompetencia(questao, materia) {
    const textoCompleto =
      `${questao.enunciado} ${JSON.stringify(questao.alternativas)}`.toLowerCase();

    // Mapear matéria para área do ENEM
    const areaEnem = this.mapearAreaConhecimento(materia);

    if (!this.competenciasEnem[areaEnem]) {
      return 'Não identificada';
    }

    // Verificar palavras-chave para cada competência
    let maxMatches = 0;
    let competenciaIdentificada = 'Não identificada';

    for (const [competencia, keywords] of Object.entries(
      this.palavrasChaveCompetencias[areaEnem]
    )) {
      let matches = 0;

      for (const keyword of keywords) {
        if (textoCompleto.includes(keyword.toLowerCase())) {
          matches++;
        }
      }

      if (matches > maxMatches) {
        maxMatches = matches;
        competenciaIdentificada = competencia;
      }
    }

    // Se encontrou competência, retornar o nome completo
    if (competenciaIdentificada !== 'Não identificada') {
      return this.competenciasEnem[areaEnem][competenciaIdentificada];
    }

    return 'Não identificada';
  }

  /**
   * Identificar habilidade de uma questão
   * @param {Object} questao - Objeto da questão
   * @param {string} materia - Matéria da questão
   * @returns {string} - Habilidade identificada
   */
  identificarHabilidade(questao, materia) {
    const textoCompleto =
      `${questao.enunciado} ${JSON.stringify(questao.alternativas)}`.toLowerCase();

    // Verificar habilidades específicas da matéria
    const habilidadesMateria =
      this.habilidadesEnem[materia.toLowerCase()] ||
      this.habilidadesEnem[materia.split(' ')[0].toLowerCase()];

    if (!habilidadesMateria) {
      return 'Não identificada';
    }

    // Verificar palavras-chave para cada habilidade
    let maxMatches = 0;
    let habilidadeIdentificada = 'Não identificada';

    for (const habilidade of habilidadesMateria) {
      let matches = 0;
      const palavras = habilidade.toLowerCase().split(' ');

      for (const palavra of palavras) {
        if (palavra.length > 3 && textoCompleto.includes(palavra)) {
          matches++;
        }
      }

      if (matches > maxMatches) {
        maxMatches = matches;
        habilidadeIdentificada = habilidade;
      }
    }

    return habilidadeIdentificada;
  }

  /**
   * Estimar nível de dificuldade usando taxonomia de Bloom
   * @param {Object} questao - Objeto da questão
   * @returns {number} - Nível de dificuldade (1-6)
   */
  estimarNivelDificuldade(questao) {
    const textoCompleto = `${questao.enunciado} ${JSON.stringify(
      questao.alternativas
    )}`.toLowerCase();

    // Palavras indicadoras de nível de Bloom
    const indicadoresBloom = {
      1: [
        'identificar',
        'reconhecer',
        'recordar',
        'listar',
        'nomear',
        'definir',
      ], // Recordar
      2: [
        'compreender',
        'interpretar',
        'explicar',
        'resumir',
        'parafrasear',
        'ilustrar',
      ], // Compreender
      3: [
        'aplicar',
        'utilizar',
        'resolver',
        'demonstrar',
        'modificar',
        'implementar',
      ], // Aplicar
      4: [
        'analisar',
        'distinguir',
        'organizar',
        'atribuir',
        'comparar',
        'contrastar',
      ], // Analisar
      5: [
        'avaliar',
        'verificar',
        'julgar',
        'criticar',
        'justificar',
        'defender',
      ], // Avaliar
      6: ['criar', 'projetar', 'construir', 'produzir', 'inventar', 'propor'], // Criar
    };

    // Contar ocorrências de palavras por nível
    const nivelScores = {};

    for (const [nivel, palavras] of Object.entries(indicadoresBloom)) {
      nivelScores[nivel] = 0;

      for (const palavra of palavras) {
        const regex = new RegExp(`\\b${palavra}\\b`, 'gi');
        const matches = textoCompleto.match(regex);
        nivelScores[nivel] += matches ? matches.length : 0;
      }
    }

    // Encontrar o nível com maior pontuação
    let nivelPredominante = 1;
    let maxScore = 0;

    for (const [nivel, score] of Object.entries(nivelScores)) {
      if (score > maxScore) {
        maxScore = score;
        nivelPredominante = parseInt(nivel);
      }
    }

    // Ajustar com base em características da questão
    if (questao.alternativas && Object.keys(questao.alternativas).length >= 4) {
      // Questões de múltipla escolha tendem a ser mais complexas
      nivelPredominante = Math.min(6, nivelPredominante + 1);
    }

    // Verificar se há elementos que aumentam a complexidade
    const palavrasComplexidade = [
      'análise',
      'interpretação',
      'relação',
      'comparação',
      'contexto',
      'proposta',
    ];
    let complexidade = 0;

    for (const palavra of palavrasComplexidade) {
      if (textoCompleto.includes(palavra)) {
        complexidade++;
      }
    }

    if (complexidade > 2) {
      nivelPredominante = Math.min(6, nivelPredominante + 1);
    }

    return Math.max(1, Math.min(6, nivelPredominante));
  }

  /**
   * Identificar tipo de questão
   * @param {Object} questao - Objeto da questão
   * @returns {string} - Tipo de questão
   */
  identificarTipoQuestao(questao) {
    const textoCompleto = `${questao.enunciado} ${JSON.stringify(
      questao.alternativas
    )}`.toLowerCase();

    // Tipos de questões comuns
    const tipos = {
      contextualizacao: [
        'contexto',
        'situação',
        'cenário',
        'história',
        'narrativa',
      ],
      interpretacao: [
        'interprete',
        'significado',
        'entenda',
        'compreenda',
        'significa',
      ],
      analise: ['analise', 'compare', 'relacione', 'diferencie', 'explique'],
      aplicacao: ['aplique', 'utilize', 'calcule', 'resolva', 'determine'],
      sintese: ['conclua', 'resuma', 'sintetize', 'generalize', 'formule'],
      avaliacao: ['avalie', 'julgue', 'critique', 'defenda', 'justifique'],
      producao: ['produza', 'elabore', 'crie', 'desenvolva', 'proponha'],
    };

    let maxMatches = 0;
    let tipoIdentificado = 'conhecimento_basico';

    for (const [tipo, palavras] of Object.entries(tipos)) {
      let matches = 0;

      for (const palavra of palavras) {
        if (textoCompleto.includes(palavra)) {
          matches++;
        }
      }

      if (matches > maxMatches) {
        maxMatches = matches;
        tipoIdentificado = tipo;
      }
    }

    return tipoIdentificado;
  }

  /**
   * Mapear matéria para área de conhecimento do ENEM
   * @param {string} materia - Matéria
   * @returns {string} - Área de conhecimento
   */
  mapearAreaConhecimento(materia) {
    if (!materia) return 'nao_classificada';

    const materiaLower = materia.toLowerCase();

    if (
      materiaLower.includes('linguagem') ||
      materiaLower.includes('português') ||
      materiaLower.includes('literatura') ||
      materiaLower.includes('artes') ||
      materiaLower.includes('inglês')
    ) {
      return 'linguagens';
    }

    if (
      materiaLower.includes('história') ||
      materiaLower.includes('geografia') ||
      materiaLower.includes('filosofia') ||
      materiaLower.includes('sociologia')
    ) {
      return 'ciencias_humanas';
    }

    if (
      materiaLower.includes('física') ||
      materiaLower.includes('química') ||
      materiaLower.includes('biologia')
    ) {
      return 'ciencias_natureza';
    }

    if (
      materiaLower.includes('matemática') ||
      materiaLower.includes('matematica')
    ) {
      return 'matematica';
    }

    return 'nao_classificada';
  }

  /**
   * Categorizar múltiplas questões
   * @param {Array} questoes - Array de questões
   * @returns {Array} - Questões categorizadas
   */
  categorizarQuestoes(questoes) {
    return questoes.map((questao) => ({
      ...questao,
      ...this.categorizarQuestao(questao),
    }));
  }

  /**
   * Obter estatísticas de categorização
   * @param {Array} questoesCategorizadas - Questões já categorizadas
   * @returns {Object} - Estatísticas
   */
  obterEstatisticas(questoesCategorizadas) {
    const estatisticas = {
      total: questoesCategorizadas.length,
      por_materia: {},
      por_area_conhecimento: {},
      por_nivel_dificuldade: {},
      por_tipo: {},
    };

    for (const questao of questoesCategorizadas) {
      // Contar por matéria
      const materia = questao.materia || 'Não classificada';
      estatisticas.por_materia[materia] =
        (estatisticas.por_materia[materia] || 0) + 1;

      // Contar por área de conhecimento
      const area = questao.area_conhecimento || 'Não classificada';
      estatisticas.por_area_conhecimento[area] =
        (estatisticas.por_area_conhecimento[area] || 0) + 1;

      // Contar por nível de dificuldade
      const nivel = questao.nivel_dificuldade || 'Não classificada';
      estatisticas.por_nivel_dificuldade[nivel] =
        (estatisticas.por_nivel_dificuldade[nivel] || 0) + 1;

      // Contar por tipo
      const tipo = questao.tipo || 'Não classificada';
      estatisticas.por_tipo[tipo] = (estatisticas.por_tipo[tipo] || 0) + 1;
    }

    return estatisticas;
  }
}

// Criar e exportar uma instância do serviço
module.exports = new CategorizadorEnem();
