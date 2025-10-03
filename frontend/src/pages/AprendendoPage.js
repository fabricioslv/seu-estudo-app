// pages/AprendendoPage.js
import React from 'react';
import { Link } from 'react-router-dom';

const AprendendoPage = () => {
  return (
    <div className="aprendendo-page">
      <div className="aprendendo-header">
        <h1>Aprendendo</h1>
        <p>Seu caminho personalizado para o sucesso acadêmico</p>
      </div>
      
      <div className="aprendendo-options">
        <Link to="/aprendendo/criar-plano" className="option-card">
          <div className="option-icon">🧠</div>
          <h3>Criar Plano de Estudos com IA</h3>
          <p>Gere um plano personalizado com base em seus objetivos e tempo disponível</p>
        </Link>
        
        <Link to="/aprendendo/selecionar-materias" className="option-card">
          <div className="option-icon">📚</div>
          <h3>Selecionar Matérias Manualmente</h3>
          <p>Escolha as matérias que deseja estudar e crie seu próprio plano</p>
        </Link>
        
        <Link to="/aprendendo/progresso" className="option-card">
          <div className="option-icon">📈</div>
          <h3>Ver Progresso</h3>
          <p>Acompanhe seu desempenho e evolução nos estudos</p>
        </Link>
        
        <Link to="/aprendendo/desafios" className="option-card">
          <div className="option-icon">⚔️</div>
          <h3>Desafiar Outros Usuários</h3>
          <p>Teste seus conhecimentos em desafios com outros estudantes</p>
        </Link>
      </div>
    </div>
  );
};

export default AprendendoPage;