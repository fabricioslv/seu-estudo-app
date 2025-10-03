// components/WizGradeInfo.js
import React, { useState } from 'react';

const WizGradeInfo = () => {
  const [abaAtiva, setAbaAtiva] = useState('overview');

  const funcionalidadesWizGrade = {
    overview: {
      titulo: 'Visão Geral do WizGrade',
      descricao: 'WizGrade é um sistema educacional abrangente projetado para instituições de ensino, oferecendo uma plataforma completa para gestão acadêmica, administrativa e de aprendizado.',
      caracteristicas: [
        'Gestão completa de alunos, professores e funcionários',
        'Sistema de notas e avaliação automatizado',
        'Plataforma de aprendizado com recursos multimídia',
        'Gestão de biblioteca digital',
        'Sistema de comunicação entre todos os stakeholders',
        'Relatórios e análises detalhadas de desempenho',
        'Portal do aluno e portal do professor personalizados'
      ]
    },
    academic: {
      titulo: 'Gestão Acadêmica',
      descricao: 'Recursos avançados para gerenciamento acadêmico eficiente.',
      caracteristicas: [
        'Cadastro e gerenciamento de cursos e disciplinas',
        'Planejamento de currículo e programas de estudo',
        'Gestão de horários e alocação de salas',
        'Sistema de registro de frequência automatizado',
        'Controle de progresso acadêmico dos alunos',
        'Emissão de certificados e diplomas digitais',
        'Integração com sistemas de biblioteca e laboratórios'
      ]
    },
    assessment: {
      titulo: 'Avaliação e Notas',
      descricao: 'Sistema completo de avaliação com múltiplas formas de avaliação.',
      caracteristicas: [
        'Criação de testes e avaliações personalizadas',
        'Sistema automatizado de correção para questões objetivas',
        'Avaliação por rubricas para trabalhos e projetos',
        'Relatórios de desempenho individuais e em grupo',
        'Comparação de desempenho entre turmas e períodos',
        'Integração com sistemas de análise de dados educacionais',
        'Feedback personalizado para alunos e pais'
      ]
    },
    communication: {
      titulo: 'Comunicação',
      descricao: 'Plataforma integrada de comunicação entre todos os envolvidos no processo educacional.',
      caracteristicas: [
        'Mensagens diretas entre alunos, professores e pais',
        'Fóruns de discussão por turma e disciplina',
        'Anúncios e avisos institucionais',
        'Sistema de notificações em tempo real',
        'Integração com e-mail e mensagens SMS',
        'Calendário compartilhado de eventos e atividades',
        'Portal de pais com acesso restrito às informações dos filhos'
      ]
    },
    learning: {
      titulo: 'Plataforma de Aprendizado',
      descricao: 'Ambiente rico de aprendizado digital com recursos interativos.',
      caracteristicas: [
        'Conteúdo multimídia (vídeos, áudios, apresentações)',
        'Atividades interativas e quizzes',
        'Biblioteca digital com acesso a livros e materiais',
        'Sistema de aprendizado adaptativo baseado no desempenho',
        'Gamificação para engajamento dos alunos',
        'Acompanhamento de progresso em tempo real',
        'Recursos de colaboração e trabalho em grupo'
      ]
    }
  };

  const beneficiosIntegracao = [
    {
      titulo: 'Centralização de Dados',
      descricao: 'Unificar todas as informações educacionais em uma única plataforma acessível.'
    },
    {
      titulo: 'Eficiência Operacional',
      descricao: 'Automatizar processos repetitivos e reduzir carga administrativa.'
    },
    {
      titulo: 'Personalização do Aprendizado',
      descricao: 'Adaptar o conteúdo e o ritmo de ensino às necessidades individuais dos alunos.'
    },
    {
      titulo: 'Melhoria do Desempenho',
      descricao: 'Utilizar análises de dados para identificar áreas de melhoria e intervenções necessárias.'
    },
    {
      titulo: 'Engajamento Aumentado',
      descricao: 'Incentivar participação ativa dos alunos através de gamificação e feedback imediato.'
    },
    {
      titulo: 'Comunicação Aprimorada',
      descricao: 'Facilitar a troca de informações entre todos os stakeholders educacionais.'
    }
  ];

  return (
    <div className="wizgrade-info">
      <div className="wizgrade-header">
        <h1>Integração com WizGrade</h1>
        <p>Aprimorando nossa plataforma educacional com funcionalidades avançadas</p>
      </div>

      <div className="wizgrade-tabs">
        {Object.keys(funcionalidadesWizGrade).map(key => (
          <button
            key={key}
            className={`tab ${abaAtiva === key ? 'active' : ''}`}
            onClick={() => setAbaAtiva(key)}
          >
            {funcionalidadesWizGrade[key].titulo}
          </button>
        ))}
      </div>

      <div className="wizgrade-content">
        <div className="feature-highlight">
          <h2>{funcionalidadesWizGrade[abaAtiva].titulo}</h2>
          <p>{funcionalidadesWizGrade[abaAtiva].descricao}</p>
          
          <div className="features-list">
            <h3>Funcionalidades Principais:</h3>
            <ul>
              {funcionalidadesWizGrade[abaAtiva].caracteristicas.map((feature, index) => (
                <li key={index}>✓ {feature}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="integration-benefits">
          <h3>Benefícios da Integração</h3>
          <div className="benefits-grid">
            {beneficiosIntegracao.map((beneficio, index) => (
              <div key={index} className="benefit-card">
                <h4>{beneficio.titulo}</h4>
                <p>{beneficio.descricao}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="implementation-roadmap">
          <h3>Roadmap de Implementação</h3>
          <div className="roadmap-steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Análise e Planejamento</h4>
                <p>Estudo detalhado das funcionalidades do WizGrade e mapeamento de requisitos</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Desenvolvimento de APIs</h4>
                <p>Criação de interfaces para integração com os sistemas existentes</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Testes e Validação</h4>
                <p>Verificação da integração em ambiente de teste com usuários reais</p>
              </div>
            </div>
            <div className="step">
              <div className="step-number">4</div>
              <div className="step-content">
                <h4>Implantação Gradual</h4>
                <p>Lançamento em fases para minimizar impacto e maximizar adoção</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="wizgrade-call-to-action">
        <h3>Pronto para Transformar sua Experiência Educacional?</h3>
        <p>Junte-se a nós na revolução da educação digital</p>
        <button className="btn-primary">Solicitar Demonstração</button>
      </div>
    </div>
  );
};

export default WizGradeInfo;