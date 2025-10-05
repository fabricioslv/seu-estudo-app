// services/pdfOptimizer.js
// Optimized PDF processing service for large files

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import { pipeline } from 'stream/promises';

class PDFOptimizer {
  constructor() {
    this.tempDir = path.join(process.cwd(), 'temp');
    this.createTempDir();
  }

  createTempDir() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  // Optimize PDF by reducing file size before processing
  async optimizePDF(inputPath, outputPath = null) {
    return new Promise((resolve, reject) => {
      if (!outputPath) {
        const ext = path.extname(inputPath);
        const name = path.basename(inputPath, ext);
        outputPath = path.join(this.tempDir, `${name}_optimized${ext}`);
      }

      // Check if Ghostscript is available (for PDF optimization)
      const ghostscriptAvailable = this.checkGhostscript();

      if (ghostscriptAvailable) {
        // Use Ghostscript to optimize PDF
        const gs = spawn('gswin64c', [  // Windows Ghostscript command
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          '-dPDFSETTINGS=/default',
          '-dNOPAUSE',
          '-dQUIET',
          '-dBATCH',
          `-sOutputFile=${outputPath}`,
          inputPath
        ]);

        gs.on('close', (code) => {
          if (code === 0) {
            resolve(outputPath);
          } else {
            // If Ghostscript fails, return original file
            console.warn('Ghostscript optimization failed, using original PDF');
            resolve(inputPath);
          }
        });

        gs.on('error', () => {
          // If Ghostscript is not available, return original file
          console.warn('Ghostscript not available, using original PDF');
          resolve(inputPath);
        });
      } else {
        // Ghostscript not available, return original
        console.warn('Ghostscript not found, using original PDF');
        resolve(inputPath);
      }
    });
  }

  checkGhostscript() {
    try {
      // Try to execute ghostscript command to check if it's available
      const { spawnSync } = require('child_process');
      const result = spawnSync('gswin64c', ['--version'], { stdio: 'pipe' });
      return result.status === 0;
    } catch (e) {
      try {
        // For Linux/Mac
        const { spawnSync } = require('child_process');
        const result = spawnSync('gs', ['--version'], { stdio: 'pipe' });
        return result.status === 0;
      } catch (e2) {
        return false;
      }
    }
  }

  // Split large PDF into smaller chunks for processing
  async splitPDF(inputPath, chunkSize = 20) { // Default: 20 pages per chunk
    const chunks = [];
    const pdfjsLib = await this.loadPDFLib();

    try {
      const dataBuffer = fs.readFileSync(inputPath);
      const pdf = await pdfjsLib.getDocument({ data: dataBuffer }).promise;
      const totalPages = pdf.numPages;

      for (let start = 1; start <= totalPages; start += chunkSize) {
        const end = Math.min(start + chunkSize - 1, totalPages);
        const chunkPath = path.join(
          this.tempDir,
          `${path.basename(inputPath, '.pdf')}_chunk_${start}-${end}.pdf`
        );

        chunks.push({
          path: chunkPath,
          startPage: start,
          endPage: end,
          totalPages: end - start + 1
        });
      }

      return chunks;
    } catch (error) {
      console.error('Error splitting PDF:', error);
      // Return single chunk if splitting fails
      return [{
        path: inputPath,
        startPage: 1,
        endPage: 1,
        totalPages: 1
      }];
    }
  }

  async loadPDFLib() {
    // Dynamically import pdfjs-dist
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.js');
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.4.120/pdf.worker.min.js`;
    return pdfjsLib;
  }

  // Process PDF in chunks for memory efficiency
  async processLargePDF(filePath, processorFunction, options = {}) {
    const { chunkSize = 20, optimizeFirst = true } = options;

    let workingPath = filePath;

    // First, optimize the PDF if requested
    if (optimizeFirst) {
      workingPath = await this.optimizePDF(filePath);
    }

    // Check if the file is large (more than chunkSize pages)
    const pdfjsLib = await this.loadPDFLib();
    const dataBuffer = fs.readFileSync(workingPath);
    const pdf = await pdfjsLib.getDocument({ data: dataBuffer }).promise;
    const totalPages = pdf.numPages;

    if (totalPages > chunkSize) {
      // Split into chunks and process each
      const chunks = await this.splitPDF(workingPath, chunkSize);
      const results = [];

      for (const chunk of chunks) {
        console.log(`Processando chunk ${chunk.startPage}-${chunk.endPage} de ${totalPages} páginas`);

        // Process each chunk separately
        const chunkResult = await processorFunction(chunk.path, {
          startPage: chunk.startPage,
          endPage: chunk.endPage
        });

        results.push(chunkResult);
      }

      // Combine results from all chunks
      return this.combineChunkResults(results);
    } else {
      // Process small PDF normally
      return await processorFunction(workingPath);
    }
  }

  combineChunkResults(chunkResults) {
    // Combine all chunks into a single result
    // This is a simplified approach - in practice, you might need
    // more sophisticated combination logic based on your needs
    const combined = {
      questoes: [],
      stats: {
        totalProcessed: 0,
        errors: 0
      }
    };

    for (const chunk of chunkResults) {
      if (chunk.questoes) {
        combined.questoes.push(...chunk.questoes);
      }
      if (chunk.stats) {
        combined.stats.totalProcessed += chunk.stats.totalProcessed || 0;
        combined.stats.errors += chunk.stats.errors || 0;
      }
    }

    return combined;
  }

  // Cleanup temporary files
  cleanup() {
    try {
      const files = fs.readdirSync(this.tempDir);
      for (const file of files) {
        if (file.includes('_optimized') || file.includes('_chunk_')) {
          fs.unlinkSync(path.join(this.tempDir, file));
        }
      }
      console.log('Arquivos temporários de otimização PDF limpos');
    } catch (error) {
      console.error('Erro ao limpar arquivos temporários:', error);
    }
  }
}

const pdfOptimizer = new PDFOptimizer();
export default pdfOptimizer;
