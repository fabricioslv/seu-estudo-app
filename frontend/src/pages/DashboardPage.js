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
              <h3>Simulados</h3>
              <p>Você completou 5 de 12 simulados</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '42%' }}></div>
              </div>
            </div>
            <div className="progress-card">
              <h3>Questões</h3>
              <p>Você respondeu 120 de 500 questões</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '24%' }}></div>
              </div>
            </div>
            <div className="progress-card">
              <h3>Estudo</h3>
              <p>Você estudou por 15 horas</p>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '30%' }}></div>
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Ações Rápidas</h2>
          <div className="quick-actions">
            <Link to="/simulados" className="action-card">
              <div className="action-icon">📝</div>
              <h3>Simulados</h3>
              <p>Acesse simulados e avaliações</p>
            </Link>
            <Link to="/estudar" className="action-card">
              <div className="action-icon">📚</div>
              <h3>Estudar</h3>
              <p>Continue seus estudos</p>
            </Link>
            <Link to="/testes" className="action-card">
              <div className="action-icon">🧠</div>
              <h3>Testes</h3>
              <p>Faça testes psicológicos</p>
            </Link>
            <Link to="/livros" className="action-card">
              <div className="action-icon">📖</div>
              <h3>Livros</h3>
              <p>Acesse livros didáticos</p>
            </Link>
          </div>
        </div>

        <div className="dashboard-section">
          <h2>Recomendações</h2>
          <div className="recommendations">
            <div className="recommendation-card">
              <h3>Matemática</h3>
              <p>Você tem dificuldade em Geometria. Recomendamos praticar mais questões deste tópico.</p>
              <Link to="/estudar/geometria" className="btn btn-primary">Estudar Geometria</Link>
            </div>
            <div className="recommendation-card">
              <h3>Simulado ENEM</h3>
              <p>Há um novo simulado disponível para você. Teste seus conhecimentos!</p>
              <Link to="/simulados/enem-2025" className="btn btn-primary">Fazer Simulado</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;