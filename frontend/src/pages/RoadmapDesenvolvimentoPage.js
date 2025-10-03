// pages/RoadmapDesenvolvimentoPage.js
import React from 'react';
import RoadmapDesenvolvimento from '../components/RoadmapDesenvolvimento';

const RoadmapDesenvolvimentoPage = () => {
  return (
    <div className="roadmap-page">
      <div className="roadmap-page-header">
        <h1>Roadmap de Desenvolvimento</h1>
        <p>Plano estratégico para evolução contínua do sistema educacional</p>
      </div>

      <RoadmapDesenvolvimento />
    </div>
  );
};

export default RoadmapDesenvolvimentoPage;