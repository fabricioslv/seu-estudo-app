// services/aiService.js
// Serviço para integração com Google AI Studio para geração de explicações e planos de estudo

const fetch = require('node-fetch');

class AIService {
  constructor() {
    // A chave de API será configurada via variáveis de ambiente
    // Tenta diferentes nomes de variáveis de ambiente para a chave da API
    this.apiKey =
      process.env.GOOGLE_AI_API_KEY || process.env.REACT_APP_GOOGLE_AI_API_KEY;
    this.generationConfig = {
      temperature: 0.7,
      maxOutputTokens: 1024,
      topK: 40,
      topP: 0.95,
    };
  }

  async generateExplanation(questao) {
    if (!this.apiKey) {
      console.warn(
        'Google AI API key não configurada. Retornando explicação padrão.'
      );
      console.log(
        'Tentando variáveis de ambiente: GOOGLE_AI_API_KEY =',
        !!process.env.GOOGLE_AI_API_KEY,
        ', REACT_APP_GOOGLE_AI_API_KEY =',
        !!process.env.REACT_APP_GOOGLE_AI_API_KEY
      );
      return this.getDefaultExplanation(questao);
    }

    try {
      // Montar o prompt para geração de explicação
      const prompt = this.buildExplanationPrompt(questao);

      console.log('Enviando requisição para a API do Google AI...');

      // Fazer a requisição para a API do Google AI
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: this.generationConfig,
          }),
        }
      );

      console.log('Resposta da API:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro na resposta da API:', errorText);
        throw new Error(
          `Erro na API do Google AI: ${response.status} - ${errorText}`
        );
      }

      const data = await response.json();

      console.log('Dados recebidos da API:', JSON.stringify(data));

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const explanation = data.candidates[0].content.parts[0].text;
        console.log('Explicação gerada com sucesso');
        return explanation.trim();
      } else {
        console.warn(
          'Nenhuma explicação gerada pela IA. Retornando explicação padrão.'
        );
        console.warn('Estrutura recebida da API:', JSON.stringify(data));
        return this.getDefaultExplanation(questao);
      }
    } catch (error) {
      console.error('Erro ao gerar explicação com Google AI:', error.message);
      console.error('Stack:', error.stack);
      return this.getDefaultExplanation(questao);
    }
  }

  buildExplanationPrompt(questao) {
    let prompt = `Atue como professor especialista do ENEM e gere uma explicação detalhada para a seguinte questão:\n\n`;

    prompt += `Matéria: ${questao.materia}\n`;
    prompt += `Ano: ${questao.ano || 'Não especificado'}\n\n`;

    prompt += `Enunciado:\n${questao.enunciado}\n\n`;

    prompt += `Alternativas:\n`;
    for (const [letra, texto] of Object.entries(questao.alternativas)) {
      prompt += `${letra}) ${texto}\n`;
    }

    prompt += `\nResposta correta: ${questao.resposta_correta}\n\n`;
    prompt += `Forneça uma explicação clara, objetiva e didática sobre por que a alternativa "${questao.resposta_correta}" é a correta, abordando os conceitos envolvidos e o processo de eliminação das demais alternativas. Use linguagem apropriada para estudantes do ensino médio.`;

    return prompt;
  }

  getDefaultExplanation(questao) {
    // Explicação padrão para quando a IA não estiver disponível
    return `A resposta correta é "${questao.resposta_correta}". Esta questão aborda conceitos importantes de ${questao.materia}. 
    A alternativa correta contempla os princípios fundamentais necessários para resolver esta questão, enquanto as demais contêm 
    informações incorretas ou irrelevantes para o contexto do enunciado.`;
  }

  // Método para gerar explicações para múltiplas questões
  async generateExplanations(questoes) {
    const explanations = {};

    // Processar as questões com limitação de requisições simultâneas
    const batchSize = 5; // Limite de requisições simultâneas

    for (let i = 0; i < questoes.length; i += batchSize) {
      const batch = questoes.slice(i, i + batchSize);

      // Processar em paralelo dentro do batch
      const batchPromises = batch.map((questao) =>
        this.generateExplanation(questao)
          .then((explanation) => ({ numero: questao.numero, explanation }))
          .catch((error) => {
            console.error(
              `Erro ao gerar explicação para a questão ${questao.numero}:`,
              error
            );
            return {
              numero: questao.numero,
              explanation: this.getDefaultExplanation(questao),
            };
          })
      );

      const batchResults = await Promise.all(batchPromises);

      // Adicionar resultados ao objeto de explicações
      batchResults.forEach((result) => {
        explanations[result.numero] = result.explanation;
      });
    }

    return explanations;
  }

  // Método para gerar plano de estudos com IA
  async generateStudyPlan(usuarioPerfil, questoesBanco) {
    if (!this.apiKey) {
      console.warn(
        'Google AI API key não configurada. Retornando plano padrão.'
      );
      return this.getDefaultStudyPlan(usuarioPerfil);
    }

    try {
      // Montar o prompt para geração de plano de estudos
      const prompt = this.buildStudyPlanPrompt(usuarioPerfil, questoesBanco);

      // Fazer a requisição para a API do Google AI
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: this.generationConfig,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Erro na API do Google AI: ${response.status}`);
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        const plano = data.candidates[0].content.parts[0].text;
        return this.parseStudyPlan(plano);
      } else {
        console.warn('Nenhum plano gerado pela IA. Retornando plano padrão.');
        return this.getDefaultStudyPlan(usuarioPerfil);
      }
    } catch (error) {
      console.error('Erro ao gerar plano de estudos com Google AI:', error);
      return this.getDefaultStudyPlan(usuarioPerfil);
    }
  }

  buildStudyPlanPrompt(usuarioPerfil, questoesBanco) {
    let prompt = `Atue como um orientador educacional especialista e gere um plano de estudos personalizado com base no seguinte perfil do estudante:\n\n`;

    prompt += `Perfil do Estudante:\n`;
    prompt += `- Área de interesse: ${usuarioPerfil.area || 'Não especificada'}\n`;
    prompt += `- Matérias selecionadas: ${usuarioPerfil.materias ? usuarioPerfil.materias.join(', ') : 'Não especificadas'}\n`;
    prompt += `- Frequência de estudo: ${usuarioPerfil.frequencia || 'Não especificada'}\n`;
    prompt += `- Tempo disponível por dia: ${usuarioPerfil.tempoDiario || 'Não especificado'} minutos\n`;
    prompt += `- Nível de dificuldade: ${usuarioPerfil.nivel || 'Não especificado'}\n\n`;

    // Incluir informações sobre as questões disponíveis no banco
    if (questoesBanco && questoesBanco.length > 0) {
      prompt += `Disponibilidade de Questões no Banco de Dados:\n`;

      // Agrupar questões por matéria para melhor contextualização
      const questoesPorMateria = {};
      questoesBanco.forEach((questao) => {
        const materia = questao.materia;
        if (!questoesPorMateria[materia]) {
          questoesPorMateria[materia] = 0;
        }
        questoesPorMateria[materia]++;
      });

      for (const [materia, total] of Object.entries(questoesPorMateria)) {
        prompt += `- ${materia}: ${total} questões disponíveis\n`;
      }
    }

    prompt += `\nGere um plano de estudos semanal detalhado com os seguintes critérios:\n`;
    prompt += `1. Distribuição equilibrada das matérias ao longo da semana\n`;
    prompt += `2. Sugestões de conteúdo com base nas questões disponíveis no banco\n`;
    prompt += `3. Recomendações de links complementares (YouTube, Khan Academy, etc.) quando necessário\n`;
    prompt += `4. Estratégias de estudo adequadas para o nível do aluno\n`;
    prompt += `5. Metodologia de aprendizagem eficaz\n\n`;
    prompt += `Formato de resposta: Forneça o plano em formato JSON estruturado, com dias da semana, conteúdo, tempo estimado e atividades recomendadas.`;

    return prompt;
  }

  parseStudyPlan(planoTexto) {
    // Este método tenta converter o plano gerado em texto para um formato estruturado
    // Em uma implementação real, poderia usar expressões regulares mais complexas
    // ou até um parser mais sofisticado

    try {
      // Tenta extrair um JSON do texto (caso a IA tenha gerado)
      const jsonMatch = planoTexto.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      // Se não for JSON válido, cria um plano padrão baseado no texto
      console.warn(
        'Não foi possível parsear o plano como JSON, criando plano padrão'
      );
    }

    // Plano padrão como fallback
    const dias = [
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado',
      'Domingo',
    ];
    const planoPadrao = {};

    dias.forEach((dia, index) => {
      planoPadrao[dia] = {
        conteudo: `Revisão de matérias selecionadas`,
        tempo: `60 min`,
        atividade: `Estudo teórico e prática de exercícios`,
        recursos: ['Anotações pessoais', 'Questões do banco de dados'],
      };
    });

    return planoPadrao;
  }

  getDefaultStudyPlan(usuarioPerfil) {
    // Plano de estudos padrão para quando a IA não estiver disponível
    const dias = [
      'Segunda',
      'Terça',
      'Quarta',
      'Quinta',
      'Sexta',
      'Sábado',
      'Domingo',
    ];
    const plano = {};

    dias.forEach((dia, index) => {
      plano[dia] = {
        conteudo: `Revisão de ${usuarioPerfil.materias ? usuarioPerfil.materias.slice(0, 2).join(' e ') : 'matérias gerais'}`,
        tempo: `${usuarioPerfil.tempoDiario || 60} min`,
        atividade: `Leitura e Exercícios`,
        recursos: ['Anotações', 'Questões do banco'],
      };
    });

    return plano;
  }
}

// Criar uma instância do serviço e exportar
module.exports = new AIService();
