import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import LoginPage from './pages/LoginPage';
import OperatorDashboard from './pages/OperatorDashboard';
import PlayerDashboard from './pages/PlayerDashboard';

function App() {
  console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('Socket URL:', import.meta.env.VITE_SOCKET_URL);

  return (
    <GameProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          {/* 🎨 Colorful login screen at root */}
          <Route path="/" element={<LoginPage />} />

          {/* 🧭 Dashboards */}
          <Route path="/operator" element={<OperatorDashboard />} />
          <Route path="/player" element={<PlayerDashboard />} />
          
        </Routes>
      </Router>
    </GameProvider>
  );
}

export default App;
