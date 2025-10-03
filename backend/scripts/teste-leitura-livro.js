const fs = require('fs');
const pdf = require('pdf-parse');
const path = require('path');

// Caminho para o diretório de livros, ajustado para a localização do script
const livrosDir = path.join(__dirname, '..', '..', 'Livros didáticos');
const pdfPath = path.join(
  livrosDir,
  '01.Conjuntos-e-funcoes-www.leonardoportal.com-.pdf'
);

async function lerPdf() {
  if (!fs.existsSync(pdfPath)) {
    console.error('Arquivo PDF não encontrado em:', pdfPath);
    return;
  }

  console.log(`Lendo o arquivo: ${path.basename(pdfPath)}`);

  try {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer, { max: 20 }); // Limita a 20 páginas

    // Imprime informações gerais e o texto completo das primeiras 20 páginas
    console.log('--- Informações do PDF ---');
    console.log('Páginas (limitado a 20):', data.numpages);
    console.log('--- Texto Extraído (primeiras 20 páginas) ---');
    console.log(data.text);
    console.log('--- Fim da Amostra ---');
  } catch (error) {
    console.error('Erro ao processar o PDF:', error);
  }
}

lerPdf();
