// components/ConteudoLivroDidatico.js
import React, { useState } from 'react';

const ConteudoLivroDidatico = ({ conteudo, onSelecionarElemento }) => {
  const [elementoExpandido, setElementoExpandido] = useState(null);
  const [filtroTipo, setFiltroTipo] = useState('todos');

  const elementosFiltrados = conteudo.filter(elemento => {
    if (filtroTipo === 'todos') return true;
    return elemento.tipo === filtroTipo;
  });

  const tiposElementos = [...new Set(conteudo.map(e => e.tipo))];

  const handleExpandirElemento = (elemento) => {
    setElementoExpandido(elementoExpandido === elemento ? null : elemento);
  };

  const handleConverterParaQuestao = (elemento) => {
    if (onSelecionarElemento) {
      onSelecionarElemento(elemento, 'converter_para_questao');
    }
  };

  const handleCriarFlashcard = (elemento) => {
    if (onSelecionarElemento) {
      onSelecionarElemento(elemento, 'criar_flashcard');
    }
  };

  const getIconePorTipo = (tipo) => {
    const icones = {
      'titulo': '챕',
      'subtitulo': '챕',
      'definicao': '❓',
      'exemplo': '📝',
      'exercicio': '✏️',
      'paragrafo': '📄',
      'box_informacao': 'ℹ️',
      'resumo': '🔍'
    };
    
    return icones[tipo] || '📌';
  };

  const getClassePorTipo = (tipo) => {
    const classes = {
      'titulo': 'elemento-titulo',
      'subtitulo': 'elemento-subtitulo',
      'definicao': 'elemento-definicao',
      'exemplo': 'elemento-exemplo',
      'exercicio': 'elemento-exercicio',
      'paragrafo': 'elemento-paragrafo',
      'box_informacao': 'elemento-box',
      'resumo': 'elemento-resumo'
    };
    
    return classes[tipo] || 'elemento-padrao';
  };

  return (
    <div className="conteudo-livro-didatico">
      <div className="cabecalho-conteudo">
        <h2>Conteúdo do Livro Didático</h2>
        
        <div className="filtros-conteudo">
          <select 
            value={filtroTipo} 
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="filtro-tipo"
          >
            <option value="todos">Todos os tipos</option>
            {tiposElementos.map(tipo => (
              <option key={tipo} value={tipo}>
                {tipo.charAt(0).toUpperCase() + tipo.slice(1).replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="lista-elementos">
        {elementosFiltrados.map((elemento, index) => (
          <div 
            key={index} 
            className={`elemento-conteudo ${getClassePorTipo(elemento.tipo)} ${
              elementoExpandido === elemento ? 'expandido' : ''
            }`}
          >
            <div 
              className="elemento-header"
              onClick={() => handleExpandirElemento(elemento)}
            >
              <span className="elemento-icone">
                {getIconePorTipo(elemento.tipo)}
              </span>
              
              <div className="elemento-info">
                <h3 className="elemento-titulo-texto">
                  {elemento.texto ? elemento.texto.substring(0, 100) + '...' : 'Elemento sem título'}
                </h3>
                
                <div className="elemento-meta">
                  <span className="elemento-tipo">
                    {elemento.tipo.replace('_', ' ')}
                  </span>
                  <span className="elemento-confianca">
                    Confiança: {(elemento.nivel_confianca * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
              
              <span className={`expandir-icone ${elementoExpandido === elemento ? 'expandido' : ''}`}>
                ▼
              </span>
            </div>

            {elementoExpandido === elemento && (
              <div className="elemento-detalhes">
                <div className="elemento-conteudo-texto">
                  <p>{elemento.texto || elemento.conteudo}</p>
                </div>
                
                <div className="elemento-acoes">
                  <button 
                    className="btn-acao btn-converter"
                    onClick={() => handleConverterParaQuestao(elemento)}
                  >
                    🔄 Converter em Questão
                  </button>
                  
                  <button 
                    className="btn-acao btn-flashcard"
                    onClick={() => handleCriarFlashcard(elemento)}
                  >
                    🃏 Criar Flashcard
                  </button>
                  
                  <button className="btn-acao btn-favoritar">
                    ⭐ Favoritar
                  </button>
                </div>
                
                <div className="elemento-tags">
                  {elemento.materia && (
                    <span className="tag-materia">{elemento.materia}</span>
                  )}
                  {elemento.topico && (
                    <span className="tag-topico">{elemento.topico}</span>
                  )}
                  {elemento.competencia && (
                    <span className="tag-competencia">{elemento.competencia}</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {elementosFiltrados.length === 0 && (
        <div className="nenhum-elemento">
          <p>Nenhum elemento encontrado com os filtros aplicados.</p>
        </div>
      )}
    </div>
  );
};

export default ConteudoLivroDidatico;