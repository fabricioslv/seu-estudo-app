// src/components/PrivateRoute.js
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Se ainda estiver carregando o estado de autenticação, mostrar um loader
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Carregando...</p>
      </div>
    );
  }

  // Se o usuário não estiver autenticado, redirecionar para a página de login
  if (!user) {
    return <Navigate to="/entrar" state={{ from: location }} replace />;
  }

  // Se o usuário estiver autenticado, renderizar os filhos
  return children;
};

export default PrivateRoute;