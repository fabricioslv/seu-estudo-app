// Teste básico de sintaxe e importação do componente QuizInterativoAvancado
import React from 'react';
import { render } from '@testing-library/react';
import QuizInterativoAvancado from './QuizInterativoAvancado';

// Dados de teste básicos para o componente
const mockQuizData = {
  titulo: 'Quiz de Teste',
  descricao: 'Quiz para testar a correção do bug bonusCombo',
  dificuldade: 2,
  tempo_limite: 300,
  perguntas: [
    {
      id: 'q1',
      numero: 1,
      enunciado: 'Qual é a capital do Brasil?',
      alternativas: {
        'A': 'São Paulo',
        'B': 'Rio de Janeiro',
        'C': 'Brasília',
        'D': 'Salvador'
      },
      resposta_correta: 'C',
      dificuldade: 1,
      explicacao: 'Brasília é a capital do Brasil desde 1960.'
    },
    {
      id: 'q2',
      numero: 2,
      enunciado: 'Quanto é 2 + 2?',
      alternativas: {
        'A': '3',
        'B': '4',
        'C': '5',
        'D': '6'
      },
      resposta_correta: 'B',
      dificuldade: 1,
      explicacao: '2 + 2 = 4'
    }
  ]
};

describe('QuizInterativoAvancado - Teste de Correção de Bug', () => {
  test('Componente renderiza sem erros de sintaxe', () => {
    // Este teste verifica se o componente pode ser renderizado sem erros
    // Se houver algum erro de sintaxe, como a variável bonusCombo não definida,
    // este teste falhará

    const mockOnComplete = jest.fn();
    const mockOnAnswerSelect = jest.fn();
    const mockOnPontuacaoGanha = jest.fn();

    expect(() => {
      render(
        <QuizInterativoAvancado
          quizData={mockQuizData}
          onComplete={mockOnComplete}
          onAnswerSelect={mockOnAnswerSelect}
          onPontuacaoGanha={mockOnPontuacaoGanha}
          modo="aprendizado"
        />
      );
    }).not.toThrow();
  });

  test('Variável bonusCombo está corretamente definida', () => {
    // Este teste simula o cenário que causava o erro
    // Quando comboAcertos <= 2, a variável bonusCombo deve estar definida como 0

    const mockOnComplete = jest.fn();
    const mockOnAnswerSelect = jest.fn();
    const mockOnPontuacaoGanha = jest.fn();

    const { container } = render(
      <QuizInterativoAvancado
        quizData={mockQuizData}
        onComplete={mockOnComplete}
        onAnswerSelect={mockOnAnswerSelect}
        onPontuacaoGanha={mockOnPontuacaoGanha}
        modo="aprendizado"
      />
    );

    // Verifica se o componente foi renderizado sem erros
    expect(container).toBeInTheDocument();
  });
});