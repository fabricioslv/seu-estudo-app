// services/extractors/livroDidaticoExtractor.js
// Extrator avançado para livros didáticos que extrai todo o conteúdo estruturado

const fs = require('fs');
const path = require('path');
const pdfjsLib = require('pdfjs-dist');

// Configuração para usar a versão de Node.js do pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

class LivroDidaticoExtractor {
  constructor() {
    // Padrões para identificar diferentes elementos do conteúdo
    this.padroesConteudo = {
      titulo: {
        regex: /^(\d+\.|\d+\.\d+|[A-Z][^.!?]*?)(?:\s*[:\-–—]\s*|$)/gm,
        nivel: 'titulo',
      },
      subtitulo: {
        regex: /^(\d+\.\d+\.|\w+\.|\([a-z]\))(?:\s*[:\-–—]\s*|$)/gm,
        nivel: 'subtitulo',
      },
      definicao: {
        regex:
          /(?:defini[çc][ãa]o|significado|o que [ée]|conceito de)[:\s]*([^.!?]+)[.!?]/gi,
        nivel: 'definicao',
      },
      exemplo: {
        regex:
          /(?:exemplo|exemplificando|por exemplo|como ilustra|ver figura)[:\s]*([^.!?]+)[.!?]/gi,
        nivel: 'exemplo',
      },
      exercicio: {
        regex:
          /(?:exerc[ií]cio|atividade|quest[ãa]o|pr[áa]tica)\s*(\d+)[:.\-\s]*/gi,
        nivel: 'exercicio',
      },
      box_informacao: {
        regex:
          /(?:box|destaque|importante|saiba mais|curiosidade)[:\s]*([^.!?]+)[.!?]/gi,
        nivel: 'box_informacao',
      },
      resumo: {
        regex:
          /(?:resumo|s[ií]ntese|conclus[ãa]o|pontos principais)[:\s]*([^.!?]+)[.!?]/gi,
        nivel: 'resumo',
      },
    };

    // Estrutura de tópicos por matéria e ano
    this.estruturaConteudo = {
      matematica: {
        '1_ano': [
          'Conjuntos Numéricos',
          'Operações Básicas',
          'Frações',
          'Decimais',
          'Porcentagem',
        ],
        '2_ano': [
          'Álgebra',
          'Equações',
          'Funções',
          'Geometria Plana',
          'Estatística',
        ],
        '3_ano': [
          'Trigonometria',
          'Geometria Espacial',
          'Logaritmos',
          'Matrizes',
          'Probabilidade',
        ],
      },
      portugues: {
        '1_ano': [
          'Gramática Básica',
          'Classes de Palavras',
          'Ortografia',
          'Acentuação',
          'Pontuação',
        ],
        '2_ano': [
          'Análise Sintática',
          'Figuras de Linguagem',
          'Literatura Brasileira',
          'Redação',
        ],
        '3_ano': [
          'Análise Textual',
          'Teoria Literária',
          'Produção Textual',
          'Linguística',
        ],
      },
      ciencias_natureza: {
        '1_ano': [
          'Método Científico',
          'Matéria e Energia',
          'Ecologia',
          'Células',
          'Genética Básica',
        ],
        '2_ano': [
          'Bioquímica',
          'Fisiologia Humana',
          'Física Básica',
          'Química Orgânica',
        ],
        '3_ano': [
          'Biotecnologia',
          'Física Moderna',
          'Química Analítica',
          'Biologia Molecular',
        ],
      },
      ciencias_humanas: {
        '1_ano': [
          'História Antiga',
          'Geografia Física',
          'Antropologia',
          'Sociologia Básica',
        ],
        '2_ano': [
          'História Medieval',
          'Geografia Humana',
          'Filosofia Clássica',
          'Sociologia Urbana',
        ],
        '3_ano': [
          'História Moderna',
          'Geopolítica',
          'Filosofia Contemporânea',
          'Sociologia Política',
        ],
      },
    };
  }

  /**
   * Extrair todo o conteúdo de um livro didático
   * @param {string} filePath - Caminho do arquivo PDF
   * @param {Object} metadata - Metadados do livro
   * @returns {Promise<Object>} - Conteúdo extraído estruturado
   */
  async extrairConteudo(filePath, metadata = {}) {
    try {
      console.log(`Extraindo conteúdo de: ${path.basename(filePath)}`);

      if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
      }

      // Extrair conteúdo com informações de layout
      const conteudoLayout = await this.extrairComLayout(filePath);

      // Processar e estruturar o conteúdo
      const conteudoEstruturado = await this.estruturarConteudo(
        conteudoLayout,
        metadata

      // Extrair elementos específicos (exercícios, definições, etc.)
      const elementosExtraidos = this.extrairElementos(conteudoEstruturado);

      // Classificar conteúdo por tópicos
      const conteudoClassificado = await this.classificarConteudo(
        conteudoEstruturado,
        metadata

      return {
        metadata: {
          ...metadata,
          filename: path.basename(filePath),
          pages: conteudoLayout.pages.length,
          extractedAt: new Date().toISOString(),
        },
        conteudo: conteudoClassificado,
        elementos: elementosExtraidos,
        estruturaOriginal: conteudoEstruturado,
      };
    } catch (error) {
      console.error(`Erro ao extrair conteúdo do livro ${filePath}:`, error);
      throw error;
    }
  }

  /**
   * Extrair conteúdo mantendo informações de layout
   * @param {string} filePath - Caminho do arquivo PDF
   * @returns {Promise<Object>} - Conteúdo com informações de layout
   */
  async extrairComLayout(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);

      // Carrega o PDF
      const pdf = await pdfjsLib.getDocument({ data: dataBuffer }).promise;

      const extractedData = {
        text: '',
        pages: [],
        metadata: null,
        outlines: [] // Sumário do livro
      };

      // Extrai metadados
      extractedData.metadata = await pdf.getMetadata().catch(() => null);

      // Extrai o sumário (outlines) se disponível
      try {
        extractedData.outlines = await pdf.getOutline();
      } catch (outlineError) {
        console.warn(
          'Não foi possível extrair o sumário:',
          outlineError.message
        );
      }

      // Processa cada página
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);

        // Obtém o conteúdo da página com informações de posição
        const content = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.0 });

        // Extrai o texto e as informações de posição
        let pageText = '';
        const positionedTexts = [];

        for (const item of content.items) {
          if ('str' in item) {
            positionedTexts.push({
              str: item.str,
              x: item.transform[4],
              y: item.transform[5],
              width: item.width,
              height: item.height,
              fontSize: item.height, // Aproximação do tamanho da fonte
              fontFamily: item.fontName || 'unknown',
            });
            pageText += `${item.str  } `;
          }
        }

        // Ordena os textos por posição (esquerda para direita, cima para baixo)
        positionedTexts.sort((a, b) => {
          // Se estiver na mesma linha (com pequena tolerância), ordena por x
          if (Math.abs(a.y - b.y) < 10) {
            return a.x - b.x;
          }
          // Caso contrário, ordena por y (linha superior primeiro)
          return b.y - a.y; // Maior Y vem primeiro (coordenada invertida)
        });

        extractedData.pages.push({
          pageNumber: i,
          text: pageText,
          positionedTexts: positionedTexts,
          viewport: viewport,
        });

        extractedData.text += `${pageText  }\n\n`;
      }

      return extractedData;
    } catch (error) {
      console.error('Erro na extração com layout:', error);
      throw error;
    }
  }

  /**
   * Estruturar o conteúdo extraído
   * @param {Object} conteudoLayout - Conteúdo com informações de layout
   * @param {Object} metadata - Metadados do livro
   * @returns {Array} - Conteúdo estruturado
   */
  async estruturarConteudo(conteudoLayout, metadata) {
    const conteudoEstruturado = [];

    // Processar sumário se disponível
    if (conteudoLayout.outlines && conteudoLayout.outlines.length > 0) {
      console.log('Processando sumário do livro...');
      const sumarioEstruturado = this.processarSumario(conteudoLayout.outlines);
      conteudoEstruturado.push(...sumarioEstruturado);
    }

    // Processar cada página
    for (const page of conteudoLayout.pages) {
      const paginaEstruturada = this.estruturarPagina(page, metadata);
      if (paginaEstruturada && paginaEstruturada.elementos.length > 0) {
        conteudoEstruturado.push(paginaEstruturada);
      }
    }

    return conteudoEstruturado;
  }

  /**
   * Processar o sumário do livro
   * @param {Array} outlines - Sumário do livro
   * @returns {Array} - Sumário estruturado
   */
  processarSumario(outlines) {
    const sumarioEstruturado = [];

    function processarItem(item, nivel = 0) {
      if (item.title) {
        sumarioEstruturado.push({
          tipo: 'sumario_item',
          nivel: nivel,
          titulo: item.title,
          pagina: item.dest ? item.dest[0] : null,
          elementos: [],
        });
      }

      if (item.items && item.items.length > 0) {
        item.items.forEach((subitem) => processarItem(subitem, nivel + 1));
      }
    }

    outlines.forEach((outline) => processarItem(outline));

    return sumarioEstruturado;
  }

  /**
   * Estruturar conteúdo de uma página
   * @param {Object} page - Dados da página
   * @param {Object} metadata - Metadados do livro
   * @returns {Object} - Página estruturada
   */
  estruturarPagina(page, metadata) {
    const elementos = [];

    // Identificar diferentes tipos de elementos na página
    const elementosIdentificados = this.identificarElementos(page.text);

    // Processar textos posicionados para identificar estrutura
    const elementosPosicionados = this.processarElementosPosicionados(
      page.positionedTexts

    // Combinar informações
    elementos.push(...elementosIdentificados);
    elementos.push(...elementosPosicionados);

    return {
      tipo: 'pagina',
      numero: page.pageNumber,
      elementos: elementos,
      metadata: metadata,
    };
  }

  /**
   * Identificar elementos no texto
   * @param {string} text - Texto da página
   * @returns {Array} - Elementos identificados
   */
  identificarElementos(text) {
    const elementos = [];

    // Verificar cada padrão
    for (const [tipo, padrao] of Object.entries(this.padroesConteudo)) {
      const matches = [...text.matchAll(padrao.regex)];

      matches.forEach((match) => {
        elementos.push({
          tipo: tipo,
          conteudo: match[0],
          texto: match[1] || match[0],
          nivel_confianca: 0.8,
          pagina_origem: null, // Será preenchido posteriormente
        });
      });
    }

    return elementos;
  }

  /**
   * Processar elementos posicionados
   * @param {Array} positionedTexts - Textos com informações de posição
   * @returns {Array} - Elementos identificados
   */
  processarElementosPosicionados(positionedTexts) {
    const elementos = [];

    // Agrupar textos em blocos baseados na posição vertical
    const blocos = this.agruparEmBlocos(positionedTexts);

    blocos.forEach((bloco, index) => {
      const textoBloco = bloco
        .map((item) => item.str)
        .join(' ')
        .trim();

      if (textoBloco.length > 20) {
        // Ignorar blocos muito curtos
        // Determinar tipo de elemento baseado no tamanho da fonte e posição
        const tipoElemento = this.determinarTipoElemento(bloco);

        elementos.push({
          tipo: tipoElemento,
          conteudo: textoBloco,
          texto: textoBloco,
          nivel_confianca: 0.7,
          pagina_origem: bloco[0]?.pageNumber,
          caracteristicas: {
            fontSize: this.calcularFontSizeMedia(bloco),
            posicao: {
              x: bloco[0]?.x,
              y: bloco[0]?.y,
            },
            comprimento: textoBloco.length,
          },
        });
      }
    });

    return elementos;
  }

  /**
   * Agrupar textos em blocos baseados na posição vertical
   * @param {Array} positionedTexts - Textos posicionados
   * @returns {Array} - Blocos de texto
   */
  agruparEmBlocos(positionedTexts) {
    const blocos = [];
    let blocoAtual = [];
    let ultimaY = null;

    positionedTexts.forEach((item) => {
      if (ultimaY === null || Math.abs(item.y - ultimaY) < 15) {
        // Mesmo bloco (linha)
        blocoAtual.push(item);
      } else {
        // Novo bloco
        if (blocoAtual.length > 0) {
          blocos.push(blocoAtual);
        }
        blocoAtual = [item];
      }
      ultimaY = item.y;
    });

    // Adicionar último bloco
    if (blocoAtual.length > 0) {
      blocos.push(blocoAtual);
    }

    return blocos;
  }

  /**
   * Determinar tipo de elemento baseado nas características
   * @param {Array} bloco - Bloco de textos
   * @returns {string} - Tipo de elemento
   */
  determinarTipoElemento(bloco) {
    const fontSizeMedia = this.calcularFontSizeMedia(bloco);

    // Determinar tipo baseado no tamanho da fonte
    if (fontSizeMedia > 20) {
      return 'titulo';
    } else if (fontSizeMedia > 16) {
      return 'subtitulo';
    } else if (
      bloco.some(
        (item) =>
          item.str.includes('Exercício') ||
          item.str.includes('exercício') ||
          item.str.includes('Atividade')
      )
    ) {
      return 'exercicio';
    } else if (
      bloco.some(
        (item) => item.str.includes('Exemplo') || item.str.includes('exemplo')
      )
    ) {
      return 'exemplo';
    } else {
      return 'paragrafo';
    }
  }

  /**
   * Calcular média do tamanho da fonte de um bloco
   * @param {Array} bloco - Bloco de textos
   * @returns {number} - Média do tamanho da fonte
   */
  calcularFontSizeMedia(bloco) {
    if (bloco.length === 0) return 12;

    const soma = bloco.reduce((acc, item) => acc + (item.fontSize || 12), 0);
    return soma / bloco.length;
  }

  /**
   * Extrair elementos específicos do conteúdo estruturado
   * @param {Array} conteudoEstruturado - Conteúdo estruturado
   * @returns {Object} - Elementos extraídos
   */
  extrairElementos(conteudoEstruturado) {
    const elementos = {
      exercicios: [],
      definicoes: [],
      exemplos: [],
      titulos: [],
      resumos: [],
      boxes: [],
    };

    // Iterar por todos os elementos do conteúdo estruturado
    conteudoEstruturado.forEach((secao) => {
      if (secao.elementos && Array.isArray(secao.elementos)) {
        secao.elementos.forEach((elemento) => {
          switch (elemento.tipo) {
            case 'exercicio':
              elementos.exercicios.push(elemento);
              break;
            case 'definicao':
              elementos.definicoes.push(elemento);
              break;
            case 'exemplo':
              elementos.exemplos.push(elemento);
              break;
            case 'titulo':
            case 'subtitulo':
              elementos.titulos.push(elemento);
              break;
            case 'resumo':
              elementos.resumos.push(elemento);
              break;
            case 'box_informacao':
              elementos.boxes.push(elemento);
              break;
          }
        });
      }
    });

    return elementos;
  }

  /**
   * Classificar conteúdo por tópicos e estrutura curricular
   * @param {Array} conteudoEstruturado - Conteúdo estruturado
   * @param {Object} metadata - Metadados do livro
   * @returns {Array} - Conteúdo classificado
   */
  async classificarConteudo(conteudoEstruturado, metadata) {
    const conteudoClassificado = [];

    // Determinar matéria e ano com base nos metadados
    const materia = this.determinarMateria(metadata);
    const ano = this.determinarAno(metadata);

    // Obter estrutura esperada para a matéria e ano
    const estruturaEsperada = this.obterEstruturaEsperada(materia, ano);

    // Classificar cada seção do conteúdo
    for (const secao of conteudoEstruturado) {
      const secaoClassificada = await this.classificarSecao(
        secao,
        materia,
        ano,
        estruturaEsperada
      );
      conteudoClassificado.push(secaoClassificada);
    }

    return conteudoClassificado;
  }

  /**
   * Determinar matéria com base nos metadados
   * @param {Object} metadata - Metadados do livro
   * @returns {string} - Matéria determinada
   */
  determinarMateria(metadata) {
    if (metadata.disciplina) {
      return metadata.disciplina.toLowerCase();
    }

    // Inferir matéria do nome do arquivo
    const fileName = metadata.filename || '';
    const fileNameLower = fileName.toLowerCase();

    const materias = {
      matematica: ['matemática', 'matematica', 'math'],
      portugues: ['português', 'portugues', 'língua portuguesa'],
      ciencias_natureza: [
        'ciências da natureza',
        'ciencias da natureza',
        'física',
        'química',
        'biologia',
      ],
      ciencias_humanas: [
        'ciências humanas',
        'ciencias humanas',
        'história',
        'geografia',
        'filosofia',
        'sociologia',
      ],
      ingles: ['inglês', 'ingles', 'english'],
    };

    for (const [materia, palavras] of Object.entries(materias)) {
      for (const palavra of palavras) {
        if (fileNameLower.includes(palavra)) {
          return materia;
        }
      }
    }

    return 'nao_classificada';
  }

  /**
   * Determinar ano com base nos metadados
   * @param {Object} metadata - Metadados do livro
   * @returns {string} - Ano determinado
   */
  determinarAno(metadata) {
    if (metadata.ano) {
      return metadata.ano.toString();
    }

    // Inferir ano do nome do arquivo
    const fileName = metadata.filename || '';
    const anoMatch = fileName.match(/(\d)(?:[_\s]ano|º\s*ano|°\s*ano)/i);

    if (anoMatch) {
      return anoMatch[1];
    }

    // Verificar ano no conteúdo do livro
    if (metadata.text) {
      const anoContentMatch = metadata.text.match(/(?:1|2|3)[º°]?\s*ano/i);
      if (anoContentMatch) {
        return anoContentMatch[0].charAt(0);
      }
    }

    return 'nao_definido';
  }

  /**
   * Obter estrutura esperada para uma matéria e ano
   * @param {string} materia - Matéria
   * @param {string} ano - Ano
   * @returns {Array} - Estrutura esperada
   */
  obterEstruturaEsperada(materia, ano) {
    const chaveMateria = materia.replace(/\s+/g, '_');
    const chaveAno = `${ano}_ano`;

      this.estruturaConteudo[chaveMateria] &&
      this.estruturaConteudo[chaveMateria][chaveAno]
    ) {
      return this.estruturaConteudo[chaveMateria][chaveAno];
    }

    return [];
  }

  /**
   * Classificar uma seção do conteúdo
   * @param {Object} secao - Seção do conteúdo
   * @param {string} materia - Matéria
   * @param {string} ano - Ano
   * @param {Array} estruturaEsperada - Estrutura esperada
   * @returns {Object} - Seção classificada
   */
  async classificarSecao(secao, materia, ano, estruturaEsperada) {
    // Determinar tópico com base no conteúdo da seção
    const topico = this.determinarTopico(secao, estruturaEsperada);

    // Classificar elementos da seção
    const elementosClassificados = await this.classificarElementos(
      secao.elementos,
      topico,
      materia

    return {
      ...secao,
      topico: topico,
      materia: materia,
      ano: ano,
      elementos: elementosClassificados,
      classificacao_confianca: this.calcularConfiancaClassificacao(
        secao,
        topico
      ),
    };
  }

  /**
   * Determinar tópico da seção com base no conteúdo
   * @param {Object} secao - Seção do conteúdo
   * @param {Array} estruturaEsperada - Estrutura esperada
   * @returns {string} - Tópico determinado
   */
  determinarTopico(secao, estruturaEsperada) {
    // Primeiro, tentar determinar do conteúdo dos títulos
    const titulos = secao.elementos.filter(
      (e) => e.tipo === 'titulo' || e.tipo === 'subtitulo'

    if (titulos.length > 0) {
      const tituloPrincipal = titulos[0].texto || titulos[0].conteudo;
      return tituloPrincipal.substring(0, 100); // Limitar tamanho
    }

    // Se houver estrutura esperada, tentar casar com ela
    if (estruturaEsperada.length > 0) {
      // Simplificação: usar primeiro tópico esperado
      return estruturaEsperada[0];
    }

    // Como fallback, usar parte do conteúdo
    const primeirosElementos = secao.elementos.slice(0, 3);
    const textoPreview = primeirosElementos
      .map((e) => e.texto || e.conteudo)
      .join(' ')
      .substring(0, 50);
    return `Tópico: ${textoPreview}...`;
  }

  /**
   * Classificar elementos da seção
   * @param {Array} elementos - Elementos da seção
   * @param {string} topico - Tópico da seção
   * @param {string} materia - Matéria
   * @returns {Array} - Elementos classificados
   */
  async classificarElementos(elementos, topico, materia) {
    const elementosClassificados = [];

    for (const elemento of elementos) {
      // Determinar tipo mais específico
      const tipoEspecifico = this.determinarTipoEspecifico(elemento, materia);

      // Adicionar metadados de classificação
      const elementoClassificado = {
        ...elemento,
        tipo_original: elemento.tipo,
        tipo: tipoEspecifico,
        topico: topico,
        materia: materia,
        classificacao_confianca: this.calcularConfiancaElemento(elemento),
      };

      elementosClassificados.push(elementoClassificado);
    }

    return elementosClassificados;
  }

  /**
   * Determinar tipo mais específico de elemento
   * @param {Object} elemento - Elemento para classificar
   * @param {string} materia - Matéria
   * @returns {string} - Tipo específico
   */
  determinarTipoEspecifico(elemento, materia) {
    const texto = (elemento.texto || elemento.conteudo || '').toLowerCase();

    // Palavras-chave por tipo e matéria
    const palavrasChave = {
      matematica: {
        formula: ['fórmula', 'equação', 'teorema', 'axioma', 'lema'],
        problema: ['problema', 'questão', 'desafio', 'enigma'],
        demonstracao: ['demonstração', 'prova', 'mostre que', 'prove que'],
        aplicacao: ['aplicação', 'uso', 'utilização', 'exemplo prático'],
      },
      portugues: {
        analise_literaria: [
          'análise',
          'interpretação',
          'obra',
          'autor',
          'personagem',
        ],
        gramatica: ['gramática', 'sintaxe', 'morfologia', 'fonologia'],
        redacao: ['redação', 'produção textual', 'escrita', 'composição'],
        figura_linguagem: [
          'metáfora',
          'metonímia',
          'aliteração',
          'onomatopeia',
        ],
      },
      ciencias_natureza: {
        experimento: [
          'experimento',
          'experimentação',
          'procedimento',
          'método científico',
        ],
        teoria: ['teoria', 'hipótese', 'lei', 'princípio'],
        aplicacao_cientifica: [
          'aplicação',
          'uso prático',
          'benefício',
          'importância',
        ],
        fenomeno: ['fenômeno', 'ocorrência', 'manifestação', 'evento natural'],
      },
    };

    // Verificar palavras-chave específicas da matéria
    const materiasPalavras = palavrasChave[materia] || {};

    for (const [tipoEspecifico, keywords] of Object.entries(materiasPalavras)) {
      for (const keyword of keywords) {
        if (texto.includes(keyword)) {
          return tipoEspecifico;
        }
      }
    }

    // Retornar tipo original se não encontrar específico
    return elemento.tipo;
  }

  /**
   * Calcular confiança da classificação da seção
   * @param {Object} secao - Seção
   * @param {string} topico - Tópico
   * @returns {number} - Nível de confiança (0-1)
   */
  calcularConfiancaClassificacao(secao, topico) {
    // Fatores que aumentam a confiança:
    let confianca = 0.5; // Base

    // Presença de títulos
    const temTitulo = secao.elementos.some(
      (e) => e.tipo === 'titulo' || e.tipo === 'subtitulo'
    );
    if (temTitulo) confianca += 0.2;

    // Comprimento adequado do tópico
    if (topico && topico.length > 10 && topico.length < 100) {
      confianca += 0.1;
    }

    // Número de elementos
    const numElementos = secao.elementos.length;
    if (numElementos > 5) {
      confianca += 0.1;
    } else if (numElementos > 0) {
      confianca += 0.05;
    }

    // Limitar entre 0 e 1
    return Math.min(1, Math.max(0, confianca));
  }

  /**
   * Calcular confiança de classificação de elemento
   * @param {Object} elemento - Elemento
   * @returns {number} - Nível de confiança (0-1)
   */
  calcularConfiancaElemento(elemento) {
    let confianca = 0.5; // Base

    // Comprimento do conteúdo
    const comprimento = (elemento.texto || elemento.conteudo || '').length;
    if (comprimento > 100) {
      confianca += 0.2;
    } else if (comprimento > 20) {
      confianca += 0.1;
    }

    // Tipo específico identificado
    if (elemento.tipo !== elemento.tipo_original) {
      confianca += 0.2;
    }

    return Math.min(1, Math.max(0, confianca));
  }

  /**
   * Converter conteúdo estruturado em questões formatadas
   * @param {Array} conteudoClassificado - Conteúdo classificado
   * @param {Object} metadata - Metadados do livro
   * @returns {Array} - Questões convertidas
   */
  converterParaQuestoes(conteudoClassificado, metadata) {
    const questoes = [];

    // Processar exercícios identificados
    conteudoClassificado.forEach((secao) => {
      secao.elementos.forEach((elemento) => {
        if (elemento.tipo === 'exercicio') {
          const questao = this.converterExercicioParaQuestao(
            elemento,
            metadata,
            secao
          );
          if (questao) {
            questoes.push(questao);
          }
        } else if (elemento.tipo === 'exemplo') {
          // Converter exemplos em questões de fixação
          const questaoFixacao = this.converterExemploParaQuestaoFixacao(
            elemento,
            metadata,
            secao
          );
          if (questaoFixacao) {
            questoes.push(questaoFixacao);
          }
        }
      });
    });

    return questoes;
  }

  /**
   * Converter um exercício em questão formatada
   * @param {Object} exercicio - Exercício identificado
   * @param {Object} metadata - Metadados do livro
   * @param {Object} secao - Seção do conteúdo
   * @returns {Object|null} - Questão formatada
   */
  converterExercicioParaQuestao(exercicio, metadata, secao) {
    // Extrair enunciado e alternativas
    const { enunciado, alternativas } = this.extrairEnunciadoEAlternativas(
      exercicio.texto || exercicio.conteudo

    if (!enunciado) {
      return null;
    }

    return {
      numero: this.gerarNumeroUnico(),
      enunciado: enunciado,
      alternativas: alternativas,
      resposta_correta: null, // Sem resposta definida no livro
      materia: secao.materia || metadata.disciplina || 'Não classificada',
      ano_vestibular: metadata.ano || null,
      origem: `Livro: ${metadata.titulo || metadata.filename}`,
      origem_tipo: 'livro_didatico',
      nivel_dificuldade: this.estimarDificuldade(exercicio),
      tipo:
        Object.keys(alternativas).length > 0
          ? 'multipla_escolha'
          : 'dissertativa',
      topico: secao.topico,
      competencia: this.mapearCompetencia(secao.materia),
      habilidade: this.extrairHabilidade(exercicio.texto || exercicio.conteudo),
    };
  }

  /**
   * Converter exemplo em questão de fixação
   * @param {Object} exemplo - Exemplo identificado
   * @param {Object} metadata - Metadados do livro
   * @param {Object} secao - Seção do conteúdo
   * @returns {Object|null} - Questão de fixação
   */
  converterExemploParaQuestaoFixacao(exemplo, metadata, secao) {
    const textoExemplo = exemplo.texto || exemplo.conteudo || '';
    const pergunta = `Com base no exemplo "${textoExemplo.substring(0, 100)}...", como você aplicaria este conceito em uma situação diferente?`;

    return {
      numero: this.gerarNumeroUnico(),
      enunciado: pergunta,
      alternativas: {
        A: 'Aplicação direta do conceito',
        B: 'Variação contextual do exemplo',
        C: 'Generalização do princípio',
        D: 'Análise crítica do exemplo',
        E: 'Criação de nova aplicação',
      },
      resposta_correta: null,
      materia: secao.materia || metadata.disciplina || 'Não classificada',
      ano_vestibular: metadata.ano || null,
      origem: `Exemplo do livro: ${metadata.titulo || metadata.filename}`,
      origem_tipo: 'livro_didatico',
      nivel_dificuldade: 1, // Mais fácil
      tipo: 'fixacao_conceito',
      topico: secao.topico,
      competencia: this.mapearCompetencia(secao.materia),
      habilidade: 'Aplicação de conceitos',
    };
  }

  /**
   * Extrair enunciado e alternativas de um exercício
   * @param {string} texto - Texto do exercício
   * @returns {Object} - Enunciado e alternativas
   */
  extrairEnunciadoEAlternativas(texto) {
    // Separar enunciado das alternativas
    const partes = texto.split(/(?=[A-E][\s.)])/i);

    if (partes.length <= 1) {
      // Não encontrou alternativas, é uma questão dissertativa
      return {
        enunciado: texto.trim(),
        alternativas: {},
      };
    }

    // Primeira parte é o enunciado
    const enunciado = partes[0].trim();

    // Demais partes são as alternativas
    const alternativas = {};

    for (let i = 1; i < partes.length; i++) {
      const parte = partes[i].trim();
      const match = parte.match(/^([A-E])[\s.)]*(.*)/i);

      if (match) {
        const letra = match[1].toUpperCase();
        const conteudo = match[2].trim();
        alternativas[letra] = conteudo;
      }
    }

    return {
      enunciado: enunciado,
      alternativas: alternativas,
    };
  }

  /**
   * Estimar dificuldade de um exercício
   * @param {Object} exercicio - Exercício
   * @returns {number} - Nível de dificuldade (1-3)
   */
  estimarDificuldade(exercicio) {
    const texto = (exercicio.texto || exercicio.conteudo || '').toLowerCase();

    // Palavras indicadoras de dificuldade
    const palavrasDificeis = [
      'demonstrar',
      'provar',
      'analisar criticamente',
      'elaborar',
      'comparar e contrastar',
    ];
    const palavrasMedias = [
      'interpretar',
      'relacionar',
      'inferir',
      'aplicar',
      'resolver',

    // Verificar palavras difíceis
    for (const palavra of palavrasDificeis) {
      if (texto.includes(palavra)) {
        return 3; // Difícil
      }
    }

    // Verificar palavras médias
    for (const palavra of palavrasMedias) {
      if (texto.includes(palavra)) {
        return 2; // Médio
      }
    }

    return 1; // Fácil
  }

  /**
   * Mapear competência com base na matéria
   * @param {string} materia - Matéria
   * @returns {string} - Competência mapeada
   */
  mapearCompetencia(materia) {
    const mapeamento = {
      matematica: 'Matemática e suas Tecnologias',
      portugues: 'Linguagens, Códigos e suas Tecnologias',
      ciencias_natureza: 'Ciências da Natureza e suas Tecnologias',
      ciencias_humanas: 'Ciências Humanas e Sociais Aplicadas',
      ingles: 'Linguagens, Códigos e suas Tecnologias',
    };

    return mapeamento[materia] || 'Não especificada';
  }

  /**
   * Extrair habilidade do texto
   * @param {string} texto - Texto para extrair habilidade
   * @returns {string} - Habilidade identificada
   */
  extrairHabilidade(texto) {
    const textoLower = texto.toLowerCase();

    // Palavras-chave para identificar habilidades
    const habilidades = {
      'interpretação de texto': [
        'interprete',
        'significado',
        'compreenda',
        'entenda',
      ],
      'resolução de problemas': ['resolva', 'determine', 'calcule', 'encontre'],
      'análise crítica': [
        'analise',
        'compare',
        'contraste',
        'avalie',
        'julgue',
      ],
      'aplicação de conceitos': ['aplique', 'utilize', 'use', 'empregue'],
      'produção textual': ['escreva', 'redija', 'produza', 'elabore'],
      'raciocínio lógico': ['deduza', 'conclua', 'infira', 'justifique'],
    };

    // Verificar cada habilidade
    for (const [habilidade, palavras] of Object.entries(habilidades)) {
      for (const palavra of palavras) {
        if (textoLower.includes(palavra)) {
          return habilidade;
        }
      }
    }

    return 'Não especificada';
  }

  /**
   * Gerar número único para identificação
   * @returns {number} - Número único
   */
  gerarNumeroUnico() {
    return Date.now() + Math.floor(Math.random() * 1000);
  }

  /**
   * Processar diretório completo de livros didáticos
   * @param {string} diretorio - Diretório com livros
   * @returns {Promise<Array>} - Resultados do processamento
   */
  async processarDiretorio(diretorio) {
    try {
      if (!fs.existsSync(diretorio)) {
        throw new Error(`Diretório não encontrado: ${diretorio}`);
      }

      const arquivos = fs.readdirSync(diretorio);
      const pdfFiles = arquivos.filter(
        (file) =>
          path.extname(file).toLowerCase() === '.pdf' &&
          !file.toLowerCase().includes('gabarito') &&
          !file.toLowerCase().includes('solucionario')
      );

      console.log(
        `Encontrados ${pdfFiles.length} livros didáticos para processar`

      const resultados = [];

      for (const fileName of pdfFiles) {
        const filePath = path.join(diretorio, fileName);

        try {
          console.log(`\nProcessando: ${fileName}`);

          // Extrair metadados do nome do arquivo
          const metadata = this.extrairMetadadosDoNome(fileName);

          // Extrair conteúdo do livro
          const resultado = await this.extrairConteudo(filePath, metadata);

          resultados.push({
            filename: fileName,
            success: true,
            ...resultado,
          });

          console.log(`✓ Processamento concluído: ${fileName}`);
        } catch (error) {
          console.error(`✗ Erro ao processar ${fileName}:`, error.message);
          resultados.push({
            filename: fileName,
            success: false,
            error: error.message,
          });
        }
      }

      return resultados;
    } catch (error) {
      console.error('Erro ao processar diretório de livros:', error);
      throw error;
    }
  }

  /**
   * Extrair metadados do nome do arquivo
   * @param {string} fileName - Nome do arquivo
   * @returns {Object} - Metadados extraídos
   */
  extrairMetadadosDoNome(fileName) {
    const metadata = {
      filename: fileName,
      titulo: path.basename(fileName, '.pdf'),
    };

    // Tentar extrair ano
    const anoMatch = fileName.match(/(\d)[º°]?\s*ano/i);
    if (anoMatch) {
      metadata.ano = parseInt(anoMatch[1]);
    }

    // Tentar inferir disciplina
    const disciplinas = {
      matematica: ['matemática', 'matematica', 'álgebra', 'geometria'],
      portugues: ['português', 'portugues', 'língua', 'literatura'],
      ciencias_natureza: [
        'ciências',
        'ciencia',
        'física',
        'química',
        'biologia',
      ],
      ciencias_humanas: ['história', 'geografia', 'filosofia', 'sociologia'],
      ingles: ['inglês', 'ingles', 'english'],
    };

    const fileNameLower = fileName.toLowerCase();

    for (const [disciplina, keywords] of Object.entries(disciplinas)) {
      for (const keyword of keywords) {
        if (fileNameLower.includes(keyword)) {
          metadata.disciplina = disciplina;
          break;
        }
      }
      if (metadata.disciplina) break;
    }

    return metadata;
  }
}

// Criar e exportar uma instância do extrator
module.exports = new LivroDidaticoExtractor();
