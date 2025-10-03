// pages/DesempenhoLivrosDidaticosPage.js
import React from 'react';
import DesempenhoLivrosDidaticos from '../components/DesempenhoLivrosDidaticos';
import { useAuth } from '../context/AuthContext';

const DesempenhoLivrosDidaticosPage = () => {
  const { user } = useAuth();

  return (
    <div className="desempenho-livros-page">
      <div className="desempenho-livros-header">
        <h1>Desempenho nos Livros Didáticos</h1>
        <p>Acompanhe seu progresso e desempenho nos conteúdos extraídos dos livros didáticos</p>
      </div>

      <DesempenhoLivrosDidaticos userId={user?.id} />
    </div>
  );
};

export default DesempenhoLivrosDidaticosPage;