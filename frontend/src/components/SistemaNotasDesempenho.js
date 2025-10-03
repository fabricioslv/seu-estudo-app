// components/SistemaNotasDesempenho.js
import React, { useState, useEffect } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registrar os componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const SistemaNotasDesempenho = ({ userId }) => {
  const [dadosDesempenho, setDadosDesempenho] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState({
    periodo: '30d',
    materia: 'todas',
    tipoAvaliacao: 'todas'
  });

  useEffect(() => {
    const fetchDesempenho = async () => {
      try {
        setIsLoading(true);
        
        // Em uma implementação real, esta chamada seria para o backend
        // para obter os dados de desempenho do usuário
        // const response = await fetch(`http://localhost:6001/api/desempenho/notas/${userId}?periodo=${filtro.periodo}&materia=${filtro.materia}&tipo=${filtro.tipoAvaliacao}`);
        
        // Simular dados para demonstração
        const dadosMock = {
          resumoGeral: {
            mediaGeral: 7.8,
            totalAvaliacoes: 24,
            avaliacoesCompletas: 20,
            avaliacoesPendentes: 4,
            melhorMateria: 'Matemática',
            piorMateria: 'Inglês'
          },
          notasPorMateria: [
            { materia: 'Matemática', nota: 8.5, conceito: 'Bom' },
            { materia: 'Português', nota: 7.2, conceito: 'Regular' },
            { materia: 'Ciências Humanas', nota: 7.9, conceito: 'Bom' },
            { materia: 'Ciências da Natureza', nota: 8.1, conceito: 'Bom' },
            { materia: 'Inglês', nota: 6.5, conceito: 'Regular' }
          ],
          historicoNotas: [
            { data: '2024-01-15', materia: 'Matemática', nota: 9.0, tipo: 'Prova' },
            { data: '2024-01-20', materia: 'Português', nota: 7.5, tipo: 'Trabalho' },
            { data: '2024-01-25', materia: 'Ciências Humanas', nota: 8.2, tipo: 'Prova' },
            { data: '2024-02-01', materia: 'Ciências da Natureza', nota: 8.8, tipo: 'Laboratório' },
            { data: '2024-02-05', materia: 'Inglês', nota: 6.0, tipo: 'Prova' },
            { data: '2024-02-10', materia: 'Matemática', nota: 8.0, tipo: 'Exercício' }
          ],
          distribuicaoConceitos: [
            { conceito: 'Excelente', quantidade: 3, cor: '#4CAF50' },
            { conceito: 'Bom', quantidade: 12, cor: '#2196F3' },
            { conceito: 'Regular', quantidade: 7, cor: '#FFC107' },
            { conceito: 'Insuficiente', quantidade: 2, cor: '#F44336' }
          ],
          comparacaoTurma: {
            minhaNota: 7.8,
            mediaTurma: 7.2,
            posicaoRanking: 15,
            totalAlunos: 32
          }
        };
        
        setDadosDesempenho(dadosMock);
      } catch (err) {
        setError('Erro ao carregar dados de desempenho: ' + err.message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDesempenho();
  }, [userId, filtro]);

  // Configuração dos gráficos
  const dadosGraficoBarras = {
    labels: dadosDesempenho?.notasPorMateria?.map(item => item.materia) || [],
    datasets: [
      {
        label: 'Nota Média por Matéria',
        data: dadosDesempenho?.notasPorMateria?.map(item => item.nota) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const dadosGraficoLinhas = {
    labels: dadosDesempenho?.historicoNotas?.map(item => item.data) || [],
    datasets: [
      {
        label: 'Notas ao Longo do Tempo',
        data: dadosDesempenho?.historicoNotas?.map(item => item.nota) || [],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      }
    ],
  };

  const dadosGraficoPizza = {
    labels: dadosDesempenho?.distribuicaoConceitos?.map(item => item.conceito) || [],
    datasets: [
      {
        data: dadosDesempenho?.distribuicaoConceitos?.map(item => item.quantidade) || [],
        backgroundColor: dadosDesempenho?.distribuicaoConceitos?.map(item => item.cor) || [],
        borderColor: dadosDesempenho?.distribuicaoConceitos?.map(item => item.cor.replace('0.6', '1')) || [],
        borderWidth: 1,
      },
    ],
  };

  const opcoesGrafico = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Desempenho'
      },
    },
  };

  if (isLoading) {
    return (
      <div className="sistema-notas-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dados de desempenho e notas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="sistema-notas-error">
        <p>Erro: {error}</p>
        <button onClick={() => window.location.reload()}>Tentar novamente</button>
      </div>
    );
  }

  if (!dadosDesempenho) {
    return <div>Sem dados de desempenho disponíveis</div>;
  }

  return (
    <div className="sistema-notas-desempenho">
      <div className="sistema-notas-header">
        <h2>Sistema de Notas e Desempenho</h2>
        
        <div className="sistema-notas-filtros">
          <div className="filtro-grupo">
            <label htmlFor="periodo">Período: </label>
            <select 
              id="periodo" 
              value={filtro.periodo} 
              onChange={(e) => setFiltro({...filtro, periodo: e.target.value})}
            >
              <option value="7d">Últimos 7 dias</option>
              <option value="15d">Últimos 15 dias</option>
              <option value="30d">Últimos 30 dias</option>
              <option value="90d">Últimos 90 dias</option>
              <option value="all">Todo o período</option>
            </select>
          </div>
          
          <div className="filtro-grupo">
            <label htmlFor="materia">Matéria: </label>
            <select 
              id="materia" 
              value={filtro.materia} 
              onChange={(e) => setFiltro({...filtro, materia: e.target.value})}
            >
              <option value="todas">Todas as matérias</option>
              <option value="matematica">Matemática</option>
              <option value="portugues">Português</option>
              <option value="ciencias_humanas">Ciências Humanas</option>
              <option value="ciencias_natureza">Ciências da Natureza</option>
              <option value="ingles">Inglês</option>
            </select>
          </div>
          
          <div className="filtro-grupo">
            <label htmlFor="tipo">Tipo de Avaliação: </label>
            <select 
              id="tipo" 
              value={filtro.tipoAvaliacao} 
              onChange={(e) => setFiltro({...filtro, tipoAvaliacao: e.target.value})}
            >
              <option value="todas">Todas</option>
              <option value="prova">Provas</option>
              <option value="trabalho">Trabalhos</option>
              <option value="exercicio">Exercícios</option>
              <option value="laboratorio">Laboratório</option>
            </select>
          </div>
        </div>
      </div>

      <div className="sistema-notas-resumo">
        <div className="card-resumo-notas">
          <h3>Média Geral</h3>
          <p className="nota-destaque">{dadosDesempenho.resumoGeral.mediaGeral.toFixed(1)}</p>
          <div className="nota-indicador">
            <div 
              className="nota-barra" 
              style={{ 
                width: `${(dadosDesempenho.resumoGeral.mediaGeral / 10) * 100}%`,
                backgroundColor: dadosDesempenho.resumoGeral.mediaGeral >= 7 ? '#4CAF50' : '#F44336'
              }}
            ></div>
          </div>
        </div>
        
        <div className="card-resumo-notas">
          <h3>Avaliações Completas</h3>
          <p className="valor-destaque">{dadosDesempenho.resumoGeral.avaliacoesCompletas}/{dadosDesempenho.resumoGeral.totalAvaliacoes}</p>
          <p className="sub-texto">({Math.round((dadosDesempenho.resumoGeral.avaliacoesCompletas / dadosDesempenho.resumoGeral.totalAvaliacoes) * 100)}%)</p>
        </div>
        
        <div className="card-resumo-notas">
          <h3>Melhor Matéria</h3>
          <p className="valor-destaque">{dadosDesempenho.resumoGeral.melhorMateria}</p>
          <p className="sub-texto">Nota média: {dadosDesempenho.notasPorMateria.find(m => m.materia === dadosDesempenho.resumoGeral.melhorMateria)?.nota.toFixed(1)}</p>
        </div>
        
        <div className="card-resumo-notas">
          <h3>Comparação com Turma</h3>
          <p className="valor-destaque">{dadosDesempenho.comparacaoTurma.posicaoRanking}º/{dadosDesempenho.comparacaoTurma.totalAlunos}</p>
          <p className="sub-texto">Média turma: {dadosDesempenho.comparacaoTurma.mediaTurma.toFixed(1)}</p>
        </div>
      </div>

      <div className="sistema-notas-graficos">
        <div className="grafico-card">
          <h3>Notas por Matéria</h3>
          <Bar data={dadosGraficoBarras} options={opcoesGrafico} />
        </div>
        
        <div className="grafico-card">
          <h3>Histórico de Notas</h3>
          <Line data={dadosGraficoLinhas} options={opcoesGrafico} />
        </div>
        
        <div className="grafico-card">
          <h3>Distribuição de Conceitos</h3>
          <Pie data={dadosGraficoPizza} options={opcoesGrafico} />
        </div>
      </div>

      <div className="sistema-notas-detalhes">
        <h3>Detalhes das Avaliações Recentes</h3>
        <div className="tabela-avaliacoes">
          <div className="cabecalho-tabela">
            <div>Data</div>
            <div>Matéria</div>
            <div>Tipo</div>
            <div>Nota</div>
            <div>Conceito</div>
          </div>
          
          {dadosDesempenho.historicoNotas.map((avaliacao, index) => (
            <div key={index} className="linha-avaliacao">
              <div>{avaliacao.data}</div>
              <div>{avaliacao.materia}</div>
              <div>{avaliacao.tipo}</div>
              <div className={`nota-coluna ${avaliacao.nota >= 7 ? 'aprovado' : 'reprovado'}`}>
                {avaliacao.nota.toFixed(1)}
              </div>
              <div className="conceito-coluna">
                {avaliacao.nota >= 9 ? 'Excelente' : 
                 avaliacao.nota >= 7 ? 'Bom' : 
                 avaliacao.nota >= 5 ? 'Regular' : 'Insuficiente'}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="sistema-notas-recomendacoes">
        <h3>Recomendações Baseadas no Seu Desempenho</h3>
        <ul>
          <li>Continue mantendo o bom desempenho em Matemática e Ciências da Natureza</li>
          <li>Dedique mais tempo ao estudo de Inglês para melhorar seu conceito</li>
          <li>Participe mais das atividades práticas de laboratório para reforçar o aprendizado</li>
          <li>Revise regularmente os conteúdos de provas anteriores para identificar padrões</li>
          <li>Procure ajuda extra com o professor de Inglês para superar dificuldades</li>
        </ul>
      </div>
    </div>
  );
};

export default SistemaNotasDesempenho;