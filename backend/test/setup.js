/**
 * Setup global para testes Jest
 */

// Configurações de timeout para testes
jest.setTimeout(10000);

// Mock de variáveis de ambiente para testes
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-jwt-secret';
process.env.DATABASE_URL =
  'postgresql://test:test@localhost:5432/seu_estudo_test';

// Cleanup após cada teste
afterEach(() => {
  // Limpa mocks
  jest.clearAllMocks();
});

// Setup global antes de todos os testes
beforeAll(() => {
  // Configurações adicionais podem ser adicionadas aqui
});

// Cleanup global após todos os testes
afterAll(() => {
  // Fecha conexões, limpa recursos, etc.
});
