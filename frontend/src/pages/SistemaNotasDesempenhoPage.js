// pages/SistemaNotasDesempenhoPage.js
import React from 'react';
import SistemaNotasDesempenho from '../components/SistemaNotasDesempenho';
import { useAuth } from '../context/AuthContext';

const SistemaNotasDesempenhoPage = () => {
  const { user } = useAuth();

  return (
    <div className="sistema-notas-page">
      <div className="sistema-notas-header">
        <h1>Sistema de Notas e Desempenho</h1>
        <p>Acompanhe seu progresso acadêmico e desempenho em todas as disciplinas</p>
      </div>

      <SistemaNotasDesempenho userId={user?.id} />
    </div>
  );
};

export default SistemaNotasDesempenhoPage;