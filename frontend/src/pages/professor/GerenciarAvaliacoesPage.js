
import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import gradesService from '../../services/gradesService';
// Estilos podem ser compartilhados ou criar um novo
import '../../styles/ProfessorPages.css';

const GerenciarAvaliacoesPage = () => {
    const { user } = useContext(AuthContext);
    const [avaliacoes, setAvaliacoes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Estados para o formulário de nova avaliação
    const [titulo, setTitulo] = useState('');
    const [descricao, setDescricao] = useState('');

    useEffect(() => {
        if (user && user.tipo_usuario === 'professor') {
            fetchAvaliacoes();
        }
    }, [user]);

    const fetchAvaliacoes = async () => {
        setLoading(true);
        try {
            const data = await gradesService.getAvaliacoesByProfessor(user.id, user.token);
            setAvaliacoes(data);
        } catch (error) {
            console.error('Erro ao buscar avaliações:', error);
        }
        setLoading(false);
    };

    const handleCreateAvaliacao = async (e) => {
        e.preventDefault();
        if (!titulo) {
            alert('O título é obrigatório.');
            return;
        }
        try {
            const novaAvaliacao = await gradesService.createAvaliacao({ professor_id: user.id, titulo, descricao }, user.token);
            setAvaliacoes([novaAvaliacao, ...avaliacoes]);
            setTitulo('');
            setDescricao('');
        } catch (error) {
            console.error('Erro ao criar avaliação:', error);
        }
    };

    return (
        <div className="professor-page-container">
            <h1>Gerenciar Avaliações</h1>

            <div className="form-container">
                <h2>Criar Nova Avaliação</h2>
                <form onSubmit={handleCreateAvaliacao}>
                    <div className="form-group">
                        <label>Título</label>
                        <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)} />
                    </div>
                    <div className="form-group">
                        <label>Descrição (Opcional)</label>
                        <textarea value={descricao} onChange={e => setDescricao(e.target.value)}></textarea>
                    </div>
                    <button type="submit">Criar Avaliação</button>
                </form>
            </div>

            <div className="list-container">
                <h2>Minhas Avaliações</h2>
                {loading ? <p>Carregando...</p> : (
                    <ul>
                        {avaliacoes.map(av => (
                            <li key={av.id}>
                                <h3>{av.titulo}</h3>
                                <p>{av.descricao}</p>
                                <Link to={`/professor/avaliacoes/${av.id}/lancar-notas`} className="btn-lancar-notas">Lançar Notas</Link>
                                {/* Adicionar link para lançar notas aqui */}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default GerenciarAvaliacoesPage;
