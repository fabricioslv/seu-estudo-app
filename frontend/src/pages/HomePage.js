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
            <h1 className="hero-title">Aprenda de forma inteligente e gamificada</h1>
            <p className="hero-subtitle">
              Prepare-se para o ENEM e vestibulares com nossa plataforma educacional completa. 
              Questões reais, simulados personalizados e um sistema de recompensas que torna o estudo divertido.
            </p>
            <div className="hero-actions">
              <Link to="/registrar" className="btn btn-primary btn-large">Comece Gratuitamente</Link>
              <Link to="/simulados" className="btn btn-secondary btn-large">Ver Demonstração</Link>
            </div>
          </div>
          <div className="hero-image">
            <img src="/images/study-hero.png" alt="Estudante usando o Seu-Estudo" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="features">
        <div className="container">
          <h2 className="section-title">Por que escolher o Seu-Estudo?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <span role="img" aria-label="Questões">📚</span>
              </div>
              <h3>Questões Reais do ENEM</h3>
              <p>Acesse todas as questões dos anos anteriores com resoluções detalhadas e explicações inteligentes.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <span role="img" aria-label="Simulados">📝</span>
              </div>
              <h3>Simulados Personalizados</h3>
              <p>Crie simulados com base em suas necessidades e acompanhe seu desempenho ao longo do tempo.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <span role="img" aria-label="Gamificação">🏆</span>
              </div>
              <h3>Gamificação Completa</h3>
              <p>Ganhe pontos, conquistas e suba no ranking enquanto estuda. Torne o aprendizado divertido!</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <span role="img" aria-label="IA">🤖</span>
              </div>
              <h3>Assistente de IA</h3>
              <p>Receba explicações personalizadas e planos de estudo adaptados ao seu perfil de aprendizado.</p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="about">
        <div className="container">
          <div className="about-content">
            <div className="about-image">
              <img src="/images/study-group.png" alt="Grupo de estudantes" />
            </div>
            <div className="about-text">
              <h2>Sobre o Seu-Estudo</h2>
              <p>
                Somos uma plataforma educacional desenvolvida especialmente para ajudar estudantes 
                brasileiros a se prepararem para o ENEM e vestibulares de forma eficiente e engajante.
              </p>
              <p>
                Nosso sistema combina tecnologia de ponta com metodologias pedagógicas comprovadas 
                para oferecer a melhor experiência de aprendizado possível.
              </p>
              <ul className="about-list">
                <li>✅ Mais de 10.000 questões resolvidas</li>
                <li>✅ Sistema de gamificação premiado</li>
                <li>✅ Assistente de IA personalizado</li>
                <li>✅ Relatórios de desempenho detalhados</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials">
        <div className="container">
          <h2 className="section-title">O que dizem nossos usuários</h2>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"O Seu-Estudo me ajudou a aumentar minha nota em 50 pontos no ENEM. A gamificação torna o estudo muito mais divertido!"</p>
              </div>
              <div className="testimonial-author">
                <img src="/images/avatar1.png" alt="Maria Silva" />
                <div>
                  <h4>Maria Silva</h4>
                  <p>Aprovada na USP</p>
                </div>
              </div>
            </div>
            
            <div className="testimonial-card">
              <div className="testimonial-content">
                <p>"As explicações da IA são fantásticas! Nunca tinha entendido trigonometria tão facilmente."</p>
              </div>
              <div className="testimonial-author">
                <img src="/images/avatar2.png" alt="João Santos" />
                <div>
                  <h4>João Santos</h4>
                  <p>Aprovado no ITA</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container">
          <h2>Pronto para transformar sua jornada de estudos?</h2>
          <p>Comece hoje mesmo e veja a diferença que o Seu-Estudo pode fazer na sua preparação!</p>
          <Link to="/registrar" className="btn btn-primary btn-large">Cadastre-se Grátis</Link>
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