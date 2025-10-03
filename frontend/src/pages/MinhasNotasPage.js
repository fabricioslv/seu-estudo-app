
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import gradesService from '../services/gradesService';
import '../styles/MinhasNotasPage.css';

const MinhasNotasPage = () => {
    const { user } = useContext(AuthContext);
    const [notas, setNotas] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user) {
            const fetchNotas = async () => {
                setLoading(true);
                try {
                    const data = await gradesService.getMinhasNotas(user.id, user.token);
                    setNotas(data);
                } catch (error) {
                    console.error('Erro ao buscar notas:', error);
                }
                setLoading(false);
            };
            fetchNotas();
        }
    }, [user]);

    return (
        <div className="minhas-notas-container">
            <h1>Minhas Notas</h1>
            {loading ? (
                <p>Carregando...</p>
            ) : notas.length === 0 ? (
                <p>Você ainda não tem notas lançadas.</p>
            ) : (
                <table className="notas-table">
                    <thead>
                        <tr>
                            <th>Avaliação</th>
                            <th>Nota</th>
                            <th>Comentário do Professor</th>
                            <th>Data de Lançamento</th>
                        </tr>
                    </thead>
                    <tbody>
                        {notas.map(nota => (
                            <tr key={nota.id}>
                                <td>{nota.avaliacao_titulo}</td>
                                <td>{nota.nota}</td>
                                <td>{nota.comentario || '-'}</td>
                                <td>{new Date(nota.data_lancamento).toLocaleDateString('pt-BR')}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default MinhasNotasPage;
