// pages/ConteudoEstudoPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ConteudoEstudo from '../components/ConteudoEstudo';

const ConteudoEstudoPage = () => {
  const { conteudoId } = useParams();
  const navigate = useNavigate();
  const [conteudo, setConteudo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchConteudo = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Em uma implementação real, esta chamada seria para o backend
        // para obter o conteúdo específico
        // const response = await fetch(`http://localhost:6001/api/aprendendo/conteudo/${conteudoId}`);
        
        // Simular conteúdo para demonstração
        const conteudoMock = {
          id: conteudoId || 1,
          titulo: 'Funções Matemáticas',
          subtitulo: 'Introdução às funções e seus tipos',
          materia: 'Matemática',
          tempo_estimado: 45,
          nivel_dificuldade: 2, // 1=fácil, 2=médio, 3=difícil
          secoes: [
            {
              id: 1,
              titulo: 'Definição de Função',
              tipo: 'texto',
              conteudo: 'Uma função é uma relação entre dois conjuntos que associa a cada elemento do primeiro conjunto exatamente um elemento do segundo conjunto. Os conjuntos envolvidos são chamados de domínio (conjunto de partida) e contradomínio (conjunto de chegada).'
            },
            {
              id: 2,
              titulo: 'Representação Gráfica',
              tipo: 'imagem',
              url: 'https://via.placeholder.com/600x400/4A90E2/FFFFFF?text=Gráfico+de+Função',
              descricao: 'Exemplo de gráfico de uma função linear'
            },
            {
              id: 3,
              titulo: 'Tipos de Funções',
              tipo: 'texto',
              conteudo: 'Existem vários tipos de funções, incluindo: funções lineares, quadráticas, polinomiais, racionais, exponenciais, logarítmicas, trigonométricas, entre outras. Cada tipo possui características específicas que determinam seu comportamento.'
            },
            {
              id: 4,
              titulo: 'Exemplo Prático',
              tipo: 'exemplo',
              conteudo: 'Considere a função f(x) = 2x + 3. Para x = 1, temos f(1) = 2(1) + 3 = 5. Para x = -2, temos f(-2) = 2(-2) + 3 = -1.',
              solucao: 'A função f(x) = 2x + 3 é uma função linear, onde o coeficiente angular é 2 e o coeficiente linear é 3.'
            }
          ],
          quiz: {
            id: 1,
            titulo: 'Quiz sobre Funções',
            descricao: 'Teste seus conhecimentos sobre funções matemáticas',
            perguntas: [
              {
                id: 1,
                numero: 1,
                enunciado: 'O que é uma função?',
                alternativas: {
                  'A': 'Uma relação entre dois conjuntos que associa cada elemento do primeiro conjunto a exatamente um elemento do segundo conjunto',
                  'B': 'Uma operação matemática complexa',
                  'C': 'Um tipo de equação diferencial',
                  'D': 'Um conjunto de números reais'
                },
                resposta_correta: 'A',
                explicacao: 'Uma função é uma relação especial entre dois conjuntos onde cada elemento do primeiro conjunto (domínio) está associado a exatamente um elemento do segundo conjunto (contradomínio).'
              },
              {
                id: 2,
                numero: 2,
                enunciado: 'Na função f(x) = 3x - 2, qual é o valor de f(4)?',
                alternativas: {
                  'A': '10',
                  'B': '12',
                  'C': '14',
                  'D': '16'
                },
                resposta_correta: 'A',
                explicacao: 'Substituindo x = 4 na função: f(4) = 3(4) - 2 = 12 - 2 = 10.'
              },
              {
                id: 3,
                numero: 3,
                enunciado: 'Qual é o domínio da função f(x) = 1/x?',
                alternativas: {
                  'A': 'Todos os números reais',
                  'B': 'Todos os números reais exceto zero',
                  'C': 'Apenas números positivos',
                  'D': 'Apenas números inteiros'
                },
                resposta_correta: 'B',
                explicacao: 'Como não podemos dividir por zero, o domínio da função f(x) = 1/x é todos os números reais exceto zero (x ≠ 0).'
              }
            ]
          }
        };
        
        setConteudo(conteudoMock);
      } catch (err) {
        setError('Erro ao carregar conteúdo: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchConteudo();
  }, [conteudoId]);

  const handleConcluirConteudo = (conteudoId) => {
    // Em uma implementação real, salvar o progresso no backend
    console.log(`Conteúdo ${conteudoId} concluído`);
    alert(`Parabéns! Você concluiu o conteúdo "${conteudo?.titulo}".`);
    
    // Navegar para o próximo conteúdo ou voltar ao módulo Aprendendo
    navigate('/aprendendo');
  };

  const handleResponderQuiz = (resultado) => {
    // Em uma implementação real, salvar os resultados no backend
    console.log('Quiz respondido:', resultado);
    
    // Atualizar o progresso do usuário
    const porcentagem = resultado.porcentagem;
    
    if (porcentagem >= 70) {
      alert(`Excelente! Você acertou ${porcentagem}% das questões. Continue assim!`);
    } else {
      alert(`Você acertou ${porcentagem}% das questões. Revise o conteúdo e tente novamente.`);
    }
  };

  if (loading) {
    return (
      <div className="conteudo-estudo-loading">
        <div className="loading-spinner"></div>
        <p>Carregando conteúdo de estudo...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="conteudo-estudo-error">
        <h2>Erro</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/aprendendo')}>Voltar para Aprendendo</button>
      </div>
    );
  }

  if (!conteudo) {
    return (
      <div className="conteudo-estudo-nao-encontrado">
        <h2>Conteúdo não encontrado</h2>
        <p>O conteúdo solicitado não foi encontrado.</p>
        <button onClick={() => navigate('/aprendendo')}>Voltar para Aprendendo</button>
      </div>
    );
  }

  return (
    <div className="conteudo-estudo-page">
      <div className="conteudo-estudo-header">
        <button 
          className="btn-voltar"
          onClick={() => navigate('/aprendendo')}
        >
          ← Voltar para Aprendendo
        </button>
        <h1>{conteudo.titulo}</h1>
      </div>
      
      <ConteudoEstudo 
        conteudo={conteudo}
        onConcluirConteudo={handleConcluirConteudo}
        onResponderQuiz={handleResponderQuiz}
      />
    </div>
  );
};

export default ConteudoEstudoPage;