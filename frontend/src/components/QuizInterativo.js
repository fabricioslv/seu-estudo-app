// components/QuizInterativo.js
import React, { useState, useEffect } from 'react';

const QuizInterativo = ({ 
  quizData, 
  onComplete, 
  onAnswerSelect,
  modo = 'aprendizado' // 'aprendizado' ou 'desafio'
}) => {
  const [perguntaAtual, setPerguntaAtual] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [mostrarResultado, setMostrarResultado] = useState(false);
  const [tempoRestante, setTempoRestante] = useState(quizData.tempo_limite || 1800); // 30 minutos padrão
  const [quizIniciado, setQuizIniciado] = useState(false);
  const [explicacoes, setExplicacoes] = useState({});

  // Timer para o quiz
  useEffect(() => {
    let interval = null;
    
    if (quizIniciado && tempoRestante > 0 && !mostrarResultado) {
      interval = setInterval(() => {
        setTempoRestante(tempo => {
          if (tempo <= 1) {
            // Tempo esgotado, finalizar quiz
            handleFinalizarQuiz();
            return 0;
          }
          return tempo - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [quizIniciado, tempoRestante, mostrarResultado]);

  const handleIniciarQuiz = () => {
    setQuizIniciado(true);
  };

  const handleRespostaSelect = (perguntaId, alternativa) => {
    setRespostas(prev => ({
      ...prev,
      [perguntaId]: alternativa
    }));

    // Chamar callback se fornecido
    if (onAnswerSelect) {
      onAnswerSelect(perguntaId, alternativa);
    }
  };

  const handleProximaPergunta = () => {
    if (perguntaAtual < quizData.perguntas.length - 1) {
      setPerguntaAtual(prev => prev + 1);
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
    setPerguntaAtual(index);
  };

  const handleFinalizarQuiz = () => {
    setMostrarResultado(true);
    setQuizIniciado(false);
    
    // Calcular resultados
    const resultados = calcularResultados();
    
    // Chamar callback se fornecido
    if (onComplete) {
      onComplete(resultados);
    }
  };

  const calcularResultados = () => {
    let acertos = 0;
    let total = quizData.perguntas.length;
    
    const detalhes = quizData.perguntas.map(pergunta => {
      const respostaUsuario = respostas[pergunta.id];
      const isCorreta = respostaUsuario === pergunta.resposta_correta;
      
      if (isCorreta) acertos++;
      
      return {
        perguntaId: pergunta.id,
        respostaUsuario,
        respostaCorreta: pergunta.resposta_correta,
        isCorreta,
        explicacao: pergunta.explicacao || 'Explicação não disponível'
      };
    });
    
    const porcentagem = total > 0 ? Math.round((acertos / total) * 100) : 0;
    
    return {
      acertos,
      total,
      porcentagem,
      detalhes,
      tempoGasto: quizData.tempo_limite ? quizData.tempo_limite - tempoRestante : 0
    };
  };

  const formatarTempo = (segundos) => {
    const minutos = Math.floor(segundos / 60);
    const segundosRestantes = segundos % 60;
    return `${minutos.toString().padStart(2, '0')}:${segundosRestantes.toString().padStart(2, '0')}`;
  };

  const pergunta = quizData.perguntas[perguntaAtual];
  const respostaSelecionada = respostas[pergunta?.id] || null;

  if (!quizIniciado && !mostrarResultado) {
    return (
      <div className="quiz-inicio">
        <div className="quiz-header">
          <h2>{quizData.titulo}</h2>
          <p>{quizData.descricao}</p>
        </div>
        
        <div className="quiz-info">
          <div className="info-item">
            <span className="info-label">Questões:</span>
            <span className="info-value">{quizData.perguntas.length}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Tempo limite:</span>
            <span className="info-value">{formatarTempo(quizData.tempo_limite || 1800)}</span>
          </div>
          
          <div className="info-item">
            <span className="info-label">Dificuldade:</span>
            <span className="info-value">
              {quizData.dificuldade === 1 ? 'Fácil' : 
               quizData.dificuldade === 2 ? 'Médio' : 'Difícil'}
            </span>
          </div>
        </div>
        
        <div className="quiz-instrucoes">
          <h3>Instruções:</h3>
          <ul>
            <li>Você terá {formatarTempo(quizData.tempo_limite || 1800)} para responder todas as questões</li>
            <li>Cada questão tem apenas uma resposta correta</li>
            <li>Você pode navegar entre as questões usando os botões de navegação</li>
            <li>O quiz será finalizado automaticamente quando o tempo acabar</li>
          </ul>
        </div>
        
        <button 
          className="btn-iniciar-quiz"
          onClick={handleIniciarQuiz}
        >
          Iniciar Quiz
        </button>
      </div>
    );
  }

  if (mostrarResultado) {
    const resultados = calcularResultados();
    
    return (
      <div className="quiz-resultado">
        <div className="resultado-header">
          <h2>Resultado do Quiz</h2>
          <div className="resultado-score">
            <span className="score-numero">{resultados.porcentagem}%</span>
            <span className="score-texto">
              {resultados.acertos} de {resultados.total} questões corretas
            </span>
          </div>
          
          <div className={`resultado-status ${resultados.porcentagem >= 70 ? 'aprovado' : 'reprovado'}`}>
            {resultados.porcentagem >= 70 ? '🎉 Parabéns! Excelente desempenho!' : '💪 Continue praticando!'}
          </div>
        </div>
        
        <div className="detalhes-resultado">
          <h3>Detalhamento das Respostas</h3>
          
          <div className="resultado-lista">
            {resultados.detalhes.map((detalhe, index) => {
              const pergunta = quizData.perguntas.find(p => p.id === detalhe.perguntaId);
              
              return (
                <div 
                  key={detalhe.perguntaId} 
                  className={`resultado-item ${detalhe.isCorreta ? 'correto' : 'incorreto'}`}
                >
                  <div className="resultado-pergunta">
                    <h4>{pergunta.numero}. {pergunta.enunciado}</h4>
                    
                    <div className="resultado-respostas">
                      <p><strong>Sua resposta:</strong> {detalhe.respostaUsuario || 'Não respondida'}</p>
                      {!detalhe.isCorreta && (
                        <p><strong>Resposta correta:</strong> {detalhe.respostaCorreta}</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="resultado-explicacao">
                    <h5>Explicação:</h5>
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
            }}
          >
            🔁 Revisar Quiz
          </button>
          
          <button 
            className="btn-proximo"
            onClick={() => {
              if (onComplete) {
                onComplete(resultados);
              }
            }}
          >
            ➡️ Próximo Conteúdo
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz-interativo">
      <div className="quiz-header">
        <h2>{quizData.titulo}</h2>
        
        <div className="quiz-status">
          <div className="tempo-restante">
            ⏱ Tempo: <span className={tempoRestante < 60 ? 'tempo-alerta' : ''}>
              {formatarTempo(tempoRestante)}
            </span>
          </div>
          
          <div className="progresso-quiz">
            Questão {perguntaAtual + 1} de {quizData.perguntas.length}
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
          <h3>{pergunta.numero}. {pergunta.enunciado}</h3>
          
          <div className="alternativas-quiz">
            {Object.entries(pergunta.alternativas).map(([letra, texto]) => {
              const isSelected = respostaSelecionada === letra;
              const isCorrect = letra === pergunta.resposta_correta;
              const showResult = mostrarResultado && respostaSelecionada;
              
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
              className={`indicador-pergunta ${index === perguntaAtual ? 'atual' : ''} ${respostas[quizData.perguntas[index].id] ? 'respondida' : ''}`}
              onClick={() => handleIrParaPergunta(index)}
            >
              {index + 1}
            </button>
          ))}
        </div>
        
        {perguntaAtual < quizData.perguntas.length - 1 ? (
          <button 
            className="btn-proxima"
            onClick={handleProximaPergunta}
            disabled={!respostaSelecionada}
          >
            Próxima →
          </button>
        ) : (
          <button 
            className="btn-finalizar"
            onClick={handleFinalizarQuiz}
            disabled={!respostaSelecionada}
          >
            Finalizar Quiz
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizInterativo;