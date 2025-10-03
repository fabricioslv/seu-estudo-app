// context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

// 1. Cria o Contexto
const AuthContext = createContext(null);

// Exportar o contexto para uso direto nos componentes
export { AuthContext };

// 2. Cria o Provedor do Contexto
export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true); // Para verificar o token inicial
// Adicionando logs de diagnóstico para identificar problemas de contexto
console.log('[DEBUG] AuthContext sendo inicializado...');
console.log('[DEBUG] Estado inicial - loading:', true, 'isAuthenticated:', false);

  useEffect(() => {
    // Ao carregar o app, verifica se já existe um token no localStorage
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (newToken) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setIsAuthenticated(false);
  };

  // O valor que será compartilhado com os componentes filhos
  const value = {
    token,
    isAuthenticated,
    loading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// 3. Hook customizado para facilitar o uso do contexto
export const useAuth = () => {
  return useContext(AuthContext);
};
