// pages/ProfessorDashboardPage.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const ProfessorDashboardPage = () => {
  const [professor, setProfessor] = useState(null);
  const [simulados, setSimulados] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se o usuário é um professor
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    // Obter informações do professor
    const fetchProfessorInfo = async () => {
      try {
        const response = await fetch('http://localhost:6001/api/professores/perfil', {
          headers: {
            'x-auth-token': token
          }
        });

        const data = await response.json();
        if (data) {
          setProfessor(data);
        } else {
          throw new Error('Não foi possível obter as informações do professor');
        }
      } catch (err) {
        setError('Erro ao carregar informações do professor');
        console.error(err);
      }
    };

    // Obter simulados do professor
    const fetchSimulados = async () => {
      try {
        const response = await fetch('http://localhost:6001/api/professor/simulados', {
          headers: {
            'x-auth-token': token
          }
        });

        const data = await response.json();
        if (data.simulados) {
          setSimulados(data.simulados);
        } else {
          throw new Error('Não foi possível obter os simulados');
        }
      } catch (err) {
        setError('Erro ao carregar simulados');
        console.error(err);
      }
    };

    Promise.all([fetchProfessorInfo(), fetchSimulados()])
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (error) {
    return <div className="error-message">{error}</div>;
  }

  return (
    <div className="professor-dashboard-page">
      <h2>Dashboard do Professor</h2>
      
      <div className="professor-info">
        <h3>Informações Pessoais</h3>
        <p><strong>Nome:</strong> {professor.nome}</p>
        <p><strong>Email:</strong> {professor.email}</p>
        <p><strong>Formação:</strong> {professor.formacao}</p>
        <p><strong>Instituição:</strong> {professor.instituicao || 'Não informada'}</p>
        <p><strong>Áreas de Atuação:</strong> {professor.areas_atuacao || 'Não informadas'}</p>
      </div>
      
      <div className="dashboard-actions">
        <button 
          className="btn-create-simulado"
          onClick={() => navigate('/professor/criar-simulado')}
        >
          Criar Novo Simulado
        </button>
        <button 
          className="btn-manage-avaliacoes"
          onClick={() => navigate('/professor/avaliacoes')}
        >
          Gerenciar Avaliações
        </button>
        <button 
          className="btn-editar-perfil"
          onClick={() => navigate('/professor/editar-perfil')}
        >
          Editar Perfil
        </button>
      </div>
      
      <div className="professor-simulados">
        <h3>Meus Simulados</h3>
        {simulados.length === 0 ? (
          <p>Nenhum simulado criado ainda.</p>
        ) : (
          <div className="simulados-list">
            {simulados.map(simulado => (
              <div key={simulado.id} className="simulado-card">
                <h4>{simulado.titulo}</h4>
                <p>{simulado.descricao}</p>
                <p><strong>Matéria:</strong> {simulado.materia}</p>
                <p><strong>Duração:</strong> {simulado.duracao} minutos</p>
                <p><strong>Questões:</strong> {simulado.total_questoes}</p>
                <p><strong>Criado em:</strong> {new Date(simulado.data_criacao).toLocaleDateString()}</p>
                <div className="simulado-actions">
                  <button 
                    onClick={() => navigate(`/professor/simulado/${simulado.id}/editar`)}
                    className="btn-edit"
                  >
                    Editar
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm('Tem certeza que deseja excluir este simulado?')) {
                        handleDeleteSimulado(simulado.id);
                      }
                    }}
                    className="btn-delete"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const handleDeleteSimulado = async (id) => {
  const token = localStorage.getItem('token');
  
  try {
    const response = await fetch(`http://localhost:6001/api/professor/simulados/${id}`, {
      method: 'DELETE',
      headers: {
        'x-auth-token': token
      }
    });

    const data = await response.json();
    if (response.ok) {
      alert('Simulado excluído com sucesso!');
      // Recarregar a página ou atualizar a lista de simulados
      window.location.reload();
    } else {
      alert(data.msg || 'Erro ao excluir simulado');
    }
  } catch (err) {
    alert('Erro de conexão com o servidor');
    console.error(err);
  }
};

export default ProfessorDashboardPage;