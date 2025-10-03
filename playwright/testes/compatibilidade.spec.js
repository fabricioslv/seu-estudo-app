// playwright/testes/compatibilidade.spec.js
const { test, expect } = require('@playwright/test');

// Teste para verificar compatibilidade cross-browser
test.describe('Testes de Compatibilidade Cross-Browser', () => {
  test('deve funcionar no Chrome', async ({ page }) => {
    // Acessar a página inicial
    await page.goto('https://frontend-ghtu2zh4h-fabricioslvs-projects.vercel.app/');
    
    // Verificar se elementos principais estão presentes
    await expect(page.locator('h1', { hasText: 'Seu-Estudo' })).toBeVisible();
    
    // Verificar se o header está presente
    await expect(page.locator('.homepage-header')).toBeVisible();
    
    // Verificar se o footer está presente
    await expect(page.locator('.homepage-footer')).toBeVisible();
  });
  
  test('deve funcionar no Firefox', async ({ page }) => {
    // Este teste será executado no Firefox através da configuração do Playwright
    // Acessar a página inicial
    await page.goto('https://frontend-ghtu2zh4h-fabricioslvs-projects.vercel.app/');
    
    // Verificar se elementos principais estão presentes
    await expect(page.locator('h1', { hasText: 'Seu-Estudo' })).toBeVisible();
    
    // Verificar se o header está presente
    await expect(page.locator('.homepage-header')).toBeVisible();
    
    // Verificar se o footer está presente
    await expect(page.locator('.homepage-footer')).toBeVisible();
  });
  
  test('deve funcionar no Safari', async ({ page }) => {
    // Este teste será executado no Safari através da configuração do Playwright
    // Acessar a página inicial
    await page.goto('https://frontend-ghtu2zh4h-fabricioslvs-projects.vercel.app/');
    
    // Verificar se elementos principais estão presentes
    await expect(page.locator('h1', { hasText: 'Seu-Estudo' })).toBeVisible();
    
    // Verificar se o header está presente
    await expect(page.locator('.homepage-header')).toBeVisible();
    
    // Verificar se o footer está presente
    await expect(page.locator('.homepage-footer')).toBeVisible();
  });
});