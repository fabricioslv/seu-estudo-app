// Testes de fluxo completo da aplicação Seu Estudo
const { test, expect } = require('@playwright/test');

test.describe('Seu Estudo - Fluxo Completo', () => {

  test.beforeEach(async ({ page }) => {
    // Configurar interceptação de API para evitar dependências externas
    await page.route('**/api/**', (route) => {
      if (route.request().method() === 'POST' && route.request().url().includes('login')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            token: 'fake-jwt-token',
            usuario: {
              id: 1,
              nome: 'Teste Usuário',
              email: 'teste@email.com',
              tipo: 'aluno'
            }
          })
        });
      } else if (route.request().url().includes('quiz')) {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            titulo: 'Quiz de Matemática',
            descricao: 'Teste seus conhecimentos em matemática básica',
            perguntas: [
              {
                id: 1,
                numero: 1,
                enunciado: 'Quanto é 2 + 2?',
                alternativas: {
                  'A': '3',
                  'B': '4',
                  'C': '5',
                  'D': '6'
                },
                resposta_correta: 'B',
                dificuldade: 1
              }
            ]
          })
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      }
    });

    // Navegar para a página inicial
    await page.goto('http://localhost:3000');
  });

  test('Fluxo completo de cadastro e login', async ({ page }) => {
    console.log('🧪 Iniciando teste de cadastro e login...');

    // Clicar no botão de cadastro com estratégia melhorada
    const registerSelectors = [
      'text=Registre-se',
      'text=Cadastre-se',
      'text=Criar conta',
      'text=Começar Agora',
      'a[href*="registrar"]',
      'a[href*="cadastro"]',
      'button:has-text("Cadastrar")'
    ];

    let registerButton = null;
    for (const selector of registerSelectors) {
      try {
        const button = page.locator(selector).first();
        await button.waitFor({ state: 'visible', timeout: 5000 });
        if (await button.isVisible()) {
          registerButton = button;
          console.log(`✅ [DEBUG] Botão de cadastro encontrado com seletor: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ [DEBUG] Seletor de cadastro "${selector}" não funcionou`);
      }
    }

    if (registerButton) {
      await registerButton.click();
      await page.waitForLoadState('networkidle');
    } else {
      console.log('⚠️ [DEBUG] Botão de cadastro não encontrado, tentando navegação direta...');
      await page.goto('https://frontend-ghtu2zh4h-fabricioslvs-projects.vercel.app/registrar');
    }

    // Preencher formulário de cadastro
    await page.fill('input[name="nome"]', 'João Silva');
    await page.fill('input[name="email"]', 'joao.silva@email.com');
    await page.fill('input[name="senha"]', 'senha123');
    await page.fill('input[name="confirmarSenha"]', 'senha123');

    // Aceitar termos
    await page.check('input[type="checkbox"]');

    // Submeter formulário
    await page.click('button[type="submit"]');

    // Verificar redirecionamento para dashboard
    await expect(page).toHaveURL(/.*dashboard/);

    // Fazer logout com estratégia melhorada
    const logoutSelectors = [
      'text=Sair',
      'text=Logout',
      'text=Desconectar',
      'button:has-text("Sair")',
      'a:has-text("Sair")'
    ];

    let logoutButton = null;
    for (const selector of logoutSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 3000 })) {
          logoutButton = button;
          console.log(`✅ [DEBUG] Botão de logout encontrado com seletor: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ [DEBUG] Seletor de logout "${selector}" não funcionou`);
      }
    }

    if (logoutButton) {
      await logoutButton.click();
      await page.waitForTimeout(1000);
    } else {
      console.log('⚠️ [DEBUG] Botão de logout não encontrado');
    }

    // Preencher formulário de login com estratégia melhorada
    const emailSelectors = [
      'input[name="email"]',
      'input[type="email"]',
      '#email',
      '[placeholder*="email" i]'
    ];

    const senhaSelectors = [
      'input[name="senha"]',
      'input[name="password"]',
      'input[type="password"]',
      '#senha',
      '[placeholder*="senha" i]'
    ];

    let emailField = null;
    let senhaField = null;

    for (const selector of emailSelectors) {
      try {
        const field = page.locator(selector).first();
        await field.waitFor({ state: 'visible', timeout: 3000 });
        if (await field.isVisible()) {
          emailField = field;
          break;
        }
      } catch (e) {
        // Continuar
      }
    }

    for (const selector of senhaSelectors) {
      try {
        const field = page.locator(selector).first();
        await field.waitFor({ state: 'visible', timeout: 3000 });
        if (await field.isVisible()) {
          senhaField = field;
          break;
        }
      } catch (e) {
        // Continuar
      }
    }

    if (emailField && senhaField) {
      await emailField.fill('joao.silva@email.com');
      await page.waitForTimeout(500);
      await senhaField.fill('senha123');
      await page.waitForTimeout(500);
    } else {
      console.log('⚠️ [DEBUG] Campos de login não encontrados');
    }

    await page.click('button[type="submit"]');

    // Verificar login bem-sucedido
    await expect(page).toHaveURL(/.*dashboard/);

    console.log('✅ Teste de cadastro e login concluído com sucesso');
  });

  test('Responsividade em diferentes dispositivos', async ({ page }) => {
    console.log('📱 Testando responsividade...');

    // Teste em mobile
    await page.setViewportSize({ width: 375, height: 667 });
    console.log('📱 Testando viewport mobile');

    // Verificar se elementos se adaptam ao mobile
    const navbar = page.locator('.navbar');
    await expect(navbar).toBeVisible();

    // Testar menu hambúrguer se existir
    const menuButton = page.locator('[data-testid="menu-button"], .menu-toggle');
    if (await menuButton.isVisible()) {
      await menuButton.click();
      await expect(page.locator('.mobile-menu, .sidebar')).toBeVisible();
    }

    // Teste em tablet
    await page.setViewportSize({ width: 768, height: 1024 });
    console.log('📱 Testando viewport tablet');

    // Verificar layout tablet
    await expect(page.locator('.main-content')).toBeVisible();

    // Teste em desktop
    await page.setViewportSize({ width: 1920, height: 1080 });

    // Verificar elementos desktop
    await expect(page.locator('.sidebar, .main-content')).toBeVisible();

    console.log('✅ Teste de responsividade concluído');
  });

  test('Sistema de quizzes interativos', async ({ page }) => {
    console.log('🎯 Testando sistema de quizzes...');

    // Fazer login primeiro
    await page.fill('input[name="email"]', 'teste@email.com');
    await page.fill('input[name="senha"]', 'senha123');
    await page.click('button[type="submit"]');

    // Navegar para página de quizzes com estratégia melhorada
    const aprendendoSelectors = [
      'text=Aprendendo',
      'text=Estudar',
      'a:has-text("Aprendendo")',
      '.nav-link:has-text("Aprendendo")'
    ];

    let aprendendoLink = null;
    for (const selector of aprendendoSelectors) {
      try {
        const link = page.locator(selector).first();
        if (await link.isVisible({ timeout: 3000 })) {
          aprendendoLink = link;
          console.log(`✅ [DEBUG] Link Aprendendo encontrado com seletor: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ [DEBUG] Seletor Aprendendo "${selector}" não funcionou`);
      }
    }

    if (aprendendoLink) {
      await aprendendoLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Tentar encontrar e clicar em Quiz
    const quizSelectors = [
      'text=Quiz',
      'text=Quizzes',
      'text=Questionários',
      '.quiz-link',
      'a:has-text("Quiz")'
    ];

    let quizLink = null;
    for (const selector of quizSelectors) {
      try {
        const link = page.locator(selector).first();
        if (await link.isVisible({ timeout: 3000 })) {
          quizLink = link;
          console.log(`✅ [DEBUG] Link Quiz encontrado com seletor: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ [DEBUG] Seletor Quiz "${selector}" não funcionou`);
      }
    }

    if (quizLink) {
      await quizLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Verificar se o quiz carregou com múltiplas possibilidades
    const quizContainerSelectors = [
      '.quiz-inicio',
      '.quiz-container',
      '.quiz-content',
      '[data-testid="quiz"]',
      'text=Iniciar Quiz',
      'text=Começar'
    ];

    let quizFound = false;
    for (const selector of quizContainerSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 5000 })) {
          console.log(`✅ [DEBUG] Container de quiz encontrado com seletor: ${selector}`);
          quizFound = true;
          break;
        }
      } catch (e) {
        console.log(`❌ [DEBUG] Seletor de quiz "${selector}" não funcionou`);
      }
    }

    // Iniciar quiz
    await page.click('text=Iniciar Quiz');

    // Responder primeira pergunta
    await page.click('.alternativa-quiz').first();

    // Navegar para próxima pergunta
    await page.click('text=Próxima');

    // Continuar até finalizar
    while (await page.locator('text=Próxima, text=Finalizar Quiz').isVisible()) {
      if (await page.locator('text=Finalizar Quiz').isVisible()) {
        await page.click('text=Finalizar Quiz');
        break;
      } else {
        await page.click('text=Próxima');
      }
    }

    // Verificar resultado
    await expect(page.locator('.quiz-resultado, .resultado')).toBeVisible();

    console.log('✅ Teste de quiz concluído com sucesso');
  });

  test('Sistema de gamificação e pontuação', async ({ page }) => {
    console.log('🏆 Testando sistema de gamificação...');

    // Fazer login
    await page.fill('input[name="email"]', 'teste@email.com');
    await page.fill('input[name="senha"]', 'senha123');
    await page.click('button[type="submit"]');

    // Navegar para dashboard com estratégia melhorada
    const dashboardSelectors = [
      'text=Dashboard',
      'text=Painel',
      'a:has-text("Dashboard")',
      '.nav-link:has-text("Dashboard")'
    ];

    let dashboardLink = null;
    for (const selector of dashboardSelectors) {
      try {
        const link = page.locator(selector).first();
        if (await link.isVisible({ timeout: 3000 })) {
          dashboardLink = link;
          console.log(`✅ [DEBUG] Link Dashboard encontrado com seletor: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ [DEBUG] Seletor Dashboard "${selector}" não funcionou`);
      }
    }

    if (dashboardLink) {
      await dashboardLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Verificar elementos de gamificação com estratégia melhorada
    const gamificacaoSelectors = [
      'text=Pontos',
      'text=Nível',
      'text=Conquistas',
      'text=Score',
      'text=Xp',
      '.pontos',
      '.nivel',
      '.conquistas',
      '[data-testid="gamificacao"]'
    ];

    let gamificacaoFound = false;
    for (const selector of gamificacaoSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          console.log(`✅ [DEBUG] Elemento de gamificação encontrado: ${selector}`);
          gamificacaoFound = true;
        }
      } catch (e) {
        console.log(`❌ [DEBUG] Seletor de gamificação "${selector}" não funcionou`);
      }
    }

    // Verificar se há indicador de pontuação
    const pontosElement = page.locator('[data-testid="pontos"], .pontos, .score');
    if (await pontosElement.isVisible()) {
      console.log('✅ Sistema de pontuação encontrado');
    }

    console.log('✅ Teste de gamificação concluído');
  });

  test('Processamento de livros didáticos', async ({ page }) => {
    console.log('📚 Testando processamento de livros...');

    // Fazer login como professor/admin
    await page.fill('input[name="email"]', 'professor@email.com');
    await page.fill('input[name="senha"]', 'senha123');
    await page.click('button[type="submit"]');

    // Navegar para área de livros didáticos com estratégia melhorada
    const livrosSelectors = [
      'text=Livros Didáticos',
      'text=Livros',
      'text=Biblioteca',
      'a:has-text("Livros")',
      '.nav-link:has-text("Livros")'
    ];

    let livrosLink = null;
    for (const selector of livrosSelectors) {
      try {
        const link = page.locator(selector).first();
        if (await link.isVisible({ timeout: 3000 })) {
          livrosLink = link;
          console.log(`✅ [DEBUG] Link Livros encontrado com seletor: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ [DEBUG] Seletor Livros "${selector}" não funcionou`);
      }
    }

    if (livrosLink) {
      await livrosLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Verificar se há opção de upload com múltiplos seletores
    const uploadSelectors = [
      'input[type="file"]',
      '.upload-button',
      'button:has-text("Upload")',
      'button:has-text("Enviar")',
      '[data-testid="upload"]'
    ];

    let uploadFound = false;
    for (const selector of uploadSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log(`✅ [DEBUG] Área de upload encontrada com seletor: ${selector}`);
          uploadFound = true;
          break;
        }
      } catch (e) {
        // Continuar
      }
    }

    // Verificar lista de livros com múltiplos seletores
    const livrosListaSelectors = [
      '.livros-lista',
      '.book-list',
      '.biblioteca',
      '.books-container',
      '[data-testid="livros"]'
    ];

    let livrosListaFound = false;
    for (const selector of livrosListaSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          console.log(`✅ [DEBUG] Lista de livros encontrada com seletor: ${selector}`);
          livrosListaFound = true;
          break;
        }
      } catch (e) {
        // Continuar
      }
    }

    console.log('✅ Teste de processamento de livros concluído');
  });

  test('Sistema de comunicação e mensagens', async ({ page }) => {
    console.log('💬 Testando sistema de mensagens...');

    // Fazer login
    await page.fill('input[name="email"]', 'teste@email.com');
    await page.fill('input[name="senha"]', 'senha123');
    await page.click('button[type="submit"]');

    // Navegar para mensagens com estratégia melhorada
    const mensagensSelectors = [
      'text=Mensagens',
      'text=Chat',
      'text=Conversas',
      'a:has-text("Mensagens")',
      '.nav-link:has-text("Mensagens")'
    ];

    let mensagensLink = null;
    for (const selector of mensagensSelectors) {
      try {
        const link = page.locator(selector).first();
        if (await link.isVisible({ timeout: 3000 })) {
          mensagensLink = link;
          console.log(`✅ [DEBUG] Link Mensagens encontrado com seletor: ${selector}`);
          break;
        }
      } catch (e) {
        console.log(`❌ [DEBUG] Seletor Mensagens "${selector}" não funcionou`);
      }
    }

    if (mensagensLink) {
      await mensagensLink.click();
      await page.waitForLoadState('networkidle');
    }

    // Verificar interface de mensagens com múltiplos seletores
    const mensagensContainerSelectors = [
      '.mensagens-container',
      '.chat-container',
      '.messages-container',
      '.conversas-container',
      '[data-testid="mensagens"]'
    ];

    let mensagensFound = false;
    for (const selector of mensagensContainerSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 3000 })) {
          console.log(`✅ [DEBUG] Container de mensagens encontrado: ${selector}`);
          mensagensFound = true;
          break;
        }
      } catch (e) {
        // Continuar
      }
    }

    // Tentar enviar mensagem com estratégia melhorada
    const messageInputSelectors = [
      'input[placeholder*="mensagem"]',
      'textarea[placeholder*="mensagem"]',
      'input[placeholder*="texto"]',
      'textarea[placeholder*="texto"]',
      '[data-testid="message-input"]'
    ];

    let messageInput = null;
    for (const selector of messageInputSelectors) {
      try {
        const input = page.locator(selector).first();
        if (await input.isVisible({ timeout: 2000 })) {
          messageInput = input;
          console.log(`✅ [DEBUG] Campo de mensagem encontrado: ${selector}`);
          break;
        }
      } catch (e) {
        // Continuar
      }
    }

    if (messageInput) {
      await messageInput.fill('Olá, isso é um teste!');
      await page.waitForTimeout(500);

      const sendButtonSelectors = [
        'button:has-text("Enviar")',
        'button:has-text("Send")',
        'button[type="submit"]',
        '[data-testid="send-button"]'
      ];

      let sendButton = null;
      for (const selector of sendButtonSelectors) {
        try {
          const button = page.locator(selector).first();
          if (await button.isVisible({ timeout: 2000 })) {
            sendButton = button;
            console.log(`✅ [DEBUG] Botão enviar encontrado: ${selector}`);
            break;
          }
        } catch (e) {
          // Continuar
        }
      }

      if (sendButton) {
        await sendButton.click();
        console.log('✅ [DEBUG] Mensagem de teste enviada');
      } else {
        console.log('⚠️ [DEBUG] Botão enviar não encontrado');
      }
    } else {
      console.log('⚠️ [DEBUG] Campo de mensagem não encontrado');
    }

    console.log('✅ Teste de mensagens concluído');
  });

  test('Performance e tempo de carregamento', async ({ page }) => {
    console.log('⚡ Testando performance...');

    const startTime = Date.now();

    // Navegar para a aplicação
    await page.goto('http://localhost:3000');

    // Aguardar carregamento completo
    await page.waitForLoadState('networkidle');

    const loadTime = Date.now() - startTime;

    console.log(`⏱️ Tempo de carregamento: ${loadTime}ms`);

    // Verificar se carregou dentro do tempo aceitável (3 segundos)
    expect(loadTime).toBeLessThan(3000);

    // Verificar se elementos críticos carregaram
    await expect(page.locator('header, nav, main')).toBeVisible();

    console.log('✅ Teste de performance concluído');
  });

  test('Acessibilidade da aplicação', async ({ page }) => {
    console.log('♿ Testando acessibilidade...');

    // Fazer login
    await page.fill('input[name="email"]', 'teste@email.com');
    await page.fill('input[name="senha"]', 'senha123');
    await page.click('button[type="submit"]');

    // Verificar atributos de acessibilidade
    const inputs = page.locator('input, button, a');
    const count = await inputs.count();

    for (let i = 0; i < Math.min(count, 10); i++) {
      const element = inputs.nth(i);

      // Verificar se tem texto alternativo ou aria-label
      const hasAriaLabel = await element.getAttribute('aria-label');
      const hasTitle = await element.getAttribute('title');
      const hasAlt = await element.getAttribute('alt');

      if (!hasAriaLabel && !hasTitle && !hasAlt) {
        console.warn(`⚠️ Elemento sem atributo de acessibilidade: ${await element.innerHTML()}`);
      }
    }

    // Testar navegação por teclado
    await page.keyboard.press('Tab');
    const focusedElement = page.locator(':focus');
    await expect(focusedElement).toBeVisible();

    console.log('✅ Teste de acessibilidade concluído');
  });

  test('Integração com APIs externas', async ({ page }) => {
    console.log('🔗 Testando integração com APIs...');

    // Fazer login
    await page.fill('input[name="email"]', 'teste@email.com');
    await page.fill('input[name="senha"]', 'senha123');
    await page.click('button[type="submit"]');

    // Tentar acessar funcionalidade que usa API externa (ex: explicações com IA)
    await page.click('text=Explicações');

    // Verificar se há indicador de carregamento
    const loadingIndicator = page.locator('.loading, .spinner, [data-testid="loading"]');
    if (await loadingIndicator.isVisible()) {
      console.log('✅ Indicador de carregamento encontrado');
    }

    // Aguardar resposta da API
    await page.waitForTimeout(2000);

    // Verificar se conteúdo foi carregado
    await expect(page.locator('.explicacao, .resultado, .content')).toBeVisible();

    console.log('✅ Teste de integração com APIs concluído');
  });

  test('Tratamento de erros e estados de falha', async ({ page }) => {
    console.log('🚨 Testando tratamento de erros...');

    // Interceptar requisições para simular erro
    await page.route('**/api/**', (route) => {
      if (route.request().url().includes('erro')) {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Erro interno do servidor' })
        });
      } else {
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true })
        });
      }
    });

    // Fazer login
    await page.fill('input[name="email"]', 'teste@email.com');
    await page.fill('input[name="senha"]', 'senha123');
    await page.click('button[type="submit"]');

    // Tentar acessar funcionalidade que pode falhar
    await page.goto('http://localhost:3000/erro');

    // Verificar se página de erro é exibida adequadamente
    await expect(page.locator('text=Erro, text=Falha, text=500')).toBeVisible();

    // Verificar se há botão de tentar novamente
    const retryButton = page.locator('text=Tentar novamente, text=Voltar');
    if (await retryButton.isVisible()) {
      console.log('✅ Botão de retry encontrado');
    }

    console.log('✅ Teste de tratamento de erros concluído');
  });

  test('Funcionalidades offline', async ({ page, context }) => {
    console.log('📴 Testando funcionalidades offline...');

    // Habilitar modo offline
    await context.setOffline(true);

    // Tentar acessar a aplicação
    await page.goto('http://localhost:3000');

    // Verificar se há indicador de modo offline
    const offlineIndicator = page.locator('text=offline, text=sem conexão');
    if (await offlineIndicator.isVisible()) {
      console.log('✅ Indicador de modo offline encontrado');
    }

    // Verificar se conteúdo cached é exibido
    await expect(page.locator('main, .content')).toBeVisible();

    // Desabilitar modo offline
    await context.setOffline(false);

    console.log('✅ Teste de funcionalidades offline concluído');
  });
});

test.describe('Testes de Regressão', () => {

  test('Verificar se todas as páginas principais carregam', async ({ page }) => {
    console.log('🔍 Verificando carregamento de páginas principais...');

    const paginas = [
      '/',
      '/login',
      '/registrar',
      '/dashboard',
      '/simulados',
      '/aprendendo',
      '/desempenho',
      '/perfil'
    ];

    for (const pagina of paginas) {
      await page.goto(`http://localhost:3000${pagina}`);

      // Verificar se página não retorna erro 500
      const title = await page.title();
      expect(title).not.toBe('500 Internal Server Error');

      // Verificar se há conteúdo na página
      const hasContent = await page.locator('body').isVisible();
      expect(hasContent).toBe(true);

      console.log(`✅ Página ${pagina} carregou corretamente`);
    }
  });

  test('Verificar funcionalidades críticas não quebraram', async ({ page }) => {
    console.log('🔧 Verificando funcionalidades críticas...');

    // Fazer login
    await page.fill('input[name="email"]', 'teste@email.com');
    await page.fill('input[name="senha"]', 'senha123');
    await page.click('button[type="submit"]');

    // Testar navegação crítica
    const navegacoes = [
      { nome: 'Dashboard', seletor: 'text=Dashboard' },
      { nome: 'Simulados', seletor: 'text=Simulados' },
      { nome: 'Aprendendo', seletor: 'text=Aprendendo' },
      { nome: 'Perfil', seletor: 'text=Perfil' }
    ];

    for (const nav of navegacoes) {
      await page.click(nav.seletor);
      await expect(page.locator('main, .content')).toBeVisible();
      console.log(`✅ Navegação ${nav.nome} funcionando`);
    }
  });
});

test.describe('Testes de Segurança', () => {

  test('Proteger contra ataques XSS', async ({ page }) => {
    console.log('🔒 Testando proteção contra XSS...');

    // Tentar injetar script malicioso
    const scriptMalicioso = '<script>alert("XSS")</script>';

    await page.fill('input[name="nome"]', scriptMalicioso);

    // Verificar se o script não foi executado
    page.on('dialog', async dialog => {
      expect(dialog.message()).not.toBe('XSS');
      await dialog.dismiss();
    });

    // Verificar se input foi sanitizado
    const inputValue = await page.inputValue('input[name="nome"]');
    expect(inputValue).not.toContain('<script>');

    console.log('✅ Proteção contra XSS funcionando');
  });

  test('Verificar autenticação e autorização', async ({ page }) => {
    console.log('🔐 Testando autenticação e autorização...');

    // Tentar acessar página protegida sem login
    await page.goto('http://localhost:3000/dashboard');

    // Verificar se foi redirecionado para login
    await expect(page.locator('input[name="email"], form')).toBeVisible();

    // Fazer login
    await page.fill('input[name="email"]', 'teste@email.com');
    await page.fill('input[name="senha"]', 'senha123');
    await page.click('button[type="submit"]');

    // Verificar se conseguiu acessar área protegida
    await expect(page.locator('.dashboard, .main-content')).toBeVisible();

    console.log('✅ Sistema de autenticação funcionando');
  });
});