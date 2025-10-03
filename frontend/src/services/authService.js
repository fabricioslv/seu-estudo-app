// services/authService.js - Funções para interagir com a API de autenticação

// A URL base da nossa API backend
const API_URL = (process.env.REACT_APP_API_URL ? process.env.REACT_APP_API_URL + '/auth' : 'http://localhost:5000/api/auth');

/**
 * Registra um novo usuário.
 * @param {object} userData - Dados do usuário { nome, email, senha }.
 * @returns {Promise<object>} - A resposta da API (contendo o token).
 */
const register = async (userData) => {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    // Se a resposta não for OK, tenta extrair a mensagem de erro do corpo da resposta
    const errorData = await response.json();
    throw new Error(errorData.msg || 'Falha ao registrar');
  }

  return response.json();
};

/**
 * Loga um usuário.
 * @param {object} credentials - Credenciais do usuário { email, senha }.
 * @returns {Promise<object>} - A resposta da API (contendo o token).
 */
const login = async (credentials) => {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || 'Falha no login');
  }

  return response.json();
};

const authService = { register, login };
export default authService;
