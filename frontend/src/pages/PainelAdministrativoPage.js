// pages/PainelAdministrativoPage.js
import React from 'react';
import PainelAdministrativo from '../components/PainelAdministrativo';
import { useAuth } from '../context/AuthContext';

const PainelAdministrativoPage = () => {
  const { user } = useAuth();

  return (
    <div className="painel-admin-page">
      <div className="painel-admin-header">
        <h1>Painel Administrativo</h1>
        <p>Gestão completa de usuários, conteúdos e estatísticas do sistema</p>
      </div>

      <PainelAdministrativo adminId={user?.id} />
    </div>
  );
};

export default PainelAdministrativoPage;