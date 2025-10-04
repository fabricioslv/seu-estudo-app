const js = require('@eslint/js');
const jestPlugin = require('eslint-plugin-jest');
const prettierConfig = require('eslint-config-prettier');
const globals = require('globals');

module.exports = [
  // 1. Configurações Globais
  {
    ignores: [
      'node_modules/',
      'dist/',
      '.vercel/',
      'server_output.log',
      'logs/',
    ],
  },

  // 2. Configuração Padrão para todos os arquivos JS
  js.configs.recommended,
  prettierConfig,

  // 3. Configuração para arquivos de Módulo ES (padrão para .js e .mjs)
  {
    files: ['**/*.js', '**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'prettier/prettier': 'off', // Desligado para não conflitar, Prettier é executado separadamente
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-var': 'error',
      'prefer-const': 'error',
      'no-multiple-empty-lines': ['error', { max: 2, maxBOF: 0, maxEOF: 1 }],
      'no-trailing-spaces': 'error',
      'eol-last': 'error',
      'no-duplicate-imports': 'error',
    },
  },

  // 4. Configuração específica para arquivos CommonJS
  {
    files: ['**/*.cjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'prettier/prettier': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },

  // 5. Configuração para arquivos de Teste (Jest)
  {
    files: ['**/*.test.js', '**/test/**/*.js', '**/__tests__/**/*.js'],
    ...jestPlugin.configs['flat/recommended'],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      ...jestPlugin.configs['flat/recommended'].rules,
      'jest/prefer-to-have-length': 'warn',
      'jest/valid-expect': 'error',
    },
  },
];