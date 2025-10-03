
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import tutoriaService from '../services/tutoriaService';
import '../styles/MinhasSessoesPage.css';

const MinhasSessoesPage = () => {
    const { user } = useContext(AuthContext);
    const [sessoes, setSessoes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            fetchSessoes();
        }
    }, [user]);

    const fetchSessoes = async () => {
        setLoading(true);
        try {
            const data = await tutoriaService.getMinhasSessoes(user.token);
            setSessoes(data);
        } catch (error) {
            console.error('Erro ao buscar sessões:', error);
        }
        setLoading(false);
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await tutoriaService.atualizarStatusSessao(id, status, user.token);
            fetchSessoes(); // Re-fetch para atualizar a lista
        } catch (error) {
            console.error(`Erro ao ${status} sessão:`, error);
        }
    };

    const sessoesComoAluno = sessoes.filter(s => s.aluno_id === user.id);
    const sessoesComoTutor = sessoes.filter(s => s.tutor_id === user.id);

    return (
        <div className="minhas-sessoes-container">
            <h1>Minhas Sessões de Tutoria</h1>

            <div className="sessoes-section">
                <h2>Sessões como Aluno</h2>
                {loading ? <p>Carregando...</p> : sessoesComoAluno.length === 0 ? <p>Você não solicitou nenhuma sessão.</p> : (
                    sessoesComoAluno.map(s => (
                        <div key={s.id} className={`sessao-card status-${s.status}`}>
                            <p><strong>Tutor:</strong> {s.tutor_id}</p> {/* TODO: Buscar nome do tutor */}
                            <p><strong>Matéria:</strong> {s.materia}</p>
                            <p><strong>Horário:</strong> {new Date(s.horario_solicitado).toLocaleString('pt-BR')}</p>
                            <p><strong>Status:</strong> <span className="status-badge">{s.status}</span></p>
                            {s.status === 'pendente' && (
                                <button onClick={() => handleUpdateStatus(s.id, 'cancelada')}>Cancelar</button>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="sessoes-section">
                <h2>Sessões como Tutor</h2>
                {loading ? <p>Carregando...</p> : sessoesComoTutor.length === 0 ? <p>Nenhuma sessão solicitada para você.</p> : (
                    sessoesComoTutor.map(s => (
                        <div key={s.id} className={`sessao-card status-${s.status}`}>
                            <p><strong>Aluno:</strong> {s.aluno_id}</p> {/* TODO: Buscar nome do aluno */}
                            <p><strong>Matéria:</strong> {s.materia}</p>
                            <p><strong>Horário:</strong> {new Date(s.horario_solicitado).toLocaleString('pt-BR')}</p>
                            <p><strong>Status:</strong> <span className="status-badge">{s.status}</span></p>
                            {s.status === 'pendente' && (
                                <div className="actions">
                                    <button className="btn-accept" onClick={() => handleUpdateStatus(s.id, 'aceita')}>Aceitar</button>
                                    <button className="btn-decline" onClick={() => handleUpdateStatus(s.id, 'recusada')}>Recusar</button>
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MinhasSessoesPage;
