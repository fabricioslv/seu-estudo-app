// pages/RegisterPage.js
import React from 'react';
import RegisterForm from '../components/RegisterForm';
import '../styles/AuthPages.css';

const RegisterPage = () => {
  console.log('[DEBUG] RegisterPage: Renderizando página de registro...');
  console.log('[DEBUG] RegisterPage: Renderizando componente RegisterForm...');

  const features = [
    {
      icon: '📚',
      title: 'Processamento IA de Livros',
      description: 'Extraia e processe conteúdo de livros didáticos automaticamente com inteligência artificial avançada'
    },
    {
      icon: '🎯',
      title: 'Simulados ENEM',
      description: 'Sistema completo de questões e simulados para preparação do ENEM com correção automática'
    },
    {
      icon: '🏆',
      title: 'Gamificação',
      description: 'Sistema de pontos, conquistas e rankings para tornar os estudos mais motivadores'
    },
    {
      icon: '👨‍🏫',
      title: 'Sistema de Tutoria',
      description: 'Conecte-se com tutores especializados para suporte personalizado nos estudos'
    },
    {
      icon: '🤝',
      title: 'Recursos Colaborativos',
      description: 'Compartilhe conhecimento e estude em grupo com ferramentas colaborativas integradas'
    },
    {
      icon: '📊',
      title: 'Acompanhamento de Desempenho',
      description: 'Monitore seu progresso com relatórios detalhados e análises de desempenho'
    }
  ];

  return (
    <div className="register-page">
      <div className="register-container">
        {/* Header Section */}
        <div className="register-header">
          <div className="brand-logo">
            <span className="brand-icon">🚀</span>
            <h1>StudyFlow</h1>
            <p className="brand-tagline">Plataforma Inteligente de Estudos</p>
          </div>
          <div className="register-intro">
            <h2>Comece sua jornada acadêmica</h2>
            <p>Una-se a milhares de estudantes que já transformaram sua forma de estudar</p>
          </div>
        </div>

        <div className="register-content">
          {/* Features Showcase */}
          <div className="features-showcase">
            <h3>O que você terá acesso:</h3>
            <div className="features-grid">
              {features.map((feature, index) => (
                <div key={index} className="feature-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <div className="feature-content">
                    <h4>{feature.title}</h4>
                    <p>{feature.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Registration Form */}
          <div className="register-form-section">
            <div className="register-form-container">
              <div className="form-header">
                <h3>Criar sua conta</h3>
                <p>Preencha os dados abaixo para começar</p>
              </div>
              <RegisterForm />
              <div className="register-benefits">
                <div className="benefit-item">
                  <span className="benefit-icon">✓</span>
                  <span>Acesso gratuito completo</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">✓</span>
                  <span>Sem necessidade de cartão</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-icon">✓</span>
                  <span>Cancele quando quiser</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="register-stats">
          <div className="stat-item">
            <div className="stat-number">10k+</div>
            <div className="stat-label">Estudantes ativos</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">500+</div>
            <div className="stat-label">Livros processados</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">50k+</div>
            <div className="stat-label">Questões disponíveis</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">95%</div>
            <div className="stat-label">Taxa de aprovação</div>
          </div>
        </div>

        <div className="register-footer">
          <p>
            Já possui uma conta?{' '}
            <a href="/entrar">Entre aqui</a>
          </p>
          <div className="register-quote">
            <p>"A educação é a arma mais poderosa que você pode usar para mudar o mundo."</p>
            <cite>- Nelson Mandela</cite>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;