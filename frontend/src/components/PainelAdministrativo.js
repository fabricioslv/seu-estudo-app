// components/PainelAdministrativo.js
import React, { useState, useEffect } from 'react';

const PainelAdministrativo = ({ adminId }) => {
  const [abaAtiva, setAbaAtiva] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [conteudos, setConteudos] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Em uma implementação real, estas chamadas seriam para o backend
        // para obter dados administrativos
        
        // Simular dados de usuários
        const usuariosMock = [
          { id: 1, nome: 'Carlos Eduardo', email: 'carlos@email.com', tipo: 'aluno', ativo: true, ultimoLogin: '2024-02-15' },
          { id: 2, nome: 'Prof. João Silva', email: 'joao@escola.com', tipo: 'professor', ativo: true, ultimoLogin: '2024-02-14' },
          { id: 3, nome: 'Maria Santos', email: 'maria@email.com', tipo: 'aluno', ativo: false, ultimoLogin: '2024-01-20' },
          { id: 4, nome: 'Prof. Pedro Oliveira', email: 'pedro@escola.com', tipo: 'professor', ativo: true, ultimoLogin: '2024-02-15' },
          { id: 5, nome: 'Ana Costa', email: 'ana@email.com', tipo: 'aluno', ativo: true, ultimoLogin: '2024-02-13' }
        ];
        
        // Simular dados de conteúdos
        const conteudosMock = [
          { id: 1, titulo: 'Matemática Básica', tipo: 'simulado', autor: 'Prof. João Silva', dataCriacao: '2024-02-10', acessos: 125 },
          { id: 2, titulo: 'História do Brasil', tipo: 'plano_estudo', autor: 'Prof. Pedro Oliveira', dataCriacao: '2024-02-08', acessos: 89 },
          { id: 3, titulo: 'Química Orgânica', tipo: 'questoes', autor: 'Sistema', dataCriacao: '2024-02-05', acessos: 203 },
          { id: 4, titulo: 'Literatura Brasileira', tipo: 'simulado', autor: 'Prof. Maria Santos', dataCriacao: '2024-02-03', acessos: 156 }
        ];
        
        // Simular estatísticas
        const estatisticasMock = {
          totalUsuarios: 150,
          usuariosAtivos: 125,
          professores: 12,
          alunos: 138,
          conteudosPublicados: 45,
          acessosHoje: 2340,
          mediaTempoSessao: '25 min',
          taxasConversao: {
            registroLogin: '78%',
            completudeSimulados: '65%',
            engajamentoDiario: '42%'
          }
        };
        
        setUsuarios(usuariosMock);
        setConteudos(conteudosMock);
        setEstatisticas(estatisticasMock);
      } catch (err) {
        setError('Erro ao carregar dados administrativos: ' + err.message);
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [adminId]);

  const handleBloquearUsuario = async (userId) => {
    try {
      // Em uma implementação real, esta chamada seria para o backend
      // para bloquear/desbloquear o usuário
      // await fetch(`http://localhost:6001/api/admin/usuarios/${userId}/bloquear`, {
      //   method: 'PUT'
      // });
      
      // Simular bloqueio
      setUsuarios(usuarios.map(user => 
        user.id === userId ? {...user, ativo: !user.ativo} : user
      ));
    } catch (err) {
      console.error('Erro ao bloquear usuário:', err);
    }
  };

  const handleRemoverConteudo = async (conteudoId) => {
    try {
      // Em uma implementação real, esta chamada seria para o backend
      // para remover o conteúdo
      // await fetch(`http://localhost:6001/api/admin/conteudos/${conteudoId}`, {
      //   method: 'DELETE'
      // });
      
      // Simular remoção
      setConteudos(conteudos.filter(cont => cont.id !== conteudoId));
    } catch (err) {
      console.error('Erro ao remover conteúdo:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="painel-admin-loading">
        <div className="loading-spinner"></div>
        <p>Carregando dados administrativos...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="painel-admin-error">
        <p>Erro: {error}</p>
        <button onClick={() => window.location.reload()}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="painel-administrativo">
      <div className="painel-admin-header">
        <h2>Painel Administrativo</h2>
        <p>Gestão completa de usuários, conteúdos e estatísticas do sistema</p>
      </div>

      <div className="painel-admin-abas">
        <button 
          className={`aba ${abaAtiva === 'usuarios' ? 'ativa' : ''}`}
          onClick={() => setAbaAtiva('usuarios')}
        >
          Gestão de Usuários
        </button>
        <button 
          className={`aba ${abaAtiva === 'conteudos' ? 'ativa' : ''}`}
          onClick={() => setAbaAtiva('conteudos')}
        >
          Gestão de Conteúdos
        </button>
        <button 
          className={`aba ${abaAtiva === 'estatisticas' ? 'ativa' : ''}`}
          onClick={() => setAbaAtiva('estatisticas')}
        >
          Estatísticas
        </button>
        <button 
          className={`aba ${abaAtiva === 'configuracoes' ? 'ativa' : ''}`}
          onClick={() => setAbaAtiva('configuracoes')}
        >
          Configurações
        </button>
      </div>

      {abaAtiva === 'usuarios' && (
        <div className="painel-admin-conteudo">
          <div className="gestao-usuarios">
            <h3>Gestão de Usuários</h3>
            
            <div className="estatisticas-usuarios">
              <div className="card-estatistica">
                <h4>Total de Usuários</h4>
                <p className="valor-grande">{estatisticas?.totalUsuarios || 0}</p>
              </div>
              <div className="card-estatistica">
                <h4>Usuários Ativos</h4>
                <p className="valor-grande">{estatisticas?.usuariosAtivos || 0}</p>
              </div>
              <div className="card-estatistica">
                <h4>Professores</h4>
                <p className="valor-grande">{estatisticas?.professores || 0}</p>
              </div>
              <div className="card-estatistica">
                <h4>Alunos</h4>
                <p className="valor-grande">{estatisticas?.alunos || 0}</p>
              </div>
            </div>
            
            <div className="lista-usuarios">
              <div className="cabecalho-tabela">
                <div>Nome</div>
                <div>Email</div>
                <div>Tipo</div>
                <div>Status</div>
                <div>Último Login</div>
                <div>Ações</div>
              </div>
              
              {usuarios.map(usuario => (
                <div key={usuario.id} className="linha-usuario">
                  <div>{usuario.nome}</div>
                  <div>{usuario.email}</div>
                  <div>
                    <span className={`badge-tipo ${usuario.tipo}`}>
                      {usuario.tipo === 'aluno' ? 'Aluno' : 'Professor'}
                    </span>
                  </div>
                  <div>
                    <span className={`status ${usuario.ativo ? 'ativo' : 'inativo'}`}>
                      {usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <div>{usuario.ultimoLogin}</div>
                  <div className="acoes-usuario">
                    <button 
                      className={`btn-acao ${usuario.ativo ? 'btn-bloquear' : 'btn-desbloquear'}`}
                      onClick={() => handleBloquearUsuario(usuario.id)}
                    >
                      {usuario.ativo ? 'Bloquear' : 'Desbloquear'}
                    </button>
                    <button className="btn-acao btn-editar">Editar</button>
                    <button className="btn-acao btn-excluir">Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {abaAtiva === 'conteudos' && (
        <div className="painel-admin-conteudo">
          <div className="gestao-conteudos">
            <h3>Gestão de Conteúdos</h3>
            
            <div className="estatisticas-conteudos">
              <div className="card-estatistica">
                <h4>Conteúdos Publicados</h4>
                <p className="valor-grande">{estatisticas?.conteudosPublicados || 0}</p>
              </div>
              <div className="card-estatistica">
                <h4>Acessos Hoje</h4>
                <p className="valor-grande">{estatisticas?.acessosHoje || 0}</p>
              </div>
              <div className="card-estatistica">
                <h4>Média Tempo/Sessão</h4>
                <p className="valor-grande">{estatisticas?.mediaTempoSessao || '0 min'}</p>
              </div>
            </div>
            
            <div className="lista-conteudos">
              <div className="cabecalho-tabela">
                <div>Título</div>
                <div>Tipo</div>
                <div>Autor</div>
                <div>Data Criação</div>
                <div>Acessos</div>
                <div>Ações</div>
              </div>
              
              {conteudos.map(conteudo => (
                <div key={conteudo.id} className="linha-conteudo">
                  <div>{conteudo.titulo}</div>
                  <div>
                    <span className={`badge-tipo ${conteudo.tipo}`}>
                      {conteudo.tipo.replace('_', ' ')}
                    </span>
                  </div>
                  <div>{conteudo.autor}</div>
                  <div>{conteudo.dataCriacao}</div>
                  <div>{conteudo.acessos}</div>
                  <div className="acoes-conteudo">
                    <button className="btn-acao btn-editar">Editar</button>
                    <button 
                      className="btn-acao btn-excluir"
                      onClick={() => handleRemoverConteudo(conteudo.id)}
                    >
                      Excluir
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {abaAtiva === 'estatisticas' && (
        <div className="painel-admin-conteudo">
          <div className="gestao-estatisticas">
            <h3>Estatísticas do Sistema</h3>
            
            <div className="grid-estatisticas">
              <div className="card-estatistica-grande">
                <h4>Taxa de Registro/Login</h4>
                <p className="valor-medio">{estatisticas?.taxasConversao?.registroLogin || '0%'}</p>
                <div className="indicador-progresso positivo">+5% este mês</div>
              </div>
              
              <div className="card-estatistica-grande">
                <h4>Completude de Simulados</h4>
                <p className="valor-medio">{estatisticas?.taxasConversao?.completudeSimulados || '0%'}</p>
                <div className="indicador-progresso positivo">+3% este mês</div>
              </div>
              
              <div className="card-estatistica-grande">
                <h4>Engajamento Diário</h4>
                <p className="valor-medio">{estatisticas?.taxasConversao?.engajamentoDiario || '0%'}</p>
                <div className="indicador-progresso negativo">-2% este mês</div>
              </div>
            </div>
            
            <div className="graficos-estatisticas">
              <div className="grafico-placeholder">
                <h4>Gráfico de Usuários Ativos</h4>
                <p>Visualização de usuários ativos por período</p>
              </div>
              
              <div className="grafico-placeholder">
                <h4>Gráfico de Conteúdos Mais Acessados</h4>
                <p>Ranking de conteúdos por número de acessos</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {abaAtiva === 'configuracoes' && (
        <div className="painel-admin-conteudo">
          <div className="gestao-configuracoes">
            <h3>Configurações do Sistema</h3>
            
            <div className="secoes-configuracoes">
              <div className="secao-configuracao">
                <h4>Configurações Gerais</h4>
                <div className="formulario-configuracao">
                  <div className="campo-configuracao">
                    <label>Nome da Instituição:</label>
                    <input type="text" defaultValue="Escola Modelo" />
                  </div>
                  
                  <div className="campo-configuracao">
                    <label>Email Administrativo:</label>
                    <input type="email" defaultValue="admin@escolamodelo.com.br" />
                  </div>
                  
                  <div className="campo-configuracao">
                    <label>Domínio Permitido:</label>
                    <input type="text" defaultValue="@escolamodelo.com.br" />
                  </div>
                </div>
              </div>
              
              <div className="secao-configuracao">
                <h4>Configurações de Segurança</h4>
                <div className="formulario-configuracao">
                  <div className="campo-configuracao">
                    <label>Expiração de Sessão (minutos):</label>
                    <input type="number" defaultValue="60" />
                  </div>
                  
                  <div className="campo-configuracao">
                    <label>Tentativas de Login Permitidas:</label>
                    <input type="number" defaultValue="3" />
                  </div>
                  
                  <div className="campo-configuracao">
                    <label>Política de Senhas:</label>
                    <select>
                      <option>Padrão</option>
                      <option>Alta Segurança</option>
                      <option>Máxima Segurança</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="secao-configuracao">
                <h4>Configurações de Notificações</h4>
                <div className="formulario-configuracao">
                  <div className="campo-configuracao checkbox-configuracao">
                    <label>
                      <input type="checkbox" defaultChecked /> 
                      Notificações por Email
                    </label>
                  </div>
                  
                  <div className="campo-configuracao checkbox-configuracao">
                    <label>
                      <input type="checkbox" defaultChecked /> 
                      Notificações Push
                    </label>
                  </div>
                  
                  <div className="campo-configuracao checkbox-configuracao">
                    <label>
                      <input type="checkbox" /> 
                      Notificações SMS
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="acoes-configuracoes">
              <button className="btn-salvar">Salvar Configurações</button>
              <button className="btn-resetar">Resetar para Padrão</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PainelAdministrativo;