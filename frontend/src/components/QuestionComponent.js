// components/QuestionComponent.js
import React, { useState, useEffect } from 'react';

const QuestionComponent = ({ 
  questao, 
  onRespostaChange, 
  respostaUsuario, 
  explicacaoVisivel, 
  onToggleExplicacao,
  onExplicacaoGenerated  // Nova prop para lidar com explicações geradas
}) => {
  const [alternativaSelecionada, setAlternativaSelecionada] = useState(respostaUsuario);
  const [explicacao, setExplicacao] = useState(questao.explicacao || null);
  const [carregandoExplicacao, setCarregandoExplicacao] = useState(false);

  useEffect(() => {
    setAlternativaSelecionada(respostaUsuario);
  }, [respostaUsuario]);

  useEffect(() => {
    if (questao.explicacao) {
      setExplicacao(questao.explicacao);
    }
  }, [questao.explicacao]);

  const handleAlternativaChange = (alternativa) => {
    setAlternativaSelecionada(alternativa);
    onRespostaChange(questao.numero, alternativa);
  };

  const handleGerarExplicacao = async () => {
    // Verificar se já temos uma explicação
    if (explicacao) {
      onToggleExplicacao(questao.numero);
      return;
    }

    setCarregandoExplicacao(true);
    
    try {
      // Chamar a API para gerar explicação
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:6001/api'}/questoes/generate-explanation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ questao })
      });

      if (!response.ok) {
        throw new Error(`Erro na requisição: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success && data.explanation) {
        setExplicacao(data.explanation);
        if (onExplicacaoGenerated) {
          onExplicacaoGenerated(questao.numero, data.explanation);
        }
        onToggleExplicacao(questao.numero);
      } else {
        throw new Error('Falha ao gerar explicação');
      }
    } catch (error) {
      console.error('Erro ao gerar explicação:', error);
      // Usar explicação padrão
      const explicacaoPadrao = `A resposta correta é "${questao.resposta_correta}". Esta questão aborda conceitos importantes de ${questao.materia}. 
      A alternativa correta contempla os princípios fundamentais necessários para resolver esta questão, enquanto as demais contêm 
      informações incorretas ou irrelevantes para o contexto do enunciado.`;
      
      setExplicacao(explicacaoPadrao);
      if (onExplicacaoGenerated) {
        onExplicacaoGenerated(questao.numero, explicacaoPadrao);
      }
      onToggleExplicacao(questao.numero);
    } finally {
      setCarregandoExplicacao(false);
    }
  };

  // Formata o enunciado para renderizar corretamente
  const formatarEnunciado = (enunciado) => {
    // Substitui quebras de linha por tags <br />
    return enunciado.split('\n').map((linha, index) => (
      <span key={index}>
        {linha}
        {index < enunciado.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  return (
    <div className="question-container">
      <div className="question-header">
        <h3>Questão {questao.numero}</h3>
        <span className="subject-tag">{questao.materia}</span>
        <span className="year-tag">{questao.ano}</span>
      </div>
      
      <div className="question-content">
        <p className="enunciado">{formatarEnunciado(questao.enunciado)}</p>
        
        <div className="alternativas">
          {Object.entries(questao.alternativas).map(([letra, texto]) => {
            const isSelected = alternativaSelecionada === letra;
            const isCorrect = questao.resposta_correta && letra === questao.resposta_correta;
            const showResult = respostaUsuario && explicacaoVisivel; // Mostrar resultado quando resposta foi selecionada e explicação está visível
            
            let alternativaClass = 'alternativa-option';
            if (showResult) {
              if (isCorrect) {
                alternativaClass += ' alternativa-correct';
              } else if (isSelected && !isCorrect) {
                alternativaClass += ' alternativa-incorrect';
              } else if (letra === questao.resposta_correta) {
                alternativaClass += ' alternativa-correct';
              }
            } else if (isSelected) {
              alternativaClass += ' alternativa-selected';
            }
            
            return (
              <div 
                key={letra} 
                className={alternativaClass}
                onClick={() => handleAlternativaChange(letra)}
              >
                <span className="alternativa-letra">{letra})</span>
                <span className="alternativa-texto">{texto}</span>
              </div>
            );
          })}
        </div>
      </div>
      
      {explicacaoVisivel && questao.resposta_correta && (
        <div className="explicacao">
          <h4>Explicação:</h4>
          <p><strong>Resposta correta:</strong> {questao.resposta_correta}</p>
          {explicacao ? (
            <p>{explicacao}</p>
          ) : (
            <p>Explicação detalhada será adicionada em breve.</p>
          )}
        </div>
      )}
      
      {!explicacaoVisivel && (
        <button 
          className="btn-explicacao"
          onClick={handleGerarExplicacao}
          disabled={carregandoExplicacao}
        >
          {carregandoExplicacao ? 'Gerando Explicação...' : 'Mostrar Explicação'}
        </button>
      )}
    </div>
  );
};

export default QuestionComponent;