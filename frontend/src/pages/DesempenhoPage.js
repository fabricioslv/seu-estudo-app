// pages/DesempenhoPage.js
import React, { useState, useEffect } from 'react';
import { Bar, Pie, Line } from 'react-chartjs-2';
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

const DesempenhoPage = () => {
  const [dadosDesempenho, setDadosDesempenho] = useState(null);
  const [periodo, setPeriodo] = useState('7d'); // 7 dias, 30 dias, etc.

  // Simulação de dados de desempenho - em uma aplicação real, viriam de uma API
  useEffect(() => {
    // Simulação de chamada à API para obter dados de desempenho
    const fetchDesempenho = async () => {
      // Em uma implementação real, esta chamada buscaria os dados do backend
      const dadosMock = {
        resumoGeral: {
          totalSimulados: 5,
          totalQuestoes: 200,
          acertos: 145,
          porcentagemAcerto: 72.5,
          materiasMaisAcertadas: [
            { materia: 'Matemática', porcentagem: 85 },
            { materia: 'Linguagens', porcentagem: 78 },
            { materia: 'Ciências Humanas', porcentagem: 70 },
            { materia: 'Ciências da Natureza', porcentagem: 65 }
          ]
        },
        historicoSimulados: [
          { data: '2024-01-15', titulo: 'Simulado Matemática', acertos: 18, total: 25, porcentagem: 72 },
          { data: '2024-01-22', titulo: 'Simulado Linguagens', acertos: 22, total: 25, porcentagem: 88 },
          { data: '2024-01-29', titulo: 'Simulado Ciências Humanas', acertos: 20, total: 25, porcentagem: 80 },
          { data: '2024-02-05', titulo: 'Simulado ENEM Dia 1', acertos: 38, total: 50, porcentagem: 76 },
          { data: '2024-02-12', titulo: 'Simulado Ciências da Natureza', acertos: 17, total: 25, porcentagem: 68 }
        ],
        desempenhoPorMateria: [
          { materia: 'Matemática', acertos: 85, total: 100, porcentagem: 85 },
          { materia: 'Linguagens', acertos: 78, total: 100, porcentagem: 78 },
          { materia: 'Ciências Humanas', acertos: 70, total: 100, porcentagem: 70 },
          { materia: 'Ciências da Natureza', acertos: 65, total: 100, porcentagem: 65 }
        ],
        desempenhoPorDificuldade: [
          { dificuldade: 'Fácil', acertos: 90, total: 100, porcentagem: 90 },
          { dificuldade: 'Médio', acertos: 75, total: 100, porcentagem: 75 },
          { dificuldade: 'Difícil', acertos: 50, total: 100, porcentagem: 50 }
        ]
      };
      
      setDadosDesempenho(dadosMock);
    };

    fetchDesempenho();
  }, [periodo]);

  // Configuração dos gráficos
  const dadosGraficoBarras = {
    labels: dadosDesempenho?.desempenhoPorMateria?.map(item => item.materia) || [],
    datasets: [
      {
        label: '% de Acerto',
        data: dadosDesempenho?.desempenhoPorMateria?.map(item => item.porcentagem) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const dadosGraficoLinhas = {
    labels: dadosDesempenho?.historicoSimulados?.map(item => item.titulo) || [],
    datasets: [
      {
        label: '% de Acerto',
        data: dadosDesempenho?.historicoSimulados?.map(item => item.porcentagem) || [],
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
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

  if (!dadosDesempenho) {
    return <div>Carregando dados de desempenho...</div>;
  }

  return (
    <div className="desempenho-page">
      <h2>Dashboard de Desempenho</h2>
      
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
          <option value="all">Todos os períodos</option>
        </select>
      </div>

      <div className="resumo-geral">
        <div className="card-resumo">
          <h3>Total de Simulados</h3>
          <p className="valor-grande">{dadosDesempenho.resumoGeral.totalSimulados}</p>
        </div>
        <div className="card-resumo">
          <h3>Questões Respondidas</h3>
          <p className="valor-grande">{dadosDesempenho.resumoGeral.totalQuestoes}</p>
        </div>
        <div className="card-resumo">
          <h3>Acertos</h3>
          <p className="valor-grande">{dadosDesempenho.resumoGeral.acertos}</p>
        </div>
        <div className="card-resumo">
          <h3>% de Acerto</h3>
          <p className="valor-grande">{dadosDesempenho.resumoGeral.porcentagemAcerto}%</p>
        </div>
      </div>

      <div className="graficos-container">
        <div className="grafico">
          <h3>Desempenho por Matéria</h3>
          <Bar data={dadosGraficoBarras} options={opcoesGrafico} />
        </div>
        
        <div className="grafico">
          <h3>Histórico de Desempenho</h3>
          <Line data={dadosGraficoLinhas} options={opcoesGrafico} />
        </div>
        
        <div className="grafico">
          <h3>Desempenho por Dificuldade</h3>
          <Pie data={dadosGraficoPizza} options={opcoesGrafico} />
        </div>
      </div>

      <div className="detalhes-materias">
        <h3>Materias Mais Acertadas</h3>
        <div className="lista-materias">
          {dadosDesempenho.resumoGeral.materiasMaisAcertadas.map((materia, index) => (
            <div key={index} className="item-materia">
              <span className="nome-materia">{materia.materia}</span>
              <span className="porcentagem-acerto">{materia.porcentagem}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DesempenhoPage;