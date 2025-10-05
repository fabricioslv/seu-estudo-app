import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import './styles/main.css';

// Componente de loading para mostrar enquanto as páginas carregam
const LoadingSpinner = () => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    fontSize: '18px',
    color: '#666'
  }}>
    <div>Carregando...</div>
  </div>
);

// Lazy loading das páginas para melhorar performance
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SimuladosPage = lazy(() => import('./pages/SimuladosPage'));
const CreateSimuladoPage = lazy(() => import('./pages/CreateSimuladoPage'));
const ResponderSimuladoPage = lazy(() => import('./pages/ResponderSimuladoPage'));
const ResultadosSimuladoPage = lazy(() => import('./pages/ResultadosSimuladoPage'));
const EstudarPage = lazy(() => import('./pages/EstudarPage'));
const TestsPage = lazy(() => import('./pages/TestsPage'));
const LivrosDidaticosPage = lazy(() => import('./pages/LivrosDidaticosPage'));
const AprendendoPage = lazy(() => import('./pages/AprendendoPage'));
const GamificacaoAprendendo = lazy(() => import('./pages/GamificacaoAprendendo'));
const ProfessorDashboardPage = lazy(() => import('./pages/ProfessorDashboardPage'));
const ProfessorCreateSimuladoPage = lazy(() => import('./pages/ProfessorCreateSimuladoPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const MensagensPage = lazy(() => import('./pages/MensagensPage'));
const MinhasNotasPage = lazy(() => import('./pages/MinhasNotasPage'));
const GerenciarAvaliacoesPage = lazy(() => import('./pages/professor/GerenciarAvaliacoesPage'));
const LancarNotasPage = lazy(() => import('./pages/professor/LancarNotasPage'));
const EncontrarTutoresPage = lazy(() => import('./pages/EncontrarTutoresPage'));
const TornarTutorPage = lazy(() => import('./pages/TornarTutorPage'));
const MinhasSessoesPage = lazy(() => import('./pages/MinhasSessoesPage'));

// Adicionando logs de diagnóstico para identificar problemas de inicialização
console.log('[DEBUG] App.js sendo inicializado...');
console.log('[DEBUG] Router sendo inicializado no App.js');
console.log('[DEBUG] Ambiente atual:', process.env.NODE_ENV);
console.log('[DEBUG] Variáveis de ambiente carregadas');

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <Navbar />
        <main className="main-content">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/entrar" element={<LoginPage />} />
              <Route path="/registrar" element={<RegisterPage />} />
              <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
              <Route path="/perfil" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
              <Route path="/simulados" element={<PrivateRoute><SimuladosPage /></PrivateRoute>} />
              <Route path="/simulados/criar" element={<PrivateRoute><CreateSimuladoPage /></PrivateRoute>} />
              <Route path="/simulados/:id/responder" element={<PrivateRoute><ResponderSimuladoPage /></PrivateRoute>} />
              <Route path="/simulados/:id/resultados" element={<PrivateRoute><ResultadosSimuladoPage /></PrivateRoute>} />
              <Route path="/estudar" element={<PrivateRoute><EstudarPage /></PrivateRoute>} />
              <Route path="/testes" element={<PrivateRoute><TestsPage /></PrivateRoute>} />
              <Route path="/livros" element={<PrivateRoute><LivrosDidaticosPage /></PrivateRoute>} />
              <Route path="/aprendendo" element={<PrivateRoute><AprendendoPage /></PrivateRoute>} />
              <Route path="/gamificacao" element={<PrivateRoute><GamificacaoAprendendo /></PrivateRoute>} />
              <Route path="/notificacoes" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
              <Route path="/mensagens" element={<PrivateRoute><MensagensPage /></PrivateRoute>} />
              <Route path="/minhas-notas" element={<PrivateRoute><MinhasNotasPage /></PrivateRoute>} />
              <Route path="/tutoria/encontrar" element={<PrivateRoute><EncontrarTutoresPage /></PrivateRoute>} />
              <Route path="/tutoria/tornar-tutor" element={<PrivateRoute><TornarTutorPage /></PrivateRoute>} />
              <Route path="/tutoria/sessoes" element={<PrivateRoute><MinhasSessoesPage /></PrivateRoute>} />
              <Route path="/professor/dashboard" element={<PrivateRoute><ProfessorDashboardPage /></PrivateRoute>} />
              <Route path="/professor/avaliacoes" element={<PrivateRoute><GerenciarAvaliacoesPage /></PrivateRoute>} />
              <Route path="/professor/avaliacoes/:id/lancar-notas" element={<PrivateRoute><LancarNotasPage /></PrivateRoute>} />
              <Route path="/professor/simulados/criar" element={<PrivateRoute><ProfessorCreateSimuladoPage /></PrivateRoute>} />
            </Routes>
          </Suspense>
        </main>`n        <SpeedInsights />
        <Footer />
      </div>
    </AuthProvider>
  );
}

export default App;
