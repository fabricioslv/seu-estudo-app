// src/components/Footer.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer-container">
        <div className="footer-section">
          <h3 className="footer-title">Seu-Estudo</h3>
          <p className="footer-description">
            Plataforma educacional completa para estudantes do ensino médio se prepararem para o ENEM e vestibulares.
          </p>
          <div className="footer-social">
            <a href="#" aria-label="Facebook" className="social-link">
              <span className="social-icon">f</span>
            </a>
            <a href="#" aria-label="Twitter" className="social-link">
              <span className="social-icon">t</span>
            </a>
            <a href="#" aria-label="Instagram" className="social-link">
              <span className="social-icon">i</span>
            </a>
            <a href="#" aria-label="YouTube" className="social-link">
              <span className="social-icon">y</span>
            </a>
          </div>
        </div>
        
        <div className="footer-section">
          <h4 className="footer-heading">Recursos</h4>
          <ul className="footer-links">
            <li><Link to="/simulados" className="footer-link">Simulados</Link></li>
            <li><Link to="/estudar" className="footer-link">Módulo Aprendendo</Link></li>
            <li><Link to="/testes" className="footer-link">Testes Psicológicos</Link></li>
            <li><Link to="/livros" className="footer-link">Livros Didáticos</Link></li>
            <li><Link to="/gamificacao" className="footer-link">Gamificação</Link></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4 className="footer-heading">Empresa</h4>
          <ul className="footer-links">
            <li><Link to="/sobre" className="footer-link">Sobre Nós</Link></li>
            <li><a href="#contato" className="footer-link">Contato</a></li>
            <li><Link to="/blog" className="footer-link">Blog</Link></li>
            <li><a href="#carreiras" className="footer-link">Carreiras</a></li>
          </ul>
        </div>
        
        <div className="footer-section">
          <h4 className="footer-heading">Suporte</h4>
          <ul className="footer-links">
            <li><a href="#ajuda" className="footer-link">Central de Ajuda</a></li>
            <li><Link to="/termos" className="footer-link">Termos de Uso</Link></li>
            <li><Link to="/privacidade" className="footer-link">Política de Privacidade</Link></li>
            <li><a href="#cookies" className="footer-link">Preferências de Cookies</a></li>
          </ul>
        </div>
      </div>
      
      <div className="footer-bottom">
        <div className="footer-container">
          <p className="copyright">&copy; {new Date().getFullYear()} Seu-Estudo. Todos os direitos reservados.</p>
          <div className="footer-bottom-links">
            <Link to="/termos" className="footer-link">Termos</Link>
            <Link to="/privacidade" className="footer-link">Privacidade</Link>
            <a href="#seguranca" className="footer-link">Segurança</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;