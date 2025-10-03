// components/QuizInterativoAvancado.js - Versão aprimorada com funcionalidades avançadas
import React, { useState, useEffect, useRef } from 'react';

const QuizInterativoAvancado = ({
  quizData,
  onComplete,
  onAnswerSelect,
  modo = 'aprendizado', // 'aprendizado', 'desafio', 'exame'
  usuario,
  onPontuacaoGanha
}) => {
  const [perguntaAtual, setPerguntaAtual] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [respostasConfirmadas, setRespostasConfirmadas] = useState({});
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(quizData.tempo_limite || 1800);
  const [quizIniciado, setQuizIniciado] = useState(false);
  const [explicacoes, setExplicacoes] = useState({});
  const [dicas, setDicas] = useState({});
  const [pontuacao, setPontuacao] = useState(0);
  const [multiplicador, setMultiplicador] = useState(1);
  const [animacaoResposta, setAnimacaoResposta] = useState(null);
  const [dicasUsadas, setDicasUsadas] = useState({});
  const [tempoPorPergunta, setTempoPorPergunta] = useState({});
  const [perguntaIniciadaEm, setPerguntaIniciadaEm] = useState(Date.now);
  const [comboAcertos, setComboAcertos] = useState(0);
  const [bonusRapidez, setBonusRapidez] = useState(0);

  const respostaTimeoutRef = useRef(null);

  // Timer para o quiz
  useEffect(() => {
    let interval = null;

    if (quizIniciado && tempoRestante > 0 && !mostrarResultado) {
      interval = setInterval(() => {
        setTempoRestante(tempo => {
          if (tempo <= 1) {
            handleFinalizarQuiz();
            return 0;
          }
          return tempo - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [quizIniciado, tempoRestante, mostrarResultado]);

  // Timer para controlar tempo por pergunta
  useEffect(() => {
    setPerguntaIniciadaEm(Date.now());
  }, [perguntaAtual]);

  // Sistema de pontuação avançado
  useEffect(() => {
    if (respostasConfirmadas[perguntaAtual] && quizIniciado) {
      const pergunta = quizData.perguntas[perguntaAtual];
      const respostaUsuario = respostas[pergunta.id];
      const tempoGasto = (Date.now() - perguntaIniciadaEm) / 1000;

      if (respostaUsuario === pergunta.resposta_correta) {
        // Cálculo de pontuação baseado em velocidade e dificuldade
        const pontuacaoBase = pergunta.dificuldade * 10;
        const bonusVelocidade = Math.max(0, (60 - tempoGasto) / 60) * 20; // Bonus por responder rápido
        const pontuacaoPergunta = Math.round((pontuacaoBase + bonusVelocidade) * multiplicador);

        setPontuacao(prev => prev + pontuacaoPergunta);
        setComboAcertos(prev => prev + 1);

        // Bonus de combo
        let bonusCombo = 0;
        if (comboAcertos > 2) {
          bonusCombo = comboAcertos * 5;
          setPontuacao(prev => prev + bonusCombo);
        }

        // Multiplicador aumenta com acertos consecutivos
        if (comboAcertos % 5 === 0) {
          setMultiplicador(prev => Math.min(prev + 0.2, 3));
        }

        // Callback para pontuação ganha
        if (onPontuacaoGanha) {
          onPontuacaoGanha(pontuacaoPergunta + bonusCombo);
        }
      } else {
        setComboAcertos(0);
        setMultiplicador(1);
      }
    }
  }, [respostasConfirmadas, perguntaAtual, quizIniciado]);

  const handleIniciarQuiz = () => {
    setQuizIniciado(true);
    setPontuacao(0);
    setMultiplicador(1);
    setComboAcertos(0);
  };

  const handleRespostaSelect = (perguntaId, alternativa) => {
    setRespostas(prev => ({
      ...prev,
      [perguntaId]: alternativa
    }));

    if (onAnswerSelect) {
      onAnswerSelect(perguntaId, alternativa);
    }

    // Animação de resposta
    setAnimacaoResposta(alternativa);

    // Auto-avançar após resposta (modo exame)
    if (modo === 'exame') {
      respostaTimeoutRef.current = setTimeout(() => {
        handleConfirmarResposta();
      }, 1500);
    }
  };

  const handleConfirmarResposta = () => {
    if (respostaTimeoutRef.current) {
      clearTimeout(respostaTimeoutRef.current);
    }

    const pergunta = quizData.perguntas[perguntaAtual];
    const tempoGasto = (Date.now() - perguntaIniciadaEm) / 1000;

    setTempoPorPergunta(prev => ({
      ...prev,
      [pergunta.id]: tempoGasto
    }));

    setRespostasConfirmadas(prev => ({
      ...prev,
      [perguntaAtual]: true
    }));

    setAnimacaoResposta(null);
  };

  const handleUsarDica = async (perguntaId) => {
    if (dicasUsadas[perguntaId]) return;

    try {
      // Simular chamada para API de dicas
      const response = await fetch(`/api/quiz/dica/${perguntaId}`);
      const data = await response.json();

      setDicas(prev => ({
        ...prev,
        [perguntaId]: data.dica
      }));

      setDicasUsadas(prev => ({
        ...prev,
        [perguntaId]: true
      }));

      // Penalidade de pontuação por usar dica
      setPontuacao(prev => Math.max(0, prev - 10));

    } catch (error) {
      console.error('Erro ao buscar dica:', error);
    }
  };

  const handleProximaPergunta = () => {
    if (modo === 'aprendizado' && !respostasConfirmadas[perguntaAtual]) {
      alert('Confirme sua resposta antes de continuar!');
      return;
    }

    if (perguntaAtual < quizData.perguntas.length - 1) {
      setPerguntaAtual(prev => prev + 1);
      setRespostasConfirmadas(prev => ({
        ...prev,
        [perguntaAtual + 1]: false
      }));
    } else {
      handleFinalizarQuiz();
    }
  };

  const handlePerguntaAnterior = () => {
    if (perguntaAtual > 0) {
      setPerguntaAtual(prev => prev - 1);
    }
  };

  const handleIrParaPergunta = (index) => {
    if (modo === 'exame' && index > perguntaAtual) return; // Não permite pular questões no modo exame
    setPerguntaAtual(index);
  };

  const handleFinalizarQuiz = () => {
    setMostrarResultado(true);
    setQuizIniciado(false);

    const resultados = calcularResultados();

    if (onComplete) {
      onComplete(resultados);
    }
  };

  const calcularResultados = () => {
    let acertos = 0;
    let total = quizData.perguntas.length;

    const detalhes = quizData.perguntas.map((pergunta, index) => {
      const respostaUsuario = respostas[pergunta.id];
      const isCorreta = respostaUsuario === pergunta.resposta_correta;
      const tempoGasto = tempoPorPergunta[pergunta.id] || 0;

      if (isCorreta) acertos++;

      return {
        perguntaId: pergunta.id,
        respostaUsuario,
        respostaCorreta: pergunta.resposta_correta,
        isCorreta,
        tempoGasto,
        explicacao: pergunta.explicacao || 'Explicação não disponível'
      };
    });

    const porcentagem = total > 0 ? Math.round((acertos / total) * 100) : 0;

    return {
      acertos,
      total,
      porcentagem,
      detalhes,
      pontuacao,
      tempoGasto: quizData.tempo_limite ? quizData.tempo_limite - tempoRestante : 0,
      modo,
      comboMaximo: Math.max(...Object.values(comboAcertos))
    };
  };

  const formatarTempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
  };

  const pergunta = quizData.perguntas[perguntaAtual];
  const respostaSelecionada = respostas[pergunta?.id] || null;
  const respostaConfirmada = respostasConfirmadas[perguntaAtual];

  // Tela inicial
  if (!quizIniciado && !mostrarResultado) {
    return (
      <div className="quiz-inicio-avancado">
        <div className="quiz-header">
          <h2>{quizData.titulo}</h2>
          <p>{quizData.descricao}</p>
        </div>

        <div className="quiz-info">
          <div className="info-item">
            <span className="info-label">📚 Questões:</span>
            <span className="info-value">{quizData.perguntas.length}</span>
          </div>

          <div className="info-item">
            <span className="info-label">⏱ Tempo limite:</span>
            <span className="info-value">{formatarTempo(quizData.tempo_limite || 1800)}</span>
          </div>

          <div className="info-item">
            <span className="info-label">🎯 Dificuldade:</span>
            <span className="info-value">
              {quizData.dificuldade === 1 ? 'Fácil' :
               quizData.dificuldade === 2 ? 'Médio' : 'Difícil'}
            </span>
          </div>

          <div className="info-item">
            <span className="info-label">🏆 Modo:</span>
            <span className="info-value">
              {modo === 'aprendizado' ? 'Aprendizado' :
               modo === 'desafio' ? 'Desafio' : 'Exame'}
            </span>
          </div>
        </div>

        <div className="quiz-features">
          <h3>Funcionalidades:</h3>
          <ul>
            <li>⭐ Sistema de pontuação avançado</li>
            <li>🔥 Combo de acertos consecutivos</li>
            <li>⚡ Bonus por rapidez</li>
            <li>💡 Dicas disponíveis</li>
            <li>🎯 Diferentes modos de jogo</li>
          </ul>
        </div>

        <button
          className="btn-iniciar-quiz-avancado"
          onClick={handleIniciarQuiz}
        >
          🚀 Iniciar Quiz Avançado
        </button>
      </div>
    );
  }

  // Tela de resultados
  if (mostrarResultado) {
    const resultados = calcularResultados();

    return (
      <div className="quiz-resultado-avancado">
        <div className="resultado-header">
          <h2>🎉 Quiz Concluído!</h2>

          <div className="resultado-principal">
            <div className="score-final">
              <span className="score-numero">{resultados.porcentagem}%</span>
              <span className="score-texto">
                {resultados.acertos} de {resultados.total} questões
              </span>
            </div>

            <div className="pontuacao-final">
              <span className="pontos">🏆 {resultados.pontuacao} pontos</span>
              <span className="combo">🔥 Combo máximo: {resultados.comboMaximo}</span>
            </div>
          </div>

          <div className={`resultado-status ${resultados.porcentagem >= 70 ? 'aprovado' : 'reprovado'}`}>
            {resultados.porcentagem >= 70 ? '🎉 Parabéns! Você arrasou!' : '💪 Continue praticando!'}
          </div>
        </div>

        <div className="detalhes-resultado">
          <h3>📊 Detalhamento das Respostas</h3>

          <div className="resultado-lista">
            {resultados.detalhes.map((detalhe, index) => {
              const pergunta = quizData.perguntas[index];

              return (
                <div
                  key={detalhe.perguntaId}
                  className={`resultado-item ${detalhe.isCorreta ? 'correto' : 'incorreto'}`}
                >
                  <div className="resultado-pergunta">
                    <h4>{pergunta.numero}. {pergunta.enunciado}</h4>
                    <div className="tempo-gasto">⏱ {Math.round(detalhe.tempoGasto)}s</div>

                    <div className="resultado-respostas">
                      <p><strong>Sua resposta:</strong> {detalhe.respostaUsuario || 'Não respondida'}</p>
                      {!detalhe.isCorreta && (
                        <p><strong>Resposta correta:</strong> {detalhe.respostaCorreta}</p>
                      )}
                    </div>
                  </div>

                  <div className="resultado-explicacao">
                    <h5>💡 Explicação:</h5>
                    <p>{detalhe.explicacao}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="resultado-acoes">
          <button
            className="btn-revisar"
            onClick={() => {
              setMostrarResultado(false);
              setQuizIniciado(true);
              setPerguntaAtual(0);
              setRespostas({});
              setRespostasConfirmadas({});
              setPontuacao(0);
            }}
          >
            🔁 Revisar Quiz
          </button>

          <button
            className="btn-desafiar"
            onClick={() => {
              // Implementar desafio entre usuários
              console.log('Desafiar outros usuários');
            }}
          >
            ⚔️ Desafiar Amigos
          </button>
        </div>
      </div>
    );
  }

  // Interface principal do quiz
  return (
    <div className="quiz-interativo-avancado">
      <div className="quiz-header">
        <h2>{quizData.titulo}</h2>

        <div className="quiz-status">
          <div className="tempo-restante">
            ⏱ <span className={tempoRestante < 60 ? 'tempo-alerta' : ''}>
              {formatarTempo(tempoRestante)}
            </span>
          </div>

          <div className="pontuacao-atual">
            🏆 {pontuacao} pontos
          </div>

          <div className="multiplicador">
            ⚡ x{multiplicador.toFixed(1)}
          </div>

          <div className="combo-atual">
            🔥 {comboAcertos} acertos seguidos
          </div>
        </div>
      </div>

      <div className="progresso-barra">
        <div
          className="progresso-preenchimento"
          style={{ width: `${((perguntaAtual + 1) / quizData.perguntas.length) * 100}%` }}
        ></div>
      </div>

      <div className="quiz-conteudo">
        <div className="pergunta-atual">
          <div className="pergunta-header">
            <h3>{pergunta.numero}. {pergunta.enunciado}</h3>
            <div className="pergunta-dificuldade">
              Dificuldade: {pergunta.dificuldade === 1 ? '🟢 Fácil' :
                           pergunta.dificuldade === 2 ? '🟡 Médio' : '🔴 Difícil'}
            </div>
          </div>

          <div className="alternativas-quiz">
            {Object.entries(pergunta.alternativas).map(([letra, texto]) => {
              const isSelected = respostaSelecionada === letra;
              const isCorrect = letra === pergunta.resposta_correta;
              const showResult = respostaConfirmada && respostaSelecionada;

              let alternativaClass = 'alternativa-quiz';
              if (showResult) {
                if (isCorrect) {
                  alternativaClass += ' alternativa-correta';
                } else if (isSelected && !isCorrect) {
                  alternativaClass += ' alternativa-incorreta';
                }
              } else if (isSelected) {
                alternativaClass += ' alternativa-selecionada';
              }

              if (animacaoResposta === letra) {
                alternativaClass += ' alternativa-animacao';
              }

              return (
                <div
                  key={letra}
                  className={alternativaClass}
                  onClick={() => handleRespostaSelect(pergunta.id, letra)}
                >
                  <span className="alternativa-letra">{letra})</span>
                  <span className="alternativa-texto">{texto}</span>
                  {showResult && isCorrect && (
                    <span className="alternativa-indicador">✓</span>
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <span className="alternativa-indicador">✗</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Área de dicas */}
          {modo === 'aprendizado' && (
            <div className="area-dicas">
              {dicas[pergunta.id] ? (
                <div className="dica-revelada">
                  <h5>💡 Dica:</h5>
                  <p>{dicas[pergunta.id]}</p>
                </div>
              ) : (
                <button
                  className="btn-dica"
                  onClick={() => handleUsarDica(pergunta.id)}
                  disabled={dicasUsadas[pergunta.id]}
                >
                  💡 Usar Dica (-10 pontos)
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="quiz-navegacao">
        <button
          className="btn-anterior"
          onClick={handlePerguntaAnterior}
          disabled={perguntaAtual === 0}
        >
          ← Anterior
        </button>

        <div className="navegacao-indicadores">
          {quizData.perguntas.map((_, index) => (
            <button
              key={index}
              className={`indicador-pergunta ${index === perguntaAtual ? 'atual' : ''} ${respostas[quizData.perguntas[index].id] ? 'respondida' : ''} ${respostasConfirmadas[index] ? 'confirmada' : ''}`}
              onClick={() => handleIrParaPergunta(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {modo === 'aprendizado' ? (
          <button
            className="btn-confirmar"
            onClick={handleConfirmarResposta}
            disabled={!respostaSelecionada}
          >
            ✓ Confirmar
          </button>
        ) : (
          <button
            className="btn-proxima"
            onClick={handleProximaPergunta}
            disabled={!respostaSelecionada}
          >
            Próxima →
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizInterativoAvancado;