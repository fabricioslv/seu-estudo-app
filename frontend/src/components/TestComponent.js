// components/TestComponent.js
import React, { useState, useEffect, useCallback } from 'react';
import QuestionTestComponent from './QuestionTestComponent';

const TestComponent = ({ 
  tipoTeste, 
  testeData, 
  onConcluirTeste 
}) => {
  const [respostas, setRespostas] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timer, setTimer] = useState(testeData?.info?.duracao ? testeData.info.duracao * 60 : 1800); // duração em minutos convertida para segundos (padrão 30 min)
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  const handleConcluirTeste = useCallback(() => {
    // Verifica se todas as perguntas foram respondidas (opcional)
    onConcluirTeste({
      tipo: tipoTeste,
      respostas,
      tempoRestante: timer
    });
  }, [onConcluirTeste, tipoTeste, respostas, timer]);

  // Inicializa as respostas com base nas perguntas
  useEffect(() => {
    if (testeData?.perguntas) {
      const respostasIniciais = {};
      testeData.perguntas.forEach(pergunta => {
        respostasIniciais[pergunta.id] = '';
      });
      setRespostas(respostasIniciais);
    }
  }, [testeData]);

  // Timer para o teste
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(timer => timer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
      handleConcluirTeste(); // Concluir automaticamente quando o tempo acabar
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer, handleConcluirTeste]);

  const handleRespostaChange = (idPergunta, alternativa) => {
    setRespostas(prev => ({
      ...prev,
      [idPergunta]: alternativa
    }));
  };

  const handleProximaQuestao = () => {
    if (currentQuestionIndex < testeData.perguntas.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handleQuestaoAnterior = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const formatarTempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!testeData?.perguntas || testeData.perguntas.length === 0) {
    return <div>Carregando teste...</div>;
  }

  const perguntaAtual = testeData.perguntas[currentQuestionIndex];
  const respostaAtual = respostas[perguntaAtual.id] || '';

  return (
    <div className="test-container">
      <div className="test-header">
        <h2>{testeData.info?.nome || 'Teste'}</h2>
        <div className="test-info">
          <div className="timer-test">Tempo restante: <span className={timer < 300 ? 'timer-alert' : ''}>{formatarTempo(timer)}</span></div>
          <div className="progresso-test">Questão {currentQuestionIndex + 1} de {testeData.perguntas.length}</div>
        </div>
      </div>

      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${((currentQuestionIndex + 1) / testeData.perguntas.length) * 100}%` }}
        ></div>
      </div>

      <div className="question-test-wrapper">
        <QuestionTestComponent
          pergunta={perguntaAtual}
          respostaAtual={respostaAtual}
          onRespostaChange={handleRespostaChange}
          numero={currentQuestionIndex + 1}
        />
      </div>

      <div className="test-navigation">
        <button 
          className="btn-anterior"
          onClick={handleQuestaoAnterior}
          disabled={currentQuestionIndex === 0}
        >
          Anterior
        </button>
        
        {currentQuestionIndex < testeData.perguntas.length - 1 ? (
          <button 
            className="btn-proximo"
            onClick={handleProximaQuestao}
            disabled={!respostaAtual}
          >
            Próxima
          </button>
        ) : (
          <button 
            className="btn-concluir-teste"
            onClick={handleConcluirTeste}
            disabled={!respostaAtual}
          >
            Concluir Teste
          </button>
        )}
      </div>
    </div>
  );
};

export default TestComponent;