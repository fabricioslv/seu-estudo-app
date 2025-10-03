// tests/auth.spec.js
const { test, expect } = require('@playwright/test');

test.describe('Fluxo de Autenticação', () => {
  // Gera um email único para cada execução do teste para evitar conflitos
  const userEmail = `user_${Date.now()}@example.com`;
  const userName = 'Test User';
  const userPassword = 'password123';

  test('deve permitir que um usuário se registre, faça logout e faça login novamente', async ({ page }) => {
    // --- 1. Registro ---
    await page.goto('/register');

    // Preenche o formulário de registro
    await page.getByLabel('Nome').fill(userName);
    await page.getByLabel('Email').fill(userEmail);
    await page.getByLabel('Senha').fill(userPassword);

    // Clica no botão de registro
    await page.getByRole('button', { name: 'Registrar' }).click();

    // Verifica se o redirecionamento para a página inicial funcionou
    await expect(page).toHaveURL('/');
    // Verifica se o botão de logout está visível, confirmando o login
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();

    // --- 2. Logout ---
    await page.getByRole('button', { name: 'Sair' }).click();

    // Verifica se foi redirecionado para a página de login
    await expect(page).toHaveURL('/login');
    // Verifica se o link de login está visível novamente
    await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();

    // --- 3. Login ---
    // Preenche o formulário de login
    await page.getByLabel('Email').fill(userEmail);
    await page.getByLabel('Senha').fill(userPassword);

    // Clica no botão de login
    await page.getByRole('button', { name: 'Entrar' }).click();

    // Verifica se o redirecionamento para a página inicial funcionou novamente
    await expect(page).toHaveURL('/');
    await expect(page.getByRole('button', { name: 'Sair' })).toBeVisible();
  });
});
