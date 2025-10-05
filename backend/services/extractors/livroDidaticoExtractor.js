// services/extractors/livroDidaticoExtractor.js
// Extrator avançado para livros didáticos que extrai todo o conteúdo estruturado

import fs from 'fs';
import path from 'path';
import pdfjsLib from 'pdfjs-dist';

// Configuração para usar a versão de Node.js do pdfjs-dist
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;

class LivroDidaticoExtractor {
  constructor() {
    // Padrões para identificar diferentes elementos do conteúdo
    this.padroesConteudo = {
      titulo: {
        regex: /^(\\d+\\.|\\d+\\.\\d+|[A-Z][^.!?]*?)(?:\\s*[:\\-–—]\\s*|$)/gm,
        nivel: 'titulo',
      },
      subtitulo: {
        regex: /^(\\d+\\.\\d+\\.|\\w+\\.|\\([a-z]\\))(?:\\s*[:\\-–—]\\s*|$)/gm,
        nivel: 'subtitulo',
      },
      definicao: {
        regex:
          /(?:defini[çc][ãa]o|significado|o que [ée]|conceito de)[:\\s]*([^.!?]+)[.!?]/gi,
        nivel: 'definicao',
      },
      exemplo: {
        regex:
          /(?:exemplo|exemplificando|por exemplo|como ilustra|ver figura)[:\\s]*([^.!?]+)[.!?]/gi,
        nivel: 'exemplo',
      },
      exercicio: {
        regex:
          /(?:exerc[ií]cio|atividade|quest[ãa]o|pr[áa]tica)\\s*(\\d+)[:.\\-\\s]*/gi,
        nivel: 'exercicio',
      },
      box_informacao: {
        regex:
          /(?:box|destaque|importante|saiba mais|curiosidade)[:\\s]*([^.!?]+)[.!?]/gi,
        nivel: 'box_informacao',
      },
      tabela_conteudo: {
        regex: /(?:conte[úu]do|sum[áa]rio|t[óo]pico|tema)[:\\s]*([^.!?]+)[.!?]/gi,
        nivel: 'tabela_conteudo',
      },
      resumo: {
        regex:
          /(?:resumo|s[ií]ntese|conclus[ãa]o|pontos principais)[:\\s]*([^.!?]+)[.!?]/gi,
        nivel: 'resumo',
      },
    };

    // Estrutura de conteúdo esperada por matéria e ano
    this.estruturaConteudo = {
      'matematica': {
        '6_ano': [
          { tipo: 'titulo', esperado: 'Números naturais' },
          { tipo: 'titulo', esperado: 'Operações com números naturais' },
          { tipo: 'titulo', esperado: 'Geometria' },
        ],
        '7_ano': [
          { tipo: 'titulo', esperado: 'Números inteiros' },
          { tipo: 'titulo', esperado: 'Números racionais' },
          { tipo: 'titulo', esperado: 'Expressões algébricas' },
        ],
      },
      'ciencias_da_natureza': {
        '6_ano': [
          { tipo: 'titulo', esperado: 'Matéria e energia' },
          { tipo: 'titulo', esperado: 'Seres vivos' },
          { tipo: 'titulo', esperado: 'Ciclos da natureza' },
        ],
      },
      'linguagens_e_codigos': {
        '6_ano': [
          { tipo: 'titulo', esperado: 'Variedades linguísticas' },
          { tipo: 'titulo', esperado: 'Gêneros textuais' },
          { tipo: 'titulo', esperado: 'Literatura' },
        ],
      },
      'ciencias_humanas': {
        '6_ano': [
          { tipo: 'titulo', esperado: 'Espaço e paisagem' },
          { tipo: 'titulo', esperado: 'O tempo histórico' },
          { tipo: 'titulo', esperado: 'Brasil colônia' },
        ],
      },
    };
  }

  /**
   * Método principal para extrair conteúdo de livros didáticos
   * @param {string} filePath - Caminho para o arquivo PDF do livro
   * @returns {Promise<Object>} - Conteúdo extraído com estrutura
   */
  async extract(filePath) {
    try {
      console.log(`Iniciando extração do livro: ${filePath}`);

      // Verificar se o arquivo existe
      if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${filePath}`);
      }

      // Extrair conteúdo com informações de layout
      const conteudoLayout = await this.extrairConteudoLayout(filePath);

      // Obter metadados do livro
      const metadata = await this.obterMetadata(filePath);

      // Processar e estruturar o conteúdo
      const conteudoEstruturado = await this.estruturarConteudo(
        conteudoLayout,
        metadata
      );

      // Extrair elementos específicos (exercícios, definições, etc.)
      const elementosExtraidos = this.extrairElementos(conteudoEstruturado);

      // Classificar conteúdo por tópicos
      const conteudoClassificado = await this.classificarConteudo(
        conteudoEstruturado,
        metadata
      );

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
   * @param {string} filePath - Caminho para o arquivo PDF
   * @returns {Promise<Object>} - Conteúdo com informações de layout
   */
  async extrairConteudoLayout(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);

      // Carrega o PDF
      const pdf = await pdfjsLib.getDocument({
        data: dataBuffer,
        cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
        cMapPacked: true,
      }).promise;

      const pages = [];
      const metadata = await pdf.getMetadata();

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        const viewport = page.getViewport({ scale: 1.5 });

        // Obter informações de posicionamento para cada item de texto
        const positionedTexts = content.items.map((item) => {
          return {
            str: item.str,
            transform: item.transform,
            width: item.width,
            height: item.height,
            pageNumber: pageNum,
          };
        });

        pages.push({
          number: pageNum,
          content,
          positionedTexts,
          viewport,
          width: viewport.width,
          height: viewport.height,
        });
      }

      return {
        pages,
        metadata,
        totalPages: pdf.numPages,
        title: metadata.Title || path.basename(filePath, '.pdf'),
      };
    } catch (error) {
      console.error('Erro ao extrair conteúdo com layout:', error);
      throw error;
    }
  }

  /**
   * Obter metadados do livro
   * @param {string} filePath - Caminho para o arquivo PDF
   * @returns {Promise<Object>} - Metadados do livro
   */
  async obterMetadata(filePath) {
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath, '.pdf');

    // Extrair matéria e ano do nome do arquivo
    const materia = this.extrairMateriaDoNome(fileName);
    const ano = this.extrairAnoDoNome(fileName);

    return {
      fileName,
      size: stats.size,
      creationDate: stats.birthtime,
      modificationDate: stats.mtime,
      materia,
      ano,
    };
  }

  /**
   * Extrair matéria do nome do arquivo
   * @param {string} fileName - Nome do arquivo
   * @returns {string} - Matéria extraída
   */
  extrairMateriaDoNome(fileName) {
    const materias = [
      'matematica',
      'portugues',
      'ciencias_da_natureza',
      'ciencias_humanas',
      'ingles',
      'historia',
      'geografia',
      'biologia',
      'fisica',
      'quimica',
    ];

    for (const materia of materias) {
      if (fileName.toLowerCase().includes(materia)) {
        return materia;
      }
    }

    // Tentar identificar por palavras-chave
    if (fileName.match(/(mat|math|calculo|algebra)/i)) return 'matematica';
    if (fileName.match(/(port|lingua|gramatica)/i)) return 'portugues';
    if (fileName.match(/(cienc|natureza)/i)) return 'ciencias_da_natureza';
    if (fileName.match(/(humanas|hist|geo)/i)) return 'ciencias_humanas';

    return 'nao_identificada';
  }

  /**
   * Extrair ano do nome do arquivo
   * @param {string} fileName - Nome do arquivo
   * @returns {number} - Ano extraído
   */
  extrairAnoDoNome(fileName) {
    // Padrão para encontrar ano no nome (ex: 6ano, 7_ano, ano6, etc.)
    const anoPattern = /(?:^|[_\s])(\d{1,2})(?:[_\s]?ano|ano[_\s]?)/i;
    const match = fileName.match(anoPattern);

    if (match) {
      return parseInt(match[1]);
    }

    // Tentar encontrar ano isolado
    const isolatedYearPattern = /(?:^|[_\s])(20[0-9]{2}|[0-9]{2})(?:[_\s]|$)/;
    const yearMatch = fileName.match(isolatedYearPattern);

    if (yearMatch) {
      const year = parseInt(yearMatch[1]);
      if (year > 1950) return year; // Considera como ano se for > 1950
      if (year > 5 && year < 13) return year; // Considera como ano escolar se 6-12
    }

    return 0; // Ano não identificado
  }

  /**
   * Estruturar o conteúdo extraído
   * @param {Object} conteudoLayout - Conteúdo com informações de layout
   * @param {Object} metadata - Metadados do livro
   * @returns {Array} - Conteúdo estruturado
   */
  async estruturarConteudo(conteudoLayout, metadata) {
    const estrutura = [];

    for (const page of conteudoLayout.pages) {
      const pageStructure = await this.processarPagina(page, metadata);
      estrutura.push(pageStructure);
    }

    return estrutura;
  }

  /**
   * Processar uma página específica do livro
   * @param {Object} page - Objeto de página
   * @param {Object} metadata - Metadados do livro
   * @returns {Object} - Estrutura da página
   */
  async processarPagina(page, metadata) {
    const text = page.content.items.map((item) => item.str).join(' ');
    const positionedTexts = page.positionedTexts;

    // Identificar elementos na página
    const elementos = this.identificarElementos(text);
    const elementosPosicionados = this.processarElementosPosicionados(
      positionedTexts
    );

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

    for (const [tipo, padrao] of Object.entries(this.padroesConteudo)) {
      const matches = text.match(padrao.regex);
      if (matches) {
        matches.forEach((match) => {
          elementos.push({
            tipo: tipo,
            conteudo: match,
            nivel: padrao.nivel,
            confianca: 0.8,
          });
        });
      }
    }

    return elementos;
  }

  /**
   * Processar elementos com informações de posição
   * @param {Array} positionedTexts - Textos com informações de posição
   * @returns {Array} - Elementos posicionados
   */
  processarElementosPosicionados(positionedTexts) {
    const elementos = [];

    // Identificar títulos com base no tamanho da fonte e posição
    positionedTexts.forEach((item) => {
      if (item.width && item.width > 20) { // Estimativa de tamanho de fonte
        elementos.push({
          tipo: 'titulo_posicionado',
          conteudo: item.str,
          x: item.transform[4],
          y: item.transform[5],
          nivel: 'titulo',
          confianca: 0.7,
        });
      }
    });

    return elementos;
  }

  /**
   * Extrair elementos específicos (exercícios, definições, etc.)
   * @param {Array} conteudoEstruturado - Conteúdo estruturado
   * @returns {Object} - Elementos extraídos categorizados
   */
  extrairElementos(conteudoEstruturado) {
    const elementos = {
      definicoes: [],
      exemplos: [],
      exercicios: [],
      boxes: [],
      titulos: [],
      resumos: [],
    };

    for (const pagina of conteudoEstruturado) {
      for (const elemento of pagina.elementos) {
        switch (elemento.tipo) {
          case 'definicao':
            elementos.definicoes.push(elemento);
            break;
          case 'exemplo':
            elementos.exemplos.push(elemento);
            break;
          case 'exercicio':
            elementos.exercicios.push(elemento);
            break;
          case 'box_informacao':
            elementos.boxes.push(elemento);
            break;
          case 'titulo':
          case 'subtitulo':
            elementos.titulos.push(elemento);
            break;
          case 'resumo':
            elementos.resumos.push(elemento);
            break;
        }
      }
    }

    return elementos;
  }

  /**
   * Classificar conteúdo por tópicos e temas
   * @param {Array} conteudoEstruturado - Conteúdo estruturado
   * @param {Object} metadata - Metadados do livro
   * @returns {Promise<Object>} - Conteúdo classificado
   */
  async classificarConteudo(conteudoEstruturado, metadata) {
    const classificacao = {
      temas: [],
      topicos: {},
      dificuldade: 'media', // Será calculada posteriormente
    };

    // Obter estrutura esperada para esta matéria e ano
    const estruturaEsperada = this.obterEstruturaEsperada(
      metadata.materia,
      metadata.ano
    );

    // Classificar cada elemento encontrado
    for (const pagina of conteudoEstruturado) {
      for (const elemento of pagina.elementos) {
        const classificacaoElemento = this.classificarElemento(
          elemento,
          estruturaEsperada
        );

        if (classificacaoElemento.tema) {
          if (!classificacao.topicos[classificacaoElemento.tema]) {
            classificacao.topicos[classificacaoElemento.tema] = [];
          }
          classificacao.topicos[classificacaoElemento.tema].push(elemento);
        }
      }
    }

    // Calcular métricas
    classificacao.dificuldade = this.calcularDificuldade(conteudoEstruturado);

    return classificacao;
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

    if (
      this.estruturaConteudo[chaveMateria] &&
      this.estruturaConteudo[chaveMateria][chaveAno]
    ) {
      return this.estruturaConteudo[chaveMateria][chaveAno];
    }

    return [];
  }

  /**
   * Classificar um elemento específico
   * @param {Object} elemento - Elemento para classificar
   * @param {Array} estruturaEsperada - Estrutura esperada
   * @returns {Object} - Classificação do elemento
   */
  classificarElemento(elemento, estruturaEsperada) {
    // Verificar se o elemento corresponde a algo na estrutura esperada
    for (const itemEsperado of estruturaEsperada) {
      if (
        elemento.conteudo.toLowerCase().includes(itemEsperado.esperado.toLowerCase()) &&
        elemento.tipo === itemEsperado.tipo
      ) {
        return {
          tema: itemEsperado.esperado,
          confianca: 0.9,
        };
      }
    }

    // Se não encontrar correspondência exata, tentar correspondência parcial
    for (const itemEsperado of estruturaEsperada) {
      if (elemento.conteudo.toLowerCase().includes(itemEsperado.esperado.toLowerCase().split(' ')[0])) {
        return {
          tema: itemEsperado.esperado,
          confianca: 0.6,
        };
      }
    }

    // Classificação genérica
    return {
      tema: 'outro',
      confianca: 0.3,
    };
  }

  /**
   * Calcular dificuldade do conteúdo
   * @param {Array} conteudoEstruturado - Conteúdo estruturado
   * @returns {string} - Nível de dificuldade
   */
  calcularDificuldade(conteudoEstruturado) {
    let totalExercicios = 0;
    let totalExerciciosComplexos = 0;

    for (const pagina of conteudoEstruturado) {
      for (const elemento of pagina.elementos) {
        if (elemento.tipo === 'exercicio') {
          totalExercicios++;

          // Verificar se o exercício é complexo com base em palavras-chave
          const palavrasComplexas = ['demonstrar', 'provar', 'analisar criticamente', 'elaborar', 'comparar', 'avaliar'];
          const conteudoLower = elemento.conteudo.toLowerCase();

          if (palavrasComplexas.some(palavra => conteudoLower.includes(palavra))) {
            totalExerciciosComplexos++;
          }
        }
      }
    }

    if (totalExercicios === 0) return 'media';

    const proporcaoComplexos = totalExerciciosComplexos / totalExercicios;

    if (proporcaoComplexos > 0.5) return 'alta';
    if (proporcaoComplexos > 0.2) return 'media';
    return 'baixa';
  }
}

export default new LivroDidaticoExtractor();
