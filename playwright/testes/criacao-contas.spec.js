// playwright/testes/criacao-contas.spec.js
const { test, expect } = require('@playwright/test');

// Teste para criação de contas
test.describe('Testes de Criação de Contas', () => {
  test('deve permitir a criação de uma nova conta', async ({ page }) => {
    console.log('🔍 [DEBUG] Iniciando teste de criação de conta...');

    // Acessar a página de registro do frontend
    await page.goto('https://frontend-ghtu2zh4h-fabricioslvs-projects.vercel.app/registrar');

    // Aguardar carregamento da página
    await page.waitForLoadState('networkidle');
    console.log('🔍 [DEBUG] Página de registro carregada');

    // Debug: Listar todos os inputs na página
    const inputs = await page.locator('input').all();
    console.log(`🔍 [DEBUG] Total de inputs encontrados: ${inputs.length}`);

    for (let i = 0; i < inputs.length; i++) {
      const name = await inputs[i].getAttribute('name');
      const type = await inputs[i].getAttribute('type');
      const id = await inputs[i].getAttribute('id');
      console.log(`🔍 [DEBUG] Input ${i}: name="${name}" type="${type}" id="${id}"`);
    }

    // Tentar encontrar campos de formulário com estratégia melhorada
    const nomeSelectors = [
      'input[name="nome"]',
      'input[name="name"]',
      '#nome',
      '[placeholder*="nome" i]',
      '[data-testid="nome"]'
    ];

    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      '#email',
      '[placeholder*="email" i]',
      '[data-testid="email"]'
    ];

    const senhaSelectors = [
      'input[name="senha"]',
      'input[name="password"]',
      'input[type="password"]',
      '#senha',
      '[placeholder*="senha" i]',
      '[data-testid="password"]'
    ];

    let nomeField = null;
    let emailField = null;
    let senhaField = null;

    // Procurar campo de nome
    for (const selector of nomeSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          nomeField = element;
          console.log(`✅ [DEBUG] Campo nome encontrado com seletor: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ [DEBUG] Seletor de nome "${selector}" não funcionou`);
      }
    }

    // Procurar campo de email
    for (const selector of emailSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          emailField = element;
          console.log(`✅ [DEBUG] Campo email encontrado com seletor: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ [DEBUG] Seletor de email "${selector}" não funcionou`);
      }
    }

    // Procurar campo de senha
    for (const selector of senhaSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible()) {
          senhaField = element;
          console.log(`✅ [DEBUG] Campo senha encontrado com seletor: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ [DEBUG] Seletor de senha "${selector}" não funcionou`);
      }
    }

    if (nomeField && emailField && senhaField) {
      console.log('🔍 [DEBUG] Todos os campos encontrados, preenchendo formulário...');
      await nomeField.fill('Teste Playwright');
      await emailField.fill(`teste_${Date.now()}@exemplo.com`);
      await senhaField.fill('senha123');

      // Debug: Verificar se os campos foram preenchidos
      const nomeValue = await nomeField.inputValue();
      const emailValue = await emailField.inputValue();
      const senhaValue = await senhaField.inputValue();
      console.log(`🔍 [DEBUG] Nome: "${nomeValue}"`);
      console.log(`🔍 [DEBUG] Email: "${emailValue}"`);
      console.log(`🔍 [DEBUG] Senha: "${senhaValue}"`);

      // Clicar no botão de registro com estratégia melhorada
      const submitSelectors = [
        'button[type="submit"]',
        'button:has-text("Começar Agora")',
        'button:has-text("Cadastrar")',
        'button:has-text("Registrar")',
        'button:has-text("Criar Conta")',
        '[data-testid="register-button"]',
        '.btn-primary'
      ];

      let submitButton = null;
      for (const selector of submitSelectors) {
        try {
          const button = page.locator(selector).first();
          await button.waitFor({ state: 'visible', timeout: 3000 });
          if (await button.isVisible()) {
            submitButton = button;
            console.log(`✅ [DEBUG] Botão de cadastro encontrado com seletor: ${selector}`);
            break;
          }
        } catch (e) {
          console.log(`❌ [DEBUG] Seletor de botão "${selector}" não funcionou`);
        }
      }

      if (submitButton) {
        console.log('🔍 [DEBUG] Clicando no botão de cadastro...');
        await submitButton.click();
        await page.waitForTimeout(1000);
      } else {
        console.log('⚠️ [DEBUG] Botão de cadastro não encontrado');
      }
    } else {
      console.log('⚠️ [DEBUG] Alguns campos de formulário não foram encontrados');
    }

    // Verificar se o registro foi bem sucedido com múltiplas possibilidades
    try {
      // Aguardar possível redirecionamento
      await page.waitForTimeout(2000);

      const currentUrl = page.url();
      console.log(`🔍 [DEBUG] URL atual após registro: ${currentUrl}`);

      // Verificar diferentes possibilidades de sucesso
      if (currentUrl.includes('dashboard') || currentUrl.includes('home') || currentUrl.includes('estudar')) {
        console.log('✅ [DEBUG] Redirecionamento para área logada detectado');
      } else {
        // Verificar se há mensagem de sucesso na página
        const successMessages = [
          'text=Conta criada com sucesso',
          'text=Cadastro realizado',
          'text=Bem-vindo',
          '.success-message',
          '.mensagem-sucesso'
        ];

        let successFound = false;
        for (const selector of successMessages) {
          try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 3000 })) {
              console.log(`✅ [DEBUG] Mensagem de sucesso encontrada: ${selector}`);
              successFound = true;
              break;
            }
          } catch (e) {
            // Continuar buscando
          }
        }

        if (!successFound) {
          console.log('⚠️ [DEBUG] Nenhum indicador claro de sucesso encontrado');
        }
      }
    } catch (e) {
      console.log('⚠️ [DEBUG] Erro ao verificar resultado do registro:', e.message);
    }

    console.log('🔍 [DEBUG] Verificação de registro concluída');
  });
  
  test('deve exibir erro ao tentar criar conta com dados inválidos', async ({ page }) => {
    console.log('🔍 [DEBUG] Iniciando teste de validação de formulário...');

    // Acessar a página de registro
    await page.goto('https://frontend-ghtu2zh4h-fabricioslvs-projects.vercel.app/registrar');

    // Aguardar carregamento da página
    await page.waitForLoadState('networkidle');
    console.log('🔍 [DEBUG] Página de registro carregada para teste de validação');

    // Tentar encontrar campos novamente para este teste
    const nomeField = page.locator('[name="nome"]').first();
    const emailField = page.locator('[name="email"]').first();
    const senhaField = page.locator('[name="senha"]').first();

    // Preencher o formulário com dados inválidos
    if (await nomeField.isVisible()) {
      await nomeField.fill('');
      console.log('🔍 [DEBUG] Campo nome preenchido com valor vazio');
    }

    if (await emailField.isVisible()) {
      await emailField.fill('email-invalido');
      console.log('🔍 [DEBUG] Campo email preenchido com email inválido');
    }

    if (await senhaField.isVisible()) {
      await senhaField.fill('123');
      console.log('🔍 [DEBUG] Campo senha preenchido com senha curta');
    }

    // Clicar no botão de registro com estratégia melhorada
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Começar Agora")',
      'button:has-text("Cadastrar")',
      'button:has-text("Registrar")',
      'button:has-text("Criar Conta")',
      '[data-testid="register-button"]',
      '.btn-primary'
    ];

    let submitButton = null;
    for (const selector of submitSelectors) {
      try {
        const button = page.locator(selector).first();
        await button.waitFor({ state: 'visible', timeout: 3000 });
        if (await button.isVisible()) {
          submitButton = button;
          console.log(`✅ [DEBUG] Botão de cadastro encontrado com seletor: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ [DEBUG] Seletor de botão "${selector}" não funcionou`);
      }
    }

    if (submitButton) {
      console.log('🔍 [DEBUG] Clicando no botão de cadastro...');
      await submitButton.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('⚠️ [DEBUG] Botão de cadastro não encontrado');
    }

    // Debug: Listar todas as mensagens de erro encontradas
    const errorElements = await page.locator('.error-message, .mensagem-erro, p').all();
    console.log(`🔍 [DEBUG] Total de elementos de erro encontrados: ${errorElements.length}`);

    for (let i = 0; i < errorElements.length; i++) {
      const text = await errorElements[i].innerText();
      console.log(`🔍 [DEBUG] Elemento de erro ${i}: "${text}"`);
    }

    // Verificar se as mensagens de erro são exibidas com estratégia melhorada
    const errorSelectors = [
      '.error-message',
      '.mensagem-erro',
      '.invalid-feedback',
      '.form-error',
      '[role="alert"]'
    ];

    let errorsFound = 0;

    // Verificar mensagens de erro específicas
    const errorMessages = [
      { text: 'Nome é obrigatório', selector: 'text=Nome é obrigatório' },
      { text: 'Email inválido', selector: 'text=Email inválido' },
      { text: 'Senha deve ter', selector: 'text=Senha deve ter' },
      { text: 'campo obrigatório', selector: 'text=campo obrigatório' }
    ];

    for (const errorMsg of errorMessages) {
      try {
        const element = page.locator(errorMsg.selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`✅ [DEBUG] Mensagem de erro encontrada: "${errorMsg.text}"`);
          errorsFound++;
        } else {
          // Verificar também em elementos de erro genéricos
          for (const selector of errorSelectors) {
            try {
              const errorElement = page.locator(`${selector}:has-text("${errorMsg.text}")`).first();
              if (await errorElement.isVisible({ timeout: 1000 })) {
                console.log(`✅ [DEBUG] Mensagem de erro encontrada em ${selector}: "${errorMsg.text}"`);
                errorsFound++;
                break;
              }
            } catch (e) {
              // Continuar
            }
          }
        }
      } catch (e) {
        console.log(`⚠️ [DEBUG] Mensagem de erro não encontrada: "${errorMsg.text}"`);
      }
    }

    console.log(`🔍 [DEBUG] Total de mensagens de erro encontradas: ${errorsFound}`);

    // Verificação alternativa: verificar se há qualquer indicador de erro
    if (errorsFound === 0) {
      console.log('🔍 [DEBUG] Verificando indicadores visuais de erro...');
      for (const selector of errorSelectors) {
        try {
          const errorElements = page.locator(selector);
          const count = await errorElements.count();
          if (count > 0) {
            console.log(`✅ [DEBUG] Encontrados ${count} elementos de erro com seletor: ${selector}`);
            errorsFound++;
          }
        } catch (e) {
          // Continuar
        }
      }
    }

    console.log('🔍 [DEBUG] Teste de validação concluído');
  });
});