// components/DesafiosEntreUsuarios.js
import React, { useState, useEffect } from 'react';

const DesafiosEntreUsuarios = ({ usuarioAtual }) => {
  const [desafios, setDesafios] = useState([]);
  const [amigos, setAmigos] = useState([]);
  const [desafioAtivo, setDesafioAtivo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDesafios = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Em uma implementação real, estas chamadas seriam para o backend
        // Simular dados para demonstração
        const desafiosMock = [
          {
            id: 1,
            desafiante: 'Maria Silva',
            desafiado: usuarioAtual?.nome || 'Você',
            materia: 'Matemática',
            status: 'pendente',
            pontuacao_desafiante: null,
            pontuacao_desafiado: null,
            data_criacao: '2024-01-15T10:30:00Z',
            data_expiracao: '2024-01-16T10:30:00Z',
            quiz: {
              titulo: 'Funções Matemáticas',
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
                  resposta_correta: 'A'
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
                  resposta_correta: 'A'
                }
              ]
            }
          },
          {
            id: 2,
            desafiante: 'Você',
            desafiado: 'João Oliveira',
            materia: 'Português',
            status: 'aceito',
            pontuacao_desafiante: 85,
            pontuacao_desafiado: 72,
            data_criacao: '2024-01-14T14:20:00Z',
            data_expiracao: '2024-01-15T14:20:00Z',
            quiz: {
              titulo: 'Gramática Básica',
              descricao: 'Conceitos fundamentais de gramática',
              perguntas: [
                {
                  id: 1,
                  numero: 1,
                  enunciado: 'Qual é a classe gramatical da palavra "feliz" em "Ele está feliz"?',
                  alternativas: {
                    'A': 'Substantivo',
                    'B': 'Adjetivo',
                    'C': 'Advérbio',
                    'D': 'Verbo'
                  },
                  resposta_correta: 'B'
                }
              ]
            }
          },
          {
            id: 3,
            desafiante: 'Ana Costa',
            desafiado: usuarioAtual?.nome || 'Você',
            materia: 'Ciências Humanas',
            status: 'concluido',
            pontuacao_desafiante: 92,
            pontuacao_desafiado: 88,
            data_criacao: '2024-01-13T09:15:00Z',
            data_expiracao: '2024-01-14T09:15:00Z',
            quiz: {
              titulo: 'História do Brasil',
              descricao: 'Período Colonial',
              perguntas: [
                {
                  id: 1,
                  numero: 1,
                  enunciado: 'Em que ano começou o período colonial do Brasil?',
                  alternativas: {
                    'A': '1500',
                    'B': '1530',
                    'C': '1549',
                    'D': '1600'
                  },
                  resposta_correta: 'A'
                }
              ]
            }
          }
        ];
        
        const amigosMock = [
          { id: 1, nome: 'Maria Silva', online: true, materia_forte: 'Matemática' },
          { id: 2, nome: 'João Oliveira', online: false, materia_forte: 'Português' },
          { id: 3, nome: 'Ana Costa', online: true, materia_forte: 'Ciências Humanas' },
          { id: 4, nome: 'Pedro Santos', online: true, materia_forte: 'Física' },
          { id: 5, nome: 'Juliana Pereira', online: false, materia_forte: 'Química' }
        ];
        
        setDesafios(desafiosMock);
        setAmigos(amigosMock);
      } catch (err) {
        setError('Erro ao carregar desafios: ' + err.message);
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchDesafios();
  }, [usuarioAtual]);

  const handleAceitarDesafio = async (desafioId) => {
    try {
      // Em uma implementação real, esta chamada seria para o backend
      // para aceitar o desafio
      
      // Simular aceitação do desafio
      setDesafios(prev => prev.map(desafio => 
        desafio.id === desafioId 
          ? { ...desafio, status: 'aceito' } 
          : desafio
      ));
      
      alert('Desafio aceito! Prepare-se para responder ao quiz.');
    } catch (err) {
      console.error('Erro ao aceitar desafio:', err);
      alert('Erro ao aceitar desafio. Tente novamente.');
    }
  };

  const handleRecusarDesafio = async (desafioId) => {
    try {
      // Em uma implementação real, esta chamada seria para o backend
      // para recusar o desafio
      
      // Simular recusa do desafio
      setDesafios(prev => prev.filter(desafio => desafio.id !== desafioId));
      
      alert('Desafio recusado.');
    } catch (err) {
      console.error('Erro ao recusar desafio:', err);
      alert('Erro ao recusar desafio. Tente novamente.');
    }
  };

  const handleDesafiarAmigo = async (amigoId) => {
    try {
      // Em uma implementação real, esta chamada seria para o backend
      // para criar um novo desafio
      
      // Simular criação de desafio
      const novoDesafio = {
        id: Date.now(),
        desafiante: usuarioAtual?.nome || 'Você',
        desafiado: amigos.find(a => a.id === amigoId)?.nome,
        materia: 'Matemática', // Matéria padrão para demonstração
        status: 'pendente',
        pontuacao_desafiante: null,
        pontuacao_desafiado: null,
        data_criacao: new Date().toISOString(),
        data_expiracao: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 horas
        quiz: {
          titulo: 'Desafio Personalizado',
          descricao: 'Quiz criado especificamente para este desafio',
          perguntas: []
        }
      };
      
      setDesafios(prev => [...prev, novoDesafio]);
      
      alert(`Desafio enviado para ${novoDesafio.desafiado}!`);
    } catch (err) {
      console.error('Erro ao desafiar amigo:', err);
      alert('Erro ao desafiar amigo. Tente novamente.');
    }
  };

  const handleIniciarDesafio = (desafio) => {
    setDesafioAtivo(desafio);
  };

  const handleConcluirDesafio = (resultado) => {
    // Em uma implementação real, salvar o resultado no backend
    console.log('Desafio concluído:', resultado);
    
    // Atualizar o desafio com os resultados
    setDesafios(prev => prev.map(desafio => 
      desafio.id === desafioAtivo.id 
        ? { 
            ...desafio, 
            status: 'concluido',
            pontuacao_desafiante: desafio.desafiante === (usuarioAtual?.nome || 'Você') ? resultado.pontuacao : desafio.pontuacao_desafiante,
            pontuacao_desafiado: desafio.desafiado === (usuarioAtual?.nome || 'Você') ? resultado.pontuacao : desafio.pontuacao_desafiado
          } 
        : desafio
    ));
    
    setDesafioAtivo(null);
    alert(`Desafio concluído! Sua pontuação: ${resultado.pontuacao}%`);
  };

  if (loading) {
    return (
      <div className="desafios-loading">
        <div className="loading-spinner"></div>
        <p>Carregando desafios...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="desafios-error">
        <p>Erro: {error}</p>
        <button onClick={() => window.location.reload()}>Tentar novamente</button>
      </div>
    );
  }

  if (desafioAtivo) {
    return (
      <div className="desafio-ativo">
        <div className="desafio-header">
          <button 
            className="btn-voltar-desafios"
            onClick={() => setDesafioAtivo(null)}
          >
            ← Voltar para Desafios
          </button>
          <h2>{desafioAtivo.quiz.titulo}</h2>
          <p>{desafioAtivo.quiz.descricao}</p>
        </div>
        
        <div className="desafio-info">
          <div className="desafiante">
            <h3>Desafiante: {desafioAtivo.desafiante}</h3>
          </div>
          <div className="desafiado">
            <h3>Desafiado: {desafioAtivo.desafiado}</h3>
          </div>
          <div className="materia-desafio">
            <h3>Matéria: {desafioAtivo.materia}</h3>
          </div>
        </div>
        
        <div className="quiz-desafio">
          {desafioAtivo.quiz.perguntas.map(pergunta => (
            <div key={pergunta.id} className="pergunta-desafio">
              <h4>{pergunta.numero}. {pergunta.enunciado}</h4>
              
              <div className="alternativas-desafio">
                {Object.entries(pergunta.alternativas).map(([letra, texto]) => (
                  <div key={letra} className="alternativa-desafio">
                    <label>
                      <input 
                        type="radio" 
                        name={`pergunta-${pergunta.id}`} 
                        value={letra} 
                      />
                      <span className="alternativa-letra">{letra})</span>
                      <span className="alternativa-texto">{texto}</span>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          <button 
            className="btn-concluir-desafio"
            onClick={() => handleConcluirDesafio({ pontuacao: 85 })}
          >
            Concluir Desafio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="desafios-entre-usuarios">
      <div className="desafios-header">
        <h2>Desafios Entre Usuários</h2>
        <p>Teste seus conhecimentos em desafios com amigos e colegas</p>
      </div>
      
      <div className="desafios-container">
        <div className="desafios-recebidos">
          <h3>Desafios Recebidos</h3>
          
          {desafios.filter(d => d.desafiado === (usuarioAtual?.nome || 'Você') && d.status === 'pendente').length > 0 ? (
            <div className="lista-desafios">
              {desafios
                .filter(d => d.desafiado === (usuarioAtual?.nome || 'Você') && d.status === 'pendente')
                .map(desafio => (
                  <div key={desafio.id} className="desafio-card pendente">
                    <div className="desafio-info">
                      <h4>{desafio.quiz.titulo}</h4>
                      <p>{desafio.quiz.descricao}</p>
                      <div className="desafio-meta">
                        <span className="desafiante">Desafiante: {desafio.desafiante}</span>
                        <span className="materia">Matéria: {desafio.materia}</span>
                        <span className="tempo">Expira em: {new Date(desafio.data_expiracao).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="desafio-acoes">
                      <button 
                        className="btn-aceitar"
                        onClick={() => handleAceitarDesafio(desafio.id)}
                      >
                        Aceitar
                      </button>
                      <button 
                        className="btn-recusar"
                        onClick={() => handleRecusarDesafio(desafio.id)}
                      >
                        Recusar
                      </button>
                    </div>
                  </div>
                ))
              }
            </div>
          ) : (
            <div className="sem-desafios">
              <p>Nenhum desafio recebido no momento.</p>
            </div>
          )}
        </div>
        
        <div className="desafios-enviados">
          <h3>Desafios Enviados</h3>
          
          {desafios.filter(d => d.desafiante === (usuarioAtual?.nome || 'Você')).length > 0 ? (
            <div className="lista-desafios">
              {desafios
                .filter(d => d.desafiante === (usuarioAtual?.nome || 'Você'))
                .map(desafio => (
                  <div key={desafio.id} className={`desafio-card ${desafio.status}`}>
                    <div className="desafio-info">
                      <h4>{desafio.quiz.titulo}</h4>
                      <p>{desafio.quiz.descricao}</p>
                      <div className="desafio-meta">
                        <span className="desafiado">Desafiado: {desafio.desafiado}</span>
                        <span className="materia">Matéria: {desafio.materia}</span>
                        <span className="status">Status: {desafio.status === 'pendente' ? 'Pendente' : desafio.status === 'aceito' ? 'Aceito' : 'Concluído'}</span>
                        
                        {desafio.status === 'concluido' && (
                          <div className="resultados">
                            <span className="pontuacao">Sua pontuação: {desafio.pontuacao_desafiante}%</span>
                            <span className="pontuacao">Pontuação do desafiado: {desafio.pontuacao_desafiado}%</span>
                            
                            {desafio.pontuacao_desafiante > desafio.pontuacao_desafiado ? (
                              <span className="resultado-vitoria">🎉 Você venceu!</span>
                            ) : desafio.pontuacao_desafiante < desafio.pontuacao_desafiado ? (
                              <span className="resultado-derrota">😔 Você perdeu</span>
                            ) : (
                              <span className="resultado-empate">🤝 Empate</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          ) : (
            <div className="sem-desafios">
              <p>Nenhum desafio enviado ainda.</p>
            </div>
          )}
        </div>
        
        <div className="desafiar-amigos">
          <h3>Desafiar Amigos</h3>
          
          <div className="lista-amigos">
            {amigos.length > 0 ? (
              amigos.map(amigo => (
                <div key={amigo.id} className={`amigo-card ${amigo.online ? 'online' : 'offline'}`}>
                  <div className="amigo-info">
                    <h4>{amigo.nome}</h4>
                    <p>Matéria forte: {amigo.materia_forte}</p>
                    <div className={`status-amigo ${amigo.online ? 'online' : 'offline'}`}>
                      {amigo.online ? 'Online' : 'Offline'}
                    </div>
                  </div>
                  
                  <button 
                    className="btn-desafiar"
                    onClick={() => handleDesafiarAmigo(amigo.id)}
                    disabled={!amigo.online}
                  >
                    Desafiar
                  </button>
                </div>
              ))
            ) : (
              <div className="sem-amigos">
                <p>Nenhum amigo disponível para desafiar.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DesafiosEntreUsuarios;