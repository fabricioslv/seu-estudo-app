// pages/CriarPlanoPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import questoesService from '../services/questoesService';

const CriarPlanoPage = () => {
  const [formData, setFormData] = useState({
    area: '',
    materias: [],
    frequencia: 'diaria',
    tempoDiario: 60,
    nivel: 'medio'
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const materiasDisponiveis = [
    'Português', 'Matemática', 'Física', 'Química', 'Biologia',
    'História', 'Geografia', 'Filosofia', 'Sociologia', 'Inglês',
    'Literatura', 'Artes', 'Educação Física'
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (checked) {
        setFormData(prev => ({
          ...prev,
          materias: [...prev.materias, value]
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          materias: prev.materias.filter(materia => materia !== value)
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const data = await questoesService.generateStudyPlan(
        formData,
        formData.materias
      );
      
      if (data.plano) {
        // Navegar para a página de visualização do plano salvo
        navigate('/aprendendo/plano-gerado', { 
          state: { 
            plano: formData,
            planoDetalhado: data.plano 
          } 
        });
      } else {
        throw new Error(data.msg || 'Erro ao gerar plano de estudos');
      }
    } catch (error) {
      console.error('Erro ao gerar plano:', error);
      alert('Erro ao gerar plano de estudos. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="criar-plano-page">
      <h2>Criar Plano de Estudos com IA</h2>
      
      <form onSubmit={handleSubmit} className="plano-form">
        <div className="form-section">
          <h3>Área de Estudo</h3>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="area"
                value="exatas"
                checked={formData.area === 'exatas'}
                onChange={handleChange}
                required
              />
              Ciências da Natureza e Matemática (Exatas)
            </label>
            <label>
              <input
                type="radio"
                name="area"
                value="humanas"
                checked={formData.area === 'humanas'}
                onChange={handleChange}
              />
              Ciências Humanas e da Natureza (Humanas)
            </label>
            <label>
              <input
                type="radio"
                name="area"
                value="biologicas"
                checked={formData.area === 'biologicas'}
                onChange={handleChange}
              />
              Ciências da Vida (Biológicas)
            </label>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Matérias Específicas</h3>
          <p>Selecione as matérias que deseja incluir no plano:</p>
          <div className="materias-grid">
            {materiasDisponiveis.map(materia => (
              <label key={materia} className="materia-checkbox">
                <input
                  type="checkbox"
                  value={materia}
                  checked={formData.materias.includes(materia)}
                  onChange={handleChange}
                />
                {materia}
              </label>
            ))}
          </div>
        </div>
        
        <div className="form-section">
          <h3>Organização do Plano</h3>
          <div className="form-row">
            <div className="form-group">
              <label>Frequência de Estudo:</label>
              <select 
                name="frequencia" 
                value={formData.frequencia} 
                onChange={handleChange}
              >
                <option value="diaria">Diária</option>
                <option value="semanal">Semanal</option>
                <option value="flexivel">Flexível</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Tempo Diário (minutos):</label>
              <input
                type="number"
                name="tempoDiario"
                value={formData.tempoDiario}
                onChange={handleChange}
                min="15"
                max="240"
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h3>Nível de Dificuldade</h3>
          <div className="radio-group">
            <label>
              <input
                type="radio"
                name="nivel"
                value="basico"
                checked={formData.nivel === 'basico'}
                onChange={handleChange}
              />
              Básico
            </label>
            <label>
              <input
                type="radio"
                name="nivel"
                value="medio"
                checked={formData.nivel === 'medio'}
                onChange={handleChange}
                defaultChecked
              />
              Intermediário
            </label>
            <label>
              <input
                type="radio"
                name="nivel"
                value="avancado"
                checked={formData.nivel === 'avancado'}
                onChange={handleChange}
              />
              Avançado
            </label>
          </div>
        </div>
        
        <button type="submit" disabled={loading} className="btn-gerar-plano">
          {loading ? 'Gerando Plano...' : 'Gerar Plano com IA'}
        </button>
      </form>
    </div>
  );
};

export default CriarPlanoPage;