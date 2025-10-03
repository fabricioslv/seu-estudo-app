// pages/EstudarPage.js
import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import offlineService from '../services/offlineService';
import syncService from '../services/syncService';

const EstudarPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [conteudo, setConteudo] = useState(null);
  const [respostaUsuario, setRespostaUsuario] = useState('');
  const [mostrarResposta, setMostrarResposta] = useState(false);
  const [conteudos, setConteudos] = useState([]);
  const [indiceConteudo, setIndiceConteudo] = useState(0);
  const [isOnline, setIsOnline] = useState(offlineService.isOnlineMode());
  const [loading, setLoading] = useState(false);
  const [offlineMode, setOfflineMode] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ isSyncing: false, pendingItems: 0 });
  
  // Simular conteúdo didático com diferentes tipos de atividades
  const conteudosExemplo = useMemo(() => [
    {
      id: 1,
      tipo: 'resumo',
      titulo: 'Funções Matemáticas',
      conteudo: 'Uma função é uma relação entre dois conjuntos que associa a cada elemento do primeiro conjunto exatamente um elemento do segundo conjunto. As funções podem ser classificadas em injetora, sobrejetora e bijetora.',
      imagem: null
    },
    {
      id: 2,
      tipo: 'quiz',
      pergunta: 'Qual é a condição para uma função ser injetora?',
      alternativas: [
        { letra: 'A', texto: 'Cada elemento do domínio tem uma imagem diferente' },
        { letra: 'B', texto: 'Todos os elementos do contradomínio são atingidos' },
        { letra: 'C', texto: 'O domínio é igual ao contradomínio' },
        { letra: 'D', texto: 'A função é linear' }
      ],
      respostaCorreta: 'A',
      explicacao: 'Uma função é injetora quando cada elemento do domínio tem uma imagem diferente no contradomínio. Isso significa que se f(a) = f(b), então a = b.'
    },
    {
      id: 3,
      tipo: 'verdadeiro_falso',
      pergunta: 'A função f(x) = x² é injetora?',
      alternativas: [
        { letra: 'A', texto: 'Verdadeiro' },
        { letra: 'B', texto: 'Falso' }
      ],
      respostaCorreta: 'B',
      explicacao: 'A função f(x) = x² não é injetora porque, por exemplo, f(2) = f(-2) = 4, ou seja, elementos diferentes do domínio têm a mesma imagem.'
    },
    {
      id: 4,
      tipo: 'ordenar',
      pergunta: 'Ordene os passos para determinar se uma função é injetora:',
      itens: [
        { id: 1, texto: 'Verifique se f(a) = f(b) implica a = b' },
        { id: 2, texto: 'Assuma f(a) = f(b)' },
        { id: 3, texto: 'Conclua se a função é injetora' },
        { id: 4, texto: 'Considere dois elementos a e b do domínio' }
      ],
      respostaCorreta: [4, 2, 1, 3],
      explicacao: 'O processo para verificar se uma função é injetora segue a ordem: considerar dois elementos do domínio, assumir que suas imagens são iguais, verificar se isso implica que os elementos são iguais, e concluir.'
    }
  ], []);

  useEffect(() => {
    if (!location.state || !location.state.plano) {
      navigate('/aprendendo');
      return;
    }

    // Inicializar conteúdo offline ou online
    initializeConteudo();
  }, [location, navigate]);

  // Listener para mudanças de conexão
  useEffect(() => {
    const handleConnectionChange = (event) => {
      setIsOnline(event.detail.online);
      if (event.detail.online) {
        // Recarregar conteúdo quando voltar online
        initializeConteudo();
      }
    };

    window.addEventListener('connectionChange', handleConnectionChange);
    return () => window.removeEventListener('connectionChange', handleConnectionChange);
  }, []);

  // Atualizar status de sincronização
  useEffect(() => {
    const updateSyncStatus = () => {
      setSyncStatus(syncService.getSyncStatus());
    };

    const interval = setInterval(updateSyncStatus, 5000);
    updateSyncStatus();

    return () => clearInterval(interval);
  }, []);

  // Inicializar conteúdo baseado no modo (online/offline)
  const initializeConteudo = async () => {
    setLoading(true);

    try {
      if (isOnline) {
        // Tentar carregar conteúdo online
        await loadConteudoOnline();
      } else {
        // Carregar conteúdo offline
        await loadConteudoOffline();
      }
    } catch (error) {
      console.error('[EstudarPage] Erro ao inicializar conteúdo:', error);
      // Fallback para conteúdo exemplo
      setConteudos(conteudosExemplo);
      setConteudo(conteudosExemplo[0]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar conteúdo online
  const loadConteudoOnline = async () => {
    try {
      const response = await fetch('/api/conteudo-estudo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${offlineService.getAuthToken()}`
        },
        body: JSON.stringify({
          plano: location.state?.plano,
          userId: offlineService.getCurrentUser()?.id
        })
      });

      if (response.ok) {
        const conteudoOnline = await response.json();
        setConteudos(conteudoOnline);
        setConteudo(conteudoOnline[0]);

        // Armazenar conteúdo para uso offline
        await offlineService.storeQuestoesOffline(conteudoOnline.filter(c => c.tipo === 'quiz'));
      } else {
        throw new Error('Erro ao carregar conteúdo online');
      }
    } catch (error) {
      console.error('[EstudarPage] Erro ao carregar conteúdo online:', error);
      throw error;
    }
  };

  // Carregar conteúdo offline
  const loadConteudoOffline = async () => {
    try {
      // Buscar questões offline
      const questoesOffline = await offlineService.getQuestoesOffline({ limit: 10 });

      if (questoesOffline.length > 0) {
        // Converter questões offline para formato de conteúdo
        const conteudosOffline = questoesOffline.map(questao => ({
          id: questao.id,
          tipo: 'quiz',
          titulo: `Questão ${questao.id}`,
          pergunta: questao.pergunta,
          alternativas: questao.alternativas,
          respostaCorreta: questao.respostaCorreta,
          explicacao: questao.explicacao
        }));

        setConteudos(conteudosOffline);
        setConteudo(conteudosOffline[0]);
        setOfflineMode(true);
      } else {
        // Fallback para conteúdo exemplo se não houver dados offline
        setConteudos(conteudosExemplo);
        setConteudo(conteudosExemplo[0]);
      }
    } catch (error) {
      console.error('[EstudarPage] Erro ao carregar conteúdo offline:', error);
      // Fallback para conteúdo exemplo
      setConteudos(conteudosExemplo);
      setConteudo(conteudosExemplo[0]);
    }
  };

  const handleRespostaChange = (value) => {
    setRespostaUsuario(value);
  };

  const verificarResposta = async () => {
    setMostrarResposta(true);

    // Salvar progresso se estiver offline
    if (!isOnline) {
      await salvarProgressoOffline();
    }
  };

  // Salvar progresso offline
  const salvarProgressoOffline = async () => {
    if (!conteudo) return;

    const progresso = {
      id: `${offlineService.getCurrentUser()?.id}_${conteudo.id}`,
      usuario: offlineService.getCurrentUser()?.id,
      tipo: 'estudo',
      conteudoId: conteudo.id,
      indiceConteudo,
      totalConteudos: conteudos.length,
      data: new Date().toISOString(),
      concluido: indiceConteudo >= conteudos.length - 1
    };

    await offlineService.storeProgressoOffline(progresso);
  };

  const handleAvancar = async () => {
    if (indiceConteudo < conteudos.length - 1) {
      // Salvar progresso atual
      await salvarProgressoOffline();

      setIndiceConteudo(indiceConteudo + 1);
      setConteudo(conteudos[indiceConteudo + 1]);
      setRespostaUsuario('');
      setMostrarResposta(false);
    }
  };

  const handleAnterior = async () => {
    if (indiceConteudo > 0) {
      // Salvar progresso atual
      await salvarProgressoOffline();

      setIndiceConteudo(indiceConteudo - 1);
      setConteudo(conteudos[indiceConteudo - 1]);
      setRespostaUsuario('');
      setMostrarResposta(false);
    }
  };

  const renderConteudo = () => {
    if (!conteudo) return <div>Carregando conteúdo...</div>;
    
    switch (conteudo.tipo) {
      case 'resumo':
        return (
          <div className="conteudo-resumo">
            <h3>{conteudo.titulo}</h3>
            <p>{conteudo.conteudo}</p>
            {conteudo.imagem && <img src={conteudo.imagem} alt={conteudo.titulo} />}
          </div>
        );
      
      case 'quiz':
        return (
          <div className="conteudo-quiz">
            <h3>{conteudo.pergunta}</h3>
            <div className="alternativas">
              {conteudo.alternativas?.map((alt, index) => (
                <label key={index} className={`alternativa ${respostaUsuario === alt.letra ? 'selecionada' : ''}`}>
                  <input
                    type="radio"
                    name="alternativa"
                    value={alt.letra}
                    checked={respostaUsuario === alt.letra}
                    onChange={(e) => handleRespostaChange(e.target.value)}
                  />
                  <span>{alt.letra}) {alt.texto}</span>
                </label>
              ))}
            </div>
            <button 
              className="btn-verificar"
              onClick={verificarResposta}
              disabled={!respostaUsuario}
            >
              Verificar Resposta
            </button>
            {mostrarResposta && (
              <div className={`resposta-correta ${respostaUsuario === conteudo.respostaCorreta ? 'correta' : 'incorreta'}`}>
                <p>Resposta {respostaUsuario === conteudo.respostaCorreta ? 'correta!' : 'incorreta!'}</p>
                <p>Resposta correta: {conteudo.respostaCorreta}) {conteudo.alternativas.find(a => a.letra === conteudo.respostaCorreta)?.texto}</p>
                <p>Explicação: {conteudo.explicacao}</p>
              </div>
            )}
          </div>
        );
      
      case 'verdadeiro_falso':
        return (
          <div className="conteudo-verdadeiro-falso">
            <h3>{conteudo.pergunta}</h3>
            <div className="alternativas">
              {conteudo.alternativas?.map((alt, index) => (
                <label key={index} className={`alternativa ${respostaUsuario === alt.letra ? 'selecionada' : ''}`}>
                  <input
                    type="radio"
                    name="vf-alternativa"
                    value={alt.letra}
                    checked={respostaUsuario === alt.letra}
                    onChange={(e) => handleRespostaChange(e.target.value)}
                  />
                  <span>{alt.texto}</span>
                </label>
              ))}
            </div>
            <button 
              className="btn-verificar"
              onClick={verificarResposta}
              disabled={!respostaUsuario}
            >
              Verificar Resposta
            </button>
            {mostrarResposta && (
              <div className={`resposta-correta ${respostaUsuario === conteudo.respostaCorreta ? 'correta' : 'incorreta'}`}>
                <p>Resposta {respostaUsuario === conteudo.respostaCorreta ? 'correta!' : 'incorreta!'}</p>
                <p>Explicação: {conteudo.explicacao}</p>
              </div>
            )}
          </div>
        );
      
      case 'ordenar':
        return (
          <div className="conteudo-ordenar">
            <h3>{conteudo.pergunta}</h3>
            <div className="itens-ordenar">
              {conteudo.itens?.map((item, index) => (
                <div key={item.id} className="item-ordenar">
                  <span className="numero-item">{index + 1}</span>
                  <span className="texto-item">{item.texto}</span>
                </div>
              ))}
            </div>
            <button 
              className="btn-verificar"
              onClick={verificarResposta}
            >
              Verificar Ordem
            </button>
            {mostrarResposta && (
              <div className="resposta-correta">
                <p>Ordem correta: {conteudo.respostaCorreta.join(', ')}</p>
                <p>Explicação: {conteudo.explicacao}</p>
              </div>
            )}
          </div>
        );
      
      default:
        return <div>Conteúdo não disponível</div>;
    }
  };

  // Indicador de status de conexão
  const renderConnectionStatus = () => {
    if (isOnline) {
      return (
        <div className="connection-status online">
          <span className="status-icon">🌐</span>
          <span>Online</span>
          {syncStatus.pendingItems > 0 && (
            <span className="sync-indicator">
              Sincronizando ({syncStatus.pendingItems})
            </span>
          )}
        </div>
      );
    } else {
      return (
        <div className="connection-status offline">
          <span className="status-icon">📱</span>
          <span>Modo Offline</span>
        </div>
      );
    }
  };

  if (loading) {
    return (
      <div className="estudar-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando conteúdo...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="estudar-page">
      {/* Indicador de status de conexão */}
      <div className="status-bar">
        {renderConnectionStatus()}
        {offlineMode && (
          <div className="offline-notice">
            <span className="notice-icon">💾</span>
            <span>Usando conteúdo salvo offline</span>
          </div>
        )}
      </div>

      <div className="conteudo-estudo">
        {renderConteudo()}
      </div>

      <div className="acoes-estudo">
        <button
          className="btn-anterior"
          onClick={handleAnterior}
          disabled={indiceConteudo === 0}
        >
          Anterior
        </button>
        <button
          className="btn-avancar"
          onClick={handleAvancar}
          disabled={indiceConteudo === conteudos.length - 1}
        >
          Avançar
        </button>
      </div>

      <div className="progresso-estudo">
        <div className="barra-progresso">
          <div
            className="preenchimento"
            style={{ width: `${((indiceConteudo + 1) / conteudos.length) * 100}%` }}
          ></div>
        </div>
        <p>{indiceConteudo + 1} de {conteudos.length} - {Math.round(((indiceConteudo + 1) / conteudos.length) * 100)}% concluído</p>
      </div>
    </div>
  );
};

export default EstudarPage;