// pages/SimuladosPage.js
import React, { useState, useEffect } from 'react';
import SimuladoComponent from '../components/SimuladoComponent';
import { useNavigate } from 'react-router-dom';
import simuladosService from '../services/simuladosService';

const SimuladosPage = () => {
  const [simulados, setSimulados] = useState([]);
  const [simuladoSelecionado, setSimuladoSelecionado] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showResult, setShowResult] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchSimulados();
  }, []);

  const fetchSimulados = async () => {
    try {
      const data = await simuladosService.getSimuladosDisponiveis();
      setSimulados(data.simulados || []);
    } catch (err) {
      console.error('Erro ao carregar simulados:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleIniciarSimulado = async (id) => {
    try {
      const data = await simuladosService.getQuestoesSimulado(id);
      
      setSimuladoSelecionado(prev => ({
        ...data.simulado,
        questoes: data.questoes
      }));
    } catch (error) {
      console.error('Erro ao carregar simulado:', error);
      setError(error.message);
    }
  };

  const handleConcluirSimulado = async (result) => {
    try {
      const data = await simuladosService.enviarRespostasSimulado(
        simuladoSelecionado.id,
        result.respostas || [] // Assuming the SimuladoComponent returns respostas
      );

      setResultData({
        ...data,
        simulado: simuladoSelecionado
      });
      setShowResult(true);
      setSimuladoSelecionado(null);
    } catch (error) {
      console.error('Erro ao concluir simulado:', error);
      setError(error.message);
    }
  };

  const handleVoltar = () => {
    setShowResult(false);
    setResultData(null);
    setSimuladoSelecionado(null);
    setError(null);
  };

  if (showResult && resultData) {
    return (
      <div className="simulado-result">
        <h2>Resultado do Simulado</h2>
        <div className="result-content">
          <h3>{resultData.simulado?.titulo || 'Simulado'}</h3>
          <div className="result-details">
            <p><strong>Acertos:</strong> {resultData.pontuacao?.acertos || 0}/{resultData.pontuacao?.total || 0}</p>
            <p><strong>Porcentagem de acerto:</strong> {resultData.pontuacao?.porcentagem || 0}%</p>
          </div>
          <div className="result-actions">
            <button onClick={() => navigate('/desempenho')}>Ver Desempenho</button>
            <button onClick={handleVoltar}>Fazer Outro Simulado</button>
          </div>
        </div>
      </div>
    );
  }

  if (simuladoSelecionado) {
    return (
      <div className="active-simulado">
        <button className="btn-voltar" onClick={handleVoltar}>Voltar</button>
        <SimuladoComponent 
          simulado={simuladoSelecionado} 
          onConcluirSimulado={handleConcluirSimulado} 
        />
      </div>
    );
  }

  return (
    <div className="simulados-page">
      <h2>Simulados Disponíveis</h2>
      {error && (
        <div className="error-message">
          <p>Erro: {error}</p>
          <button onClick={fetchSimulados}>Tentar Novamente</button>
        </div>
      )}
      {isLoading ? (
        <p>Carregando simulados...</p>
      ) : (
        <div className="simulados-list">
          {simulados.length > 0 ? (
            simulados.map(simulado => (
              <div key={simulado.id} className="simulado-card">
                <h3>{simulado.titulo}</h3>
                <p>{simulado.descricao}</p>
                <p>Matéria: {simulado.materia}</p>
                <p>Duração: {simulado.duracao} minutos</p>
                <p>Questões: {simulado.total_questoes || 0}</p>
                <button 
                  className="btn-iniciar"
                  onClick={() => handleIniciarSimulado(simulado.id)}
                >
                  Iniciar Simulado
                </button>
              </div>
            ))
          ) : (
            <p>Nenhum simulado disponível no momento.</p>
          )}
        </div>
      )}
    </div>
  );
};

export default SimuladosPage;