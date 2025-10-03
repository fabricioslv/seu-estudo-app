// components/GamificacaoAprendendo.js
import React, { useState, useEffect } from 'react';

const GamificacaoAprendendo = ({ usuarioId }) => {
  const [pontos, setPontos] = useState(0);
  const [nivel, setNivel] = useState(1);
  const [conquistas, setConquistas] = useState([]);
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDadosGamificacao = async () => {
      try {
        setLoading(true);
        
        // Em uma implementação real, esta chamada seria para o backend
        // para obter os dados de gamificação do usuário
        // const response = await fetch(`http://localhost:6001/api/gamificacao/usuario/${usuarioId}`);
        
        // Simular dados para demonstração
        const dadosMock = {
          pontos: 1250,
          nivel: 3,
          proximoNivel: 4,
          pontosParaProximoNivel: 500,
          totalPontosProximoNivel: 1750,
          conquistas: [
            {
              id: 1,
              nome: 'Primeiros Passos',
              descricao: 'Complete seu primeiro quiz',
              desbloqueada: true,
              dataDesbloqueio: '2024-01-15',
              icone: '👣'
            },
            {
              id: 2,
              nome: 'Estudioso',
              descricao: 'Estude por 30 dias consecutivos',
              desbloqueada: true,
              dataDesbloqueio: '2024-02-10',
              icone: '📚'
            },
            {
              id: 3,
              nome: 'Campeão',
              descricao: 'Vença 10 desafios',
              desbloqueada: false,
              icone: '🏆'
            },
            {
              id: 4,
              nome: 'Explorador',
              descricao: 'Explore 5 áreas diferentes de conhecimento',
              desbloqueada: true,
              dataDesbloqueio: '2024-02-20',
              icone: '🧭'
            },
            {
              id: 5,
              nome: 'Mestre',
              descricao: 'Alcance o nível 5',
              desbloqueada: false,
              icone: '🧙‍♂️'
            }
          ],
          ranking: [
            { posicao: 1, nome: 'Carlos Silva', pontos: 2500, nivel: 5 },
            { posicao: 2, nome: 'Maria Oliveira', pontos: 2300, nivel: 4 },
            { posicao: 3, nome: 'Você', pontos: 1250, nivel: 3 },
            { posicao: 4, nome: 'João Santos', pontos: 1100, nivel: 3 },
            { posicao: 5, nome: 'Ana Costa', pontos: 950, nivel: 2 }
          ]
        };
        
        setPontos(dadosMock.pontos);
        setNivel(dadosMock.nivel);
        setConquistas(dadosMock.conquistas);
        setRanking(dadosMock.ranking);
      } catch (err) {
        setError('Erro ao carregar dados de gamificação: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDadosGamificacao();
  }, [usuarioId]);

  const calcularProgressoNivel = () => {
    if (pontos === 0) return 0;
    return Math.min(100, Math.round((pontos / 1750) * 100));
  };

  if (loading) {
    return (
      <div className="gamificacao-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dados de gamificação...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gamificacao-error">
        <p>Erro: {error}</p>
        <button onClick={() => window.location.reload()}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="gamificacao-aprendendo">
      <div className="gamificacao-header">
        <h2>Gamificação</h2>
        <p>Veja seu progresso e conquistas no módulo 'Aprendendo'</p>
      </div>

      <div className="gamificacao-resumo">
        <div className="card-pontos">
          <h3>Seus Pontos</h3>
          <p className="pontos-numero">{pontos}</p>
          <div className="nivel-info">
            <span className="nivel-atual">Nível {nivel}</span>
            <span className="proximo-nivel">Próximo: Nível {nivel + 1}</span>
          </div>
          <div className="progresso-nivel">
            <div 
              className="progresso-barra" 
              style={{ width: `${calcularProgressoNivel()}%` }}
            ></div>
          </div>
          <p className="pontos-restantes">
            {1750 - pontos} pontos para o próximo nível
          </p>
        </div>

        <div className="card-ranking">
          <h3>Seu Posicionamento</h3>
          <div className="posicao-ranking">
            <span className="posicao-numero">#{ranking.find(r => r.nome === 'Você')?.posicao || 3}</span>
            <span className="posicao-texto">no ranking geral</span>
          </div>
          <div className="ranking-comparacao">
            <div className="posicao-acima">
              <span className="posicao-nome">
                {ranking.find((r, i) => i === (ranking.findIndex(r => r.nome === 'Você') - 1))?.nome || 'Ninguém'}
              </span>
              <span className="posicao-pontos">
                {ranking.find((r, i) => i === (ranking.findIndex(r => r.nome === 'Você') - 1))?.pontos || 0} pts
              </span>
            </div>
            <div className="posicao-atual">
              <span className="posicao-nome">Você</span>
              <span className="posicao-pontos">{pontos} pts</span>
            </div>
            <div className="posicao-abaixo">
              <span className="posicao-nome">
                {ranking.find((r, i) => i === (ranking.findIndex(r => r.nome === 'Você') + 1))?.nome || 'Ninguém'}
              </span>
              <span className="posicao-pontos">
                {ranking.find((r, i) => i === (ranking.findIndex(r => r.nome === 'Você') + 1))?.pontos || 0} pts
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="gamificacao-conquistas">
        <h3>Suas Conquistas</h3>
        <div className="conquistas-grid">
          {conquistas.map(conquista => (
            <div 
              key={conquista.id} 
              className={`conquista-card ${conquista.desbloqueada ? 'desbloqueada' : 'bloqueada'}`}
            >
              <div className="conquista-icone">
                {conquista.desbloqueada ? conquista.icone : '🔒'}
              </div>
              <div className="conquista-info">
                <h4>{conquista.nome}</h4>
                <p>{conquista.descricao}</p>
                {conquista.desbloqueada && (
                  <span className="data-desbloqueio">
                    Desbloqueada em {new Date(conquista.dataDesbloqueio).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="gamificacao-ranking">
        <h3>Ranking Geral</h3>
        <div className="ranking-lista">
          {ranking.map((usuario, index) => (
            <div 
              key={index} 
              className={`usuario-ranking ${usuario.nome === 'Você' ? 'usuario-atual' : ''}`}
            >
              <div className="ranking-posicao">
                <span className={`posicao-badge ${index < 3 ? `posicao-${index + 1}` : ''}`}>
                  {usuario.posicao}
                </span>
              </div>
              <div className="ranking-info">
                <h4>{usuario.nome}</h4>
                <div className="ranking-detalhes">
                  <span className="ranking-pontos">{usuario.pontos} pts</span>
                  <span className="ranking-nivel">Nível {usuario.nivel}</span>
                </div>
              </div>
              {usuario.nome === 'Você' && (
                <div className="indicador-usuario-atual">
                  📍 Você está aqui
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="gamificacao-regras">
        <h3>Como Ganhar Pontos</h3>
        <ul>
          <li>✓ Completar um quiz: +50 pontos</li>
          <li>✓ Acertar 100% de um quiz: +100 pontos bônus</li>
          <li>✓ Estudar por 30 minutos consecutivos: +75 pontos</li>
          <li>✓ Completar um plano de estudos: +150 pontos</li>
          <li>✓ Participar de um desafio: +25 pontos</li>
          <li>✓ Vencer um desafio: +100 pontos</li>
          <li>✓ Compartilhar um conteúdo: +20 pontos</li>
          <li>✓ Ajudar outro usuário: +30 pontos</li>
        </ul>
      </div>
    </div>
  );
};

export default GamificacaoAprendendo;