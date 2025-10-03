// pages/DesafiosPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ChatBox from '../components/chat/ChatBox';

const DesafiosPage = () => {
  const [tipoDesafio, setTipoDesafio] = useState('amigos');
  const [amigos] = useState([
    { id: 1, nome: 'Maria Silva', nivel: 'Matemática Avançado', pontos: 1250 },
    { id: 2, nome: 'João Oliveira', nivel: 'Biologia Intermediário', pontos: 980 },
    { id: 3, nome: 'Ana Costa', nivel: 'Português Básico', pontos: 750 },
    { id: 4, nome: 'Pedro Santos', nivel: 'Física Avançado', pontos: 1420 }
  ]);
  const [desafiosAtivos] = useState([
    { id: 1, adversario: 'Maria Silva', materia: 'Matemática', status: 'Aguardando resposta', tempo: '12h' },
    { id: 2, adversario: 'João Oliveira', materia: 'Biologia', status: 'Em andamento', tempo: '30m' }
  ]);
  const [selectedDesafio, setSelectedDesafio] = useState(null);
  const navigate = useNavigate();

  const materiasDisponiveis = [
    'Português', 'Matemática', 'Física', 'Química', 'Biologia',
    'História', 'Geografia', 'Filosofia', 'Sociologia', 'Inglês'
  ];

  const [filtroMateria, setFiltroMateria] = useState('todas');
  const [nivelDesejado, setNivelDesejado] = useState('todos');

  const desafiarAmigo = (amigoId) => {
    // Simular criação de desafio
    alert(`Desafio enviado para ${amigos.find(a => a.id === amigoId)?.nome}!`);
  };

  const iniciarBatalha = () => {
    // Simular início de batalha em tempo real
    navigate('/aprendendo/batalha');
  };

  const amigosFiltrados = amigos.filter(amigo => {
    if (filtroMateria !== 'todas' && !amigo.nivel.toLowerCase().includes(filtroMateria.toLowerCase())) {
      return false;
    }
    if (nivelDesejado !== 'todos' && !amigo.nivel.toLowerCase().includes(nivelDesejado.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="desafios-page">
      <div className="desafios-header">
        <h1>Desafios</h1>
        <p>Teste seus conhecimentos em desafios com outros estudantes</p>
      </div>
      
      <div className="desafios-tabs">
        <button 
          className={tipoDesafio === 'amigos' ? 'tab-active' : ''}
          onClick={() => setTipoDesafio('amigos')}
        >
          Desafiar Amigos
        </button>
        <button 
          className={tipoDesafio === 'batalha' ? 'tab-active' : ''}
          onClick={() => setTipoDesafio('batalha')}
        >
          Batalha de Conhecimento
        </button>
        <button 
          className={tipoDesafio === 'ativos' ? 'tab-active' : ''}
          onClick={() => setTipoDesafio('ativos')}
        >
          Desafios Ativos
        </button>
      </div>
      
      {tipoDesafio === 'amigos' && (
        <div className="desafiar-amigos">
          <div className="filtro-desafios">
            <select 
              value={filtroMateria} 
              onChange={(e) => setFiltroMateria(e.target.value)}
            >
              <option value="todas">Todas as matérias</option>
              {materiasDisponiveis.map(materia => (
                <option key={materia} value={materia}>{materia}</option>
              ))}
            </select>
            
            <select 
              value={nivelDesejado} 
              onChange={(e) => setNivelDesejado(e.target.value)}
            >
              <option value="todos">Todos os níveis</option>
              <option value="basico">Básico</option>
              <option value="intermediario">Intermediário</option>
              <option value="avancado">Avançado</option>
            </select>
          </div>
          
          <div className="amigos-list">
            {amigosFiltrados.map(amigo => (
              <div key={amigo.id} className="amigo-card">
                <div className="amigo-info">
                  <h4>{amigo.nome}</h4>
                  <p>{amigo.nivel}</p>
                  <p>Pontos: {amigo.pontos}</p>
                </div>
                <button 
                  className="btn-desafiar"
                  onClick={() => desafiarAmigo(amigo.id)}
                >
                  Desafiar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {tipoDesafio === 'batalha' && (
        <div className="batalha-section">
          <h3>Batalha de Conhecimento</h3>
          <p>Enfrente outro estudante em um quiz em tempo real!</p>
          
          <div className="batalha-opcoes">
            <div className="opcao-batalha">
              <h4>Modo Rápido</h4>
              <p>10 perguntas em 5 minutos</p>
              <button 
                className="btn-batalhar"
                onClick={iniciarBatalha}
              >
                Batalhar Agora
              </button>
            </div>
            
            <div className="opcao-batalha">
              <h4>Modo Personalizado</h4>
              <p>Escolha a matéria e quantidade de perguntas</p>
              <select>
                <option value="">Selecione a matéria</option>
                {materiasDisponiveis.map(materia => (
                  <option key={materia} value={materia}>{materia}</option>
                ))}
              </select>
              <input type="number" placeholder="Número de perguntas" min="5" max="30" />
              <button className="btn-batalhar">Iniciar Batalha</button>
            </div>
          </div>
        </div>
      )}
      
      {tipoDesafio === 'ativos' && (
        <div className="desafios-ativos">
          <h3>Seus Desafios Ativos</h3>
          
          {desafiosAtivos.length === 0 ? (
            <p>Você não tem desafios ativos no momento.</p>
          ) : (
            <div className="desafios-list-container">
              <div className="desafios-list">
                {desafiosAtivos.map(desafio => (
                  <div key={desafio.id} className={`desafio-card ${selectedDesafio?.id === desafio.id ? 'selected' : ''}`} onClick={() => setSelectedDesafio(desafio)}>
                    <div className="desafio-info">
                      <h4>Desafio contra {desafio.adversario}</h4>
                      <p>Matéria: {desafio.materia}</p>
                      <p>Status: {desafio.status}</p>
                    </div>
                  </div>
                ))}
              </div>
              {selectedDesafio && (
                <div className="chat-container">
                  <h3>Chat do Desafio: {selectedDesafio.materia}</h3>
                  <ChatBox room={`desafio-${selectedDesafio.id}`} />
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DesafiosPage;