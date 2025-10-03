// Usar import em vez de require para ES Modules
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Bridge para importar módulos CommonJS em um ES Module
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Obter o caminho do diretório atual em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar dotenv
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

async function verificarConteudoLivro() {
  // Importar dinamicamente o DB DEPOIS que o dotenv foi carregado
  const db = (await import('../db/index.js')).default;

  console.log('Verificando o conteúdo da tabela conteudo_livro...');

  try {
    // Contar o número total de entradas
    const countResult = await db.query('SELECT COUNT(*) FROM conteudo_livro');
    const totalEntries = countResult.rows[0].count;
    console.log(`Total de entradas na tabela conteudo_livro: ${totalEntries}`);

    // Mostrar algumas entradas de exemplo
    const sampleResult = await db.query(
      'SELECT livro_titulo, capitulo, secao, SUBSTRING(conteudo_texto, 1, 100) as sample_text FROM conteudo_livro LIMIT 5'
    );
    console.log('Exemplos de entradas:');
    sampleResult.rows.forEach((row, index) => {
      console.log(`-- Exemplo ${index + 1} --`);
      console.log(`Livro: ${row.livro_titulo}`);
      console.log(`Capítulo: ${row.capitulo}`);
      console.log(`Seção: ${row.secao}`);
      console.log(`Texto (amostra): ${row.sample_text}...`);
    });
  } catch (error) {
    console.error('Erro ao verificar o conteúdo do livro:', error);
  }
}

verificarConteudoLivro();
