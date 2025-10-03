// playwright.config.js
const { defineConfig } = require('@playwright/test');

module.exports = defineConfig({
  // Diretório raiz dos testes
  testDir: './playwright/testes',
  
  // Timeout para cada teste (30 segundos)
  timeout: 30000,
  
  // Número de vezes para executar os testes
  retries: 1,
  
  // Configurações para execução em paralelo
  workers: 1, // Reduzido para 1 worker para evitar problemas de rate limit
  
  // Projetos para diferentes navegadores
  projects: [
    {
      name: 'chromium',
      use: {
        browserName: 'chromium',
        // Navegador em modo headless (mudar para false para ver os testes em ação)
        headless: true,
      },
    },
    {
      name: 'firefox',
      use: {
        browserName: 'firefox',
        headless: true,
      },
    },
    {
      name: 'webkit',
      use: {
        browserName: 'webkit',
        headless: true,
      },
    },
  ],
  
  // Configurações do navegador
  use: {
    // Timeout para cada ação (5 segundos)
    actionTimeout: 5000,
    
    // Configurações de viewport
    viewport: { width: 1280, height: 720 },
    
    // Permitir permissões
    ignoreHTTPSErrors: true,
    
    // Coletar traces para depuração
    trace: 'on-first-retry',
    
    // Coletar screenshots em caso de falha
    screenshot: 'only-on-failure',
    
    // Coletar vídeos para os testes que falharem
    video: 'retry-with-video',
  },
  
  // Configurações de relatórios
  reporter: [
    ['html', { open: 'never' }], // Gera relatório HTML mas não abre automaticamente
    ['list'] // Mostra resultados no console
  ],
  
  // Opções de execução
  expect: {
    // Timeout padrão para expectativas
    timeout: 5000,
  },
});