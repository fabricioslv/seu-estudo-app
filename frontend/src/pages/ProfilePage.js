// src/pages/ProfilePage.js
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nome: user?.nome || '',
    email: user?.email || '',
    foto: user?.foto || ''
  });
  const [errors, setErrors] = useState({});

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Limpar erro do campo quando o usuário começa a digitar
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.nome.trim()) {
      newErrors.nome = 'Nome é obrigatório';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formErrors = validateForm();
    if (Object.keys(formErrors).length > 0) {
      setErrors(formErrors);
      return;
    }
    
    try {
      await updateUser(formData);
      setIsEditing(false);
      // Mostrar mensagem de sucesso
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      // Mostrar mensagem de erro
      alert('Erro ao atualizar perfil: ' + error.message);
    }
  };

  const handleCancel = () => {
    setFormData({
      nome: user?.nome || '',
      email: user?.email || '',
      foto: user?.foto || ''
    });
    setErrors({});
    setIsEditing(false);
  };

  return (
    <div className="profile-page">
      <div className="profile-header">
        <h1>Meu Perfil</h1>
        <p>Gerencie suas informações pessoais</p>
      </div>

      <div className="profile-content">
        {!isEditing ? (
          <div className="profile-view">
            <div className="profile-card">
              <div className="profile-avatar">
                {user?.foto ? (
                  <img src={user.foto} alt={user.nome} />
                ) : (
                  <div className="avatar-placeholder">
                    {user?.nome?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="profile-info">
                <h2>{user?.nome}</h2>
                <p className="profile-email">{user?.email}</p>
                <p className="profile-type">Tipo: {user?.tipo_usuario === 'professor' ? 'Professor' : 'Estudante'}</p>
                <p className="profile-joined">Membro desde: {user?.data_criacao ? new Date(user.data_criacao).toLocaleDateString('pt-BR') : 'Indisponível'}</p>
              </div>
            </div>

            <div className="profile-actions">
              <button 
                className="btn btn-primary"
                onClick={() => setIsEditing(true)}
              >
                Editar Perfil
              </button>
              <button className="btn btn-secondary">
                Alterar Senha
              </button>
              <button className="btn btn-danger">
                Excluir Conta
              </button>
            </div>
          </div>
        ) : (
          <div className="profile-edit">
            <form onSubmit={handleSubmit} className="profile-form">
              <div className="form-group">
                <label htmlFor="nome">Nome</label>
                <input
                  type="text"
                  id="nome"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  className={errors.nome ? 'error' : ''}
                />
                {errors.nome && <span className="error-message">{errors.nome}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'error' : ''}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="foto">Foto de Perfil</label>
                <input
                  type="text"
                  id="foto"
                  name="foto"
                  value={formData.foto}
                  onChange={handleInputChange}
                  placeholder="URL da imagem"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary">
                  Salvar Alterações
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={handleCancel}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="profile-stats">
          <h2>Estatísticas</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-info">
                <h3>Pontos</h3>
                <p className="stat-value">1,250</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📝</div>
              <div className="stat-info">
                <h3>Questões Respondidas</h3>
                <p className="stat-value">420</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-info">
                <h3>Horas Estudadas</h3>
                <p className="stat-value">28</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔥</div>
              <div className="stat-info">
                <h3>Streak</h3>
                <p className="stat-value">7 dias</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;