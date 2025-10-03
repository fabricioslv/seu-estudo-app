// services/simuladosService.js - Funções para interagir com a API de simulados

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:6001/api';

/**
 * Obtém simulados disponíveis para o usuário
 * @returns {Promise<object>} - A resposta da API com os simulados
 */
const getSimuladosDisponiveis = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/simulados/disponiveis`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || 'Falha ao obter simulados disponíveis.');
  }

  return response.json();
};

/**
 * Obtém as questões de um simulado específico
 * @param {number} simuladoId - ID do simulado
 * @returns {Promise<object>} - A resposta da API com as questões do simulado
 */
const getQuestoesSimulado = async (simuladoId) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/simulados/${simuladoId}/questoes`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || 'Falha ao obter questões do simulado.');
  }

  return response.json();
};

/**
 * Envia as respostas de um simulado
 * @param {number} simuladoId - ID do simulado
 * @param {Array} respostas - Array de respostas do simulado
 * @returns {Promise<object>} - A resposta da API com os resultados
 */
const enviarRespostasSimulado = async (simuladoId, respostas) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/simulados/${simuladoId}/responder`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ respostas })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || 'Falha ao enviar respostas do simulado.');
  }

  return response.json();
};

/**
 * Obtém o histórico de simulados do usuário
 * @returns {Promise<object>} - A resposta da API com o histórico
 */
const getHistoricoSimulados = async () => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/simulados/historico`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || 'Falha ao obter histórico de simulados.');
  }

  return response.json();
};

const simuladosService = { 
  getSimuladosDisponiveis,
  getQuestoesSimulado,
  enviarRespostasSimulado,
  getHistoricoSimulados
};

export default simuladosService;