// Configura o dotenv para carregar as variáveis de ambiente ANTES de qualquer outra importação
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const fs = require('fs');
const pdfjsLib = require('pdfjs-dist/build/pdf.js');
const db = require('../db');

async function processarLivro(fileName) {
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

    for (let i = 1; i <= numPages; i++) {
      const page = await doc.getPage(i);
      const textContent = await page.getTextContent();

      // Mapeia os itens de texto para um formato mais simples
      const pageText = textContent.items.map((item) => item.str).join(' ');

      if (pageText.trim()) {
        await db.query(
          'INSERT INTO conteudo_livro (livro_titulo, capitulo, conteudo_texto) VALUES ($1, $2, $3)',
          [fileName, `Página ${i}`, pageText.trim()]
        );
        console.log(`Página ${i} de ${numPages} processada e salva.`);
      } else {
        console.log(
          `Página ${i} de ${numPages} está vazia ou não contém texto.`
        );
      }
    }

    console.log(`Processamento do livro "${fileName}" concluído.`);
  } catch (error) {
    console.error('Erro ao processar o PDF com pdfjs-dist:', error);
  }
}

const fileName = process.argv[2];
if (!fileName) {
  console.error(
    'Por favor, forneça o nome do arquivo do livro como argumento.'
  );
  process.exit(1);
}

processarLivro(fileName);
