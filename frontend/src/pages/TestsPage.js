// pages/TestsPage.js
import React, { useState, useEffect } from 'react';
import TestComponent from '../components/TestComponent';

const TestsPage = () => {
  const [tiposTestes, setTiposTestes] = useState([]);
  const [testeSelecionado, setTesteSelecionado] = useState(null);
  const [testeData, setTestData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [resultData, setResultData] = useState(null);
  const [currentView, setCurrentView] = useState('list'); // 'list', 'test' or 'result'

  // Carregar tipos de testes
  useEffect(() => {
    const fetchTiposTestes = async () => {
      try {
        const response = await fetch('http://localhost:6001/api/questoes/test-types');
        const data = await response.json();
        
        if (data.success) {
          setTiposTestes(data.tiposTestes);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao carregar tipos de testes:', error);
        setIsLoading(false);
      }
    };

    fetchTiposTestes();
  }, []);

  const handleIniciarTeste = async (tipo) => {
    try {
      const response = await fetch(`http://localhost:6001/api/questoes/test/${tipo}`);
      const data = await response.json();
      
      if (data.success) {
        setTesteSelecionado(tipo);
        setTestData(data.teste);
        setCurrentView('test');
      }
    } catch (error) {
      console.error('Erro ao carregar teste:', error);
    }
  };

  const handleConcluirTeste = async (dadosTeste) => {
    try {
      const response = await fetch(`http://localhost:6001/api/questoes/test/${dadosTeste.tipo}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ respostas: dadosTeste.respostas })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setResultData({
          ...data.resultado,
          tipo: dadosTeste.tipo,
          tempo: dadosTeste.tempoRestante
        });
        setCurrentView('result');
      }
    } catch (error) {
      console.error('Erro ao processar teste:', error);
    }
  };

  const handleVoltar = () => {
    setTesteSelecionado(null);
    setTestData(null);
    setResultData(null);
    setCurrentView('list');
  };

  if (currentView === 'result' && resultData) {
    return (
      <div className="test-result">
        <h2>Resultado do Teste: {getTestName(resultData.tipo)}</h2>
        
        <div className="result-content">
          {resultData.tipo === 'personalidade' ? renderPersonalidadeResult(resultData) : 
           resultData.tipo === 'vocacional' ? renderVocacionalResult(resultData) : 
           renderHabilidadesResult(resultData)}
        </div>
        
        <button className="btn-voltar-testes" onClick={handleVoltar}>
          Fazer Outro Teste
        </button>
      </div>
    );
  }

  if (currentView === 'test' && testeData) {
    return (
      <div className="active-test">
        <TestComponent 
          tipoTeste={testeSelecionado} 
          testeData={testeData} 
          onConcluirTeste={handleConcluirTeste} 
        />
        <button className="btn-voltar-testes" onClick={handleVoltar}>
          Voltar para Testes
        </button>
      </div>
    );
  }

  return (
    <div className="tests-page">
      <h2>Testes Psicológicos e Vocacionais</h2>
      
      {isLoading ? (
        <p>Carregando testes...</p>
      ) : (
        <div className="tests-list">
          {tiposTestes.map(tipoTeste => (
            <div key={tipoTeste.tipo} className="test-card">
              <h3>{tipoTeste.nome}</h3>
              <p>{tipoTeste.descricao}</p>
              <p>Duração: {tipoTeste.duracao} minutos</p>
              <button 
                className="btn-iniciar-teste"
                onClick={() => handleIniciarTeste(tipoTeste.tipo)}
              >
                Iniciar Teste
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Funções auxiliares para renderizar resultados
function getTestName(tipo) {
  const nomes = {
    'personalidade': 'Teste de Personalidade',
    'vocacional': 'Teste Vocacional',
    'habilidades': 'Teste de Habilidades'
  };
  return nomes[tipo] || tipo;
}

function renderPersonalidadeResult(resultado) {
  return (
    <div className="personalidade-result">
      <h3>Seus Resultados de Personalidade</h3>
      <div className="fatores-container">
        <div className="fator">
          <h4>Extroversão: {resultado.fatores.extroversao.toFixed(2)}/5</h4>
          <p>{resultado.fatores.interpretacao.extroversao}</p>
        </div>
        <div className="fator">
          <h4>Amabilidade: {resultado.fatores.amabilidade.toFixed(2)}/5</h4>
          <p>{resultado.fatores.interpretacao.amabilidade}</p>
        </div>
        <div className="fator">
          <h4>Conscienciosidade: {resultado.fatores.conscienciosidade.toFixed(2)}/5</h4>
          <p>{resultado.fatores.interpretacao.conscienciosidade}</p>
        </div>
        <div className="fator">
          <h4>Neuroticismo: {resultado.fatores.neuroticismo.toFixed(2)}/5</h4>
          <p>{resultado.fatores.interpretacao.neuroticismo}</p>
        </div>
        <div className="fator">
          <h4>Abertura: {resultado.fatores.abertura.toFixed(2)}/5</h4>
          <p>{resultado.fatores.interpretacao.abertura}</p>
        </div>
      </div>
    </div>
  );
}

function renderVocacionalResult(resultado) {
  return (
    <div className="vocacional-result">
      <h3>Seus Interesses Profissionais</h3>
      <div className="areas-container">
        {resultado.areasInteresse.map((area, index) => (
          <div key={index} className="area">
            <h4>
              {getAreaName(area.area)}: {area.pontuacao.toFixed(2)}/5
            </h4>
          </div>
        ))}
      </div>
      
      <div className="carreiras-sugeridas">
        <h4>Carreiras Sugeridas:</h4>
        <ul>
          {resultado.carreirasSugeridas.map((carreira, index) => (
            <li key={index} className="carreira-item">
              <strong>{carreira.nome}</strong> - {carreira.descricao}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function getAreaName(area) {
  const nomes = {
    'exatas': 'Exatas',
    'humanas': 'Humanas',
    'biologicas': 'Biológicas',
    'linguagens': 'Linguagens'
  };
  return nomes[area] || area;
}

function renderHabilidadesResult(resultado) {
  return (
    <div className="habilidades-result">
      <h3>Seu Nível de Habilidades</h3>
      <div className="habilidades-container">
        <div className="habilidade">
          <h4>Raciocínio Lógico: {resultado.areas.raciocinio.toFixed(2)}/5</h4>
        </div>
        <div className="habilidade">
          <h4>Comunicação Verbal: {resultado.areas.verbal.toFixed(2)}/5</h4>
        </div>
        <div className="habilidade">
          <h4>Raciocínio Quantitativo: {resultado.areas.quantitativo.toFixed(2)}/5</h4>
        </div>
      </div>
      <p>Nível geral: {resultado.nivel}</p>
    </div>
  );
}

export default TestsPage;