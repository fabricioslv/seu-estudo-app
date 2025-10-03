
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:6001/api/notas';

// --- Funções para Alunos ---

const getMinhasNotas = async (alunoId, token) => {
  const response = await axios.get(`${API_URL}/aluno/${alunoId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};

// --- Funções para Professores ---

const getAvaliacoesByProfessor = async (professorId, token) => {
    const response = await axios.get(`${API_URL}/avaliacoes/professor/${professorId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

const createAvaliacao = async (avaliacaoData, token) => {
    const response = await axios.post(`${API_URL}/avaliacoes`, avaliacaoData, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

const getNotasByAvaliacao = async (avaliacaoId, token) => {
    const response = await axios.get(`${API_URL}/avaliacao/${avaliacaoId}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

const lancarNota = async (notaData, token) => {
    const response = await axios.post(`${API_URL}/`, notaData, { // A rota para lançar nota é a raiz do /api/notas
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

const PROFESSORES_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:6001/api/professores';

const getAlunos = async (token) => {
    const response = await axios.get(`${PROFESSORES_API_URL}/alunos`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};


const gradesService = {
  getMinhasNotas,
  getAvaliacoesByProfessor,
  createAvaliacao,
  getNotasByAvaliacao,
  lancarNota,
  getAlunos,
};

export default gradesService;
