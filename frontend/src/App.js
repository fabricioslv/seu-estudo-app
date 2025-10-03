import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import SimuladosPage from './pages/SimuladosPage';
import CreateSimuladoPage from './pages/CreateSimuladoPage';
import ResponderSimuladoPage from './pages/ResponderSimuladoPage';
import ResultadosSimuladoPage from './pages/ResultadosSimuladoPage';
import EstudarPage from './pages/EstudarPage';
import TestsPage from './pages/TestsPage';
import LivrosDidaticosPage from './pages/LivrosDidaticosPage';
import AprendendoPage from './pages/AprendendoPage';
import GamificacaoAprendendo from './pages/GamificacaoAprendendo';
import ProfessorDashboardPage from './pages/ProfessorDashboardPage';
import ProfessorCreateSimuladoPage from './pages/ProfessorCreateSimuladoPage';
import NotificationsPage from './pages/NotificationsPage';
import MensagensPage from './pages/MensagensPage';
import MinhasNotasPage from './pages/MinhasNotasPage';
import GerenciarAvaliacoesPage from './pages/professor/GerenciarAvaliacoesPage';
import LancarNotasPage from './pages/professor/LancarNotasPage';
import EncontrarTutoresPage from './pages/EncontrarTutoresPage';
import TornarTutorPage from './pages/TornarTutorPage';
import MinhasSessoesPage from './pages/MinhasSessoesPage';
import './styles/main.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Navbar />
          <main className="main-content">
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
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;