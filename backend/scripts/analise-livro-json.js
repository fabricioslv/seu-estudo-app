const fs = require('fs');
const PDFParser = require('pdf2json');
const path = require('path');

async function analisarLivro(fileName) {
  const livrosDir = path.join(__dirname, '..', '..', 'Livros didáticos');
  const pdfPath = path.join(livrosDir, fileName);
  const outputDir = path.join(__dirname, '..', 'temp_analysis');
  const outputJsonPath = path.join(
    outputDir,
    `${path.basename(fileName, '.pdf')}.json`
  );

  if (!fs.existsSync(pdfPath)) {
    console.error('Arquivo PDF não encontrado:', pdfPath);
    return;
  }

  console.log(`Analisando o livro: ${fileName}`);

  const pdfParser = new PDFParser();

  pdfParser.on('pdfParser_dataError', (errData) =>
    console.error(errData.parserError)
  );
  pdfParser.on('pdfParser_dataReady', (pdfData) => {
    console.log(
      'Análise concluída. Exibindo a estrutura das primeiras 5 páginas:'
    );
    const sampleData = {
      totalPages: pdfData.Pages.length,
      firstFivePages: pdfData.Pages.slice(0, 5).map((page) => ({
        width: page.Width,
        height: page.Height,
        texts: page.Texts.slice(0, 10), // Amostra dos primeiros 10 elementos de texto da página
      })),
    };
    console.log(JSON.stringify(sampleData, null, 2));
  });

  pdfParser.loadPDF(pdfPath);
}

const fileName = process.argv[2];
if (!fileName) {
  console.error(
    'Por favor, forneça o nome do arquivo do livro como argumento.'
  );
  process.exit(1);
}

analisarLivro(fileName);
