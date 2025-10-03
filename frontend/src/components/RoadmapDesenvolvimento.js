// components/RoadmapDesenvolvimento.js
import React, { useState } from 'react';

const RoadmapDesenvolvimento = () => {
  const [faseAtiva, setFaseAtiva] = useState('todas');

  const fases = [
    {
      id: 'extracao',
      titulo: 'Aprimoramento Técnico',
      periodo: 'Semana 1-2',
      cor: '#4CAF50',
      tarefas: [
        'Melhoria de extração de PDFs com PyMuPDF',
        'Otimização de algoritmos de extração',
        'Implementação de cache para melhor desempenho',
        'Gamificação no módulo Aprendendo',
        'Sistema de pontos e níveis',
        'Conquistas e badges',
        'Ranking de usuários'
      ],
      status: 'concluida'
    },
    {
      id: 'ia',
      titulo: 'Inteligência Artificial Avançada',
      periodo: 'Semana 3-4',
      cor: '#2196F3',
      tarefas: [
        'Sistema de recomendação personalizada',
        'Análise preditiva de desempenho',
        'Sugestões personalizadas baseadas em histórico',
        'Classificação NLP avançada',
        'Processamento de linguagem natural para categorização',
        'Análise de sentimentos em feedback',
        'Sumarização automática de conteúdos'
      ],
      status: 'em_andamento'
    },
    {
      id: 'colaboracao',
      titulo: 'Colaboração e Social Learning',
      periodo: 'Semana 5-6',
      cor: '#FF9800',
      tarefas: [
        'Salas de estudo virtuais',
        'Ferramentas para projetos em grupo',
        'Sistema de tutoria entre pares',
        'Compartilhamento inteligente de anotações',
        'Fóruns temáticos por matéria',
        'Sistema de perguntas e respostas (Q&A)',
        'Perfis de especialistas e mentores',
        'Recursos de networking educacional'
      ],
      status: 'planejada'
    },
    {
      id: 'mobilidade',
      titulo: 'Mobilidade e Acessibilidade',
      periodo: 'Semana 7-8',
      cor: '#9C27B0',
      tarefas: [
        'Desenvolvimento de aplicativo móvel',
        'Sincronização em tempo real',
        'Interface otimizada para dispositivos móveis',
        'Recursos offline',
        'Leitor de tela para deficientes visuais',
        'Legendas e áudio descritivo',
        'Interface adaptável para diferentes necessidades',
        'Modos de alto contraste e tamanho de fonte'
      ],
      status: 'planejada'
    }
  ];

  const funcionalidades = [
    {
      titulo: 'Sistema de Recomendação Inteligente',
      descricao: 'Recomendações personalizadas baseadas no desempenho e preferências do aluno',
      icone: '🤖',
      categoria: 'ia'
    },
    {
      titulo: 'Ambiente Colaborativo Avançado',
      descricao: 'Ferramentas para estudo em grupo e projetos colaborativos',
      icone: '👥',
      categoria: 'colaboracao'
    },
    {
      titulo: 'Análise Preditiva e Insights',
      descricao: 'Previsão de desempenho e identificação precoce de dificuldades',
      icone: '🔮',
      categoria: 'ia'
    },
    {
      titulo: 'Gamificação Avançada',
      descricao: 'Sistema de pontos, níveis, conquistas e rankings',
      icone: '🎮',
      categoria: 'extracao'
    },
    {
      titulo: 'Acessibilidade Universal',
      descricao: 'Suporte a diferentes necessidades e dispositivos',
      icone: '♿',
      categoria: 'mobilidade'
    },
    {
      titulo: 'Comunidade de Aprendizado',
      descricao: 'Fóruns, mentorias e networking educacional',
      icone: '🌍',
      categoria: 'colaboracao'
    }
  ];

  const metasImpacto = [
    {
      titulo: 'Curto Prazo (3 meses)',
      metricas: [
        'Aumentar taxa de engajamento diário em 40%',
        'Reduzir tempo médio de resolução de dúvidas em 30%',
        'Expandir base de usuários ativos em 25%'
      ]
    },
    {
      titulo: 'Médio Prazo (6 meses)',
      metricas: [
        'Implementar cobertura completa das disciplinas do ENEM',
        'Alcançar 10.000 usuários ativos mensais',
        'Estabelecer parcerias com 50 instituições de ensino'
      ]
    },
    {
      titulo: 'Longo Prazo (12 meses)',
      metricas: [
        'Expandir para outros vestibulares e concursos',
        'Desenvolver versão internacional do sistema',
        'Criar ecossistema educacional completo'
      ]
    }
  ];

  const fasesFiltradas = fases.filter(fase => 
    faseAtiva === 'todas' || fase.id === faseAtiva
  );

  return (
    <div className="roadmap-desenvolvimento">
      <div className="roadmap-header">
        <h2>Roadmap de Desenvolvimento</h2>
        <p>Plano estratégico para evolução contínua do sistema educacional</p>
      </div>

      <div className="roadmap-filtros">
        <div className="filtro-grupo">
          <label>Filtrar por fase:</label>
          <select value={faseAtiva} onChange={(e) => setFaseAtiva(e.target.value)}>
            <option value="todas">Todas as fases</option>
            {fases.map(fase => (
              <option key={fase.id} value={fase.id}>{fase.titulo}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="roadmap-timeline">
        {fasesFiltradas.map((fase, index) => (
          <div key={fase.id} className={`fase-card ${fase.status}`}>
            <div className="fase-header">
              <div className="fase-indicador" style={{backgroundColor: fase.cor}}>
                {index + 1}
              </div>
              <div className="fase-info">
                <h3>{fase.titulo}</h3>
                <p className="fase-periodo">{fase.periodo}</p>
                <span className={`fase-status ${fase.status}`}>
                  {fase.status === 'concluida' ? 'Concluída' : 
                   fase.status === 'em_andamento' ? 'Em Andamento' : 'Planejada'}
                </span>
              </div>
            </div>
            
            <div className="fase-tarefas">
              <h4>Tarefas:</h4>
              <ul>
                {fase.tarefas.map((tarefa, idx) => (
                  <li key={idx}>✓ {tarefa}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="roadmap-funcionalidades">
        <h3>Funcionalidades Planejadas</h3>
        <div className="funcionalidades-grid">
          {funcionalidades.map((func, index) => (
            <div key={index} className="funcionalidade-card">
              <div className="func-icone">{func.icone}</div>
              <h4>{func.titulo}</h4>
              <p>{func.descricao}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="roadmap-metas">
        <h3>Metas de Impacto</h3>
        <div className="metas-timeline">
          {metasImpacto.map((meta, index) => (
            <div key={index} className="meta-periodo">
              <h4>{meta.titulo}</h4>
              <ul>
                {meta.metricas.map((metrica, idx) => (
                  <li key={idx}>{metrica}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="roadmap-visao-final">
        <h3>Visão Final</h3>
        <div className="visao-conteudo">
          <p>O "Seu-Estudo" se tornará a plataforma educacional mais completa e personalizada do Brasil, utilizando inteligência artificial avançada, gamificação envolvente e colaboração social para transformar a maneira como os estudantes aprendem, se preparam e alcançam seus objetivos educacionais.</p>
          
          <div className="visao-citacao">
            <blockquote>
              "Transformando a educação através da tecnologia e da personalização"
            </blockquote>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoadmapDesenvolvimento;