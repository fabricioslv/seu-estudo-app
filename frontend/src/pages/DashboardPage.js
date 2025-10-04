// src/pages/DashboardPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <h1>Bem-vindo, {user?.nome}!</h1>
        <p>Seu painel de controle personalizado</p>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-section">
          <h2>Seu Progresso</h2>
          <div className="progress-summary">
            <div className="progress-card">
              <h3>Livros Processados</h3>
              <p>3 livros didáticos processados com IA</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '60%' }}></div>
              </div>
              <p className="progress-text">3 de 5 livros</p>
            </div>
            <div className="progress-card">
              <h3>Questões ENEM</h3>
              <p>Respostas corretas nas últimas questões</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '78%' }}></div>
              </div>
              <p className="progress-text">78% de acerto</p>
            </div>
            <div className="progress-card">
              <h3>Pontuação</h3>
              <p>Total de pontos acumulados na gamificação</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '65%' }}></div>
              </div>
              <p className="progress-text">1.950 pontos</p>
            </div>
            <div className="progress-card">
              <h3>Sessões de Tutoria</h3>
              <p>Sessões individuais realizadas este mês</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '40%' }}></div>
              </div>
              <p className="progress-text">2 de 5 sessões</p>
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Ações Rápidas</h2>
          <div className="quick-actions">
            <Link to="/livros" className="action-card">
              <div className="action-icon">📖</div>
              <h3>Processar Livros</h3>
              <p>Envie seus livros didáticos para processamento com IA</p>
            </Link>
            <Link to="/simulados" className="action-card">
              <div className="action-icon">📊</div>
              <h3>Questões ENEM</h3>
              <p>Pratique com questões reais do ENEM</p>
            </Link>
            <Link to="/tutoria/encontrar" className="action-card">
              <div className="action-icon">👥</div>
              <h3>Encontrar Tutor</h3>
              <p>Agende sessões individuais com tutores especializados</p>
            </Link>
            <Link to="/gamificacao" className="action-card">
              <div className="action-icon">🎮</div>
              <h3>Gamificação</h3>
              <p>Veja seu ranking e conquistas acumuladas</p>
            </Link>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Recomendações Personalizadas</h2>
          <div className="recommendations">
            <div className="recommendation-card">
              <h3>Processar Novo Livro</h3>
              <p>Você ainda tem 2 livros disponíveis para processamento com IA. Aproveite para expandir seu banco de questões!</p>
              <Link to="/livros" className="btn btn-primary">Enviar Livro</Link>
            </div>
            <div className="recommendation-card">
              <h3>Sessão de Tutoria</h3>
              <p>Baseado no seu desempenho em Matemática, recomendamos uma sessão de tutoria para reforçar conceitos específicos.</p>
              <Link to="/tutoria/encontrar" className="btn btn-primary">Agendar Tutoria</Link>
            </div>
            <div className="recommendation-card">
              <h3>Desafio Semanal</h3>
              <p>Participe do desafio semanal de questões ENEM e ganhe pontos extras na gamificação!</p>
              <Link to="/gamificacao" className="btn btn-primary">Ver Desafio</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;