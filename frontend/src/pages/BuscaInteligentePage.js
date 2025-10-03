// Página de Busca Inteligente com IA e Embeddings
import React, { useState, useEffect, useRef } from 'react';
import '../styles/BuscaInteligentePage.css';

const BuscaInteligentePage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLivro, setSelectedLivro] = useState('');
  const [livros, setLivros] = useState([]);
  const [chatMode, setChatMode] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [chatQuestion, setChatQuestion] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [aiStats, setAiStats] = useState(null);

  const chatMessagesRef = useRef(null);

  useEffect(() => {
    // Buscar lista de livros disponíveis
    fetchLivros();
    fetchAiStats();
  }, []);

  useEffect(() => {
    // Scroll automático para o final do chat
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const fetchLivros = async () => {
    try {
      const response = await fetch('/api/livros');
      const data = await response.json();
      setLivros(data.livros || []);
    } catch (error) {
      console.error('Erro ao buscar livros:', error);
    }
  };

  const fetchAiStats = async () => {
    try {
      const response = await fetch('/api/livros/ai/stats');
      const data = await response.json();
      setAiStats(data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas da IA:', error);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/livros/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          query: query.trim(),
          livroId: selectedLivro || null,
          topK: 10
        })
      });

      const data = await response.json();

      if (response.ok) {
        setResults(data.results || []);
      } else {
        console.error('Erro na busca:', data.msg);
        setResults([]);
      }
    } catch (error) {
      console.error('Erro na busca semântica:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatSubmit = async (e) => {
    e.preventDefault();
    if (!chatQuestion.trim() || !selectedLivro) return;

    setIsChatLoading(true);

    // Adicionar pergunta do usuário ao histórico
    const userMessage = {
      type: 'user',
      content: chatQuestion,
      timestamp: new Date().toISOString()
    };

    setChatHistory(prev => [...prev, userMessage]);

    try {
      const response = await fetch(`/api/livros/${selectedLivro}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          question: chatQuestion.trim()
        })
      });

      const data = await response.json();

      if (response.ok) {
        // Adicionar resposta da IA ao histórico
        const aiMessage = {
          type: 'ai',
          content: data.resposta,
          contexto: data.contexto_usado,
          timestamp: new Date().toISOString()
        };

        setChatHistory(prev => [...prev, aiMessage]);
      } else {
        console.error('Erro no chat:', data.msg);

        // Adicionar mensagem de erro
        const errorMessage = {
          type: 'error',
          content: 'Desculpe, não consegui responder sua pergunta. Tente novamente.',
          timestamp: new Date().toISOString()
        };

        setChatHistory(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Erro no chat:', error);

      const errorMessage = {
        type: 'error',
        content: 'Erro de conexão. Verifique se o serviço de IA está disponível.',
        timestamp: new Date().toISOString()
      };

      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsChatLoading(false);
      setChatQuestion('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatMode) {
        handleChatSubmit(e);
      } else {
        handleSearch();
      }
    }
  };

  return (
    <div className="busca-inteligente-page">
      <div className="busca-container">
        {/* Header */}
        <div className="busca-header">
          <h1>🔍 Busca Inteligente nos Livros</h1>
          <p>Powered by IA Local + Embeddings Semânticos</p>
        </div>

        {/* Estatísticas da IA */}
        {aiStats && (
          <div className="ai-stats-card">
            <h3>🤖 Status da IA</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-label">Ollama Conectado:</span>
                <span className={`stat-value ${aiStats.ollama.connected ? 'connected' : 'disconnected'}`}>
                  {aiStats.ollama.connected ? '✅ Sim' : '❌ Não'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Embeddings Ativos:</span>
                <span className="stat-value">
                  {aiStats.embeddings.isInitialized ? '✅ Sim' : '❌ Não'}
                </span>
              </div>
              <div className="stat-item">
                <span className="stat-label">Modelo Principal:</span>
                <span className="stat-value">{aiStats.ollama.models?.chat || 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Modos de Busca */}
        <div className="search-modes">
          <button
            className={`mode-button ${!chatMode ? 'active' : ''}`}
            onClick={() => setChatMode(false)}
          >
            🔍 Busca Semântica
          </button>
          <button
            className={`mode-button ${chatMode ? 'active' : ''}`}
            onClick={() => setChatMode(true)}
          >
            💬 Chat com Livro
          </button>
        </div>

        {/* Filtros */}
        <div className="search-filters">
          <div className="filter-group">
            <label htmlFor="livro-select">Filtrar por Livro:</label>
            <select
              id="livro-select"
              value={selectedLivro}
              onChange={(e) => setSelectedLivro(e.target.value)}
              className="livro-select"
            >
              <option value="">Todos os livros</option>
              {livros.map(livro => (
                <option key={livro.id} value={livro.id}>
                  {livro.titulo}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Área de Busca/Chat */}
        {!chatMode ? (
          // Modo de Busca Semântica
          <div className="search-mode">
            <div className="search-input-container">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Digite sua consulta (ex: 'explique funções lineares')..."
                className="search-input"
              />
              <button
                onClick={handleSearch}
                disabled={isLoading || !query.trim()}
                className="search-button"
              >
                {isLoading ? '🔄 Buscando...' : '🔍 Buscar'}
              </button>
            </div>

            {/* Resultados da Busca */}
            <div className="search-results">
              {isLoading && (
                <div className="loading-results">
                  <div className="loading-spinner"></div>
                  <p>Analisando livros com IA...</p>
                </div>
              )}

              {results.length > 0 && (
                <div className="results-container">
                  <h3>📚 Resultados Encontrados ({results.length})</h3>

                  {results.map((result, index) => (
                    <div key={result.id || index} className="result-item">
                      <div className="result-header">
                        <div className="result-meta">
                          <span className="similarity-badge">
                            🔗 {Math.round(result.similaridade * 100)}% relevante
                          </span>
                          {result.livro_info && (
                            <span className="livro-badge">
                              📖 {result.livro_info.titulo}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="result-content">
                        <p>{result.texto}</p>
                      </div>

                      {result.metadados && (
                        <div className="result-metadata">
                          {result.metadados.chapter && (
                            <span>Capítulo: {result.metadados.chapter}</span>
                          )}
                          {result.metadados.page && (
                            <span>Página: {result.metadados.page}</span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {!isLoading && query && results.length === 0 && (
                <div className="no-results">
                  <p>😔 Nenhum resultado encontrado para "{query}"</p>
                  <p>Tente usar termos diferentes ou seja mais específico.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Modo de Chat com Livro
          <div className="chat-mode">
            {!selectedLivro ? (
              <div className="chat-setup">
                <p>👆 Selecione um livro acima para iniciar o chat</p>
              </div>
            ) : (
              <div className="chat-container">
                <div className="chat-messages" ref={chatMessagesRef}>
                  {chatHistory.length === 0 ? (
                    <div className="chat-welcome">
                      <h3>💬 Chat com Livro</h3>
                      <p>Faça perguntas sobre o conteúdo do livro selecionado.</p>
                      <p className="chat-hint">
                        Exemplo: "Explique o conceito de funções lineares de forma simples"
                      </p>
                    </div>
                  ) : (
                    chatHistory.map((message, index) => (
                      <div key={index} className={`chat-message ${message.type}`}>
                        <div className="message-avatar">
                          {message.type === 'user' ? '👤' : message.type === 'ai' ? '🤖' : '⚠️'}
                        </div>
                        <div className="message-content">
                          <div className="message-text">{message.content}</div>
                          <div className="message-time">
                            {new Date(message.timestamp).toLocaleTimeString('pt-BR')}
                          </div>
                          {message.contexto && (
                            <div className="message-context">
                              📚 Baseado em {message.contexto} trechos do livro
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}

                  {isChatLoading && (
                    <div className="chat-message ai loading">
                      <div className="message-avatar">🤖</div>
                      <div className="message-content">
                        <div className="message-text">
                          <div className="typing-indicator">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <form onSubmit={handleChatSubmit} className="chat-input-container">
                  <input
                    type="text"
                    value={chatQuestion}
                    onChange={(e) => setChatQuestion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua pergunta sobre o livro..."
                    className="chat-input"
                    disabled={isChatLoading}
                  />
                  <button
                    type="submit"
                    disabled={isChatLoading || !chatQuestion.trim()}
                    className="chat-send-button"
                  >
                    {isChatLoading ? '⏳' : '📤'}
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {/* Recursos Disponíveis */}
        <div className="features-info">
          <h3>🚀 Recursos Disponíveis</h3>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🧠</div>
              <div className="feature-content">
                <h4>Embeddings Semânticos</h4>
                <p>Busca inteligente que entende o contexto e significado das suas consultas</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <div className="feature-content">
                <h4>Chat com Livros</h4>
                <p>Converse naturalmente com os livros usando inteligência artificial</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📚</div>
              <div className="feature-content">
                <h4>Recomendações Personalizadas</h4>
                <p>Sugestões de livros baseadas no seu desempenho e interesses</p>
              </div>
            </div>

            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <div className="feature-content">
                <h4>Processamento Local</h4>
                <p>Tudo processado localmente com Ollama para máxima privacidade</p>
              </div>
            </div>
          </div>
        </div>

        {/* Como Usar */}
        <div className="how-to-use">
          <h3>📖 Como Usar</h3>
          <div className="steps">
            <div className="step">
              <div className="step-number">1</div>
              <div className="step-content">
                <h4>Escolha o Modo</h4>
                <p>Use a busca semântica para encontrar conceitos específicos ou o chat para conversas naturais</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">2</div>
              <div className="step-content">
                <h4>Selecione um Livro</h4>
                <p>Filtre por livro específico ou pesquise em toda a biblioteca</p>
              </div>
            </div>

            <div className="step">
              <div className="step-number">3</div>
              <div className="step-content">
                <h4>Faça sua Consulta</h4>
                <p>Pergunte de forma natural e obtenha respostas baseadas no conteúdo real dos livros</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BuscaInteligentePage;