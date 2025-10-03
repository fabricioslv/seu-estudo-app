// components/ComunicacaoAlunosProfessores.js
import React, { useState, useEffect } from 'react';

const ComunicacaoAlunosProfessores = ({ userId, userType }) => {
  const [mensagens, setMensagens] = useState([]);
  const [novaMensagem, setNovaMensagem] = useState('');
  const [destinatario, setDestinatario] = useState('');
  const [assunto, setAssunto] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('inbox'); // 'inbox', 'sent', 'compose'
  const [contatos, setContatos] = useState([]);

  useEffect(() => {
    const fetchMensagens = async () => {
      try {
        setIsLoading(true);
        
        // Em uma implementação real, esta chamada seria para o backend
        // para obter as mensagens do usuário
        // const response = await fetch(`http://localhost:6001/api/mensagens/${userId}?tipo=${abaAtiva}`);
        
        // Simular dados para demonstração
        const mensagensMock = [
          {
            id: 1,
            remetente: 'Prof. João Silva',
            destinatario: 'Carlos Eduardo',
            assunto: 'Sobre sua apresentação de história',
            conteudo: 'Olá Carlos, gostei muito da sua apresentação sobre a Revolução Francesa. Você poderia me enviar os slides em formato digital para que eu possa compartilhar com os outros alunos?',
            data: '2024-02-15 14:30',
            lida: true,
            tipo: 'recebida'
          },
          {
            id: 2,
            remetente: 'Carlos Eduardo',
            destinatario: 'Prof. João Silva',
            assunto: 'Dúvida sobre trigonometria',
            conteudo: 'Prof. João, estou com dúvida sobre a aplicação da lei dos senos em triângulos obtusângulos. Poderia me esclarecer isso na próxima aula?',
            data: '2024-02-14 09:15',
            lida: true,
            tipo: 'enviada'
          },
          {
            id: 3,
            remetente: 'Secretaria Escolar',
            destinatario: 'Carlos Eduardo',
            assunto: 'Confirmação de matrícula',
            conteudo: 'Carlos, sua matrícula para o próximo semestre foi confirmada com sucesso. As aulas iniciarão no dia 01/03/2024.',
            data: '2024-02-12 16:45',
            lida: false,
            tipo: 'recebida'
          },
          {
            id: 4,
            remetente: 'Coordenação Pedagógica',
            destinatario: 'Carlos Eduardo',
            assunto: 'Convite para olimpíada de matemática',
            conteudo: 'Convidamos você para participar da Olimpíada de Matemática que acontecerá no dia 10/03/2024. Interessado? Responda até o dia 25/02.',
            data: '2024-02-10 11:20',
            lida: true,
            tipo: 'recebida'
          }
        ];
        
        setMensagens(mensagensMock);
        
        // Simular contatos
        const contatosMock = [
          { id: 1, nome: 'Prof. João Silva', tipo: 'professor', disciplina: 'Matemática' },
          { id: 2, nome: 'Prof. Maria Santos', tipo: 'professor', disciplina: 'Português' },
          { id: 3, nome: 'Prof. Pedro Oliveira', tipo: 'professor', disciplina: 'História' },
          { id: 4, nome: 'Secretaria Escolar', tipo: 'administrativo' },
          { id: 5, nome: 'Coordenação Pedagógica', tipo: 'administrativo' }
        ];
        
        setContatos(contatosMock);
      } catch (err) {
        setError('Erro ao carregar mensagens: ' + err.message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMensagens();
  }, [userId, abaAtiva]);

  const handleEnviarMensagem = async (e) => {
    e.preventDefault();
    
    if (!novaMensagem.trim() || !destinatario || !assunto) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    try {
      // Em uma implementação real, esta chamada seria para o backend
      // para enviar a nova mensagem
      // const response = await fetch('http://localhost:6001/api/mensagens/enviar', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     remetenteId: userId,
      //     destinatario,
      //     assunto,
      //     conteudo: novaMensagem
      //   })
      // });
      
      // Simular envio
      const novaMsg = {
        id: mensagens.length + 1,
        remetente: userType === 'aluno' ? 'Você' : 'Prof. Nome',
        destinatario: destinatario,
        assunto: assunto,
        conteudo: novaMensagem,
        data: new Date().toLocaleString(),
        lida: false,
        tipo: 'enviada'
      };
      
      setMensagens([novaMsg, ...mensagens]);
      setNovaMensagem('');
      setDestinatario('');
      setAssunto('');
      setAbaAtiva('sent');
      setError('');
    } catch (err) {
      setError('Erro ao enviar mensagem: ' + err.message);
      console.error(err);
    }
  };

  const handleMarcarComoLida = async (mensagemId) => {
    try {
      // Em uma implementação real, esta chamada seria para o backend
      // para marcar a mensagem como lida
      // await fetch(`http://localhost:6001/api/mensagens/${mensagemId}/ler`, {
      //   method: 'PUT'
      // });
      
      // Simular marcação como lida
      setMensagens(mensagens.map(msg => 
        msg.id === mensagemId ? {...msg, lida: true} : msg
      ));
    } catch (err) {
      console.error('Erro ao marcar mensagem como lida:', err);
    }
  };

  const mensagensFiltradas = mensagens.filter(msg => {
    if (abaAtiva === 'inbox') return msg.tipo === 'recebida';
    if (abaAtiva === 'sent') return msg.tipo === 'enviada';
    return true;
  });

  if (isLoading) {
    return (
      <div className="comunicacao-loading">
        <div className="loading-spinner"></div>
        <p>Carregando mensagens...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="comunicacao-error">
        <p>Erro: {error}</p>
        <button onClick={() => window.location.reload()}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="comunicacao-alunos-professores">
      <div className="comunicacao-header">
        <h2>Comunicação</h2>
        <p>Envie e receba mensagens com professores e coordenação</p>
      </div>

      <div className="comunicacao-abas">
        <button 
          className={`aba ${abaAtiva === 'inbox' ? 'ativa' : ''}`}
          onClick={() => setAbaAtiva('inbox')}
        >
          Caixa de Entrada ({mensagens.filter(m => m.tipo === 'recebida' && !m.lida).length})
        </button>
        <button 
          className={`aba ${abaAtiva === 'sent' ? 'ativa' : ''}`}
          onClick={() => setAbaAtiva('sent')}
        >
          Enviadas
        </button>
        <button 
          className={`aba ${abaAtiva === 'compose' ? 'ativa' : ''}`}
          onClick={() => setAbaAtiva('compose')}
        >
          Nova Mensagem
        </button>
      </div>

      {abaAtiva !== 'compose' && (
        <div className="comunicacao-lista">
          <div className="mensagens-header">
            <div className="coluna-remetente">Remetente</div>
            <div className="coluna-assunto">Assunto</div>
            <div className="coluna-data">Data</div>
            <div className="coluna-status">Status</div>
          </div>
          
          <div className="mensagens-lista">
            {mensagensFiltradas.length === 0 ? (
              <div className="sem-mensagens">
                <p>Nenhuma mensagem encontrada</p>
              </div>
            ) : (
              mensagensFiltradas.map(mensagem => (
                <div 
                  key={mensagem.id} 
                  className={`mensagem-item ${!mensagem.lida ? 'nao-lida' : ''}`}
                  onClick={() => handleMarcarComoLida(mensagem.id)}
                >
                  <div className="coluna-remetente">{mensagem.remetente}</div>
                  <div className="coluna-assunto">
                    <div className="assunto-titulo">{mensagem.assunto}</div>
                    <div className="assunto-preview">{mensagem.conteudo.substring(0, 100)}...</div>
                  </div>
                  <div className="coluna-data">{mensagem.data}</div>
                  <div className="coluna-status">
                    {mensagem.lida ? 'Lida' : 'Não lida'}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {abaAtiva === 'compose' && (
        <div className="comunicacao-compose">
          <form onSubmit={handleEnviarMensagem}>
            <div className="form-grupo">
              <label htmlFor="destinatario">Destinatário:</label>
              <select
                id="destinatario"
                value={destinatario}
                onChange={(e) => setDestinatario(e.target.value)}
                required
              >
                <option value="">Selecione um destinatário</option>
                {contatos.map(contato => (
                  <option key={contato.id} value={contato.nome}>
                    {contato.nome} {contato.disciplina ? `(${contato.disciplina})` : ''}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-grupo">
              <label htmlFor="assunto">Assunto:</label>
              <input
                type="text"
                id="assunto"
                value={assunto}
                onChange={(e) => setAssunto(e.target.value)}
                required
              />
            </div>
            
            <div className="form-grupo">
              <label htmlFor="mensagem">Mensagem:</label>
              <textarea
                id="mensagem"
                value={novaMensagem}
                onChange={(e) => setNovaMensagem(e.target.value)}
                rows="8"
                required
              />
            </div>
            
            <div className="form-botoes">
              <button type="submit" className="btn-enviar">Enviar Mensagem</button>
              <button 
                type="button" 
                className="btn-cancelar"
                onClick={() => setAbaAtiva('inbox')}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="comunicacao-contatos-rapidos">
        <h3>Contatos Rápidos</h3>
        <div className="contatos-grid">
          {contatos.map(contato => (
            <div 
              key={contato.id} 
              className="contato-item"
              onClick={() => {
                setDestinatario(contato.nome);
                setAbaAtiva('compose');
              }}
            >
              <div className="contato-avatar">
                {contato.nome.charAt(0)}
              </div>
              <div className="contato-info">
                <div className="contato-nome">{contato.nome}</div>
                <div className="contato-tipo">
                  {contato.tipo === 'professor' ? 'Professor' : 'Administrativo'}
                </div>
                {contato.disciplina && (
                  <div className="contato-disciplina">{contato.disciplina}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ComunicacaoAlunosProfessores;