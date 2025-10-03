// pages/ProfessorRegisterPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfessorRegisterPage = () => {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    formacao: '',
    instituicao: '',
    areas_atuacao: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:6001/api/professores/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (data.token) {
        // Armazenar o token no localStorage
        localStorage.setItem('token', data.token);
        
        // Exibir mensagem de sucesso e redirecionar
        alert('Cadastro de professor realizado com sucesso!');
        navigate('/professor/dashboard'); // ou onde quer que o dashboard do professor esteja
      } else {
        setError(data.msg || 'Erro ao cadastrar professor. Tente novamente.');
      }
    } catch (err) {
      setError('Erro de conexão com o servidor. Tente novamente mais tarde.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="professor-register-page">
      <h2>Cadastro de Professor</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit} className="professor-register-form">
        <div className="form-group">
          <label htmlFor="nome">Nome Completo:</label>
          <input
            type="text"
            id="nome"
            name="nome"
            value={formData.nome}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="senha">Senha:</label>
          <input
            type="password"
            id="senha"
            name="senha"
            value={formData.senha}
            onChange={handleChange}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="formacao">Formação Acadêmica:</label>
          <input
            type="text"
            id="formacao"
            name="formacao"
            value={formData.formacao}
            onChange={handleChange}
            required
            placeholder="Ex: Doutorado em Matemática"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="instituicao">Instituição de Ensino:</label>
          <input
            type="text"
            id="instituicao"
            name="instituicao"
            value={formData.instituicao}
            onChange={handleChange}
            placeholder="Ex: Universidade Federal de São Paulo"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="areas_atuacao">Áreas de Atuação (separadas por vírgula):</label>
          <input
            type="text"
            id="areas_atuacao"
            name="areas_atuacao"
            value={formData.areas_atuacao}
            onChange={handleChange}
            placeholder="Ex: Matemática, Física, Química"
          />
        </div>
        
        <button type="submit" disabled={loading} className="btn-register">
          {loading ? 'Cadastrando...' : 'Cadastrar Professor'}
        </button>
      </form>
    </div>
  );
};

export default ProfessorRegisterPage;