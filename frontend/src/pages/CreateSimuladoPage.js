// pages/CreateSimuladoPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const CreateSimuladoPage = () => {
  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    materia: '',
    dificuldade: 1,
    duracao: 60,
    questoes: []
  });
  const [questoesDisponiveis, setQuestoesDisponiveis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Carregar questões do banco de dados
    const fetchQuestoes = async () => {
      try {
        const response = await fetch('http://localhost:6001/api/questoes/by-subject/matematica'); // Exemplo para Matemática
        const data = await response.json();
        
        if (data.questions) {
          // Filtrar e limitar as questões para demonstração
          const questoesFiltradas = data.questions.slice(0, 20).map(q => ({
            ...q,
            selecionada: false
          }));
          setQuestoesDisponiveis(questoesFiltradas);
        }
      } catch (err) {
        setError('Erro ao carregar questões');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchQuestoes();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleQuestaoToggle = (questaoId) => {
    setQuestoesDisponiveis(prev => {
      return prev.map(questao => 
        questao.id === questaoId 
          ? { ...questao, selecionada: !questao.selecionada } 
          : questao
      );
    });

    // Atualizar a lista de questões selecionadas
    // const questoesSelecionadas = questoesDisponiveis
    //   .filter(q => q.selecionada || q.id === questaoId)
    //   .map(q => ({ id: q.id }));
    
    if (!questoesDisponiveis.find(q => q.id === questaoId)?.selecionada) {
      // Adicionando questão
      setFormData(prev => ({
        ...prev,
        questoes: [...prev.questoes, { id: questaoId }]
      }));
    } else {
      // Removendo questão
      setFormData(prev => ({
        ...prev,
        questoes: prev.questoes.filter(q => q.id !== questaoId)
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:6001/api/professor/simulados', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-auth-token': token
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Simulado criado com sucesso!');
        navigate('/professor/dashboard');
      } else {
        setError(data.msg || 'Erro ao criar simulado');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="create-simulado-page">
      <h2>Criar Novo Simulado</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="create-simulado-form">
        <div className="form-group">
          <label htmlFor="titulo">Título do Simulado:</label>
          <input
            type="text"
            id="titulo"
            name="titulo"
            value={formData.titulo}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="descricao">Descrição:</label>
          <textarea
            id="descricao"
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            rows="3"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="materia">Matéria:</label>
          <select
            id="materia"
            name="materia"
            value={formData.materia}
            onChange={handleChange}
            required
          >
            <option value="">Selecione uma matéria</option>
            <option value="Português">Português</option>
            <option value="Matemática">Matemática</option>
            <option value="Ciências Humanas">Ciências Humanas</option>
            <option value="Ciências da Natureza">Ciências da Natureza</option>
            <option value="Inglês">Inglês</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="dificuldade">Dificuldade:</label>
          <select
            id="dificuldade"
            name="dificuldade"
            value={formData.dificuldade}
            onChange={handleChange}
          >
            <option value="1">Fácil</option>
            <option value="2">Médio</option>
            <option value="3">Difícil</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="duracao">Duração (minutos):</label>
          <input
            type="number"
            id="duracao"
            name="duracao"
            value={formData.duracao}
            onChange={handleChange}
            min="1"
            max="360"
          />
        </div>
        
        <div className="questoes-section">
          <h3>Selecione as Questões</h3>
          <p>Selecione as questões que deseja incluir no simulado:</p>
          
          <div className="questoes-list">
            {questoesDisponiveis.map(questao => (
              <div 
                key={questao.id} 
                className={`questao-item ${questao.selecionada ? 'selected' : ''}`}
                onClick={() => handleQuestaoToggle(questao.id)}
              >
                <div className="questao-content">
                  <p><strong>Q{questao.numero}:</strong> {questao.enunciado?.substring(0, 100)}...</p>
                  <p><small>Matéria: {questao.materia} | Ano: {questao.ano}</small></p>
                </div>
                <input
                  type="checkbox"
                  checked={questao.selecionada}
                  onChange={() => {}}
                  className="questao-checkbox"
                />
              </div>
            ))}
          </div>
        </div>
        
        <button type="submit" disabled={loading} className="btn-create">
          {loading ? 'Criando...' : 'Criar Simulado'}
        </button>
      </form>
    </div>
  );
};

export default CreateSimuladoPage;