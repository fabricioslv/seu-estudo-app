// src/components/Navbar.js
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './notifications/NotificationBell';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const handleLogout = () => {
    logout();
  };

  // Não mostrar navbar nas páginas de login e registro
  if (location.pathname === '/entrar' || location.pathname === '/registrar') {
    return null;
  }

  return (
    <nav className="navbar" role="navigation" aria-label="Navegação principal">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand" aria-label="Página inicial">
          <h1>Seu-Estudo</h1>
        </Link>
        
        <ul className="navbar-nav">
          {user ? (
            <>
              <li className="nav-item">
                <Link to="/dashboard" className="nav-link">Dashboard</Link>
              </li>
              <li className="nav-item">
                <Link to="/simulados" className="nav-link">Simulados</Link>
              </li>
              <li className="nav-item">
                <Link to="/estudar" className="nav-link">Estudar</Link>
              </li>
              <li className="nav-item">
                <Link to="/testes" className="nav-link">Testes</Link>
              </li>
              <li className="nav-item">
                <Link to="/livros" className="nav-link">Livros</Link>
              </li>
              <li className="nav-item">
                <Link to="/aprendendo" className="nav-link">Aprendendo</Link>
              </li>
              <li className="nav-item">
                <Link to="/gamificacao" className="nav-link">Gamificação</Link>
              </li>
              <li className="nav-item">
                <Link to="/mensagens" className="nav-link">Mensagens</Link>
              </li>
              <li className="nav-item dropdown">
                <button className="nav-link dropdown-toggle" aria-haspopup="true" aria-expanded="false">
                  Tutoria
                </button>
                <ul className="dropdown-menu" role="menu">
                  <li>
                    <Link to="/tutoria/encontrar" className="dropdown-item">Encontrar Tutores</Link>
                  </li>
                  <li>
                    <Link to="/tutoria/sessoes" className="dropdown-item">Minhas Sessões</Link>
                  </li>
                </ul>
              </li>
              {user.tipo_usuario === 'professor' && (
                <li className="nav-item">
                  <Link to="/professor/dashboard" className="nav-link">Professor</Link>
                </li>
              )}
                <li className="nav-item">
                  <NotificationBell />
                </li>
              <li className="nav-item dropdown">
                <button className="nav-link dropdown-toggle" aria-haspopup="true" aria-expanded="false">
                  {user.nome}
                </button>
                <ul className="dropdown-menu" role="menu">
                  <li>
                    <Link to="/perfil" className="dropdown-item">Meu Perfil</Link>
                  </li>
                  <li>
                    <Link to="/minhas-notas" className="dropdown-item">Minhas Notas</Link>
                  </li>
                  <li>
                    <Link to="/tutoria/tornar-tutor" className="dropdown-item">Torne-se um Tutor</Link>
                  </li>
                  <li>
                    <button onClick={handleLogout} className="dropdown-item">Sair</button>
                  </li>
                </ul>
              </li>
            </>
          ) : (
            <>
              <li className="nav-item">
                <Link to="/entrar" className="nav-link">Entrar</Link>
              </li>
              <li className="nav-item">
                <Link to="/registrar" className="nav-link btn btn-primary">Registrar</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;