
import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import gradesService from '../../services/gradesService';
import '../../styles/ProfessorPages.css';

const LancarNotasPage = () => {
    const { id: avaliacaoId } = useParams();
    const { user } = useContext(AuthContext);
    const [notas, setNotas] = useState({}); // Objeto para mapear alunoId -> nota
    const [alunos, setAlunos] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user && avaliacaoId) {
            const fetchData = async () => {
                setLoading(true);
                try {
                    // Busca alunos e notas em paralelo
                    const [alunosData, notasData] = await Promise.all([
                        gradesService.getAlunos(user.token),
                        gradesService.getNotasByAvaliacao(avaliacaoId, user.token)
                    ]);
                    
                    setAlunos(alunosData);

                    // Mapeia as notas existentes para fácil acesso
                    const notasMap = notasData.reduce((acc, nota) => {
                        acc[nota.aluno_id] = nota.nota;
                        return acc;
                    }, {});
                    setNotas(notasMap);

                } catch (error) {
                    console.error('Erro ao buscar dados para lançamento de notas:', error);
                }
                setLoading(false);
            };
            fetchData();
        }
    }, [user, avaliacaoId]);

    const handleNotaChange = (alunoId, novaNota) => {
        setNotas(prev => ({ ...prev, [alunoId]: novaNota }));
    };

    const handleSaveNota = async (alunoId) => {
        const nota = notas[alunoId];
        if (nota === undefined || nota === '') {
            alert('Por favor, insira uma nota válida.');
            return;
        }
        try {
            await gradesService.lancarNota({ 
                avaliacao_id: avaliacaoId, 
                aluno_id: alunoId, 
                nota: parseFloat(nota) 
            }, user.token);
            alert(`Nota do aluno salva com sucesso!`);
        } catch (error) {
            console.error('Erro ao salvar nota:', error);
            alert('Erro ao salvar nota.');
        }
    };

    if (loading) {
        return <div className="professor-page-container"><p>Carregando...</p></div>;
    }

    return (
        <div className="professor-page-container">
            <Link to="/professor/avaliacoes">&larr; Voltar para Avaliações</Link>
            <h1>Lançar Notas</h1>
            
            <div className="list-container">
                <table className="notas-table">
                    <thead>
                        <tr>
                            <th>Aluno</th>
                            <th>Nota</th>
                            <th>Ação</th>
                        </tr>
                    </thead>
                    <tbody>
                        {alunos.map(aluno => (
                            <tr key={aluno.id}>
                                <td>{aluno.nome || aluno.email}</td>
                                <td>
                                    <input 
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        max="100"
                                        className="nota-input"
                                        value={notas[aluno.id] || ''}
                                        onChange={(e) => handleNotaChange(aluno.id, e.target.value)}
                                    />
                                </td>
                                <td>
                                    <button className="btn-salvar-nota" onClick={() => handleSaveNota(aluno.id)}>Salvar</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default LancarNotasPage;
