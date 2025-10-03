// playwright/testes/responsividade.spec.js
const { test, expect } = require('@playwright/test');

// Teste para verificar responsividade em diferentes tamanhos de tela
test.describe('Testes de Responsividade', () => {
  test('deve funcionar corretamente em dispositivos móveis', async ({ page }) => {
    // Definir viewport para dispositivo móvel
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Acessar a página inicial
    await page.goto('https://frontend-ghtu2zh4h-fabricioslvs-projects.vercel.app/');
    
    // Verificar se elementos principais estão presentes
    await expect(page.locator('h1', { hasText: 'Seu-Estudo' })).toBeVisible();
    
    // Verificar se o header está visível
    await expect(page.locator('.homepage-header')).toBeVisible();
  });
  
  test('deve funcionar corretamente em tablets', async ({ page }) => {
    // Definir viewport para tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    
    // Acessar a página inicial
    await page.goto('https://frontend-ghtu2zh4h-fabricioslvs-projects.vercel.app/');
    
    // Verificar se elementos principais estão presentes
    await expect(page.locator('h1', { hasText: 'Seu-Estudo' })).toBeVisible();
    
    // Verificar se o header está visível
    await expect(page.locator('.homepage-header')).toBeVisible();
  });
  
  test('deve funcionar corretamente em desktop', async ({ page }) => {
    // Definir viewport para desktop
    await page.setViewportSize({ width: 1280, height: 800 });
    
    // Acessar a página inicial
    await page.goto('https://frontend-ghtu2zh4h-fabricioslvs-projects.vercel.app/');
    
    // Verificar se elementos principais estão presentes
    await expect(page.locator('h1', { hasText: 'Seu-Estudo' })).toBeVisible();
    
    // Verificar se o header está visível
    await expect(page.locator('.homepage-header')).toBeVisible();
  });
});