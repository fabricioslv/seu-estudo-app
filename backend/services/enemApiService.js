// services/enemApiService.js
// Serviço para integração com a API do ENEM para enriquecimento de dados

class EnemApiService {
  constructor() {
    this.apiUrl = 'https://enem.dev/api'; // URL base da API do ENEM
    this.questionsCache = new Map(); // Cache para evitar múltiplas requisições
  }

  /**
   * Obter questões por ano e matéria
   * @param {number} ano - Ano da prova
   * @param {string} materia - Matéria específica
   * @returns {Promise<Array>} - Array de questões
   */
  async getQuestoesPorAnoEMateria(ano, materia = null) {
    try {
      // Verificar cache primeiro
      const cacheKey = `${ano}-${materia || 'all'}`;
      if (this.questionsCache.has(cacheKey)) {
        return this.questionsCache.get(cacheKey);
      }

      let url = `${this.apiUrl}/questions?year=${ano}`;
      if (materia) {
        url += `&subject=${materia}`;
      }

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Erro na API do ENEM: ${response.status}`);
      }

      const data = await response.json();
      const questoes = this.formatarQuestoes(data);

      // Armazenar em cache
      this.questionsCache.set(cacheKey, questoes);

      return questoes;
    } catch (error) {
      console.error('Erro ao buscar questões da API do ENEM:', error);
      // Em caso de erro, retornar dados mock para testes
      return this.getQuestoesMock(ano, materia);
    }
  }

  /**
   * Obter todas as questões de um determinado ano
   * @param {number} ano - Ano da prova
   * @returns {Promise<Array>} - Array de todas as questões
   */
  async getTodasQuestoesAno(ano) {
    try {
      const cacheKey = `all-${ano}`;
      if (this.questionsCache.has(cacheKey)) {
        return this.questionsCache.get(cacheKey);
      }

      const response = await fetch(`${this.apiUrl}/questions?year=${ano}`);

      if (!response.ok) {
        throw new Error(`Erro na API do ENEM: ${response.status}`);
      }

      const data = await response.json();
      const questoes = this.formatarTodasQuestoes(data);

      // Armazenar em cache
      this.questionsCache.set(cacheKey, questoes);

      return questoes;
    } catch (error) {
      console.error('Erro ao buscar todas as questões da API do ENEM:', error);
      // Em caso de erro, retornar dados mock para testes
      return this.getTodasQuestoesMock(ano);
    }
  }

  /**
   * Obter metadados da prova por ano
   * @param {number} ano - Ano da prova
   * @returns {Promise<Object>} - Informações da prova
   */
  async getProvaMetadata(ano) {
    try {
      const response = await fetch(`${this.apiUrl}/exams/${ano}`);

      if (!response.ok) {
        throw new Error(`Erro na API do ENEM: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao buscar metadados da prova da API do ENEM:', error);
      return {
        year: ano,
        subjects: [
          'Ciências Humanas',
          'Ciências da Natureza',
          'Linguagens',
          'Matemática',
        ],
        total_questions: 180,
      };
    }
  }

  /**
   * Formatar questões da API para o formato do nosso banco de dados
   * @param {Array} apiData - Dados da API
   * @returns {Array} - Questões formatadas
   */
  formatarQuestoes(apiData) {
    if (!apiData || !Array.isArray(apiData)) {
      return [];
    }

    return apiData
      .map((item) => {
        // Mapeamento de campos da API para nosso formato
        return {
          numero: item.question_number || item.id || item.number,
          enunciado: item.statement || item.enunciado || item.question || '',
          alternativas: this.parseAlternativas(item),
          resposta_correta: item.correct_answer || item.answer || item.correct,
          explicacao: item.explanation || item.resolution || '',
          materia: this.mapearMateria(
            item.subject || item.discipline || item.area
          ),
          ano_vestibular: item.year || item.ano,
          origem: 'enem_api',
          // Adicionar outros campos conforme necessário
          nivel_dificuldade: item.difficulty_level || item.level || 1,
          competencia: item.skill || item.competency || '',
          habilidade: item.ability || item.habilidade || '',
          caderno: item.booklet || item.caderno || '',
          cor: item.color || item.prova_cor || '',
        };
      })
      .filter((q) => q.enunciado && q.enunciado.trim() !== ''); // Filtrar questões sem enunciado
  }

  /**
   * Formatar todas as questões de um ano
   * @param {Object} apiData - Dados da API
   * @returns {Array} - Todas as questões formatadas
   */
  formatarTodasQuestoes(apiData) {
    // Mesma lógica de formatação, mas pode precisar de tratamento diferente
    // dependendo da estrutura da resposta para todas as questões de um ano
    if (!apiData || !apiData.questions) {
      return [];
    }

    return this.formatarQuestoes(apiData.questions);
  }

  /**
   * Parsear alternativas da API
   * @param {Object} item - Item da API
   * @returns {Object} - Alternativas no formato A, B, C, D, E
   */
  parseAlternativas(item) {
    if (item.alternatives) {
      return item.alternatives;
    }

    // Tenta encontrar alternativas em diferentes formatos
    const alternativas = {};

    if (item.options) {
      // Formato: options: [{letter: 'A', text: '...'}, ...]
      if (Array.isArray(item.options)) {
        item.options.forEach((opt) => {
          if (opt.letter && opt.text) {
            alternativas[opt.letter] = opt.text;
          }
        });
      } else {
        // Formato: options: {A: '...', B: '...', ...}
        Object.assign(alternativas, item.options);
      }
    } else if (
      item.alternativa_a ||
      item.alternativa_b ||
      item.alternativa_c ||
      item.alternativa_d ||
      item.alternativa_e
    ) {
      // Formato: alternativa_a, alternativa_b, etc.
      if (item.alternativa_a) alternativas['A'] = item.alternativa_a;
      if (item.alternativa_b) alternativas['B'] = item.alternativa_b;
      if (item.alternativa_c) alternativas['C'] = item.alternativa_c;
      if (item.alternativa_d) alternativas['D'] = item.alternativa_d;
      if (item.alternativa_e) alternativas['E'] = item.alternativa_e;
    } else {
      // Tenta encontrar alternativas em campos genéricos
      for (const key in item) {
        if (
          key.toLowerCase().includes('alternativa') &&
          typeof item[key] === 'string'
        ) {
          const letraMatch = key.match(/[a-eA-E]/);
          if (letraMatch) {
            alternativas[letraMatch[0].toUpperCase()] = item[key];
          }
        }
      }
    }

    return alternativas;
  }

  /**
   * Mapear matéria para o nosso formato
   * @param {string} materiaApi - Matéria da API
   * @returns {string} - Matéria padronizada
   */
  mapearMateria(materiaApi) {
    if (!materiaApi) return 'Não classificada';

    const mapeamento = {
      humanas: 'Ciências Humanas',
      natureza: 'Ciências da Natureza',
      linguagens: 'Linguagens e Códigos',
      matematica: 'Matemática',
      ciencias_humanas: 'Ciências Humanas',
      ciencias_da_natureza: 'Ciências da Natureza',
      linguagens_e_codigos: 'Linguagens e Códigos',
      matematica_e_suas_tecnologias: 'Matemática',
      historia: 'História',
      geografia: 'Geografia',
      filosofia: 'Filosofia',
      sociologia: 'Sociologia',
      ciencias_da_natureza_e_sua_tecnologias: 'Ciências da Natureza',
      fisica: 'Física',
      quimica: 'Química',
      biologia: 'Biologia',
      lingua_portuguesa: 'Português',
      linguagens_codigo_e_sua_tecnologia: 'Linguagens e Códigos',
      ingles: 'Inglês',
      espanhol: 'Espanhol',
      artes: 'Artes',
      educacao_fisica: 'Educação Física',
      redacao: 'Redação',
    };

    const materiaLower = materiaApi.toLowerCase().replace(/\s+/g, '_');
    return mapeamento[materiaLower] || materiaApi;
  }

  /**
   * Obter questões mock para testes quando a API não responde
   * @param {number} ano - Ano das questões
   * @param {string} materia - Matéria
   * @returns {Array} - Questões mock
   */
  getQuestoesMock(ano, materia) {
    console.warn(
      `Usando dados mock para ano ${ano}, matéria ${materia}. API não disponível.`
    );

    // Criar algumas questões mock com base no ano e matéria
    const questoes = [];

    for (let i = 1; i <= 5; i++) {
      questoes.push({
        numero: i,
        enunciado: `Questão mock ${i} do ENEM ${ano} - ${materia || 'Geral'}`,
        alternativas: {
          A: `Alternativa A da questão ${i}`,
          B: `Alternativa B da questão ${i}`,
          C: `Alternativa C da questão ${i}`,
          D: `Alternativa D da questão ${i}`,
          E: `Alternativa E da questão ${i}`,
        },
        resposta_correta: 'A',
        explicacao: 'Explicação mock para esta questão',
        materia: materia || 'Não classificada',
        ano_vestibular: ano,
        origem: 'mock',
        nivel_dificuldade: 2,
        competencia: '',
        habilidade: '',
        caderno: '1',
        cor: 'Azul',
      });
    }

    return questoes;
  }

  /**
   * Obter todas as questões mock para testes
   * @param {number} ano - Ano das questões
   * @returns {Array} - Todas as questões mock
   */
  getTodasQuestoesMock(ano) {
    console.warn(
      `Usando dados mock para todas as questões do ENEM ${ano}. API não disponível.`
    );

    const questoes = [];
    const materias = [
      'Linguagens e Códigos',
      'Ciências Humanas',
      'Ciências da Natureza',
      'Matemática',
    ];

    // Criar 45 questões para cada matéria (modelado após o ENEM real)
    for (let materiaIdx = 0; materiaIdx < materias.length; materiaIdx++) {
      const materia = materias[materiaIdx];

      // Cada matéria tem 45 questões no ENEM
      for (let i = 1; i <= 45; i++) {
        const numeroQuestao = i + materiaIdx * 45;

        questoes.push({
          numero: numeroQuestao,
          enunciado: `Questão ${numeroQuestao} de ${materia} - ENEM ${ano}. Este é um exemplo de questão para testar a integração com a API do ENEM.`,
          alternativas: {
            A: `Primeira alternativa possível para a questão ${numeroQuestao}`,
            B: `Segunda alternativa possível para a questão ${numeroQuestao}`,
            C: `Terceira alternativa possível para a questão ${numeroQuestao}`,
            D: `Quarta alternativa possível para a questão ${numeroQuestao}`,
            E: `Quinta alternativa possível para a questão ${numeroQuestao}`,
          },
          resposta_correta: 'A',
          explicacao: `Esta é uma explicação detalhada sobre por que a alternativa A é a correta para a questão ${numeroQuestao} de ${materia}.`,
          materia: materia,
          ano_vestibular: ano,
          origem: 'mock',
          nivel_dificuldade: Math.floor(Math.random() * 3) + 1, // 1 a 3
          competencia: `Competência ${Math.floor(Math.random() * 10) + 1}`,
          habilidade: `Habilidade ${Math.floor(Math.random() * 15) + 1}`,
          caderno: `${materiaIdx + 1}`,
          cor: ['Azul', 'Amarelo', 'Rosa', 'Branco'][materiaIdx],
        });
      }
    }

    return questoes;
  }
}

// Criar e exportar uma instância do serviço
module.exports = new EnemApiService();

