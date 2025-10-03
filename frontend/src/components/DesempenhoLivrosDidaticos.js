// components/DesempenhoLivrosDidaticos.js
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

const DesempenhoLivrosDidaticos = ({ userId }) => {
  const [dadosDesempenho, setDadosDesempenho] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [periodo, setPeriodo] = useState('30d'); // 30 dias, 90 dias, etc.

  useEffect(() => {
    const fetchDesempenho = async () => {
      try {
        setIsLoading(true);
        
        // Em uma implementação real, esta chamada seria para o backend
        // para obter os dados de desempenho do usuário com base nos livros didáticos
        // const response = await fetch(`http://localhost:6001/api/desempenho/livros-didaticos/${userId}?periodo=${periodo}`);
        
        // Simular dados para demonstração
        const dadosMock = {
          resumoGeral: {
            totalConteudos: 150,
            conteudosCompletos: 85,
            conteudosEmAndamento: 45,
            porcentagemConclusao: 56.7,
            tempoMedioEstudo: 45, // minutos por dia
            materiasMaisEstudadas: [
              { materia: 'Matemática', tempo: 1200 }, // minutos
              { materia: 'Português', tempo: 950 },
              { materia: 'Ciências Humanas', tempo: 800 },
              { materia: 'Ciências da Natureza', tempo: 750 }
            ]
          },
          progressoPorMateria: [
            { materia: 'Matemática', completos: 25, total: 40, porcentagem: 62.5 },
            { materia: 'Português', completos: 20, total: 35, porcentagem: 57.1 },
            { materia: 'Ciências Humanas', completos: 15, total: 30, porcentagem: 50.0 },
            { materia: 'Ciências da Natureza', completos: 18, total: 32, porcentagem: 56.3 },
            { materia: 'Inglês', completos: 7, total: 13, porcentagem: 53.8 }
          ],
          desempenhoPorDificuldade: [
            { dificuldade: 'Fácil', acertos: 78, total: 90, porcentagem: 86.7 },
            { dificuldade: 'Médio', acertos: 65, total: 85, porcentagem: 76.5 },
            { dificuldade: 'Difícil', acertos: 42, total: 65, porcentagem: 64.6 }
          ],
          historicoEstudo: [
            { data: '2024-01-01', tempoEstudo: 35, conteudosCompletos: 3 },
            { data: '2024-01-02', tempoEstudo: 42, conteudosCompletos: 2 },
            { data: '2024-01-03', tempoEstudo: 50, conteudosCompletos: 4 },
            { data: '2024-01-04', tempoEstudo: 38, conteudosCompletos: 3 },
            { data: '2024-01-05', tempoEstudo: 45, conteudosCompletos: 5 },
            { data: '2024-01-06', tempoEstudo: 55, conteudosCompletos: 4 },
            { data: '2024-01-07', tempoEstudo: 60, conteudosCompletos: 6 }
          ]
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
  }, [userId, periodo]);

  // Configuração dos gráficos
  const dadosGraficoBarras = {
    labels: dadosDesempenho?.progressoPorMateria?.map(item => item.materia) || [],
    datasets: [
      {
        label: '% de Conteúdos Completos',
        data: dadosDesempenho?.progressoPorMateria?.map(item => item.porcentagem) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const dadosGraficoLinhas = {
    labels: dadosDesempenho?.historicoEstudo?.map(item => item.data) || [],
    datasets: [
      {
        label: 'Tempo de Estudo (minutos)',
        data: dadosDesempenho?.historicoEstudo?.map(item => item.tempoEstudo) || [],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
      {
        label: 'Conteúdos Completos',
        data: dadosDesempenho?.historicoEstudo?.map(item => item.conteudosCompletos) || [],
        fill: false,
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1,
      }
    ],
  };

  const dadosGraficoPizza = {
    labels: dadosDesempenho?.desempenhoPorDificuldade?.map(item => item.dificuldade) || [],
    datasets: [
      {
        data: dadosDesempenho?.desempenhoPorDificuldade?.map(item => item.porcentagem) || [],
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 205, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 205, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
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
      <div className="desempenho-livros-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dados de desempenho...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="desempenho-livros-error">
        <p>Erro: {error}</p>
        <button onClick={() => window.location.reload()}>Tentar novamente</button>
      </div>
    );
  }

  if (!dadosDesempenho) {
    return <div>Sem dados de desempenho disponíveis</div>;
  }

  return (
    <div className="desempenho-livros-didaticos">
      <div className="desempenho-header">
        <h2>Seu Desempenho nos Livros Didáticos</h2>
        
        <div className="filtro-periodo">
          <label htmlFor="periodo">Período: </label>
          <select 
            id="periodo" 
            value={periodo} 
            onChange={(e) => setPeriodo(e.target.value)}
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="15d">Últimos 15 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="all">Todo o período</option>
          </select>
        </div>
      </div>

      <div className="resumo-geral">
        <div className="card-resumo">
          <h3>Conteúdos Processados</h3>
          <p className="valor-grande">{dadosDesempenho.resumoGeral.totalConteudos}</p>
        </div>
        <div className="card-resumo">
          <h3>Conteúdos Completos</h3>
          <p className="valor-grande">{dadosDesempenho.resumoGeral.conteudosCompletos}</p>
        </div>
        <div className="card-resumo">
          <h3>% de Conclusão</h3>
          <p className="valor-grande">{dadosDesempenho.resumoGeral.porcentagemConclusao.toFixed(1)}%</p>
        </div>
        <div className="card-resumo">
          <h3>Tempo Médio/Dia</h3>
          <p className="valor-grande">{dadosDesempenho.resumoGeral.tempoMedioEstudo} min</p>
        </div>
      </div>

      <div className="graficos-container">
        <div className="grafico">
          <h3>Progresso por Matéria</h3>
          <Bar data={dadosGraficoBarras} options={opcoesGrafico} />
        </div>
        
        <div className="grafico">
          <h3>Histórico de Estudo</h3>
          <Line data={dadosGraficoLinhas} options={opcoesGrafico} />
        </div>
        
        <div className="grafico">
          <h3>Desempenho por Dificuldade</h3>
          <Pie data={dadosGraficoPizza} options={opcoesGrafico} />
        </div>
      </div>

      <div className="detalhes-materias">
        <h3>Matérias Mais Estudadas</h3>
        <div className="lista-materias">
          {dadosDesempenho.resumoGeral.materiasMaisEstudadas.map((materia, index) => (
            <div key={index} className="item-materia">
              <span className="nome-materia">{materia.materia}</span>
              <span className="tempo-estudo">{Math.round(materia.tempo / 60)}h {materia.tempo % 60}min</span>
            </div>
          ))}
        </div>
      </div>

      <div className="recomendacoes-desempenho">
        <h3>Recomendações Baseadas no Seu Desempenho</h3>
        <ul>
          <li>Você está indo bem em Matemática! Continue mantendo esse ritmo.</li>
          <li>Considere dedicar mais tempo às Ciências Humanas para melhorar seu desempenho.</li>
          <li>Seu tempo médio de estudo está acima da média. Mantenha essa consistência!</li>
          <li>Tente revisitar conteúdos que você já completou para reforçar o aprendizado.</li>
        </ul>
      </div>
    </div>
  );
};

export default DesempenhoLivrosDidaticos;