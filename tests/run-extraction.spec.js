// tests/run-extraction.spec.js
// Este é um script de uso único para acionar a extração em massa de PDFs.
const { test, expect } = require('@playwright/test');

// --- Configuração do Usuário ---
// Usaremos um usuário único para esta operação para garantir que temos um token válido.
const userEmail = `extractor_${Date.now()}@example.com`;
const userName = 'Extractor User';
const userPassword = 'password123';

test.describe('Script de Gatilho para Extração em Massa', () => {
  test('deve logar e acionar o endpoint de extração local', async ({ page, request }) => {
    test.setTimeout(180 * 1000); // Aumenta o timeout do teste para 3 minutos

    // --- ETAPA 1: Garantir um usuário e obter um token ---
    console.log('Registrando um usuário temporário para obter token...');

    // Reutiliza a lógica de registro do nosso teste de autenticação
    await page.goto('/register');
    await page.getByLabel('Nome').fill(userName);
    await page.getByLabel('Email').fill(userEmail);
    await page.getByLabel('Senha').fill(userPassword);

    // Intercepta a resposta da API de registro
    const [registerResponse] = await Promise.all([
      page.waitForResponse(res => res.url().includes('/api/auth/register')),
      page.getByRole('button', { name: 'Registrar' }).click(),
    ]);

    const responseStatus = registerResponse.status();
    const registerResponseBody = await registerResponse.json();
    console.log(`API de Registro - Status: ${responseStatus}, Body: ${JSON.stringify(registerResponseBody)}`);

    await expect(page).toHaveURL('/'); // Confirma que o login/registro foi bem-sucedido

    // Pega o token do localStorage do navegador
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy(); // Garante que o token foi encontrado
    console.log('Token obtido com sucesso.');

    // --- ETAPA 2: Acionar o endpoint de extração ---
    console.log('Acionando o endpoint /api/questoes/extract-local-files...');

    const response = await request.post('http://localhost:6001/api/questoes/extract-local-files', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      // Aumenta o timeout para esta requisição específica, pois pode demorar
      timeout: 180 * 1000, // 3 minutos
    });

    // --- ETAPA 3: Exibir o resultado ---
    expect(response.ok()).toBeTruthy();
    const responseBody = await response.json();

    console.log('\n--- RESULTADO DA EXTRAÇÃO V11 ---\n');
    console.log(responseBody.msg);
    console.log(`Total de questões encontradas: ${responseBody.totalQuestoes}`);
    console.log(JSON.stringify(responseBody.questoes, null, 2));
    console.log('\n--- FIM DO RESULTADO ---\n');
  });
});
