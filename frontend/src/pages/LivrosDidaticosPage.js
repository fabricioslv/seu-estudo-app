// pages/LivrosDidaticosPage.js
import React, { useState, useEffect } from 'react';
import ConteudoLivroDidatico from '../components/ConteudoLivroDidatico';

const LivrosDidaticosPage = () => {
  const [livros, setLivros] = useState([]);
  const [conteudoLivro, setConteudoLivro] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState({ materia: '', ano: '', busca: '' });
  const [abaAtiva, setAbaAtiva] = useState('estatisticas'); // 'estatisticas' ou 'conteudo'

  useEffect(() => {
    const fetchLivros = async () => {
      try {
        setIsLoading(true);
        
        // Em uma implementação real, esta chamada seria para o backend
        // para obter os livros processados
        const response = await fetch('http://localhost:6001/api/questoes/estatisticas-livros');
        
        if (response.ok) {
          const data = await response.json();
          setLivros(data.estatisticas || []);
        } else {
          throw new Error('Erro ao carregar estatísticas dos livros');
        }
      } catch (err) {
        setError('Erro ao carregar estatísticas dos livros: ' + err.message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLivros();
  }, []);

  const handleProcessarLivros = async () => {
    try {
      const response = await fetch('http://localhost:6001/api/questoes/processar-livros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ categorizarAutomaticamente: true })
      });

      if (response.ok) {
        alert('Iniciando processamento de livros didáticos. Processo em segundo plano.');
      } else {
        throw new Error('Erro ao iniciar processamento');
      }
    } catch (err) {
      alert('Erro ao iniciar processamento de livros: ' + err.message);
    }
  };

  const handleVisualizarConteudo = async (livroId) => {
    try {
      // Em uma implementação real, buscar o conteúdo do livro específico
      // const response = await fetch(`http://localhost:6001/api/livros/${livroId}/conteudo`);
      // const data = await response.json();
      // setConteudoLivro(data.conteudo);
      // setAbaAtiva('conteudo');
      
      // Simular dados para demonstração
      const conteudoSimulado = [
        {
          tipo: 'titulo',
          texto: 'Funções Matemáticas',
          nivel_confianca: 0.95,
          materia: 'Matemática',
          topico: 'Álgebra',
          competencia: 'Matemática e suas Tecnologias'
        },
        {
          tipo: 'definicao',
          texto: 'Uma função é uma relação entre dois conjuntos que associa a cada elemento do primeiro conjunto exatamente um elemento do segundo conjunto.',
          nivel_confianca: 0.9,
          materia: 'Matemática',
          topico: 'Álgebra',
          competencia: 'Matemática e suas Tecnologias'
        },
        {
          tipo: 'exemplo',
          texto: 'Seja f: ℝ → ℝ definida por f(x) = 2x + 3. Esta é uma função afim.',
          nivel_confianca: 0.85,
          materia: 'Matemática',
          topico: 'Álgebra',
          competencia: 'Matemática e suas Tecnologias'
        },
        {
          tipo: 'exercicio',
          texto: 'Determine o domínio da função f(x) = √(x - 2).',
          nivel_confianca: 0.8,
          materia: 'Matemática',
          topico: 'Álgebra',
          competencia: 'Matemática e suas Tecnologias'
        }
      ];
      
      setConteudoLivro(conteudoSimulado);
      setAbaAtiva('conteudo');
    } catch (err) {
      setError('Erro ao carregar conteúdo do livro: ' + err.message);
    }
  };

  const handleSelecionarElemento = (elemento, acao) => {
    console.log(`Ação: ${acao}`, elemento);
    
    // Aqui você pode implementar as ações específicas:
    // - Converter elemento em questão
    // - Criar flashcard
    // - Favoritar elemento
    // etc.
    
    alert(`Ação "${acao}" selecionada para o elemento: ${elemento.texto.substring(0, 50)}...`);
  };

  if (isLoading) {
    return (
      <div className="livros-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando estatísticas dos livros didáticos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="livros-page">
        <div className="error-container">
          <h2>Erro</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="livros-page">
      <div className="livros-header">
        <h1>Processamento Inteligente de Livros</h1>
        <p>Envie seus livros didáticos em PDF e nossa IA extrairá automaticamente questões, conceitos e conteúdo estruturado para otimizar seus estudos</p>
      </div>

      {/* Seção de destaque para processamento com IA */}
      <div className="upload-section">
        <div className="upload-container">
          <h2>🤖 Processamento com Inteligência Artificial</h2>
          <p>Envie seus livros didáticos em formato PDF e nossa IA fará a extração automática de:</p>

          <div className="ai-features">
            <div className="ai-feature">
              <span className="feature-icon">📝</span>
              <div>
                <h3>Questões Automáticas</h3>
                <p>Identificação e extração de exercícios e questões</p>
              </div>
            </div>
            <div className="ai-feature">
              <span className="feature-icon">📚</span>
              <div>
                <h3>Resumos Inteligentes</h3>
                <p>Geração automática de resumos por capítulo</p>
              </div>
            </div>
            <div className="ai-feature">
              <span className="feature-icon">🏷️</span>
              <div>
                <h3>Categorização</h3>
                <p>Classificação por matéria, tópico e nível de dificuldade</p>
              </div>
            </div>
            <div className="ai-feature">
              <span className="feature-icon">✨</span>
              <div>
                <h3>Metadados</h3>
                <p>Extração de conceitos-chave e palavras importantes</p>
              </div>
            </div>
          </div>

          <div className="upload-actions">
            <button className="btn-primary btn-large" onClick={() => document.getElementById('file-upload').click()}>
              📁 Enviar Livro Didático
            </button>
            <input
              id="file-upload"
              type="file"
              accept=".pdf"
              style={{ display: 'none' }}
              onChange={(e) => console.log('Arquivo selecionado:', e.target.files[0])}
            />
            <p className="upload-hint">Formatos aceitos: PDF | Tamanho máximo: 50MB</p>
          </div>
        </div>
      </div>

      <div className="abas-livros">
        <button
          className={`aba ${abaAtiva === 'estatisticas' ? 'ativa' : ''}`}
          onClick={() => setAbaAtiva('estatisticas')}
        >
          Estatísticas
        </button>
        <button
          className={`aba ${abaAtiva === 'conteudo' ? 'ativa' : ''}`}
          onClick={() => setAbaAtiva('conteudo')}
          disabled={!conteudoLivro}
        >
          Conteúdo do Livro
        </button>
      </div>

      {abaAtiva === 'estatisticas' && (
        <>
          <div className="livros-actions">
            <button className="btn-primary" onClick={handleProcessarLivros}>
              Processar Novos Livros
            </button>
            
            <div className="filtros">
              <input
                type="text"
                placeholder="Buscar por título ou autor..."
                value={filtro.busca}
                onChange={(e) => setFiltro({...filtro, busca: e.target.value})}
                className="filtro-input"
              />
              
              <select 
                value={filtro.materia} 
                onChange={(e) => setFiltro({...filtro, materia: e.target.value})}
                className="filtro-select"
              >
                <option value="">Todas as matérias</option>
                <option value="matematica">Matemática</option>
                <option value="portugues">Português</option>
                <option value="ciencias_natureza">Ciências da Natureza</option>
                <option value="ciencias_humanas">Ciências Humanas</option>
                <option value="ingles">Inglês</option>
              </select>
              
              <select 
                value={filtro.ano} 
                onChange={(e) => setFiltro({...filtro, ano: e.target.value})}
                className="filtro-select"
              >
                <option value="">Todos os anos</option>
                <option value="1_ano">1º Ano</option>
                <option value="2_ano">2º Ano</option>
                <option value="3_ano">3º Ano</option>
              </select>
            </div>
          </div>

          <div className="estatisticas-livros">
            <div className="card estatistica-card">
              <h3>📊 Total de Questões</h3>
              <p className="numero-grande">{livros.totalQuestoesLivros || 0}</p>
            </div>
            
            <div className="card estatistica-card">
              <h3>📚 Livros Processados</h3>
              <p className="numero-grande">{livros.porMateria ? livros.porMateria.length : 0}</p>
            </div>
            
            <div className="card estatistica-card">
              <h3>🎯 Questões Categorizadas</h3>
              <p className="numero-grande">{livros.questoesCategorizadas || 0}</p>
            </div>
          </div>

          <div className="livros-conteudo">
            <h2>Distribuição por Matéria</h2>
            <div className="grafico-barras">
              {livros.porMateria && livros.porMateria.map((item, index) => (
                <div key={index} className="barra-item">
                  <div className="barra-rotulo">{item.materia}</div>
                  <div className="barra-container">
                    <div 
                      className="barra" 
                      style={{ 
                        width: `${(item.quantidade / Math.max(...livros.porMateria.map(i => i.quantidade))) * 100}%`,
                        backgroundColor: `hsl(${index * 60}, 70%, 50%)`
                      }}
                    >
                      <span className="barra-valor">{item.quantidade}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="livros-conteudo">
            <h2>Distribuição por Tipo de Questão</h2>
            <div className="grafico-pizza-container">
              {livros.porTipo && livros.porTipo.map((item, index) => (
                <div key={index} className="pizza-item">
                  <div 
                    className="pizza-segmento"
                    style={{ 
                      backgroundColor: `hsl(${index * 90}, 70%, 50%)`
                    }}
                  ></div>
                  <span>{item.tipo}: {item.quantidade}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="livros-conteudo">
            <h2>Distribuição por Nível de Dificuldade</h2>
            <div className="grafico-dificuldade">
              {livros.porDificuldade && livros.porDificuldade.map((item, index) => (
                <div key={index} className="dificuldade-item">
                  <div className="dificuldade-nivel">Nível {item.nivel_dificuldade}</div>
                  <div className="dificuldade-barra">
                    <div 
                      className="dificuldade-progresso"
                      style={{ 
                        width: `${(item.quantidade / Math.max(...livros.porDificuldade.map(i => i.quantidade))) * 100}%`
                      }}
                    ></div>
                  </div>
                  <div className="dificuldade-quantidade">{item.quantidade}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {abaAtiva === 'conteudo' && conteudoLivro && (
        <ConteudoLivroDidatico 
          conteudo={conteudoLivro}
          onSelecionarElemento={handleSelecionarElemento}
        />
      )}

      {abaAtiva === 'conteudo' && !conteudoLivro && (
        <div className="conteudo-placeholder">
          <h3>Selecione um livro para visualizar seu conteúdo</h3>
          <p>Clique em "Visualizar Conteúdo" em um dos livros abaixo para explorar seu conteúdo extraído.</p>
          
          <div className="botoes-conteudo">
            <button className="btn-primary" onClick={() => handleVisualizarConteudo(1)}>
              Visualizar Conteúdo de Demonstração
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LivrosDidaticosPage;