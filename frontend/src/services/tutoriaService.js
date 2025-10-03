
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:6001/api/tutoria';

// Torna-se um tutor
const tornarTutor = async (tutorData, token) => {
  const response = await axios.post(`${API_URL}/tutores`, tutorData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Lista todos os tutores
const getTutores = async () => {
  const response = await axios.get(`${API_URL}/tutores`);
  return response.data;
};

// Solicita uma sessão de tutoria
const solicitarSessao = async (sessaoData, token) => {
  const response = await axios.post(`${API_URL}/sessoes`, sessaoData, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Busca as sessões do usuário logado
const getMinhasSessoes = async (token) => {
  const response = await axios.get(`${API_URL}/sessoes`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// Atualiza o status de uma sessão
const atualizarStatusSessao = async (sessaoId, status, token) => {
  const response = await axios.put(`${API_URL}/sessoes/${sessaoId}`, { status }, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

const tutoriaService = {
  tornarTutor,
  getTutores,
  solicitarSessao,
  getMinhasSessoes,
  atualizarStatusSessao,
};

export default tutoriaService;
