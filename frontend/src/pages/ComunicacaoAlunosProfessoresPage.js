// pages/ComunicacaoAlunosProfessoresPage.js
import React from 'react';
import ComunicacaoAlunosProfessores from '../components/ComunicacaoAlunosProfessores';
import { useAuth } from '../context/AuthContext';

const ComunicacaoAlunosProfessoresPage = () => {
  const { user } = useAuth();

  return (
    <div className="comunicacao-page">
      <div className="comunicacao-header">
        <h1>Comunicação com Professores</h1>
        <p>Envie mensagens, tire dúvidas e mantenha contato com seus professores</p>
      </div>

      <ComunicacaoAlunosProfessores 
        userId={user?.id} 
        userType={user?.tipo || 'aluno'} 
      />
    </div>
  );
};

export default ComunicacaoAlunosProfessoresPage;