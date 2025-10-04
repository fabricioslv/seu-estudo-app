// src/pages/HomePage.js
import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/HomePage.css';

const HomePage = () => {
  return (
    <div className="homepage">
      {/* Header */}
      <header className="homepage-header">
        <div className="container">
          <div className="logo">
            <h1>Seu-Estudo</h1>
          </div>
          <nav className="navigation">
            <ul>
              <li><a href="#features">Recursos</a></li>
              <li><a href="#about">Sobre</a></li>
              <li><a href="#contact">Contato</a></li>
            </ul>
          </nav>
          <div className="auth-buttons">
            <Link to="/entrar" className="btn btn-outline">Entrar</Link>
            <Link to="/registrar" className="btn btn-primary">Começar Agora</Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Plataforma Completa de Estudos com IA</h1>
            <p className="hero-subtitle">
              Revolucione sua preparação para o ENEM com processamento inteligente de livros didáticos,
              simulados personalizados, sistema de tutoria colaborativo e gamificação avançada.
            </p>
            <div className="hero-actions">
              <Link to="/registrar" className="btn btn-primary btn-large">Começar Gratuitamente</Link>
              <Link to="/simulados" className="btn btn-secondary btn-large">Ver Demonstração</Link>
            </div>
          </div>
          <div className="hero-image">
            <img src="/logo512.png" alt="Plataforma Seu-Estudo com IA" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <h2 className="section-title">Funcionalidades Inovadoras</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <span role="img" aria-label="Processamento IA">🤖</span>
              </div>
              <h3>Processamento de Livros com IA</h3>
              <p>Envie seus livros didáticos em PDF e nossa IA extrai automaticamente questões, resumos e conteúdo estruturado para estudo otimizado.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <span role="img" aria-label="ENEM">📊</span>
              </div>
              <h3>Sistema Completo ENEM</h3>
              <p>Acesse todas as questões do ENEM dos anos anteriores com resolução em vídeo, comentários de professores e estatísticas de desempenho.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <span role="img" aria-label="Gamificação">🎮</span>
              </div>
              <h3>Gamificação Avançada</h3>
              <p>Sistema de pontos, conquistas, rankings e desafios entre usuários. Transforme seus estudos em uma experiência divertida e competitiva.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <span role="img" aria-label="Tutoria">👥</span>
              </div>
              <h3>Sistema de Tutoria</h3>
              <p>Conecte-se com tutores especializados, agende sessões individuais e tenha acompanhamento personalizado do seu progresso.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <span role="img" aria-label="Colaborativo">🤝</span>
              </div>
              <h3>Recursos Colaborativos</h3>
              <p>Compartilhe resumos, crie grupos de estudo, colabore em projetos e tenha acesso a materiais produzidos pela comunidade.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <span role="img" aria-label="Autenticação">🔐</span>
              </div>
              <h3>Sistema de Autenticação Completo</h3>
              <p>Cadastro seguro, recuperação de senha, autenticação de dois fatores e perfis diferenciados para alunos e professores.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <div className="about-content">
            <div className="about-image">
              <img src="/logo512.png" alt="Plataforma Seu-Estudo" />
            </div>
            <div className="about-text">
              <h2>Sobre o Seu-Estudo</h2>
              <p>
                Somos uma plataforma educacional inovadora que utiliza inteligência artificial para revolucionar
                a preparação para o ENEM e vestibulares. Nossa missão é democratizar o acesso à educação de qualidade.
              </p>
              <p>
                Combinamos tecnologia de ponta com metodologias pedagógicas comprovadas para oferecer
                uma experiência de aprendizado personalizada e eficiente.
              </p>
              <ul className="about-list">
                <li>✅ Processamento automático de livros didáticos com IA</li>
                <li>✅ Sistema completo de questões do ENEM com videoaulas</li>
                <li>✅ Gamificação avançada com rankings e conquistas</li>
                <li>✅ Sistema de tutoria colaborativo</li>
                <li>✅ Recursos colaborativos entre estudantes</li>
                <li>✅ Autenticação segura e perfis diferenciados</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <div className="container">
          <h2 className="section-title">Depoimentos dos Usuários</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"O processamento de livros com IA é incrível! Enviei meu livro de matemática e em minutos tinha questões organizadas por capítulo com resolução automática."</p>
              </div>
              <div className="testimonial-author">
                <img src="/logo512.png" alt="Ana Costa" />
                <div>
                  <h4>Ana Costa</h4>
                  <p>Estudante de Medicina</p>
                </div>
              </div>
            </div>

            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"O sistema de tutoria colaborativo me conectou com professores excelentes. As sessões individuais fazem toda a diferença no meu desempenho."</p>
              </div>
              <div className="testimonial-author">
                <img src="/logo512.png" alt="Carlos Oliveira" />
                <div>
                  <h4>Carlos Oliveira</h4>
                  <p>Aprovado no ENEM 2024</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Revolucione sua preparação para o ENEM</h2>
          <p>Experimente o poder da IA na educação e tenha acesso completo às funcionalidades premium gratuitamente!</p>
          <Link to="/registrar" className="btn btn-primary btn-large">Começar Gratuitamente</Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="homepage-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-logo">
              <h2>Seu-Estudo</h2>
              <p>Aprenda de forma inteligente</p>
            </div>
            <div className="footer-links">
              <div className="footer-column">
                <h3>Produto</h3>
                <ul>
                  <li><a href="#features">Recursos</a></li>
                  <li><a href="#">Preços</a></li>
                  <li><a href="#">Download</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h3>Empresa</h3>
                <ul>
                  <li><a href="#about">Sobre nós</a></li>
                  <li><a href="#contact">Contato</a></li>
                  <li><a href="#">Carreiras</a></li>
                </ul>
              </div>
              <div className="footer-column">
                <h3>Suporte</h3>
                <ul>
                  <li><a href="#">Central de ajuda</a></li>
                  <li><a href="#">Termos de uso</a></li>
                  <li><a href="#">Política de privacidade</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Seu-Estudo. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;