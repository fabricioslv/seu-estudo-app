// components/RegisterForm.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';
import { useAuth } from '../context/AuthContext';

const RegisterForm = () => {
    console.log('[DEBUG] RegisterForm: Iniciando componente...');

    const [formData, setFormData] = useState({
      nome: '',
      email: '',
      senha: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    console.log('[DEBUG] RegisterForm: Estado inicial configurado');

    const navigate = useNavigate();
    const { login } = useAuth();

    console.log('[DEBUG] RegisterForm: Hooks inicializados - navigate:', !!navigate, 'login:', !!login);

  const { nome, email, senha } = formData;

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authService.register({ nome, email, senha });
      login(response.token);
      setLoading(false);
      navigate('/');
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  const getPasswordStrength = () => {
    if (senha.length === 0) return '';
    if (senha.length < 6) return 'weak';
    if (senha.length < 8) return 'medium';
    return 'strong';
  };

  return (
    <form onSubmit={onSubmit} className="modern-register-form">
      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="nome">Nome completo</label>
        <input
          type="text"
          id="nome"
          name="nome"
          value={nome}
          onChange={onChange}
          className={error && error.includes('nome') ? 'error' : ''}
          placeholder="Seu nome completo"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={email}
          onChange={onChange}
          className={error && error.includes('email') ? 'error' : ''}
          placeholder="seu@email.com"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="senha">Senha</label>
        <input
          type="password"
          id="senha"
          name="senha"
          value={senha}
          onChange={onChange}
          className={error && error.includes('senha') ? 'error' : ''}
          placeholder="••••••••"
          minLength="6"
          required
        />
      </div>

      <button
        type="submit"
        className="btn btn-primary btn-block"
        disabled={loading}
      >
        {loading ? 'Criando conta...' : 'Criar conta'}
      </button>
    </form>
  );
};

export default RegisterForm;