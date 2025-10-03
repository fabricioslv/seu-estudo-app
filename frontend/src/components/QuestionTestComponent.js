// components/QuestionTestComponent.js
import React from 'react';

const QuestionTestComponent = ({ 
  pergunta, 
  respostaAtual, 
  onRespostaChange,
  numero 
}) => {
  const handleRespostaChange = (alternativa) => {
    onRespostaChange(pergunta.id, alternativa);
  };

  return (
    <div className="question-test-container">
      <div className="question-test-header">
        <h3>Questão {numero}</h3>
      </div>
      
      <div className="question-test-content">
        <p className="enunciado-test">{pergunta.enunciado}</p>
        
        <div className="alternativas-test">
          {Object.entries(pergunta.alternativas).map(([letra, texto]) => {
            const isSelected = respostaAtual === letra;
            
            return (
              <div 
                key={letra} 
                className={`alternativa-option-test ${isSelected ? 'alternativa-selected-test' : ''}`}
                onClick={() => handleRespostaChange(letra)}
              >
                <input
                  type="radio"
                  id={`alt-${pergunta.id}-${letra}`}
                  name={`questao-${pergunta.id}`}
                  checked={isSelected}
                  onChange={() => handleRespostaChange(letra)}
                />
                <label htmlFor={`alt-${pergunta.id}-${letra}`} className="alternativa-texto-test">
                  {texto}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default QuestionTestComponent;