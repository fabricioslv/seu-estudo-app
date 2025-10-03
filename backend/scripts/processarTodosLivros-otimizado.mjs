// Script otimizado para processamento de livros didáticos em lote
// Com melhor gerenciamento de memória e processamento paralelo

import path from 'path';
import { fileURLToPath } from 'url';
import { pathToFileURL } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env') });

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

// Configurações de processamento
const CONFIG = {
  BATCH_SIZE: 5, // Processar 5 livros por vez
  MAX_PAGES_PER_BOOK: 50, // Limitar páginas por livro para evitar memory leaks
  DELAY_BETWEEN_BATCHES: 2000, // 2 segundos entre lotes
  MEMORY_CHECK_INTERVAL: 10000, // Verificar memória a cada 10 segundos
};

// Classe para gerenciar processamento otimizado
class LivroProcessorOtimizado {
  constructor() {
    this.livrosProcessados = 0;
    this.erros = [];
    this.db = null;
  }

  async inicializarDB() {
    if (!this.db) {
      this.db = (await import('../db/index.js')).default;
      console.log('📦 Banco de dados inicializado');
    }
  }

  async verificarMemoria() {
    const uso = process.memoryUsage();
    const usoMB = {
      rss: Math.round(uso.rss / 1024 / 1024),
      heapTotal: Math.round(uso.heapTotal / 1024 / 1024),
      heapUsed: Math.round(uso.heapUsed / 1024 / 1024),
    };

    console.log(
      `💾 Uso de memória: RSS=${usoMB.rss}MB, Heap=${usoMB.heapUsed}/${usoMB.heapTotal}MB`
    );

    // Se uso de memória estiver muito alto, força garbage collection
    if (usoMB.heapUsed > 500) {
      if (global.gc) {
        global.gc();
        console.log('🧹 Garbage collection executado');
      }
    }

    return usoMB;
  }

  async processarLivroOtimizado(fileName, livrosDir) {
    const pdfPath = path.join(livrosDir, fileName);

    if (!fs.existsSync(pdfPath)) {
      console.error(`❌ Arquivo não encontrado: ${pdfPath}`);
      return null;
    }

    console.log(`📖 Processando: ${fileName}`);

    try {
      const data = new Uint8Array(fs.readFileSync(pdfPath));
      const doc = await pdfjsLib.getDocument(data).promise;
      const numPages = Math.min(doc.numPages, CONFIG.MAX_PAGES_PER_BOOK);

      console.log(`📄 ${numPages} páginas para processar`);

      const currentChapter = 'Capítulo Inicial';
      let accumulatedContent = [];

      // Processar páginas em lotes menores
      for (let i = 1; i <= numPages; i += 3) {
        const batchPages = Math.min(3, numPages - i + 1);

        for (let j = 0; j < batchPages; j++) {
          const pageNum = i + j;
          if (pageNum > numPages) break;

          try {
            const page = await doc.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
              .map((item) => item.str)
              .join(' ')
              .trim();

            if (pageText) {
              accumulatedContent.push({
                page: pageNum,
                capitulo: currentChapter,
                texto: pageText,
              });
            }

            // Verificar memória periodicamente
            if (pageNum % 10 === 0) {
              await this.verificarMemoria();
            }
          } catch (pageError) {
            console.warn(`⚠️ Erro na página ${pageNum}: ${pageError.message}`);
          }
        }
      }

      // Salvar no banco de dados
      const resultado = await this.salvarLivroOtimizado(
        fileName,
        accumulatedContent
      );

      // Limpar arrays para liberar memória
      accumulatedContent = null;

      return resultado;
    } catch (error) {
      console.error(`❌ Erro processando ${fileName}:`, error.message);
      this.erros.push({ livro: fileName, erro: error.message });
      return null;
    }
  }

  async salvarLivroOtimizado(fileName, accumulatedContent) {
    await this.inicializarDB();

    try {
      // Inserir livro
      const livroResult = await this.db.query(
        'INSERT INTO livros (titulo, arquivo_pdf) VALUES ($1, $2) ON CONFLICT (arquivo_pdf) DO UPDATE SET titulo = $1 RETURNING id',
        [fileName, fileName]
      );
      const livroId = livroResult.rows[0].id;

      // Criar capítulo padrão
      const chapterResult = await this.db.query(
        'INSERT INTO capitulos (livro_id, titulo, pagina_inicial, pagina_final) VALUES ($1, $2, $3, $4) RETURNING id',
        [livroId, 'Conteúdo Principal', 1, accumulatedContent.length]
      );
      const capituloId = chapterResult.rows[0].id;

      // Inserir conteúdos em lotes
      const BATCH_SIZE = 50;
      for (let i = 0; i < accumulatedContent.length; i += BATCH_SIZE) {
        const batch = accumulatedContent.slice(i, i + BATCH_SIZE);

        for (const item of batch) {
          await this.db.query(
            'INSERT INTO conteudos (livro_id, capitulo_id, tipo, texto, pagina_inicial) VALUES ($1, $2, $3, $4, $5)',
            [livroId, capituloId, 'teoria', item.texto, item.page]
          );
        }

        console.log(
          `💾 Lote ${Math.floor(i / BATCH_SIZE) + 1} inserido no banco`
        );
      }

      return {
        livro: fileName,
        paginasProcessadas: accumulatedContent.length,
        status: 'success',
      };
    } catch (error) {
      console.error(`❌ Erro salvando ${fileName}:`, error.message);
      this.erros.push({ livro: fileName, erro: error.message });
      return null;
    }
  }

  async processarTodosLivros() {
    console.log('🚀 Iniciando processamento otimizado de livros...');

    const livrosDir = path.join(__dirname, '..', '..', 'Livros didáticos');
    if (!fs.existsSync(livrosDir)) {
      console.error('❌ Diretório de livros não encontrado');
      return;
    }

    const livros = fs
      .readdirSync(livrosDir)
      .filter((file) => file.endsWith('.pdf'))
      .slice(0, 20); // Limitar a 20 livros para teste

    console.log(`📚 Encontrados ${livros.length} livros para processar`);

    // Processar em lotes
    for (let i = 0; i < livros.length; i += CONFIG.BATCH_SIZE) {
      const batch = livros.slice(i, i + CONFIG.BATCH_SIZE);
      console.log(
        `\n🔄 Processando lote ${Math.floor(i / CONFIG.BATCH_SIZE) + 1} com ${batch.length} livros`
      );

      const batchPromises = batch.map((livro) =>
        this.processarLivroOtimizado(livro, livrosDir)
      );
      await Promise.all(batchPromises);

      // Pausa entre lotes
      if (i + CONFIG.BATCH_SIZE < livros.length) {
        console.log(
          `⏳ Aguardando ${CONFIG.DELAY_BETWEEN_BATCHES}ms antes do próximo lote...`
        );
        await new Promise((resolve) =>
          setTimeout(resolve, CONFIG.DELAY_BETWEEN_BATCHES)
        );
      }
    }

    // Relatório final
    console.log('\n📊 RELATÓRIO FINAL:');
    console.log(`✅ Livros processados: ${this.livrosProcessados}`);
    console.log(`❌ Erros: ${this.erros.length}`);

    if (this.erros.length > 0) {
      console.log('\n🚨 ERROS ENCONTRADOS:');
      this.erros.forEach((erro) => {
        console.log(`- ${erro.livro}: ${erro.erro}`);
      });
    }

    console.log('🎉 Processamento concluído!');
  }
}

// Função principal
async function main() {
  const processor = new LivroProcessorOtimizado();
  await processor.processarTodosLivros();
}

// Executar apenas se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { LivroProcessorOtimizado };
