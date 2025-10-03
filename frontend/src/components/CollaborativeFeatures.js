// Componente de Recursos Colaborativos para Engajamento Social
import React, { useState, useEffect } from 'react';
import '../styles/CollaborativeFeatures.css';

const CollaborativeFeatures = ({ usuario, onStudyGroupJoin, onChallengeCreate }) => {
  const [activeTab, setActiveTab] = useState('grupos');
  const [studyGroups, setStudyGroups] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newChallenge, setNewChallenge] = useState({
    titulo: '',
    descricao: '',
    materia: '',
    prazo: '',
    tipo: 'individual'
  });

  useEffect(() => {
    // Buscar grupos de estudo
    fetchStudyGroups();

    // Buscar desafios ativos
    fetchChallenges();

    // Buscar ranking
    fetchLeaderboard();
  }, []);

  const fetchStudyGroups = async () => {
    try {
      const response = await fetch('/api/grupos-estudo');
      const data = await response.json();
      setStudyGroups(data.grupos || []);
    } catch (error) {
      console.error('Erro ao buscar grupos:', error);
    }
  };

  const fetchChallenges = async () => {
    try {
      const response = await fetch('/api/desafios');
      const data = await response.json();
      setChallenges(data.desafios || []);
    } catch (error) {
      console.error('Erro ao buscar desafios:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch('/api/gamificacao/ranking?limit=10');
      const data = await response.json();
      setLeaderboard(data.ranking || []);
    } catch (error) {
      console.error('Erro ao buscar ranking:', error);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;

    try {
      const response = await fetch('/api/grupos-estudo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          nome: newGroupName.trim(),
          descricao: 'Grupo de estudo colaborativo',
          materia: 'geral'
        })
      });

      if (response.ok) {
        setNewGroupName('');
        fetchStudyGroups(); // Recarregar grupos
      }
    } catch (error) {
      console.error('Erro ao criar grupo:', error);
    }
  };

  const handleJoinGroup = async (grupoId) => {
    try {
      const response = await fetch(`/api/grupos-estudo/${grupoId}/participar`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok && onStudyGroupJoin) {
        onStudyGroupJoin(grupoId);
        fetchStudyGroups();
      }
    } catch (error) {
      console.error('Erro ao entrar no grupo:', error);
    }
  };

  const handleCreateChallenge = async () => {
    if (!newChallenge.titulo.trim()) return;

    try {
      const response = await fetch('/api/desafios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newChallenge)
      });

      if (response.ok) {
        setNewChallenge({
          titulo: '',
          descricao: '',
          materia: '',
          prazo: '',
          tipo: 'individual'
        });
        fetchChallenges();

        if (onChallengeCreate) {
          onChallengeCreate();
        }
      }
    } catch (error) {
      console.error('Erro ao criar desafio:', error);
    }
  };

  return (
    <div className="collaborative-features">
      <div className="features-header">
        <h2>👥 Recursos Colaborativos</h2>
        <p>Estude junto com outros estudantes e melhore seu desempenho!</p>
      </div>

      {/* Abas de Navegação */}
      <div className="feature-tabs">
        <button
          className={`tab-button ${activeTab === 'grupos' ? 'active' : ''}`}
          onClick={() => setActiveTab('grupos')}
        >
          👥 Grupos de Estudo
        </button>
        <button
          className={`tab-button ${activeTab === 'desafios' ? 'active' : ''}`}
          onClick={() => setActiveTab('desafios')}
        >
          ⚔️ Desafios
        </button>
        <button
          className={`tab-button ${activeTab === 'ranking' ? 'active' : ''}`}
          onClick={() => setActiveTab('ranking')}
        >
          🏆 Ranking
        </button>
      </div>

      {/* Conteúdo das Abas */}
      <div className="tab-content">
        {/* Grupos de Estudo */}
        {activeTab === 'grupos' && (
          <div className="study-groups-tab">
            <div className="create-group-section">
              <h3>📚 Criar Novo Grupo</h3>
              <div className="create-group-form">
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="Nome do grupo de estudo..."
                  className="group-name-input"
                />
                <button
                  onClick={handleCreateGroup}
                  disabled={!newGroupName.trim()}
                  className="create-group-button"
                >
                  ➕ Criar Grupo
                </button>
              </div>
            </div>

            <div className="groups-list">
              <h3>👥 Grupos Disponíveis</h3>

              {studyGroups.length === 0 ? (
                <div className="empty-state">
                  <p>📭 Nenhum grupo disponível</p>
                  <p>Crie o primeiro grupo para começar a estudar em conjunto!</p>
                </div>
              ) : (
                <div className="groups-grid">
                  {studyGroups.map(grupo => (
                    <div key={grupo.id} className="group-card">
                      <div className="group-header">
                        <h4>{grupo.nome}</h4>
                        <span className="group-members">
                          👥 {grupo.membros_count || 0} membros
                        </span>
                      </div>

                      <div className="group-info">
                        <p className="group-description">
                          {grupo.descricao || 'Grupo de estudo colaborativo'}
                        </p>
                        <p className="group-materia">
                          📖 {grupo.materia || 'Matéria geral'}
                        </p>
                      </div>

                      <div className="group-actions">
                        <button
                          onClick={() => handleJoinGroup(grupo.id)}
                          className="join-group-button"
                        >
                          {grupo.usuario_participa ? '✅ Participando' : '➕ Participar'}
                        </button>

                        {grupo.usuario_participa && (
                          <button className="enter-group-button">
                            🚪 Entrar
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Desafios */}
        {activeTab === 'desafios' && (
          <div className="challenges-tab">
            <div className="create-challenge-section">
              <h3>⚔️ Criar Novo Desafio</h3>

              <div className="challenge-form">
                <div className="form-row">
                  <input
                    type="text"
                    value={newChallenge.titulo}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, titulo: e.target.value }))}
                    placeholder="Título do desafio..."
                    className="challenge-input"
                  />

                  <select
                    value={newChallenge.materia}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, materia: e.target.value }))}
                    className="challenge-select"
                  >
                    <option value="">Selecionar matéria</option>
                    <option value="matematica">Matemática</option>
                    <option value="portugues">Português</option>
                    <option value="fisica">Física</option>
                    <option value="quimica">Química</option>
                    <option value="biologia">Biologia</option>
                    <option value="historia">História</option>
                    <option value="geografia">Geografia</option>
                  </select>
                </div>

                <textarea
                  value={newChallenge.descricao}
                  onChange={(e) => setNewChallenge(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Descrição do desafio..."
                  className="challenge-textarea"
                  rows={3}
                />

                <div className="form-row">
                  <select
                    value={newChallenge.tipo}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, tipo: e.target.value }))}
                    className="challenge-select"
                  >
                    <option value="individual">Individual</option>
                    <option value="grupo">Em Grupo</option>
                    <option value="amigos">Com Amigos</option>
                  </select>

                  <input
                    type="date"
                    value={newChallenge.prazo}
                    onChange={(e) => setNewChallenge(prev => ({ ...prev, prazo: e.target.value }))}
                    className="challenge-input"
                  />
                </div>

                <button
                  onClick={handleCreateChallenge}
                  disabled={!newChallenge.titulo.trim()}
                  className="create-challenge-button"
                >
                  🚀 Criar Desafio
                </button>
              </div>
            </div>

            <div className="challenges-list">
              <h3>⚔️ Desafios Ativos</h3>

              {challenges.length === 0 ? (
                <div className="empty-state">
                  <p>🎯 Nenhum desafio ativo</p>
                  <p>Crie um desafio para motivar outros estudantes!</p>
                </div>
              ) : (
                <div className="challenges-grid">
                  {challenges.map(desafio => (
                    <div key={desafio.id} className="challenge-card">
                      <div className="challenge-header">
                        <h4>{desafio.titulo}</h4>
                        <span className={`challenge-status ${desafio.status}`}>
                          {desafio.status === 'ativo' ? '🟢 Ativo' :
                           desafio.status === 'concluido' ? '✅ Concluído' : '⏸️ Pausado'}
                        </span>
                      </div>

                      <div className="challenge-info">
                        <p className="challenge-description">
                          {desafio.descricao}
                        </p>

                        <div className="challenge-details">
                          <span className="challenge-materia">
                            📖 {desafio.materia}
                          </span>
                          <span className="challenge-participants">
                            👥 {desafio.participantes_count || 0} participantes
                          </span>
                          {desafio.prazo && (
                            <span className="challenge-deadline">
                              ⏰ Até {new Date(desafio.prazo).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="challenge-actions">
                        <button className="participate-button">
                          {desafio.usuario_participa ? '✅ Participando' : '🎯 Participar'}
                        </button>

                        <button className="view-details-button">
                          👁️ Ver Detalhes
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Ranking */}
        {activeTab === 'ranking' && (
          <div className="leaderboard-tab">
            <div className="leaderboard-header">
              <h3>🏆 Ranking Global</h3>
              <div className="leaderboard-filters">
                <select className="ranking-filter">
                  <option value="global">🌍 Global</option>
                  <option value="materia">📚 Por Matéria</option>
                  <option value="semanal">📅 Esta Semana</option>
                  <option value="mensal">📆 Este Mês</option>
                </select>
              </div>
            </div>

            {leaderboard.length === 0 ? (
              <div className="empty-state">
                <p>📊 Nenhum dado de ranking disponível</p>
                <p>Complete simulados para aparecer no ranking!</p>
              </div>
            ) : (
              <div className="leaderboard-list">
                {leaderboard.map((user, index) => (
                  <div key={user.usuario_id} className={`leaderboard-item ${index < 3 ? 'top-three' : ''}`}>
                    <div className="rank-position">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>

                    <div className="user-info">
                      <div className="user-avatar">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.nome} />
                        ) : (
                          <span>{user.nome.charAt(0).toUpperCase()}</span>
                        )}
                      </div>

                      <div className="user-details">
                        <h4>{user.nome}</h4>
                        <p className="user-level">Nível {user.nivel}</p>
                      </div>
                    </div>

                    <div className="user-stats">
                      <div className="user-points">
                        <span className="points-value">{user.pontos.toLocaleString()}</span>
                        <span className="points-label">pontos</span>
                      </div>
                    </div>

                    {index < 3 && (
                      <div className="top-badge">
                        {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Estatísticas do Usuário */}
            <div className="user-stats-card">
              <h4>📊 Suas Estatísticas</h4>
              <div className="stats-comparison">
                <div className="stat-item">
                  <span className="stat-label">Sua Posição:</span>
                  <span className="stat-value">#156</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Seus Pontos:</span>
                  <span className="stat-value">15.420</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Para Top 100:</span>
                  <span className="stat-value">+8.500 pontos</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recursos Sociais */}
      <div className="social-features">
        <h3>🚀 Recursos Sociais Disponíveis</h3>

        <div className="social-grid">
          <div className="social-card">
            <div className="social-icon">👥</div>
            <div className="social-content">
              <h4>Grupos de Estudo</h4>
              <p>Estude em conjunto com outros estudantes da mesma matéria</p>
              <div className="social-stats">
                <span>📊 {studyGroups.length} grupos ativos</span>
              </div>
            </div>
          </div>

          <div className="social-card">
            <div className="social-icon">⚔️</div>
            <div className="social-content">
              <h4>Desafios</h4>
              <p>Participe de desafios e competições saudáveis</p>
              <div className="social-stats">
                <span>🎯 {challenges.length} desafios ativos</span>
              </div>
            </div>
          </div>

          <div className="social-card">
            <div className="social-icon">🏆</div>
            <div className="social-content">
              <h4>Ranking Global</h4>
              <p>Compare seu desempenho com outros estudantes</p>
              <div className="social-stats">
                <span>👑 {leaderboard.length} estudantes ranqueados</span>
              </div>
            </div>
          </div>

          <div className="social-card">
            <div className="social-icon">🤝</div>
            <div className="social-content">
              <h4>Amizades</h4>
              <p>Conecte-se com outros estudantes e acompanhe o progresso</p>
              <div className="social-stats">
                <span>💬 Sistema de mensagens integrado</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Benefícios da Colaboração */}
      <div className="collaboration-benefits">
        <h3>💡 Benefícios do Estudo Colaborativo</h3>

        <div className="benefits-grid">
          <div className="benefit-item">
            <div className="benefit-icon">📈</div>
            <div className="benefit-content">
              <h4>Melhor Desempenho</h4>
              <p>Estudantes em grupos têm até 30% melhor desempenho</p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon">🎯</div>
            <div className="benefit-content">
              <h4>Motivação Extra</h4>
              <p>A competição saudável motiva a estudar mais</p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon">🤝</div>
            <div className="benefit-content">
              <h4>Aprendizado Social</h4>
              <p>Ensine e aprenda com outros estudantes</p>
            </div>
          </div>

          <div className="benefit-item">
            <div className="benefit-icon">🏆</div>
            <div className="benefit-content">
              <h4>Reconhecimento</h4>
              <p>Apareça no ranking e ganhe reconhecimento</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborativeFeatures;