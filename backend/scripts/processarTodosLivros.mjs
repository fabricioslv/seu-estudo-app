// Usar import em vez de require para ES Modules
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';

// Obter o caminho do diretório atual em ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const livrosDir = path.join(__dirname, '..', '..', 'Livros didáticos');

async function processarTodos() {
  console.log('Iniciando o processamento de todos os livros didáticos...');

  const files = fs
    .readdirSync(livrosDir)
    .filter((file) => file.toLowerCase().endsWith('.pdf'));

  console.log(`Encontrados ${files.length} livros para processar.`);

  for (const file of files) {
    console.log(`--- Iniciando processamento de: ${file} ---`);

    // Usamos 'exec' para chamar o script processarLivros.mjs em um novo processo
    // Isso garante que cada livro seja processado em um ambiente limpo, evitando acúmulo de memória
    const command = `node scripts/processarLivros.mjs "${file}"`;

    await new Promise((resolve, reject) => {
      const child = exec(
        command,
        { cwd: path.join(__dirname, '..') },
        (error, stdout, stderr) => {
          if (error) {
            console.error(`Erro ao processar ${file}:`, error);
            reject(error);
            return;
          }
          console.log(stdout);
          if (stderr) console.error('Stderr:', stderr);
          resolve();
        }
      );

      // Log em tempo real
      child.stdout.on('data', (data) => {
        process.stdout.write(data);
      });
      child.stderr.on('data', (data) => {
        process.stderr.write(data);
      });
    });

    console.log(`--- Concluído o processamento de: ${file} ---
`);
  }

  console.log('Processamento de todos os livros concluído!');
}

processarTodos();
