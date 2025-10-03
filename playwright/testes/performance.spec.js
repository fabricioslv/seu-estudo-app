// playwright/testes/performance.spec.js
const { test, expect } = require('@playwright/test');

// Teste para verificar performance de loading
test.describe('Testes de Performance', () => {
  test('deve carregar a página inicial rapidamente', async ({ page }) => {
    // Medir tempo de carregamento
    const startTime = Date.now();
    
    // Acessar a página inicial
    await page.goto('https://frontend-ghtu2zh4h-fabricioslvs-projects.vercel.app/');
    
    const loadTime = Date.now() - startTime;
    
    // Verificar se a página carregou em menos de 5 segundos
    expect(loadTime).toBeLessThan(5000);
    
    // Verificar se elementos principais estão presentes
    await expect(page.locator('h1', { hasText: 'Seu-Estudo' })).toBeVisible();
    
    // Verificar se o header está presente
    await expect(page.locator('.homepage-header')).toBeVisible();
    
    // Verificar se o footer está presente
    await expect(page.locator('.homepage-footer')).toBeVisible();
  });
  
  test('deve carregar imagens otimizadas', async ({ page }) => {
    // Acessar a página inicial
    await page.goto('https://frontend-ghtu2zh4h-fabricioslvs-projects.vercel.app/');
    
    // Verificar se há imagens na página
    const images = await page.locator('img').all();
    
    // Verificar se todas as imagens têm atributos alt
    for (const image of images) {
      const altText = await image.getAttribute('alt');
      expect(altText).not.toBeNull();
    }
  });
  
  test('deve ter JavaScript otimizado', async ({ page }) => {
    // Acessar a página inicial
    await page.goto('https://frontend-ghtu2zh4h-fabricioslvs-projects.vercel.app/');
    
    // Verificar se não há erros de JavaScript no console
    const jsErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        jsErrors.push(msg.text());
      }
    });
    
    // Interagir com a página para verificar funcionalidade
    await page.click('text=Entrar');
    
    // Verificar se não houve erros de JavaScript
    expect(jsErrors.length).toBe(0);
  });
});