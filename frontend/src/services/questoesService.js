// services/questoesService.js - Funções para interagir com a API de questões

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

/**
 * Envia um arquivo PDF para extração de questões.
 * @param {FormData} formData - O objeto FormData contendo o arquivo PDF.
 * @returns {Promise<object>} - A resposta da API.
 */
const extractFromPDF = async (formData) => {
  // Pega o token de autenticação do localStorage
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_URL}/questoes/extract`, {
    method: 'POST',
    headers: {
      // O Content-Type é definido automaticamente pelo navegador para FormData
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || 'Falha ao extrair questões do PDF.');
  }

  return response.json();
};

/**
 * Gera um plano de estudos com IA
 * @param {object} perfil - Perfil do usuário para geração do plano
 * @param {Array} materias - Matérias selecionadas para o plano
 * @param {string} objetivo - Objetivo do plano (padrão: 'enem')
 * @returns {Promise<object>} - A resposta da API com o plano gerado
 */
const generateStudyPlan = async (perfil, materias, objetivo = 'enem') => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/questoes/generate-study-plan`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ perfil, materias, objetivo })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || 'Falha ao gerar plano de estudos.');
  }

  return response.json();
};

/**
 * Obtém os planos de estudo do usuário
 * @param {string} status - Filtro por status do plano (opcional)
 * @param {string} objetivo - Filtro por objetivo do plano (opcional)
 * @returns {Promise<object>} - A resposta da API com os planos
 */
const getStudyPlans = async (status = null, objetivo = null) => {
  const token = localStorage.getItem('token');
  
  let url = `${API_URL}/questoes/study-plans`;
  const queryParams = [];
  
  if (status) queryParams.push(`status=${status}`);
  if (objetivo) queryParams.push(`objetivo=${objetivo}`);
  
  if (queryParams.length > 0) {
    url += '?' + queryParams.join('&');
  }
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || 'Falha ao obter planos de estudo.');
  }

  return response.json();
};

/**
 * Obtém um plano de estudo específico
 * @param {number} planoId - ID do plano de estudo
 * @returns {Promise<object>} - A resposta da API com o plano
 */
const getStudyPlan = async (planoId) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/questoes/study-plans/${planoId}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || 'Falha ao obter plano de estudo.');
  }

  return response.json();
};

/**
 * Atualiza o status de um plano de estudo
 * @param {number} planoId - ID do plano de estudo
 * @param {string} status - Novo status do plano
 * @returns {Promise<object>} - A resposta da API
 */
const updateStudyPlanStatus = async (planoId, status) => {
  const token = localStorage.getItem('token');
  
  const response = await fetch(`${API_URL}/questoes/study-plans/${planoId}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.msg || 'Falha ao atualizar plano de estudo.');
  }

  return response.json();
};

const questoesService = { 
  extractFromPDF,
  generateStudyPlan,
  getStudyPlans,
  getStudyPlan,
  updateStudyPlanStatus
};
export default questoesService;
