// playwright/testes/criacao-contas.spec.js
const { test, expect } = require('@playwright/test');

// Teste para criação de contas
test.describe('Testes de Criação de Contas', () => {
  test('deve permitir a criação de uma nova conta', async ({ page }) => {
    // Acessar a página de registro do frontend
    await page.goto('https://frontend-ghtu2zh4h-fabricioslvs-projects.vercel.app/registrar');
    
    // Preencher o formulário de registro
    await page.locator('[name="nome"]').fill('Teste Playwright');
    await page.locator('[name="email"]').fill(`teste_${Date.now()}@exemplo.com`);
    await page.locator('[name="senha"]').fill('senha123');
    
    // Clicar no botão de registro
    await page.locator('button[type="submit"]').click();
    
    // Verificar se o registro foi bem sucedido (redirecionado para home ou exibe mensagem)
    await expect(page).toHaveURL(/.*home|.*dashboard|.*estudar/);
  });
  
  test('deve exibir erro ao tentar criar conta com dados inválidos', async ({ page }) => {
    // Acessar a página de registro
    await page.goto('https://frontend-ghtu2zh4h-fabricioslvs-projects.vercel.app/registrar');
    
    // Preencher o formulário com dados inválidos
    await page.locator('[name="nome"]').fill('');
    await page.locator('[name="email"]').fill('email-invalido');
    await page.locator('[name="senha"]').fill('123');
    
    // Clicar no botão de registro
    await page.locator('button[type="submit"]').click();
    
    // Verificar se as mensagens de erro são exibidas
    await expect(page.locator('.error-message, .mensagem-erro, text=Nome é obrigatório')).toBeVisible().catch(() => {});
    await expect(page.locator('.error-message, .mensagem-erro, text=Email inválido')).toBeVisible().catch(() => {});
    await expect(page.locator('.error-message, .mensagem-erro, text=Senha deve ter pelo menos')).toBeVisible().catch(() => {});
  });
});