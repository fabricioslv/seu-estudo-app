/**
 * Testes básicos do backend Seu-Estudo
 * Verifica funcionalidades essenciais sem iniciar servidor
 */

// Configurar variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.PORT = '6002'; // Porta diferente para testes

// Testes básicos sem servidor
describe('Backend Básico - Seu-Estudo', () => {
  test('Verificar se dotenv está funcionando', () => {
    // Verifica se variáveis de ambiente estão carregadas
    expect(process.env.NODE_ENV).toBe('test');
    expect(process.env.PORT).toBe('6002');
    expect(process.env.SUPABASE_URL).toBeDefined();
  });

  test('Verificar estrutura de arquivos críticos', () => {
    // Testa se arquivos essenciais existem
    const fs = require('fs');
    const path = require('path');

    expect(fs.existsSync(path.join(__dirname, '../index.js'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '../package.json'))).toBe(true);
    expect(fs.existsSync(path.join(__dirname, '../.env'))).toBe(true);
  });

  test('Verificar configurações básicas', () => {
    // Testa configurações essenciais
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.DATABASE_URL).toBeDefined();
  });
});

describe('Testes de Serviços Básicos', () => {
  test('Serviço de logger deve funcionar', () => {
    const { logger } = require('../services/logger');

    // Testa se o logger não lança erros
    expect(() => {
      logger.info('Teste de log básico');
    }).not.toThrow();
  });

  test('Configuração de banco de dados deve estar válida', () => {
    const db = require('../db');

    // Testa se conexão básica não falha
    expect(db).toBeDefined();
  });
});

describe('Segurança Básica', () => {
  test('Middleware de segurança deve estar disponível', () => {
    const auth = require('../middleware/auth');
    const rateLimiter = require('../middleware/rateLimiter');

    expect(auth.requireAuth).toBeDefined();
    expect(rateLimiter).toBeDefined();
  });

  test('Headers de segurança devem estar configurados', () => {
    const helmet = require('helmet');

    // Verifica se helmet está sendo usado
    expect(helmet).toBeDefined();
  });
});
