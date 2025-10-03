// components/SimuladoComponent.js
import React, { useState, useEffect } from 'react';
import QuestionComponent from './QuestionComponent';

const SimuladoComponent = ({ simulado, onConcluirSimulado }) => {
  const [respostasUsuario, setRespostasUsuario] = useState({});
  const [respostasTempos, setRespostasTempos] = useState({}); // Armazena tempo de resposta para cada questão
  const [questoes, setQuestoes] = useState([]);
  const [explicacoesVisiveis, setExplicacoesVisiveis] = useState({});
  const [explicacoesQuestoes, setExplicacoesQuestoes] = useState({}); // Armazena explicações geradas
  const [timer, setTimer] = useState(simulado.duracao ? simulado.duracao * 60 : 0); // duração em minutos convertida para segundos
  const [isTimerRunning, setIsTimerRunning] = useState(true);

  // Inicializa as respostas do usuário com base nas questões
  useEffect(() => {
    if (simulado.questoes && simulado.questoes.length > 0) {
      setQuestoes(simulado.questoes);
      
      // Inicializa respostas e tempos vazios para cada questão
      const respostasIniciais = {};
      const temposIniciais = {};
      simulado.questoes.forEach(questao => {
        respostasIniciais[questao.numero] = null;
        temposIniciais[questao.numero] = 0; // Tempo ainda não respondida
      });
      setRespostasUsuario(respostasIniciais);
      setRespostasTempos(temposIniciais);
    }
  }, [simulado]);

  // Timer para a simulação
  useEffect(() => {
    let interval = null;
    if (isTimerRunning && timer > 0) {
      interval = setInterval(() => {
        setTimer(timer => timer - 1);
      }, 1000);
    } else if (timer === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timer]);

  const handleRespostaChange = (numeroQuestao, alternativa) => {
    // Se está mudando a resposta, armazenar o tempo decorrido até agora
    if (respostasUsuario[numeroQuestao] !== alternativa) {
      // Calcular tempo de resposta (tempo total - tempo restante no momento da resposta)
      const tempoResposta = (simulado.duracao * 60) - timer;
      
      setRespostasTempos(prev => ({
        ...prev,
        [numeroQuestao]: tempoResposta
      }));
    }
    
    setRespostasUsuario(prev => ({
      ...prev,
      [numeroQuestao]: alternativa
    }));
  };

  const handleToggleExplicacao = (numeroQuestao) => {
    setExplicacoesVisiveis(prev => ({
      ...prev,
      [numeroQuestao]: !prev[numeroQuestao]
    }));
  };

  const handleExplicacaoGenerated = (numeroQuestao, explicacao) => {
    setExplicacoesQuestoes(prev => ({
      ...prev,
      [numeroQuestao]: explicacao
    }));
    
    // Atualizar a questão com a explicação
    setQuestoes(prevQuestoes => 
      prevQuestoes.map(questao => 
        questao.numero === numeroQuestao 
          ? { ...questao, explicacao }
          : questao
      )
    );
  };

  const formatarTempo = (segundos) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const calcularPontuacao = () => {
    let corretas = 0;
    let total = 0;

    questoes.forEach(questao => {
      if (respostasUsuario[questao.numero] !== null && questao.resposta_correta) {
        total++;
        if (respostasUsuario[questao.numero] === questao.resposta_correta) {
          corretas++;
        }
      }
    });

    return { corretas, total, porcentagem: total > 0 ? Math.round((corretas / total) * 100) : 0 };
  };

  const handleConcluirSimulado = () => {
    const pontuacao = calcularPontuacao();
    
    // Preparar as respostas no formato esperado pela API
    const respostasFormatadas = questoes.map(questao => {
      return {
        questao_id: questao.id,
        resposta_usuario: respostasUsuario[questao.numero],
        tempoResposta: respostasTempos[questao.numero] || 0
      };
    }).filter(resposta => resposta.resposta_usuario !== null); // Apenas questões respondidas

    onConcluirSimulado({
      simulado: simulado,
      respostas: respostasFormatadas,
      pontuacao,
      tempoRestante: timer
    });
  };

  if (questoes.length === 0) {
    return <div>Carregando questões do simulado...</div>;
  }

  return (
    <div className="simulado-container">
      <div className="simulado-header">
        <h2>{simulado.titulo || 'Simulado'}</h2>
        <div className="simulado-info">
          <div className="timer">Tempo restante: <span className={timer < 300 ? 'timer-alert' : ''}>{formatarTempo(timer)}</span></div>
          <div className="progresso">Questões: {questoes.length}</div>
        </div>
      </div>

      <div className="questoes-container">
        {questoes.map((questao, index) => (
          <div key={questao.numero} className="questao-item">
            <QuestionComponent
              questao={{...questao, explicacao: questao.explicacao || explicacoesQuestoes[questao.numero]}}
              respostaUsuario={respostasUsuario[questao.numero]}
              onRespostaChange={handleRespostaChange}
              explicacaoVisivel={explicacoesVisiveis[questao.numero]}
              onToggleExplicacao={handleToggleExplicacao}
              onExplicacaoGenerated={handleExplicacaoGenerated}
            />
          </div>
        ))}
      </div>

      <div className="simulado-footer">
        <div className="pontuacao-resumo">
          <h4>Progresso Atual:</h4>
          {calcularPontuacao().total > 0 ? (
            <p>Acertos: {calcularPontuacao().corretas}/{calcularPontuacao().total} ({calcularPontuacao().porcentagem}%)</p>
          ) : (
            <p>Nenhuma questão respondida ainda</p>
          )}
        </div>
        <button 
          className="btn-concluir"
          onClick={handleConcluirSimulado}
        >
          Concluir Simulado
        </button>
      </div>
    </div>
  );
};

export default SimuladoComponent;