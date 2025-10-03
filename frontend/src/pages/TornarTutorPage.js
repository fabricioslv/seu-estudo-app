
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import tutoriaService from '../services/tutoriaService';
import '../styles/ProfessorPages.css'; // Reutilizando estilos

const TornarTutorPage = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [bio, setBio] = useState('');
    const [materias, setMaterias] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!bio || !materias) {
            setError('Por favor, preencha todos os campos.');
            setLoading(false);
            return;
        }

        const tutorData = {
            bio,
            materias: materias.split(',').map(m => m.trim()), // Simples split por vírgula
            disponibilidade: {}, // TODO: Implementar um seletor de disponibilidade mais robusto
        };

        try {
            await tutoriaService.tornarTutor(tutorData, user.token);
            alert('Parabéns! Você agora é um tutor.');
            navigate('/dashboard'); // Redireciona para o dashboard
        } catch (err) {
            setError('Ocorreu um erro ao tentar se tornar tutor. Tente novamente.');
            console.error(err);
        }
        setLoading(false);
    };

    return (
        <div className="professor-page-container"> {/* Reutilizando a classe container */}
            <h1>Torne-se um Tutor</h1>
            <p>Compartilhe seu conhecimento e ajude outros estudantes a aprender.</p>

            <div className="form-container">
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="bio">Sua Bio</label>
                        <textarea 
                            id="bio"
                            value={bio}
                            onChange={e => setBio(e.target.value)}
                            placeholder="Fale um pouco sobre você, sua experiência e como você pode ajudar."
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="materias">Matérias que você domina</label>
                        <input 
                            type="text"
                            id="materias"
                            value={materias}
                            onChange={e => setMaterias(e.target.value)}
                            placeholder="Ex: Matemática, Física, Redação"
                        />
                        <small>Separe as matérias por vírgula.</small>
                    </div>
                    
                    {/* TODO: Adicionar seletor de disponibilidade (dias/horários) */}

                    {error && <p className="error-message">{error}</p>}

                    <button type="submit" disabled={loading}>
                        {loading ? 'Enviando...' : 'Quero ser um Tutor'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TornarTutorPage;
