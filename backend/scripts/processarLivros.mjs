// Usar import em vez de require para ES Modules
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// Obter o caminho do diretório atual em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar dotenv
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Configurar o workerSrc para pdfjs-dist, garantindo que seja uma URL de arquivo válida
const workerSrcPath = path.join(
  __dirname,
  '..',
  'node_modules',
  'pdfjs-dist',
  'legacy',
  'build',
  'pdf.worker.mjs'
);
pdfjsLib.GlobalWorkerOptions.workerSrc = pathToFileURL(workerSrcPath).href;

// --- Funções de Análise de Layout ---

// Estima o tamanho da fonte a partir da matriz de transformação do PDF
function getFontSize(transform) {
  // A escala vertical (d) é um bom indicador do tamanho da fonte
  return transform[3];
}

// Encontra o tamanho de fonte mais comum (moda) em uma página
function findMostCommonFontSize(textContent) {
  if (!textContent || textContent.items.length === 0) return 0;
  const fontSizes = textContent.items.map((item) =>
    getFontSize(item.transform).toFixed(2)
  );
  const counts = fontSizes.reduce((acc, size) => {
    acc[size] = (acc[size] || 0) + 1;
    return acc;
  }, {});
  let mostCommonSize = 0;
  let maxCount = 0;
  for (const size in counts) {
    if (counts[size] > maxCount) {
      maxCount = counts[size];
      mostCommonSize = parseFloat(size);
    }
  }
  return mostCommonSize;
}

// --- Script Principal ---

async function processarLivro(fileName) {
  const db = (await import('../db/index.js')).default;
  const livrosDir = path.join(__dirname, '..', '..', 'Livros didáticos');
  const pdfPath = path.join(livrosDir, fileName);

  if (!fs.existsSync(pdfPath)) {
    console.error('Arquivo PDF não encontrado:', pdfPath);
    return;
  }

  console.log(`Processando o livro: ${fileName}`);

  try {
    const data = new Uint8Array(fs.readFileSync(pdfPath));
    const doc = await pdfjsLib.getDocument(data).promise;
    const numPages = doc.numPages;
    console.log(`Livro com ${numPages} páginas.`);

    let currentChapter = 'Sumário/Introdução';
    let currentSection = null;
    const accumulatedContent = []; // Declarar aqui

    const chapterRegex = /^CAPÍTULO\s+([IVXLCDM]+|\d+)/i;
    const sectionRegex = /^([IVXLCDM]+|[\d\.]+)\s/i; // Ex: IV. ou 1.2.

    for (let i = 1; i <= numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();

      const bodyFontSize = findMostCommonFontSize(textContent);
      const headingThreshold = bodyFontSize * 1.2; // Títulos são pelo menos 20% maiores

      const pageText = '';

      // Primeiro, agrupa os itens de texto em linhas
      const lines = [];
      let currentLine = [];
      let lastY = -1;
      for (const item of textContent.items) {
        if (lastY !== -1 && Math.abs(item.transform[5] - lastY) > 5) {
          // Heurística de nova linha
          lines.push(currentLine);
          currentLine = [];
        }
        currentLine.push(item);
        lastY = item.transform[5];
      }
      if (currentLine.length > 0) lines.push(currentLine);

      // Agora, analisa as linhas em busca de títulos
      for (const line of lines) {
        const lineText = line
          .map((item) => item.str)
          .join('')
          .trim();
        const firstItem = line[0];
        const fontSize = getFontSize(firstItem.transform);

        if (fontSize > headingThreshold && lineText.length < 150) {
          if (chapterRegex.test(lineText)) {
            currentChapter = lineText;
            currentSection = null; // Reseta a seção
            console.log(
              `--- Novo Capítulo Encontrado na Página ${i}: ${currentChapter} ---`
            );
          } else if (sectionRegex.test(lineText)) {
            currentSection = lineText;
            console.log(`    --- Nova Seção Encontrada: ${currentSection} ---`);
          }
        }
      }

      const fullPageText = textContent.items.map((item) => item.str).join(' ');
      const sanitizedText = fullPageText.replace(/\u0000/g, '');

      if (sanitizedText.trim()) {
        // Acumula o conteúdo em memória em vez de salvar no DB
        accumulatedContent.push({
          page: i,
          capitulo: currentChapter,
          secao: currentSection,
          texto: sanitizedText.trim(),
        });
        console.log(
          `Página ${i} de ${numPages} processada [Cap: ${currentChapter}, Seção: ${currentSection || 'N/A'}]`
        );
      } else {
        console.log(`Página ${i} de ${numPages} está vazia.`);
      }
    }

    console.log(
      `Processamento do livro "${fileName}" concluído. Total de ${accumulatedContent.length} itens acumulados.`
    );
    // console.log('Primeiros 5 itens acumulados:', accumulatedContent.slice(0, 5));

    // Parte 2: Agrupar conteúdo por capítulo/seção
    const groupedContent = groupContentByChapterAndSection(accumulatedContent);
    console.log(
      `Conteúdo agrupado em ${groupedContent.length} capítulos/seções principais.`
    );
    console.log(
      'Primeiros 2 capítulos/seções agrupados:',
      JSON.stringify(groupedContent.slice(0, 2), null, 2)
    );

    // Parte 3: Salvar conteúdo estruturado no banco de dados
    await saveStructuredContentToDatabase(groupedContent, fileName, db);

    return {
      // Retorna um relatório
      fileName,
      totalPages: numPages,
      processedPages: accumulatedContent.length,
      chaptersFound: groupedContent.filter((item) => item.tipo === 'capitulo')
        .length,
      sectionsFound: groupedContent.filter((item) => item.tipo === 'secao')
        .length,
      status: 'success',
      errors: [],
      warnings: [],
    };
  } catch (error) {
    console.error('Erro ao processar o PDF com pdfjs-dist:', error);
    return {
      // Retorna um relatório de falha
      fileName,
      totalPages: 0,
      processedPages: 0,
      chaptersFound: 0,
      sectionsFound: 0,
      status: 'failure',
      errors: [error.message],
      warnings: [],
    };
  }
}

// --- Funções de Agrupamento e Estruturação ---
function groupContentByChapterAndSection(content) {
  const grouped = [];
  let currentChapter = null;
  let currentSection = null;

  for (const item of content) {
    // Se o capítulo mudou, cria um novo capítulo
    if (
      item.capitulo &&
      item.capitulo !== (currentChapter ? currentChapter.titulo : null)
    ) {
      currentChapter = {
        tipo: 'capitulo',
        titulo: item.capitulo,
        secoes: [],
        conteudos: [],
      };
      grouped.push(currentChapter);
      currentSection = null; // Reseta a seção ao mudar de capítulo
    }

    // Se a seção mudou, cria uma nova seção dentro do capítulo atual
    if (
      item.secao &&
      item.secao !== (currentSection ? currentSection.titulo : null)
    ) {
      currentSection = {
        tipo: 'secao',
        titulo: item.secao,
        conteudos: [],
      };
      if (currentChapter) {
        currentChapter.secoes.push(currentSection);
      } else {
        // Caso haja uma seção antes de um capítulo (ex: introdução)
        // Isso pode acontecer se o primeiro item for uma seção e não um capítulo
        // Ou se a detecção de capítulo falhou
        grouped.push(currentSection);
      }
    }

    // Classifica o tipo de conteúdo e adiciona ao nível mais granular disponível
    const contentType = classifyContent(item.texto);
    const contentBlock = {
      tipo: contentType,
      texto: item.texto,
      pagina: item.page,
    };

    if (currentSection) {
      currentSection.conteudos.push(contentBlock);
    } else if (currentChapter) {
      currentChapter.conteudos.push(contentBlock);
    } else {
      // Conteúdo sem capítulo/seção (ex: páginas iniciais)
      // Cria um item genérico para o conteúdo não classificado
      let unclassifiedBlock = grouped[grouped.length - 1];
      if (!unclassifiedBlock || unclassifiedBlock.tipo) {
        // Se o último não é um bloco de texto simples
        unclassifiedBlock = { tipo: 'texto_nao_classificado', conteudos: [] };
        grouped.push(unclassifiedBlock);
      }
      unclassifiedBlock.conteudos.push(contentBlock);
    }
  }

  return grouped;
}

// --- Funções de Classificação de Conteúdo ---
function classifyContent(text) {
  // Heurísticas simples para classificação inicial
  if (/(?:^|\n)\s*EXERC%C3%8DCIOS?\s*\d*\.?/i.test(text)) return 'exercicio';
  if (/(?:^|\n)\s*QUEST%C3%95ES?\s*DE\s*VESTIBULARES?/i.test(text))
    return 'questao';
  if (/(?:^|\n)\s*GABARITO/i.test(text)) return 'gabarito';
  if (/(?:^|\n)\s*EXEMPLO\s*\d*\.?/i.test(text)) return 'exemplo';
  // Adicionar mais regras aqui
  return 'teoria'; // Padrão
}

// --- Funções de Salvamento no Banco de Dados ---
async function saveStructuredContentToDatabase(groupedContent, bookTitle, db) {
  console.log(
    `Salvando conteúdo estruturado do livro "${bookTitle}" no banco de dados...`
  );

  let livroId;
  try {
    const livroResult = await db.query(
      'INSERT INTO livros (titulo, arquivo_pdf) VALUES ($1, $2) RETURNING id',
      [bookTitle, bookTitle] // Usar bookTitle como arquivo_pdf provisoriamente
    );
    livroId = livroResult.rows[0].id;
    console.log(`Livro "${bookTitle}" inserido com ID: ${livroId}`);
  } catch (error) {
    // Se o livro já existe, tenta obter o ID
    if (error.code === '23505') {
      // Código de erro para violação de unique_constraint
      console.log(
        `Livro "${bookTitle}" já existe. Tentando obter o ID existente.`
      );
      const existingLivro = await db.query(
        'SELECT id FROM livros WHERE titulo = $1',
        [bookTitle]
      );
      if (existingLivro.rows.length > 0) {
        livroId = existingLivro.rows[0].id;
        console.log(`ID existente do livro "${bookTitle}": ${livroId}`);
      } else {
        console.error(
          `Erro: Livro "${bookTitle}" existe, mas não foi possível recuperar o ID.`,
          error
        );
        throw error;
      }
    } else {
      console.error('Erro ao inserir/obter livro:', error);
      throw error;
    }
  }

  if (!livroId) {
    console.error(
      'Não foi possível obter o ID do livro. Abortando salvamento.'
    );
    return;
  }

  // Limpa capítulos, tópicos, conteúdos, questões, gabaritos associados a este livro
  // As cascatas nos DELETES das tabelas cuidam da limpeza de dependências
  await db.query('DELETE FROM capitulos WHERE livro_id = $1', [livroId]);

  let currentChapterId = null;
  let currentTopicId = null;

  for (const item of groupedContent) {
    if (item.tipo === 'capitulo') {
      const chapterResult = await db.query(
        'INSERT INTO capitulos (livro_id, titulo, pagina_inicial, pagina_final) VALUES ($1, $2, $3, $4) RETURNING id',
        [
          livroId,
          item.titulo,
          item.conteudos[0]?.pagina || null,
          item.conteudos[item.conteudos.length - 1]?.pagina || null,
        ]
      );
      currentChapterId = chapterResult.rows[0].id;
      console.log(
        `  Capítulo "${item.titulo}" inserido com ID: ${currentChapterId}`
      );
      currentTopicId = null;

      // Processar conteúdos diretamente no capítulo
      for (const conteudoBlock of item.conteudos) {
        await insertContent(db, livroId, currentChapterId, null, conteudoBlock);
      }

      // Processar seções (tópicos)
      for (const secao of item.secoes) {
        const topicResult = await db.query(
          'INSERT INTO topicos (capitulo_id, titulo, pagina_inicial, pagina_final) VALUES ($1, $2, $3, $4) RETURNING id',
          [
            currentChapterId,
            secao.titulo,
            secao.conteudos[0]?.pagina || null,
            secao.conteudos[secao.conteudos.length - 1]?.pagina || null,
          ]
        );
        currentTopicId = topicResult.rows[0].id;
        console.log(
          `    Tópico "${secao.titulo}" inserido com ID: ${currentTopicId}`
        );

        // Processar conteúdos da seção (tópico)
        for (const conteudoBlock of secao.conteudos) {
          await insertContent(
            db,
            livroId,
            currentChapterId,
            currentTopicId,
            conteudoBlock
          );
        }
      }
    } else if (item.tipo === 'secao') {
      // Seção sem capítulo pai explícito (introdução, etc.)
      // Cria um capítulo padrão para seções sem capítulo
      const defaultChapterResult = await db.query(
        'INSERT INTO capitulos (livro_id, titulo, pagina_inicial, pagina_final) VALUES ($1, $2, $3, $4) RETURNING id',
        [
          livroId,
          'Capítulo Introdutório',
          item.conteudos[0]?.pagina || null,
          item.conteudos[item.conteudos.length - 1]?.pagina || null,
        ]
      );
      const defaultChapterId = defaultChapterResult.rows[0].id;

      // Trata como um tópico dentro do capítulo padrão
      const topicResult = await db.query(
        'INSERT INTO topicos (capitulo_id, titulo, pagina_inicial, pagina_final) VALUES ($1, $2, $3, $4) RETURNING id',
        [
          defaultChapterId,
          item.titulo,
          item.conteudos[0]?.pagina || null,
          item.conteudos[item.conteudos.length - 1]?.pagina || null,
        ]
      );
      currentTopicId = topicResult.rows[0].id;
      currentChapterId = defaultChapterId;
      console.log(
        `  Capítulo padrão criado e tópico "${item.titulo}" inserido com ID: ${currentTopicId}`
      );

      for (const conteudoBlock of item.conteudos) {
        await insertContent(
          db,
          livroId,
          currentChapterId,
          currentTopicId,
          conteudoBlock
        );
      }
    } else {
      // Conteúdo não classificado no nível superior
      for (const conteudoBlock of item.conteudos) {
        await insertContent(db, livroId, null, null, conteudoBlock);
      }
    }
  }

  console.log(`Conteúdo do livro "${bookTitle}" salvo no banco de dados.`);
}

// Função auxiliar para inserir conteúdo, questões e gabaritos
async function insertContent(db, livroId, capituloId, topicoId, conteudoBlock) {
  const { tipo, texto, pagina } = conteudoBlock;

  const contentResult = await db.query(
    'INSERT INTO conteudos (livro_id, capitulo_id, topico_id, tipo, texto, pagina_inicial, pagina_final) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id',
    [livroId, capituloId, topicoId, tipo, texto, pagina, pagina]
  );
  const conteudoId = contentResult.rows[0].id;

  if (tipo === 'questao' || tipo === 'exercicio') {
    // Lógica para extrair alternativas e resposta correta do texto da questão
    const { enunciado, alternativas, respostaCorreta } =
      extractQuestionDetails(texto);

    const questaoResult = await db.query(
      'INSERT INTO questoes (livro_id, capitulo_id, topico_id, conteudo_id, enunciado, alternativas, resposta_correta, pagina) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id',
      [
        livroId,
        capituloId,
        topicoId,
        conteudoId,
        enunciado,
        alternativas,
        respostaCorreta,
        pagina,
      ]
    );
    const questaoId = questaoResult.rows[0].id;

    if (respostaCorreta) {
      await db.query(
        'INSERT INTO gabaritos (questao_id, alternativa_correta) VALUES ($1, $2)',
        [questaoId, respostaCorreta]
      );
    }
  }
}

// Função auxiliar para extrair detalhes da questão (implementação melhorada)
function extractQuestionDetails(text) {
  // Melhorar a extração de alternativas com regex mais robusta
  const alternativas = {};

  // Padrões múltiplos para detectar alternativas
  const patterns = [
    /([A-Z])\)\s*([^\n\r]+)/g, // A) alternativa
    /([A-Z])\s*\.\s*([^\n\r]+)/g, // A. alternativa
    /([A-Z])\s*[:]\s*([^\n\r]+)/g, // A: alternativa
    /\b([A-Z])\s*[)\-\.]\s*([^\n\r]{10,200})/g, // padrões alternativos
  ];

  for (const pattern of patterns) {
    const matches = [...text.matchAll(pattern)];
    for (const match of matches) {
      const key = match[1];
      const value = match[2]?.trim();
      if (key && value && value.length > 5 && value.length < 300) {
        alternativas[key] = value;
      }
    }
    if (Object.keys(alternativas).length >= 2) break; // Para quando encontra alternativas suficientes
  }

  // Extrair resposta correta de múltiplas formas
  let respostaCorreta = null;

  const gabaritoPatterns = [
    /GABARITO:\s*([A-E])/i,
    /Resposta:\s*([A-E])/i,
    /Correta:\s*([A-E])/i,
    /([A-E])\s*\*\s*correta/i,
    /\b([A-E])\s*\(correta\)/i,
    /\b([A-E])\s*\[correta\]/i,
  ];

  for (const pattern of gabaritoPatterns) {
    const match = text.match(pattern);
    if (match) {
      respostaCorreta = match[1].toUpperCase();
      break;
    }
  }

  // Se não encontrou gabarito, tenta inferir pela estrutura
  if (!respostaCorreta && Object.keys(alternativas).length >= 2) {
    // Pode adicionar lógica de inferência baseada em contexto aqui
    respostaCorreta = null; // Por enquanto deixa como null
  }

  // Extrair enunciado (tudo antes das alternativas)
  const enunciado = text.split(/([A-Z])\s*[)\-\.:]/)[0]?.trim() || text;

  return { enunciado, alternativas, respostaCorreta };
}

const fileName = process.argv[2];
if (!fileName) {
  console.error(
    'Por favor, forneça o nome do arquivo do livro como argumento.'
  );
  process.exit(1);
}

processarLivro(fileName);

