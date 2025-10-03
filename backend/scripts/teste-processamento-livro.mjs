// Script de teste para verificar se o processamento de livros funciona corretamente (ES Modules)
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar dotenv
dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

// Importar dinamicamente o banco de dados
async function testDatabaseConnection() {
  console.log('🔍 Testando conexão com banco de dados...');
  try {
    const db = (await import('../db/index.js')).default;

    // Teste básico de conexão
    const result = await db.query('SELECT NOW() as current_time');
    console.log(
      '✅ Conexão com banco estabelecida:',
      result.rows[0].current_time
    );

    // Verificar se tabelas existem
    const tables = [
      'livros',
      'capitulos',
      'topicos',
      'conteudos',
      'questoes',
      'gabaritos',
    ];
    for (const table of tables) {
      const exists = await db.query(
        `
                SELECT EXISTS (
                    SELECT FROM information_schema.tables
                    WHERE table_schema = 'public'
                    AND table_name = $1
                );
            `,
        [table]
      );

      if (exists.rows[0].exists) {
        console.log(`✅ Tabela ${table} existe`);
      } else {
        console.log(`❌ Tabela ${table} não existe`);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('❌ Erro na conexão com banco:', error.message);
    return false;
  }
}

async function testLivroProcess() {
  console.log('🚀 Iniciando teste de processamento de livro...');

  // Verificar se há conexão com banco
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    console.error('❌ Não foi possível conectar ao banco. Abortando teste.');
    return;
  }

  // Verificar se existe algum livro didático para teste
  const livrosDir = path.join(__dirname, '..', '..', 'Livros didáticos');
  if (!fs.existsSync(livrosDir)) {
    console.error(
      '❌ Diretório de livros didáticos não encontrado:',
      livrosDir
    );
    return;
  }

  const livros = fs
    .readdirSync(livrosDir)
    .filter((file) => file.endsWith('.pdf'));
  if (livros.length === 0) {
    console.error(
      '❌ Nenhum arquivo PDF encontrado no diretório de livros didáticos'
    );
    return;
  }

  // Usar o primeiro livro encontrado para teste
  const livroTeste = livros[0];
  console.log(`📖 Livro selecionado para teste: ${livroTeste}`);

  try {
    // Importar e executar o processamento
    const { processarLivro } = await import('./processarLivros.mjs');

    console.log('🔄 Iniciando processamento...');
    const resultado = await processarLivro(livroTeste);

    console.log('📊 Resultado do processamento:');
    console.log(JSON.stringify(resultado, null, 2));

    if (resultado.status === 'success') {
      console.log('✅ Processamento concluído com sucesso!');
    } else {
      console.log('❌ Processamento falhou:', resultado.errors);
    }
  } catch (error) {
    console.error('❌ Erro durante o processamento:', error);
  }
}

// Executar o teste
testLivroProcess().catch(console.error);
