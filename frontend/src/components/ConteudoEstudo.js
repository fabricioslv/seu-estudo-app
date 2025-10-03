// components/ConteudoEstudo.js
import React, { useState } from 'react';

const ConteudoEstudo = ({ 
  conteudo, 
  onConcluirConteudo, 
  onResponderQuiz,
  modoEstudo = 'aprendizado' // 'aprendizado' ou 'quiz'
}) => {
  const [conteudoExpandido, setConteudoExpandido] = useState(null);
  const [respostasQuiz, setRespostasQuiz] = useState({});
  const [quizConcluido, setQuizConcluido] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleExpandirConteudo = (itemId) => {
    setConteudoExpandido(conteudoExpandido === itemId ? null : itemId);
  };

  const handleResponderPergunta = (perguntaId, resposta) => {
    setRespostasQuiz(prev => ({
      ...prev,
      [perguntaId]: resposta
    }));
  };

  const handleConcluirQuiz = () => {
    if (!conteudo.quiz || !conteudo.quiz.perguntas) return;
    
    // Verificar respostas
    let acertos = 0;
    const total = conteudo.quiz.perguntas.length;
    
    const resultados = conteudo.quiz.perguntas.map(pergunta => {
      const respostaUsuario = respostasQuiz[pergunta.id];
      const isCorreta = respostaUsuario === pergunta.resposta_correta;
      
      if (isCorreta) acertos++;
      
      return {
        perguntaId: pergunta.id,
        respostaUsuario,
        respostaCorreta: pergunta.resposta_correta,
        isCorreta,
        explicacao: pergunta.explicacao
      };
    });
    
    const porcentagem = Math.round((acertos / total) * 100);
    
    setQuizConcluido(true);
    setFeedback({
      acertos,
      total,
      porcentagem,
      resultados
    });
    
    // Chamar callback com resultados
    if (onResponderQuiz) {
      onResponderQuiz({
        conteudoId: conteudo.id,
        acertos,
        total,
        porcentagem,
        resultados
      });
    }
  };

  const handleConcluirConteudo = () => {
    if (onConcluirConteudo) {
      onConcluirConteudo(conteudo.id);
    }
  };

  if (!conteudo) {
    return <div>Carregando conteúdo...</div>;
  }

  return (
    <div className="conteudo-estudo">
      <div className="conteudo-header">
        <h2>{conteudo.titulo}</h2>
        <p className="conteudo-subtitulo">{conteudo.subtitulo}</p>
        <div className="conteudo-meta">
          <span className="conteudo-materia">{conteudo.materia}</span>
          <span className="conteudo-duracao">⏱ {conteudo.tempo_estimado} min</span>
          <span className="conteudo-nivel">
            {conteudo.nivel_dificuldade === 1 ? 'Fácil' : 
             conteudo.nivel_dificuldade === 2 ? 'Médio' : 'Difícil'}
          </span>
        </div>
      </div>

      {modoEstudo === 'aprendizado' && (
        <div className="conteudo-aprendizado">
          <div className="secoes-conteudo">
            {conteudo.secoes && conteudo.secoes.map(secao => (
              <div key={secao.id} className="secao-conteudo">
                <div 
                  className="secao-header"
                  onClick={() => handleExpandirConteudo(secao.id)}
                >
                  <h3>{secao.titulo}</h3>
                  <span className={`secao-toggle ${conteudoExpandido === secao.id ? 'expandido' : ''}`}>
                    {conteudoExpandido === secao.id ? '▲' : '▼'}
                  </span>
                </div>
                
                {conteudoExpandido === secao.id && (
                  <div className="secao-body">
                    {secao.tipo === 'texto' && (
                      <div className="secao-texto">
                        <p>{secao.conteudo}</p>
                      </div>
                    )}
                    
                    {secao.tipo === 'imagem' && (
                      <div className="secao-imagem">
                        <img src={secao.url} alt={secao.descricao} />
                        {secao.descricao && <p>{secao.descricao}</p>}
                      </div>
                    )}
                    
                    {secao.tipo === 'video' && (
                      <div className="secao-video">
                        <iframe 
                          src={secao.url} 
                          title={secao.titulo}
                          frameBorder="0"
                          allowFullScreen
                        ></iframe>
                        {secao.descricao && <p>{secao.descricao}</p>}
                      </div>
                    )}
                    
                    {secao.tipo === 'diagrama' && (
                      <div className="secao-diagrama">
                        <div className="diagrama-placeholder">
                          Diagrama: {secao.titulo}
                        </div>
                        {secao.descricao && <p>{secao.descricao}</p>}
                      </div>
                    )}
                    
                    {secao.tipo === 'exemplo' && (
                      <div className="secao-exemplo">
                        <h4>Exemplo:</h4>
                        <p>{secao.conteudo}</p>
                        {secao.solucao && (
                          <div className="exemplo-solucao">
                            <h5>Solução:</h5>
                            <p>{secao.solucao}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="conteudo-acoes">
            <button 
              className="btn-concluir-conteudo"
              onClick={handleConcluirConteudo}
            >
              ✓ Marcar como Concluído
            </button>
            
            {conteudo.quiz && (
              <button 
                className="btn-iniciar-quiz"
                onClick={() => handleExpandirConteudo('quiz')}
              >
                🎯 Iniciar Quiz
              </button>
            )}
          </div>
        </div>
      )}

      {modoEstudo === 'quiz' && conteudo.quiz && (
        <div className="conteudo-quiz">
          <div className="quiz-header">
            <h3>Quiz: {conteudo.quiz.titulo}</h3>
            <p>{conteudo.quiz.descricao}</p>
          </div>
          
          {!quizConcluido ? (
            <div className="quiz-perguntas">
              {conteudo.quiz.perguntas.map(pergunta => (
                <div key={pergunta.id} className="pergunta-quiz">
                  <h4>{pergunta.numero}. {pergunta.enunciado}</h4>
                  
                  <div className="alternativas-quiz">
                    {Object.entries(pergunta.alternativas).map(([letra, texto]) => {
                      const isSelected = respostasQuiz[pergunta.id] === letra;
                      
                      return (
                        <div 
                          key={letra}
                          className={`alternativa-quiz ${isSelected ? 'selecionada' : ''}`}
                          onClick={() => handleResponderPergunta(pergunta.id, letra)}
                        >
                          <span className="alternativa-letra">{letra})</span>
                          <span className="alternativa-texto">{texto}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
              
              <button 
                className="btn-concluir-quiz"
                onClick={handleConcluirQuiz}
                disabled={Object.keys(respostasQuiz).length !== conteudo.quiz.perguntas.length}
              >
                ✅ Concluir Quiz
              </button>
            </div>
          ) : (
            <div className="quiz-feedback">
              <div className="feedback-resumo">
                <h3>Resultado do Quiz</h3>
                <div className="feedback-score">
                  <span className="score-numero">{feedback.porcentagem}%</span>
                  <span className="score-texto">
                    {feedback.acertos} de {feedback.total} questões corretas
                  </span>
                </div>
                
                <div className={`feedback-status ${feedback.porcentagem >= 70 ? 'aprovado' : 'reprovado'}`}>
                  {feedback.porcentagem >= 70 ? '🎉 Parabéns! Excelente desempenho!' : '💪 Continue praticando!'}
                </div>
              </div>
              
              <div className="feedback-detalhes">
                <h4>Detalhamento das Respostas</h4>
                {feedback.resultados.map(resultado => {
                  const pergunta = conteudo.quiz.perguntas.find(p => p.id === resultado.perguntaId);
                  
                  return (
                    <div 
                      key={resultado.perguntaId} 
                      className={`feedback-item ${resultado.isCorreta ? 'correto' : 'incorreto'}`}
                    >
                      <div className="feedback-pergunta">
                        <h5>{pergunta.numero}. {pergunta.enunciado}</h5>
                        <div className="feedback-resposta">
                          <p><strong>Sua resposta:</strong> {resultado.respostaUsuario}</p>
                          {!resultado.isCorreta && (
                            <p><strong>Resposta correta:</strong> {resultado.respostaCorreta}</p>
                          )}
                        </div>
                      </div>
                      
                      {resultado.explicacao && (
                        <div className="feedback-explicacao">
                          <h6>Explicação:</h6>
                          <p>{resultado.explicacao}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <div className="feedback-acoes">
                <button 
                  className="btn-revisar"
                  onClick={() => {
                    setQuizConcluido(false);
                    setRespostasQuiz({});
                    setFeedback(null);
                  }}
                >
                  🔁 Revisar Conteúdo
                </button>
                
                <button 
                  className="btn-proximo"
                  onClick={handleConcluirConteudo}
                >
                  ➡️ Próximo Conteúdo
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ConteudoEstudo;