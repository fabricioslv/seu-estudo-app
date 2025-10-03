
import React, { useState, useEffect } from 'react';
import tutoriaService from '../services/tutoriaService';
import '../styles/EncontrarTutoresPage.css';

const EncontrarTutoresPage = () => {
    const [tutores, setTutores] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTutores = async () => {
            setLoading(true);
            try {
                const data = await tutoriaService.getTutores();
                setTutores(data);
            } catch (error) {
                console.error('Erro ao buscar tutores:', error);
            }
            setLoading(false);
        };
        fetchTutores();
    }, []);

    const handleSolicitarSessao = (tutorId) => {
        // TODO: Abrir um modal ou navegar para uma página para solicitar a sessão
        alert(`Funcionalidade de solicitar sessão para o tutor ${tutorId} a ser implementada.`);
    };

    return (
        <div className="encontrar-tutores-container">
            <h1>Encontrar Tutores</h1>
            <p>Encontre o tutor ideal para te ajudar a alcançar seus objetivos.</p>

            {/* TODO: Adicionar filtros de matéria, disponibilidade, etc. */}

            {loading ? (
                <p>Carregando tutores...</p>
            ) : (
                <div className="tutores-list">
                    {tutores.length === 0 ? (
                        <p>Nenhum tutor disponível no momento.</p>
                    ) : (
                        tutores.map(tutor => (
                            <div key={tutor.id} className="tutor-card">
                                <h3>{tutor.nome}</h3>
                                <p className="tutor-bio">{tutor.bio}</p>
                                <div className="tutor-materias">
                                    <strong>Matérias:</strong> {tutor.materias.join(', ')}
                                </div>
                                <div className="tutor-rating">
                                    <strong>Avaliação:</strong> {tutor.avg_rating} / 5.00
                                </div>
                                <button onClick={() => handleSolicitarSessao(tutor.user_id)}>
                                    Solicitar Tutoria
                                </button>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default EncontrarTutoresPage;
